"""catalog tables and clear stage 4 registrations

Revision ID: e0f1a2b3c4d5
Revises: d9e0f1a2b3c4
Create Date: 2026-10-09 14:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "e0f1a2b3c4d5"
down_revision = "d9e0f1a2b3c4"
branch_labels = None
depends_on = None


def _seed_catalog(table: str, descriptions: list[str]) -> None:
    for desc in descriptions:
        escaped = desc.replace("'", "''")
        op.execute(
            f"""
            INSERT INTO {table} (descricao, status)
            SELECT '{escaped}', true
            WHERE NOT EXISTS (SELECT 1 FROM {table} WHERE descricao = '{escaped}')
            """
        )


def upgrade():
    op.create_table(
        "tipo_oportunidade",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("descricao", sa.String(length=255), nullable=False),
        sa.Column("status", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("descricao"),
    )
    op.create_table(
        "tabela_precos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("descricao", sa.String(length=255), nullable=False),
        sa.Column("status", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("descricao"),
    )
    op.create_table(
        "tipo_cliente",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("descricao", sa.String(length=255), nullable=False),
        sa.Column("status", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("descricao"),
    )
    op.create_table(
        "potencial_faturamento_mes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("descricao", sa.String(length=255), nullable=False),
        sa.Column("status", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("descricao"),
    )
    op.create_table(
        "tipo_embalagem",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("descricao", sa.String(length=255), nullable=False),
        sa.Column("status", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("descricao"),
    )
    op.create_table(
        "contatos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("telefone1", sa.String(length=32), nullable=True),
        sa.Column("telefone2", sa.String(length=32), nullable=True),
        sa.Column("tipo_contato", sa.String(length=64), nullable=True),
        sa.Column("status", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id"),
    )

    _seed_catalog("tipo_oportunidade", ["NOVO CLIENTE", "RECONQUISTA", "AUMENTO DE MALHA"])
    _seed_catalog(
        "tabela_precos",
        [
            "CAPITAL / INTERIOR EXPRESS",
            "NORMAL PESO",
            "PERCENTUAL",
            "FASTER / INTERIOR EXPRESS",
            "CAPITAL EXPRESS",
            "DIFERENCIADA",
            "FRETE PESO",
        ],
    )
    _seed_catalog("tipo_cliente", ["EMBARCADOR", "TRANSPORTADOR"])
    _seed_catalog(
        "potencial_faturamento_mes",
        [
            "Grupo A (R$ 50.000 à R$ 100.000)",
            "Grupo B (R$ 10.000 à R$ 50.000)",
            "Grupo C (R$ 2.000 à R$ 10.000)",
            "Grupo D (R$ 0 à R$ 2.000)",
            "Grupo E - Fretes Avulsos (não correntista)",
        ],
    )
    _seed_catalog("tipo_embalagem", ["Personalizado", "Pacote", "Caixa"])

    with op.batch_alter_table("registrations", schema=None) as batch_op:
        batch_op.alter_column("stage_id", existing_type=sa.Integer(), nullable=True)

    op.execute(
        """
        UPDATE registrations
        SET stage_id = NULL
        WHERE stage_id IN (SELECT id FROM registration_stages WHERE sort_order = 4)
        """
    )


def downgrade():
    op.execute(
        """
        UPDATE registrations
        SET stage_id = (SELECT id FROM registration_stages WHERE sort_order = 4 LIMIT 1)
        WHERE stage_id IS NULL
          AND EXISTS (SELECT 1 FROM registration_stages WHERE sort_order = 4)
        """
    )

    with op.batch_alter_table("registrations", schema=None) as batch_op:
        batch_op.alter_column("stage_id", existing_type=sa.Integer(), nullable=False)

    op.drop_table("contatos")
    op.drop_table("tipo_embalagem")
    op.drop_table("potencial_faturamento_mes")
    op.drop_table("tipo_cliente")
    op.drop_table("tabela_precos")
    op.drop_table("tipo_oportunidade")
