"""Create PostgreSQL database `bomfim` if missing (uses DATABASE_URL from .env)."""
from __future__ import annotations

import os
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.db_url import sqlalchemy_url

engine = create_engine(sqlalchemy_url(maintenance=True), isolation_level="AUTOCOMMIT")
with engine.connect() as conn:
    exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = 'bomfim'")).scalar()
    if not exists:
        conn.execute(text("CREATE DATABASE bomfim"))
        print("Created database bomfim")
    else:
        print("Database bomfim already exists")
