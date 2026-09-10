#!/usr/bin/env bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE="$(bash "$DIR/../bin/find-node.sh" 18 2>/dev/null)"
if [ -z "$NODE" ]; then
  echo "⛔ WAYTER guard: node >= 18 não encontrado; hook não pôde avaliar o comando. Instale Node >= 18 ou defina WAYTER_NODE." >&2
  exit 2
fi
exec "$NODE" "$DIR/guard-destructive.mjs"
