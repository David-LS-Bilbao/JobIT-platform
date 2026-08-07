#!/usr/bin/env bash
# lib.sh — guardas y utilidades compartidas del harness de verificación de
# backup/restore (B3-BACKUP-01).
#
# Spec: docs/specs/features/backup-restore-verification.md
# Runbook: docs/deployment/backup-restore-runbook.md
#
# Este fichero se "sourcea"; no se ejecuta directamente. Implementa las guardas
# G01-G25 del plan aprobado. Toda operación destructiva pasa obligatoriamente por
# ellas: sin guarda validada no se crea ni se borra nada.
#
# Códigos de salida (contrato):
#   1 guarda   2 checksum   3 restore   4 integridad   5 cleanup

set -Eeuo pipefail
IFS=$'\n\t'

# --- Constantes del contrato ---------------------------------------------------

B3B_TASK_LABEL="b3-backup-01-verification"
B3B_PROJECT_PREFIX="jobit-b3-backup-verify-"
B3B_WORKSPACE_PREFIX="/tmp/jobit-b3-backup-verify-"
B3B_PG_IMAGE="postgres:16"
B3B_MARKER_NAME=".b3backup-owned"

B3B_RUN_ID_REGEX='^[0-9]{8}t[0-9]{6}z-[0-9a-f]{8}$'
B3B_PROJECT_REGEX='^jobit-b3-backup-verify-[0-9]{8}t[0-9]{6}z-[0-9a-f]{8}$'

# Puertos que el harness nunca puede usar: 5432 (postgres convencional),
# 5434 (contenedor de test preexistente del operador), 3000 y 4000 (web y API).
B3B_FORBIDDEN_PORTS=(5432 5434 3000 4000)

# Recursos preexistentes que el harness jamás puede montar, escribir ni borrar.
B3B_PROTECTED_RESOURCES=(
  "jobit-staging-db-data"
  "jobit-staging-api-uploads"
  "jobit-postgres-test"
)

# Nombres de tablas de aplicación esperadas (12). `_prisma_migrations` va aparte.
B3B_EXPECTED_APPLICATION_TABLES=12
B3B_EXPECTED_PUBLIC_TABLES=13
B3B_EXPECTED_MIGRATIONS=8

B3B_APPLICATION_TABLES=(
  "CandidateProfile" "Education" "Experience" "Job" "JobPreferences" "Link"
  "PortfolioSettings" "Project" "RefreshToken" "SavedJob" "Skill" "User"
)

B3B_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
B3B_COMPOSE_FILE="${B3B_REPO_ROOT}/docker-compose.backup-restore-verification.yml"

# --- Salida y errores ----------------------------------------------------------

b3b_log() { printf '[b3b] %s\n' "$*"; }
b3b_ok()  { printf '[b3b] OK   %s\n' "$*"; }

# b3b_die <exit_code> <mensaje...>
b3b_die() {
  local code="$1"; shift
  printf '[b3b] FAIL %s\n' "$*" >&2
  exit "$code"
}

# Redacta una URL de conexión: nunca se imprime la contraseña ni la URL completa.
b3b_redact_url() {
  printf 'postgresql://%s:***@%s:%s/%s\n' "$1" "$2" "$3" "$4"
}

# --- G01 · variables obligatorias ---------------------------------------------

b3b_require_var() {
  local name="$1"
  local value="${!name-}"
  [[ -n "${value// /}" ]] || b3b_die 1 "G01: variable obligatoria vacía o ausente: ${name}"
}

b3b_require_core_vars() {
  local v
  for v in B3B_RUN_ID B3B_PROJECT B3B_WORKSPACE B3B_ORIGIN_DB B3B_TARGET_DB; do
    b3b_require_var "$v"
  done
}

# --- G02 · RUN_ID --------------------------------------------------------------

b3b_validate_run_id() {
  b3b_require_var B3B_RUN_ID
  [[ "$B3B_RUN_ID" =~ $B3B_RUN_ID_REGEX ]] \
    || b3b_die 1 "G02: RUN_ID no casa el patrón obligatorio: ${B3B_RUN_ID}"
}

