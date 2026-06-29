# Informe final operador — Sprint 04 Saved Jobs

## Sprint o tarea

Sprint 04 — Saved Jobs (M04). Rama `feat/sprint-04-saved-jobs`, partiendo de `dev` (`1d33863`).

## Objetivo inicial

Permitir que el candidato autenticado pueda **guardar**, **listar** y **quitar** ofertas de empleo, con datos propios, sin duplicados y reutilizando el contrato público de Jobs estabilizado en Sprint 03.6 (`serializeJob` / `JobPublicDto`). Backend-only, sin frontend, sin llamadas a Jooble.

## Trabajo realizado

Ciclo SDD → TDD → modelo → RED → GREEN → auditoría, en commits pequeños y revisables:

- Fase 0 documental: brief del sprint (`d49d844`).
- SDD Review: resolución del contrato de endpoints en la spec (`22ce9fb`).
- TDD Planning: plan de tests (`58e733d`).
- Modelo Prisma `SavedJob` + migración + `truncateTables` (`ed1285d`).
- Tests RED de integración: 24 casos (`6180588`).
- Implementación GREEN del módulo + montaje en `app.ts` (`d9002f4`).

## Archivos modificados

Productivos (commit GREEN `d9002f4`):

- `apps/api/src/saved-jobs/saved-jobs.schemas.ts` (nuevo)
- `apps/api/src/saved-jobs/saved-jobs.service.ts` (nuevo)
- `apps/api/src/saved-jobs/saved-jobs.router.ts` (nuevo)
- `apps/api/src/app.ts` (montaje de `/api/saved-jobs`)

Modelo y tests (commits previos):

- `apps/api/prisma/schema.prisma` (modelo `SavedJob` + back-relations en `User`/`Job`)
- `apps/api/prisma/migrations/20260629084049_add_saved_jobs/migration.sql`
- `apps/api/src/tests/setup.ts` (`"SavedJob"` en `truncateTables`)
- `apps/api/src/saved-jobs/saved-jobs.integration.test.ts` (24 tests)

Documentación:

- `docs/specs/features/saved-jobs.md`, `docs/sprints/sprint-04-saved-jobs-agent-brief.md`, `docs/sprints/sprint-04-saved-jobs-tdd-plan.md`, este informe.

## Endpoints implementados

Todos bajo prefijo `/api` y con `requireAuth`:

| Método | Ruta | Éxito | Errores |
|---|---|---|---|
| GET | `/api/saved-jobs` | `200 { data: [{ savedAt, job }] }` | `401` |
| POST | `/api/saved-jobs/:jobId` | `201` (crea) / `200` (ya guardada) | `401`, `400` (forma), `404` (inexistente) |
| DELETE | `/api/saved-jobs/:jobId` | `204` | `401`, `400` (forma), `404` (no guardada) |

GET ordena por `savedAt` desc. POST es idempotente (no duplica, nunca `409`). El `Job` embebido se serializa con `JobPublicDto`.

## Modelo de datos

`model SavedJob { id, userId, jobId, savedAt }` con:

- `@@unique([userId, jobId])` (impide duplicados),
- FKs `user`/`job` con `onDelete: Cascade` (coherente con `RefreshToken`/`CandidateProfile`),
- índices `userId`, `jobId`, `savedAt`,
- back-relations `User.savedJobs` y `Job.savedBy`.

Migración `20260629084049_add_saved_jobs` aplicada; SQL con tabla, PK, unique, índices y FKs `ON DELETE CASCADE`.

## Tests y verificaciones

- Suite API completa: **213 passed (213)** · Test Files **26 passed (26)**.
- 24 tests nuevos de Saved Jobs (GET/POST/DELETE + ownership + idempotencia + contrato público + INTERNAL/JOOBLE + CLOSED).
- `typecheck`: **PASS**. `build`: **PASS**. `git diff --check`: limpio.
- Sin regresiones en Auth, Profile/CV, Jobs ni Jooble.

## Decisiones técnicas

- **`jobId` en path** (`POST/DELETE /saved-jobs/:jobId`), resuelto en SDD Review conforme a ADR-0007 (simetría save/unsave, reutiliza validación UUID-shape, sin body, mínima superficie de entrada).
- **POST idempotente** `201`/`200` (no `409`): el ejemplo genérico de `409` de ADR-0007 no aplica a este recurso por mandato de la spec.
- **Reutilización de `serializeJob`/`JobPublicDto`** sin duplicar; GET no filtra por estado, por lo que las ofertas CLOSED/expiradas guardadas se conservan con `status`/`expiresAt` visibles.
- **Validación**: `savedJobIdParamSchema` con el mismo `UUID_SHAPE` de Jobs (forma inválida → `400`, inexistente → `404`).
- **Errores normalizados** con `SavedJobsError` (patrón `JobsError`) y formato `{ error: { code, message } }`.

## Seguridad y ownership

- Las 3 rutas exigen `requireAuth`; sin sesión → `401`.
- `userId` se obtiene **solo** de `req.auth.userId` (helper `authUserId`); `body`/`query`/`params` con `userId` se ignoran (verificado por tests).
- `GET` y `DELETE` acotados al usuario autenticado: A no ve ni borra guardados de B; intento cross-user → `404` y el registro ajeno queda intacto.
- Sin fuga de `externalId`/`ingestedAt` (verificado por propiedad y `JSON.stringify`).
- Sin secretos, sin `.env`, sin llamadas reales a Jooble (el módulo no referencia el cliente Jooble; las ofertas JOOBLE se prueban como datos ya persistidos).

## Problemas encontrados

- Ninguno funcional. Punto de atención resuelto en RED: para evitar falsos verdes, los casos que esperan `404` usan `assertContract404`, que descarta el `404` genérico de ruta no montada (mensaje "Route … not found.") frente al `404` de dominio.
- Entorno: no existe `.env`/`DATABASE_URL` de desarrollo; las migraciones y tests usan la BD de test (5434) sancionada, sin tocar `.env` ni secretos.

## Pendiente / backlog

- Frontend de Saved Jobs (lista, botón guardar/quitar, estados vacío/carga/error, indicador "no disponible").
- Posible paginación de `GET /api/saved-jobs` si crece el volumen (hoy devuelve `{ data: [...] }` sin paginar).
- Documentar el informe final del Sprint 03.6 como archivo (hueco de trazabilidad detectado en Startup).
- Actualización documental global (README/índices) en fase aparte.

## Estado actual del proyecto

Rama `feat/sprint-04-saved-jobs` con 6 commits por delante de `dev`, working tree limpio, suite 213/213, typecheck y build verdes. Saved Jobs operativo a nivel de API y listo para PR a `dev` tras la actualización documental y el checklist de PR.

## Recomendación para el orquestador

PASS. Proceder a: (1) commit de documentación (este informe), (2) actualización documental global si aplica, (3) PR checklist y apertura de PR `feat/sprint-04-saved-jobs → dev`, (4) verificación post-merge **solo tras** confirmar `mergedAt != null`.

## Prompt sugerido para continuar

> Fase: Commit del informe final + actualización documental global Sprint 04. Objetivo: commitear `docs/sprints/sprint-04-saved-jobs-final-report.md` y, si procede, actualizar README/índices de sprints, sin tocar código. Después, PR checklist y apertura de PR a `dev`. Restricciones: no push/merge sin autorización; no tocar código/Prisma/tests; sin Co-Authored-By.
