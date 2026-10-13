"""registration_anexos local storage columns

Revision ID: j5c6d7e8f9g0
Revises: i4c5d6e7f8g9
Create Date: 2026-10-13 09:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "j5c6d7e8f9g0"
down_revision = "i4c5d6e7f8g9"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("registration_anexos", schema=None) as batch_op:
        batch_op.add_column(sa.Column("local_path", sa.String(length=1024), nullable=True))
        batch_op.add_column(
            sa.Column("download_status", sa.String(length=32), nullable=False, server_default="pending")
        )
        batch_op.add_column(sa.Column("download_error", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("downloaded_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("file_size", sa.BigInteger(), nullable=True))
        batch_op.create_index("ix_registration_anexos_download_status", ["download_status"], unique=False)


def downgrade():
    with op.batch_alter_table("registration_anexos", schema=None) as batch_op:
        batch_op.drop_index("ix_registration_anexos_download_status")
        batch_op.drop_column("file_size")
        batch_op.drop_column("downloaded_at")
        batch_op.drop_column("download_error")
        batch_op.drop_column("download_status")
        batch_op.drop_column("local_path")
