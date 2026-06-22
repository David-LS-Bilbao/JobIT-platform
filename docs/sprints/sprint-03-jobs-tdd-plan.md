# Sprint 03 — Jobs TDD Plan

## 1. Objetivo

Implementar el módulo M03 (Jobs) del MVP candidate-first: permitir que un candidato autenticado explore ofertas laborales tech (cargadas por seed en la base de datos), aplique filtros básicos y paginación, y consulte el detalle de una oferta. El alcance backend se limita a dos endpoints privados (`GET /api/jobs`, `GET /api/jobs/:id`), el modelo `Job` en Prisma, un seed reproducible y tests de integración. Conforme a [docs/specs/features/jobs.md](../specs/features/jobs.md) y a ADR-0005, ADR-0007 y ADR-0008.

## 2. Estado previo

- **Startup + Alignment Report:** PASS.
- **SDD Review:** PASS. La spec cubre los apartados mínimos (objetivo, usuario, flujo, modelo `Job`, endpoints, query params, filtros, paginación, reglas de negocio, validaciones, errores, criterios de aceptación, tests mínimos, fuera de alcance). Única ausencia: ordenación por defecto (se cierra como decisión técnica). Sin contradicciones con los ADR. Sin necesidad de parche de spec.
- **TDD Planning:** PASS (este documento lo formaliza).
- **Rama:** `feat/sprint-03-jobs`, base `dev` (`407d06d`), working tree limpio.

## 3. Referencias SDD/ADR

- Spec: [docs/specs/features/jobs.md](../specs/features/jobs.md).
- [ADR-0005](../decisions/ADR-0005-backend-framework.md) — Express + Zod (validación server-side de query params).
- [ADR-0007](../decisions/ADR-0007-api-design.md) — REST `/api`, errores normalizados `{error:{code,message,details?}}`, paginación offset `{data,total,page,limit}` (`page` def 1, `limit` 1-100 def 20), `userId` siempre del token, query params validados en servidor.
- [ADR-0008](../decisions/ADR-0008-database-orm-initial-model.md) — PostgreSQL + Prisma; modelo `Job` (recurso público sin propietario), seed de 10-20 ofertas reproducible.

Convenciones reales del repo reutilizadas (Sprint 01/02): módulo en `apps/api/src/<módulo>/` con `*.router.ts` / `*.service.ts` / `*.schemas.ts` y tests colocados; routers montados en [app.ts](../../apps/api/src/app.ts) con `app.use("/api/<col>", router)`; `requireAuth` desde `auth/require-auth.middleware.js` (401 `UNAUTHORIZED`); errores `{error:{code,message,details?}}` con `ZodError → 400 VALIDATION_ERROR`; tests con `registerUser()` (auth real) y `truncateTables(prisma)` en `beforeEach`; `globalSetup` ejecuta `prisma migrate deploy` contra `DATABASE_URL_TEST` (`localhost:5434`); el seed global **no** se carga en tests (cada test crea sus fixtures).

## 4. Decisiones técnicas cerradas

