#!/usr/bin/env bash
# Diagnóstico rápido no VPS (rode após deploy): bash deploy/verify-server.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if [[ -f "$ROOT/deploy/deploy.env" ]]; then
    # shellcheck disable=SC1091
    source "$ROOT/deploy/deploy.env"
fi
if [[ -z "${VENV_DIR:-}" ]]; then
    if [[ -x "$ROOT/venv/bin/python" ]]; then
        VENV_DIR=venv
    else
        VENV_DIR=.venv
    fi
fi
PYTHON="${PYTHON:-$ROOT/$VENV_DIR/bin/python}"
API_PORT="${API_PORT:-5001}"
BASE="http://127.0.0.1:${API_PORT}"

echo "==> Diretório: $ROOT"
echo "==> Git:"
git rev-parse --short HEAD 2>/dev/null || echo "(sem git)"
git status -sb 2>/dev/null || true

echo ""
echo "==> Health API:"
curl -sf "${BASE}/api/health" | python3 -m json.tool 2>/dev/null || curl -sf "${BASE}/api/health" || {
    echo "ERRO: API não responde em ${BASE}/api/health" >&2
    exit 1
}

echo ""
echo "==> Rota /api/registrations/anexo-counts (401=ok, 404=API desatualizada):"
code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE}/api/registrations/anexo-counts" || true)
echo "HTTP ${code}"
if [[ "$code" == "404" ]]; then
    echo "ERRO: falta endpoint anexo-counts — git pull + restart bomfim-api" >&2
    exit 1
fi

echo ""
echo "==> Frontend (dist):"
DIST="$ROOT/bomfim-app/dist/index.html"
if [[ -f "$DIST" ]]; then
    ls -la "$DIST"
    grep -o 'assets/index-[^"]*\.js' "$DIST" | head -1 || true
else
    echo "ERRO: $DIST não existe — rode npm run build ou deploy/post-upload.sh" >&2
    exit 1
fi

echo ""
echo "==> Nginx root (se configurado):"
if command -v nginx >/dev/null 2>&1; then
    grep -r "root " /etc/nginx/sites-enabled/ 2>/dev/null | head -5 || true
    echo "Confira se o root aponta para $ROOT/bomfim-app/dist"
fi

echo ""
echo "==> systemd bomfim-api:"
if systemctl is-active bomfim-api &>/dev/null; then
    systemctl show bomfim-api -p WorkingDirectory -p ExecStart --no-pager
else
    echo "Aviso: serviço bomfim-api não está active"
fi

echo ""
echo "==> Credenciais de integração (.env, só presença):"
"$PYTHON" - <<'PY'
from bomfim.config import _env_get

keys = [
    "PYPEFY_USUARIO",
    "PYPEFY_SENHA",
    "PIPEFY_USUARIO",
    "MOSKIT_USUARIO",
    "MOSKIT_SENHA",
    "ZAPIER_USUARIO",
    "ZAPIER_SENHA",
]
for k in keys:
    print(f"  {k}: {'ok' if _env_get(k) else 'MISSING'}")
PY

echo ""
echo "OK — compare git_rev no health com 'git rev-parse --short HEAD' nesta pasta."
