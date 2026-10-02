from __future__ import annotations

from flask import Blueprint, jsonify

from bomfim.cnpj import normalize_cnpj_digits, parse_cnpj
from bomfim.receita_federal import lookup_cnpj_receita
from bomfim.security import login_required

cnpj_bp = Blueprint("cnpj", __name__)


@cnpj_bp.get("/<path:cnpj_raw>")
@login_required
def lookup_cnpj(cnpj_raw: str):
    formatted, parse_err = parse_cnpj(cnpj_raw)
    if parse_err:
        return jsonify({"error": parse_err}), 400

    digits = normalize_cnpj_digits(formatted)
    payload, err = lookup_cnpj_receita(digits)
    if err:
        status = 404 if "não encontrado" in err.lower() else 502
        return jsonify({"error": err}), status

    return jsonify({**payload, "cnpj": formatted})