| Tema | Decisión | Justificación | Riesgo |
|---|---|---|---|
| Modelo Prisma | `model Job`: `id uuid pk`, `title`/`company` requeridos, `location String?`, `remoteType RemoteType`, `description String`, `requirements String[]`, `seniority JobSeniority`, `contractType String`, `salaryMin Int?`, `salaryMax Int?`, `tags String[]`, `status JobStatus @default(ACTIVE)`, `postedAt DateTime @default(now())`, `expiresAt DateTime?` | Coincide con ADR-0008 y spec | Bajo |
| Enums Prisma nuevos | `RemoteType { REMOTE, HYBRID, ON_SITE }`, `JobSeniority { JUNIOR, MID, SENIOR, ANY }`, `JobStatus { ACTIVE, CLOSED }` | No se reutilizan `Seniority`/`RemotePreference` existentes: sus value-sets difieren (Job añade `ANY` en seniority; remoteType no tiene `ANY`) | Bajo |
| contractType | Se mantiene como **String** en DB (ADR-0008), pero se valida con **Zod** contra valores permitidos (`FULL_TIME`, `PART_TIME`, `CONTRACT`, `FREELANCE`) | Respeta el ADR sin renunciar a validación | Bajo |
| remoteType vs query | El query param `remote` mapea al campo `remoteType`; Zod `enum(REMOTE/HYBRID/ON_SITE)` | La spec usa `remoteType` (modelo) y `remote` (filtro) | Bajo |
| seniority ANY | Filtro `seniority=X` devuelve jobs con `seniority = X` **y** jobs con `seniority = ANY` | "ANY = abierta a cualquier nivel": una oferta ANY es relevante para todos los niveles | Medio (regla de negocio explícita) |
| tags | Acepta query repetido (`?tags=a&tags=b`) y, si es sencillo, fallback CSV; semántica **OR** (`hasSome`) | UX "muestra ofertas con alguno de estos tags" | Medio |
| q | Búsqueda **case-insensitive** (`contains`, `mode:"insensitive"`) sobre `title` **y** `description` | Spec L85 | Bajo |
| Ordenación | Por defecto `postedAt desc`, desempate por `id` | La spec no la define; orden determinista estabiliza paginación y tests | Bajo |
| Reglas active/closed/expired | Listado y detalle **solo** devuelven ofertas `ACTIVE` no expiradas. Se excluye `status = CLOSED` o `expiresAt != null AND expiresAt < now` | Spec L83-84 | Bajo |
| Detalle de no disponibles | Ofertas `CLOSED` o expiradas (y las inexistentes) devuelven `404 NOT_FOUND` ("Oferta no disponible") | Spec L84, L126 | Bajo |
| Paginación | Respuesta `{ data, total, page, limit }`; `page ≥ 1` def 1; `limit` 1-100 def 20; `skip = (page-1)*limit` | ADR-0007 | Bajo |
| Errores | Normalizados `{ error: { code, message, details? } }`; `VALIDATION_ERROR`(400), `UNAUTHORIZED`(401), `NOT_FOUND`(404) | ADR-0007 + patrón Profile | Bajo |
| Rutas | Privadas: `requireAuth` en `GET /api/jobs` y `GET /api/jobs/:id`. No se usa `userId` (Jobs no tiene propietario), nunca se acepta del cliente | Spec L70, ADR-0007 | Bajo |
| Seed | `apps/api/prisma/seed.ts` con ≥10-20 ofertas tech; ejecución provisional sin tocar manifests (ver §10) | ADR-0008 | Medio |

## 5. Plan de tests backend

Patrón: Supertest contra la app real, auth real con `registerUser()`, `truncateTables` (ampliado con `"Job"`) en `beforeEach`, fixtures creados con `prisma.job.createMany`. Un archivo por endpoint.

### 5.1 GET /api/jobs

1. Sin sesión → `401 UNAUTHORIZED`.
2. Listado autenticado → solo `ACTIVE` no expiradas (excluye `CLOSED` y `expiresAt < now`).
3. Búsqueda `q` → filtra por `title`/`description` case-insensitive.
4. Filtro `remote` → solo ofertas de ese `remoteType`.
5. Filtro `seniority=X` → ofertas con `seniority X` **+** las `ANY`.
6. Filtro `contractType` → solo ese tipo.
7. Filtro `tags` → ofertas con alguno de los tags (OR).
8. Paginación `page`/`limit` → tamaño de página correcto y `{data,total,page,limit}` coherente; segunda página devuelve el resto.
9. `page` inválida (0, negativa, no entera) → `400 VALIDATION_ERROR`.
10. `limit` inválido (>100, 0, no entero) → `400 VALIDATION_ERROR`.
11. (Complementario) `q` > 200 caracteres → `400`.
12. (Complementario) filtros combinados (`remote` + `seniority`) → intersección correcta.

### 5.2 GET /api/jobs/:id

1. Sin sesión → `401 UNAUTHORIZED`.
2. `id` activo → `200` con detalle completo (todos los campos del modelo).
3. `id` inexistente (UUID válido sin fila) → `404 NOT_FOUND` ("Oferta no disponible").
4. `id` de oferta `CLOSED` → `404`.
5. `id` de oferta expirada (`expiresAt < now`) → `404`.
6. `id` no-UUID → `400 VALIDATION_ERROR` (validación Zod del param, coherente con spec L98).

