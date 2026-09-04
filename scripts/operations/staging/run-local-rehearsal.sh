#!/usr/bin/env bash
# run-local-rehearsal.sh — ensayo local aislado del staging sintético (Fase C).
#
# Spec: docs/specs/features/staging-technical-readiness.md §14
# Runbook: docs/deployment/staging-local-rehearsal.md
#
# Acredita el contrato completo sin desplegar nada:
#   preflight → aislamiento → imágenes production-equivalent → SOLO la base
#   → migrate status → migrate deploy → migrate status (gate) → seed sintético
#   → API → /ready → Web → Golden staging ×2 → persistencia con reinicio
#   → cleanup acotado → recursos protegidos intactos → cero residuos
#
# LA API Y LA WEB NO ARRANCAN ANTES DEL GATE DE MIGRACIONES. Ese es el punto del
# ensayo: reproducir el orden real de despliegue, no solo que el stack levante.
#
# Uso:  ./run-local-rehearsal.sh
#       JSR_KEEP=1 ./run-local-rehearsal.sh    (omite el cleanup; solo diagnóstico)

set -Eeuo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Identidad del run ---------------------------------------------------------

# shellcheck source=scripts/operations/staging/lib.sh
source "${SCRIPT_DIR}/lib.sh"

export JSR_RUN_ID="${JSR_RUN_ID:-$(jsr_new_run_id)}"
export JSR_PROJECT="${JSR_PROJECT_PREFIX}${JSR_RUN_ID}"
export JSR_WORKSPACE="${JSR_WORKSPACE_PREFIX}${JSR_RUN_ID}"

# El nombre contiene `staging` a propósito: debe clasificar STAGING para que el
# ensayo ejercite la guarda real y no una ruta más permisiva.
export JSR_DB_NAME="jobit_rehearsal_staging"
export JSR_DB_USER="jobit_rehearsal"
export JSR_JOBIT_DATA_MODE="SYNTHETIC_STAGING"

# JSR-06 · credenciales sintéticas del run. Nunca leídas de un `.env`, nunca
# impresas: solo viajan al fichero de entorno efímero con permisos 0600.
export JSR_DB_PASSWORD="${JSR_DB_PASSWORD:-$(jsr_new_secret)}"
export JSR_JWT_ACCESS_SECRET="${JSR_JWT_ACCESS_SECRET:-$(jsr_new_secret)}"
export JSR_DATABASE_URL="postgresql://${JSR_DB_USER}:${JSR_DB_PASSWORD}@rehearsal-db:5432/${JSR_DB_NAME}?schema=public"

RUN_T0="$(date +%s)"
EVIDENCE=""
add_evidence() { EVIDENCE="${EVIDENCE}$1"$'\n'; }

# --- 1 · Preflight -------------------------------------------------------------

jsr_step "1 · preflight y guardas"

# JSR-05 · puertos resueltos ahora, antes de crear nada: `CORS_ORIGIN` de la API
# y `NEXT_PUBLIC_API_BASE_URL` de la web se necesitan mutuamente, así que ambos
# deben conocerse antes del primer arranque.
JSR_API_HOST_PORT="$(jsr_find_free_port)"
JSR_WEB_HOST_PORT="$(jsr_find_free_port)"
while [[ "$JSR_WEB_HOST_PORT" == "$JSR_API_HOST_PORT" ]]; do
  JSR_WEB_HOST_PORT="$(jsr_find_free_port)"
done
export JSR_API_HOST_PORT JSR_WEB_HOST_PORT
jsr_validate_port "$JSR_API_HOST_PORT"
jsr_validate_port "$JSR_WEB_HOST_PORT"

export JSR_WEB_API_BASE_URL="http://127.0.0.1:${JSR_API_HOST_PORT}"
export JSR_WEB_PUBLIC_BASE_URL="http://127.0.0.1:${JSR_WEB_HOST_PORT}"
export JSR_CORS_ORIGIN="$JSR_WEB_PUBLIC_BASE_URL"

