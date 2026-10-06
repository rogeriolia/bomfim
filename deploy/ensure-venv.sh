#!/usr/bin/env bash
# Garante .venv no servidor (chamado por post-upload.sh).
set -euo pipefail

ROOT="${1:?ROOT obrigatório}"
PYTHON_BIN="${PYTHON_BIN:-python3}"

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
    echo "Erro: $PYTHON_BIN não encontrado. Instale Python 3.11+ ou defina PYTHON_BIN em deploy/deploy.env." >&2
    exit 1
fi

VENV_PY="$ROOT/.venv/bin/python"
VENV_PIP="$ROOT/.venv/bin/pip"

if [[ ! -x "$VENV_PY" ]]; then
    echo "==> Criando ambiente virtual: $ROOT/.venv"
    "$PYTHON_BIN" -m venv "$ROOT/.venv"
fi

echo "==> Atualizando pip no venv"
"$VENV_PIP" install -U pip wheel

echo "==> Python do deploy: $($VENV_PY -V)"
