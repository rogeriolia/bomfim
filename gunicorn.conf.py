"""Configuração do Gunicorn para deploy em Linux."""

import os

bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
workers = int(os.getenv('WEB_CONCURRENCY', '2'))
accesslog = '-'
errorlog = '-'
reload = False
