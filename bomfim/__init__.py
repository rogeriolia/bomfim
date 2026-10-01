from __future__ import annotations

import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from bomfim.api import register_blueprints
from bomfim.config import config_by_name
from bomfim.extensions import db, migrate


def create_app(config_name: str | None = None) -> Flask:
    load_dotenv()
    app = Flask(__name__)
    cfg = config_by_name.get(config_name or os.environ.get("FLASK_CONFIG", "default"), config_by_name["default"])
    app.config.from_object(cfg)

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}}, supports_credentials=True)

    db.init_app(app)
    migrate.init_app(app, db)

    register_blueprints(app)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app
