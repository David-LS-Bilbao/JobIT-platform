# Sprint 08 — Environment Readiness Plan

> Documento de planificación (solo documental). Prepara la estrategia para dejar
> listo el entorno local real antes del smoke. **No** provisiona, **no** crea
> `.env`, **no** instala, **no** ejecuta Prisma ni smoke. Continúa el
> [agent-brief del Sprint 08](sprint-08-env-smoke-deploy-agent-brief.md).

## 1. Objetivo del plan

Definir, de forma segura y reproducible, cómo se preparará el entorno local
(`backend + PostgreSQL + frontend`) para poder ejecutar más adelante el smoke
real `register → login → dashboard → logout`, sin exponer secretos y sin tocar
código. La ejecución (instalar, provisionar DB, migrar, arrancar y smoke) se hará
en fases posteriores con sus propios prompts.

## 2. Estado de partida

- Ruta WSL correcta: `/home/david/projects/JobIT-platform` (verificada con `pwd -P` y `git rev-parse --show-toplevel`).
- Rama: `feat/sprint-08-env-smoke-deploy` (desde `dev` `2ad435c`).
- Working tree: solo `?? docs/sprints/sprint-08-env-smoke-deploy-agent-brief.md` (más este plan al crearse).
- `apps/api/.env.example`: **ausente**.
- `apps/api/.env`: **ausente**.
- `apps/web/.env.example`: **presente** (`NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`).
- `apps/web/.env.local`: **ausente**.
- `docker-compose.yml` / `docker/`: **ausentes**.
- `apps/web/node_modules`: **ausente** (root y `apps/api` presentes).
- PostgreSQL de **test**: contenedor `jobit-postgres-test` (`postgres:16-alpine`) en `0.0.0.0:5434->5432`.
- Puertos relevantes libres en la inspección inicial (`:3000`, `:3001`, `:4000`, `:5000`, `:8080`); `:3000` apareció ocupado por Docker durante el Sprint 07 (revisar).

## 3. Reglas obligatorias de entorno

- Trabajar **solo** desde `/home/david/projects/JobIT-platform`.
- **No** usar OneDrive/Windows (`/mnt/c/.../OneDrive`, `C:\Users\David\OneDrive`).
- Verificar **siempre** `pwd -P`; abortar si no es exactamente la ruta nativa.
- Desde Windows: `wsl --cd /home/david/projects/JobIT-platform -- bash -lc '<cmd>'`.
- **No** ejecutar `pnpm`, Prisma, build ni tests fuera de WSL nativo.
- **No** imprimir secretos (valores de `.env`, tokens, cookies, `DATABASE_URL` real, `JWT_ACCESS_SECRET`, `JOOBLE_API_KEY`).
- Evitar paso de comandos con `$()`/backticks anidados PowerShell→`wsl`; preferir comandos directos o script en `/tmp`.

## 4. Variables de entorno requeridas

> Identificadas por **nombre y finalidad** leyendo el código (`apps/api/src/config/env.ts`,
> `apps/api/src/auth/jwt.util.ts`, `apps/api/prisma/schema.prisma`,
> `apps/web/.env.example`). **No se imprimen valores reales.**

| Variable | App | Obligatoria | Finalidad | Secreta | Fuente sugerida |
|---|---|---|---|---|---|
| `DATABASE_URL` | Backend | Sí | Conexión Prisma a PostgreSQL (dev/smoke) | **SÍ** | `.env` local (no versionado) |
| `JWT_ACCESS_SECRET` | Backend | Sí | Firma/verificación del access token JWT (`jwt.util.ts` lanza si falta) | **SÍ** | `.env` local |
| `PORT` | Backend | No (default 4000) | Puerto del servidor Express | No | `.env` local / default |
| `CORS_ORIGIN` | Backend | No (default `http://localhost:3000`) | Origen permitido para CORS con credenciales | No | `.env` local / default |
| `NODE_ENV` | Backend | No (default `development`) | Modo de ejecución; en prod oculta detalles de error | No | `.env` local / entorno |
| `JOOBLE_API_KEY` | Backend | No (opcional) | Cliente real de Jooble; **no requerida para el smoke** | **SÍ** | `.env` local (omitible en smoke) |
| `DATABASE_URL_TEST` | Backend (tests) | No (solo tests) | DB de test en `globalSetup`; no se usa en el smoke | **SÍ** | `apps/api/.env.test` (ya local) |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend | Sí | URL base de la API que consume el cliente web | No (público) | `apps/web/.env.local` |

