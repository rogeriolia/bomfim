from __future__ import annotations

import urllib.error
import urllib.request
from datetime import UTC, datetime

from bomfim.extensions import db
from bomfim.models import (
    DOWNLOAD_STATUS_FAILED,
    DOWNLOAD_STATUS_OK,
    DOWNLOAD_STATUS_PENDING,
    RegistrationAnexo,
)
from bomfim.storage_paths import (
    anexo_absolute_path,
    anexo_relative_path,
    ensure_anexo_dir,
    sanitize_filename,
)

_USER_AGENT = "BomfimAnexoDownloader/1.0"
_TIMEOUT_SEC = 30
_BATCH_COMMIT = 25


def download_anexo(row: RegistrationAnexo, *, force: bool = False) -> bool:
    if (
        not force
        and row.download_status == DOWNLOAD_STATUS_OK
        and row.local_path
        and anexo_absolute_path(row.local_path).is_file()
    ):
        return True

    filename = sanitize_filename(row.filename or "anexo")
    relative = anexo_relative_path(row.registration_id, row.id, filename)
    absolute = anexo_absolute_path(relative)
    ensure_anexo_dir(row.registration_id)
    part_path = absolute.with_suffix(absolute.suffix + ".part")

    try:
        request = urllib.request.Request(row.url, headers={"User-Agent": _USER_AGENT})
        with urllib.request.urlopen(request, timeout=_TIMEOUT_SEC) as response:
            data = response.read()
        part_path.write_bytes(data)
        part_path.replace(absolute)
        row.local_path = relative
        row.download_status = DOWNLOAD_STATUS_OK
        row.download_error = None
        row.downloaded_at = datetime.now(UTC)
        row.file_size = len(data)
        return True
    except urllib.error.HTTPError as exc:
        row.download_status = DOWNLOAD_STATUS_FAILED
        row.download_error = f"HTTP {exc.code}: {exc.reason}"
        return False
    except Exception as exc:  # noqa: BLE001 — persist error message for operators
        row.download_status = DOWNLOAD_STATUS_FAILED
        row.download_error = str(exc)[:2000]
        if part_path.is_file():
            part_path.unlink(missing_ok=True)
        return False


def download_pending_anexos(
    *,
    registration_id: int | None = None,
    limit: int | None = None,
    failed_only: bool = False,
    force: bool = False,
) -> dict[str, int]:
    query = RegistrationAnexo.query.order_by(RegistrationAnexo.id)
    if registration_id is not None:
        query = query.filter_by(registration_id=registration_id)
    if failed_only:
        query = query.filter(RegistrationAnexo.download_status == DOWNLOAD_STATUS_FAILED)
    elif not force:
        query = query.filter(
            RegistrationAnexo.download_status.in_([DOWNLOAD_STATUS_PENDING, DOWNLOAD_STATUS_FAILED])
        )
    if limit is not None:
        query = query.limit(limit)

    rows = query.all()
    ok = failed = skipped = 0
    for i, row in enumerate(rows, start=1):
        if download_anexo(row, force=force):
            ok += 1
        else:
            failed += 1
        if i % _BATCH_COMMIT == 0:
            db.session.commit()
    db.session.commit()
    return {"processed": len(rows), "ok": ok, "failed": failed, "skipped": skipped}


def download_anexos_for_registration(registration_id: int, *, force: bool = False) -> dict[str, int]:
    return download_pending_anexos(registration_id=registration_id, force=force)
