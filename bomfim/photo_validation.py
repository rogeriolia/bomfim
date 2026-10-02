from __future__ import annotations

import re

PHOTO_MAX_BYTES = 120_000
_DATA_URL_RE = re.compile(r"^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$")


def validate_photo_data_url(raw: str) -> str | None:
    """Returns error message or None if valid."""
    if not isinstance(raw, str):
        return "Formato de foto inválido."
    if len(raw.encode("utf-8")) > PHOTO_MAX_BYTES:
        return "A foto é grande demais. Use uma imagem menor."
    if not _DATA_URL_RE.match(raw):
        return "Formato de foto inválido. Use JPEG, PNG ou WebP."
    return None
