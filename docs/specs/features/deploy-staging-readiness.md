# Spec — Deploy dev/staging readiness (Sprint 20)

## Objetivo

Dejar a JobIT listo para desplegar un entorno **staging** en el VPS de forma segura y
reversible, **sin desplegar todavía**: definir la arquitectura de contenedores, los
dominios, las variables y secretos por entorno, la estrategia de base de datos, migraciones,
seed, uploads, healthchecks, logs, backups y rollback, y dejarlo todo verificado en local
(smoke Docker) y documentado en un manual de deploy. El deploy real queda como decisión
posterior explícita (fase 20.6 / sprint futuro).

## Usuario/equipo afectado

- **Operador/desarrollador**: obtiene artefactos y un protocolo reproducible para levantar
  staging sin improvisar sobre el VPS.
- **Candidato (indirecto)**: staging permite validar el flujo real (HTTPS, cookies,
  dominios) antes de exponer nada a usuarios.
- **Agentes IA**: la spec y el ADR-0012 fijan los límites duros de las fases 20.1–20.6.

## Contexto actual

- No existen `Dockerfile*`, `docker-compose*`, `.dockerignore` ni `docker/` (auditado en
  Plan Mode del Sprint 20).
- La API está preparada para contenedores: `tsc → node dist/server.js`, graceful shutdown
  (SIGINT/SIGTERM), `GET /health`, CORS por `CORS_ORIGIN` con `credentials: true`, cookie
  `refresh_token` con `httpOnly`, `sameSite: "lax"` y `secure` condicionado a
  `NODE_ENV=production`.
- La web funciona con `next build && next start` (validado en CI y en el workflow E2E).
  `NEXT_PUBLIC_API_BASE_URL` se **inlinea en build time** → debe estar disponible al
  construir la imagen, no solo al arrancar.
- Los avatares se guardan en disco local (`apps/api/uploads/avatars/`, servidos como
  estáticos) → único estado en disco de la API; exige volumen persistente y backup.
- CI (`JobIT CI`) y E2E manual (`JobIT E2E (manual)`) en verde; branch protection activa en
  `dev` (Sprint 19).
- El VPS existente usa Nginx Proxy Manager (NPM) como reverse proxy para otros proyectos.

## Alcance Sprint 20 (opción B aprobada)

1. **20.0**: esta spec + `ADR-0012` (arquitectura staging).
2. **20.1**: `Dockerfile` de API y web + `.dockerignore` (incluye `output: "standalone"` en
   `next.config.ts`, autorizado para esa fase).
3. **20.2**: `docker-compose.staging.yml` verificable en local.
4. **20.3**: plantillas de entorno seguras (placeholders, sin secretos).
5. **20.4**: smoke local del stack dockerizado.
6. **20.5**: manual de deploy para el VPS (NPM, subdominios, backups, rollback).
7. **20.6**: decisión de deploy real — **fuera de este sprint**, autorización expresa.

Sin tocar VPS, DNS, Nginx Proxy Manager ni secrets reales en ninguna fase del sprint.

## Fuera de alcance

- Deploy real a VPS y producción real.
- CD automático desde GitHub Actions (exigiría secrets reales en GitHub).
- Alta o cambio de DNS/dominios (los subdominios se documentan, no se crean).
- Monitorización avanzada (Prometheus/Grafana), CDN, escalado horizontal.
- `POST /api/auth/refresh` o cambios de la estrategia de sesión (ADR-0006 intacto).
- Ingesta real Jooble/Greenhouse en staging (ver Estrategia de seed).
- Cambios funcionales en `apps/*/src/**`.

## Arquitectura staging recomendada

Stack de tres contenedores en red interna Docker del VPS, con NPM (ya existente) como único
punto expuesto:

```text
Internet ──HTTPS──> Nginx Proxy Manager (VPS, 80/443, Let's Encrypt)
                      ├── jobit-staging.davlos.es      ──> jobit-staging-web:3000
                      └── api-jobit-staging.davlos.es  ──> jobit-staging-api:4000
                                                            │
                                             red interna docker `jobit-staging`
                                                            │
                                                    jobit-staging-db:5432
                                                    (SIN puerto publicado al host)
```

## Componentes

- **Web (`jobit-staging-web`)**: imagen multi-stage de Next (`next build` con build-arg
  `NEXT_PUBLIC_API_BASE_URL`, runtime `next start`, `output: "standalone"` desde 20.1).
  Stateless (sesión en memoria del navegador, ADR-0006).
- **API (`jobit-staging-api`)**: imagen multi-stage node:20-slim (install → `prisma
  generate` → `tsc` → runtime con `dist/` + engines de Prisma). Volumen persistente montado
  en `uploads/`.
- **PostgreSQL (`jobit-staging-db`)**: `postgres:16` con volumen persistente propio,
  credenciales exclusivas de staging y **sin `ports:` hacia el host**.
- **Red interna**: red Docker `jobit-staging` dedicada; solo NPM alcanza web y API; solo la
  API alcanza la DB.
