from __future__ import annotations

import re
from pathlib import Path

from flask import current_app

_UNSAFE = re.compile(r"[^\w.\-]+", re.UNICODE)


def get_storage_root() -> Path:
    root = current_app.config.get("STORAGE_ROOT")
    if root is None:
        from bomfim.config import _storage_root

        root = _storage_root()
    return Path(root)


def sanitize_filename(name: str) -> str:
    base = Path(name).name or "anexo"
    cleaned = _UNSAFE.sub("_", base).strip("._")
    return cleaned[:200] or "anexo"


def anexo_relative_path(registration_id: int, anexo_id: int, filename: str) -> str:
    safe = sanitize_filename(filename)
    return f"registration_anexos/{registration_id}/{anexo_id}_{safe}"


def anexo_absolute_path(relative: str) -> Path:
    return get_storage_root() / relative


def ensure_anexo_dir(registration_id: int) -> Path:
    directory = get_storage_root() / "registration_anexos" / str(registration_id)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def ensure_storage_dirs() -> None:
    (get_storage_root() / "registration_anexos").mkdir(parents=True, exist_ok=True)
