from __future__ import annotations

from datetime import date, datetime

from sqlalchemy.dialects.postgresql import JSONB

from bomfim.extensions import db


class Organization(db.Model):
    __tablename__ = "organizations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, default="Bomfim")
    timezone = db.Column(db.String(64), nullable=False, default="America/Sao_Paulo")
    show_operational_warnings = db.Column(db.Boolean, nullable=False, default=True)
    show_activity_summary = db.Column(db.Boolean, nullable=False, default=True)

    units = db.relationship("Unit", back_populates="organization", lazy="dynamic")
    users = db.relationship("User", back_populates="organization", lazy="dynamic")


class Unit(db.Model):
    __tablename__ = "units"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False)
    name = db.Column(db.String(120), nullable=False, unique=True)
    code = db.Column(db.String(16), nullable=False, unique=True)
    locality = db.Column(db.String(255), nullable=False)
    responsible_name = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(32), nullable=False, default="active")

    organization = db.relationship("Organization", back_populates="units")
    users = db.relationship("User", back_populates="unit", lazy="dynamic")
    registrations = db.relationship("Registration", back_populates="unit", lazy="dynamic")


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey("units.id"), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(32), nullable=False)
    status = db.Column(db.String(32), nullable=False, default="active")
    last_access_at = db.Column(db.DateTime(timezone=True), nullable=True)
    photo = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now())

    organization = db.relationship("Organization", back_populates="users")
    unit = db.relationship("Unit", back_populates="users")
    audit_logs = db.relationship("AuditLog", back_populates="user", lazy="dynamic")
    promoted_registrations = db.relationship(
        "Registration",
        foreign_keys="Registration.promoter_id",
        back_populates="promoter",
        lazy="dynamic",
    )
    owned_registrations = db.relationship(
        "Registration",
        foreign_keys="Registration.owner_id",
        back_populates="owner",
        lazy="dynamic",
    )


class RegistrationStage(db.Model):
    __tablename__ = "registration_stages"

    id = db.Column(db.Integer, primary_key=True)
    sort_order = db.Column(db.Integer, nullable=False, unique=True)
    label = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False, default="")

    registrations = db.relationship("Registration", back_populates="stage", lazy="dynamic")


