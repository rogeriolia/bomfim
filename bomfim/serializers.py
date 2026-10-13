from __future__ import annotations

from bomfim.default_owner import DEFAULT_OWNER_NAME
from bomfim.models import (
    DOWNLOAD_STATUS_OK,
    AuditLog,
    Contato,
    Document,
    EmailTemplate,
    Integration,
    Organization,
    Registration,
    RegistrationAnexo,
    SignatureEnvelope,
    SyncEvent,
    Unit,
    User,
)
from bomfim.storage_paths import anexo_absolute_path


def _anexo_has_local_file(anexo) -> bool:
    """UI e contadores: ok + local_path (rota /file confirma arquivo no disco)."""
    return bool(anexo.download_status == DOWNLOAD_STATUS_OK and anexo.local_path)


def _anexo_file_on_disk(anexo) -> bool:
    return bool(
        anexo.download_status == DOWNLOAD_STATUS_OK
        and anexo.local_path
        and anexo_absolute_path(anexo.local_path).is_file()
    )


def _anexo_to_json(registration_id: int, anexo) -> dict:
    has_file = _anexo_has_local_file(anexo)
    return {
        "id": anexo.id,
        "filename": anexo.filename or "",
        "download_status": anexo.download_status,
        "has_local_file": has_file,
        "file_url": (
            f"/api/registrations/{registration_id}/anexos/{anexo.id}/file" if has_file else None
        ),
    }


def user_to_json(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "unit": user.unit.name if user.unit else None,
        "status": user.status,
        "last_access_at": user.last_access_at.isoformat() if user.last_access_at else None,
        "photo": user.photo,
    }


def _anexo_counts(reg: Registration) -> tuple[int, int]:
    """Contagem por cadastro; anexos é lazy='dynamic' (AppenderQuery — sem len())."""
    coll = reg.anexos
    if hasattr(coll, "count"):
        total = coll.count()
        available = coll.filter(
            RegistrationAnexo.download_status == DOWNLOAD_STATUS_OK,
            RegistrationAnexo.local_path.isnot(None),
            RegistrationAnexo.local_path != "",
        ).count()
        return total, available
    total = len(coll)
    available = sum(1 for a in coll if _anexo_has_local_file(a))
    return total, available


def _anexo_list(reg: Registration) -> list[RegistrationAnexo]:
    coll = reg.anexos
    return list(coll.all() if hasattr(coll, "all") else coll)


def _contato_list(reg: Registration) -> list[Contato]:
    coll = reg.contatos
    return list(coll.all() if hasattr(coll, "all") else coll)


def registration_to_json(
    reg: Registration,
    *,
    for_list: bool = False,
    anexo_counts: tuple[int, int] | None = None,
) -> dict:
    data: dict = {
        "id": str(reg.id),
        "name": reg.name,
        "cnpj": reg.cnpj,
        "promoter": reg.promoter.name if reg.promoter else DEFAULT_OWNER_NAME,
        "owner": reg.owner.name if reg.owner else "",
        "table": reg.price_table or "",
        "tipo_cobranca": reg.price_table or "",
        "usuario_ssw": reg.usuario_ssw or "",
        "contact_email": reg.contact_email or "",
        "postal_code": reg.postal_code or "",
        "contact_name": reg.contact_name or "",
        "stage": reg.stage.sort_order if reg.stage else None,
        "city": reg.city,
        "unit": reg.unit.name if reg.unit else "",
        "updated": reg.updated_at.isoformat(),
        "documents": reg.documents_count,
        "comments": reg.comments_count,
        "razao_social": reg.razao_social or "",
        "nome_fantasia": reg.nome_fantasia or "",
        "endereco": reg.endereco or "",
        "numero": reg.numero or "",
        "bairro": reg.bairro or "",
        "estado": reg.estado or "",
        "moskit_id": reg.moskit_id or "",
        "pipefy_codigo": reg.pipefy_codigo or "",
        "tipo_oportunidade": reg.tipo_oportunidade.descricao if reg.tipo_oportunidade else "",
        "tipo_cliente": reg.tipo_cliente.descricao if reg.tipo_cliente else "",
        "tipo_embalagem": reg.tipo_embalagem.descricao if reg.tipo_embalagem else "",
        "potencial_faturamento": reg.potencial_faturamento_mes.descricao if reg.potencial_faturamento_mes else "",
    }
    if for_list:
        total, available = anexo_counts if anexo_counts is not None else _anexo_counts(reg)
        data["anexos"] = []
        data["anexos_count"] = total
        data["anexos_available_count"] = available
        data["contatos"] = []
        return data
    data["anexos"] = [_anexo_to_json(reg.id, a) for a in sorted(_anexo_list(reg), key=lambda x: x.ordem)]
    data["contatos"] = [
        {
            "tipo": c.tipo_contato,
            "nome": c.nome,
            "email": c.email or "",
            "telefone1": c.telefone1 or "",
            "telefone2": c.telefone2 or "",
            "email_ocorrencias": c.email_ocorrencias or "",
        }
        for c in _contato_list(reg)
    ]
    return data


def unit_to_json(unit: Unit) -> dict:
    return {
        "id": unit.id,
        "name": unit.name,
        "code": unit.code,
        "locality": unit.locality,
        "responsible": unit.responsible_name,
        "status": unit.status,
    }


def integration_to_json(item: Integration) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "active": item.active,
        "last_sync_at": item.last_sync_at.isoformat() if item.last_sync_at else None,
    }


def audit_log_to_json(row: AuditLog) -> dict:
    return {
        "id": row.id,
        "occurred_at": row.occurred_at.isoformat(),
        "user": row.user.name if row.user else "",
        "event": row.event,
        "resource": row.resource,
        "result": row.result,
    }


def email_template_to_json(row: EmailTemplate) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "trigger": row.trigger,
        "last_reviewed_at": row.last_reviewed_at.isoformat(),
    }


def document_to_json(row: Document) -> dict:
    return {
        "id": row.id,
        "filename": row.filename,
        "company": row.registration.name if row.registration else "",
        "doc_type": row.doc_type,
        "uploaded_by": row.uploaded_by_name,
        "uploaded_at": row.uploaded_at.isoformat(),
        "status": row.status,
    }


def signature_to_json(row: SignatureEnvelope) -> dict:
    reg = row.registration
    return {
        "id": row.id,
        "company": reg.name if reg else "",
        "document": row.document_title,
        "sent_at": row.sent_at.isoformat(),
        "signatories": reg.owner.name if reg and reg.owner else "",
        "status": row.status,
        "last_updated_at": row.last_updated_at.isoformat(),
    }


def sync_event_to_json(row: SyncEvent) -> dict:
    return {
        "id": row.id,
        "company": row.registration.name if row.registration else "",
        "operation": row.operation,
        "occurred_at": row.occurred_at.isoformat(),
        "status": row.status,
    }


def settings_to_json(org: Organization) -> dict:
    return {
        "organization_name": org.name,
        "timezone": org.timezone,
        "show_operational_warnings": org.show_operational_warnings,
        "show_activity_summary": org.show_activity_summary,
    }
