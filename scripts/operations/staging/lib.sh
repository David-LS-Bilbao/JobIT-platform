#!/usr/bin/env bash
# lib.sh — guardas y utilidades del ensayo local de staging sintético (Fase C).
#
# Spec: docs/specs/features/staging-technical-readiness.md §14
# Runbook: docs/deployment/staging-local-rehearsal.md
#
# Este fichero se "sourcea"; no se ejecuta directamente. Implementa las guardas
# JSR-01..JSR-10. Toda operación que cree o destruya algo pasa obligatoriamente
# por ellas: sin guarda validada no se crea ni se borra nada.
#
# Códigos de salida (contrato):
#   1 guarda   2 migración   3 readiness   4 Golden/persistencia   5 cleanup

set -Eeuo pipefail
IFS=$'\n\t'

# --- Constantes del contrato ---------------------------------------------------

JSR_TASK_LABEL="c-staging-rehearsal"
JSR_PROJECT_PREFIX="jobit-staging-rehearsal-"
JSR_WORKSPACE_PREFIX="/tmp/jobit-staging-rehearsal-"
JSR_PG_IMAGE="postgres:16"

JSR_RUN_ID_REGEX='^[0-9]{8}t[0-9]{6}z-[0-9a-f]{8}$'
JSR_PROJECT_REGEX='^jobit-staging-rehearsal-[0-9]{8}t[0-9]{6}z-[0-9a-f]{8}$'

# JSR-05 · puertos que el ensayo nunca puede usar: 3000 y 4000 (web y API de
# desarrollo del operador), 5432 (PostgreSQL convencional) y 5434 (contenedor de
# test preexistente).
JSR_FORBIDDEN_PORTS=(3000 4000 5432 5434)

# JSR-03 · recursos preexistentes que el ensayo jamás puede montar, escribir ni
# borrar. Ninguno se nombra en el compose del ensayo.
JSR_PROTECTED_RESOURCES=(
  "jobit-staging-db-data"
  "jobit-staging-api-uploads"
  "jobit-postgres-test"
)

# Nombre de proyecto Compose del staging REAL. Prohibido para el ensayo.
JSR_FORBIDDEN_PROJECT="jobit-staging"

JSR_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
JSR_COMPOSE_FILE="${JSR_REPO_ROOT}/docker-compose.staging.rehearsal.yml"

# --- Salida y errores ----------------------------------------------------------

jsr_log()  { printf '[jsr] %s\n' "$*"; }
jsr_ok()   { printf '[jsr] OK   %s\n' "$*"; }
jsr_step() { printf '\n[jsr] ===== %s =====\n' "$*"; }

# jsr_die <exit_code> <mensaje...>
jsr_die() {
  local code="$1"; shift
  printf '[jsr] FAIL %s\n' "$*" >&2
  exit "$code"
}

# --- JSR-01 · identidad del run ------------------------------------------------

jsr_new_run_id() {
  printf '%st%sz-%s\n' \
    "$(date -u +%Y%m%d)" "$(date -u +%H%M%S)" "$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' \n')"
}

jsr_require_var() {
  local name="$1"
  local value="${!name-}"
  [[ -n "${value// /}" ]] || jsr_die 1 "JSR-01: variable obligatoria vacía o ausente: ${name}"
}

jsr_validate_run_id() {
  jsr_require_var JSR_RUN_ID
  [[ "$JSR_RUN_ID" =~ $JSR_RUN_ID_REGEX ]] \
    || jsr_die 1 "JSR-01: RUN_ID no casa el patrón obligatorio: ${JSR_RUN_ID}"
}

# --- JSR-02 · namespace del proyecto -------------------------------------------

