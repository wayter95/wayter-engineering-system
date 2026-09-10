#!/usr/bin/env bash
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR" || exit 1

BASE="${1:-}"
EXCLUDE="${WAYTER_COMMENTS_EXCLUDE:-}"
CODE_EXT='ts|tsx|js|jsx|mjs|cjs|mts|cts|vue|svelte|astro|py|go|rs|php|rb|java|kt|kts|swift|cs|c|h|cpp|hpp|sh|bash|zsh|sql|css|scss|less|html|graphql|gql|tf|proto'
ALLOW='^[+][[:space:]]*(#!|# shellcheck|# noqa|# type:|# pyright:|# pylint:|# fmt:|//[[:space:]]*(eslint|prettier|biome|@ts-expect-error|@ts-check|<reference)|/\*[[:space:]]*(eslint|prettier|webpack|vite|@__PURE__|c8|istanbul|v8)|/// <reference|// go:|//go:|#\[|#pragma|#include|#define|#if|#else|#endif|#import|<!DOCTYPE|"use (client|server|strict)")'
PATTERN='^[+][[:space:]]*(//|/\*|\*[[:space:]]|\*/|#|<!--|--[[:space:]]|--$|///|\{/\*|/\*\*)'
TRAIL='^[+].*[];)}A-Za-z0-9_"'"'"'][[:space:]]+(//|#|/\*)[[:space:]]+[^[:space:]]'
TRAIL_SQL='^[+].*;[[:space:]]+--[[:space:]]+[^[:space:]]'
TRAIL_ALLOW='(://|# (noqa|type:|pragma|fmt:|pylint:)|// ?(eslint|prettier|biome|@ts-)|[[:space:]]#\{|\$#|\$\{#)'
DEFAULT_EXCLUDE='^\.agents/'

if [ -n "$BASE" ]; then
  diff_cmd=(git diff --unified=0 --no-color "$BASE")
else
  diff_cmd=(git diff --unified=0 --no-color HEAD)
fi

if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  diff_cmd=(git diff --unified=0 --no-color --cached)
fi

untracked=$(git ls-files --others --exclude-standard | grep -E "\.($CODE_EXT)$" || true)

violations=0
file=""
line=0

report() {
  violations=$((violations + 1))
  printf '%s:%s: %s\n' "$1" "$2" "$3"
}

scan_hunk_line() {
  local text="$1"
  if echo "$text" | grep -Eq "$ALLOW"; then return; fi
  if echo "$text" | grep -Eq "$PATTERN"; then
    report "$file" "$line" "${text#+}"
    return
  fi
  if echo "$text" | grep -Eq "$TRAIL" && ! echo "$text" | grep -Eq "$TRAIL_ALLOW"; then
    report "$file" "$line" "${text#+}"
    return
  fi
  if echo "$file" | grep -Eq '\.sql$' && echo "$text" | grep -Eq "$TRAIL_SQL"; then
    report "$file" "$line" "${text#+}"
  fi
}

excluded() {
  echo "$1" | grep -Eq "$DEFAULT_EXCLUDE" && return 0
  [ -n "$EXCLUDE" ] && echo "$1" | grep -Eq "$EXCLUDE" && return 0
  return 1
}

while IFS= read -r raw; do
  case "$raw" in
    +++\ b/*)
      file="${raw#+++ b/}"
      if echo "$file" | grep -Eq "\.($CODE_EXT)$"; then
        if excluded "$file"; then file=""; fi
      else
        file=""
      fi
      ;;
    @@*)
      line=$(echo "$raw" | sed -E 's/^@@ -[0-9]+(,[0-9]+)? \+([0-9]+).*/\2/')
      line=$((line - 1))
      ;;
    +*)
      [ -z "$file" ] && continue
      line=$((line + 1))
      [ "$raw" = "+++" ] && continue
      scan_hunk_line "$raw"
      ;;
  esac
done < <("${diff_cmd[@]}" -- . ':(exclude)*.md' ':(exclude)*.mdx' ':(exclude)*.json' ':(exclude)*.env*' ':(exclude)*.yml' ':(exclude)*.yaml' ':(exclude)*.toml' 2>/dev/null)

if [ -n "$untracked" ]; then
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    if excluded "$f"; then continue; fi
    file="$f"; line=0
    while IFS= read -r l; do
      line=$((line + 1))
      scan_hunk_line "+$l"
    done < "$f"
  done <<< "$untracked"
fi

if [ $violations -gt 0 ]; then
  echo
  echo "$violations linha(s) de comentário adicionadas. Regra: zero comentários no código (.agents/coding-standards.md)."
  echo "Remova o comentário; se o contexto importa, leve-o para docs/, ADR ou .agents/project.md."
  exit 1
fi

echo "nenhum comentário adicionado"
exit 0