class Registration(db.Model):
    __tablename__ = "registrations"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    cnpj = db.Column(db.String(32), nullable=False, unique=True, index=True)
    contact_email = db.Column(db.String(255), nullable=True)
    postal_code = db.Column(db.String(16), nullable=True)
    contact_name = db.Column(db.String(255), nullable=True)
    usuario_ssw = db.Column(db.String(128), nullable=True)
    price_table = db.Column(db.String(128), nullable=False)
    stage_id = db.Column(db.Integer, db.ForeignKey("registration_stages.id"), nullable=True)
    city = db.Column(db.String(255), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey("units.id"), nullable=False)
    promoter_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    documents_count = db.Column(db.Integer, nullable=False, default=0)
    comments_count = db.Column(db.Integer, nullable=False, default=0)
    updated_at = db.Column(db.Date, nullable=False)
    pipefy_codigo = db.Column(db.String(32), nullable=True, unique=True)
    titulo = db.Column(db.String(512), nullable=True)
    moskit_id = db.Column(db.String(64), nullable=True)
    criado_em = db.Column(db.DateTime(timezone=True), nullable=True)
    atualizado_em = db.Column(db.DateTime(timezone=True), nullable=True)
    finalizado_em = db.Column(db.DateTime(timezone=True), nullable=True)
    tipo_oportunidade_id = db.Column(db.Integer, db.ForeignKey("tipo_oportunidade.id"), nullable=True)
    tabela_precos_id = db.Column(db.Integer, db.ForeignKey("tabela_precos.id"), nullable=True)
    tipo_cliente_id = db.Column(db.Integer, db.ForeignKey("tipo_cliente.id"), nullable=True)
    potencial_faturamento_mes_id = db.Column(
        db.Integer, db.ForeignKey("potencial_faturamento_mes.id"), nullable=True
    )
    tipo_embalagem_id = db.Column(db.Integer, db.ForeignKey("tipo_embalagem.id"), nullable=True)
    razao_social = db.Column(db.String(512), nullable=True)
    nome_fantasia = db.Column(db.String(512), nullable=True)
    segmento = db.Column(db.String(255), nullable=True)
    natureza_carga = db.Column(db.String(255), nullable=True)
    inscricao_estadual = db.Column(db.String(64), nullable=True)
    substituto_tributario_iss = db.Column(db.String(64), nullable=True)
    inscricao_municipal = db.Column(db.String(64), nullable=True)
    endereco = db.Column(db.String(512), nullable=True)
    numero = db.Column(db.String(32), nullable=True)
    complemento = db.Column(db.String(255), nullable=True)
    bairro = db.Column(db.String(255), nullable=True)
    estado = db.Column(db.String(64), nullable=True)
    igual_endereco_cliente = db.Column(db.Boolean, nullable=True)
    endereco_cobranca = db.Column(db.String(512), nullable=True)
    numero_cobranca = db.Column(db.String(32), nullable=True)
    complemento_cobranca = db.Column(db.String(255), nullable=True)
    cep_cobranca = db.Column(db.String(16), nullable=True)
    bairro_cobranca = db.Column(db.String(255), nullable=True)
    cidade_cobranca = db.Column(db.String(255), nullable=True)
    estado_cobranca = db.Column(db.String(64), nullable=True)
    promotor_nome = db.Column(db.String(255), nullable=True)
    promotor_email = db.Column(db.String(255), nullable=True)
    operador_logistico = db.Column(db.String(255), nullable=True)
    contrato_proprio = db.Column(db.String(255), nullable=True)
    licenca_transporte = db.Column(db.Text, nullable=True)
    procedimento_especifico = db.Column(db.Text, nullable=True)
    responsabilidade_seguro = db.Column(db.String(255), nullable=True)
    procedimento_devolucao_comprovantes = db.Column(db.Text, nullable=True)
    detalhamento_envio = db.Column(db.Text, nullable=True)
    endereco_envio_fisico = db.Column(db.Text, nullable=True)
    email_envio_digital = db.Column(db.String(255), nullable=True)
    edi_trabalha = db.Column(db.String(255), nullable=True)
    edi_tipos_arquivo = db.Column(db.Text, nullable=True)
    edi_frequencia = db.Column(db.String(255), nullable=True)
    edi_horarios = db.Column(db.String(255), nullable=True)
    edi_contato = db.Column(db.String(255), nullable=True)
    envio_notfis = db.Column(db.String(255), nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    coleta_automatica = db.Column(db.String(64), nullable=True)
    necessita_assinatura_digital = db.Column(db.String(64), nullable=True)
    nome_assinatura = db.Column(db.String(255), nullable=True)
    email_assinatura = db.Column(db.String(255), nullable=True)
    fase_metricas = db.Column(JSONB, nullable=True)

    organization = db.relationship("Organization")
    stage = db.relationship("RegistrationStage", back_populates="registrations")
    unit = db.relationship("Unit", back_populates="registrations")
    promoter = db.relationship("User", foreign_keys=[promoter_id], back_populates="promoted_registrations")
    owner = db.relationship("User", foreign_keys=[owner_id], back_populates="owned_registrations")
    tipo_oportunidade = db.relationship("TipoOportunidade")
    tabela_precos = db.relationship("TabelaPrecos")
    tipo_cliente = db.relationship("TipoCliente")
    potencial_faturamento_mes = db.relationship("PotencialFaturamentoMes")
    tipo_embalagem = db.relationship("TipoEmbalagem")
    documents = db.relationship("Document", back_populates="registration", lazy="dynamic")
    signatures = db.relationship("SignatureEnvelope", back_populates="registration", lazy="dynamic")
    sync_events = db.relationship("SyncEvent", back_populates="registration", lazy="dynamic")
    integration_links = db.relationship("RegistrationIntegration", back_populates="registration", lazy="dynamic")
    contatos = db.relationship(
        "Contato",
        back_populates="registration",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    anexos = db.relationship(
        "RegistrationAnexo",
        back_populates="registration",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )


class TipoOportunidade(db.Model):
    __tablename__ = "tipo_oportunidade"

    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.String(255), nullable=False, unique=True)
    status = db.Column(db.Boolean, nullable=False, default=True)


class TabelaPrecos(db.Model):
    __tablename__ = "tabela_precos"

    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.String(255), nullable=False, unique=True)
    status = db.Column(db.Boolean, nullable=False, default=True)


class TipoCliente(db.Model):
    __tablename__ = "tipo_cliente"

    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.String(255), nullable=False, unique=True)
    status = db.Column(db.Boolean, nullable=False, default=True)


class PotencialFaturamentoMes(db.Model):
    __tablename__ = "potencial_faturamento_mes"

    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.String(255), nullable=False, unique=True)
    status = db.Column(db.Boolean, nullable=False, default=True)


class TipoEmbalagem(db.Model):
    __tablename__ = "tipo_embalagem"

    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.String(255), nullable=False, unique=True)
    status = db.Column(db.Boolean, nullable=False, default=True)


CONTATO_TIPO_ENVIO_FATURAS = "envio_faturas_dacte"
CONTATO_TIPO_OCORRENCIAS_COMERCIAL = "ocorrencias_comercial"