### 4.1 Backend API
- Requeridas para el smoke: **`DATABASE_URL`** y **`JWT_ACCESS_SECRET`**.
- Opcionales con default seguro: `PORT` (4000), `CORS_ORIGIN` (`http://localhost:3000`), `NODE_ENV` (`development`).
- `JOOBLE_API_KEY`: **no** necesaria para el smoke (solo lectura/ingesta Jooble real).
- Nota: los **refresh tokens** son aleatorios y se guardan **hasheados** en la tabla `RefreshToken` (`tokenHash`); **no** existe un secreto JWT de refresh (no hay `JWT_REFRESH_SECRET`). La cookie `refresh_token` es httpOnly con TTL de 7 días.
- Nota de carga: el script dev (`tsx watch src/server.ts`, cwd `apps/api`) carga `.env` vía `dotenv.config()` desde el cwd → el `.env` debe estar en `apps/api/.env` (un `./.env` raíz no lo lee ese cwd).

### 4.2 Frontend Web
- Requerida: **`NEXT_PUBLIC_API_BASE_URL`** = `http://localhost:4000` (de `apps/web/.env.example`).
- Es **pública** (prefijo `NEXT_PUBLIC_`); **nunca** poner secretos en variables `NEXT_PUBLIC_*`.

### 4.3 Variables prohibidas en logs/chat
- `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JOOBLE_API_KEY`, `DATABASE_URL_TEST` y cualquier cookie/token: **no imprimir nunca** su valor (ni en logs, ni en chat, ni en commits).

## 5. Plantillas futuras propuestas

> **No** se crean en esta fase. Solo se proponen estructuras con placeholders seguros.

### `apps/api/.env.example` (propuesta, sin secretos reales)
```dotenv
# Backend JobIT API — plantilla (sin secretos reales)
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000
# Conexión a PostgreSQL dev/smoke (rellenar en .env local, NO versionar)
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5434/jobit_dev?schema=public
# Secreto de firma del access token (generar uno fuerte en local)
JWT_ACCESS_SECRET=__CHANGE_ME__
# Opcional: solo si se activa el cliente real de Jooble (no necesario para smoke)
# JOOBLE_API_KEY=__CHANGE_ME__
```

