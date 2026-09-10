#!/usr/bin/env bash
set -u

usage() {
  cat <<'TXT'
validate.sh — Definition of Done mecânica do projeto (WAYTER)

  bash .agents/bin/validate.sh                  todos os passos habilitados
  bash .agents/bin/validate.sh --only lint,test
  bash .agents/bin/validate.sh --skip build
  bash .agents/bin/validate.sh --fast           typecheck + testes dos arquivos alterados + comments
  bash .agents/bin/validate.sh --list           mostra passos e comandos resolvidos

Passos: lint, typecheck, test, build, comments, extras de WAYTER_EXTRA_CHECKS.
Configuração em .agents/project.env. Logs em .agents/.validate/<passo>.log.
Cada passo roda sozinho, em sequência, com nice, limite de workers e de memória de Node.
Sai com 1 se qualquer passo falhar.
TXT
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$AGENTS_DIR/.." && pwd)"
ENV_FILE="$AGENTS_DIR/project.env"
LOG_DIR="$AGENTS_DIR/.validate"

ONLY=""
SKIP=""
LIST=0
FAST=0

while [ $# -gt 0 ]; do
  case "$1" in
    --only) ONLY="$2"; shift 2 ;;
    --only=*) ONLY="${1#--only=}"; shift ;;
    --skip) SKIP="$2"; shift 2 ;;
    --skip=*) SKIP="${1#--skip=}"; shift ;;
    --list) LIST=1; shift ;;
    --fast) FAST=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "argumento desconhecido: $1" >&2; usage >&2; exit 64 ;;
  esac
done

if [ ! -f "$ENV_FILE" ]; then
  echo "✗ $ENV_FILE não encontrado. Rode 'wayter init' na raiz do projeto." >&2
  exit 78
fi

set -a; . "$ENV_FILE"; set +a

: "${WAYTER_PKG_MANAGER:=npm}"
: "${WAYTER_LINT:=}"
: "${WAYTER_TYPECHECK:=}"
: "${WAYTER_TEST:=}"
: "${WAYTER_BUILD:=}"
: "${WAYTER_BUILD_ENABLED:=0}"
: "${WAYTER_CHECK_COMMENTS:=1}"
: "${WAYTER_TEST_FAST:=}"
: "${WAYTER_NICE:=10}"
: "${WAYTER_MAX_WORKERS:=2}"
: "${WAYTER_NODE_MAX_OLD_SPACE_MB:=3072}"
: "${WAYTER_EXTRA_CHECKS:=}"
: "${WAYTER_VALIDATE_TIMEOUT:=1800}"

mkdir -p "$LOG_DIR"
cd "$ROOT_DIR" || exit 1

STEP_NAMES=()
STEP_CMDS=()

add_step() { STEP_NAMES+=("$1"); STEP_CMDS+=("$2"); }

changed_files() {
  {
    git diff --name-only --diff-filter=ACMR HEAD 2>/dev/null
    git ls-files --others --exclude-standard 2>/dev/null
  } | grep -Ev '^(\.agents|\.claude|\.cursor|docs)/' | grep -Ev '\.(md|mdx|json|ya?ml|toml|env|lock|txt|svg|png|jpg)$' | sort -u | tr '\n' ' '
}

if [ "$FAST" = "1" ]; then
  [ -z "$ONLY" ] && ONLY="typecheck,test,comments"
  files="$(changed_files)"
  if [ -n "$WAYTER_TEST_FAST" ] && [ -n "${files// /}" ]; then
    WAYTER_TEST="${WAYTER_TEST_FAST//\{files\}/$files}"
  elif [ -z "${files// /}" ]; then
    WAYTER_TEST="__disabled__"
  fi
fi

add_step lint      "$WAYTER_LINT"
add_step typecheck "$WAYTER_TYPECHECK"
add_step test      "$WAYTER_TEST"
if [ "$WAYTER_BUILD_ENABLED" = "1" ]; then
  add_step build "$WAYTER_BUILD"
else
  add_step build "__disabled__"
fi
if [ "$WAYTER_CHECK_COMMENTS" = "1" ]; then
  add_step comments "bash .agents/bin/check-comments.sh"
else
  add_step comments "__disabled__"
fi

if [ -n "$WAYTER_EXTRA_CHECKS" ]; then
  IFS=';' read -r -a _extras <<< "$WAYTER_EXTRA_CHECKS"
  for entry in "${_extras[@]}"; do
    entry="${entry#"${entry%%[![:space:]]*}"}"
    [ -z "$entry" ] && continue
    name="${entry%%=*}"
    cmd="${entry#*=}"
    if [ "$name" = "$entry" ]; then
      name="extra$((${#STEP_NAMES[@]}))"
    fi
    add_step "$name" "$cmd"
  done
fi

in_csv() {
  local needle="$1" list="$2" item
  IFS=',' read -r -a _items <<< "$list"
  for item in "${_items[@]}"; do
    [ "$item" = "$needle" ] && return 0
  done
  return 1
}

selected() {
  local name="$1"
  if [ -n "$ONLY" ] && ! in_csv "$name" "$ONLY"; then return 1; fi
  if [ -n "$SKIP" ] && in_csv "$name" "$SKIP"; then return 1; fi
  return 0
}

