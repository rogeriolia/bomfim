#!/usr/bin/env bash
# Deploy no servidor: git pull + post-upload (venv, migrate, build, restart).
# Uso: cd /var/www/bomfim && bash deploy/deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_BRANCH="${GIT_BRANCH:-main}"

if [[ -d "$ROOT/.git" ]]; then
    echo "==> Git pull ($GIT_REMOTE/$GIT_BRANCH)"
    git fetch "$GIT_REMOTE"
    git pull --ff-only "$GIT_REMOTE" "$GIT_BRANCH"
else
    echo "Aviso: não é um repositório git; pulando pull." >&2
fi

exec bash "$ROOT/deploy/post-upload.sh"