## 6. Fixtures de test

- **Usuarios:** 1 usuario autenticado vía `registerUser` (Jobs no tiene ownership; basta uno).
- **Jobs activos:** varios `ACTIVE` con `postedAt` distintos (orden y paginación).
- **Jobs cerrados:** ≥1 `CLOSED` (excluido).
- **Jobs expirados:** ≥1 `ACTIVE` con `expiresAt < now` (excluido).
- **Por remoteType:** ≥1 `REMOTE`, `HYBRID`, `ON_SITE`.
- **Por seniority:** ≥1 `JUNIOR`, ≥1 `MID`/`SENIOR`, ≥1 `ANY` (regla `IN (X, ANY)`).
- **Por contractType:** ≥1 por valor relevante (`FULL_TIME`, `FREELANCE`…).
- **Con tags:** ofertas con tags solapados/distintos (p. ej. `["TypeScript","Node.js"]`, `["React"]`) para filtro OR y búsqueda `q`.
- **Estrategia:** fixtures deterministas creados en `beforeEach` tras `truncateTables` (que incluirá `"Job"`), independientes del seed de dev.

## 7. Fases de implementación

### Fase 4.1 — Prisma model + migration + seed file
- **Qué:** añadir `model Job` + enums `RemoteType`/`JobSeniority`/`JobStatus` a `schema.prisma`; `prisma migrate dev` contra `jobit_test`/`dev`; crear `prisma/seed.ts` con ≥10 ofertas.
- **Verificación:** `prisma migrate deploy` OK; `typecheck`; ejecución del seed sin error (ver §10); inspección de la migración.
- **Riesgos:** la ejecución del seed no debe tocar `apps/api/package.json` en esta fase (ver §10).

### Fase 4.2 — Tests GET /api/jobs (RED)
- **Qué:** escribir los casos de §5.1 con fixtures; ampliar `truncateTables` con `"Job"`.
- **Verificación:** `pnpm --filter @jobit/api test -- jobs-list` → RED esperado (router inexistente).
- **Riesgos:** olvidar `"Job"` en el TRUNCATE → contaminación entre tests.

### Fase 4.3 — Implementación GET /api/jobs (GREEN)
- **Qué:** `jobs.schemas.ts` (Zod query), `jobs.service.ts` (filtros + paginación + exclusión cerradas/expiradas + orden `postedAt desc`), `jobs.router.ts` con `requireAuth`; montar en `app.ts`.
- **Verificación:** `jobs-list` verde; `typecheck`; `build`.
- **Riesgos:** tocar `app.ts` (autorizado para esta fase); semántica `tags`/`seniority ANY` debe coincidir con los tests.

### Fase 4.4 — Tests GET /api/jobs/:id (RED)
- **Qué:** casos de §5.2.
- **Verificación:** RED esperado.
- **Riesgos:** confirmar que el `:id` se valida como UUID (caso `400`).

### Fase 4.5 — Implementación GET /api/jobs/:id (GREEN)
- **Qué:** `jobs.service.ts` (`getActiveJobById`), handler en `jobs.router.ts`, validación de `:id` en `jobs.schemas.ts`.
- **Verificación:** `jobs-detail` verde; suite completa; `typecheck`; `build`.
- **Riesgos:** `404` uniforme para inexistente/cerrada/expirada (correcto por spec).

### Fase 4.6 — Quality/security audit
- **Qué:** aplicar [audit-quality-security-skill.md](../agents/audit-quality-security-skill.md): validación server-side, cap `limit`, sin exposición de datos, `requireAuth` en ambas rutas, sin `userId` del cliente.
- **Verificación:** suite completa + `typecheck` + `build` + `lint`.
- **Riesgos:** hallazgos que obliguen a volver a 4.3/4.5.

### Fase 4.7 — Docs + PR checklist
- **Qué:** `docs/sprints/sprint-03-jobs-final-report.md`; aplicar [pr-checklist.md](../agents/pr-checklist.md); abrir PR hacia `dev`.
- **Verificación:** verificaciones obligatorias del brief.
- **Riesgos:** ninguno relevante.

## 8. Archivos afectados previstos

