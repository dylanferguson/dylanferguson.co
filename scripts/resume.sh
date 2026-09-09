#!/usr/bin/env bash
# Print /resume/ to public/resume.pdf with headless Chrome.
set -euo pipefail

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
RESUME_PORT="${RESUME_PORT:-1414}"

[ -x "$CHROME" ] || { echo "Chrome not found at $CHROME — override with CHROME=..."; exit 1; }

echo "--- Building site"
pnpm build

echo "--- Printing resume PDF"
trap 'pnpm exec astro preview stop >/dev/null 2>&1' EXIT

# astro preview always runs as a background daemon; its first stdout line
# is only written once the server is accepting connections, so block on
# it instead of polling the port.
coproc ASTRO { pnpm exec astro preview --port "$RESUME_PORT" 2>&1; }
if ! IFS= read -r _ <&"${ASTRO[0]}"; then
  echo "astro preview failed to start on port $RESUME_PORT"
  exit 1
fi

"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=4000 \
  --print-to-pdf=public/resume.pdf \
  "http://localhost:$RESUME_PORT/resume/" >/dev/null 2>&1

cp public/resume.pdf dist/resume.pdf

# Record which build of the page this PDF came from, so `pnpm verify` can tell
# when the two have drifted apart. Commit this alongside the PDF.
bash scripts/resume-stamp.sh > .resume-stamp

echo "--- Wrote public/resume.pdf and .resume-stamp"
