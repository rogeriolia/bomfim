import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env"


def _parse_dotenv_file() -> dict[str, str]:
    """Lê chaves do .env do projeto (linhas comentadas ignoradas)."""
    parsed: dict[str, str] = {}
    if not ENV_FILE.is_file():
        return parsed
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        raw = line.strip()
        if not raw or raw.startswith("#") or "=" not in raw:
            continue
        key, _, value = raw.partition("=")
        key = key.strip()
        if key:
            parsed[key] = value.strip().strip('"').strip("'")
    return parsed


_DB_ENV_KEYS = frozenset(
    {
        "DATABASE_URL",
        "DB_HOST",
        "DB_PORT",
        "DB_USER",
        "DB_PASSWORD",
        "DB_NAME",
        "DB_SSLMODE",
        "DB_CONNECT_TIMEOUT",
    }
)


def load_project_dotenv() -> None:
    """Carrega `.env` do projeto; valores do arquivo prevalecem sobre o ambiente do SO."""
    preserved: dict[str, str] = {}
    if os.environ.get("BOMFIM_DB_TUNNEL_ACTIVE") == "1":
        for key in _DB_ENV_KEYS:
            val = (os.environ.get(key) or "").strip()
            if val:
                preserved[key] = val
    load_dotenv(ENV_FILE, override=True)
    for key, val in preserved.items():
        os.environ[key] = val


load_project_dotenv()


def _env_get(key: str, default: str = "") -> str:
    """Integrações: .env prevalece. Banco: os.environ prevalece (túnel SSH em dev)."""
    from_file = (_parse_dotenv_file().get(key) or "").strip()
    env_val = (os.environ.get(key) or "").strip()
    if key in _DB_ENV_KEYS:
        return env_val or from_file or default
    if from_file:
        return from_file
    return env_val or default


def _database_uri_from_parts(
    host: str,
    port: str,
    user: str,
    password: str,
    name: str,
) -> str:
    return (
        f"postgresql+psycopg2://{quote_plus(user)}:{quote_plus(password)}"
        f"@{host}:{port}/{name}"
    )


def _normalize_database_url(url: str) -> str:
    if url.rstrip("/").endswith("/postgres"):
        url = url.rstrip("/").rsplit("/", 1)[0] + "/bomfim"
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


def _database_uri() -> str:
    load_project_dotenv()
    env_url = _env_get("DATABASE_URL")
    if env_url:
        return _normalize_database_url(env_url)

    host = _env_get("DB_HOST")
    if host:
        return _normalize_database_url(
            _database_uri_from_parts(
                host,
                _env_get("DB_PORT", "5432"),
                _env_get("DB_USER", "postgres"),
                _env_get("DB_PASSWORD"),
                _env_get("DB_NAME", "bomfim"),
            )
        )

    return _normalize_database_url("postgresql://postgres:postgres@localhost:5432/bomfim")


def _engine_options() -> dict:
    load_project_dotenv()
    connect_args: dict = {"connect_timeout": int(_env_get("DB_CONNECT_TIMEOUT", "15"))}
    sslmode = _env_get("DB_SSLMODE")
    if sslmode:
        connect_args["sslmode"] = sslmode
    return {"connect_args": connect_args}


def _storage_root() -> Path:
    load_project_dotenv()
    raw = _env_get("STORAGE_ROOT", "storage")
    root = Path(raw)
    if not root.is_absolute():
        root = PROJECT_ROOT / root
    return root


class Config:
    SECRET_KEY = _env_get("SECRET_KEY", "bomfim-dev-secret-change-in-production")
    STORAGE_ROOT = _storage_root()
    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_ENGINE_OPTIONS = _engine_options()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_EXPIRY_HOURS = int(_env_get("JWT_EXPIRY_HOURS", "24"))
    CORS_ORIGINS = _env_get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