- **Prisma:** `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/**` (4.1).
- **Seed:** `apps/api/prisma/seed.ts` (4.1).
- **Backend routes:** `apps/api/src/jobs/jobs.router.ts` (4.3, 4.5), `apps/api/src/app.ts` (4.3).
- **Backend services:** `apps/api/src/jobs/jobs.service.ts` (4.3, 4.5).
- **Backend schemas:** `apps/api/src/jobs/jobs.schemas.ts` (4.3, 4.5).
- **Backend tests:** `apps/api/src/jobs/jobs-list.integration.test.ts` (4.2), `apps/api/src/jobs/jobs-detail.integration.test.ts` (4.4), `apps/api/src/tests/setup.ts` (añadir `"Job"` al TRUNCATE, 4.2).
- **Docs:** `docs/sprints/sprint-03-jobs-final-report.md` (4.7).
- **Manifests:** **ninguno en este sprint** salvo autorización explícita posterior (ver §10).

## 9. Riesgos y controles

### Seguridad
- Validar **todos** los query params con Zod: `page ≥ 1`, `limit` 1-100 (cap para evitar dumps masivos), `q ≤ 200`, enums (`remote`, `seniority`, `contractType`). Validar `:id` como UUID antes de consultar.
- `requireAuth` en ambas rutas → `401` sin sesión.
- No exponer datos personales: `Job` no contiene datos de candidato; el serializador se limita a los campos del modelo.
- No usar ni aceptar `userId` (Jobs no tiene ownership).

### Técnica
- `truncateTables` debe incluir `"Job"` (modifica `tests/setup.ts`, permitido en fases de test).
- El seed necesita un runner sin tocar manifests en esta fase (ver §10).
- Paginación por offset aceptada por ADR-0007 (reevaluable con volumen alto).
- Considerar índices (`status`, `postedAt`, posible GIN para `tags`) como mejora; documentar si se omite.

### Producto
- No implementar saved-jobs (M04), recruiter/ATS, IA, scraping ni APIs externas. El "guardar" del flujo de la spec es solo un enlace futuro a M04.

### Scope creep
- Evitar full-text avanzado, ordenación configurable y tags AND/OR complejos. Mantener el mínimo que satisface los tests de §5.

## 10. Estrategia provisional de seed

- Se creará más adelante `apps/api/prisma/seed.ts` con ≥10-20 ofertas tech representativas (variando `remoteType`, `seniority` —incluida `ANY`—, `contractType`, `tags`, `status` y `expiresAt`).
- Ejecución provisional, **sin tocar manifests**, mediante:

  ```bash
  pnpm --filter @jobit/api exec tsx prisma/seed.ts
  ```

  (`tsx` ya está disponible en las devDependencies de `@jobit/api`.)
- **No se toca `apps/api/package.json` en este sprint.**
- Si más adelante se necesita configurar `prisma.seed` o un script `db:seed` en `apps/api/package.json` (p. ej. para `prisma db seed`), deberá pedirse **autorización explícita en una fase separada**.
- Los tests de integración **no** dependen del seed: crean sus propios fixtures deterministas.

## 11. Criterios para pasar a Fase 4.1

- Este plan TDD guardado y aceptado por el operador.
- Working tree limpio en `feat/sprint-03-jobs`, alineada con `origin/dev`.
- Estrategia de seed confirmada (§10): seed como script vía `tsx`, sin tocar `apps/api/package.json`.
- Fase 4.1 acotada a: `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/**`, `apps/api/prisma/seed.ts`. DB de test disponible en `localhost:5434`.
- Prompt operativo de 4.1 con lista cerrada de archivos y declaración de skill/fase.

## 12. Fuera de alcance

- Frontend (Next.js, `apps/web`): listado, filtros, detalle, estados vacío/carga/error.
- Saved Jobs (M04), Match (M05), Dashboard (M06).
- Publicación/edición/borrado de ofertas; recruiter/ATS.
- Integración con APIs externas de empleo y scraping.
- Ordenación por relevancia con IA y alertas.
- Cambios en Auth o Profile y resolución de su deuda (N-1, N-3, N-4).
- Deploy, Docker, CI/CD.
- Modificación de `apps/api/package.json` o lockfiles.
