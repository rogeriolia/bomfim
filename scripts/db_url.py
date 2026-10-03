"""Build PostgreSQL URL from DATABASE_URL or DB_* variables in .env."""
from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import quote_plus


def _read_database_url_from_dotenv() -> str | None:
    env_file = Path(__file__).resolve().parent.parent / ".env"
    if not env_file.is_file():
        return None
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or not line.upper().startswith("DATABASE_URL"):
            continue
        if "=" in line:
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def database_url(*, maintenance: bool = False) -> str:
    """Return postgresql:// URL. maintenance=True uses the `postgres` database."""
    url = os.environ.get("DATABASE_URL") or _read_database_url_from_dotenv()
    if url:
        if maintenance:
            base = url.rsplit("/", 1)[0]
            return base + "/postgres"
        if url.rstrip("/").endswith("/postgres"):
            return url.rstrip("/").rsplit("/", 1)[0] + "/bomfim"
        return url

    host = os.environ.get("DB_HOST", "localhost")
    port = os.environ.get("DB_PORT", "5432")
    user = os.environ.get("DB_USER", "postgres")
    password = os.environ.get("DB_PASSWORD", "")
    name = "postgres" if maintenance else os.environ.get("DB_NAME", "bomfim")
    return f"postgresql://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/{name}"


def sqlalchemy_url(*, maintenance: bool = False) -> str:
    url = database_url(maintenance=maintenance)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url
