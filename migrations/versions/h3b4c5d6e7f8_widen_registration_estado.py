"""widen registration estado columns

Revision ID: h3b4c5d6e7f8
Revises: g2a3b4c5d6e7
Create Date: 2026-10-09 15:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "h3b4c5d6e7f8"
down_revision = "g2a3b4c5d6e7"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("registrations", schema=None) as batch_op:
        batch_op.alter_column("estado", existing_type=sa.String(length=8), type_=sa.String(length=64))
        batch_op.alter_column("estado_cobranca", existing_type=sa.String(length=8), type_=sa.String(length=64))


def downgrade():
    with op.batch_alter_table("registrations", schema=None) as batch_op:
        batch_op.alter_column("estado_cobranca", existing_type=sa.String(length=64), type_=sa.String(length=8))
        batch_op.alter_column("estado", existing_type=sa.String(length=64), type_=sa.String(length=8))
