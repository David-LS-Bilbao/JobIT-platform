# Informe final operador — Sprint 08 Entorno, smoke real y deploy dev/staging

> Documento versionable. Consolida el Sprint 08. No contiene secretos, tokens,
> cookies ni valores de `.env`. No documenta deploy como ejecutado ni inventa
> validación visual.

## Sprint o tarea

- **Sprint 08 — Entorno, smoke real y deploy dev/staging.**
- **Rama:** `feat/sprint-08-env-smoke-deploy`.
- **Estado final recomendado:** **PASS_WITH_NOTES**.

## Objetivo inicial

- Cerrar la **deuda del Sprint 07**: el smoke real quedó **BLOCKED por entorno/provisión**.
- Validar de extremo a extremo **backend + PostgreSQL + frontend**.
- Validar el flujo del candidato: `register → login → dashboard → logout`.
- Preparar un **plan de deploy dev/staging** sin desplegar salvo autorización explícita.

## Trabajo realizado

Por fases (SDD/TDD + verificación + auditoría):

1. **Startup + Alignment Report** — PASS. Migración al clon nativo de WSL; verificación de ruta/rama/DB/puertos.
2. **Fase 0 — Brief documental** — PASS (`sprint-08-env-smoke-deploy-agent-brief.md`).
3. **Environment Readiness Plan** — PASS_WITH_NOTES (`sprint-08-env-smoke-deploy-plan.md`).
4. **Local backend readiness** — PASS_WITH_NOTES (`.env.example`, `.env` local, `jobit_dev`, Prisma, API `:4000`).
5. **Local frontend readiness** — PASS_WITH_NOTES (`.env.local`, `pnpm install`, checks, Next `:3000`).
6. **Smoke real local** — PASS_WITH_NOTES (`sprint-08-local-smoke-result.md`).
7. **Deploy dev/staging planning** — PASS (`sprint-08-deploy-plan.md`).
8. **Auditoría quality/security local** — PASS_WITH_NOTES (sin secretos, dentro de alcance).

## Entorno utilizado

- Ruta nativa obligatoria: `/home/david/projects/JobIT-platform` (WSL2 Ubuntu).
- **Prohibido** OneDrive (`/mnt/c/.../OneDrive`, `C:\Users\David\OneDrive`).
- `dev` alineado con `origin/dev` antes de crear la rama; rama de trabajo `feat/sprint-08-env-smoke-deploy`.
- Docker/PostgreSQL: contenedor `jobit-postgres-test` (`postgres:16-alpine`) en host `5434`.
- Backend en `:4000`; frontend en `:3000`.
- Sin secretos en este documento.

## Archivos modificados

Versionables (entregables del sprint):
- `apps/api/.env.example`
- `docs/sprints/sprint-08-env-smoke-deploy-agent-brief.md`
- `docs/sprints/sprint-08-env-smoke-deploy-plan.md`
- `docs/sprints/sprint-08-local-smoke-result.md`
- `docs/sprints/sprint-08-deploy-plan.md`
- `docs/sprints/sprint-08-env-smoke-deploy-final-report.md` (este documento)

Locales ignorados (NO versionados, nunca mostrados):
- `apps/api/.env`
- `apps/web/.env.local`

Los `.env` locales **no se versionan** (ignorados por `.gitignore`). No se tocó código, Prisma, `package.json`, lockfiles ni infraestructura.

## Configuración local

- `apps/api/.env.example` creado con **placeholders seguros** (sin secretos).
- `apps/api/.env` creado **localmente**, ignorado por Git, **no impreso** (`DATABASE_URL`→`jobit_dev`, `JWT_ACCESS_SECRET` generado, `PORT=4000`, `CORS_ORIGIN=http://localhost:3000`, `JOOBLE_API_KEY` vacío).
- `apps/web/.env.local` creado **localmente**, ignorado por Git (`NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`).
- **`jobit_dev`** creado en el contenedor existente, **separado de `jobit_test`** (intacta).
- `prisma migrate deploy` aplicado a `jobit_dev` (5 migraciones).
- Seed ejecutado con **fallback `tsx prisma/seed.ts`** (14 ofertas `Job`).
- **No** se introdujo `docker-compose`.

## Smoke real

- **Resultado global:** **PASS_WITH_NOTES**.
- **HTTP backend flow:** **PASS**.
- **Frontend landing:** **PASS** (`GET /` → 200, contenido "JobIT").
- **UI navegador:** **BLOCKED** por ausencia de navegador/Playwright/DevTools en el entorno de agente. No se inventa validación visual.

Evidencia concreta (sin valores sensibles):
- `GET /health` → **200**.
- `POST /api/auth/register` → **201** (accessToken y user presentes).
- `POST /api/auth/login` → **200** (accessToken presente; `Set-Cookie: refresh_token` presente, atributos `HttpOnly`, `SameSite=Lax`, `Path=/`, sin `Secure` en dev http).
- `GET /api/dashboard/me` (Bearer) → **200**; contiene `profile`, `skills`, `savedJobs`, `matches`, `nextActions`; `completionPercentage=0`; **3** matches; **sin fuga** de `externalId`/`ingestedAt`/`passwordHash`/`tokenHash`.
- `POST /api/auth/logout` → **204**.
- `GET /api/auth/me` sin token → **401**.

