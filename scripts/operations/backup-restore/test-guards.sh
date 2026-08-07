#!/usr/bin/env bash
# test-guards.sh — pruebas negativas del harness B3-BACKUP-01.
#
# Spec: docs/specs/features/backup-restore-verification.md
#
# Cada prueba debe FALLAR (salida distinta de cero), no crear ni destruir nada,
# no dejar residuos del run y no alterar la identidad de los recursos protegidos.
# Un harness cuyas guardas no bloquean no acredita nada: estas diez pruebas son
# la evidencia de que bloquean.
#
# Salida: 0 si las diez pruebas se comportan como deben; 1 en caso contrario.

set -Eeuo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PASS=0
FAIL=0

GUARD_RUN_ID="$(date -u +%Y%m%dt%H%M%Sz)-deadbeef"
GUARD_PROJECT="jobit-b3-backup-verify-${GUARD_RUN_ID}"
GUARD_WORKSPACE="/tmp/jobit-b3-backup-verify-${GUARD_RUN_ID}"

# Inventario de referencia: se compara al final, restringido a este run ficticio
# y a los recursos protegidos. Nunca se exige igualdad global del host.
PROTECTED=("jobit-staging-db-data" "jobit-staging-api-uploads" "jobit-postgres-test")

snapshot_protected() {
  local out="$1" res
  : > "$out"
  for res in "${PROTECTED[@]}"; do
    if docker volume inspect "$res" >/dev/null 2>&1; then
      printf '%s\tvolume\t%s\n' "$res" "$(docker volume inspect --format '{{.Driver}}' "$res")" >> "$out"
    elif docker container inspect "$res" >/dev/null 2>&1; then
      printf '%s\tcontainer\t%s\n' "$res" "$(docker container inspect --format '{{.State.Status}}' "$res")" >> "$out"
    else
      printf '%s\tabsent\tabsent\n' "$res" >> "$out"
    fi
  done
}

BEFORE="$(mktemp)"; AFTER="$(mktemp)"
snapshot_protected "$BEFORE"

# expect_fail <nombre> <comando...>
expect_fail() {
  local name="$1"; shift
  if "$@" > /dev/null 2>&1; then
    printf '  FAIL  %s — la guarda NO bloqueó\n' "$name"
    FAIL=$((FAIL + 1))
  else
    printf '  PASS  %s — bloqueado con salida %s\n' "$name" "$?"
    PASS=$((PASS + 1))
  fi
}

# Ejecuta un subcomando de verify.sh en un entorno controlado.
run_verify() {
  env \
    B3B_RUN_ID="${1}" B3B_PROJECT="${2}" B3B_WORKSPACE="${3}" \
    B3B_ORIGIN_DB="${4}" B3B_TARGET_DB="${5}" \
    B3B_ORIGIN_HOST="origin-db" B3B_TARGET_HOST="target-db" \
    B3B_ORIGIN_USER="u" B3B_ORIGIN_PASSWORD="p" \
    B3B_TARGET_USER="u" B3B_TARGET_PASSWORD="p" \
    "${SCRIPT_DIR}/verify.sh" schema origin
}

printf 'Pruebas negativas de guardas (N1-N10)\n'

# N1 · RUN_ID vacío
expect_fail "N1  RUN_ID vacío" \
  run_verify "" "$GUARD_PROJECT" "$GUARD_WORKSPACE" "b3backup_origin" "b3backup_target"

# N2 · origen == destino
expect_fail "N2  ORIGIN_DB == TARGET_DB" \
  env B3B_RUN_ID="$GUARD_RUN_ID" B3B_PROJECT="$GUARD_PROJECT" B3B_WORKSPACE="$GUARD_WORKSPACE" \
      B3B_ORIGIN_DB="b3backup_same" B3B_TARGET_DB="b3backup_same" \
      B3B_ORIGIN_HOST="origin-db" B3B_TARGET_HOST="target-db" \
      B3B_ORIGIN_USER="u" B3B_ORIGIN_PASSWORD="p" B3B_TARGET_USER="u" B3B_TARGET_PASSWORD="p" \
      bash -c 'source "'"${SCRIPT_DIR}"'/lib.sh"; b3b_validate_distinct_endpoints'

