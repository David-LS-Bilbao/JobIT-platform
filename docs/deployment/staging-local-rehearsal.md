# Runbook — Ensayo local del staging sintético

**Unidad:** `C — STAGING TECHNICAL READINESS` (bloque 2)
**Spec:** [`staging-technical-readiness.md`](../specs/features/staging-technical-readiness.md)
**Harness:** `scripts/operations/staging/run-local-rehearsal.sh`

> Este ensayo **no despliega nada** y **no autoriza nada**. Levanta una réplica desechable
> del stack, con imágenes equivalentes a producción, para acreditar el contrato completo en
> local. `STAGING_DEPLOY`, `PUBLIC_STAGING`, `REAL_CANDIDATE_DATA` y `PRODUCTION` siguen
> `NOT_AUTHORIZED`.

## 1. Qué acredita

Que el orden real de despliegue funciona y que las guardas de la Fase C se cumplen sobre
imágenes de producción, no solo en tests unitarios:

- la API y la Web **no arrancan antes** del gate de migraciones;
- `prisma migrate status` queda limpio tras `migrate deploy`;
- el seed sintético funciona contra una base clasificada `STAGING` bajo
  `JOBIT_DATA_MODE=SYNTHETIC_STAGING`, y marca las 14 ofertas;
- `/ready` es DB-aware y `/health` sigue siendo liveness;
- el marcador de entorno sintético viaja **horneado en el bundle** de la imagen web;
- el Golden staging journey pasa dos veces seguidas contra la misma base persistente **con
  los límites canónicos**, sin crecimiento neto de `User`;
- la persistencia sobrevive a un reinicio real del contenedor, y el borrado de cuenta deja
  el avatar en 404 y sin fichero en el volumen.

## 2. Qué NO acredita

- La topología real de Nginx Proxy Manager, TLS y el valor efectivo de `TRUST_PROXY_HOPS`.
- El restore de backups: eso ya está acreditado aparte
  ([`backup-restore-runbook.md`](backup-restore-runbook.md) §A) y **no se repite aquí**.
  Esto es verificación de *persistencia y reinicio*, no de *restauración*.

## 3. Requisitos

```text
Docker Engine + Docker Compose v2   (verificado con 29.3.1 / 5.1.1)
Node 20 + pnpm                      (Playwright corre desde el host)
Chromium de Playwright instalado    (pnpm --filter @jobit/web exec playwright install chromium)
curl, python3, bash 5.x
```

No hace falta ningún `.env`: el harness genera su propio entorno efímero.

## 4. Ejecución

```bash
./scripts/operations/staging/run-local-rehearsal.sh

# Solo diagnóstico: conserva los recursos del run (hay que limpiarlos a mano después).
JSR_KEEP=1 ./scripts/operations/staging/run-local-rehearsal.sh
```

## 5. Aislamiento

Todo lo que el ensayo crea lleva el `RUN_ID` en el nombre y en las etiquetas, y **ningún**
recurso es `external`: `docker compose -p <project> down -v` solo puede eliminar volúmenes
con nombre declarados en su propio fichero.

| Guarda | Regla |
|---|---|
| JSR-01 | `RUN_ID` obligatorio, patrón `^[0-9]{8}t[0-9]{6}z-[0-9a-f]{8}$` |
| JSR-02 | project name exactamente `jobit-staging-rehearsal-<RUN_ID>`; el literal `jobit-staging` está **prohibido** |
| JSR-03 | nunca monta, escribe ni borra `jobit-staging-db-data`, `jobit-staging-api-uploads` ni `jobit-postgres-test` |
| JSR-04 | snapshot de esos recursos antes y después; deben quedar idénticos |
| JSR-05 | la base **no publica puerto**; API y Web solo en `127.0.0.1` y con puerto resuelto libre. Prohibidos 3000, 4000, 5432 y 5434 |
| JSR-06 | credenciales sintéticas generadas para el run; nunca leídas de un `.env`, nunca impresas |
| JSR-07 | workspace y env efímeros bajo `/tmp/jobit-staging-rehearsal-<RUN_ID>`, con permisos 0600/0700 |
| JSR-08 | imágenes siempre construidas y etiquetadas `rehearsal-<RUN_ID>`; nunca `staging-local` ni `latest` |
| JSR-09 | `JOBIT_DATA_MODE=SYNTHETIC_STAGING` obligatorio |
| JSR-10 | cleanup solo con el `-p` validado; **jamás** `prune` ni `down -v` genérico |

