"""Import client registrations from Bomfim operational CSV export."""
from __future__ import annotations

import csv
import re
from datetime import date
from pathlib import Path

from bomfim.default_owner import ensure_default_owner_user
from bomfim.extensions import db
from bomfim.models import Organization, Registration, RegistrationStage, Unit, User
from bomfim.security import hash_password

STAGES = [
    (0, "Caixa de entrada", "Novos cadastros aguardando triagem inicial."),
    (1, "Cadastro em andamento", "Coleta de documentos e validações em curso."),
    (2, "Aguardando assinatura", "Contrato enviado para assinatura digital."),
    (3, "Cadastro finalizado", "Cadastro aprovado e pronto para operação."),
    (4, "Cadastros declinados", "Cadastros encerrados ou recusados."),
]

UNIT_BY_CODE: dict[str, tuple[str, str]] = {
    "REC": ("Recife", "Recife, PE"),
    "FOR": ("Fortaleza", "Fortaleza, CE"),
    "FST": ("Feira de Santana", "Feira de Santana, BA"),
    "SSA": ("Salvador", "Salvador, BA"),
    "MCZ": ("Maceió", "Maceió, AL"),
    "AJU": ("Aracaju", "Aracaju, SE"),
    "JPA": ("João Pessoa", "João Pessoa, PB"),
    "NAT": ("Natal", "Natal, RN"),
}

DEFAULT_STAGE_ORDER = 3
DEFAULT_IMPORT_PASSWORD = "123456789"


def _normalize_doc(value: str) -> str:
    digits = re.sub(r"\D", "", value or "")
    if len(digits) == 14:
        return f"{digits[:2]}.{digits[2:5]}.{digits[5:8]}/{digits[8:12]}-{digits[12:]}"
    if len(digits) == 11:
        return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"
    return (value or "").strip()


def _parse_date_br(value: str) -> date:
    value = (value or "").strip()
    day, month, year = value.split("/")
    return date(int(year), int(month), int(day))


def _clean_text(value: str) -> str:
    return " ".join((value or "").split())


def ensure_reference_data() -> Organization:
    org = Organization.query.first()
    if org is None:
        org = Organization(name="Bomfim")
        db.session.add(org)
        db.session.flush()

    for sort_order, label, description in STAGES:
        stage = RegistrationStage.query.filter_by(sort_order=sort_order).first()
        if stage is None:
            db.session.add(
                RegistrationStage(sort_order=sort_order, label=label, description=description)
            )
        else:
            stage.label = label
            stage.description = description
    db.session.flush()

    for code, (name, locality) in UNIT_BY_CODE.items():
        unit = Unit.query.filter_by(code=code).first()
        if unit is None:
            db.session.add(
                Unit(
                    organization_id=org.id,
                    name=name,
                    code=code,
                    locality=locality,
                    responsible_name="—",
                    status="active",
                )
            )
        else:
            unit.name = name
            unit.locality = locality
            unit.organization_id = org.id
            unit.status = "active"
    db.session.flush()

    db.session.flush()
    return org


def _vendedor_user(org_id: int, vendedor: str, cache: dict[str, User]) -> User | None:
    """Usuário derivado da coluna VENDEDOR do CSV (promotor / responsável)."""
    key = _clean_text(vendedor).lower()
    if not key:
        return None
    if key in cache:
        return cache[key]
    email = f"{key}@bomfim.local"
    user = User.query.filter_by(email=email).first()
    if user is None:
        user = User(
            organization_id=org_id,
            name=key.capitalize(),
            email=email,
            role="promoter",
            password_hash=hash_password(DEFAULT_IMPORT_PASSWORD),
            status="active",
        )
        db.session.add(user)
        db.session.flush()
    cache[key] = user
    return user


