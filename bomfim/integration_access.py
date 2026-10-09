from __future__ import annotations

import os
import time
from pathlib import Path
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any, Callable

from sqlalchemy import text

from dotenv import load_dotenv

from bomfim.extensions import db

_ENV_ROOT = Path(__file__).resolve().parent.parent
_ENV_FILE = _ENV_ROOT / ".env"

CHECK_TIMEOUT_SEC = 5
CACHE_TTL_SEC = 60

INTEGRATION_NAMES = ["Moskit", "Pipefy", "Click Sign", "Receita Federal", "Zapier"]


def _parse_dotenv_file() -> dict[str, str]:
    """Lê .env ignorando espaços antes do nome da variável (comum em edições manuais)."""
    parsed: dict[str, str] = {}
    if not _ENV_FILE.is_file():
        return parsed
    for line in _ENV_FILE.read_text(encoding="utf-8").splitlines():
        raw = line.strip()
        if not raw or raw.startswith("#") or "=" not in raw:
            continue
        key, _, value = raw.partition("=")
        key = key.strip()
        if key:
            parsed[key] = value.strip().strip('"').strip("'")
    return parsed


def _env_first(*keys: str) -> str:
    for key in keys:
        value = (os.environ.get(key) or "").strip()
        if value:
            return value
    for key in keys:
        value = _parse_dotenv_file().get(key, "").strip()
        if value:
            return value
    return ""


def _sync_integration_env_from_dotenv() -> None:
    """Sincroniza .env → os.environ (gunicorn só lê .env no start)."""
    load_dotenv(_ENV_FILE, override=False)
    for key, value in _parse_dotenv_file().items():
        if value and not (os.environ.get(key) or "").strip():
            os.environ[key] = value


def _dotenv_mtime() -> float:
    try:
        return _ENV_FILE.stat().st_mtime
    except OSError:
        return 0.0

# CNPJ público usado só para verificar reachability da ReceitaWS (não persiste dados).
RECEITA_PROBE_CNPJ = "11222333000181"

_cache: dict[str, Any] = {"expires_at": 0.0, "payload": None}


def _result(ok: bool, detail: str | None = None) -> dict[str, Any]:
    out: dict[str, Any] = {"ok": ok}
    if detail:
        out["detail"] = detail
    return out


def _http_get(url: str, headers: dict[str, str]) -> tuple[int | None, str | None]:
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=CHECK_TIMEOUT_SEC) as resp:
            return resp.status, None
    except urllib.error.HTTPError as e:
        return e.code, None
    except (urllib.error.URLError, TimeoutError, OSError):
        return None, "Serviço indisponível."


def _moskit_api_key() -> str:
    return _env_first("MOSKIT_API_KEY")


def _moskit_login_credentials() -> tuple[str, str]:
    return _env_first("MOSKIT_USUARIO"), _env_first("MOSKIT_SENHA")


def check_moskit() -> dict[str, Any]:
    apikey = _moskit_api_key()
    if apikey:
        status, err = _http_get(
            "https://api.moskitcrm.com/v2/users",
            {"apikey": apikey, "Accept": "application/json", "User-Agent": "Bomfim/1.0"},
        )
        if status == 200:
            return _result(True)
        if status == 401:
            return _result(False, "API key Moskit inválida.")
        if status is None:
            return _result(False, err or "API Moskit indisponível.")
        return _result(False, f"API Moskit respondeu com erro ({status}).")

    usuario, senha = _moskit_login_credentials()
    if usuario and senha:
        return _result(True)

    return _result(False, "Credencial Moskit não configurada.")


def _pipefy_api_token() -> str:
    return _env_first("PYPEFY_API_TOKEN", "PIPEFY_API_TOKEN", "PIPEFY_ACCESS_TOKEN")


def _pipefy_login_credentials() -> tuple[str, str]:
    return _env_first("PYPEFY_USUARIO", "PIPEFY_USUARIO"), _env_first("PYPEFY_SENHA", "PIPEFY_SENHA")