class Contato(db.Model):
    __tablename__ = "contatos"

    id = db.Column(db.Integer, primary_key=True)
    registration_id = db.Column(db.Integer, db.ForeignKey("registrations.id", ondelete="CASCADE"), nullable=False)
    nome = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=True)
    telefone1 = db.Column(db.String(128), nullable=True)
    telefone2 = db.Column(db.String(128), nullable=True)
    email_ocorrencias = db.Column(db.String(255), nullable=True)
    tipo_contato = db.Column(db.String(64), nullable=False)
    status = db.Column(db.Boolean, nullable=False, default=True)

    registration = db.relationship("Registration", back_populates="contatos")

    __table_args__ = (
        db.UniqueConstraint("registration_id", "tipo_contato", name="uq_contatos_registration_tipo"),
    )


DOWNLOAD_STATUS_PENDING = "pending"
DOWNLOAD_STATUS_OK = "ok"
DOWNLOAD_STATUS_FAILED = "failed"
DOWNLOAD_STATUS_SKIPPED = "skipped"


class RegistrationAnexo(db.Model):
    __tablename__ = "registration_anexos"

    id = db.Column(db.Integer, primary_key=True)
    registration_id = db.Column(db.Integer, db.ForeignKey("registrations.id", ondelete="CASCADE"), nullable=False)
    url = db.Column(db.Text, nullable=False)
    filename = db.Column(db.String(512), nullable=True)
    ordem = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now())
    local_path = db.Column(db.String(1024), nullable=True)
    download_status = db.Column(db.String(32), nullable=False, default=DOWNLOAD_STATUS_PENDING)
    download_error = db.Column(db.Text, nullable=True)
    downloaded_at = db.Column(db.DateTime(timezone=True), nullable=True)
    file_size = db.Column(db.BigInteger, nullable=True)

    registration = db.relationship("Registration", back_populates="anexos")

    __table_args__ = (
        db.UniqueConstraint("registration_id", "url", name="uq_registration_anexo_url"),
    )


class Integration(db.Model):
    __tablename__ = "integrations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False, unique=True)
    active = db.Column(db.Boolean, nullable=False, default=True)
    last_sync_at = db.Column(db.DateTime(timezone=True), nullable=True)

    registration_links = db.relationship("RegistrationIntegration", back_populates="integration", lazy="dynamic")


class RegistrationIntegration(db.Model):
    __tablename__ = "registration_integrations"

    id = db.Column(db.Integer, primary_key=True)
    registration_id = db.Column(db.Integer, db.ForeignKey("registrations.id"), nullable=False)
    integration_id = db.Column(db.Integer, db.ForeignKey("integrations.id"), nullable=False)
    status = db.Column(db.String(64), nullable=False, default="Sincronizado")

    registration = db.relationship("Registration", back_populates="integration_links")
    integration = db.relationship("Integration", back_populates="registration_links")

    __table_args__ = (db.UniqueConstraint("registration_id", "integration_id", name="uq_reg_integration"),)


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    registration_id = db.Column(db.Integer, db.ForeignKey("registrations.id"), nullable=True)
    filename = db.Column(db.String(255), nullable=False)
    doc_type = db.Column(db.String(64), nullable=False, default="PDF")
    uploaded_by_name = db.Column(db.String(255), nullable=False)
    uploaded_at = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(64), nullable=False)

    registration = db.relationship("Registration", back_populates="documents")


class SignatureEnvelope(db.Model):
    __tablename__ = "signature_envelopes"

    id = db.Column(db.Integer, primary_key=True)
    registration_id = db.Column(db.Integer, db.ForeignKey("registrations.id"), nullable=False)
    document_title = db.Column(db.String(255), nullable=False, default="Contrato de transporte")
    sent_at = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(64), nullable=False)
    last_updated_at = db.Column(db.Date, nullable=False)

    registration = db.relationship("Registration", back_populates="signatures")


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    occurred_at = db.Column(db.DateTime(timezone=True), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    event = db.Column(db.String(255), nullable=False)
    resource = db.Column(db.String(255), nullable=False)
    result = db.Column(db.String(64), nullable=False, default="Concluído")

    user = db.relationship("User", back_populates="audit_logs")


class EmailTemplate(db.Model):
    __tablename__ = "email_templates"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    trigger = db.Column(db.String(255), nullable=False)
    last_reviewed_at = db.Column(db.Date, nullable=False)


class SyncEvent(db.Model):
    __tablename__ = "sync_events"

    id = db.Column(db.Integer, primary_key=True)
    registration_id = db.Column(db.Integer, db.ForeignKey("registrations.id"), nullable=False)
    operation = db.Column(db.String(255), nullable=False, default="Atualização de contato")
    occurred_at = db.Column(db.DateTime(timezone=True), nullable=False)
    status = db.Column(db.String(64), nullable=False, default="Sincronizado")

    registration = db.relationship("Registration", back_populates="sync_events")
