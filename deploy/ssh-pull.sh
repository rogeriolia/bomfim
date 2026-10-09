#!/usr/bin/env bash
# Pull + deploy no VPS (rode dentro da pasta do projeto, via SSH).
#   cd /opt/bomfim && bash deploy/ssh-pull.sh
#   cd /var/www/bomfim && bash deploy/ssh-pull.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=========================================="
echo " Bomfim — pull + deploy (SSH)"
echo " Diretório: $ROOT"
echo "=========================================="

if [[ ! -d "$ROOT/.git" ]]; then
    echo "Erro: $ROOT não é um repositório git." >&2
    exit 1
fi

if [[ ! -f "$ROOT/.env" ]]; then
    echo "Erro: .env ausente. Copie .env.example e configure DB_* / SECRET_KEY / integrações." >&2
    exit 1
fi

if [[ ! -f "$ROOT/deploy/deploy.env" ]]; then
    if [[ -f "$ROOT/deploy/deploy.env.vultr.example" ]]; then
        echo "Aviso: deploy/deploy.env não existe. No Vultr: cp deploy/deploy.env.vultr.example deploy/deploy.env"
    elif [[ -f "$ROOT/deploy/deploy.env.example" ]]; then
        echo "Aviso: deploy/deploy.env não existe. cp deploy/deploy.env.example deploy/deploy.env"
    fi
fi

echo "==> Commit local antes do pull:"
git rev-parse --short HEAD
git status -sb

exec bash "$ROOT/deploy/up.sh"
