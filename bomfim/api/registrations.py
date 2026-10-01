from __future__ import annotations

from datetime import date

from flask import Blueprint, jsonify, request

from bomfim.extensions import db
from bomfim.models import Registration, RegistrationStage, Unit, User
from bomfim.security import login_required
from bomfim.serializers import registration_to_json

registrations_bp = Blueprint("registrations", __name__)


def _resolve_stage(stage_index: int) -> RegistrationStage | None:
    return RegistrationStage.query.filter_by(sort_order=stage_index).first()


def _resolve_user_by_name(name: str) -> User | None:
    if not name:
        return None
    return User.query.filter_by(name=name).first()


@registrations_bp.get("")
@login_required
def list_registrations():
    rows = Registration.query.order_by(Registration.id).all()
    return jsonify([registration_to_json(r) for r in rows])


@registrations_bp.get("/<int:reg_id>")
@login_required
def get_registration(reg_id: int):
    reg = db.session.get(Registration, reg_id)
    if reg is None:
        return jsonify({"error": "Cadastro não encontrado."}), 404
    return jsonify(registration_to_json(reg))


@registrations_bp.post("")
@login_required
def create_registration():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    cnpj = (data.get("cnpj") or "").strip()
    if not name or not cnpj:
        return jsonify({"error": "Nome e CNPJ são obrigatórios."}), 400

    stage = _resolve_stage(int(data.get("stage", 0))) or RegistrationStage.query.order_by(RegistrationStage.sort_order).first()
    unit = Unit.query.filter_by(name=data.get("unit") or "Salvador").first()
    if unit is None:
        return jsonify({"error": "Unidade inválida."}), 400

    promoter = _resolve_user_by_name(data.get("promoter", "")) or User.query.filter_by(role="promoter").first()
    owner = _resolve_user_by_name(data.get("owner", "")) or User.query.filter_by(role="manager").first()

    reg = Registration(
        organization_id=unit.organization_id,
        name=name,
        cnpj=cnpj,
        price_table=data.get("table") or "Capital Express",
        stage_id=stage.id if stage else 1,
        city=data.get("city") or unit.locality,
        unit_id=unit.id,
        promoter_id=promoter.id if promoter else None,
        owner_id=owner.id if owner else None,
        documents_count=int(data.get("documents", 1)),
        comments_count=int(data.get("comments", 0)),
        updated_at=date.today(),
    )
    db.session.add(reg)
    db.session.commit()
    return jsonify(registration_to_json(reg)), 201


@registrations_bp.patch("/<int:reg_id>")
@login_required
def patch_registration(reg_id: int):
    reg = db.session.get(Registration, reg_id)
    if reg is None:
        return jsonify({"error": "Cadastro não encontrado."}), 404

    data = request.get_json(silent=True) or {}
    if "name" in data:
        reg.name = data["name"]
    if "cnpj" in data:
        reg.cnpj = data["cnpj"]
    if "table" in data:
        reg.price_table = data["table"]
    if "city" in data:
        reg.city = data["city"]
    if "documents" in data:
        reg.documents_count = int(data["documents"])
    if "comments" in data:
        reg.comments_count = int(data["comments"])
    if "unit" in data:
        unit = Unit.query.filter_by(name=data["unit"]).first()
        if unit:
            reg.unit_id = unit.id
    if "stage" in data:
        stage = _resolve_stage(int(data["stage"]))
        if stage:
            reg.stage_id = stage.id
    if "promoter" in data:
        pu = _resolve_user_by_name(str(data["promoter"]))
        if pu:
            reg.promoter_id = pu.id
    if "owner" in data:
        ou = _resolve_user_by_name(str(data["owner"]))
        if ou:
            reg.owner_id = ou.id
    if "updated" in data:
        reg.updated_at = date.fromisoformat(data["updated"])

    reg.updated_at = date.today()
    db.session.commit()
    return jsonify(registration_to_json(reg))
