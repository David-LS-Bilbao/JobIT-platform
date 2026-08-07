#!/usr/bin/env bash
# backup.sh — backup de PostgreSQL y del volumen de uploads (B3-BACKUP-01).
#
# Spec: docs/specs/features/backup-restore-verification.md
#
# PostgreSQL: formato custom (-Fc), con --no-owner y --no-privileges, ejecutado
# desde la imagen postgres:16 (el host no tiene cliente PostgreSQL y la paridad
# 16<->16 elimina el riesgo de incompatibilidad de versiones).
#
# Uploads: tar DETERMINISTA sin compresión desde el volumen de origen montado
# SIEMPRE en solo lectura. Sin gzip a propósito: su cabecera embebe una marca de
# tiempo y rompería la reproducibilidad bit a bit del checksum entre ejecuciones.
#
# Salidas: 1 guarda · 2 checksum

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
ORIGIN_UPLOADS_VOLUME="${B3B_PROJECT}_origin-uploads"

b3b_assert_path_inside_workspace "$DUMP_FILE"
b3b_assert_path_inside_workspace "$TAR_FILE"
b3b_assert_not_protected "$ORIGIN_UPLOADS_VOLUME"

# --- Backup PostgreSQL ---------------------------------------------------------

b3b_log "backup PostgreSQL de $(b3b_redact_url "$B3B_ORIGIN_USER" "$B3B_ORIGIN_HOST" 5432 "$B3B_ORIGIN_DB")"
t0="$(date +%s%N)"
b3b_pg_run "$B3B_ORIGIN_HOST" "$B3B_ORIGIN_USER" "$B3B_ORIGIN_PASSWORD" "$B3B_ORIGIN_DB" \
  pg_dump \
    --format=custom \
    --no-owner \
    --no-privileges \
    --verbose \
    --file="/artifacts/db_${B3B_RUN_ID}.dump" \
  > "${B3B_WORKSPACE}/logs/pg_dump.log" 2>&1 \
  || b3b_die 1 "pg_dump falló (ver logs/pg_dump.log)"
t1="$(date +%s%N)"
B3B_DUMP_MS=$(( (t1 - t0) / 1000000 ))

[[ -f "$DUMP_FILE" ]] || b3b_die 1 "pg_dump no produjo artefacto"
DUMP_BYTES="$(stat -c %s "$DUMP_FILE")"
[[ "$DUMP_BYTES" -gt 0 ]] || b3b_die 1 "el dump tiene tamaño 0"
chmod 0600 "$DUMP_FILE"

# `pg_restore --list` sobre el propio artefacto: valida su estructura SIN restaurar.
b3b_pg_run "$B3B_ORIGIN_HOST" "$B3B_ORIGIN_USER" "$B3B_ORIGIN_PASSWORD" "$B3B_ORIGIN_DB" \
  pg_restore --list "/artifacts/db_${B3B_RUN_ID}.dump" \
  > "${B3B_WORKSPACE}/logs/pg_restore_list.log" 2>&1 \
  || b3b_die 1 "pg_restore --list falló sobre el dump"
TOC_OBJECTS="$(grep -cv '^;' "${B3B_WORKSPACE}/logs/pg_restore_list.log" || true)"
[[ "$TOC_OBJECTS" -gt 0 ]] || b3b_die 1 "el dump no contiene objetos en su TOC"
b3b_ok "dump: ${DUMP_BYTES} bytes · TOC ${TOC_OBJECTS} objetos · ${B3B_DUMP_MS} ms"

# --- Backup de uploads ---------------------------------------------------------

b3b_log "backup de uploads desde ${ORIGIN_UPLOADS_VOLUME} (montaje :ro)"
t0="$(date +%s%N)"
B3B_MOUNTS=(
  "-v" "${ORIGIN_UPLOADS_VOLUME}:/origin-uploads:ro"
  "-v" "${B3B_WORKSPACE}:/artifacts"
)
b3b_aux_run tar --create \
  --file "/artifacts/uploads_${B3B_RUN_ID}.tar" \
  --directory /origin-uploads \
  --sort=name \
  --numeric-owner \
  --owner=0 \
  --group=0 \
  --mtime='@0' \
  . \
  > "${B3B_WORKSPACE}/logs/tar_create.log" 2>&1 \
  || b3b_die 1 "tar de uploads falló (ver logs/tar_create.log)"
t1="$(date +%s%N)"
B3B_TAR_MS=$(( (t1 - t0) / 1000000 ))

[[ -f "$TAR_FILE" ]] || b3b_die 1 "el tar de uploads no se generó"
TAR_BYTES="$(stat -c %s "$TAR_FILE")"
[[ "$TAR_BYTES" -gt 0 ]] || b3b_die 1 "el tar de uploads tiene tamaño 0"
chmod 0600 "$TAR_FILE"
b3b_ok "uploads: ${TAR_BYTES} bytes · ${B3B_TAR_MS} ms"

# --- Checksums -----------------------------------------------------------------

( cd "$B3B_WORKSPACE" && sha256sum "db_${B3B_RUN_ID}.dump" "uploads_${B3B_RUN_ID}.tar" > SHA256SUMS )
chmod 0600 "${B3B_WORKSPACE}/SHA256SUMS"
b3b_ok "SHA256SUMS generado"

# --- Métricas para el informe (sin datos ni credenciales) ----------------------

cat > "${B3B_WORKSPACE}/logs/backup-metrics.txt" <<EOF
dump_bytes=${DUMP_BYTES}
dump_ms=${B3B_DUMP_MS}
toc_objects=${TOC_OBJECTS}
tar_bytes=${TAR_BYTES}
tar_ms=${B3B_TAR_MS}
EOF
chmod 0600 "${B3B_WORKSPACE}/logs/backup-metrics.txt"
