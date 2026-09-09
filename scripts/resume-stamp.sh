#!/usr/bin/env bash
# Print a hash identifying the built /resume/ page — the exact input Chrome
# prints the PDF from.
#
# Hashing the built page rather than a list of source files means the check
# never needs that list kept up to date: the stylesheet is content-hashed into
# its own filename, so editing global.css moves the hash too, and so does any
# change to the data, the page, the layouts or the header.
#
# The two build-stamp <meta> tags change on every build and never reach paper,
# so they come out before hashing.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
PAGE="dist/resume/index.html"

[ -f "$PAGE" ] || {
  echo "missing $PAGE — run pnpm build first" >&2
  exit 1
}

sed -E 's/<meta name="build-(time|commit)" content="[^"]*">//g' "$PAGE" |
  shasum -a 256 | cut -d' ' -f1
