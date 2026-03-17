#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   POSTGRES_PASSWORD='...' ./scripts/deploy-prod.sh
#
# Required on VPS:
# - backend/.env.prod exists (copied from backend/.env.prod.example)
# - Docker and Docker Compose plugin installed

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
  echo "ERROR: POSTGRES_PASSWORD is not set in the shell environment."
  echo "Example: POSTGRES_PASSWORD='your_db_password' ./scripts/deploy-prod.sh"
  exit 1
fi

if [[ ! -f "backend/.env.prod" ]]; then
  echo "ERROR: backend/.env.prod is missing."
  echo "Create it from backend/.env.prod.example before deploying."
  exit 1
fi

echo "[1/3] Pull latest images and source"
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull || true

echo "[2/3] Build and start stack"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "[3/3] Stack status"
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo "Deployment done."
