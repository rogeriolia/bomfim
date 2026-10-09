"""rename integration Documentos to Zapier

Revision ID: c8d9e0f1a2b3
Revises: b7c8d9e0f1a2
Create Date: 2026-10-09 13:10:00.000000

"""
from alembic import op


revision = "c8d9e0f1a2b3"
down_revision = "b7c8d9e0f1a2"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE integrations SET name = 'Zapier' WHERE name = 'Documentos'")


def downgrade():
    op.execute("UPDATE integrations SET name = 'Documentos' WHERE name = 'Zapier'")
