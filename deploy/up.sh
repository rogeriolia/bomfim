#!/usr/bin/env bash
# Publicar no servidor: git pull (main) + venv + migrate + build + restart.
# Uso (na pasta do projeto): bash deploy/up.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Projeto: $ROOT"
echo "==> Git pull origin main"
git fetch origin
git pull --ff-only origin main

exec bash "$ROOT/deploy/post-upload.sh"
