# Sprint 04 — Saved Jobs TDD Plan

> Plan de tests previo a la implementación. No escribe tests ni toca código/Prisma.
> Fija los casos RED, las fixtures y el orden RED→GREEN antes de crear el modelo
> `SavedJob` y los endpoints.

## Estado inicial

- **Rama:** `feat/sprint-04-saved-jobs`.
- **Commits previos en la rama:**
  - `d49d844` — docs(sprint): add sprint 04 saved jobs agent brief
  - `22ce9fb` — docs(spec): resolve saved jobs endpoint contract
- **Working tree:** limpio al iniciar esta fase.
- **Spec validada:** `docs/specs/features/saved-jobs.md` (SDD Review cerrada).
- **Contrato de endpoints fijado:** `GET /saved-jobs`, `POST /saved-jobs/:jobId`, `DELETE /saved-jobs/:jobId` (prefijo `/api` al montar).

## Objetivo del plan

Este documento fija los **tests RED** que se escribirán **antes** del modelo Prisma `SavedJob` y de la implementación del servicio/router. Define qué debe fallar inicialmente (ausencia de modelo/rutas/servicio), las fixtures multi-usuario, y los criterios RED/GREEN. No se implementa nada en esta fase.

## Contrato bajo test

- **GET `/api/saved-jobs`** (`requireAuth`): lista los guardados del usuario autenticado, orden `savedAt` desc; cada elemento incluye `savedAt` + oferta serializada con `JobPublicDto`.
- **POST `/api/saved-jobs/:jobId`** (`requireAuth`): idempotente; `201` al crear, `200` si ya estaba guardada; `400` si `jobId` tiene forma inválida; `404` si la oferta no existe.
- **DELETE `/api/saved-jobs/:jobId`** (`requireAuth`): `204` al eliminar guardado propio; `404` si el usuario no la tenía guardada; `400` si `jobId` tiene forma inválida.
- `userId` **siempre** desde `req.auth.userId`; nunca desde body/query/params.
- Job embebido/devuelto vía `serializeJob` / `JobPublicDto`; **sin** `externalId` ni `ingestedAt`; **con** `source`/`sourceUrl`.
- Funciona con ofertas `INTERNAL` y `JOOBLE` ya persistidas.
- Saved Jobs **no** realiza llamadas a Jooble.

## Estrategia TDD

Orden recomendado:

1. **Modelo Prisma `SavedJob` + migración** (fase de modelo, no ahora): `id`, `userId`, `jobId`, `savedAt`, unique `(userId, jobId)`, FKs a `User` y `Job` con `onDelete: Cascade` (coherente con `RefreshToken`/`CandidateProfile`). Añadir `"SavedJob"` a `truncateTables` en `src/tests/setup.ts` (o confiar en el `CASCADE` desde `User`/`Job`; se hará explícito).
2. **Tests RED** de endpoints, modelo/constraint y ownership (fallan por ausencia de modelo/router/servicio).
3. **Implementación GREEN mínima**: `saved-jobs.service.ts`, `saved-jobs.schemas.ts`, `saved-jobs.router.ts`, montaje en `app.ts`, reutilizando `serializeJob`.
4. **Refactor seguro** sin cambiar el contrato (extraer errores normalizados si encaja con el patrón `JobsError`).
5. **Auditoría quality/security** (read-only) + informe final.

## Fixtures necesarias

Creadas directamente con Prisma en el `beforeEach`/helpers del test (patrón ya usado en `jobs-visibility.integration.test.ts`), tras `truncateTables`:

- **Usuario A** y **Usuario B**: candidatos autenticables vía `POST /api/auth/register` → `{ accessToken, userId }` (helper `registerUser(email)`).
- **Oferta INTERNAL activa**: `source = INTERNAL`, `externalId/sourceUrl/ingestedAt = null`, `status = ACTIVE`.
- **Oferta JOOBLE activa persistida**: `source = JOOBLE`, `externalId`, `sourceUrl`, `ingestedAt` poblados, `status = ACTIVE` (sin red; insertada con `prisma.job.create`).
- **Oferta CLOSED o expirada**: `status = CLOSED` o `expiresAt` en el pasado, para verificar que un guardado previo se conserva en el listado con `status`/`expiresAt` disponibles.
- **Guardados iniciales de A**: A guarda la oferta INTERNAL (y opcionalmente la JOOBLE).
- **Guardados iniciales de B**: B guarda una oferta distinta, para verificar aislamiento.
- **Datos de aislamiento**: una misma oferta guardada por A y por B (unique `(userId, jobId)` por usuario, no global).

> Patrón confirmado: Vitest + Supertest, `globalSetup` ejecuta `prisma migrate deploy`, `fileParallelism: false`, `beforeEach` → `truncateTables(prisma)`, auth con header `Authorization: Bearer <accessToken>`. Imports ESM con extensión `.js`.

## Plan de tests RED por endpoint

### GET /api/saved-jobs
- sin sesión → `401`;
- usuario sin guardados → `200` con colección vacía;
- usuario con guardados → `200` ordenado por `savedAt` desc;
- solo devuelve guardados del usuario autenticado (A no ve los de B);
- incluye ofertas `INTERNAL` y `JOOBLE`;
- cada `Job` usa contrato `JobPublicDto`;
- no expone `externalId` ni `ingestedAt` (assert por propiedad y por `JSON.stringify`);
- conserva ofertas `CLOSED`/expiradas previamente guardadas, con `status`/`expiresAt` disponibles para el indicador de "no disponible".