### `apps/web/.env.local` (propuesta, valores locales no secretos)
```dotenv
# Frontend JobIT — configuración local (sin secretos)
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## 6. Estrategia PostgreSQL dev/smoke

| Opción | Descripción | Riesgos | Reproducible |
|---|---|---|---|
| A. Usar DB de test (5434, `jobit_test`) | Reusar la base del contenedor de test | **Contamina datos de test**; mezcla smoke con suite | Media |
| B. DB separada en el contenedor existente | `CREATE DATABASE jobit_dev` en `jobit-postgres-test` (5434) | Reusa infra ya levantada; aísla datos; requiere crear la DB (acción sobre el contenedor) | **Alta** |
| C. Contenedor nuevo dedicado | Nuevo `postgres` en otro puerto (p. ej. 5433) | Más aislamiento; introduce infra/puerto nuevos | Alta |
| D. `docker-compose` en fase posterior | Orquestar postgres+api+web | Cambio de infraestructura; requiere autorización | Alta |

**Recomendación:** **Opción B** — crear una base separada `jobit_dev` (o `jobit_smoke`) en el contenedor `jobit-postgres-test` ya en marcha (5434), y apuntar `DATABASE_URL` a ella. Aísla los datos del smoke de la suite de test, no introduce infraestructura nueva y es reproducible. La **creación de la base** es una acción sobre el contenedor y debe ejecutarse en la fase de *Local backend readiness* (no ahora), sin borrar nada existente. Si se prefiere aislamiento total, Opción C; `docker-compose` (D) queda como propuesta futura que **requiere autorización** por afectar infraestructura.

## 7. Estrategia Prisma

- `prisma generate` — **necesario** (no hay `postinstall`); regenera el cliente en `node_modules`. No destructivo.
- `prisma migrate deploy` — aplica las migraciones ya versionadas a la DB dev/smoke. **Preferido** frente a `migrate dev` (que puede crear/resetear). No destructivo sobre datos existentes.
- `seed` — `apps/api/prisma/seed.ts` existe; opcional, para poblar ofertas/datos y que el dashboard sea significativo. Inserción, no destructivo.
- **Prohibido:** `migrate reset`, `db push --force-reset`, borrar volúmenes o bases sin backup/autorización.
- **Rollback no destructivo:** ante problemas, no resetear; diagnosticar, y si hace falta partir de cero usar una DB nueva (`jobit_dev2`) en vez de borrar datos.
- Comandos previstos (fase posterior, desde ruta nativa):
  ```bash
  pnpm --filter @jobit/api exec prisma generate
  pnpm --filter @jobit/api exec prisma migrate deploy
  # opcional: seed según cómo esté cableado en package/prisma
  ```

## 8. Estrategia backend local

- **Puerto:** `4000` (default de `env.ts`; el frontend espera `:4000`).
- **Comandos previstos:** `pnpm --filter @jobit/api dev` (`tsx watch src/server.ts`).
- **Health check:** la app monta `healthRouter` en `app.ts` (verificar ruta exacta del health en readiness; no asumir).
- **Endpoints mínimos para el smoke:**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
  - `GET /api/dashboard/me`
- **Validación de logs sin exponer secretos:** comprobar arranque, puerto y respuestas de estado; **no** loguear `Authorization`, cookies, `DATABASE_URL` ni tokens.
- **Verificaciones:** `pnpm --filter @jobit/api typecheck`, `build`, `test` (la suite de test usa su propia `DATABASE_URL_TEST`; no confundir con la DB dev/smoke).

## 9. Estrategia frontend local

- **Puerto:** `3000` (default Next; liberar si Docker lo ocupa).
- **`NEXT_PUBLIC_API_BASE_URL`:** `http://localhost:4000` (en `apps/web/.env.local`, fase posterior).
- **`pnpm install` necesario:** `apps/web/node_modules` está **ausente**; instalar desde la ruta nativa (workspace) antes de build/dev.
- **Comandos previstos:** `pnpm --filter @jobit/web dev` (smoke), `build`, `typecheck`, `test`, `lint`.
- **Verificaciones:** `typecheck` ✅, `test` (35/35 con mocks, ya verde en Sprint 07), `build`, `lint`.

## 10. CORS, cookies y sesión

- **Origen frontend:** `http://localhost:3000`.
- **Origen backend:** `http://localhost:4000`.
- **Cross-origin en dev:** el backend usa `cors({ origin: CORS_ORIGIN, credentials: true })` (default `http://localhost:3000`); el frontend usa `credentials:"include"` y `Bearer` para el access token.
- **Cookie `refresh_token`:** httpOnly; en cross-origin sobre `http://localhost` revisar atributos (`SameSite`/`Secure`) durante el smoke — posible punto de fricción para que la cookie se envíe.
- **Sesión:** access token solo en memoria del frontend; **no** existe `/api/auth/refresh` → recarga/expiración = re-login.
- **No imprimir** cookies ni tokens en ningún log.
- **Qué validar en el smoke:** que login/register devuelven `accessToken` + setean la cookie, que `GET /api/dashboard/me` responde con Bearer, que logout responde `204` y limpia sesión, y que un `401` redirige a login.

## 11. Decisión recomendada para el smoke local

- **DB:** Opción B — `jobit_dev` (o `jobit_smoke`) en el contenedor existente (5434); `DATABASE_URL` apuntando a esa base. No tocar `jobit_test`.
- **Puertos:** backend `:4000`, frontend `:3000` (liberar `:3000` si está ocupado).
- **Archivos a crear en la siguiente fase (sin imprimir contenido):**
  - `apps/api/.env.example` (plantilla, versionable; sin secretos).
  - `apps/api/.env` (local, **no** versionado).
  - `apps/web/.env.local` (local, **no** versionado).
- **Comandos a ejecutar en fases siguientes (ruta nativa):** `pnpm install`; `prisma generate`; crear `jobit_dev`; `prisma migrate deploy`; seed opcional; `pnpm --filter @jobit/api dev`; `pnpm --filter @jobit/web dev`; smoke.
- **Pendiente de autorización explícita:** creación de la base `jobit_dev` en el contenedor; cualquier `docker-compose`/infra; cualquier deploy. Nada de esto se ejecuta sin OK.

