# Deploy no servidor (VPS)

Fluxo recomendado após enviar o código para o servidor (rsync, SFTP, Git pull, etc.):

```bash
cd /var/www/bomfim   # pasta do projeto no servidor
bash deploy/post-upload.sh
```

O script **não** envia arquivos; ele assume que o código já está no disco e então:

1. Instala dependências Python (`requirements-prod.txt` → Flask + **gunicorn**)
2. Roda `flask db upgrade` (PostgreSQL via `.env`)
3. Faz `npm ci` + `npm run build` em `bomfim-app/` (gera `dist/` para o Nginx)
4. Reinicia o serviço systemd da API (se existir)
5. Recarrega o Nginx (se instalado)
6. Testa `GET /api/health`

## Antes do primeiro deploy

1. **Python 3.11+**, **Node.js 20+**, **PostgreSQL** no mesmo VPS (`DB_HOST=127.0.0.1` no `.env`).
2. Crie o venv e o banco:

   ```bash
   python3 -m venv .venv
   .venv/bin/pip install -r requirements-prod.txt
   python scripts/ensure_db.py
   cp .env.example .env   # edite senhas, SECRET_KEY, CORS_ORIGINS
   export FLASK_APP=manage.py
   .venv/bin/flask db upgrade
   RUN_SEED=1 bash deploy/post-upload.sh   # ou: flask seed uma vez
   ```

3. **systemd** — copie e ajuste [`bomfim-api.service.example`](bomfim-api.service.example):

   ```bash
   sudo cp deploy/bomfim-api.service.example /etc/systemd/system/bomfim-api.service
   sudo systemctl daemon-reload
   sudo systemctl enable --now bomfim-api
   ```

4. **Nginx** — copie [`nginx.bomfim.example.conf`](nginx.bomfim.example.conf), aponte `root` para `.../bomfim-app/dist` e `proxy_pass` para a API em `127.0.0.1:5001`.

## Variáveis opcionais

Copie [`deploy.env.example`](deploy.env.example) para `deploy/deploy.env` no servidor:

| Variável | Descrição |
|----------|-----------|
| `BOMFIM_SERVICE` | Nome do unit systemd (padrão `bomfim-api`) |
| `RELOAD_NGINX` | `1` recarrega Nginx após deploy |
| `RUN_SEED` | `1` roda `flask seed` (primeira instalação) |
| `SKIP_FRONTEND` | `1` pula `npm run build` (só API) |
| `API_PORT` | Porta do health check (padrão `5001`) |

## `.env` em produção

- `FLASK_CONFIG=production`
- `FLASK_DEBUG=0`
- `DB_HOST=127.0.0.1` (PostgreSQL no mesmo servidor)
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSLMODE` conforme o VPS
- `CORS_ORIGINS=https://seu-dominio` (se front e API forem origens diferentes; no Nginx mesmo domínio costuma bastar `/api` no mesmo host)
- `SECRET_KEY` forte e única

## O que enviar / o que não enviar

| Enviar | Não enviar (gerar no servidor) |
|--------|--------------------------------|
| Código fonte, `migrations/`, `bomfim-app/` | `.env` (criar no servidor) |
| `requirements*.txt`, `deploy/` | `.venv/`, `node_modules/`, `bomfim-app/dist/` |

O build do front roda **no servidor** em cada deploy para manter `dist/` alinhado ao código.

## Atualizar só o front ou só a API

```bash
SKIP_FRONTEND=1 bash deploy/post-upload.sh   # API + migrate, sem npm
# ou edite deploy/deploy.env com SKIP_FRONTEND=1 permanentemente para hotfix de back-end
```

Para alterações só de UI, o fluxo completo (com build) é o usual.
