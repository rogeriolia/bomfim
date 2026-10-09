# Deploy — Bomfim

## No seu PC (enviar para o GitHub)

Na pasta do projeto (`bomfim/`):

```powershell
git status
git add .
git commit -m "feat: descreva a alteração"
git push origin main
```

O `.env` **não entra** no commit (está no `.gitignore`). Secrets ficam só na máquina local e no servidor.

---

## No servidor (VPS) — publicar (up)

Entre no SSH, vá para a pasta do projeto e rode:

```bash
cd /opt/bomfim
bash deploy/up.sh
```

(Vultr: `VENV_DIR=venv` — copie `deploy/deploy.env.vultr.example` → `deploy/deploy.env`.)

Isso faz, em sequência: **`git pull origin main`** → cria/atualiza **`.venv`** → `pip install` → **`flask db upgrade`** → **`npm run build`** → reinicia API/Nginx.

Se `deploy/up.sh` ainda não existir (servidor muito antigo), rode uma vez:

```bash
cd /var/www/bomfim
git pull --ff-only origin main
bash deploy/post-upload.sh
```

Depois disso, use sempre `bash deploy/up.sh`.

O script **post-upload** faz:

1. Cria ou reutiliza **`.venv`** (`deploy/ensure-venv.sh` + `pip install -U pip`)
2. `pip install -r requirements-prod.txt` (Flask + gunicorn)
3. `flask db upgrade`
4. `npm ci` + `npm run build` → `bomfim-app/dist/`
5. Reinicia `bomfim-api` (systemd) e recarrega Nginx
6. Health check em `/api/health`

---

## Primeira instalação no servidor

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm postgresql nginx git

cd /var/www
sudo git clone https://github.com/rogeriolia/bomfim.git
sudo chown -R "$USER:$USER" bomfim
cd bomfim

cp .env.example .env
nano .env   # DB_HOST=127.0.0.1, DB_PASSWORD=…, FLASK_CONFIG=production, SECRET_KEY=…

cp deploy/deploy.env.example deploy/deploy.env
nano deploy/deploy.env   # RUN_SEED=1 na primeira vez

bash deploy/ensure-venv.sh "$(pwd)"
.venv/bin/pip install -r requirements-prod.txt
.venv/bin/python scripts/ensure_db.py

export FLASK_APP=manage.py
RUN_SEED=1 bash deploy/post-upload.sh

sudo cp deploy/bomfim-api.service.example /etc/systemd/system/bomfim-api.service
# Edite WorkingDirectory e User no .service
sudo systemctl daemon-reload
sudo systemctl enable --now bomfim-api

sudo cp deploy/nginx.bomfim.example.conf /etc/nginx/sites-available/bomfim
sudo ln -sf /etc/nginx/sites-available/bomfim /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Depois disso, cada release é só:

```bash
cd /var/www/bomfim && bash deploy/deploy.sh
```

---

## Ambiente virtual (`.venv`)

| Onde | Comando |
|------|---------|
| **Servidor** | Criado/atualizado automaticamente em cada deploy (`ENSURE_VENV=1`) |
| **Servidor (manual)** | `bash deploy/ensure-venv.sh /var/www/bomfim` |
| **Windows (dev)** | `python -m venv .venv` → `.\.venv\Scripts\Activate.ps1` → `pip install -r requirements.txt` |

No systemd, a API usa sempre:

`/var/www/bomfim/.venv/bin/gunicorn … manage:app`

Não use o Python global do sistema para rodar a API em produção.

---

## Variáveis em `deploy/deploy.env`

| Variável | Descrição |
|----------|-----------|
| `PYTHON_BIN` | Binário para criar o venv (`python3`, `python3.11`) |
| `ENSURE_VENV` | `1` garante `.venv` antes do deploy |
| `GIT_REMOTE` / `GIT_BRANCH` | Usados por `deploy/deploy.sh` |
| `BOMFIM_SERVICE` | Unit systemd (padrão `bomfim-api`) |
| `RELOAD_NGINX` | `1` recarrega Nginx |
| `RUN_SEED` | `1` roda `flask seed` (só primeira instalação) |
| `SKIP_FRONTEND` | `1` pula `npm run build` |
| `API_PORT` | Health check (padrão `5001`) |

---

## `.env` em produção (servidor)

```env
FLASK_CONFIG=production
FLASK_DEBUG=0
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=bomfim
DB_USER=postgres
DB_PASSWORD=...
SECRET_KEY=...
API_PORT=5001

# Integrações (barra CONECTADO À OPERAÇÃO) — credenciais só no servidor, nunca no Git
PYPEFY_USUARIO=...
PYPEFY_SENHA=...
MOSKIT_USUARIO=...
MOSKIT_SENHA=...
ZAPIER_USUARIO=...
ZAPIER_SENHA=...
# Opcional: CLICKSIGN_ACCESS_TOKEN, MOSKIT_API_KEY, RECEITAWS_TOKEN
```

---

## Só API ou só front

```bash
SKIP_FRONTEND=1 bash deploy/post-upload.sh
```

---

## Integração Click Sign (nome no banco)

Se o servidor foi seedado antes da renomeação, atualize o rótulo no PostgreSQL:

```sql
UPDATE integrations SET name = 'Click Sign' WHERE name = 'Assinatura Digital';
```

Integração Zapier (substitui Documentos na barra de integrações):

```sql
UPDATE integrations SET name = 'Zapier' WHERE name = 'Documentos';
```

Ou rode `flask db upgrade` (migração `c8d9e0f1a2b3`).

Pipefy (Admin → Integrações): incluído automaticamente em `flask db upgrade` (migração `d9e0f1a2b3c4`).

---

## Checklist — release via Git (PC → servidor)

**No PC**

1. `git status` — confirme que `.env` **não** aparece (só `.env.example`).
2. `cd bomfim-app && npm run build` (opcional; o servidor também builda).
3. Commit e push:
   ```powershell
   git add -A
   git commit -m "feat: barra de integrações, Pipefy/Zapier e status de acesso"
   git push origin main
   ```

**No servidor**

1. Atualize o `.env` com as variáveis de integração (se ainda não tiver).
2. `cd /opt/bomfim` (ou `/var/www/bomfim`) → `bash deploy/up.sh`
3. Confirme: `curl -s http://127.0.0.1:5001/api/health` → `{"status":"ok","db":"ok"}`
4. Abra o app logado e confira a barra **CONECTADO À OPERAÇÃO**.
