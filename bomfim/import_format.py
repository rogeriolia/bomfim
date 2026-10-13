from __future__ import annotations

import re

from bomfim.cnpj import format_cnpj, normalize_cnpj_digits

_CEP_DIGITS = re.compile(r"\D")


def _first_cnpj_digits(raw: str) -> str | None:
    for chunk in re.findall(r"\d+", raw):
        if len(chunk) >= 14:
            return chunk[:14]
    digits = normalize_cnpj_digits(raw)
    if len(digits) >= 14:
        return digits[:14]
    return None


def format_cnpj_masked(raw: str | None) -> str | None:
    if raw is None:
        return None
    text = str(raw).strip()
    if not text:
        return None
    digits = _first_cnpj_digits(text)
    if digits and len(digits) == 14:
        return format_cnpj(digits)
    return text[:32]


def format_cep_masked(raw: str | None) -> str | None:
    if raw is None:
        return None
    text = str(raw).strip()
    if not text:
        return None
    digits = _CEP_DIGITS.sub("", text)
    if len(digits) != 8:
        return text
    return f"{digits[:2]}.{digits[2:5]}-{digits[5:]}"


def format_phone_display(raw: str | None) -> str | None:
    if raw is None:
        return None
    text = " ".join(str(raw).split())
    if not text:
        return None
    digits = _CEP_DIGITS.sub("", text)
    if digits == text.replace(" ", "") and len(digits) in (10, 11):
        if len(digits) == 11:
            return f"({digits[:2]}) {digits[2:7]}-{digits[7:]}"
        return f"({digits[:2]}) {digits[2:6]}-{digits[6:]}"
    return text