if [ "$LIST" = "1" ]; then
  printf '%-12s %s\n' "PASSO" "COMANDO"
  for i in "${!STEP_NAMES[@]}"; do
    cmd="${STEP_CMDS[$i]}"
    [ "$cmd" = "__disabled__" ] && cmd="(desabilitado em project.env)"
    [ -z "$cmd" ] && cmd="(não configurado)"
    printf '%-12s %s\n' "${STEP_NAMES[$i]}" "$cmd"
  done
  exit 0
fi

have_timeout=""
if command -v timeout >/dev/null 2>&1; then have_timeout="timeout"
elif command -v gtimeout >/dev/null 2>&1; then have_timeout="gtimeout"; fi

have_nice=""
if command -v nice >/dev/null 2>&1 && [ "$WAYTER_NICE" != "0" ]; then have_nice="nice -n $WAYTER_NICE"; fi

export NODE_OPTIONS="--max-old-space-size=$WAYTER_NODE_MAX_OLD_SPACE_MB ${NODE_OPTIONS:-}"
export UV_THREADPOOL_SIZE="$WAYTER_MAX_WORKERS"
export VITEST_MAX_THREADS="$WAYTER_MAX_WORKERS"
export VITEST_MAX_FORKS="$WAYTER_MAX_WORKERS"
export VITEST_MIN_THREADS=1
export VITEST_MIN_FORKS=1
export JEST_WORKER_COUNT="$WAYTER_MAX_WORKERS"
export PLAYWRIGHT_WORKERS="$WAYTER_MAX_WORKERS"
export CARGO_BUILD_JOBS="$WAYTER_MAX_WORKERS"
export GOMAXPROCS="$WAYTER_MAX_WORKERS"
export GOFLAGS="${GOFLAGS:-} -p=$WAYTER_MAX_WORKERS"
export PYTEST_ADDOPTS="${PYTEST_ADDOPTS:-} -p no:cacheprovider"
export NEXT_TELEMETRY_DISABLED=1
export TURBO_CONCURRENCY="$WAYTER_MAX_WORKERS"
export NX_PARALLEL="$WAYTER_MAX_WORKERS"
export CI=1

RESULTS_NAME=()
RESULTS_STATUS=()
RESULTS_NOTE=()
FAILED=0

run_step() {
  local name="$1" cmd="$2" log="$LOG_DIR/$1.log" start end secs rc

  if [ "$cmd" = "__disabled__" ]; then
    RESULTS_NAME+=("$name"); RESULTS_STATUS+=("skip"); RESULTS_NOTE+=("desabilitado no projeto"); return
  fi
  if [ -z "$cmd" ]; then
    RESULTS_NAME+=("$name"); RESULTS_STATUS+=("skip"); RESULTS_NOTE+=("não configurado em project.env"); return
  fi

  echo "▶ $name: $cmd"
  start=$(date +%s)
  if [ -n "$have_timeout" ]; then
    $have_nice $have_timeout "$WAYTER_VALIDATE_TIMEOUT" bash -lc "$cmd" >"$log" 2>&1
  else
    $have_nice bash -lc "$cmd" >"$log" 2>&1
  fi
  rc=$?
  end=$(date +%s); secs=$((end - start))

  if [ $rc -eq 0 ]; then
    RESULTS_NAME+=("$name"); RESULTS_STATUS+=("ok"); RESULTS_NOTE+=("${secs}s")
    echo "  ✓ ok (${secs}s)"
  else
    FAILED=1
    local note="exit $rc (${secs}s)"
    [ $rc -eq 124 ] && note="timeout após ${WAYTER_VALIDATE_TIMEOUT}s"
    RESULTS_NAME+=("$name"); RESULTS_STATUS+=("fail"); RESULTS_NOTE+=("$note · log: .agents/.validate/$name.log")
    echo "  ✗ falhou ($note)"
    echo "  ── últimas linhas de .agents/.validate/$name.log ──"
    tail -n 25 "$log" | sed 's/^/  │ /'
  fi
}

echo "WAYTER validate · $(date '+%Y-%m-%d %H:%M:%S') · pkg: $WAYTER_PKG_MANAGER · workers: $WAYTER_MAX_WORKERS · nice: $WAYTER_NICE · node heap: ${WAYTER_NODE_MAX_OLD_SPACE_MB}MB$( [ "$FAST" = "1" ] && echo ' · modo fast')"
echo

for i in "${!STEP_NAMES[@]}"; do
  name="${STEP_NAMES[$i]}"
  if selected "$name"; then
    run_step "$name" "${STEP_CMDS[$i]}"
  fi
done

echo
echo "## Validação"
echo "| Passo | Resultado |"
echo "|---|---|"
for i in "${!RESULTS_NAME[@]}"; do
  case "${RESULTS_STATUS[$i]}" in
    ok)   mark="✓ ${RESULTS_NOTE[$i]}" ;;
    fail) mark="✗ ${RESULTS_NOTE[$i]}" ;;
    skip) mark="skip (${RESULTS_NOTE[$i]})" ;;
  esac
  echo "| ${RESULTS_NAME[$i]} | $mark |"
done

if [ ${#RESULTS_NAME[@]} -eq 0 ]; then
  echo
  echo "Nenhum passo selecionado. Verifique --only/--skip ou os comandos em project.env." >&2
  exit 65
fi

echo
if [ $FAILED -ne 0 ]; then
  echo "RESULTADO: FALHOU. Não declare a tarefa concluída; leia os logs acima e corrija ou reporte."
  exit 1
fi
echo "RESULTADO: OK."
exit 0
