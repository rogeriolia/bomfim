"""widen contatos telefone columns

Revision ID: i4c5d6e7f8g9
Revises: h3b4c5d6e7f8
Create Date: 2026-10-09 15:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "i4c5d6e7f8g9"
down_revision = "h3b4c5d6e7f8"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("contatos", schema=None) as batch_op:
        batch_op.alter_column("telefone1", existing_type=sa.String(length=32), type_=sa.String(length=128))
        batch_op.alter_column("telefone2", existing_type=sa.String(length=32), type_=sa.String(length=128))


def downgrade():
    with op.batch_alter_table("contatos", schema=None) as batch_op:
        batch_op.alter_column("telefone2", existing_type=sa.String(length=128), type_=sa.String(length=32))
        batch_op.alter_column("telefone1", existing_type=sa.String(length=128), type_=sa.String(length=32))
