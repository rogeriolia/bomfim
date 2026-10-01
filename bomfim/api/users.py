from __future__ import annotations

from flask import Blueprint, g, jsonify, request

from bomfim.extensions import db
from bomfim.models import Unit, User
from bomfim.security import admin_required, hash_password, login_required
from bomfim.serializers import user_to_json

users_bp = Blueprint("users", __name__)

DEFAULT_PASSWORD = "123456789"


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

    user = User(
        organization_id=unit.organization_id,
        unit_id=unit.id,
        name=name,
        email=email,
        role=role,
        password_hash=hash_password(password),
        status="active",
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user_to_json(user)), 201


@users_bp.get("/me")
@login_required
def me():
    return jsonify(user_to_json(g.current_user))
