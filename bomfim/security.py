from __future__ import annotations

from datetime import UTC, datetime, timedelta
from functools import wraps

import bcrypt
import jwt
from flask import current_app, g, jsonify, request

from bomfim.extensions import db
from bomfim.models import User


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(user_id: int) -> str:
    exp = datetime.now(UTC) + timedelta(hours=current_app.config["JWT_EXPIRY_HOURS"])
    return jwt.encode(
        {"sub": str(user_id), "exp": exp},
        current_app.config["SECRET_KEY"],
        algorithm="HS256",
    )


def decode_access_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
        return int(payload["sub"])
    except (jwt.PyJWTError, ValueError, TypeError):
        return None


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "Não autorizado"}), 401
        user_id = decode_access_token(auth[7:].strip())
        if user_id is None:
            return jsonify({"error": "Token inválido ou expirado"}), 401
        user = db.session.get(User, user_id)
        if user is None or user.status != "active":
            return jsonify({"error": "Usuário inválido"}), 401
        g.current_user = user
        return view(*args, **kwargs)

    return wrapped


def admin_required(view):
    @wraps(view)
    @login_required
    def wrapped(*args, **kwargs):
        if g.current_user.role != "admin":
            return jsonify({"error": "Acesso negado"}), 403
        return view(*args, **kwargs)

    return wrapped
