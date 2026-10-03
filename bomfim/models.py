from __future__ import annotations

from datetime import date, datetime

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
    stage_id = db.Column(db.Integer, db.ForeignKey("registration_stages.id"), nullable=False)
    city = db.Column(db.String(255), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey("units.id"), nullable=False)
    promoter_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    documents_count = db.Column(db.Integer, nullable=False, default=0)
    comments_count = db.Column(db.Integer, nullable=False, default=0)
    updated_at = db.Column(db.Date, nullable=False)

    organization = db.relationship("Organization")
    stage = db.relationship("RegistrationStage", back_populates="registrations")
    unit = db.relationship("Unit", back_populates="registrations")
    promoter = db.relationship("User", foreign_keys=[promoter_id], back_populates="promoted_registrations")
    owner = db.relationship("User", foreign_keys=[owner_id], back_populates="owned_registrations")
    documents = db.relationship("Document", back_populates="registration", lazy="dynamic")
    signatures = db.relationship("SignatureEnvelope", back_populates="registration", lazy="dynamic")
    sync_events = db.relationship("SyncEvent", back_populates="registration", lazy="dynamic")
    integration_links = db.relationship("RegistrationIntegration", back_populates="registration", lazy="dynamic")


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
