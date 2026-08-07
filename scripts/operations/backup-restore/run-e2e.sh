#!/usr/bin/env bash
# run-e2e.sh — prueba integral de backup y restore (B3-BACKUP-01).
#
# Spec: docs/specs/features/backup-restore-verification.md
#
# Flujo completo, desde cero y desechable:
#   origen sintético -> migraciones -> fixtures -> uploads sintéticos
#   -> baseline de integridad -> backup -> checksums -> destino vacío
#   -> restore -> integridad -> origen intacto -> cleanup -> sin residuos
#
# Todo el estado vive en contenedores y volúmenes propios del run, etiquetados
# con el RUN_ID. Los artefactos viven en /tmp y se destruyen en el cleanup.
#
# Uso:  ./run-e2e.sh          (genera un RUN_ID nuevo)
#       B3B_KEEP=1 ./run-e2e.sh   (no ejecuta cleanup; solo para diagnóstico)

set -Eeuo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Identidad del run ---------------------------------------------------------

export B3B_RUN_ID="${B3B_RUN_ID:-}"
if [[ -z "$B3B_RUN_ID" ]]; then
  # shellcheck source=scripts/operations/backup-restore/lib.sh
  source "${SCRIPT_DIR}/lib.sh"
  B3B_RUN_ID="$(b3b_new_run_id)"
  export B3B_RUN_ID
fi

export B3B_PROJECT="jobit-b3-backup-verify-${B3B_RUN_ID}"
export B3B_WORKSPACE="/tmp/jobit-b3-backup-verify-${B3B_RUN_ID}"

export B3B_ORIGIN_HOST="origin-db"
export B3B_TARGET_HOST="target-db"
export B3B_ORIGIN_DB="b3backup_origin"
export B3B_TARGET_DB="b3backup_target"
export B3B_TARGET_BOOTSTRAP_DB="b3backup_bootstrap"
export B3B_ORIGIN_USER="b3backup_origin_user"
export B3B_TARGET_USER="b3backup_target_user"

# shellcheck source=scripts/operations/backup-restore/lib.sh
source "${SCRIPT_DIR}/lib.sh"

# Credenciales sintéticas efímeras, generadas aquí. Nunca se leen de .env ni se
# reutilizan las del operador; nunca se imprimen.
export B3B_ORIGIN_PASSWORD="${B3B_ORIGIN_PASSWORD:-$(b3b_new_secret)}"
export B3B_TARGET_PASSWORD="${B3B_TARGET_PASSWORD:-$(b3b_new_secret)}"

RUN_T0="$(date +%s%N)"

# --- Guardas previas -----------------------------------------------------------

b3b_require_core_vars
b3b_validate_run_id
b3b_validate_project
b3b_validate_distinct_endpoints
b3b_validate_workspace
b3b_assert_no_preexisting_run_resources

b3b_log "RUN_ID=${B3B_RUN_ID}"
b3b_log "PROJECT=${B3B_PROJECT}"

b3b_create_workspace
[[ "${B3B_KEEP:-0}" == "1" ]] || b3b_install_trap

# Identidad de los recursos protegidos ANTES del run (solo existencia/estado).
b3b_snapshot_protected "${B3B_WORKSPACE}/logs/protected-before.txt"

# Fichero de entorno del Compose: 0600, dentro del workspace, efímero.
umask 077
cat > "${B3B_WORKSPACE}/env" <<EOF
B3B_PROJECT=${B3B_PROJECT}
B3B_RUN_ID=${B3B_RUN_ID}
B3B_ORIGIN_DB=${B3B_ORIGIN_DB}
B3B_ORIGIN_USER=${B3B_ORIGIN_USER}
B3B_ORIGIN_PASSWORD=${B3B_ORIGIN_PASSWORD}
B3B_TARGET_BOOTSTRAP_DB=${B3B_TARGET_BOOTSTRAP_DB}
B3B_TARGET_USER=${B3B_TARGET_USER}
B3B_TARGET_PASSWORD=${B3B_TARGET_PASSWORD}
EOF
chmod 0600 "${B3B_WORKSPACE}/env"

