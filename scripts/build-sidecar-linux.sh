#!/usr/bin/env bash
# Build the DocuScan extraction sidecar for Linux.
# Run from the project root: bash scripts/build-sidecar-linux.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "==> Installing Python dependencies"
pip install -r "$PROJECT_ROOT/sidecar/requirements.txt"

echo "==> Building sidecar binary"
python "$PROJECT_ROOT/sidecar/build.py" --platform linux

echo "==> Done"
echo "    Binary: src-tauri/binaries/sidecar-x86_64-unknown-linux-gnu"