jsr_validate_project() {
  jsr_require_var JSR_PROJECT
  local lowered="${JSR_PROJECT,,}"
  [[ "$lowered" != "$JSR_FORBIDDEN_PROJECT" ]] \
    || jsr_die 1 "JSR-02: project name prohibido (es el staging real): ${JSR_FORBIDDEN_PROJECT}"
  [[ "$JSR_PROJECT" =~ $JSR_PROJECT_REGEX ]] \
    || jsr_die 1 "JSR-02: project name fuera del namespace del ensayo: ${JSR_PROJECT}"
  [[ "$JSR_PROJECT" == "${JSR_PROJECT_PREFIX}${JSR_RUN_ID}" ]] \
    || jsr_die 1 "JSR-02: project name no deriva del RUN_ID: ${JSR_PROJECT}"
}

# --- JSR-03 · recursos protegidos ----------------------------------------------

# Falla si `name` es —o contiene como palabra— un recurso protegido.
jsr_assert_not_protected() {
  local name="$1" protected
  for protected in "${JSR_PROTECTED_RESOURCES[@]}"; do
    [[ "$name" != "$protected" ]] \
      || jsr_die 1 "JSR-03: intento de operar sobre un recurso PROTEGIDO: ${name}"
  done
}

# Ningún nombre generado por el ensayo puede coincidir con uno protegido.
jsr_assert_generated_names_are_safe() {
  local n
  for n in "${JSR_PROJECT}" \
           "${JSR_PROJECT}_db-data" \
           "${JSR_PROJECT}_uploads" \
           "${JSR_PROJECT}_net"; do
    jsr_assert_not_protected "$n"
  done
  jsr_ok "JSR-03: ningún nombre del ensayo colisiona con un recurso protegido"
}

# --- JSR-04 · snapshot de recursos protegidos ----------------------------------

jsr_snapshot_protected() {
  local out="$1" res
  : > "$out"
  for res in "${JSR_PROTECTED_RESOURCES[@]}"; do
    if docker volume inspect "$res" >/dev/null 2>&1; then
      docker volume inspect "$res" \
        --format 'volume|{{.Name}}|{{.CreatedAt}}|{{.Driver}}|{{.Mountpoint}}|{{.Labels}}' >> "$out"
    elif docker container inspect "$res" >/dev/null 2>&1; then
      docker container inspect "$res" \
        --format 'container|{{.Name}}|{{.Id}}|{{.Config.Image}}|{{.State.Status}}|{{.State.StartedAt}}' >> "$out"
    else
      printf 'absent|%s\n' "$res" >> "$out"
    fi
  done
}

jsr_compare_protected() {
  local before="$1" after="$2"
  if diff -u "$before" "$after" > "${JSR_WORKSPACE}/logs/protected-diff.txt" 2>&1; then
    jsr_ok "JSR-04: recursos protegidos idénticos antes y después"
    return 0
  fi
  cat "${JSR_WORKSPACE}/logs/protected-diff.txt" >&2
  jsr_die 5 "PROTECTED_RESOURCE_INTEGRITY_FAILURE: los recursos protegidos han cambiado"
}

# --- JSR-05 · puertos ----------------------------------------------------------

jsr_port_is_forbidden() {
  local port="$1" forbidden
  for forbidden in "${JSR_FORBIDDEN_PORTS[@]}"; do
    [[ "$port" != "$forbidden" ]] || return 0
  done
  return 1
}

# Devuelve un puerto TCP libre en loopback, nunca uno de la lista prohibida.
jsr_find_free_port() {
  local attempt port
  for attempt in $(seq 1 50); do
    port="$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1]);s.close()')"
    if ! jsr_port_is_forbidden "$port"; then
      printf '%s\n' "$port"
      return 0
    fi
  done
  jsr_die 1 "JSR-05: no se ha podido obtener un puerto libre permitido"
}

jsr_validate_port() {
  local port="$1"
  [[ "$port" =~ ^[0-9]+$ ]] || jsr_die 1 "JSR-05: puerto no numérico: ${port}"
  (( port >= 1024 && port <= 65535 )) || jsr_die 1 "JSR-05: puerto fuera de rango: ${port}"
  ! jsr_port_is_forbidden "$port" || jsr_die 1 "JSR-05: puerto prohibido: ${port}"
}