# --- 1 · Levantar origen y destino ---------------------------------------------

b3b_log "levantando origen y destino (postgres:16, sin puertos salvo loopback dinámico del origen)"
b3b_compose up -d --wait > "${B3B_WORKSPACE}/logs/compose-up.log" 2>&1 \
  || b3b_die 1 "no se pudo levantar el stack del run (ver logs/compose-up.log)"

PG_IMAGE_DIGEST="$(docker image inspect "$B3B_PG_IMAGE" --format '{{ index .RepoDigests 0 }}' 2>/dev/null || echo "local-only")"

# Puerto dinámico del origen, resuelto en runtime y validado (G15).
ORIGIN_PORT="$(b3b_compose port origin-db 5432 | awk -F: '{print $NF}')"
b3b_validate_port "$ORIGIN_PORT"
ORIGIN_BIND="$(b3b_compose port origin-db 5432 | awk -F: '{print $1}')"
[[ "$ORIGIN_BIND" == "127.0.0.1" ]] \
  || b3b_die 1 "G15: el origen no está publicado en loopback (${ORIGIN_BIND})"
b3b_ok "origen accesible en loopback, puerto dinámico ${ORIGIN_PORT}; destino sin publicar"

# --- 2 · Migraciones Prisma ----------------------------------------------------

b3b_log "aplicando prisma migrate deploy sobre el origen"
t0="$(date +%s%N)"
(
  cd "$B3B_REPO_ROOT"
  DATABASE_URL="postgresql://${B3B_ORIGIN_USER}:${B3B_ORIGIN_PASSWORD}@127.0.0.1:${ORIGIN_PORT}/${B3B_ORIGIN_DB}?schema=public" \
    pnpm --filter @jobit/api exec prisma migrate deploy
) > "${B3B_WORKSPACE}/logs/migrate-deploy.log" 2>&1 \
  || b3b_die 1 "prisma migrate deploy falló (ver logs/migrate-deploy.log)"
t1="$(date +%s%N)"
b3b_ok "migraciones aplicadas en $(( (t1 - t0) / 1000000 )) ms"

# --- 3 · Fixtures sintéticos ---------------------------------------------------

b3b_log "cargando fixtures sintéticos"
docker run --rm \
  --network "${B3B_PROJECT}_net" \
  --user "$(id -u):$(id -g)" \
  --label "com.jobit.task=${B3B_TASK_LABEL}" \
  --label "com.jobit.run-id=${B3B_RUN_ID}" \
  -e "PGPASSWORD=${B3B_ORIGIN_PASSWORD}" \
  -e HOME=/tmp \
  -v "${SCRIPT_DIR}/fixtures.sql:/fixtures.sql:ro" \
  "$B3B_PG_IMAGE" \
  psql -v ON_ERROR_STOP=1 -h "$B3B_ORIGIN_HOST" -U "$B3B_ORIGIN_USER" -d "$B3B_ORIGIN_DB" \
       -f /fixtures.sql \
  > "${B3B_WORKSPACE}/logs/fixtures.log" 2>&1 \
  || b3b_die 1 "los fixtures no pudieron aplicarse (ver logs/fixtures.log)"
b3b_ok "fixtures aplicados (27 filas sintéticas en 12 tablas)"

# --- 4 · Uploads sintéticos ----------------------------------------------------
# Se generan aquí, con contenido fijo y mínimo. Jamás se leen ni copian uploads
# reales del repositorio ni del host.