def _owner_id_from_csv_row(
    org_id: int,
    row: dict[str, str],
    cache: dict[str, User],
    default_owner: User,
) -> int:
    vendedor = _vendedor_user(org_id, row.get("VENDEDOR", ""), cache)
    return vendedor.id if vendedor else default_owner.id


def import_clientes_csv(path: Path, *, replace_existing: bool = False) -> dict[str, int]:
    org = ensure_reference_data()
    stage = RegistrationStage.query.filter_by(sort_order=DEFAULT_STAGE_ORDER).first()
    if stage is None:
        raise RuntimeError("Estágio padrão não encontrado; rode ensure_reference_data.")

    if replace_existing:
        Registration.query.filter_by(organization_id=org.id).delete(synchronize_session=False)
        db.session.flush()

    default_owner = ensure_default_owner_user(org)
    unit_by_code = {u.code: u for u in Unit.query.all()}
    promoter_cache: dict[str, User] = {}
    created = updated = skipped = 0

    with path.open(encoding="latin-1", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=";")
        for row in reader:
            code = _clean_text(row.get("UNID RESP", ""))
            unit = unit_by_code.get(code)
            if unit is None:
                name = code or "Unidade"
                unit = Unit(
                    organization_id=org.id,
                    name=name,
                    code=code or name[:16],
                    locality=name,
                    responsible_name="—",
                    status="active",
                )
                db.session.add(unit)
                db.session.flush()
                unit_by_code[unit.code] = unit

            doc = _normalize_doc(row.get("CNPJ/CPF", ""))
            if not doc:
                skipped += 1
                continue

            city = _clean_text(row.get("CIDADE", ""))
            uf = _clean_text(row.get("UF", ""))
            city_label = f"{city}, {uf}" if uf else city

            reg = Registration.query.filter_by(cnpj=doc).first()
            vendedor = _vendedor_user(org.id, row.get("VENDEDOR", ""), promoter_cache)
            owner_id = _owner_id_from_csv_row(org.id, row, promoter_cache, default_owner)
            promoter_id = vendedor.id if vendedor else default_owner.id
            payload = dict(
                organization_id=org.id,
                name=_clean_text(row.get("CLIENTE", "")) or doc,
                contact_email=_clean_text(row.get("EMAIL", "")) or None,
                price_table=_clean_text(row.get("TIPO COBRANCA", "")) or "BANCO",
                stage_id=stage.id,
                city=city_label or unit.locality,
                unit_id=unit.id,
                promoter_id=promoter_id,
                owner_id=owner_id,
                updated_at=_parse_date_br(row.get("ULT MOVIMENTO", "")),
            )

            if reg is None:
                db.session.add(Registration(cnpj=doc, **payload))
                created += 1
            else:
                for key, value in payload.items():
                    setattr(reg, key, value)
                updated += 1

    db.session.commit()
    return {"created": created, "updated": updated, "skipped": skipped}


def sync_responsaveis_from_csv(path: Path) -> dict[str, int]:
    """Atualiza owner_id (Responsável) a partir da coluna VENDEDOR do CSV."""
    org = Organization.query.first()
    if org is None:
        raise RuntimeError("Organização não encontrada.")

    default_owner = ensure_default_owner_user(org)
    vendedor_cache: dict[str, User] = {}
    updated = missing = skipped = 0

    with path.open(encoding="latin-1", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=";")
        for row in reader:
            doc = _normalize_doc(row.get("CNPJ/CPF", ""))
            if not doc:
                skipped += 1
                continue
            reg = Registration.query.filter_by(cnpj=doc).first()
            if reg is None:
                missing += 1
                continue
            vendedor = _vendedor_user(org.id, row.get("VENDEDOR", ""), vendedor_cache)
            reg.owner_id = _owner_id_from_csv_row(org.id, row, vendedor_cache, default_owner)
            reg.promoter_id = vendedor.id if vendedor else default_owner.id
            updated += 1

    db.session.commit()
    return {"updated": updated, "missing": missing, "skipped": skipped}