jsr_preflight
jsr_log "RUN_ID=${JSR_RUN_ID}"
jsr_log "PROJECT=${JSR_PROJECT}"
jsr_log "puertos loopback: api=${JSR_API_HOST_PORT} web=${JSR_WEB_HOST_PORT} (db: sin puerto)"

# --- 2 · Recursos aislados -----------------------------------------------------

jsr_step "2 · workspace efímero y snapshot de recursos protegidos"
jsr_create_workspace
jsr_write_env_file
jsr_snapshot_protected "${JSR_WORKSPACE}/logs/protected-before.txt"
jsr_ok "snapshot de recursos protegidos registrado"

# El cleanup corre igual tras éxito que tras fallo, salvo diagnóstico explícito.
if [[ "${JSR_KEEP:-0}" != "1" ]]; then
  trap 'code=$?; jsr_cleanup "$code" || true; exit "$code"' EXIT
fi

# --- 3 · Imágenes equivalentes a producción ------------------------------------

jsr_step "3 · build de imágenes (siempre explícito, nunca reutilización implícita)"
# Sin `--pull`: Compose no reconsulta el registro salvo que se le pida, y las
# imágenes del ensayo se construyen SIEMPRE (tags únicos por RUN_ID), así que no
# hay reutilización posible de las históricas del host.
jsr_compose --profile tooling build \
  > "${JSR_WORKSPACE}/logs/build.log" 2>&1 \
  || { tail -40 "${JSR_WORKSPACE}/logs/build.log" >&2; jsr_die 1 "el build de imágenes falló"; }

API_IMAGE="jobit-api:rehearsal-${JSR_RUN_ID}"
WEB_IMAGE="jobit-web:rehearsal-${JSR_RUN_ID}"
TOOLING_IMAGE="jobit-api:rehearsal-tooling-${JSR_RUN_ID}"
PG_DIGEST="$(docker image inspect "$JSR_PG_IMAGE" --format '{{ index .RepoDigests 0 }}' 2>/dev/null || echo 'local-only')"
jsr_ok "imágenes: ${API_IMAGE} · ${WEB_IMAGE} · ${TOOLING_IMAGE}"
add_evidence "database image        : ${JSR_PG_IMAGE} (${PG_DIGEST})"
add_evidence "api rehearsal image   : ${API_IMAGE}"
add_evidence "web rehearsal image   : ${WEB_IMAGE}"
add_evidence "tooling image         : ${TOOLING_IMAGE}"

# --- 4/5 · Solo la base --------------------------------------------------------

jsr_step "4-5 · arranque de SOLO la base y espera de pg_isready"
jsr_compose up -d --wait rehearsal-db \
  > "${JSR_WORKSPACE}/logs/compose-up-db.log" 2>&1 \
  || jsr_die 1 "la base del ensayo no llegó a healthy"

RUNNING_AFTER_DB="$(jsr_compose ps --services --filter status=running | sort | tr '\n' ' ')"
[[ "$RUNNING_AFTER_DB" == "rehearsal-db " ]] \
  || jsr_die 1 "MIGRATION_GATE: hay servicios arrancados antes de migrar: ${RUNNING_AFTER_DB}"
jsr_ok "solo rehearsal-db está en marcha; API y Web siguen paradas"
add_evidence "health DB             : healthy (pg_isready)"

# --- 6 · migrate status previo (informativo) -----------------------------------

jsr_step "6 · prisma migrate status (previo, informativo)"
set +e
jsr_compose run --rm --no-deps rehearsal-tooling \
  pnpm --filter @jobit/api exec prisma migrate status \
  > "${JSR_WORKSPACE}/logs/migrate-status-pre.log" 2>&1
PRE_STATUS_CODE=$?
set -e
PRE_STATUS_SUMMARY="$(grep -Eo '[0-9]+ migrations? found|have not yet been applied|Database schema is up to date' \
  "${JSR_WORKSPACE}/logs/migrate-status-pre.log" | tr '\n' '; ' || true)"
jsr_log "estado previo (exit=${PRE_STATUS_CODE}): ${PRE_STATUS_SUMMARY:-sin resumen}"
add_evidence "migrate pre-status    : exit=${PRE_STATUS_CODE} — ${PRE_STATUS_SUMMARY:-pendientes esperados en base vacía}"

