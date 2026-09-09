# Activate Node 24 for Cloud Agent shells. Sourced by environment.json's
# install and terminal commands.
#
# package.json requires Node >=24 with engineStrict, but the base image ships
# Node 22 and an /exec-daemon/node shim sits ahead of nvm on PATH, so an
# explicit prepend is needed to make the right node win.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

nvm use 24 >/dev/null 2>&1 || nvm install 24
export PATH="$(nvm which 24 | xargs dirname):$PATH"

corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@11.2.2 --activate >/dev/null 2>&1 || true