# --- JSR-06 · credenciales sintéticas efímeras ---------------------------------

# Generadas aquí, para este run. Nunca se leen de ningún `.env` y nunca se
# imprimen: solo viven en el fichero de entorno efímero, con permisos 0600.
jsr_new_secret() {
  head -c32 /dev/urandom | od -An -tx1 | tr -d ' \n'
}

# --- JSR-07 · workspace y entorno efímeros -------------------------------------

jsr_validate_workspace() {
  jsr_require_var JSR_WORKSPACE
  [[ "$JSR_WORKSPACE" == "${JSR_WORKSPACE_PREFIX}${JSR_RUN_ID}" ]] \
    || jsr_die 1 "JSR-07: workspace fuera del prefijo obligatorio: ${JSR_WORKSPACE}"
  [[ "$JSR_WORKSPACE" != "/" && "$JSR_WORKSPACE" != "$HOME" ]] \
    || jsr_die 1 "JSR-07: workspace peligroso: ${JSR_WORKSPACE}"
}

jsr_create_workspace() {
  [[ ! -e "$JSR_WORKSPACE" ]] || jsr_die 1 "JSR-07: el workspace ya existe: ${JSR_WORKSPACE}"
  mkdir -p "${JSR_WORKSPACE}/logs"
  chmod 0700 "$JSR_WORKSPACE"
}

# Regenera por completo el fichero de entorno del Compose. Se llama dos veces:
# una en el preflight y otra tras resolver los puertos, para que un solo fichero
# siga siendo la única fuente de verdad del run.
jsr_write_env_file() {
  local previous_umask
  previous_umask="$(umask)"
  umask 077
  cat > "${JSR_WORKSPACE}/env" <<EOF
JSR_RUN_ID=${JSR_RUN_ID}
JSR_DB_NAME=${JSR_DB_NAME}
JSR_DB_USER=${JSR_DB_USER}
JSR_DB_PASSWORD=${JSR_DB_PASSWORD}
JSR_DATABASE_URL=${JSR_DATABASE_URL}
JSR_JWT_ACCESS_SECRET=${JSR_JWT_ACCESS_SECRET}
JSR_CORS_ORIGIN=${JSR_CORS_ORIGIN}
JSR_JOBIT_DATA_MODE=${JSR_JOBIT_DATA_MODE}
JSR_API_HOST_PORT=${JSR_API_HOST_PORT}
JSR_WEB_HOST_PORT=${JSR_WEB_HOST_PORT}
JSR_WEB_API_BASE_URL=${JSR_WEB_API_BASE_URL}
JSR_WEB_PUBLIC_BASE_URL=${JSR_WEB_PUBLIC_BASE_URL}
EOF
  chmod 0600 "${JSR_WORKSPACE}/env"
  umask "$previous_umask"
}

# --- JSR-08/JSR-10 · Compose acotado al proyecto -------------------------------

# Todo comando de Compose pasa por aquí: siempre con `-p` validado, el fichero
# del ensayo y el env-file efímero. Nunca el `.env` del repositorio.
jsr_compose() {
  jsr_validate_project
  docker compose \
    -p "$JSR_PROJECT" \
    -f "$JSR_COMPOSE_FILE" \
    --env-file "${JSR_WORKSPACE}/env" \
    "$@"
}

# JSR-08 · ninguna imagen del ensayo puede llamarse como las históricas del host.
jsr_assert_image_tags() {
  local tag="rehearsal-${JSR_RUN_ID}"
  local img
  for img in "jobit-api:${tag}" "jobit-web:${tag}" "jobit-api:rehearsal-tooling-${JSR_RUN_ID}"; do
    [[ "$img" != *":staging-local" && "$img" != *":latest" ]] \
      || jsr_die 1 "JSR-08: tag de imagen prohibido: ${img}"
  done
  jsr_ok "JSR-08: tags del ensayo acotados a rehearsal-${JSR_RUN_ID}"
}

