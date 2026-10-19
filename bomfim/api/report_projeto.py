from __future__ import annotations

import re
from pathlib import Path

from flask import Blueprint, current_app, jsonify, redirect, send_from_directory
from markupsafe import escape

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


def _reports_index_html(directory: Path) -> str:
    rows = []
    for number, filename in _list_report_files(directory):
        title = escape(f"Report {number:02d}")
        href = escape(f"/reports-projeto/{filename}")
        num = escape(f"{number:02d}")
        rows.append(
            f'<li><a href="{href}"><span class="num">{num}</span> {title}</a></li>'
        )
    if rows:
        list_block = "<ol>\n" + "\n".join(rows) + "\n</ol>"
    else:
        list_block = '<p class="empty">Nenhum report publicado ainda.</p>'
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reports projeto — Bomfim</title>
  <style>
    body {{ font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center;
      background: #f4f6f9; color: #171c27; }}
    .panel {{ width: min(480px, 100%); padding: 40px 36px; background: #fff; border-radius: 14px;
      box-shadow: 0 12px 40px #171c2714; }}
    .eyebrow {{ font-size: 0.7rem; letter-spacing: 0.08em; color: #6b7280; font-weight: 600; }}
    h1 {{ margin: 8px 0 6px; font-size: 1.5rem; }}
    p {{ margin: 0 0 16px; color: #6b7280; line-height: 1.55; }}
    ol {{ list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }}
    ol a {{ display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid #e5e7eb;
      border-radius: 10px; color: inherit; text-decoration: none; }}
    ol a:hover {{ background: #f9fafb; border-color: #d1d5db; }}
    .num {{ font-weight: 600; color: #1e3a5f; min-width: 2ch; }}
    .back {{ display: inline-block; margin-top: 16px; font-size: 0.875rem; color: #6b7280; }}
    .empty {{ color: #6b7280; }}
  </style>
</head>
<body>
  <main class="panel">
    <span class="eyebrow">ACESSO PÚBLICO</span>
    <h1>Reports projeto</h1>
    <p>Documentos HTML publicados para consulta, sem necessidade de login.</p>
    {list_block}
    <a class="back" href="/login">Voltar ao login</a>
  </main>
</body>
</html>"""


@report_projeto_bp.get("/reports-projeto")
@report_projeto_bp.get("/reports-projeto/")
def reports_projeto_index():
    """Listagem pública servida pela API (produção nginx → Flask, igual aos .html)."""
    directory = ensure_report_projeto_dir()
    return _reports_index_html(directory), 200, {"Content-Type": "text/html; charset=utf-8"}


@report_projeto_bp.get("/report-projeto")
@report_projeto_bp.get("/report-projeto/")
def reports_projeto_legacy_redirect():
    return redirect("/reports-projeto", code=302)


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
