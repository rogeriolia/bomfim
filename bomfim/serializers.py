from __future__ import annotations

from bomfim.default_owner import DEFAULT_OWNER_NAME
from bomfim.models import (
    AuditLog,
    Document,
    EmailTemplate,
    Integration,
    Organization,
    Registration,
    SignatureEnvelope,
    SyncEvent,
    Unit,
    User,
)


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


def registration_to_json(reg: Registration) -> dict:
    return {
        "id": str(reg.id),
        "name": reg.name,
        "cnpj": reg.cnpj,
        "promoter": reg.promoter.name if reg.promoter else DEFAULT_OWNER_NAME,
        "owner": reg.owner.name if reg.owner else "",
        "table": reg.price_table or "",
        "tipo_cobranca": reg.price_table or "",
        "stage": reg.stage.sort_order if reg.stage else 0,
        "city": reg.city,
        "unit": reg.unit.name if reg.unit else "",
        "updated": reg.updated_at.isoformat(),
        "documents": reg.documents_count,
        "comments": reg.comments_count,
    }


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
