#!/usr/bin/env bash
MIN="${1:-18}"

major_of() { "$1" -p 'process.versions.node.split(".")[0]' 2>/dev/null; }

try() {
  local bin="$1" m
  [ -x "$bin" ] || return 1
  m="$(major_of "$bin")"
  [ -n "$m" ] && [ "$m" -ge "$MIN" ] || return 1
  printf '%s\n' "$bin"
  exit 0
}

if command -v node >/dev/null 2>&1; then try "$(command -v node)"; fi
[ -n "${WAYTER_NODE:-}" ] && try "$WAYTER_NODE"

for dir in "${NVM_DIR:-$HOME/.nvm}/versions/node" "$HOME/.local/share/fnm/node-versions" "$HOME/Library/Application Support/fnm/node-versions" "$HOME/.volta/tools/image/node" "$HOME/.asdf/installs/nodejs"; do
  [ -d "$dir" ] || continue
  while IFS= read -r v; do
    try "$v/bin/node"
    try "$v/installation/bin/node"
  done < <(ls -1 "$dir" 2>/dev/null | sort -t. -k1,1nr -k2,2nr -k3,3nr | sed "s|^|$dir/|")
done

for bin in /opt/homebrew/bin/node /usr/local/bin/node /usr/bin/node; do try "$bin"; done

echo "node >= $MIN não encontrado (PATH, WAYTER_NODE, nvm, fnm, volta, asdf, homebrew)" >&2
exit 1