- **Reverse proxy**: el NPM existente del VPS; termina TLS y enruta por host. No se crea
  proxy nuevo.
- **Volúmenes**: `jobit-staging-db-data` (PostgreSQL) y `jobit-staging-uploads` (avatares).
- **Backups**: `pg_dump` programado + copia del volumen de uploads, con destino propuesto
  `/srv/jobit-staging/backups` en el VPS (solo documentado; no se crea en este sprint).

## Dominios propuestos

- Web: **`jobit-staging.davlos.es`**
- API: **`api-jobit-staging.davlos.es`**

Solo trabajo documental: el DNS no se toca en Sprint 20.

## Regla same-site para cookies

Ambos subdominios comparten el mismo eTLD+1 (`davlos.es`) → son **same-site** para el
navegador. La cookie `refresh_token` actual (`sameSite: "lax"`, `httpOnly`, `secure` en
producción) **funciona sin tocar código**. Regla dura: cualquier cambio futuro de dominios
que rompa el same-site (dominios raíz distintos) exigiría `SameSite=None; Secure` y una
revisión de CSRF — se considera cambio de arquitectura y requiere ADR nuevo.

## CORS exacto por entorno

`CORS_ORIGIN` debe ser exactamente el origen público de la web de cada entorno
(en staging: `https://jobit-staging.davlos.es`). Un mismatch de esquema, host o puerto
rompe el login (comportamiento ya documentado en el README para dev local). Un solo origin
por entorno; no se introducen wildcards.

## HTTPS

Terminación TLS en Nginx Proxy Manager con certificados Let's Encrypt por subdominio. Los
contenedores hablan HTTP plano solo dentro de la red interna. Con `NODE_ENV=production` la
cookie lleva `secure: true`; el navegador la acepta porque su conexión con NPM es HTTPS.
Nota técnica registrada: la API hoy no inspecciona el protocolo de la petición; si alguna
feature futura lo necesita (rate limiting por IP, redirects), habrá que añadir
`app.set("trust proxy", …)` — cambio de código fuera de este sprint.

## Variables de entorno necesarias (sin valores reales)

| Componente | Variable | Notas |
|---|---|---|
| API | `NODE_ENV` | `production` en staging |
| API | `PORT` | `4000` |
| API | `CORS_ORIGIN` | `https://jobit-staging.davlos.es` (exacto) |
| API | `DATABASE_URL` | Postgres staging por red interna; contiene credenciales → secreto |
| API | `JWT_ACCESS_SECRET` | Secreto nuevo, exclusivo de staging |
| API (opcional) | `JOOBLE_API_KEY`, `JOOBLE_API_BASE_URL`, `GREENHOUSE_API_BASE_URL`, `ING_*` | Solo si se activa ingesta (fuera de alcance inicial) |
| Web (build-arg) | `NEXT_PUBLIC_API_BASE_URL` | `https://api-jobit-staging.davlos.es`; se inlinea en build |
| Web (runtime) | `PORT` | `3000` (default de `next start`) |

No aplican a staging: `DATABASE_URL_TEST` (solo tests) y `JWT_REFRESH_SECRET` (el runtime
no lo usa; verificado en Plan Mode del Sprint 19B).

## Secrets necesarios (sin valores reales)

1. `JWT_ACCESS_SECRET` de staging — generado nuevo (`openssl rand -hex 48`), jamás
   compartido con local ni versionado.
2. Credenciales de PostgreSQL staging (usuario/contraseña dentro de `DATABASE_URL`).
3. Opcional futuro: `JOOBLE_API_KEY` si se activa ingesta real.

Gestión: archivos `.env` en el VPS **fuera del repo** (p. ej. bajo `/srv/jobit-staging/`),
con plantillas versionadas con placeholders (fase 20.3). Prohibido: secrets en el repo, en
imágenes Docker, en logs o en GitHub (mientras no haya CD autorizado).

## Estrategia de PostgreSQL staging

Contenedor `postgres:16` dedicado (paridad con CI y con el contenedor local), volumen
persistente, credenciales propias, accesible **solo** desde la red interna (`ports:` ausente
por diseño — la exposición accidental de la DB es el riesgo nº 1 y se elimina
estructuralmente). Base de datos separada de cualquier otra del VPS.

## Estrategia de migraciones Prisma

- Migrar con **`prisma migrate deploy`** (nunca `migrate dev` fuera de local).
- **Paso explícito y manual del protocolo de deploy** (p. ej.
  `docker compose run --rm api npx prisma migrate deploy`): **no** se migra
  automáticamente en cada arranque del contenedor. Determinista, auditable y con momento
  claro para el backup.
- **Backup previo obligatorio** (`pg_dump`) antes de cada `migrate deploy` en staging.

## Estrategia de seed

- Staging inicial se puebla con el **seed ficticio versionado**
  (`apps/api/prisma/seed.ts`: 14 ofertas, idempotente, solo tabla `Job`), ejecutado como
  paso manual del protocolo.
