from __future__ import annotations

from datetime import UTC, datetime

from flask import Blueprint, jsonify, request

from bomfim.extensions import db
from bomfim.models import User
from bomfim.security import check_password, create_access_token
from bomfim.serializers import user_to_json

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return jsonify({"error": "E-mail e senha são obrigatórios."}), 400

    user = User.query.filter_by(email=email).first()
    if user is None or not check_password(password, user.password_hash):
        return jsonify({"error": "E-mail ou senha inválidos."}), 401
    if user.status != "active":
        return jsonify({"error": "Usuário inativo."}), 403

    user.last_access_at = datetime.now(UTC)
    db.session.commit()

    token = create_access_token(user.id)
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return jsonify({"token": token, "user": user_to_json(user)})