def check_pipefy() -> dict[str, Any]:
    token = _pipefy_api_token()
    if token:
        status, err = _http_get(
            "https://api.pipefy.com/graphql",
            {
                "Authorization": f"Bearer {token}",
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "Bomfim/1.0",
            },
        )
        # GraphQL costuma responder 400/405 em GET; 401 indica token inválido.
        if status in (200, 400, 405):
            return _result(True)
        if status == 401:
            return _result(False, "Token Pipefy inválido.")
        if status is None:
            return _result(False, err or "API Pipefy indisponível.")
        return _result(False, f"API Pipefy respondeu com erro ({status}).")

    usuario, senha = _pipefy_login_credentials()
    if usuario and senha:
        return _result(True)

    return _result(False, "Credencial Pipefy não configurada.")


def check_clicksign() -> dict[str, Any]:
    token = _env_first("CLICKSIGN_ACCESS_TOKEN")
    if not token:
        return _result(True)
    base = (_env_first("CLICKSIGN_BASE_URL") or "https://app.clicksign.com").rstrip("/")
    status, err = _http_get(
        f"{base}/api/v3/envelopes",
        {
            "Authorization": token,
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "User-Agent": "Bomfim/1.0",
        },
    )
    if status in (200, 404):
        return _result(True)
    if status == 401:
        return _result(False, "Token Click Sign inválido.")
    if status is None:
        return _result(False, err or "API Click Sign indisponível.")
    return _result(False, f"API Click Sign respondeu com erro ({status}).")


def check_receita_federal() -> dict[str, Any]:
    token = _env_first("RECEITAWS_TOKEN")
    if not token:
        return _result(True)
    headers = {"Accept": "application/json", "User-Agent": "Bomfim/1.0", "Authorization": f"Bearer {token}"}
    status, err = _http_get(
        f"https://www.receitaws.com.br/v1/cnpj/{RECEITA_PROBE_CNPJ}",
        headers,
    )
    if status in (200, 404, 429):
        return _result(True)
    if status == 401:
        return _result(False, "Token ReceitaWS inválido.")
    if status is None:
        return _result(False, err or "Receita Federal indisponível.")
    return _result(False, f"ReceitaWS respondeu com erro ({status}).")


def _zapier_api_key() -> str:
    return _env_first("ZAPIER_API_KEY")


def _zapier_login_credentials() -> tuple[str, str]:
    return _env_first("ZAPIER_USUARIO"), _env_first("ZAPIER_SENHA")


def check_zapier() -> dict[str, Any]:
    api_key = _zapier_api_key()
    if api_key:
        status, err = _http_get(
            "https://api.zapier.com/v1/zaps?limit=1",
            {
                "Authorization": f"Bearer {api_key}",
                "Accept": "application/json",
                "User-Agent": "Bomfim/1.0",
            },
        )
        if status == 200:
            return _result(True)
        if status == 401:
            return _result(False, "API key Zapier inválida.")
        if status is None:
            return _result(False, err or "API Zapier indisponível.")
        return _result(False, f"API Zapier respondeu com erro ({status}).")

    usuario, senha = _zapier_login_credentials()
    if usuario and senha:
        return _result(True)

    return _result(False, "Credencial Zapier não configurada.")


def check_db_ok() -> bool:
    try:
        db.session.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


_CHECKERS: dict[str, Callable[[], dict[str, Any]]] = {
    "Moskit": check_moskit,
    "Pipefy": check_pipefy,
    "Click Sign": check_clicksign,
    "Receita Federal": check_receita_federal,
    "Zapier": check_zapier,
}


def get_integration_access_status(*, force_refresh: bool = False) -> dict[str, Any]:
    now = time.time()
    _sync_integration_env_from_dotenv()
    env_mtime = _dotenv_mtime()
    if (
        not force_refresh
        and _cache["payload"] is not None
        and now < _cache["expires_at"]
        and _cache.get("env_mtime") == env_mtime
    ):
        return _cache["payload"]

    api_ok = check_db_ok()
    integrations: list[dict[str, Any]] = []
    for name in INTEGRATION_NAMES:
        checked = _CHECKERS[name]()
        row: dict[str, Any] = {"name": name, "ok": checked["ok"]}
        if checked.get("detail"):
            row["detail"] = checked["detail"]
        integrations.append(row)

    payload = {
        "api_ok": api_ok,
        "checked_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "integrations": integrations,
    }
    _cache["payload"] = payload
    _cache["expires_at"] = now + CACHE_TTL_SEC
    _cache["env_mtime"] = env_mtime
    return payload
