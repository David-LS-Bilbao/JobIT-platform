#!/usr/bin/env bash
# verify.sh — verificaciones de integridad del harness B3-BACKUP-01.
#
# Spec: docs/specs/features/backup-restore-verification.md
#
# El código de salida cero NO se acepta como evidencia: este script produce un
# informe determinista y comparable. Solo emite RECUENTOS, NOMBRES y HASHES:
# jamás filas, contenido de uploads ni credenciales.
#
# Subcomandos:
#   collect <origin|target> <fichero>   informe de integridad de una base
#   schema  <origin|target>             asserta 12 tablas de aplicación + _prisma_migrations
#   compare <ficheroA> <ficheroB>       diff estricto de dos informes
#   manifest <volumen> <fichero>        manifiesto determinista de un volumen de uploads
#   unique  <target>                    prueba de restricción única NO destructiva
#   avatars <target> <volumen>          coherencia avatarUrl <-> archivo
#
# Salidas: 1 guarda · 4 integridad

set -Eeuo pipefail
IFS=$'\n\t'

# shellcheck source=scripts/operations/backup-restore/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

b3b_endpoint() {
  case "$1" in
    origin) printf '%s\t%s\t%s\t%s\n' "$B3B_ORIGIN_HOST" "$B3B_ORIGIN_USER" "$B3B_ORIGIN_PASSWORD" "$B3B_ORIGIN_DB" ;;
    target) printf '%s\t%s\t%s\t%s\n' "$B3B_TARGET_HOST" "$B3B_TARGET_USER" "$B3B_TARGET_PASSWORD" "$B3B_TARGET_DB" ;;
    *) b3b_die 1 "rol desconocido: $1" ;;
  esac
}

b3b_q() {
  local role="$1" sql="$2" host user pass db
  IFS=$'\t' read -r host user pass db < <(b3b_endpoint "$role")
  b3b_psql_at "$host" "$user" "$pass" "$db" "$sql"
}

# --- Verificación 1 y schema ---------------------------------------------------

cmd_schema() {
  local role="$1" app_tables public_tables
  app_tables="$(b3b_q "$role" "
    SELECT count(*) FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE'
      AND table_name <> '_prisma_migrations';")"
  public_tables="$(b3b_q "$role" "
    SELECT count(*) FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE';")"

  b3b_log "schema[${role}]: application=${app_tables} public_total=${public_tables}"
  [[ "$app_tables" -eq "$B3B_EXPECTED_APPLICATION_TABLES" ]] \
    || b3b_die 4 "integridad: ${app_tables} tablas de aplicación != ${B3B_EXPECTED_APPLICATION_TABLES} esperadas"
  [[ "$public_tables" -eq "$B3B_EXPECTED_PUBLIC_TABLES" ]] \
    || b3b_die 4 "integridad: ${public_tables} tablas en public != ${B3B_EXPECTED_PUBLIC_TABLES} esperadas"
  b3b_ok "schema[${role}]: 12 tablas de aplicación + _prisma_migrations = 13"
}

# --- Informe de integridad -----------------------------------------------------