b3b_new_run_id() {
  local stamp hex
  stamp="$(date -u +%Y%m%dt%H%M%Sz)"
  hex="$(head -c 4 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  printf '%s-%s\n' "$stamp" "$hex"
}

# --- G03/G04/G05 · project name ------------------------------------------------

b3b_validate_project() {
  b3b_require_var B3B_PROJECT
  b3b_validate_run_id

  # G05 primero: rechazo duro de nombres protegidos, antes que cualquier otra cosa.
  local lowered="${B3B_PROJECT,,}"
  case "$lowered" in
    *staging*|*prod*|*production*)
      b3b_die 1 "G05: project name contiene un término protegido: ${B3B_PROJECT}" ;;
  esac
  # G04: comprobación explícita e independiente.
  [[ "$lowered" != "jobit-staging" ]] \
    || b3b_die 1 "G04: project name prohibido: jobit-staging"
  # G03: patrón exacto, no prefijo.
  [[ "$B3B_PROJECT" =~ $B3B_PROJECT_REGEX ]] \
    || b3b_die 1 "G03: project name no casa el patrón exacto: ${B3B_PROJECT}"
  [[ "$B3B_PROJECT" == "${B3B_PROJECT_PREFIX}${B3B_RUN_ID}" ]] \
    || b3b_die 1 "G03: project name no corresponde al RUN_ID actual"
}

# --- G06 · origen != destino ---------------------------------------------------

b3b_validate_distinct_endpoints() {
  b3b_require_var B3B_ORIGIN_DB
  b3b_require_var B3B_TARGET_DB
  b3b_require_var B3B_ORIGIN_HOST
  b3b_require_var B3B_TARGET_HOST
  [[ "$B3B_ORIGIN_DB" != "$B3B_TARGET_DB" ]] \
    || b3b_die 1 "G06: la base de origen y la de destino son la misma: ${B3B_ORIGIN_DB}"
  [[ "$B3B_ORIGIN_HOST" != "$B3B_TARGET_HOST" ]] \
    || b3b_die 1 "G06: el host de origen y el de destino son el mismo: ${B3B_ORIGIN_HOST}"
}

# --- G11/G12/G13 · workspace ---------------------------------------------------

b3b_validate_workspace() {
  b3b_require_var B3B_WORKSPACE
  local ws="$B3B_WORKSPACE"

  [[ "$ws" == "${B3B_WORKSPACE_PREFIX}"* ]] \
    || b3b_die 1 "G11: workspace fuera del prefijo autorizado: ${ws}"
  [[ "$ws" != "/" ]]        || b3b_die 1 "G12: workspace no puede ser /"
  [[ "$ws" != "$HOME" ]]    || b3b_die 1 "G12: workspace no puede ser \$HOME"
  [[ "$ws" != "$B3B_REPO_ROOT"* ]] \
    || b3b_die 1 "G12: workspace no puede estar dentro del repositorio"
  [[ ! -L "$ws" ]]          || b3b_die 1 "G12: workspace no puede ser un symlink: ${ws}"
  [[ "$ws" == "${B3B_WORKSPACE_PREFIX}${B3B_RUN_ID}" ]] \
    || b3b_die 1 "G11: workspace no corresponde al RUN_ID actual: ${ws}"
}

# G13: toda ruta de escritura debe resolverse dentro del workspace.
b3b_assert_path_inside_workspace() {
  local path="$1" resolved parent
  parent="$(dirname "$path")"
  resolved="$(cd "$parent" 2>/dev/null && pwd -P)" \
    || b3b_die 1 "G13: no se puede resolver el directorio de ${path}"
  [[ "$resolved" == "$B3B_WORKSPACE"* ]] \
    || b3b_die 1 "G13: ruta de escritura fuera del workspace: ${path}"
}

