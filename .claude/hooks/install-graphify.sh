#!/bin/bash
# Installs the Graphify CLI and its /graphify skill in fresh cloud containers,
# then builds the project map (local parsing only, no model, a few seconds).
# Local machines: install once yourself (uv tool install graphifyy && graphify install).
set -uo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
command -v uv >/dev/null || exit 0
G="$HOME/.local/bin/graphify"
[ -x "$G" ] || uv tool install graphifyy >/dev/null 2>&1 || exit 0
"$G" install >/dev/null 2>&1 || true
cd "${CLAUDE_PROJECT_DIR:-.}" && "$G" update . >/dev/null 2>&1 || true
exit 0
