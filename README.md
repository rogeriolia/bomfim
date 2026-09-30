# Bomfim

## Desenvolvimento local (Windows)

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe run.py
```

Acesse http://localhost:5000.

## Produção (Linux)

No ambiente virtual do servidor, execute a partir da raiz do projeto:

```sh
python -m pip install -r requirements.txt
gunicorn --config gunicorn.conf.py wsgi:app
```

O ponto de entrada `wsgi.py` sempre usa `ProductionConfig`, com debug
desativado. O Gunicorn usa a porta definida em `PORT` (padrão: 8000) e
`WEB_CONCURRENCY` processos (padrão: 2), sem recarregamento automático.
Configure `SECRET_KEY` nas variáveis de ambiente do serviço quando usar sessões.
Os arquivos `.env` não são carregados automaticamente por esta configuração.

O Gunicorn requer Unix/Linux para executar; no Windows, use `run.py`
para desenvolvimento. A instalação do pacote no Windows não permite
executar o servidor Gunicorn nativamente.