b3b_create_workspace() {
  b3b_validate_workspace
  [[ ! -e "$B3B_WORKSPACE" ]] || b3b_die 1 "G11: el workspace ya existe: ${B3B_WORKSPACE}"
  ( umask 077; mkdir -p "$B3B_WORKSPACE/logs" )
  chmod 0700 "$B3B_WORKSPACE" "$B3B_WORKSPACE/logs"
  printf '%s\n' "$B3B_RUN_ID" > "${B3B_WORKSPACE}/${B3B_MARKER_NAME}"
  chmod 0600 "${B3B_WORKSPACE}/${B3B_MARKER_NAME}"
  b3b_ok "workspace creado: ${B3B_WORKSPACE}"
}

# --- G14/G15 · conexión y puerto ----------------------------------------------

b3b_validate_connection_host() {
  local host="$1"
  case "$host" in
    127.0.0.1|localhost|origin-db|target-db) : ;;
    *) b3b_die 1 "G14: host de conexión no autorizado: ${host}" ;;
  esac
}

b3b_validate_port() {
  local port="$1" forbidden
  [[ "$port" =~ ^[0-9]+$ ]] || b3b_die 1 "G15: puerto no numérico: ${port}"
  for forbidden in "${B3B_FORBIDDEN_PORTS[@]}"; do
    [[ "$port" != "$forbidden" ]] \
      || b3b_die 1 "G15: puerto prohibido (colisiona con un recurso preexistente): ${port}"
  done
}

# --- G16 · credenciales sintéticas --------------------------------------------

b3b_new_secret() {
  head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n'
}

# --- G08/G09/G10 · recursos del run -------------------------------------------

b3b_label_filters() {
  printf -- '--filter\nlabel=com.jobit.task=%s\n--filter\nlabel=com.jobit.run-id=%s\n' \
    "$B3B_TASK_LABEL" "$B3B_RUN_ID"
}

b3b_run_volumes() {
  printf '%s_origin-db-data\n%s_target-db-data\n%s_origin-uploads\n%s_target-uploads\n' \
    "$B3B_PROJECT" "$B3B_PROJECT" "$B3B_PROJECT" "$B3B_PROJECT"
}

b3b_assert_no_preexisting_run_resources() {
  local vol
  while read -r vol; do
    if docker volume inspect "$vol" >/dev/null 2>&1; then
      b3b_die 1 "G08: el volumen del run ya existe y no se tocará: ${vol}"
    fi
  done < <(b3b_run_volumes)

  local name
  for name in "${B3B_PROJECT}-origin-db" "${B3B_PROJECT}-target-db"; do
    if docker container inspect "$name" >/dev/null 2>&1; then
      b3b_die 1 "G09: el contenedor del run ya existe: ${name}"
    fi
  done
  if docker network inspect "${B3B_PROJECT}_net" >/dev/null 2>&1; then
    b3b_die 1 "G09: la red del run ya existe: ${B3B_PROJECT}_net"
  fi
  b3b_ok "G08/G09: ningún recurso del run preexiste"
}

# G10: solo se considera propio lo que lleva las DOS labels.
b3b_assert_owned_by_run() {
  local kind="$1" name="$2" task run
  task="$(docker "$kind" inspect --format '{{ index .Labels "com.jobit.task" }}' "$name" 2>/dev/null || true)"
  run="$(docker "$kind" inspect --format '{{ index .Labels "com.jobit.run-id" }}' "$name" 2>/dev/null || true)"
  [[ "$task" == "$B3B_TASK_LABEL" && "$run" == "$B3B_RUN_ID" ]] \
    || b3b_die 5 "G10: ${kind} ${name} no pertenece a este run; no se toca"
}

# --- G25 · recursos protegidos -------------------------------------------------

b3b_assert_not_protected() {
  local candidate="$1" protected
  for protected in "${B3B_PROTECTED_RESOURCES[@]}"; do
    [[ "$candidate" != "$protected" ]] \
      || b3b_die 1 "G25: recurso protegido usado como destino: ${candidate}"
  done
}

