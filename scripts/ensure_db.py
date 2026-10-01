"""Create PostgreSQL database `bomfim` if missing (uses DATABASE_URL from .env)."""
from __future__ import annotations

import os
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
url = os.environ.get("DATABASE_URL", "")
if not url:
    print("DATABASE_URL not set", file=sys.stderr)
    sys.exit(1)

base = url.rsplit("/", 1)[0] + "/postgres"
if base.startswith("postgresql://"):
    base = base.replace("postgresql://", "postgresql+psycopg2://", 1)
engine = create_engine(base, isolation_level="AUTOCOMMIT")
with engine.connect() as conn:
    exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = 'bomfim'")).scalar()
    if not exists:
        conn.execute(text("CREATE DATABASE bomfim"))
        print("Created database bomfim")
    else:
        print("Database bomfim already exists")
