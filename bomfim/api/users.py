from __future__ import annotations

from flask import Blueprint, g, jsonify, request

from bomfim.extensions import db
from bomfim.models import Unit, User
from bomfim.photo_validation import validate_photo_data_url
from bomfim.security import admin_required, hash_password, login_required
from bomfim.serializers import user_to_json

users_bp = Blueprint("users", __name__)

DEFAULT_PASSWORD = "123456789"
ALLOWED_USER_STATUSES = frozenset({"active", "inactive"})


def _photo_from_body(data: dict) -> tuple[str | None | object, str | None]:
    """Returns photo value, _UNSET if key absent, or error string."""
    if "photo" not in data:
        return _UNSET, None
    raw = data["photo"]
    if raw is None:
        return None, None
    err = validate_photo_data_url(raw)
    if err:
        return None, err
    return raw, None


_UNSET = object()


@users_bp.get("")
@login_required
def list_users():
    users = User.query.order_by(User.name).all()
    return jsonify([user_to_json(u) for u in users])


@users_bp.post("")
@admin_required
def create_user():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    role = (data.get("role") or "operator").strip()
    unit_name = (data.get("unit") or "").strip()
    password = data.get("password") or DEFAULT_PASSWORD

    if not name or not email or not unit_name:
        return jsonify({"error": "Nome, e-mail e unidade são obrigatórios."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Este e-mail já está cadastrado."}), 409

    unit = Unit.query.filter_by(name=unit_name).first()
    if unit is None:
        return jsonify({"error": "Unidade inválida."}), 400

    photo, photo_err = _photo_from_body(data)
    if photo_err:
        return jsonify({"error": photo_err}), 400

    user = User(
        organization_id=unit.organization_id,
        unit_id=unit.id,
        name=name,
        email=email,
        role=role,
        password_hash=hash_password(password),
        status="active",
        photo=photo if photo is not _UNSET else None,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user_to_json(user)), 201


@users_bp.patch("/<int:user_id>")
@admin_required
def update_user(user_id: int):
    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"error": "Usuário não encontrado."}), 404

    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Nome é obrigatório."}), 400
        user.name = name

    if "email" in data:
        email = (data.get("email") or "").strip().lower()
        if not email:
            return jsonify({"error": "E-mail é obrigatório."}), 400
        existing = User.query.filter_by(email=email).first()
        if existing is not None and existing.id != user.id:
            return jsonify({"error": "Este e-mail já está cadastrado."}), 409
        user.email = email

    if "role" in data:
        user.role = (data.get("role") or user.role).strip()

    if "unit" in data:
        unit_name = (data.get("unit") or "").strip()
        if not unit_name:
            return jsonify({"error": "Unidade é obrigatória."}), 400
        unit = Unit.query.filter_by(name=unit_name).first()
        if unit is None:
            return jsonify({"error": "Unidade inválida."}), 400
        user.unit_id = unit.id
        user.organization_id = unit.organization_id

    if "status" in data:
        status = (data.get("status") or "").strip()
        if status not in ALLOWED_USER_STATUSES:
            return jsonify({"error": "Status inválido."}), 400
        user.status = status

    photo, photo_err = _photo_from_body(data)
    if photo_err:
        return jsonify({"error": photo_err}), 400
    if photo is not _UNSET:
        user.photo = photo

    db.session.commit()
    return jsonify(user_to_json(user))


@users_bp.get("/me")
@login_required
def me():
    return jsonify(user_to_json(g.current_user))
