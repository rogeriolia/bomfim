#!/usr/bin/env bash
# Rodar NO SERVIDOR após enviar os arquivos do projeto (rsync/scp/FTP).
# Uso: bash deploy/post-upload.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/deploy/deploy.env" ]]; then
    # shellcheck disable=SC1091
    source "$ROOT/deploy/deploy.env"
fi

BOMFIM_SERVICE="${BOMFIM_SERVICE:-bomfim-api}"
RELOAD_NGINX="${RELOAD_NGINX:-1}"
RUN_SEED="${RUN_SEED:-0}"
SKIP_FRONTEND="${SKIP_FRONTEND:-0}"
API_PORT="${API_PORT:-5001}"
ENSURE_VENV="${ENSURE_VENV:-1}"

if [[ ! -f "$ROOT/.env" ]]; then
    echo "Erro: .env não encontrado em $ROOT/.env" >&2
    echo "Copie .env.example, configure DB_* (no VPS use DB_HOST=127.0.0.1) e FLASK_CONFIG=production." >&2
    exit 1
fi

if [[ "$ENSURE_VENV" == "1" ]]; then
    bash "$ROOT/deploy/ensure-venv.sh" "$ROOT"
fi

if [[ -z "${VENV_DIR:-}" ]]; then
    if [[ -x "$ROOT/venv/bin/python" ]]; then
        VENV_DIR=venv
    else
        VENV_DIR=.venv
    fi
fi

PYTHON="${PYTHON:-$ROOT/$VENV_DIR/bin/python}"
PIP="${PIP:-$ROOT/$VENV_DIR/bin/pip}"

if [[ ! -x "$PYTHON" ]]; then
    echo "Erro: $ROOT/$VENV_DIR/bin/python não encontrado." >&2
    echo "  Defina VENV_DIR=venv em deploy/deploy.env ou rode: bash deploy/ensure-venv.sh $ROOT" >&2
    exit 1
fi

echo "==> Usando venv: $VENV_DIR"

export FLASK_APP=manage.py
export FLASK_CONFIG="${FLASK_CONFIG:-production}"
export FLASK_DEBUG=0

echo "==> Diretório: $ROOT"
echo "==> Instalando dependências Python (requirements-prod.txt)"
"$PIP" install -r "$ROOT/requirements-prod.txt"

echo "==> Aplicando migrações (flask db upgrade)"
"$PYTHON" -m flask db upgrade

if [[ "$RUN_SEED" == "1" ]]; then
    echo "==> Seed idempotente (flask seed)"
    "$PYTHON" -m flask seed
fi

if [[ "$SKIP_FRONTEND" != "1" ]]; then
    echo "==> Build do frontend (bomfim-app/dist)"
    if ! command -v npm >/dev/null 2>&1; then
        echo "Erro: npm não encontrado. Instale Node.js 20+ no servidor." >&2
        exit 1
    fi
    cd "$ROOT/bomfim-app"
    # Sem fund/audit no servidor: lockfile versionado já traz versões corrigidas.
    export NPM_CONFIG_FUND=false
    export NPM_CONFIG_AUDIT=false
    if [[ -f package-lock.json ]]; then
        npm ci --no-fund --no-audit
    else
        npm install --no-fund --no-audit
    fi
    npm run build
    cd "$ROOT"
    if [[ ! -f "$ROOT/bomfim-app/dist/index.html" ]]; then
        echo "Erro: build não gerou bomfim-app/dist/index.html" >&2
        exit 1
    fi
else
    echo "==> SKIP_FRONTEND=1 — build do front ignorado"
fi

restart_service() {
    local name="$1"
    if command -v systemctl >/dev/null 2>&1 && systemctl cat "${name}.service" &>/dev/null; then
        echo "==> Reiniciando systemd: $name"
        sudo systemctl restart "$name"
        sudo systemctl is-active --quiet "$name"
        return 0
    fi
    return 1
}

if restart_service "$BOMFIM_SERVICE"; then
    :
else
    echo "Aviso: serviço $BOMFIM_SERVICE não encontrado no systemd." >&2
    echo "        Configure deploy/bomfim-api.service.example e: sudo systemctl enable --now $BOMFIM_SERVICE" >&2
fi

if [[ "$RELOAD_NGINX" == "1" ]] && command -v nginx >/dev/null 2>&1; then
    if sudo nginx -t 2>/dev/null; then
        echo "==> Recarregando Nginx"
        sudo systemctl reload nginx
    else
        echo "Aviso: nginx -t falhou; Nginx não recarregado." >&2
    fi
fi

echo "==> Health check API (127.0.0.1:${API_PORT}/api/health)"
health_ok=0
if command -v curl >/dev/null 2>&1; then
    if curl -sf "http://127.0.0.1:${API_PORT}/api/health"; then
        echo ""
        health_ok=1
    fi
else
    if "$PYTHON" - <<PY
import urllib.request
with urllib.request.urlopen("http://127.0.0.1:${API_PORT}/api/health", timeout=10) as r:
    print(r.read().decode())
PY
    then
        health_ok=1
    fi
fi

if [[ "$health_ok" != "1" ]]; then
    echo "" >&2
    echo "ERRO: nada escutando em 127.0.0.1:${API_PORT} (Connection refused)." >&2
    echo "  A API systemd provavelmente não está ativa ou o caminho do gunicorn está errado." >&2
    echo "  sudo systemctl status ${BOMFIM_SERVICE} --no-pager -l" >&2
    echo "  sudo journalctl -u ${BOMFIM_SERVICE} -n 40 --no-pager" >&2
    echo "  Ajuste /etc/systemd/system/${BOMFIM_SERVICE}.service (WorkingDirectory + ExecStart)." >&2
    exit 1
fi

echo "Deploy concluído."
