"""add integration Pipefy

Revision ID: d9e0f1a2b3c4
Revises: c8d9e0f1a2b3
Create Date: 2026-10-09 13:20:00.000000

"""
from alembic import op


revision = "d9e0f1a2b3c4"
down_revision = "c8d9e0f1a2b3"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        INSERT INTO integrations (name, active, last_sync_at)
        SELECT 'Pipefy', true, TIMEZONE('utc', NOW())
        WHERE NOT EXISTS (SELECT 1 FROM integrations WHERE name = 'Pipefy')
        """
    )


def downgrade():
    op.execute("DELETE FROM integrations WHERE name = 'Pipefy'")