## 12. Plan de ejecución por fases siguientes

1. **Crear/actualizar plantillas de entorno seguras** — `apps/api/.env.example` (versionable, sin secretos).
2. **Crear `.env` locales sin imprimir contenido** — `apps/api/.env`, `apps/web/.env.local` (no versionados).
3. **Preparar PostgreSQL dev/smoke** — crear `jobit_dev` en 5434 (con autorización), sin tocar `jobit_test`.
4. **Ejecutar Prisma** — `generate` + `migrate deploy` + seed opcional (no destructivo).
5. **Validar backend** — arranque `:4000`, health, typecheck/build/test.
6. **Validar frontend** — `pnpm install`, `:3000`, typecheck/test/build/lint.
7. **Ejecutar smoke real local** — `register → login → dashboard → logout` con evidencia (sin secretos).
8. **Documentar resultado** — PASS con evidencia o BLOCKED con causa exacta.

## 13. Riesgos y mitigaciones

| Riesgo | Severidad | Mitigación | Kill-switch asociado |
|---|---|---|---|
| cwd WSL cae en OneDrive | Alta | `wsl --cd` + verificar `pwd -P` antes de cada acción | Ruta ≠ nativa → BLOCKED |
| Contaminar DB de test (5434) | Alta | DB separada `jobit_dev`; no usar `jobit_test` | Borrado de DB/volúmenes sin autorización → BLOCKED |
| Exposición de secretos | Alta | No imprimir `.env`/tokens; `.env*` ignorados; plantillas con placeholders | Impresión de secretos → BLOCKED |
| Faltan `.env` backend/frontend | Alta | Crear en fase 1–2 sin versionar; documentar variables | — |
| `apps/web/node_modules` ausente | Media | `pnpm install` desde ruta nativa | Install en OneDrive → BLOCKED |
| `:3000` ocupado por Docker | Media | Liberar puerto o ajustar `CORS_ORIGIN`/puerto | — |
| Cookie cross-origin no enviada | Media | Revisar `SameSite`/`Secure` y `credentials:include` en smoke | — |
| Migración destructiva | Alta | Solo `migrate deploy`; prohibido `reset` | `migrate reset`/drop sin autorización → BLOCKED |
| Cambios de código/Prisma no autorizados | Alta | Plan documental; no tocar `apps/**` ni `prisma/**` | Cambios no autorizados → BLOCKED |
| Deploy sin autorización | Alta | Deploy solo con OK explícito | Deploy sin autorización → BLOCKED |

## 14. Criterios de aceptación para pasar a *Local backend readiness*

- Plan creado (`docs/sprints/sprint-08-env-smoke-deploy-plan.md`).
- Variables identificadas por nombre/finalidad, **sin secretos**.
- Estrategia de DB elegida (Opción B: `jobit_dev` en 5434).
- Estrategia Prisma definida (generate + migrate deploy + seed opcional, no destructivo).
- Estrategia backend/frontend definida (puertos, comandos, verificaciones).
- **No** se tocó código.
- **No** se crearon `.env` reales ni plantillas todavía.
- **No** se ejecutó smoke.
- **No** se hizo deploy.
- `git diff --check` limpio; working tree solo con documentos del Sprint 08.

## 15. Siguiente prompt recomendado

**Fase: Local backend readiness preparation** (preparar SOLO lo necesario para el backend local, con autorización controlada para acciones sobre la DB):

> "Sprint 08 — Local backend readiness. En el clon nativo de WSL (`wsl --cd /home/david/projects/JobIT-platform`, verificar `pwd -P`), rama `feat/sprint-08-env-smoke-deploy`: (1) crear `apps/api/.env.example` versionable con placeholders (sin secretos); (2) crear `apps/api/.env` local **sin imprimir su contenido** con `DATABASE_URL` apuntando a `jobit_dev` (5434) y `JWT_ACCESS_SECRET` local; (3) con autorización, crear la base `jobit_dev` en el contenedor `jobit-postgres-test` sin tocar `jobit_test`; (4) `pnpm install` (si procede) + `prisma generate` + `prisma migrate deploy` (no destructivo) + seed opcional; (5) arrancar la API en `:4000` y validar health + typecheck/build, sin loguear secretos. No tocar frontend aún, no smoke aún, no deploy, no commit/push. Verificar `git diff --check` y `git status --short` al cierre."
