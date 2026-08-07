#!/usr/bin/env bash
# restore.sh — restore de PostgreSQL y del volumen de uploads (B3-BACKUP-01).
#
# Spec: docs/specs/features/backup-restore-verification.md
#
# El destino es SIEMPRE una instancia distinta del origen y una base creada vacía
# por este harness. No se usan --create ni --clean: el estado inicial del destino
# debe ser demostrable, no impuesto por un DROP.
#
# `pg_restore` continúa ante errores por defecto (documentación oficial de
# PostgreSQL 16), por lo que --exit-on-error es OBLIGATORIO; --single-transaction
# lo implica y añade atomicidad.
#
# Salidas: 1 guarda · 2 checksum · 3 restore

set -Eeuo pipefail
IFS=$'\n\t'

# shellcheck source=scripts/operations/backup-restore/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

b3b_require_core_vars
b3b_validate_project
b3b_validate_workspace
b3b_validate_distinct_endpoints

DUMP_FILE="${B3B_WORKSPACE}/db_${B3B_RUN_ID}.dump"
TAR_FILE="${B3B_WORKSPACE}/uploads_${B3B_RUN_ID}.tar"
TARGET_UPLOADS_VOLUME="${B3B_PROJECT}_target-uploads"

b3b_assert_not_protected "$TARGET_UPLOADS_VOLUME"
b3b_assert_not_protected "$B3B_TARGET_DB"

# --- Verificación de checksum ANTES de tocar el destino ------------------------
# Si el checksum no cuadra, el restore no empieza: salida 2 y destino intacto.

b3b_log "verificando SHA256SUMS antes de crear o tocar el destino"
( cd "$B3B_WORKSPACE" && sha256sum -c SHA256SUMS ) \
  > "${B3B_WORKSPACE}/logs/sha256sum-check.log" 2>&1 \
  || b3b_die 2 "checksum inválido: el restore NO se ha iniciado"
b3b_ok "checksum verificado (dump y tar íntegros)"

# --- Destino PostgreSQL: crear vacío y demostrarlo -----------------------------

exists="$(b3b_psql_at "$B3B_TARGET_HOST" "$B3B_TARGET_USER" "$B3B_TARGET_PASSWORD" \
  "$B3B_TARGET_BOOTSTRAP_DB" \
  "SELECT count(*) FROM pg_database WHERE datname = '${B3B_TARGET_DB}';")"
[[ "$exists" -eq 0 ]] \
  || b3b_die 1 "G07: la base destino ya existe antes del run: ${B3B_TARGET_DB}"

b3b_psql_at "$B3B_TARGET_HOST" "$B3B_TARGET_USER" "$B3B_TARGET_PASSWORD" \
  "$B3B_TARGET_BOOTSTRAP_DB" "CREATE DATABASE \"${B3B_TARGET_DB}\";" >/dev/null
b3b_ok "base destino creada: ${B3B_TARGET_DB}"

# Criterio de vacío: 0 tablas de aplicación, _prisma_migrations ausente y 0
# schemas de aplicación inesperados. Los objetos internos de PostgreSQL
# (pg_catalog, information_schema, public vacío) NO son incumplimiento.
app_tables="$(b3b_psql_at "$B3B_TARGET_HOST" "$B3B_TARGET_USER" "$B3B_TARGET_PASSWORD" "$B3B_TARGET_DB" "
  SELECT count(*) FROM information_schema.tables
  WHERE table_schema='public' AND table_type='BASE TABLE'
    AND table_name <> '_prisma_migrations';")"
prisma_present="$(b3b_psql_at "$B3B_TARGET_HOST" "$B3B_TARGET_USER" "$B3B_TARGET_PASSWORD" "$B3B_TARGET_DB" "
  SELECT count(*) FROM information_schema.tables
  WHERE table_schema='public' AND table_name='_prisma_migrations';")"
extra_schemas="$(b3b_psql_at "$B3B_TARGET_HOST" "$B3B_TARGET_USER" "$B3B_TARGET_PASSWORD" "$B3B_TARGET_DB" "
  SELECT count(*) FROM information_schema.schemata
  WHERE schema_name NOT IN ('public','information_schema','pg_catalog','pg_toast');")"

