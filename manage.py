from __future__ import annotations

import os

import bomfim.models  # noqa: F401 — registra models no Flask-Migrate

from bomfim import create_app
from bomfim.seed import run_seed

app = create_app()


@app.cli.command("seed")
def seed_command():
    """Popula o banco com dados das telas (idempotente)."""
    run_seed()
    print("Seed concluído.")


if __name__ == "__main__":
    port = int(os.environ.get("API_PORT", "5001"))
    use_reloader = os.environ.get("FLASK_DEBUG", "1") not in ("0", "false", "False")
    app.run(host="127.0.0.1", port=port, debug=use_reloader, use_reloader=use_reloader)
