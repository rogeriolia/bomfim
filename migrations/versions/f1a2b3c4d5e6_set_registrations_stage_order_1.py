"""set all registrations to stage sort_order 1

Revision ID: f1a2b3c4d5e6
Revises: e0f1a2b3c4d5
Create Date: 2026-10-09 14:20:00.000000

"""
from alembic import op


revision = "f1a2b3c4d5e6"
down_revision = "e0f1a2b3c4d5"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        UPDATE registrations
        SET stage_id = (SELECT id FROM registration_stages WHERE sort_order = 1 LIMIT 1)
        WHERE EXISTS (SELECT 1 FROM registration_stages WHERE sort_order = 1)
        """
    )


def downgrade():
    pass