# --- 7 · migrate deploy --------------------------------------------------------

jsr_step "7 · prisma migrate deploy (GATE: si falla, API y Web NO arrancan)"
jsr_compose run --rm --no-deps rehearsal-tooling \
  pnpm --filter @jobit/api exec prisma migrate deploy \
  > "${JSR_WORKSPACE}/logs/migrate-deploy.log" 2>&1 \
  || { tail -30 "${JSR_WORKSPACE}/logs/migrate-deploy.log" >&2
       jsr_die 2 "MIGRATION_FAILURE: migrate deploy falló — parada dura, sin arrancar API ni Web"; }

APPLIED="$(grep -Eo '[0-9]+ migrations? found' "${JSR_WORKSPACE}/logs/migrate-deploy.log" | head -1 || true)"
jsr_ok "migrate deploy completado (${APPLIED:-ver log})"
add_evidence "migrate deploy        : OK (${APPLIED:-ver log})"

# --- 8 · migrate status posterior (GATE duro) ----------------------------------

jsr_step "8 · prisma migrate status (GATE: cero pendientes)"
jsr_compose run --rm --no-deps rehearsal-tooling \
  pnpm --filter @jobit/api exec prisma migrate status \
  > "${JSR_WORKSPACE}/logs/migrate-status-post.log" 2>&1 \
  || { tail -30 "${JSR_WORKSPACE}/logs/migrate-status-post.log" >&2
       jsr_die 2 "MIGRATION_STATUS_NOT_CLEAN_AFTER_DEPLOY"; }

grep -q "Database schema is up to date" "${JSR_WORKSPACE}/logs/migrate-status-post.log" \
  || { tail -30 "${JSR_WORKSPACE}/logs/migrate-status-post.log" >&2
       jsr_die 2 "MIGRATION_STATUS_NOT_CLEAN_AFTER_DEPLOY: el estado posterior no está limpio"; }

MIGRATION_COUNT="$(grep -Eo '[0-9]+ migrations? found' "${JSR_WORKSPACE}/logs/migrate-status-post.log" | grep -Eo '[0-9]+' | head -1 || echo '?')"
jsr_ok "estado posterior limpio · ${MIGRATION_COUNT} migraciones"
add_evidence "migrate post-status   : clean — ${MIGRATION_COUNT} migraciones aplicadas"

# --- 9 · Seed sintético --------------------------------------------------------

jsr_step "9 · seed sintético (STAGING + JOBIT_DATA_MODE=SYNTHETIC_STAGING)"
jsr_compose run --rm --no-deps rehearsal-tooling \
  pnpm --filter @jobit/api exec tsx prisma/seed.ts \
  > "${JSR_WORKSPACE}/logs/seed.log" 2>&1 \
  || { tail -20 "${JSR_WORKSPACE}/logs/seed.log" >&2; jsr_die 2 "el seed sintético falló"; }

SEED_SUMMARY="$(grep -Eo 'created=[0-9]+ updated=[0-9]+ total=[0-9]+' "${JSR_WORKSPACE}/logs/seed.log" | tail -1 || echo 'sin resumen')"
jsr_ok "seed: ${SEED_SUMMARY}"
add_evidence "seed                  : ${SEED_SUMMARY}"

# --- 10/11 · API y readiness ---------------------------------------------------

jsr_step "10-11 · arranque de la API y espera de /ready"
jsr_compose up -d --wait rehearsal-api \
  > "${JSR_WORKSPACE}/logs/compose-up-api.log" 2>&1 \
  || { jsr_compose logs --no-color rehearsal-api > "${JSR_WORKSPACE}/logs/api.log" 2>&1 || true
       jsr_die 3 "READINESS_FAILURE: la API no llegó a healthy"; }