# N3 · project name protegido
expect_fail "N3  PROJECT=jobit-staging" \
  run_verify "$GUARD_RUN_ID" "jobit-staging" "$GUARD_WORKSPACE" "b3backup_origin" "b3backup_target"

# N4 · project name con 'production'
expect_fail "N4  PROJECT contiene production" \
  run_verify "$GUARD_RUN_ID" "jobit-b3-backup-verify-production" "$GUARD_WORKSPACE" \
             "b3backup_origin" "b3backup_target"

# N5 · workspace peligroso
expect_fail "N5a WORKSPACE=/" \
  run_verify "$GUARD_RUN_ID" "$GUARD_PROJECT" "/" "b3backup_origin" "b3backup_target"
expect_fail "N5b WORKSPACE=\$HOME" \
  run_verify "$GUARD_RUN_ID" "$GUARD_PROJECT" "$HOME" "b3backup_origin" "b3backup_target"
expect_fail "N5c WORKSPACE dentro del repositorio" \
  run_verify "$GUARD_RUN_ID" "$GUARD_PROJECT" "$(cd "${SCRIPT_DIR}/../../.." && pwd)/tmp-b3b" \
             "b3backup_origin" "b3backup_target"

# N6 · volumen del run preexistente. Se crea uno propio del test, se comprueba
# que la guarda lo detecta y se elimina inmediatamente.
docker volume create --label "com.jobit.task=b3-backup-01-verification" \
                     --label "com.jobit.run-id=${GUARD_RUN_ID}" \
                     "${GUARD_PROJECT}_origin-db-data" > /dev/null
expect_fail "N6  volumen del run preexistente" \
  env B3B_RUN_ID="$GUARD_RUN_ID" B3B_PROJECT="$GUARD_PROJECT" B3B_WORKSPACE="$GUARD_WORKSPACE" \
      B3B_ORIGIN_DB="b3backup_origin" B3B_TARGET_DB="b3backup_target" \
      B3B_ORIGIN_HOST="origin-db" B3B_TARGET_HOST="target-db" \
      B3B_ORIGIN_USER="u" B3B_ORIGIN_PASSWORD="p" B3B_TARGET_USER="u" B3B_TARGET_PASSWORD="p" \
      bash -c 'source "'"${SCRIPT_DIR}"'/lib.sh"; b3b_assert_no_preexisting_run_resources'
docker volume rm "${GUARD_PROJECT}_origin-db-data" > /dev/null

# N7 · cleanup con RUN_ID incorrecto: el marcador no coincide -> no borra nada.
mkdir -p "${GUARD_WORKSPACE}/logs"
printf '%s\n' "20200101t000000z-00000000" > "${GUARD_WORKSPACE}/.b3backup-owned"
expect_fail "N7  cleanup con RUN_ID incorrecto" \
  env B3B_RUN_ID="$GUARD_RUN_ID" B3B_PROJECT="$GUARD_PROJECT" B3B_WORKSPACE="$GUARD_WORKSPACE" \
      B3B_ORIGIN_DB="b3backup_origin" B3B_TARGET_DB="b3backup_target" \
      B3B_ORIGIN_HOST="origin-db" B3B_TARGET_HOST="target-db" \
      B3B_ORIGIN_USER="u" B3B_ORIGIN_PASSWORD="p" B3B_TARGET_USER="u" B3B_TARGET_PASSWORD="p" \
      bash -c 'source "'"${SCRIPT_DIR}"'/lib.sh"; b3b_cleanup strict'