No se incluyen tokens, cookies, passwords ni valores de `.env`.

## Deploy dev/staging

- **Deploy NO ejecutado.** Solo se creó el **plan** (`sprint-08-deploy-plan.md`).
- **Decisiones pendientes:** dominio/subdominio; DB staging; reverse proxy; SSL; estrategia de procesos; backup pre-migración; smoke visual.
- El deploy futuro **requiere autorización explícita** y un target definido (dominio/DB/servidor).

## Tests y verificificaciones

- Backend typecheck **PASS**.
- Backend build **PASS**.
- Backend test **278/278 PASS**.
- Frontend typecheck **PASS**.
- Frontend test **35/35 PASS**.
- Frontend lint **PASS**.
- Frontend build **PASS**.
- `git diff --check` **PASS** (limpio).
- Auditoría quality/security **PASS_WITH_NOTES**.
- En la auditoría final **no se repitieron** los tests porque **no hubo cambios de código** desde las verificaciones previas (solo documentación + `.env.example`).

## Decisiones técnicas

- Usar **WSL nativo** como entorno obligatorio (no OneDrive).
- Usar **`jobit_dev`** separada en el contenedor existente; **no contaminar `jobit_test`**.
- **No** introducir `docker-compose` todavía (requiere autorización; afecta infra).
- Crear `apps/api/.env.example` como **plantilla segura** versionable.
- Mantener `.env` locales **ignorados** por Git.
- Usar **fallback `tsx`** para el seed porque `prisma db seed` no está cableado en `package.json` (no modificable en esta fase).
- **Documentar** el deploy antes de ejecutarlo.
- **No** ejecutar deploy sin target ni autorización.

## Seguridad y secretos

- No se imprimieron `.env` reales.
- No se imprimieron tokens ni cookies; `accessToken`/`refresh_token` solo se validaron **por presencia**.
- `.env` locales **ignorados** por Git; no aparecen en `git status`.
- `apps/api/.env.example` revisado: **sin secretos** (solo placeholders).
- **Sin** llamadas reales a Jooble.
- **Sin** cambios destructivos; **sin** `drop`/`reset`; **sin** borrado de volúmenes.
- **Sin** commit/push/PR.

## Problemas encontrados

- El shell WSL puede arrancar en **OneDrive** si no se fuerza la ruta nativa (`wsl --cd` + `pwd -P`).
- `apps/api/.env.example` **no existía**.
- `apps/api/.env` **no existía**.
- `apps/web/.env.local` **no existía**.
- `apps/web/node_modules` **ausente** inicialmente (resuelto con `pnpm install --frozen-lockfile`).
- `docker-compose`/`docker/` **ausentes**.
- Solo existía el contenedor de DB de **test**.
- **Smoke visual** bloqueado por ausencia de navegador/Playwright.
- `prisma db seed` **no cableado** en `package.json`.
- Posible **deuda de cookies cross-site/HTTPS** para staging (`SameSite=None; Secure`).

## Pendiente / backlog

- **Smoke visual** con navegador/Playwright si se considera necesario.
- Decidir **target** dev/staging.
- Decidir **dominio/subdominio**.
- Decidir **DB staging**.
- Decidir **reverse proxy/SSL**.
- Ajustar **cookie** para HTTPS/cross-site si staging usa subdominios cruzados.
- Valorar **cablear `prisma seed`** en `package.json` en un sprint futuro.
- **Prompt final** de actualización documental global.
- **commit/push/PR** solo con autorización (sin `Co-Authored-By`).

## Estado actual del proyecto

- **MVP backend candidate-first completo hasta dashboard** (M01–M06).
- **Frontend candidate-first inicial** validado localmente (Sprint 07 + smoke HTTP Sprint 08).
- **Entorno local real preparado** (backend `:4000` + `jobit_dev` + frontend `:3000`).
- **Smoke HTTP resuelto** (cierra la deuda del Sprint 07 a nivel funcional).
- **Deploy dev/staging planificado, no ejecutado.**
- Sprint 08 **listo para cierre con PASS_WITH_NOTES** tras documentación global / commit / PR.

## Recomendación para el orquestador

- **Cerrar Sprint 08 como PASS_WITH_NOTES.**
- **No ejecutar deploy** todavía sin target definido.
- Antes del deploy, decidir si hace falta el **smoke visual**.
- **Autorizar** el prompt de actualización documental global.
- Después, **autorizar commit/push/PR** si todo sigue limpio.

## Prompt sugerido para continuar

> **Fase: Actualización documental global Sprint 08 (solo documentación).** En WSL
> nativo (`wsl --cd /home/david/projects/JobIT-platform`, verificar `pwd -P`), rama
> `feat/sprint-08-env-smoke-deploy`: actualizar `README.md` y, si procede,
> `docs/specs/00-mvp-scope.md` para reflejar el estado real del Sprint 08 (entorno
> WSL nativo, smoke HTTP local PASS_WITH_NOTES, deploy dev/staging **planificado no
> ejecutado**, smoke visual pendiente). No documentar deploy como realizado, no
> inventar smoke visual, no documentar `/api/auth/refresh`. No tocar código, Prisma,
> `package.json` ni lockfiles. Ejecutar `git diff --check` y `git status --short`.
> Sin commit/push.