API_BASE="http://127.0.0.1:${JSR_API_HOST_PORT}"
HEALTH_CODE="$(curl -s -o /dev/null -w '%{http_code}' "${API_BASE}/health")"
READY_CODE="$(curl -s -o /dev/null -w '%{http_code}' "${API_BASE}/ready")"
[[ "$HEALTH_CODE" == "200" ]] || jsr_die 3 "READINESS_FAILURE: /health devolvió ${HEALTH_CODE}"
[[ "$READY_CODE" == "200" ]] || jsr_die 3 "READINESS_FAILURE: /ready devolvió ${READY_CODE}"
jsr_ok "/health=${HEALTH_CODE} /ready=${READY_CODE}"
add_evidence "health API /health    : ${HEALTH_CODE}"
add_evidence "health API /ready     : ${READY_CODE}"

# --- 12/13 · Web ---------------------------------------------------------------

jsr_step "12-13 · arranque de la Web y espera de HTTP"
jsr_compose up -d --wait rehearsal-web \
  > "${JSR_WORKSPACE}/logs/compose-up-web.log" 2>&1 \
  || jsr_die 3 "la Web no llegó a healthy"

WEB_BASE="http://127.0.0.1:${JSR_WEB_HOST_PORT}"
WEB_CODE="$(curl -s -o /dev/null -w '%{http_code}' "$WEB_BASE")"
[[ "$WEB_CODE" == "200" ]] || jsr_die 3 "la Web devolvió ${WEB_CODE}"
jsr_ok "web=${WEB_CODE}"
add_evidence "health Web            : ${WEB_CODE}"

# El marcador sintético se hornea en el build: si no viajó como build-arg, no
# existe en el bundle por mucho que la variable esté en el entorno del contenedor.
if curl -s "$WEB_BASE" | grep -q "ENTORNO DE STAGING SINT"; then
  jsr_ok "marcador de entorno sintético presente en la imagen production-equivalent"
  add_evidence "synthetic banner      : presente en la imagen de la web"
else
  jsr_die 4 "el marcador de entorno sintético NO está en el bundle de la imagen web"
fi

# --- 14 · Golden staging (dos ejecuciones) -------------------------------------

jsr_step "14 · Golden staging E2E (dos ejecuciones sobre la MISMA base persistente)"

# Cuenta usuarios a través del tooling. `pnpm --filter` fija el cwd en
# `apps/api`, que es donde pnpm enlaza `@prisma/client`: desde `/repo` la
# resolución falla y devolvería vacío en silencio.
users_count() {
  local out
  out="$(jsr_compose run --rm --no-deps -T rehearsal-tooling \
    pnpm --filter @jobit/api exec node -e \
    'const{PrismaClient}=require("@prisma/client");const p=new PrismaClient();p.user.count().then(n=>{console.log("USERS="+n);return p.$disconnect()}).catch(()=>{process.exit(1)})' \
    2>/dev/null | grep -Eo 'USERS=[0-9]+' | cut -d= -f2 | tr -d '\r' | tail -1)"
  # Un conteo ilegible NO puede degradar a "sin cambios": eso convertiría la
  # comprobación de idempotencia en un falso positivo.
  [[ "$out" =~ ^[0-9]+$ ]] || jsr_die 4 "GOLDEN_STAGING_FAILURE: no se pudo leer el conteo de User"
  printf '%s\n' "$out"
}

USERS_BEFORE="$(users_count)"
jsr_log "usuarios antes de los Golden: ${USERS_BEFORE}"

run_golden() {
  local label="$1"
  ( cd "$JSR_REPO_ROOT" \
    && E2E_BASE_URL="$WEB_BASE" \
       E2E_API_BASE_URL="$API_BASE" \
       pnpm --filter @jobit/web exec playwright test e2e/staging-golden.spec.ts --reporter=list ) \
    > "${JSR_WORKSPACE}/logs/golden-${label}.log" 2>&1
}

if run_golden "run1"; then
  jsr_ok "Golden staging run #1 PASS"
  add_evidence "golden staging run #1 : PASS"
else
  tail -40 "${JSR_WORKSPACE}/logs/golden-run1.log" >&2
  jsr_die 4 "GOLDEN_STAGING_FAILURE: run #1"
fi

if run_golden "run2"; then
  jsr_ok "Golden staging run #2 PASS"
  add_evidence "golden staging run #2 : PASS"
else
  tail -40 "${JSR_WORKSPACE}/logs/golden-run2.log" >&2
  jsr_die 4 "GOLDEN_STAGING_FAILURE: run #2"
