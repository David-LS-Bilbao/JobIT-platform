# Informe final — Sprint 03 Jobs

## 1. Sprint o tarea

Sprint 03 — JobIT Jobs / ofertas tech (módulo M03).

## 2. Objetivo inicial

Implementar el módulo M03 (Jobs) del MVP candidate-first: permitir que un candidato autenticado explore ofertas laborales tech (cargadas por seed) con filtros y paginación, y consulte el detalle de una oferta. Alcance backend:

- Modelo `Job` en Prisma/PostgreSQL.
- Seed/mock de ofertas tech.
- `GET /api/jobs` privado con filtros y paginación.
- `GET /api/jobs/:id` privado.
- Reglas de negocio ACTIVE / no expirada.
- Tests backend de integración.

Fuera de alcance: frontend, saved-jobs (M04), recruiter/ATS, scraping, APIs externas, IA avanzada.

## 3. Trabajo realizado

- **Brief y TDD plan:** `sprint-03-jobs-agent-brief.md` y `sprint-03-jobs-tdd-plan.md` (decisiones técnicas cerradas, plan de tests y fases).
- **Modelo Prisma `Job`:** con enums `RemoteType`, `JobSeniority`, `JobStatus` e índices de MVP.
- **Migración `add_jobs`:** `20260622162314_add_jobs` (solo enums, tabla `Job` e índices).
- **Seed:** `apps/api/prisma/seed.ts` con 14 ofertas tech variadas (incluye CLOSED y expirada para pruebas manuales).
- **Tests RED/GREEN de listado:** `jobs-list.integration.test.ts` (10 casos) → implementación `GET /api/jobs`.
- **Implementación de listado:** `jobs.schemas.ts`, `jobs.service.ts`, `jobs.router.ts`; montaje en `app.ts`.
- **Tests RED/GREEN de detalle:** `jobs-detail.integration.test.ts` (6 casos, endurecidos) → implementación `GET /api/jobs/:id`.
- **Implementación de detalle:** `getActiveJobById`, `JobsError`, validación de `:id`, handler `GET /:id`.
- **Auditoría quality/security:** Fase 4.6 → PASS_WITH_NOTES.

## 4. Archivos modificados

**Docs**
- `docs/sprints/sprint-03-jobs-agent-brief.md`
- `docs/sprints/sprint-03-jobs-tdd-plan.md`
- `docs/sprints/sprint-03-jobs-final-report.md` (este informe)

**Prisma / migration / seed**
- `apps/api/prisma/schema.prisma` (modelo `Job` + 3 enums + 5 índices)
- `apps/api/prisma/migrations/20260622162314_add_jobs/migration.sql`
- `apps/api/prisma/seed.ts`

**Backend Jobs**
- `apps/api/src/jobs/jobs.schemas.ts`
- `apps/api/src/jobs/jobs.service.ts`
- `apps/api/src/jobs/jobs.router.ts`

**Tests**
- `apps/api/src/jobs/jobs-list.integration.test.ts`
- `apps/api/src/jobs/jobs-detail.integration.test.ts`

**Setup / app**
- `apps/api/src/tests/setup.ts` (añadido `"Job"` al TRUNCATE)
- `apps/api/src/app.ts` (montaje de `jobsRouter`)

## 5. Tests y verificaciones

- **API test:** 143/143 passing (19 test files).
- **jobs-list:** 10/10.
- **jobs-detail:** 6/6.
- **typecheck:** PASS.
- **build:** PASS.
- **lint:** no configurado en `@jobit/api` (el root usa `pnpm -r --if-present lint`, que no ejecuta nada en API). Deuda preexistente, no bloqueante.

## 6. Decisiones técnicas

- Enums Prisma nuevos: `RemoteType { REMOTE, HYBRID, ON_SITE }`, `JobSeniority { JUNIOR, MID, SENIOR, ANY }`, `JobStatus { ACTIVE, CLOSED }` (no se reutilizan los de Profile por tener value-sets distintos).
- `contractType` como `String` en DB (ADR-0008), validado en query con Zod contra valores permitidos.
- Query param `remote` mapea al campo `remoteType`.
- Filtro `seniority=X` devuelve `X` **y** las ofertas `ANY`.
- Filtro `tags` con semántica OR (`hasSome`); admite query repetido y fallback CSV.
- Búsqueda `q` case-insensitive en `title` y `description`.
- Paginación `{ data, total, page, limit }` (`page` def 1, `limit` 1-100 def 20).
- Orden por defecto `postedAt desc`, desempate `id asc`.
- Detalle devuelve solo ofertas `ACTIVE` no expiradas.
- `404` uniforme `"Oferta no disponible"` para inexistente, CLOSED o expirada (no se distingue ante el cliente).
- `:id` validado por **forma** UUID (`8-4-4-4-12` hex), no por v4 estricto: un id bien formado inexistente resuelve `404`; uno sin forma de UUID resuelve `400`.
- Seed ejecutable vía `pnpm --filter @jobit/api exec tsx prisma/seed.ts`, sin tocar `package.json`.
- Sin índice GIN para `tags` en el MVP (filtro `hasSome` por scan; aceptable al volumen actual).