# Registra únicamente identidad/existencia de los recursos protegidos.
# Nunca inspecciona su contenido ni los monta.
b3b_snapshot_protected() {
  local out="$1" res kind state
  : > "$out"
  for res in "${B3B_PROTECTED_RESOURCES[@]}"; do
    if docker volume inspect "$res" >/dev/null 2>&1; then
      kind="volume"
      state="$(docker volume inspect --format '{{.Driver}}' "$res")"
    elif docker container inspect "$res" >/dev/null 2>&1; then
      kind="container"
      state="$(docker container inspect --format '{{.State.Status}}' "$res")"
    else
      kind="absent"; state="absent"
    fi
    printf '%s\t%s\t%s\n' "$res" "$kind" "$state" >> "$out"
  done
  chmod 0600 "$out"
}

# --- Ejecución de herramientas PostgreSQL en contenedor efímero ---------------
# Nunca se instala cliente PostgreSQL en el host: se usa siempre postgres:16.

# b3b_pg <host> <user> <password> <db> <comando...>
b3b_pg_run() {
  local host="$1" user="$2" password="$3" db="$4"; shift 4
  b3b_validate_connection_host "$host"
  docker run --rm \
    --network "${B3B_PROJECT}_net" \
    --user "$(id -u):$(id -g)" \
    --label "com.jobit.task=${B3B_TASK_LABEL}" \
    --label "com.jobit.run-id=${B3B_RUN_ID}" \
    -e "PGPASSWORD=${password}" \
    -e "PGHOST=${host}" \
    -e "PGUSER=${user}" \
    -e "PGDATABASE=${db}" \
    -e HOME=/tmp \
    -v "${B3B_WORKSPACE}:/artifacts" \
    "$B3B_PG_IMAGE" "$@"
}

# psql en modo escalar/tabular determinista: sin alineación, separador '|'.
b3b_psql_at() {
  local host="$1" user="$2" password="$3" db="$4" sql="$5"
  b3b_pg_run "$host" "$user" "$password" "$db" \
    psql -v ON_ERROR_STOP=1 -At -F '|' -c "$sql"
}

# Contenedor auxiliar efímero (--rm) para operar sobre volúmenes de uploads.
# Uso: B3B_MOUNTS=("-v" "vol:/ruta:ro" ...); b3b_aux_run <comando...>
# El llamante fija B3B_MOUNTS y es responsable de que los montajes de origen y de
# verificación sean `:ro` (G22) y de que el destino sea propio del run (G25).
b3b_aux_run() {
  local mounts=("${B3B_MOUNTS[@]:-}")
  docker run --rm \
    --user "$(id -u):$(id -g)" \
    --label "com.jobit.task=${B3B_TASK_LABEL}" \
    --label "com.jobit.run-id=${B3B_RUN_ID}" \
    -e HOME=/tmp \
    "${mounts[@]}" \
    "$B3B_PG_IMAGE" "$@"
}

# Variante con privilegios del contenedor, EXCLUSIVA para escribir dentro de un
# volumen Docker del run: un volumen recién creado pertenece a root:root 0755, de
# modo que un usuario no privilegiado no puede poblarlo. Se usa únicamente en dos
# puntos —sembrar `origin-uploads` y extraer en `target-uploads`—, nunca sobre el
# workspace (cuyos artefactos deben pertenecer al usuario del host) y nunca sobre
# un recurso ajeno: el llamante debe haber pasado antes b3b_assert_not_protected.
b3b_aux_run_root() {
  local mounts=("${B3B_MOUNTS[@]:-}")
  docker run --rm \
    --label "com.jobit.task=${B3B_TASK_LABEL}" \
    --label "com.jobit.run-id=${B3B_RUN_ID}" \
    -e HOME=/tmp \
    "${mounts[@]}" \
    "$B3B_PG_IMAGE" "$@"
}

# --- Compose -------------------------------------------------------------------
# G20: `down -v` SOLO con project name validado y fichero exclusivo.