La base del ensayo se llama `jobit_rehearsal_staging` **a propósito**: debe clasificar
`STAGING` para que el ensayo ejercite la guarda real y no una ruta más permisiva.

## 6. Ciclo de vida

```text
 1  preflight            guardas JSR-01..JSR-10 · snapshot de protegidos
 2  aislamiento          RUN_ID · project · red · volúmenes propios · env efímero 0600
 3  build                imágenes production-equivalent, tag rehearsal-<RUN_ID>
 4  SOLO la base         docker compose up -d --wait rehearsal-db
 5  espera               pg_isready + comprobación de que NADA más está en marcha
 6  migrate status       previo, informativo (en base nueva habrá pendientes)
 7  migrate deploy       GATE — si falla: parada dura, API y Web no arrancan
 8  migrate status       GATE — debe reportar "Database schema is up to date"
 9  seed                 one-shot builder · created/updated/total
10  API                  arranque
11  espera /ready == 200
12  Web                  arranque
13  espera HTTP 200      + verificación del marcador sintético en el bundle
14  Golden staging ×2    misma base persistente · sin crecimiento neto de User
15  persistencia         perfil + skill + avatar → restart de la API → siguen vivos
                         → borrado de cuenta → avatar 404 → fichero ausente del volumen
16  cleanup              down -v acotado al project validado
17  protegidos           snapshot posterior idéntico al inicial
18  residuos             contenedores/volúmenes/redes con el RUN_ID == 0
```

## 7. Tooling de Prisma

La imagen runtime de la API **no** trae la CLI de Prisma: `prisma` es devDependency y el
stage `runner` instala con `--prod`. Migrar y sembrar usan el stage `builder` del **mismo**
`apps/api/Dockerfile`, mismo commit y mismo lockfile, como contenedor efímero
(`docker compose run --rm`) dentro de la red del ensayo. Por eso la base nunca necesita
publicar puerto.

## 8. Límites de rate

El Golden staging consume **un** registro por ejecución, así que dos ejecuciones caben de
sobra en `AUTH_REGISTER_MAX=5/hora`. **Los límites canónicos no se relajan**: el recorrido
se diseñó para caber en ellos, no al revés. Si se quisiera ejecutar además la suite local
completa (16 tests, 6 registros) contra el ensayo, habría que elevar temporalmente las
variables ya existentes (`AUTH_REGISTER_MAX`, `AUTH_LOGIN_MAX`, `RATE_LIMIT_MAX`,
`PUBLIC_READ_MAX`) **solo** en el entorno efímero del ensayo, nunca en
`.env.staging.example`.

## 9. Evidencia

El harness imprime y guarda en `<workspace>/logs/summary.txt`:

```text
RUN_ID · imagen y digest de PostgreSQL · tags de API/Web/tooling
migrate pre-status · deploy · post-status · nº de migraciones
seed created/updated/total
health DB · /health · /ready · Web · marcador sintético
Golden staging run #1 y #2 · conteo de User antes y después
avatar antes del reinicio · reinicio · avatar después · avatar tras el borrado
limpieza física · residuos · comparación de recursos protegidos
```

Nunca imprime credenciales ni `DATABASE_URL`.

## 10. Fallos

| Código | Significado |
|---|---|
| 1 | guarda (aislamiento, puertos, nombres, preflight) |
| 2 | migración o seed |
| 3 | readiness |
| 4 | Golden staging o persistencia |
| 5 | cleanup o integridad de recursos protegidos |

Ante cualquier fallo la secuencia funcional se detiene; el cleanup acotado se ejecuta igual
y las verificaciones de residuos y de recursos protegidos se hacen siempre.

Si los recursos protegidos difieren:

```text
STOP
PROTECTED_RESOURCE_INTEGRITY_FAILURE
```

No se reconstruyen ni se ocultan: se escala.

## 11. Residuo conocido

`down -v` elimina contenedores, volúmenes y red, pero **no** las imágenes construidas, que
quedan en la caché local etiquetadas por `RUN_ID`. No son estado compartido y no colisionan
entre ejecuciones. Para recuperarlas:

```bash
docker images --format '{{.Repository}}:{{.Tag}}' | grep ':rehearsal-' | xargs -r docker rmi
```
