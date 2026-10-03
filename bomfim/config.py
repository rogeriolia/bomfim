import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


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


def _database_uri_from_db_env() -> str | None:
    host = os.environ.get("DB_HOST")
    if not host:
        return None
    from urllib.parse import quote_plus

    port = os.environ.get("DB_PORT", "5432")
    user = os.environ.get("DB_USER", "postgres")
    password = os.environ.get("DB_PASSWORD", "")
    name = os.environ.get("DB_NAME", "bomfim")
    return f"postgresql+psycopg2://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/{name}"


def _database_uri() -> str:
    url = (
        os.environ.get("DATABASE_URL")
        or _read_database_url_from_dotenv()
        or _database_uri_from_db_env()
        or "postgresql://postgres:postgres@localhost:5432/bomfim"
    )
    if url.rstrip("/").endswith("/postgres"):
        url = url.rstrip("/").rsplit("/", 1)[0] + "/bomfim"
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


def _engine_options() -> dict:
    connect_args: dict = {"connect_timeout": int(os.environ.get("DB_CONNECT_TIMEOUT", "15"))}
    sslmode = (os.environ.get("DB_SSLMODE") or "").strip()
    if sslmode:
        connect_args["sslmode"] = sslmode
    return {"connect_args": connect_args}


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "bomfim-dev-secret-change-in-production")
    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_ENGINE_OPTIONS = _engine_options()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_EXPIRY_HOURS = int(os.environ.get("JWT_EXPIRY_HOURS", "24"))
    CORS_ORIGINS = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
