from __future__ import annotations

import os

import bomfim.models  # noqa: F401 — registra models no Flask-Migrate

from bomfim import create_app
from pathlib import Path

import click

from bomfim.default_owner import assign_default_owner_to_all_registrations
from bomfim.import_clientes import import_clientes_csv, sync_responsaveis_from_csv
from bomfim.anexo_download import download_pending_anexos
from bomfim.import_pipefy_xlsx import import_pipefy_xlsx
from bomfim.storage_paths import ensure_storage_dirs
from bomfim.verify_anexos_import import verify_anexos_import
from bomfim.seed import run_seed, run_seed_users

app = create_app()


@app.cli.command("seed")
def seed_command():
    """Popula o banco com dados das telas (idempotente)."""
    run_seed()
    print("Seed concluído.")


@app.cli.command("seed-users")
def seed_users_command():
    """Cria/atualiza usuários do README (senha 123456789)."""
    run_seed_users()
    print("Usuários seed concluídos.")


@app.cli.command("fix-default-owners")
def fix_default_owners_command():
    """Aplica Usuário Bomfim como responsável nos cadastros sem owner."""
    n = assign_default_owner_to_all_registrations()
    print(f"Responsável padrão aplicado em {n} cadastro(s).")


@app.cli.command("sync-responsaveis")
@click.argument("csv_path", type=click.Path(exists=True, path_type=Path))
def sync_responsaveis_command(csv_path: Path):
    """Atualiza responsáveis (coluna VENDEDOR) nos cadastros existentes."""
    stats = sync_responsaveis_from_csv(csv_path)
    print(
        f"Sincronização concluída: {stats['updated']} atualizados, "
        f"{stats['missing']} CNPJs não encontrados, {stats['skipped']} linhas ignoradas."
    )


@app.cli.command("import-clientes")
@click.argument("csv_path", type=click.Path(exists=True, path_type=Path))
@click.option("--replace", is_flag=True, help="Remove cadastros existentes antes de importar.")
def import_clientes_command(csv_path: Path, replace: bool):
    """Importa cadastros a partir do CSV operacional (CLIENTES COM MOVIMENTAÇÃO)."""
    stats = import_clientes_csv(csv_path, replace_existing=replace)
    print(
        f"Importação concluída: {stats['created']} criados, "
        f"{stats['updated']} atualizados, {stats['skipped']} ignorados."
    )


@app.cli.command("import-pipefy-xlsx")
@click.argument("xlsx_path", type=click.Path(exists=True, path_type=Path))
@click.option("--download-anexos", is_flag=True, help="Baixa PDFs para storage/ após cada cadastro.")
def import_pipefy_xlsx_command(xlsx_path: Path, download_anexos: bool):
    """Importa ou atualiza cadastros a partir do relatório Pipefy (XLSX)."""
    ensure_storage_dirs()
    stats = import_pipefy_xlsx(xlsx_path, download_anexos=download_anexos)
    warnings = stats.get("warnings") or []
    print(
        f"Importação Pipefy concluída: {stats['created']} criados, "
        f"{stats['updated']} atualizados, {stats['skipped']} ignorados, "
        f"{stats['contacts']} contatos, {stats['anexos']} anexos."
    )
    if download_anexos:
        print(
            f"Downloads: {stats.get('anexos_downloaded_ok', 0)} ok, "
            f"{stats.get('anexos_download_failed', 0)} falhas."
        )
    if warnings:
        print(f"Avisos ({len(warnings)}):")
        for msg in warnings[:20]:
            print(f"  - {msg}")
        if len(warnings) > 20:
            print(f"  ... e mais {len(warnings) - 20}")


@app.cli.command("download-anexos")
@click.option("--failed-only", is_flag=True, help="Somente anexos com status failed.")
@click.option("--limit", type=int, default=None, help="Limitar quantidade processada.")
@click.option("--registration-id", type=int, default=None, help="Filtrar por cadastro.")
@click.option("--force", is_flag=True, help="Rebaixar mesmo anexos já ok.")
def download_anexos_command(failed_only: bool, limit: int | None, registration_id: int | None, force: bool):
    """Baixa anexos Pipefy para STORAGE_ROOT."""
    ensure_storage_dirs()
    stats = download_pending_anexos(
        registration_id=registration_id,
        limit=limit,
        failed_only=failed_only,
        force=force,
    )
    print(
        f"Download concluído: {stats['processed']} processados, "
        f"{stats['ok']} ok, {stats['failed']} falhas."
    )


@app.cli.command("verify-anexos-import")
@click.option("--xlsx", "xlsx_path", type=click.Path(exists=True, path_type=Path), default=None)
@click.option("--output", "output_csv", type=click.Path(path_type=Path), default=None)
def verify_anexos_import_command(xlsx_path: Path | None, output_csv: Path | None):
    """Relatório de anexos: banco, disco e opcional comparação com XLSX."""
    summary = verify_anexos_import(xlsx_path=xlsx_path, output_csv=output_csv)
    print(f"Total no banco: {summary['total_db']}")
    print(f"OK com arquivo: {summary['ok_with_file']}")
    print(f"Pendentes: {summary['pending']}")
    print(f"Falhas download: {summary['failed']}")
    print(f"OK sem arquivo no disco: {summary['ok_missing_file']}")
    print(f"Arquivos órfãos: {summary['orphan_files']}")
    if xlsx_path:
        print(f"URLs no XLSX ausentes no banco: {summary['missing_in_db']}")
        print(f"URLs no banco extras vs XLSX: {summary['extra_in_db']}")
    if output_csv:
        print(f"Relatório CSV: {output_csv}")


if __name__ == "__main__":
    port = int(os.environ.get("API_PORT", "5001"))
    use_reloader = os.environ.get("FLASK_DEBUG", "1") not in ("0", "false", "False")
    app.run(host="127.0.0.1", port=port, debug=use_reloader, use_reloader=use_reloader)