- La **ingesta real (Jooble/Greenhouse) queda fuera de alcance**: exigiría el secret
  `JOOBLE_API_KEY` y una decisión propia de frescura/volumen de datos en staging.

## Estrategia de avatares/uploads

- Volumen persistente `jobit-staging-uploads` montado sobre el directorio `uploads/` de la
  API (único estado en disco del backend).
- Incluido en la estrategia de backups junto a la base de datos.
- Si el producto crece, la alternativa (almacenamiento de objetos externo) requerirá
  spec/ADR propio; para staging el volumen es suficiente.

## Healthchecks

| Componente | Check | Uso |
|---|---|---|
| API | `GET /health` (ya existe) | `healthcheck` del contenedor + gate de arranque |
| Web | `GET /` (200) | `healthcheck` del contenedor |
| Postgres | `pg_isready` | `healthcheck` + `depends_on: condition: service_healthy` de la API |

## Logs

- stdout/stderr de contenedor (sin archivos propios), con **rotación** configurada en
  compose (`max-size` / `max-file`).
- Regla dura: **no imprimir tokens, cookies, contraseñas ni `DATABASE_URL`** en logs. La
  auditoría de los puntos de logging actuales de la API forma parte de la revisión de la
  fase 20.4 (smoke) antes de cualquier deploy real.

## Estrategia de rollback

- **Imágenes taggeadas por SHA de commit** (además de un tag móvil de staging): volver a la
  versión anterior = volver al tag anterior, sin rebuilds.
- **Backup pre-migración obligatorio**: si una migración rompe, se restaura el dump y se
  vuelve al tag de imagen anterior.
- El protocolo de deploy (fase 20.5) documenta el rollback paso a paso; ninguna migración
  destructiva sin plan de vuelta escrito.

## Criterios de aceptación por fase

- **20.0**: esta spec y el ADR-0012 versionados y aprobados por el Director.
- **20.1**: `docker build` de API y web en verde en local; imágenes arrancan con variables
  dummy; `output: "standalone"` aplicado a la web; sin cambios funcionales.
- **20.2**: `docker compose -f docker-compose.staging.yml config` válido; stack completo
  levanta en local con healthchecks en `healthy`; Postgres sin puerto publicado.
- **20.3**: plantillas env con placeholders versionadas; `git grep` confirma cero valores
  reales; documentado dónde viven los `.env` reales en el VPS.
- **20.4**: smoke local contra el stack dockerizado: `register → login → dashboard`
  (+ E2E de Playwright opcional apuntando al stack Docker); cookies y CORS verificados.
- **20.5**: manual de deploy versionado (NPM, subdominios, `.env`, migraciones, seed,
  backups, rollback) revisable por el Director.
- **20.6**: decisión explícita y separada de deploy real; nada se despliega sin ella.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Cookie no viaja en staging | Subdominios same-site (`davlos.es`) + `secure` solo detrás de HTTPS; validar en smoke |
| CORS mismatch (login roto) | `CORS_ORIGIN` exacto por entorno; checklist del manual |
| DB expuesta a Internet | Sin `ports:` en Postgres; solo red interna (estructural) |
| Secret débil/reutilizado | Secrets nuevos por entorno, `openssl rand -hex 48`, nunca en repo/imagen/log |
| Migración destructiva | `migrate deploy` gated + backup previo obligatorio + rollback documentado |
| Pérdida de avatares | Volumen persistente + backups |
| `NEXT_PUBLIC_API_BASE_URL` incorrecta horneada en la imagen | Build-arg documentado; verificación en smoke antes de publicar imagen |
| VPS compartido (colisiones) | Prefijo `jobit-staging-*`, red propia, cero puertos host salvo NPM, límites de recursos en compose |
| Logs con datos sensibles | Regla de logging + auditoría en 20.4 |
| Deriva hacia deploy real prematuro | Fase 20.6 como gate explícito; kill-switch del sprint |

## Pruebas/verificaciones mínimas

- 20.1–20.2: builds y `compose config`/`up` locales en verde; healthchecks `healthy`.
- 20.4: smoke HTTP del flujo candidato contra el stack Docker local y, opcionalmente,
  `pnpm --filter @jobit/web test:e2e` apuntando a ese stack.
- Cada fase: `git diff --check`, scope audit de archivos, y CI de la PR en verde (los
  quality gates del Sprint 19 aplican a todas las PRs de este sprint).

## Decisiones pendientes

1. Confirmación de los subdominios exactos bajo `davlos.es` (propuestos arriba).
2. Retención y cifrado de backups (propuesta inicial: 7 diarios + 4 semanales, en
   `/srv/jobit-staging/backups`; revisable en 20.5).
3. Si el smoke 20.4 incluye la suite E2E completa o solo el smoke HTTP mínimo.
4. Momento del deploy real (20.6): sprint aparte con autorización expresa del Director.