b3b_compose() {
  b3b_validate_project
  docker compose \
    -p "$B3B_PROJECT" \
    -f "$B3B_COMPOSE_FILE" \
    --env-file "${B3B_WORKSPACE}/env" \
    "$@"
}

# --- Cleanup -------------------------------------------------------------------

b3b_cleanup() {
  local strict="${1:-strict}"

  # G17: marcador de propiedad obligatorio.
  if [[ ! -f "${B3B_WORKSPACE}/${B3B_MARKER_NAME}" ]]; then
    if [[ "$strict" == "strict" ]]; then
      b3b_die 5 "G17: no existe marcador de propiedad; no se borra nada"
    fi
    return 0
  fi
  local marker
  marker="$(cat "${B3B_WORKSPACE}/${B3B_MARKER_NAME}")"
  [[ "$marker" == "$B3B_RUN_ID" ]] \
    || b3b_die 5 "G17/G18: el marcador (${marker}) no coincide con el RUN_ID (${B3B_RUN_ID})"

  # G03/G05/G18: el project name debe ser exactamente el del run.
  b3b_validate_project

  b3b_log "cleanup: down -v del proyecto ${B3B_PROJECT}"
  b3b_compose down -v --remove-orphans >/dev/null 2>&1 || true

  # Barrido residual estrictamente por labels (nunca por nombre suelto).
  local id
  while read -r id; do
    [[ -n "$id" ]] || continue
    b3b_assert_owned_by_run container "$id"
    docker rm -f "$id" >/dev/null 2>&1 || true
  done < <(docker ps -aq --filter "label=com.jobit.task=${B3B_TASK_LABEL}" \
                        --filter "label=com.jobit.run-id=${B3B_RUN_ID}")

  while read -r id; do
    [[ -n "$id" ]] || continue
    b3b_assert_owned_by_run volume "$id"
    docker volume rm "$id" >/dev/null 2>&1 || true
  done < <(docker volume ls -q --filter "label=com.jobit.task=${B3B_TASK_LABEL}" \
                                --filter "label=com.jobit.run-id=${B3B_RUN_ID}")

  while read -r id; do
    [[ -n "$id" ]] || continue
    docker network rm "$id" >/dev/null 2>&1 || true
  done < <(docker network ls -q --filter "label=com.jobit.task=${B3B_TASK_LABEL}" \
                                 --filter "label=com.jobit.run-id=${B3B_RUN_ID}")

  # Workspace: revalidar antes de borrar.
  b3b_validate_workspace
  rm -rf "$B3B_WORKSPACE"
  b3b_ok "cleanup completado para ${B3B_RUN_ID}"
}

b3b_assert_no_residues() {
  local c v n
  c="$(docker ps -aq --filter "label=com.jobit.task=${B3B_TASK_LABEL}" \
                     --filter "label=com.jobit.run-id=${B3B_RUN_ID}" | wc -l)"
  v="$(docker volume ls -q --filter "label=com.jobit.task=${B3B_TASK_LABEL}" \
                            --filter "label=com.jobit.run-id=${B3B_RUN_ID}" | wc -l)"
  n="$(docker network ls -q --filter "label=com.jobit.task=${B3B_TASK_LABEL}" \
                             --filter "label=com.jobit.run-id=${B3B_RUN_ID}" | wc -l)"
  [[ "$c" -eq 0 ]] || b3b_die 5 "residuos: ${c} contenedores del run"
  [[ "$v" -eq 0 ]] || b3b_die 5 "residuos: ${v} volúmenes del run"
  [[ "$n" -eq 0 ]] || b3b_die 5 "residuos: ${n} redes del run"
  [[ ! -e "$B3B_WORKSPACE" ]] || b3b_die 5 "residuos: workspace presente ${B3B_WORKSPACE}"
  b3b_ok "sin residuos: contenedores=0 volúmenes=0 redes=0 workspace=ausente"
}

# Trap común: limpia igual tras éxito que tras fallo.
b3b_install_trap() {
  trap 'b3b_cleanup lenient' EXIT
  trap 'b3b_cleanup lenient; exit 130' INT TERM
}
