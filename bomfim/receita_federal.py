from __future__ import annotations

import json
import urllib.error
import urllib.request

from bomfim.cnpj import format_cnpj, normalize_cnpj_digits

BRASIL_API_CNPJ = "https://brasilapi.com.br/api/cnpj/v1/{digits}"
TIMEOUT_SEC = 12


def lookup_cnpj_receita(raw: str) -> tuple[dict | None, str | None]:
    """
    Consulta dados públicos de CNPJ (BrasilAPI).
    Returns (payload, error_message).
    """
    digits = normalize_cnpj_digits(raw)
    if len(digits) != 14:
        return None, "CNPJ deve ter 14 dígitos."

    req = urllib.request.Request(
        BRASIL_API_CNPJ.format(digits=digits),
        headers={"Accept": "application/json", "User-Agent": "Bomfim/1.0"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SEC) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None, "CNPJ não encontrado na Receita Federal."
        return None, "Não foi possível consultar a Receita Federal."
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
        return None, "Serviço da Receita Federal indisponível. Tente novamente."

    city = (data.get("municipio") or "").strip()
    uf = (data.get("uf") or "").strip()
    city_label = f"{city}, {uf}" if city and uf else city or uf or ""

    return {
        "cnpj": format_cnpj(digits),
        "name": (data.get("razao_social") or "").strip(),
        "trade_name": (data.get("nome_fantasia") or "").strip(),
        "city": city_label,
        "status": (data.get("descricao_situacao_cadastral") or data.get("situacao_cadastral") or "").strip(),
    }, None
