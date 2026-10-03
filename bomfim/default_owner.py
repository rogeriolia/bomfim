"""Responsável padrão de cadastros (clientes sem owner explícito)."""
from __future__ import annotations

from bomfim.extensions import db
from bomfim.models import Organization, Registration, Unit, User
from bomfim.security import hash_password

DEFAULT_OWNER_NAME = "Usuário Bomfim"
DEFAULT_OWNER_EMAIL = "usuario@bomfim.com.br"
DEFAULT_OWNER_PASSWORD = "123456789"


def ensure_default_owner_user(org: Organization | None = None) -> User:
    org = org or Organization.query.first()
    if org is None:
        raise RuntimeError("Organização não encontrada.")

    user = User.query.filter_by(email=DEFAULT_OWNER_EMAIL).first()
    unit = Unit.query.filter_by(code="SSA").first() or Unit.query.order_by(Unit.id).first()
    pwd_hash = hash_password(DEFAULT_OWNER_PASSWORD)

    if user is None:
        user = User(
            organization_id=org.id,
            unit_id=unit.id if unit else None,
            name=DEFAULT_OWNER_NAME,
            email=DEFAULT_OWNER_EMAIL,
            role="manager",
            password_hash=pwd_hash,
            status="active",
        )
        db.session.add(user)
    else:
        user.name = DEFAULT_OWNER_NAME
        user.role = "manager"
        user.organization_id = org.id
        if unit is not None:
            user.unit_id = unit.id
        user.password_hash = pwd_hash
        user.status = "active"

    db.session.flush()
    return user


def assign_default_owner_to_registrations_without_owner(org: Organization | None = None) -> int:
    owner = ensure_default_owner_user(org)
    org = org or Organization.query.first()
    q = Registration.query.filter(Registration.owner_id.is_(None))
    if org is not None:
        q = q.filter_by(organization_id=org.id)
    count = q.update({Registration.owner_id: owner.id}, synchronize_session=False)
    db.session.commit()
    return count


def assign_default_owner_to_all_registrations(org: Organization | None = None) -> int:
    """Reaplica o responsável padrão em todos os cadastros (carga inicial)."""
    owner = ensure_default_owner_user(org)
    org = org or Organization.query.first()
    q = Registration.query
    if org is not None:
        q = q.filter_by(organization_id=org.id)
    count = q.update({Registration.owner_id: owner.id}, synchronize_session=False)
    db.session.commit()
    return count
