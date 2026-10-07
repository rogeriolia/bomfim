#!/usr/bin/env bash
# Garante venv no servidor (chamado por post-upload.sh).
set -euo pipefail

ROOT="${1:?ROOT obrigatório}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
VENV_DIR="${VENV_DIR:-}"

if [[ -z "$VENV_DIR" ]]; then
    if [[ -x "$ROOT/venv/bin/python" ]]; then
        VENV_DIR=venv
    else
        VENV_DIR=.venv
    fi
fi

VENV_PATH="$ROOT/$VENV_DIR"

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
    echo "Erro: $PYTHON_BIN não encontrado. Instale Python 3.11+ ou defina PYTHON_BIN em deploy/deploy.env." >&2
    exit 1
fi

VENV_PY="$VENV_PATH/bin/python"
VENV_PIP="$VENV_PATH/bin/pip"

if [[ ! -x "$VENV_PY" ]]; then
    echo "==> Criando ambiente virtual: $VENV_PATH"
    "$PYTHON_BIN" -m venv "$VENV_PATH"
fi

echo "==> Atualizando pip no venv ($VENV_DIR)"
"$VENV_PIP" install -U pip wheel

echo "==> Python do deploy: $($VENV_PY -V)"
