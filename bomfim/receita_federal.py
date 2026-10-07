from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

from bomfim.cnpj import format_cnpj, normalize_cnpj_digits

RECEITAWS_CNPJ_FREE = "https://www.receitaws.com.br/v1/cnpj/{digits}"
TIMEOUT_SEC = 30


def lookup_cnpj_receita(raw: str) -> tuple[dict | None, str | None]:
    """
    Consulta dados públicos de CNPJ via ReceitaWS (mesmo fluxo do aicentralv2).
    Returns (payload, error_message).
    """
    digits = normalize_cnpj_digits(raw)
    if len(digits) != 14:
        return None, "CNPJ deve ter 14 dígitos."

    headers = {"Accept": "application/json", "User-Agent": "Bomfim/1.0"}
    token = (os.environ.get("RECEITAWS_TOKEN") or "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(
        RECEITAWS_CNPJ_FREE.format(digits=digits),
        headers=headers,
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SEC) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 429:
            return None, "Limite de consultas ReceitaWS excedido. Aguarde cerca de 1 minuto e tente novamente."
        if e.code == 404:
            return None, "CNPJ não encontrado na Receita Federal."
        return None, "Não foi possível consultar a Receita Federal."
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
        return None, "Serviço da Receita Federal indisponível. Tente novamente."

    if (data.get("status") or "").upper() == "ERROR":
        msg = (data.get("message") or "CNPJ não encontrado na Receita Federal.").strip()
        return None, msg

    if (data.get("status") or "").upper() != "OK":
        return None, "CNPJ não encontrado na Receita Federal."

    city = (data.get("municipio") or "").strip()
    uf = (data.get("uf") or "").strip()
    city_label = f"{city}, {uf}" if city and uf else city or uf or ""
    trade_name = (data.get("fantasia") or "").strip()
    name = (data.get("nome") or "").strip()

    def _text(key: str) -> str:
        return (data.get(key) or "").strip()

    main_activity = data.get("atividade_principal") or []
    secondary_activities = data.get("atividades_secundarias") or []
    qsa = data.get("qsa") or []

    return {
        "cnpj": format_cnpj(digits),
        "name": name,
        "trade_name": trade_name or name,
        "city": city_label,
        "status": _text("situacao"),
        "tipo": _text("tipo"),
        "opening_date": _text("abertura"),
        "legal_nature": _text("natureza_juridica"),
        "company_size": _text("porte"),
        "share_capital": _text("capital_social"),
        "street": _text("logradouro"),
        "street_number": _text("numero"),
        "complement": _text("complemento"),
        "district": _text("bairro"),
        "zip_code": _text("cep"),
        "municipality": city,
        "state": uf,
        "email": _text("email"),
        "phone": _text("telefone"),
        "situation": _text("situacao"),
        "situation_date": _text("data_situacao"),
        "situation_reason": _text("motivo_situacao"),
        "special_situation": _text("situacao_especial"),
        "special_situation_date": _text("data_situacao_especial"),
        "efr": _text("efr"),
        "main_activity": main_activity,
        "secondary_activities": secondary_activities,
        "qsa": qsa,
    }, None