b3b_log "generando uploads sintéticos en ${B3B_PROJECT}_origin-uploads"
b3b_assert_not_protected "${B3B_PROJECT}_origin-uploads"
B3B_MOUNTS=("-v" "${B3B_PROJECT}_origin-uploads:/origin-uploads")
b3b_aux_run_root bash -c '
  set -e
  mkdir -p /origin-uploads/avatars/nested
  # PNG 1x1 transparente (bytes fijos, base64 estable)
  printf "%s" "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" \
    | base64 -d > /origin-uploads/avatars/b3backup-avatar-1.png
  # JPEG mínimo (bytes fijos)
  printf "%s" "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==" \
    | base64 -d > /origin-uploads/avatars/b3backup-avatar-2.jpg
  # WEBP mínimo (bytes fijos), en subdirectorio para ejercitar rutas relativas
  printf "%s" "UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJaQAA3AA/vuUAAA=" \
    | base64 -d > /origin-uploads/avatars/nested/b3backup-3.webp
  chmod 0644 /origin-uploads/avatars/b3backup-avatar-1.png \
             /origin-uploads/avatars/b3backup-avatar-2.jpg \
             /origin-uploads/avatars/nested/b3backup-3.webp
' > "${B3B_WORKSPACE}/logs/uploads-seed.log" 2>&1 \
  || b3b_die 1 "no se pudieron generar los uploads sintéticos"
b3b_ok "3 uploads sintéticos generados"

# --- 5 · Baseline de integridad del origen -------------------------------------

"${SCRIPT_DIR}/verify.sh" schema origin
"${SCRIPT_DIR}/verify.sh" collect origin "${B3B_WORKSPACE}/integrity-origin-pre.txt"
"${SCRIPT_DIR}/verify.sh" manifest "${B3B_PROJECT}_origin-uploads" "${B3B_WORKSPACE}/manifest-origin.txt"

# --- 6 · RED de integridad: verify.sh debe FALLAR con el destino vacío ---------
# Se comprueba ANTES del restore que la verificación no es vacua.

b3b_log "TDD RED: verify.sh schema target debe fallar con el destino aún vacío"
if "${SCRIPT_DIR}/verify.sh" schema target > "${B3B_WORKSPACE}/logs/red-schema-target.log" 2>&1; then
  b3b_die 4 "TDD RED fallido: verify.sh pasó contra un destino vacío"
fi
b3b_ok "TDD RED confirmado: 0 tablas de aplicación != 13 esperadas en public"

# --- 7 · Backup ----------------------------------------------------------------

"${SCRIPT_DIR}/backup.sh"

# --- 8 · Restore ---------------------------------------------------------------

"${SCRIPT_DIR}/restore.sh"

# --- 9 · Verificaciones de integridad en destino -------------------------------

"${SCRIPT_DIR}/verify.sh" schema target
"${SCRIPT_DIR}/verify.sh" unique target
"${SCRIPT_DIR}/verify.sh" collect target "${B3B_WORKSPACE}/integrity-target-post.txt"
"${SCRIPT_DIR}/verify.sh" manifest "${B3B_PROJECT}_target-uploads" "${B3B_WORKSPACE}/manifest-target.txt"
"${SCRIPT_DIR}/verify.sh" avatars target "${B3B_PROJECT}_target-uploads"

b3b_log "comparando integridad origen(pre) vs destino(post)"
"${SCRIPT_DIR}/verify.sh" compare \
  "${B3B_WORKSPACE}/integrity-origin-pre.txt" \
  "${B3B_WORKSPACE}/integrity-target-post.txt"

b3b_log "comparando manifiestos de uploads origen vs destino"
diff -u "${B3B_WORKSPACE}/manifest-origin.txt" "${B3B_WORKSPACE}/manifest-target.txt" \
  > "${B3B_WORKSPACE}/logs/manifest.diff" 2>&1 \
  || b3b_die 4 "integridad: los manifiestos de uploads difieren"
b3b_ok "manifiestos de uploads idénticos ($(wc -l < "${B3B_WORKSPACE}/manifest-origin.txt") archivos)"

# --- 10 · Origen intacto -------------------------------------------------------