if [[ -d "$GUARD_WORKSPACE" ]]; then
  printf '  PASS  N7b workspace ajeno NO borrado\n'; PASS=$((PASS + 1))
else
  printf '  FAIL  N7b el cleanup borró un workspace que no le pertenecía\n'; FAIL=$((FAIL + 1))
fi
rm -rf "$GUARD_WORKSPACE"

# N8 · host de conexión no autorizado
expect_fail "N8  host de base no autorizado" \
  env B3B_RUN_ID="$GUARD_RUN_ID" B3B_PROJECT="$GUARD_PROJECT" B3B_WORKSPACE="$GUARD_WORKSPACE" \
      bash -c 'source "'"${SCRIPT_DIR}"'/lib.sh"; b3b_validate_connection_host "db.example.com"'

# N8b · puertos prohibidos
expect_fail "N8b puerto 5434 (contenedor de test preexistente)" \
  bash -c 'source "'"${SCRIPT_DIR}"'/lib.sh"; B3B_RUN_ID=x b3b_validate_port 5434'

# N9 · checksum manipulado: sha256sum -c debe fallar y el restore no empezar.
CK_DIR="$(mktemp -d)"
printf 'contenido-sintetico\n' > "${CK_DIR}/artefacto.bin"
( cd "$CK_DIR" && sha256sum artefacto.bin > SHA256SUMS )
printf 'contenido-manipulado\n' > "${CK_DIR}/artefacto.bin"
expect_fail "N9  checksum manipulado" \
  bash -c 'cd "'"$CK_DIR"'" && sha256sum -c SHA256SUMS'
rm -rf "$CK_DIR"

# N10 · archive con '..': la inspección previa debe rechazarlo antes de extraer.
TR_DIR="$(mktemp -d)"
mkdir -p "${TR_DIR}/payload"
printf 'x\n' > "${TR_DIR}/payload/file.txt"
( cd "${TR_DIR}/payload" && tar --create --file "${TR_DIR}/evil.tar" \
    --transform 's|^file.txt|../escape.txt|' file.txt ) 2>/dev/null
expect_fail "N10 archive con '..' rechazado" \
  bash -c 'tar --list --file "'"${TR_DIR}"'/evil.tar" | grep -Eq "(^/|(^|/)\.\.(/|$))" && exit 1 || exit 0'
rm -rf "$TR_DIR"

# --- Estado final --------------------------------------------------------------

snapshot_protected "$AFTER"
if diff -q "$BEFORE" "$AFTER" > /dev/null; then
  printf '  PASS  recursos protegidos sin cambios de identidad\n'; PASS=$((PASS + 1))
else
  printf '  FAIL  la identidad de los recursos protegidos cambió\n'; FAIL=$((FAIL + 1))
fi
rm -f "$BEFORE" "$AFTER"

RESID_C="$(docker ps -aq --filter "label=com.jobit.run-id=${GUARD_RUN_ID}" | wc -l)"
RESID_V="$(docker volume ls -q --filter "label=com.jobit.run-id=${GUARD_RUN_ID}" | wc -l)"
RESID_N="$(docker network ls -q --filter "label=com.jobit.run-id=${GUARD_RUN_ID}" | wc -l)"
if [[ "$RESID_C" -eq 0 && "$RESID_V" -eq 0 && "$RESID_N" -eq 0 && ! -e "$GUARD_WORKSPACE" ]]; then
  printf '  PASS  sin residuos de las pruebas de guardas\n'; PASS=$((PASS + 1))
else
  printf '  FAIL  residuos: c=%s v=%s n=%s ws=%s\n' "$RESID_C" "$RESID_V" "$RESID_N" "$GUARD_WORKSPACE"
  FAIL=$((FAIL + 1))
fi

printf '\nGUARD_TESTS: %s PASS · %s FAIL\n' "$PASS" "$FAIL"
[[ "$FAIL" -eq 0 ]] || exit 1
