from __future__ import annotations

from datetime import UTC, date, datetime

from bomfim.extensions import db
from bomfim.models import (
    AuditLog,
    Document,
    EmailTemplate,
    Integration,
    Organization,
    Registration,
    RegistrationIntegration,
    RegistrationStage,
    SignatureEnvelope,
    SyncEvent,
    Unit,
    User,
)
from bomfim.security import hash_password

DEFAULT_PASSWORD = "123456789"

STAGES = [
    (0, "Caixa de entrada", "Novos cadastros aguardando triagem inicial."),
    (1, "Cadastro em andamento", "Coleta de documentos e validações em curso."),
    (2, "Aguardando assinatura", "Contrato enviado para assinatura digital."),
    (3, "Cadastro finalizado", "Cadastro aprovado e pronto para operação."),
    (4, "Cadastros declinados", "Cadastros encerrados ou recusados."),
]

UNITS = [
    ("Salvador", "SSA", "Salvador, BA", "Renata Melo"),
    ("Feira de Santana", "FSA", "Feira de Santana, BA", "Mariana Costa"),
    ("Aracaju", "AJU", "Aracaju, SE", "Lucas Almeida"),
]

USERS = [
    ("Renata Melo", "renata@bomfim.com.br", "admin", "Salvador"),
    ("Mariana Costa", "mariana@bomfim.com.br", "manager", "Salvador"),
    ("Lucas Almeida", "lucas@bomfim.com.br", "operator", "Aracaju"),
    ("Ana Ferreira", "ana@bomfim.com.br", "promoter", "Feira de Santana"),
]

NAMES = [
    "Flatter Cosméticos",
    "Avyquímica do Brasil Ltda",
    "Tropical Bebidas",
    "Nevvia Motos",
    "Casali Empreendimentos",
    "GNC Comércio de Veículos",
    "Adiltex Indústria e Comércio",
    "Serra Verde Alimentos",
    "Nordeste Distribuidora",
    "Lumiê Cosméticos",
    "Alvorada Embalagens",
    "Via Norte Autopeças",
    "Solare Equipamentos",
    "Vitta Produtos Naturais",
    "Costa Sul Têxtil",
    "Pontal Comércio de Materiais",
    "Brisa Farma",
    "Araponga Indústria",
]

STAGE_INDICES = [0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4]
PROMOTERS = ["Ana Ferreira", "Rafael Martins", "Camila Santos"]
OWNERS = ["Mariana Costa", "Lucas Almeida", "Renata Melo"]
TABLES = ["Capital Express", "Interior Premium", "Regional Standard"]
CITIES = ["Salvador, BA", "Feira de Santana, BA", "Aracaju, SE"]
UNIT_NAMES = ["Salvador", "Feira de Santana", "Aracaju"]

INTEGRATIONS = ["Moskit", "Receita Federal", "Assinatura Digital", "Documentos"]

EMAIL_TEMPLATES = [
    ("Boas-vindas à Bomfim", "Entrada no funil", date(2026, 9, 29)),
    ("Documentação pendente", "Pendência de documentos", date(2026, 9, 29)),
    ("Lembrete de assinatura", "48 horas após envio", date(2026, 9, 29)),
    ("Cadastro aprovado", "Cadastro finalizado", date(2026, 9, 29)),
]

SIGNATURE_STATUSES = ["Aguardando", "Visualizado", "Parcialmente assinado", "Concluído", "Expirado", "Cancelado"]


