"""Quick status check for remote/local PostgreSQL (uses .env)."""
from __future__ import annotations

import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from scripts.db_url import sqlalchemy_url

load_dotenv()


def main() -> None:
    maint = create_engine(sqlalchemy_url(maintenance=True), connect_args={"connect_timeout": 15})
    with maint.connect() as conn:
        exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = 'bomfim'")).scalar()
        print(f"database bomfim: {'exists' if exists else 'missing'}")

    if not exists:
        return

    app = create_engine(sqlalchemy_url(), connect_args={"connect_timeout": 15})
    with app.connect() as conn:
        tables = conn.execute(
            text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1")
        ).fetchall()
        print("tables:", [t[0] for t in tables] or "(none)")
        if tables:
            for table in ("registrations", "units", "users"):
                if any(t[0] == table for t in tables):
                    n = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                    print(f"  {table}: {n} rows")


if __name__ == "__main__":
    main()