[[ "$app_tables" -eq 0 ]]     || b3b_die 1 "G07: el destino no está vacío (${app_tables} tablas de aplicación)"
[[ "$prisma_present" -eq 0 ]] || b3b_die 1 "G07: el destino ya contiene _prisma_migrations"
[[ "$extra_schemas" -eq 0 ]]  || b3b_die 1 "G07: el destino tiene ${extra_schemas} schema(s) de aplicación inesperados"
b3b_ok "destino vacío acreditado: 0 tablas de aplicación · _prisma_migrations ausente · 0 schemas inesperados"

# --- Destino de uploads: vacío -------------------------------------------------

count="$(B3B_MOUNTS=("-v" "${TARGET_UPLOADS_VOLUME}:/data:ro"); b3b_aux_run bash -c 'find /data -type f | wc -l')"
[[ "$count" -eq 0 ]] || b3b_die 1 "G24: el volumen de uploads destino no está vacío (${count} archivos)"
b3b_ok "volumen de uploads destino vacío: ${TARGET_UPLOADS_VOLUME}"

# --- Restore PostgreSQL --------------------------------------------------------

b3b_log "restore PostgreSQL hacia $(b3b_redact_url "$B3B_TARGET_USER" "$B3B_TARGET_HOST" 5432 "$B3B_TARGET_DB")"
t0="$(date +%s%N)"
b3b_pg_run "$B3B_TARGET_HOST" "$B3B_TARGET_USER" "$B3B_TARGET_PASSWORD" "$B3B_TARGET_DB" \
  pg_restore \
    --dbname="$B3B_TARGET_DB" \
    --exit-on-error \
    --single-transaction \
    --no-owner \
    --no-privileges \
    --verbose \
    "/artifacts/db_${B3B_RUN_ID}.dump" \
  > "${B3B_WORKSPACE}/logs/pg_restore.log" 2>&1 \
  || b3b_die 3 "pg_restore falló (ver logs/pg_restore.log)"
t1="$(date +%s%N)"
RESTORE_DB_MS=$(( (t1 - t0) / 1000000 ))
b3b_ok "restore PostgreSQL completado en ${RESTORE_DB_MS} ms"

# --- Restore de uploads --------------------------------------------------------
# G23: inspección previa del archive. Se rechaza toda entrada con ruta absoluta
# o con `..` antes de extraer nada.

b3b_log "inspeccionando el archive de uploads antes de extraer"
B3B_MOUNTS=("-v" "${B3B_WORKSPACE}:/artifacts:ro")
b3b_aux_run tar --list --file "/artifacts/uploads_${B3B_RUN_ID}.tar" \
  > "${B3B_WORKSPACE}/logs/tar_list.log" 2>&1 \
  || b3b_die 3 "no se pudo listar el archive de uploads"

if grep -Eq '(^/|(^|/)\.\.(/|$))' "${B3B_WORKSPACE}/logs/tar_list.log"; then
  b3b_die 3 "G23: el archive contiene rutas absolutas o '..'; extracción rechazada"
fi
b3b_ok "archive seguro: $(grep -c . "${B3B_WORKSPACE}/logs/tar_list.log") entrada(s), sin rutas absolutas ni '..'"

# Escritura sobre el volumen destino EXCLUSIVAMENTE durante esta extracción.
# El archive va montado :ro; el contenedor auxiliar es --rm.
t0="$(date +%s%N)"
B3B_MOUNTS=(
  "-v" "${B3B_WORKSPACE}:/artifacts:ro"
  "-v" "${TARGET_UPLOADS_VOLUME}:/target-uploads"
)
b3b_aux_run_root tar --extract \
  --file "/artifacts/uploads_${B3B_RUN_ID}.tar" \
  --directory /target-uploads \
  --no-same-owner \
  > "${B3B_WORKSPACE}/logs/tar_extract.log" 2>&1 \
  || b3b_die 3 "la extracción de uploads falló (ver logs/tar_extract.log)"
t1="$(date +%s%N)"
RESTORE_UPLOADS_MS=$(( (t1 - t0) / 1000000 ))
b3b_ok "uploads restaurados en ${TARGET_UPLOADS_VOLUME} en ${RESTORE_UPLOADS_MS} ms"

cat > "${B3B_WORKSPACE}/logs/restore-metrics.txt" <<EOF
restore_db_ms=${RESTORE_DB_MS}
restore_uploads_ms=${RESTORE_UPLOADS_MS}
EOF
chmod 0600 "${B3B_WORKSPACE}/logs/restore-metrics.txt"