fi

USERS_AFTER="$(users_count)"
jsr_log "usuarios tras los Golden: ${USERS_AFTER}"
[[ "$USERS_BEFORE" == "$USERS_AFTER" ]] \
  || jsr_die 4 "GOLDEN_STAGING_FAILURE: crecimiento neto de User (${USERS_BEFORE} → ${USERS_AFTER})"
jsr_ok "sin crecimiento neto de User: ${USERS_BEFORE} → ${USERS_AFTER}"
add_evidence "golden idempotence    : User ${USERS_BEFORE} → ${USERS_AFTER} (sin crecimiento neto)"

# --- 15 · Persistencia con reinicio real ---------------------------------------
# Comprobación a nivel HTTP, deliberadamente fuera de Playwright: el reinicio del
# contenedor ocurre A MITAD del recorrido y un navegador no puede orquestarlo.

jsr_step "15 · persistencia: DB, uploads y coherencia avatarUrl ↔ fichero"

PERSIST_EMAIL="rehearsal-persist-${JSR_RUN_ID}@synthetic.jobit.invalid"
PERSIST_PASS="JobitRehearsal123"
JAR="${JSR_WORKSPACE}/persist-cookies.txt"

REGISTER_BODY="$(curl -s -c "$JAR" -H 'Content-Type: application/json' \
  -d "{\"email\":\"${PERSIST_EMAIL}\",\"password\":\"${PERSIST_PASS}\"}" \
  "${API_BASE}/api/auth/register")"
TOKEN="$(printf '%s' "$REGISTER_BODY" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("accessToken",""))' 2>/dev/null || true)"
[[ -n "$TOKEN" ]] || jsr_die 4 "PERSISTENCE_FAILURE: no se pudo registrar la identidad sintética de persistencia"

curl -s -o /dev/null -X PUT -H "Authorization: Bearer ${TOKEN}" -H 'Content-Type: application/json' \
  -d '{"firstName":"Rehearsal","lastName":"Persist","headline":"Persistence check"}' \
  "${API_BASE}/api/profile/me"
curl -s -o /dev/null -X POST -H "Authorization: Bearer ${TOKEN}" -H 'Content-Type: application/json' \
  -d '{"name":"TypeScript"}' "${API_BASE}/api/profile/me/skills"

# PNG 1x1 real y decodificable, generado aquí. Ningún fichero del host se copia.
printf '%s' 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' \
  | base64 -d > "${JSR_WORKSPACE}/avatar.png"
AVATAR_BODY="$(curl -s -X POST -H "Authorization: Bearer ${TOKEN}" \
  -F "avatar=@${JSR_WORKSPACE}/avatar.png;type=image/png" "${API_BASE}/api/profile/me/avatar")"
AVATAR_URL="$(printf '%s' "$AVATAR_BODY" | python3 -c 'import sys,json,re
d=json.load(sys.stdin)
def find(o):
    if isinstance(o,dict):
        for k,v in o.items():
            if k=="avatarUrl" and isinstance(v,str): return v
            r=find(v)
            if r: return r
    if isinstance(o,list):
        for v in o:
            r=find(v)
            if r: return r
    return None
print(find(d) or "")' 2>/dev/null || true)"
[[ -n "$AVATAR_URL" ]] || jsr_die 4 "PERSISTENCE_FAILURE: la subida de avatar no devolvió avatarUrl"

AVATAR_FILE="$(basename "$AVATAR_URL")"
AV_BEFORE="$(curl -s -o /dev/null -w '%{http_code}' "${API_BASE}${AVATAR_URL}")"
[[ "$AV_BEFORE" == "200" ]] || jsr_die 4 "PERSISTENCE_FAILURE: el avatar no se sirve antes del reinicio (${AV_BEFORE})"
jsr_ok "perfil, skill y avatar creados; avatar servido (${AV_BEFORE})"
add_evidence "avatar before restart : ${AV_BEFORE}"

jsr_step "15b · reinicio real del contenedor de la API"
jsr_compose restart rehearsal-api > "${JSR_WORKSPACE}/logs/api-restart.log" 2>&1 \
  || jsr_die 4 "PERSISTENCE_FAILURE: no se pudo reiniciar la API"
