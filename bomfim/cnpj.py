from __future__ import annotations

import re

_CNPJ_RE = re.compile(r"^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$")


def normalize_cnpj_digits(raw: str) -> str:
    return re.sub(r"\D", "", raw or "")


def format_cnpj(digits: str) -> str:
    d = normalize_cnpj_digits(digits)
    if len(d) != 14:
        return (digits or "").strip()
    return f"{d[0:2]}.{d[2:5]}.{d[5:8]}/{d[8:12]}-{d[12:14]}"


def _calc_digit(numbers: list[int], weights: list[int]) -> int:
    total = sum(n * w for n, w in zip(numbers, weights, strict=True))
    remainder = total % 11
    return 0 if remainder < 2 else 11 - remainder


def is_valid_cnpj(raw: str) -> bool:
    digits = normalize_cnpj_digits(raw)
    if len(digits) != 14:
        return False
    if digits == digits[0] * 14:
        return False
    nums = [int(c) for c in digits]
    first = _calc_digit(nums[:12], [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    if first != nums[12]:
        return False
    second = _calc_digit(nums[:13], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    return second == nums[13]


def legacy_demo_cnpj_index(raw: str) -> int | None:
    """Índice seed (0..) se for CNPJ demo legado ou atual com prefixo 12–29.345.678/0001."""
    digits = normalize_cnpj_digits(raw)
    if len(digits) != 14 or digits[2:8] != "345678" or digits[8:12] != "0001":
        return None
    prefix = int(digits[:2])
    if prefix < 12 or prefix > 29:
        return None
    return prefix - 12


def cnpj_for_demo_index(index: int) -> str:
    """Gera CNPJ válido estável para dados seed (mesmo prefixo visual 12.345.678/0001-XX)."""
    base12 = f"{12 + index:02d}3456780001"
    nums = [int(c) for c in base12]
    d1 = _calc_digit(nums[:12], [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    d2 = _calc_digit(nums[:12] + [d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    return format_cnpj(base12 + str(d1) + str(d2))


def parse_cnpj(raw: str) -> tuple[str | None, str | None]:
    """Returns (formatted cnpj, error message)."""
    digits = normalize_cnpj_digits(raw)
    if len(digits) != 14:
        return None, "CNPJ deve ter 14 dígitos."
    if not is_valid_cnpj(digits):
        demo_idx = legacy_demo_cnpj_index(raw)
        if demo_idx is not None:
            corrected = cnpj_for_demo_index(demo_idx)
            return corrected, None
        return None, "CNPJ inválido. Verifique os dígitos."
    formatted = format_cnpj(digits)
    if not _CNPJ_RE.match(formatted):
        return None, "Formato de CNPJ inválido."
    return formatted, None