# JSR-09 · el modo sintético es obligatorio; sin él la API ni siquiera arranca.
jsr_assert_data_mode() {
  [[ "${JSR_JOBIT_DATA_MODE:-}" == "SYNTHETIC_STAGING" ]] \
    || jsr_die 1 "JSR-09: JOBIT_DATA_MODE debe ser SYNTHETIC_STAGING en el ensayo"
  jsr_ok "JSR-09: JOBIT_DATA_MODE=SYNTHETIC_STAGING"
}

# JSR-10 · cleanup acotado. `down -v` SOLO con el `-p` validado; jamás `prune`.
jsr_cleanup() {
  local code="${1:-0}"
  jsr_step "cleanup (scoped a ${JSR_PROJECT})"
  if [[ -f "${JSR_WORKSPACE}/env" ]]; then
    jsr_compose down -v --remove-orphans \
      > "${JSR_WORKSPACE}/logs/compose-down.log" 2>&1 \
      || jsr_log "aviso: el cleanup de Compose devolvió error (ver logs/compose-down.log)"
  fi
  jsr_verify_no_residues
  jsr_snapshot_protected "${JSR_WORKSPACE}/logs/protected-after.txt"
  jsr_compare_protected \
    "${JSR_WORKSPACE}/logs/protected-before.txt" \
    "${JSR_WORKSPACE}/logs/protected-after.txt"
  return "$code"
}

jsr_verify_no_residues() {
  local containers volumes networks
  containers="$(docker ps -aq --filter "label=com.jobit.run-id=${JSR_RUN_ID}" | wc -l)"
  volumes="$(docker volume ls -q --filter "label=com.jobit.run-id=${JSR_RUN_ID}" | wc -l)"
  networks="$(docker network ls -q --filter "label=com.jobit.run-id=${JSR_RUN_ID}" | wc -l)"
  printf 'containers=%s volumes=%s networks=%s\n' "$containers" "$volumes" "$networks" \
    > "${JSR_WORKSPACE}/logs/residues.txt"
  if (( containers == 0 && volumes == 0 && networks == 0 )); then
    jsr_ok "JSR-10: cero residuos con com.jobit.run-id=${JSR_RUN_ID}"
    return 0
  fi
  jsr_die 5 "CLEANUP_FAILURE: residuos (containers=${containers} volumes=${volumes} networks=${networks})"
}

# Preflight completo. Debe ejecutarse antes de crear absolutamente nada.
jsr_preflight() {
  jsr_validate_run_id
  jsr_validate_project
  jsr_validate_workspace
  jsr_assert_generated_names_are_safe
  jsr_assert_data_mode
  jsr_assert_image_tags

  # JSR-02 · el ensayo no puede empezar si ya existe algo con este RUN_ID.
  local existing
  existing="$(docker ps -aq --filter "label=com.jobit.run-id=${JSR_RUN_ID}" | wc -l)"
  (( existing == 0 )) \
    || jsr_die 1 "JSR-02: ya existen contenedores con RUN_ID=${JSR_RUN_ID}"

  [[ -f "$JSR_COMPOSE_FILE" ]] \
    || jsr_die 1 "JSR-01: falta el compose del ensayo: ${JSR_COMPOSE_FILE}"

  jsr_ok "preflight superado"
}

# Espera a que una URL responda 200. No imprime cuerpos ni cabeceras.
# jsr_wait_http <url> <intentos> <descripcion>
jsr_wait_http() {
  local url="$1" attempts="$2" what="$3" i
  for i in $(seq 1 "$attempts"); do
    if curl -sf -o /dev/null "$url"; then
      jsr_ok "${what} responde 200 (intento ${i})"
      return 0
    fi
    sleep 2
  done
  return 1
}
