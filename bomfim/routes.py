"""Rotas da aplicação Bomfim."""

from flask import Blueprint, render_template


main = Blueprint('main', __name__)


@main.get('/')
def index():
    """Exibe a página inicial."""
    return render_template('index.html')
