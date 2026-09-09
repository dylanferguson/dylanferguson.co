# Activate the mise-managed toolchain for Cloud Agent shells. Sourced by
# environment.json's install and terminal commands.
#
# mise.toml pins Node 24 (required by package.json engineStrict), but the base
# image ships Node 22 and an /exec-daemon/node shim sits ahead of everything on
# PATH, so mise's Node is prepended explicitly to make the right node win.
export PATH="$HOME/.local/bin:$PATH"

if ! command -v mise >/dev/null 2>&1; then
  curl -fsSL https://mise.run | sh
fi

mise trust --quiet "$PWD" >/dev/null 2>&1 || true
mise install
export PATH="$(dirname "$(mise which node)"):$PATH"

corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@11.2.2 --activate >/dev/null 2>&1 || true
