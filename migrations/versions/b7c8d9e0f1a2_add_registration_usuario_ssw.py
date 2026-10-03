"""add registration usuario_ssw

Revision ID: b7c8d9e0f1a2
Revises: a1b2c3d4e5f6
Create Date: 2026-10-03 12:25:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "b7c8d9e0f1a2"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("registrations", sa.Column("usuario_ssw", sa.String(length=128), nullable=True))


def downgrade():
    op.drop_column("registrations", "usuario_ssw")
