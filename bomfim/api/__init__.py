from bomfim.api.auth import auth_bp
from bomfim.api.registrations import registrations_bp
from bomfim.api.resources import resources_bp
from bomfim.api.users import users_bp


def register_blueprints(app):
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(registrations_bp, url_prefix="/api/registrations")
    app.register_blueprint(resources_bp, url_prefix="/api")