def run_seed() -> None:
    org = Organization.query.first()
    if org is None:
        org = Organization(name="Bomfim")
        db.session.add(org)
        db.session.flush()

    unit_by_name: dict[str, Unit] = {}
    for name, code, locality, responsible in UNITS:
        unit = Unit.query.filter_by(name=name).first()
        if unit is None:
            unit = Unit(
                organization_id=org.id,
                name=name,
                code=code,
                locality=locality,
                responsible_name=responsible,
                status="active",
            )
            db.session.add(unit)
        else:
            unit.code = code
            unit.locality = locality
            unit.responsible_name = responsible
        unit_by_name[name] = unit
    db.session.flush()

    stage_by_order: dict[int, RegistrationStage] = {}
    for sort_order, label, description in STAGES:
        stage = RegistrationStage.query.filter_by(sort_order=sort_order).first()
        if stage is None:
            stage = RegistrationStage(sort_order=sort_order, label=label, description=description)
            db.session.add(stage)
        else:
            stage.label = label
            stage.description = description
        stage_by_order[sort_order] = stage
    db.session.flush()

    pwd_hash = hash_password(DEFAULT_PASSWORD)
    user_by_email: dict[str, User] = {}
    user_by_name: dict[str, User] = {}
    for name, email, role, unit_name in USERS:
        user = User.query.filter_by(email=email).first()
        unit = unit_by_name[unit_name]
        if user is None:
            user = User(
                organization_id=org.id,
                unit_id=unit.id,
                name=name,
                email=email,
                role=role,
                password_hash=pwd_hash,
                status="active",
            )
            db.session.add(user)
        else:
            user.name = name
            user.role = role
            user.unit_id = unit.id
            user.password_hash = pwd_hash
            user.status = "active"
        user_by_email[email] = user
        user_by_name[name] = user
    db.session.flush()

    from bomfim.cnpj import cnpj_for_demo_index

    for i, company in enumerate(NAMES):
        cnpj = cnpj_for_demo_index(i)
        old_cnpj = f"{str(12 + i).zfill(2)}.345.678/0001-{str(90 - i)}"
        reg = Registration.query.filter((Registration.name == company) | (Registration.cnpj.in_([cnpj, old_cnpj]))).first()
        promoter_name = PROMOTERS[i % 3]
        owner_name = OWNERS[i % 3]
        promoter = user_by_name.get(promoter_name) or user_by_name.get("Ana Ferreira")
        owner = user_by_name.get(owner_name) or user_by_name.get("Mariana Costa")
        unit = unit_by_name[UNIT_NAMES[i % 3]]
        stage = stage_by_order[STAGE_INDICES[i]]
        updated = date(2026, 9, 30 - (i % 8))
        if reg is None:
            reg = Registration(
                organization_id=org.id,
                name=company,
                cnpj=cnpj,
                price_table=TABLES[i % 3],
                stage_id=stage.id,
                city=CITIES[i % 3],
                unit_id=unit.id,
                promoter_id=promoter.id if promoter else None,
                owner_id=owner.id if owner else None,
                documents_count=i % 4 + 1,
                comments_count=i % 3,
                updated_at=updated,
            )
            db.session.add(reg)
        else:
            reg.name = company
            reg.cnpj = cnpj
            reg.price_table = TABLES[i % 3]
            reg.stage_id = stage.id
            reg.city = CITIES[i % 3]
            reg.unit_id = unit.id
            reg.promoter_id = promoter.id if promoter else None
            reg.owner_id = owner.id if owner else None
            reg.documents_count = i % 4 + 1
            reg.comments_count = i % 3
            reg.updated_at = updated
    db.session.flush()

    for name in INTEGRATIONS:
        item = Integration.query.filter_by(name=name).first()
        if item is None:
            item = Integration(name=name, active=True, last_sync_at=datetime(2026, 9, 30, 9, 0, tzinfo=UTC))
            db.session.add(item)
        else:
            item.active = True
            if item.last_sync_at is None:
                item.last_sync_at = datetime(2026, 9, 30, 9, 0, tzinfo=UTC)
    db.session.flush()

    integrations = {i.name: i for i in Integration.query.all()}
    for reg in Registration.query.all():
        for int_name in INTEGRATIONS:
            link = RegistrationIntegration.query.filter_by(
                registration_id=reg.id,
                integration_id=integrations[int_name].id,
            ).first()
            if link is None:
                db.session.add(
                    RegistrationIntegration(
                        registration_id=reg.id,
                        integration_id=integrations[int_name].id,
                        status="Sincronizado",
                    )
                )

    for name, trigger, reviewed in EMAIL_TEMPLATES:
        row = EmailTemplate.query.filter_by(name=name).first()
        if row is None:
            db.session.add(EmailTemplate(name=name, trigger=trigger, last_reviewed_at=reviewed))
        else:
            row.trigger = trigger
            row.last_reviewed_at = reviewed

    if AuditLog.query.count() == 0:
        db.session.add_all(
            [
                AuditLog(
                    occurred_at=datetime(2026, 9, 30, 9, 42, tzinfo=UTC),
                    user_id=user_by_name["Renata Melo"].id,
                    event="Atualização cadastral",
                    resource="Flatter Cosméticos",
                    result="Concluído",
                ),
                AuditLog(
                    occurred_at=datetime(2026, 9, 30, 9, 38, tzinfo=UTC),
                    user_id=user_by_name["Mariana Costa"].id,
                    event="Validação de documentos",
                    resource="Tropical Bebidas",
                    result="Concluído",
                ),
                AuditLog(
                    occurred_at=datetime(2026, 9, 30, 9, 30, tzinfo=UTC),
                    user_id=user_by_name["Lucas Almeida"].id,
                    event="Sincronização simulada",
                    resource="Moskit",
                    result="Concluído",
                ),
            ]
        )

    if Document.query.count() == 0:
        docs: list[Document] = [
            Document(
                filename="upload-preview.pdf",
                doc_type="Prévia local",
                uploaded_by_name="Renata Melo",
                uploaded_at=date(2026, 9, 30),
                status="Aguardando validação",
            )
        ]
        for reg in Registration.query.limit(12).all():
            docs.append(
                Document(
                    registration_id=reg.id,
                    filename=f"Contrato-{reg.id}.pdf",
                    doc_type="PDF",
                    uploaded_by_name=reg.owner.name if reg.owner else "Renata Melo",
                    uploaded_at=reg.updated_at,
                    status="Aprovado" if reg.stage.sort_order == 3 else "Em análise",
                )
            )
        db.session.add_all(docs)

    if SignatureEnvelope.query.count() == 0:
        sigs = []
        for i, reg in enumerate(Registration.query.limit(12).all()):
            sigs.append(
                SignatureEnvelope(
                    registration_id=reg.id,
                    document_title="Contrato de transporte",
                    sent_at=reg.updated_at,
                    status=SIGNATURE_STATUSES[i % len(SIGNATURE_STATUSES)],
                    last_updated_at=reg.updated_at,
                )
            )
        db.session.add_all(sigs)

    if SyncEvent.query.count() == 0:
        events = []
        for reg in Registration.query.all():
            events.append(
                SyncEvent(
                    registration_id=reg.id,
                    operation="Atualização de contato",
                    occurred_at=datetime(2026, 9, 30, 10, 0, tzinfo=UTC),
                    status="Sincronizado",
                )
            )
        db.session.add_all(events)

    db.session.commit()