jsr_wait_http "${API_BASE}/ready" 30 "/ready tras el reinicio" \
  || jsr_die 3 "READINESS_FAILURE: /ready no volvió a 200 tras el reinicio"
add_evidence "API restart           : OK — /ready 200 de nuevo"

PROFILE_AFTER="$(curl -s -H "Authorization: Bearer ${TOKEN}" "${API_BASE}/api/profile/me")"
printf '%s' "$PROFILE_AFTER" | grep -q '"firstName":"Rehearsal"' \
  || jsr_die 4 "PERSISTENCE_FAILURE: el perfil no sobrevivió al reinicio"
printf '%s' "$PROFILE_AFTER" | grep -q 'TypeScript' \
  || jsr_die 4 "PERSISTENCE_FAILURE: la skill no sobrevivió al reinicio"
printf '%s' "$PROFILE_AFTER" | grep -q "$AVATAR_FILE" \
  || jsr_die 4 "PERSISTENCE_FAILURE: avatarUrl no sobrevivió al reinicio"
AV_AFTER="$(curl -s -o /dev/null -w '%{http_code}' "${API_BASE}${AVATAR_URL}")"
[[ "$AV_AFTER" == "200" ]] || jsr_die 4 "PERSISTENCE_FAILURE: el avatar no se sirve tras el reinicio (${AV_AFTER})"
jsr_ok "perfil, skill, avatarUrl y fichero de avatar persisten tras el reinicio"
add_evidence "persistence DB        : perfil y skill intactos tras recrear el proceso"
add_evidence "avatar after restart  : ${AV_AFTER}"

jsr_step "15c · borrado de cuenta y limpieza física del avatar"
DEL_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X DELETE -b "$JAR" \
  -H "Authorization: Bearer ${TOKEN}" -H 'Content-Type: application/json' \
  -d "{\"password\":\"${PERSIST_PASS}\",\"confirmation\":\"DELETE\"}" \
  "${API_BASE}/api/auth/me")"
[[ "$DEL_CODE" =~ ^(200|204)$ ]] || jsr_die 4 "PERSISTENCE_FAILURE: el borrado devolvió ${DEL_CODE}"

AV_DELETED="$(curl -s -o /dev/null -w '%{http_code}' "${API_BASE}${AVATAR_URL}")"
[[ "$AV_DELETED" == "404" ]] \
  || jsr_die 4 "AVATAR_PHYSICAL_CLEANUP_FAILURE: el avatar sigue sirviéndose (${AV_DELETED})"

# Comprobación en el volumen: la respuesta HTTP no basta para afirmar que el
# fichero desapareció del disco.
jsr_assert_not_protected "${JSR_PROJECT}_uploads"
PHYSICAL="$(docker run --rm -v "${JSR_PROJECT}_uploads:/u:ro" --label "com.jobit.run-id=${JSR_RUN_ID}" \
  "$JSR_PG_IMAGE" sh -c "test -f /u/avatars/${AVATAR_FILE} && echo PRESENT || echo ABSENT" 2>/dev/null || echo 'ABSENT')"
[[ "$PHYSICAL" == "ABSENT" ]] \
  || jsr_die 4 "AVATAR_PHYSICAL_CLEANUP_FAILURE: el fichero sigue en el volumen"
jsr_ok "avatar 404 y fichero ausente del volumen"
add_evidence "avatar after delete   : ${AV_DELETED} y fichero ausente del volumen"
add_evidence "physical cleanup      : OK"

# --- 16-18 · resumen; el cleanup y las verificaciones los hace el trap ----------

DURATION=$(( $(date +%s) - RUN_T0 ))
jsr_step "resumen del ensayo"
cat <<SUMMARY | tee "${JSR_WORKSPACE}/logs/summary.txt"

RUN_ID                : ${JSR_RUN_ID}
project               : ${JSR_PROJECT}
duración              : ${DURATION}s
${EVIDENCE}
SUMMARY

jsr_log "el cleanup, la verificación de residuos y la comparación de recursos protegidos corren a continuación"
