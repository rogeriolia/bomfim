"""pipefy import schema: registrations fields, contatos link, anexos

Revision ID: g2a3b4c5d6e7
Revises: f1a2b3c4d5e6
Create Date: 2026-10-09 14:40:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "g2a3b4c5d6e7"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("DELETE FROM contatos")

    with op.batch_alter_table("registrations", schema=None) as batch_op:
        batch_op.add_column(sa.Column("pipefy_codigo", sa.String(length=32), nullable=True))
        batch_op.add_column(sa.Column("titulo", sa.String(length=512), nullable=True))
        batch_op.add_column(sa.Column("moskit_id", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("criado_em", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("finalizado_em", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("tipo_oportunidade_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("tabela_precos_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("tipo_cliente_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("potencial_faturamento_mes_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("tipo_embalagem_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("razao_social", sa.String(length=512), nullable=True))
        batch_op.add_column(sa.Column("nome_fantasia", sa.String(length=512), nullable=True))
        batch_op.add_column(sa.Column("segmento", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("natureza_carga", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("inscricao_estadual", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("substituto_tributario_iss", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("inscricao_municipal", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("endereco", sa.String(length=512), nullable=True))
        batch_op.add_column(sa.Column("numero", sa.String(length=32), nullable=True))
        batch_op.add_column(sa.Column("complemento", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("bairro", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("estado", sa.String(length=8), nullable=True))
        batch_op.add_column(sa.Column("igual_endereco_cliente", sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column("endereco_cobranca", sa.String(length=512), nullable=True))
        batch_op.add_column(sa.Column("numero_cobranca", sa.String(length=32), nullable=True))
        batch_op.add_column(sa.Column("complemento_cobranca", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("cep_cobranca", sa.String(length=16), nullable=True))
        batch_op.add_column(sa.Column("bairro_cobranca", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("cidade_cobranca", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("estado_cobranca", sa.String(length=8), nullable=True))
        batch_op.add_column(sa.Column("promotor_nome", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("promotor_email", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("operador_logistico", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("contrato_proprio", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("licenca_transporte", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("procedimento_especifico", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("responsabilidade_seguro", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("procedimento_devolucao_comprovantes", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("detalhamento_envio", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("endereco_envio_fisico", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("email_envio_digital", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("edi_trabalha", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("edi_tipos_arquivo", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("edi_frequencia", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("edi_horarios", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("edi_contato", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("envio_notfis", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("observacoes", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("coleta_automatica", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("necessita_assinatura_digital", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("nome_assinatura", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("email_assinatura", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("fase_metricas", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
        batch_op.create_foreign_key(
            "fk_registrations_tipo_oportunidade",
            "tipo_oportunidade",
            ["tipo_oportunidade_id"],
            ["id"],
        )
        batch_op.create_foreign_key(
            "fk_registrations_tabela_precos",
            "tabela_precos",
            ["tabela_precos_id"],
            ["id"],
        )
        batch_op.create_foreign_key(
            "fk_registrations_tipo_cliente",
            "tipo_cliente",
            ["tipo_cliente_id"],
            ["id"],
        )
        batch_op.create_foreign_key(
            "fk_registrations_potencial_faturamento",
            "potencial_faturamento_mes",
            ["potencial_faturamento_mes_id"],
            ["id"],
        )
        batch_op.create_foreign_key(
            "fk_registrations_tipo_embalagem",
            "tipo_embalagem",
            ["tipo_embalagem_id"],
            ["id"],
        )
        batch_op.create_unique_constraint("uq_registrations_pipefy_codigo", ["pipefy_codigo"])

    with op.batch_alter_table("contatos", schema=None) as batch_op:
        batch_op.add_column(sa.Column("registration_id", sa.Integer(), nullable=False))
        batch_op.add_column(sa.Column("email_ocorrencias", sa.String(length=255), nullable=True))
        batch_op.create_foreign_key(
            "fk_contatos_registration",
            "registrations",
            ["registration_id"],
            ["id"],
            ondelete="CASCADE",
        )
        batch_op.create_unique_constraint("uq_contatos_registration_tipo", ["registration_id", "tipo_contato"])

    op.create_table(
        "registration_anexos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("registration_id", sa.Integer(), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("filename", sa.String(length=512), nullable=True),
        sa.Column("ordem", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["registration_id"], ["registrations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("registration_id", "url", name="uq_registration_anexo_url"),
    )


def downgrade():
    op.drop_table("registration_anexos")

    with op.batch_alter_table("contatos", schema=None) as batch_op:
        batch_op.drop_constraint("uq_contatos_registration_tipo", type_="unique")
        batch_op.drop_constraint("fk_contatos_registration", type_="foreignkey")
        batch_op.drop_column("email_ocorrencias")
        batch_op.drop_column("registration_id")

    with op.batch_alter_table("registrations", schema=None) as batch_op:
        batch_op.drop_constraint("uq_registrations_pipefy_codigo", type_="unique")
        batch_op.drop_constraint("fk_registrations_tipo_embalagem", type_="foreignkey")
        batch_op.drop_constraint("fk_registrations_potencial_faturamento", type_="foreignkey")
        batch_op.drop_constraint("fk_registrations_tipo_cliente", type_="foreignkey")
        batch_op.drop_constraint("fk_registrations_tabela_precos", type_="foreignkey")
        batch_op.drop_constraint("fk_registrations_tipo_oportunidade", type_="foreignkey")
        for col in (
            "fase_metricas",
            "email_assinatura",
            "nome_assinatura",
            "necessita_assinatura_digital",
            "coleta_automatica",
            "observacoes",
            "envio_notfis",
            "edi_contato",
            "edi_horarios",
            "edi_frequencia",
            "edi_tipos_arquivo",
            "edi_trabalha",
            "email_envio_digital",
            "endereco_envio_fisico",
            "detalhamento_envio",
            "procedimento_devolucao_comprovantes",
            "responsabilidade_seguro",
            "procedimento_especifico",
            "licenca_transporte",
            "contrato_proprio",
            "operador_logistico",
            "promotor_email",
            "promotor_nome",
            "estado_cobranca",
            "cidade_cobranca",
            "bairro_cobranca",
            "cep_cobranca",
            "complemento_cobranca",
            "numero_cobranca",
            "endereco_cobranca",
            "igual_endereco_cliente",
            "estado",
            "bairro",
            "complemento",
            "numero",
            "endereco",
            "inscricao_municipal",
            "substituto_tributario_iss",
            "inscricao_estadual",
            "natureza_carga",
            "segmento",
            "nome_fantasia",
            "razao_social",
            "tipo_embalagem_id",
            "potencial_faturamento_mes_id",
            "tipo_cliente_id",
            "tabela_precos_id",
            "tipo_oportunidade_id",
            "finalizado_em",
            "atualizado_em",
            "criado_em",
            "moskit_id",
            "titulo",
            "pipefy_codigo",
        ):
            batch_op.drop_column(col)