### POST /api/saved-jobs/:jobId
- sin sesión → `401`;
- `jobId` con forma inválida → `400`;
- oferta inexistente (forma UUID válida) → `404`;
- guardar `INTERNAL` activa → `201` y crea `SavedJob` con `userId` correcto;
- guardar `JOOBLE` activa persistida → `201` y crea `SavedJob` con `userId` correcto;
- guardar la misma oferta dos veces por el mismo usuario → `200` en la segunda llamada y **no** duplica;
- usuarios distintos pueden guardar la misma oferta sin conflicto (A y B);
- no acepta ni usa `userId` desde body/query (si se envía, se ignora; el registro queda con el `userId` del token);
- respuesta usa `JobPublicDto`;
- no expone `externalId` ni `ingestedAt`.

### DELETE /api/saved-jobs/:jobId
- sin sesión → `401`;
- `jobId` con forma inválida → `400`;
- quitar guardado propio existente → `204` y elimina **solo** ese registro;
- quitar oferta no guardada por ese usuario → `404`;
- usuario A no puede borrar el guardado de B → `404` por scoping (el registro de B permanece intacto);
- repetir DELETE tras eliminar → `404`;
- no acepta ni usa `userId` desde body/query.

### Modelo / constraint
- unique `(userId, jobId)` impide duplicados a nivel de BD;
- FK `userId` apunta a `User`;
- FK `jobId` apunta a `Job`;
- relación/borrado compatible con el patrón existente (`onDelete: Cascade`, como `RefreshToken`/`CandidateProfile`);
- `savedAt` se crea automáticamente (`@default(now())`).

## Tests de regresión

- los tests de Jobs (`jobs-list`, `jobs-detail`, `jobs-visibility`, `jobs-provenance`) siguen verdes;
- los tests de Auth siguen verdes;
- Jooble **no** se llama desde Saved Jobs (sin red; ningún import del cliente Jooble en el módulo saved-jobs);
- el serializer de Jobs sigue ocultando `externalId`/`ingestedAt` (sin cambios en `jobs.serializer.ts`).

## Archivos previstos para fases posteriores

Previsión (no se modifican ahora):

- `apps/api/prisma/schema.prisma` (modelo `SavedJob` + relaciones en `User` y `Job`).
- `apps/api/prisma/migrations/**` (nueva migración del modelo).
- `apps/api/src/saved-jobs/saved-jobs.router.ts`
- `apps/api/src/saved-jobs/saved-jobs.service.ts`
- `apps/api/src/saved-jobs/saved-jobs.schemas.ts`
- `apps/api/src/saved-jobs/saved-jobs.errors.ts` (solo si encaja con el patrón `JobsError`; alternativamente reutilizar un error genérico).
- `apps/api/src/saved-jobs/saved-jobs.integration.test.ts` (ubicación coherente con los tests de integración existentes; posible split por endpoint si crece).
- `apps/api/src/app.ts` (montar `savedJobsRouter` bajo `/api/saved-jobs`).
- `apps/api/src/tests/setup.ts` (añadir `"SavedJob"` a `truncateTables`).
- Reutilización de `apps/api/src/jobs/jobs.serializer.ts` (`serializeJob`/`JobPublicDto`) — sin duplicar.

## Criterios RED

- Los tests deben fallar **por ausencia de modelo/rutas/servicio** (404 de ruta no montada, error de tipo por modelo `SavedJob` inexistente, o ausencia de `savedJobsRouter`), **no** por errores de sintaxis, imports rotos ni setup de BD roto.
- El setup de BD (migrate deploy + truncate) debe seguir funcionando; si el modelo aún no existe, los tests que dependan de `prisma.savedJob` fallarán de forma controlada y esperada.
- No se usan `@ts-expect-error` para forzar el RED.

## Criterios GREEN

- Todos los tests de Saved Jobs pasan.
- No regresan los tests existentes (Auth, Profile/CV, Jobs, Jooble).
- `pnpm --filter @jobit/api typecheck` pasa.
- `pnpm --filter @jobit/api build` pasa.
- `git diff --check` limpio.

## Riesgos y kill-switch TDD

Marcar **BLOCKED** / detener si en cualquier fase:

- se acepta o usa `userId` desde body/query/params;
- alguna ruta de Saved Jobs queda sin `requireAuth`;
- hay fuga de datos entre usuarios (A ve/borra guardados de B);
- se duplica la serialización de `Job` en lugar de reutilizar `serializeJob`/`JobPublicDto`;
- se exponen `externalId` o `ingestedAt`;
- se toca frontend;
- se hacen llamadas reales a Jooble;
- se modifica `package.json`/lockfiles sin permiso;
- se crea la migración antes de aceptar este plan;
- los tests dependen de un orden real no controlado (deben fijar orden explícito por `savedAt` y datos deterministas);
- los tests pasan sin probar realmente el ownership (todo caso multi-usuario debe verificar el registro del otro usuario tras la operación).

## Verificaciones previstas al cierre técnico

- `pnpm --filter @jobit/api test`
- `pnpm --filter @jobit/api typecheck`
- `pnpm --filter @jobit/api build`
- `git diff --check`
- `git status --short`
- Documentar si **lint no está configurado** (informativo, no bloqueante).
