from __future__ import annotations

import re
from pathlib import Path

from flask import Blueprint, current_app, jsonify, send_from_directory

report_projeto_bp = Blueprint("report_projeto", __name__)

_REPORT_HTML = re.compile(r"^report-(\d+)\.html$", re.IGNORECASE)


def report_projeto_directory() -> Path:
    return Path(current_app.config["REPORT_PROJETO_ROOT"])


def ensure_report_projeto_dir() -> Path:
    directory = report_projeto_directory()
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _list_report_files(directory: Path) -> list[tuple[int, str]]:
    if not directory.is_dir():
        return []
    found: list[tuple[int, str]] = []
    for path in directory.iterdir():
        if not path.is_file():
            continue
        match = _REPORT_HTML.match(path.name)
        if match:
            found.append((int(match.group(1)), path.name))
    found.sort(key=lambda item: item[0])
    return found


@report_projeto_bp.get("/api/public/reports-projeto")
def list_reports_projeto():
    directory = ensure_report_projeto_dir()
    items = []
    for number, filename in _list_report_files(directory):
        items.append(
            {
                "filename": filename,
                "number": number,
                "title": f"Report {number:02d}",
                "url": f"/reports-projeto/{filename}",
            }
        )
    return jsonify({"items": items})


@report_projeto_bp.get("/reports-projeto/<filename>")
def serve_report_html(filename: str):
    if not _REPORT_HTML.match(filename):
        return jsonify({"error": "Arquivo não permitido."}), 404
    directory = ensure_report_projeto_dir()
    path = (directory / filename).resolve()
    if path.parent != directory.resolve() or not path.is_file():
        return jsonify({"error": "Relatório não encontrado."}), 404
    return send_from_directory(directory, filename, mimetype="text/html; charset=utf-8")
