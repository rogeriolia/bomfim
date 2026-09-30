"""Ponto de entrada para o servidor de produção."""

from bomfim import create_app
from bomfim.config import ProductionConfig

app = create_app(ProductionConfig)