"${SCRIPT_DIR}/verify.sh" collect origin "${B3B_WORKSPACE}/integrity-origin-post.txt"
"${SCRIPT_DIR}/verify.sh" compare \
  "${B3B_WORKSPACE}/integrity-origin-pre.txt" \
  "${B3B_WORKSPACE}/integrity-origin-post.txt"

origin_health="$(docker inspect --format '{{.State.Health.Status}}' "${B3B_PROJECT}-origin-db")"
[[ "$origin_health" == "healthy" ]] || b3b_die 4 "el origen no está healthy tras el restore: ${origin_health}"
b3b_ok "origen intacto y healthy tras el restore"

# --- 11 · Evidencia del run ----------------------------------------------------

RUN_T1="$(date +%s%N)"
{
  printf 'run_id=%s\n' "$B3B_RUN_ID"
  printf 'project=%s\n' "$B3B_PROJECT"
  printf 'pg_image=%s\n' "$B3B_PG_IMAGE"
  printf 'pg_image_digest=%s\n' "$PG_IMAGE_DIGEST"
  printf 'origin_loopback_port=%s\n' "$ORIGIN_PORT"
  printf 'total_ms=%s\n' "$(( (RUN_T1 - RUN_T0) / 1000000 ))"
  cat "${B3B_WORKSPACE}/logs/backup-metrics.txt"
  cat "${B3B_WORKSPACE}/logs/restore-metrics.txt"
  printf 'sha256:\n'
  cat "${B3B_WORKSPACE}/SHA256SUMS"
} > "${B3B_WORKSPACE}/logs/run-summary.txt"
chmod 0600 "${B3B_WORKSPACE}/logs/run-summary.txt"

b3b_log "----- resumen del run -----"
cat "${B3B_WORKSPACE}/logs/run-summary.txt"
b3b_log "---------------------------"

# Copia de evidencia fuera del workspace SOLO si el llamante lo pide de forma
# explícita, para poder redactar el informe tras el cleanup.
if [[ -n "${B3B_EVIDENCE_OUT:-}" ]]; then
  mkdir -p "$B3B_EVIDENCE_OUT"
  cp "${B3B_WORKSPACE}/logs/run-summary.txt"      "${B3B_EVIDENCE_OUT}/run-summary.txt"
  cp "${B3B_WORKSPACE}/integrity-origin-pre.txt"  "${B3B_EVIDENCE_OUT}/integrity-origin-pre.txt"
  cp "${B3B_WORKSPACE}/integrity-target-post.txt" "${B3B_EVIDENCE_OUT}/integrity-target-post.txt"
  cp "${B3B_WORKSPACE}/manifest-origin.txt"       "${B3B_EVIDENCE_OUT}/manifest-origin.txt"
  cp "${B3B_WORKSPACE}/logs/protected-before.txt" "${B3B_EVIDENCE_OUT}/protected-before.txt"
fi

# --- 12 · Cleanup y ausencia de residuos ---------------------------------------

if [[ "${B3B_KEEP:-0}" == "1" ]]; then
  b3b_log "B3B_KEEP=1: se omite el cleanup (modo diagnóstico)"
  exit 0
fi

trap - EXIT
b3b_cleanup strict
b3b_assert_no_residues

# Los recursos protegidos deben seguir presentes e intactos de identidad.
if [[ -n "${B3B_EVIDENCE_OUT:-}" ]]; then
  b3b_snapshot_protected "${B3B_EVIDENCE_OUT}/protected-after.txt"
  diff -u "${B3B_EVIDENCE_OUT}/protected-before.txt" "${B3B_EVIDENCE_OUT}/protected-after.txt" \
    || b3b_die 5 "la identidad de los recursos protegidos cambió durante el run"
  b3b_ok "recursos protegidos sin cambios de identidad"
fi

b3b_ok "RUN ${B3B_RUN_ID}: PASS"
