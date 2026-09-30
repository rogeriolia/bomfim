"""Criação da aplicação Bomfim."""

from flask import Flask

from .config import DevelopmentConfig
from .routes import main


def create_app(config_class=DevelopmentConfig):
    """Cria a aplicação com a configuração do ambiente selecionado."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    app.register_blueprint(main)

    return app
