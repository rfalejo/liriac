#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
BACKEND_DIR="${REPO_ROOT}/backend"
CERT_DIR="${BACKEND_DIR}/certs"
CERT_FILE="${CERT_DIR}/dev.crt"
KEY_FILE="${CERT_DIR}/dev.key"

if [[ ! -f "${CERT_FILE}" || ! -f "${KEY_FILE}" ]]; then
  echo "Missing development TLS certificate. Generate it with:" >&2
  echo "  cd ${BACKEND_DIR} && openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout certs/dev.key -out certs/dev.crt -subj \"/CN=localhost\"" >&2
  exit 1
fi

cd "${BACKEND_DIR}"
uv run uvicorn config.asgi:application \
  --host 0.0.0.0 \
  --port 8000 \
  --reload \
  --ssl-certfile "${CERT_FILE}" \
  --ssl-keyfile "${KEY_FILE}"