## 7. Seguridad

- `requireAuth` en `GET /api/jobs` y `GET /api/jobs/:id` → `401` sin sesión.
- Validación server-side con Zod de query y params (`.strip()`).
- `limit` capado a 100; `q` capado a 200.
- Enums validados (`remote`, `seniority`, `contractType`).
- `:id` validado antes de consultar la DB.
- No se acepta `userId` desde query/body/params (Jobs no tiene ownership).
- `Job` no contiene datos personales; la respuesta no expone información de candidatos.
- Seed con datos ficticios, sin secretos ni datos reales.
- Errores normalizados `{ error: { code, message, details? } }` (ADR-0007).

## 8. Problemas encontrados

- Los tests `404` de detalle pasaban accidentalmente por el `notFoundMiddleware` genérico (mismo `code: NOT_FOUND`); se **endurecieron** aseverando el message de negocio `"Oferta no disponible"` (microfase 4.4A).
- `z.string().uuid()` (Zod v4, estricto) rechazaba el UUID all-1s usado como fixture inexistente, devolviendo `400` en vez de `404`. Se cambió a **validación de forma UUID** en `jobs.schemas.ts`, sin tocar los tests.
- Lint no configurado en `@jobit/api` (deuda preexistente del proyecto, aplazada en Sprint 02.5).
- El runner del seed se mantuvo fuera de `package.json` por decisión de control de alcance (sin autorización para tocar manifests en este sprint).

## 9. Pendiente

- Frontend de Jobs (sprint/fase posterior).
- Saved-jobs en M04 / fase posterior.
- Script oficial de seed (`prisma db seed` / `db:seed`) si se autoriza tocar `apps/api/package.json`.
- Configurar lint/ESLint en `@jobit/api`.
- Posible índice GIN para `tags` si crece el volumen de ofertas.
- Posible serializer dedicado de `Job` si el contrato de la API evoluciona.

## 10. PR checklist (modo documental)

- [x] Rama correcta (`feat/sprint-03-jobs`), no `main`/`dev`.
- [x] Working tree limpio antes de la PR.
- [x] Alcance MVP respetado.
- [x] Tests verdes (143/143; jobs-list 10/10; jobs-detail 6/6).
- [x] typecheck/build verdes.
- [x] Sin secretos.
- [x] Sin cambios en `package.json`/lockfiles.
- [x] Sin frontend.
- [x] Sin saved-jobs.
- [x] Sin scope creep.
- [x] Docs actualizadas (brief, tdd-plan, informe final).
- [x] Notas/deudas documentadas (§7 seguridad, §8 problemas, §9 pendiente).
- [x] Existe spec en `docs/specs/features/jobs.md`.
- [x] PR apuntará a `dev`.
- [x] Auditoría quality/security en `PASS_WITH_NOTES` (no `FAIL`).

## 11. Recomendación para el orquestador

- Abrir PR `feat/sprint-03-jobs` → `dev`.
- No mergear hasta revisión del orquestador y, si existe CI, esperar su resultado.
- Resultado del sprint: **listo para revisión con PASS_WITH_NOTES**.
- Llevar a backlog las notas no bloqueantes: lint en `@jobit/api`, runner oficial de seed, índice GIN para tags, serializer de `Job`.

## 12. Prompt sugerido para continuar

```
Fase: Sprint 03 — Commit informe final + abrir PR hacia dev.
Rama: feat/sprint-03-jobs.
Tareas:
1. Verificar git: rama correcta, working tree solo con el informe untracked, origin/dev alineado.
2. git add docs/sprints/sprint-03-jobs-final-report.md
3. Commit "docs(sprint): add sprint 03 jobs final report" (sin Co-Authored-By) y push normal.
4. Abrir PR feat/sprint-03-jobs -> dev con resumen del sprint (modelo Job, seed, GET /api/jobs
   y GET /api/jobs/:id), tests 143/143, auditoría PASS_WITH_NOTES y notas/deudas documentadas.
5. No mergear. Esperar revisión humana y CI.
```
