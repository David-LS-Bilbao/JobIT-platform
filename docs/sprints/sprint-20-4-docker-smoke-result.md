# Sprint 20.4 — Docker smoke result

## 1. Objetivo

Validar que el stack Docker local de staging (`docker-compose.staging.yml`) no solo
arranca, sino que soporta el flujo candidato real de extremo a extremo: salud de los tres
servicios, migraciones gated, seed, registro/login, dashboard privado, jobs, saved jobs,
match y persistencia real en el PostgreSQL dockerizado. Sin tocar VPS/DNS/Nginx ni secretos
reales.

## 2. Estado inicial

- `dev` @ `5c8362d` (PR #83 mergeada), working tree limpio; rama de trabajo
  `test/sprint-20-4-docker-smoke`.
- Puertos 3000/4000 ocupados por los dev servers locales del proyecto (identificados por
  proceso: `next dev` y `tsx watch src/server.ts` del propio repo); se pararon de forma
  controlada para el smoke y se relanzaron al final (verificado: web 200, api 200).
- Volúmenes `jobit-staging-db-data` y `jobit-staging-api-uploads` conservados de la fase
  20.2 (datos dummy).

## 3. Stack levantado

`docker compose config` OK → `build` OK (cache) → `up -d` OK. `ps`: los tres servicios
**healthy** (`jobit-staging-db`, `jobit-staging-api`, `jobit-staging-web`), con arranque
ordenado por `depends_on` + healthchecks. Ejecutado el 2026-07-09.

## 4. Migraciones y seed

- `prisma migrate deploy` (stage `builder`, comandos documentados en el compose):
  **"No pending migrations to apply"** — las 8 migraciones ya estaban aplicadas por el
  volumen conservado de 20.2; el comando es idempotente y no forzó nada.
- Seed (`tsx prisma/seed.ts`, stage builder): **"Seed completado: 14 ofertas Job
  insertadas"** — idempotente por diseño (borra y re-crea solo la tabla `Job`).
- Sin migraciones/seed en entrypoint; sin ingesta real Jooble/Greenhouse; sin API keys.

## 5. Healthchecks

| Servicio | Check | Estado |
|---|---|---|
| jobit-staging-db | `pg_isready` | healthy |
| jobit-staging-api | `node -e fetch('/health')` | healthy |
| jobit-staging-web | `node -e fetch('/')` | healthy |

## 6. Smoke HTTP

- `GET http://localhost:4000/health` → **HTTP/1.1 200 OK**
- `GET http://localhost:3000/` → **HTTP/1.1 200 OK**

## 7. Smoke funcional API

Usuario dummy único `smoke20_4_<timestamp>@example.com` (password dummy de test; ningún
token ni cookie impresos — solo códigos HTTP):

| Paso | Endpoint | Resultado |
|---|---|---|
| Registro | `POST /api/auth/register` | **201** |
| Login | `POST /api/auth/login` | **200**, token recibido: sí |
| Dashboard privado | `GET /api/dashboard/me` | **200** |
| Listado jobs | `GET /api/jobs?limit=5` | JSON OK, id de oferta obtenido |
| Detalle job | `GET /api/jobs/:id` | **200** |
| Guardar oferta | `POST /api/saved-jobs/:id` | **201** |
| Listar guardadas | `GET /api/saved-jobs` | **200** |
| Match de oferta | `GET /api/jobs/:id/match` | **200** |
| Mejores matches | `GET /api/profile/me/matches?limit=3` | **200** |
| Quitar guardada | `DELETE /api/saved-jobs/:id` | **204** |
| Logout | `POST /api/auth/logout` | **204** |
| Privado sin token | `GET /api/dashboard/me` | **401** (contrato de seguridad OK) |

12/12 pasos con el código esperado.

## 8. Smoke funcional Web

**Opción A conseguida sin modificar ningún archivo**: el E2E de Playwright del Sprint 18
se ejecutó tal cual contra el stack Docker (`reuseExistingServer: true` detectó la web
dockerizada en `:3000`, que a su vez fue construida con
`NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` → la API dockerizada, cuyo
`CORS_ORIGIN=http://localhost:3000` casa con el origen).

`pnpm --filter @jobit/web test:e2e` → **7 passed (7.3 s)**: landing/login/registro
públicos, portfolio inexistente 404, registro→dashboard, jobs→detalle→guardar→quitar→match,
CV mínimo→publicar portfolio→público→despublicar. Navegador real contra web standalone +
API + PostgreSQL dockerizados.

## 9. Persistencia PostgreSQL

Consulta vía red interna Docker (contenedor `postgres:16` efímero con `psql`; el puerto de
la DB nunca se publicó): usuario del smoke API presente (**1**), ofertas del seed (**14**),
usuarios totales (**5**: 1 de la fase 20.2 + 1 smoke API + 3 de los journeys E2E). Los
datos escritos por API y navegador persisten realmente en el volumen.

## 10. Limpieza local

`docker compose down` (contenedores y red eliminados) **sin `-v`**: los volúmenes
`jobit-staging-db-data` y `jobit-staging-api-uploads` quedan conservados (solo datos
dummy). Dev servers locales relanzados y verificados (web `:3000` → 200, api
`:4000/health` → 200). Script temporal de smoke eliminado.

## 11. Incidencias detectadas

Ninguna en el stack. Operativa menor ajena al stack: un intento inicial del script de
smoke falló por quoting del shell anidado (Windows→WSL) y se resolvió ejecutándolo como
archivo; sin impacto en los resultados.

## 12. Riesgos pendientes

- El smoke local no reproduce NPM/TLS/dominios reales: cookies `secure` y same-site con
  HTTPS quedan pendientes de la validación en VPS (riesgo residual ya registrado en el
  ADR-0012; primera tarea del deploy real).
- El compose sigue con dummies hardcodeados (pendiente 20.5: mecanismo `env_file` /
  interpolación `${VAR}` para el `.env` real del VPS).
- El flujo de migración usa la imagen `jobit-api:builder` construida en local; en el VPS
  habrá que construirla allí o publicarla (decisión para el manual 20.5).

## 13. Decisiones para 20.5

1. Mecanismo de consumo del `.env` real por el compose en el VPS (interpolación `${VAR}`
   recomendada, con `env_file` como alternativa) — implicará editar el compose con
   autorización expresa o documentar overrides.
2. Estrategia de la imagen builder para migraciones en el VPS (build local en VPS vs
   registry).
3. Procedimiento NPM: hosts, certificados, y cómo conectar NPM a la red `jobit-staging`
   (o publicar puertos solo en localhost del VPS).
4. Backups: cron de `pg_dump` + copia del volumen de uploads en `/srv/jobit-staging/backups`.

## 14. Estado final

Stack Docker de staging validado funcionalmente de extremo a extremo en local: 3/3
healthy, migraciones gated idempotentes, seed OK, 12/12 pasos de API en verde, 7/7 tests
E2E de navegador en verde y persistencia verificada en PostgreSQL dockerizado. Sin cambios
en ningún archivo salvo este informe.

**Estado: `SPRINT_20_4_DOCKER_SMOKE_PASS`**
