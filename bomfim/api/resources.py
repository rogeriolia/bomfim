from __future__ import annotations

from flask import Blueprint, jsonify, request

from bomfim.models import (
    AuditLog,
    Document,
    EmailTemplate,
    Integration,
    Organization,
    SignatureEnvelope,
    SyncEvent,
    Unit,
)
from bomfim.integration_access import get_integration_access_status
from bomfim.security import login_required
from bomfim.serializers import (
    audit_log_to_json,
    document_to_json,
    email_template_to_json,
    integration_to_json,
    settings_to_json,
    signature_to_json,
    sync_event_to_json,
    unit_to_json,
)

resources_bp = Blueprint("resources", __name__)

ROLES_MATRIX = [
    {"role": "admin", "label": "Administrador", "operational": "Consultar e editar", "admin": "Ativo", "scope": "Todas as áreas"},
    {"role": "manager", "label": "Gestor", "operational": "Consultar e editar", "admin": "Sem acesso", "scope": "Módulos operacionais"},
    {"role": "operator", "label": "Operador", "operational": "Consultar e editar", "admin": "Sem acesso", "scope": "Módulos operacionais"},
    {"role": "promoter", "label": "Promotor", "operational": "Consultar e editar", "admin": "Sem acesso", "scope": "Módulos operacionais"},
]


@resources_bp.get("/units")
@login_required
def list_units():
    return jsonify([unit_to_json(u) for u in Unit.query.order_by(Unit.name).all()])


@resources_bp.get("/integrations")
@login_required
def list_integrations():
    return jsonify([integration_to_json(i) for i in Integration.query.order_by(Integration.name).all()])


@resources_bp.get("/integrations/access-status")
@login_required
def integrations_access_status():
    force = request.args.get("refresh") in ("1", "true", "yes")
    return jsonify(get_integration_access_status(force_refresh=force))


@resources_bp.get("/audit-logs")
@login_required
def list_audit_logs():
    rows = AuditLog.query.order_by(AuditLog.occurred_at.desc()).all()
    return jsonify([audit_log_to_json(r) for r in rows])


@resources_bp.get("/email-templates")
@login_required
def list_email_templates():
    return jsonify([email_template_to_json(r) for r in EmailTemplate.query.order_by(EmailTemplate.id).all()])


@resources_bp.get("/documents")
@login_required
def list_documents():
    return jsonify([document_to_json(r) for r in Document.query.order_by(Document.id).all()])


@resources_bp.get("/signatures")
@login_required
def list_signatures():
    return jsonify([signature_to_json(r) for r in SignatureEnvelope.query.order_by(SignatureEnvelope.id).all()])


@resources_bp.get("/sync-events")
@login_required
def list_sync_events():
    return jsonify([sync_event_to_json(r) for r in SyncEvent.query.order_by(SyncEvent.occurred_at.desc()).all()])


@resources_bp.get("/settings")
@login_required
def get_settings():
    org = Organization.query.order_by(Organization.id).first()
    if org is None:
        return jsonify({"error": "Organização não configurada."}), 404
    return jsonify(settings_to_json(org))


@resources_bp.get("/roles")
@login_required
def list_roles():
    return jsonify(ROLES_MATRIX)
