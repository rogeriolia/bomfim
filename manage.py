from __future__ import annotations

import os

import bomfim.models  # noqa: F401 — registra models no Flask-Migrate

from bomfim import create_app
from pathlib import Path

import click

from bomfim.default_owner import assign_default_owner_to_all_registrations
from bomfim.import_clientes import import_clientes_csv, sync_responsaveis_from_csv
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


if __name__ == "__main__":
    port = int(os.environ.get("API_PORT", "5001"))
    use_reloader = os.environ.get("FLASK_DEBUG", "1") not in ("0", "false", "False")
    app.run(host="127.0.0.1", port=port, debug=use_reloader, use_reloader=use_reloader)
