#!/bin/bash
# Installs the Graphify CLI and its /graphify skill in fresh cloud containers.
# Local machines: install once yourself (uv tool install graphifyy && graphify install).
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
command -v uv >/dev/null || exit 0
if ! command -v graphify >/dev/null && [ ! -x "$HOME/.local/bin/graphify" ]; then
  uv tool install graphifyy >/dev/null 2>&1 || exit 0
fi
"$HOME/.local/bin/graphify" install >/dev/null 2>&1 || true