cmd_collect() {
  local role="$1" out="$2" table sql
  b3b_assert_path_inside_workspace "$out"
  : > "$out"

  # 1 · lista de tablas de public, ordenada
  {
    printf '## tables\n'
    b3b_q "$role" "
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_type='BASE TABLE'
      ORDER BY table_name;"

    # 3/4/5 · _prisma_migrations: recuento, nombres y estado
    printf '## migrations_count\n'
    b3b_q "$role" 'SELECT count(*) FROM "_prisma_migrations";'
    printf '## migrations_names\n'
    b3b_q "$role" 'SELECT migration_name FROM "_prisma_migrations" ORDER BY migration_name;'
    printf '## migrations_state\n'
    b3b_q "$role" '
      SELECT count(*) FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL;'

    # 6 · row counts de las 12 tablas de aplicación
    printf '## row_counts\n'
    for table in "${B3B_APPLICATION_TABLES[@]}"; do
      printf '%s=%s\n' "$table" "$(b3b_q "$role" "SELECT count(*) FROM \"${table}\";")"
    done

    # 7 · valores sentinela
    printf '## sentinels\n'
    b3b_q "$role" "
      SELECT 'user_email='   || coalesce((SELECT email FROM \"User\" WHERE email='b3backup-user-1@example.invalid'),'MISSING');"
    b3b_q "$role" "
      SELECT 'portfolio_slug='|| coalesce((SELECT slug FROM \"PortfolioSettings\" WHERE slug='b3backup-portfolio-1'),'MISSING');"
    b3b_q "$role" "
      SELECT 'avatar_url='   || coalesce((SELECT \"avatarUrl\" FROM \"CandidateProfile\" WHERE \"avatarUrl\" IS NOT NULL ORDER BY id LIMIT 1),'MISSING');"
    b3b_q "$role" "
      SELECT 'closed_job='   || coalesce((SELECT title FROM \"Job\" WHERE status='CLOSED' ORDER BY id LIMIT 1),'MISSING');"

    # 8 · joins críticos
    printf '## joins\n'
    printf 'user_profile_skill=%s\n' "$(b3b_q "$role" '
      SELECT count(*) FROM "User" u
      JOIN "CandidateProfile" p ON p."userId" = u.id
      JOIN "Skill" s ON s."profileId" = p.id;')"
    printf 'user_savedjob_job=%s\n' "$(b3b_q "$role" '
      SELECT count(*) FROM "User" u
      JOIN "SavedJob" sj ON sj."userId" = u.id
      JOIN "Job" j ON j.id = sj."jobId";')"

    # 9/10 · constraints
    printf '## constraints\n'
    printf 'foreign_keys=%s\n' "$(b3b_q "$role" "
      SELECT count(*) FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname='public' AND c.contype='f';")"
    printf 'unique_and_pk=%s\n' "$(b3b_q "$role" "
      SELECT count(*) FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname='public' AND c.contype IN ('u','p');")"

    # 11 · enums y etiquetas
    printf '## enums\n'
    b3b_q "$role" "
      SELECT t.typname || ':' || string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder)
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname='public'
      GROUP BY t.typname ORDER BY t.typname;"

    # 12 · longitudes de arrays sentinela
    printf '## arrays\n'
    printf 'project_technologies=%s\n' "$(b3b_q "$role" '
      SELECT coalesce(array_length(technologies,1),0) FROM "Project"
      WHERE id = '"'"'b3b00008-0000-4000-8000-000000000001'"'"';')"
    printf 'job_tags=%s\n' "$(b3b_q "$role" '
      SELECT coalesce(array_length(tags,1),0) FROM "Job"
      WHERE id = '"'"'b3b0000b-0000-4000-8000-000000000001'"'"';')"
  } >> "$out"

  # 13 · un hash determinista por tabla de aplicación.
  # La consulta ordena por clave primaria y se emite sin alineación; solo el
  # digest sale de aquí, nunca las filas.
  {
    printf '## table_hashes\n'
    for table in "${B3B_APPLICATION_TABLES[@]}"; do
      sql="SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '')) FROM \"${table}\" t;"
      printf '%s=%s\n' "$table" "$(b3b_q "$role" "$sql")"
    done
  } >> "$out"

  chmod 0600 "$out"
  b3b_ok "informe de integridad de ${role} escrito (${out##*/})"
}

cmd_compare() {
  local a="$1" b="$2"
  [[ -f "$a" && -f "$b" ]] || b3b_die 4 "integridad: falta un informe a comparar"
  if diff -u "$a" "$b" > "${B3B_WORKSPACE}/logs/compare.diff" 2>&1; then
    b3b_ok "comparación de integridad idéntica: ${a##*/} == ${b##*/}"
  else
    b3b_log "diferencias detectadas (ver logs/compare.diff)"
    b3b_die 4 "integridad: ${a##*/} y ${b##*/} difieren"
  fi
}

# --- 16/17 · manifiesto de uploads ---------------------------------------------

cmd_manifest() {
  local volume="$1" out="$2"
  b3b_assert_not_protected "$volume"
  b3b_assert_path_inside_workspace "$out"

  # Montaje SIEMPRE :ro (G22). El manifiesto es determinista: ordenado por ruta.
  B3B_MOUNTS=("-v" "${volume}:/data:ro" "-v" "${B3B_WORKSPACE}:/artifacts")
  b3b_aux_run bash -c '
    cd /data
    find . -type f -printf "%P\n" | LC_ALL=C sort | while read -r f; do
      printf "%s  %s  %s  %s\n" \
        "$(sha256sum "$f" | cut -d" " -f1)" \
        "$f" \
        "$(stat -c %s "$f")" \
        "$(stat -c %a "$f")"
    done
  ' > "$out"
  chmod 0600 "$out"
  b3b_ok "manifiesto de ${volume}: $(wc -l < "$out") archivo(s)"
}

cmd_uploads_empty() {
  local volume="$1" count
  b3b_assert_not_protected "$volume"
  B3B_MOUNTS=("-v" "${volume}:/data:ro")
  count="$(b3b_aux_run bash -c 'find /data -type f | wc -l')"
  [[ "$count" -eq 0 ]] \
    || b3b_die 4 "destino de uploads no está vacío: ${count} archivo(s) en ${volume}"
  b3b_ok "volumen de uploads destino vacío: ${volume} (0 entradas)"
}

# --- 14 · restricción única, NO destructiva ------------------------------------

cmd_unique() {
  local role="$1" host user pass db before after raw persisted
  IFS=$'\t' read -r host user pass db < <(b3b_endpoint "$role")

  before="$(b3b_q "$role" 'SELECT count(*) FROM "SavedJob";')"

  # BEGIN -> INSERT duplicado -> SQLSTATE 23505 -> ROLLBACK.
  # ON_ERROR_STOP se desactiva SOLO en este bloque para poder capturar el error;
  # `psql` aborta la transacción por sí mismo y el ROLLBACK es incondicional.
  # La comprobación posterior usa una conexión NUEVA.
  raw="$(b3b_pg_run "$host" "$user" "$pass" "$db" \
    psql -At -v ON_ERROR_STOP=0 -c "
      BEGIN;
      INSERT INTO \"SavedJob\" (\"id\",\"userId\",\"jobId\",\"savedAt\")
      VALUES ('b3b0000c-0000-4000-8000-0000000000ff',
              'b3b00001-0000-4000-8000-000000000001',
              'b3b0000b-0000-4000-8000-000000000001',
              '2026-01-23 00:00:00');
      ROLLBACK;" 2>&1 || true)"

  grep -q 'duplicate key value violates unique constraint' <<< "$raw" \
    || b3b_die 4 "integridad: la restricción única de SavedJob NO se activó (esperado SQLSTATE 23505)"

  # Conexión nueva: nada debe haberse persistido.
  after="$(b3b_q "$role" 'SELECT count(*) FROM "SavedJob";')"
  [[ "$before" -eq "$after" ]] \
    || b3b_die 4 "integridad: la prueba de unicidad alteró SavedJob (${before} -> ${after})"
  persisted="$(b3b_q "$role" "
    SELECT count(*) FROM \"SavedJob\"
    WHERE id = 'b3b0000c-0000-4000-8000-0000000000ff';")"
  [[ "$persisted" -eq 0 ]] || b3b_die 4 "integridad: fila duplicada persistida"

  b3b_ok "restricción única activa (SQLSTATE 23505) y no destructiva: SavedJob=${after}, duplicados=0"
}

# --- 15/18 · lectura mínima y coherencia avatarUrl <-> archivo -----------------

cmd_avatars() {
  local role="$1" volume="$2" url rel present rows
  b3b_assert_not_protected "$volume"

  rows="$(b3b_q "$role" "
    SELECT count(*) FROM \"CandidateProfile\"
    WHERE \"avatarUrl\" = '/uploads/avatars/b3backup-avatar-1.png';")"
  [[ "$rows" -eq 1 ]] \
    || b3b_die 4 "integridad: lectura mínima del perfil sentinela devolvió ${rows} filas (esperada 1)"

  # Todo avatarUrl no nulo debe tener su archivo en el volumen restaurado.
  while read -r url; do
    [[ -n "$url" ]] || continue
    rel="${url#/uploads/}"
    B3B_MOUNTS=("-v" "${volume}:/data:ro")
    present="$(b3b_aux_run bash -c "test -f '/data/${rel}' && echo yes || echo no")"
    [[ "$present" == "yes" ]] \
      || b3b_die 4 "integridad: avatarUrl sin archivo en el volumen restaurado (${rel})"
  done < <(b3b_q "$role" 'SELECT "avatarUrl" FROM "CandidateProfile" WHERE "avatarUrl" IS NOT NULL ORDER BY id;')

  b3b_ok "coherencia avatarUrl <-> archivo: 100% en ${volume}"
}

# --- Dispatcher ----------------------------------------------------------------

main() {
  local sub="${1:-}"; shift || true
  b3b_require_core_vars
  b3b_validate_project
  b3b_validate_workspace
  case "$sub" in
    collect)        cmd_collect "$@" ;;
    schema)         cmd_schema "$@" ;;
    compare)        cmd_compare "$@" ;;
    manifest)       cmd_manifest "$@" ;;
    uploads-empty)  cmd_uploads_empty "$@" ;;
    unique)         cmd_unique "$@" ;;
    avatars)        cmd_avatars "$@" ;;
    *) b3b_die 1 "subcomando desconocido: '${sub}'" ;;
  esac
}

main "$@"
