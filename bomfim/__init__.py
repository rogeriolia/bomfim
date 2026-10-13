from __future__ import annotations

import inspect
import os
import subprocess
from pathlib import Path

from flask import Flask
from flask_cors import CORS

from bomfim.api import register_blueprints
from bomfim.config import _database_uri, _engine_options, config_by_name, load_project_dotenv
from sqlalchemy import text

from bomfim.extensions import db, migrate


def create_app(config_name: str | None = None) -> Flask:
    load_project_dotenv()
    app = Flask(__name__)
    cfg = config_by_name.get(config_name or os.environ.get("FLASK_CONFIG", "default"), config_by_name["default"])
    app.config.from_object(cfg)
    app.config["SQLALCHEMY_DATABASE_URI"] = _database_uri()
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = _engine_options()

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}}, supports_credentials=True)

    db.init_app(app)
    migrate.init_app(app, db)

    register_blueprints(app)

    def _git_rev_short() -> str | None:
        root = Path.cwd()
        try:
            return (
                subprocess.check_output(
                    ["git", "-C", str(root), "rev-parse", "--short", "HEAD"],
                    text=True,
                    timeout=3,
                    stderr=subprocess.DEVNULL,
                )
                .strip()
                or None
            )
        except (OSError, subprocess.CalledProcessError):
            return None

    @app.get("/api/health")
    def health():
        db_status = "ok"
        payload: dict = {"status": "ok", "db": db_status}
        try:
            db.session.execute(text("SELECT 1"))
        except Exception:
            db_status = "error"
            payload["db"] = db_status
            return payload

        try:
            from bomfim.models import Registration, RegistrationAnexo

            payload["registrations"] = Registration.query.count()
            payload["registration_anexos"] = RegistrationAnexo.query.count()
        except Exception:
            pass

        rev = _git_rev_short()
        if rev:
            payload["git_rev"] = rev
        payload["cwd"] = str(Path.cwd())
        payload["has_anexo_counts_route"] = any(
            rule.rule.endswith("/anexo-counts") for rule in app.url_map.iter_rules()
        )
        from bomfim.api import registrations as registrations_api

        payload["registration_detail_v2"] = "selectinload(" not in inspect.getsource(
            registrations_api.get_registration
        )
        return payload

    return app
