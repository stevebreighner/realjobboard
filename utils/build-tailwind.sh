#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="${ROOT_DIR}/utils/bin"
BIN_PATH="${BIN_DIR}/tailwindcss"
VERSION="v3.4.17"
DOWNLOAD_URL="https://github.com/tailwindlabs/tailwindcss/releases/download/${VERSION}/tailwindcss-linux-x64"

mkdir -p "${BIN_DIR}"

if [[ ! -x "${BIN_PATH}" ]]; then
  echo "Downloading tailwindcss ${VERSION}..."
  curl -fsSL "${DOWNLOAD_URL}" -o "${BIN_PATH}"
  chmod +x "${BIN_PATH}"
fi

echo "Building styles/tailwind.min.css ..."
"${BIN_PATH}" \
  -c "${ROOT_DIR}/tailwind.config.js" \
  -i "${ROOT_DIR}/styles/tailwind.input.css" \
  -o "${ROOT_DIR}/styles/tailwind.min.css" \
  --minify

echo "Done."
