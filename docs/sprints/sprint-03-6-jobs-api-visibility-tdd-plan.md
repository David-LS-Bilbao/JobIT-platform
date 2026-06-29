# Sprint 03.6 — Jobs API External Visibility Policy: TDD Plan

> Documento de planificación. **No** implementa código ni crea tests. Traduce la spec [jobs-api-visibility.md](../specs/features/jobs-api-visibility.md) a un ciclo RED→GREEN acotado.

## Objetivo

Planificar el ciclo RED→GREEN para aplicar la política de visibilidad API de Jobs: que `GET /api/jobs` y `GET /api/jobs/:id` dejen de devolver entidades Prisma `Job` completas y sirvan un **DTO público** explícito (sin `externalId` ni `ingestedAt`, con `source` y `sourceUrl`), e introducir el filtro opcional `source=INTERNAL|JOOBLE`.

## Contrato a proteger

- **Listado** (`GET /api/jobs`): respuesta `{ data, total, page, limit }` donde `data[]` son **DTOs públicos** (no entidades Prisma).
- **Detalle** (`GET /api/jobs/:id`): respuesta = **DTO público** de la oferta.
- **DTO público:** `id`, `title`, `company`, `location`, `remoteType`, `description`, `requirements`, `seniority`, `contractType`, `salaryMin`, `salaryMax`, `tags`, `status`, `postedAt`, `expiresAt`, `source`, `sourceUrl`.
- **Campos internos ocultos:** `externalId`, `ingestedAt`.
- **Filtro `source`:** opcional (`INTERNAL`/`JOOBLE`); ausente → todas; inválido → `400 VALIDATION_ERROR`; combinable con los filtros existentes.

## Estado actual (a cambiar)

- `jobs.router.ts`: `GET /` responde `res.json(result)` y `GET /:id` responde `res.json(job)` → **entidad Prisma completa** (incluye `externalId`/`ingestedAt`). Sin serializer.
- `jobs.service.ts`: `listJobs` → `{ data: Job[], total, page, limit }`; `getActiveJobById` → `Job`. `buildJobsWhere` cubre `q/remote/seniority/contractType/tags`, **sin** `source`.
- `jobs.schemas.ts`: `listJobsQuerySchema` **sin** `source`.

## Tests RED propuestos

Sobre la API real (Supertest + auth real + Prisma de test):

1. `GET /api/jobs` **no** devuelve `externalId` en ningún elemento de `data`.
2. `GET /api/jobs` **no** devuelve `ingestedAt` en ningún elemento de `data`.
3. `GET /api/jobs` **sí** devuelve `source` en cada elemento.
4. `GET /api/jobs` **sí** devuelve `sourceUrl` (valor para externas; `null` para internas).
5. `GET /api/jobs/:id` aplica la misma política (sin `externalId`/`ingestedAt`; con `source`/`sourceUrl`) sobre una oferta activa.
6. `GET /api/jobs?source=INTERNAL` → solo ofertas internas.
7. `GET /api/jobs?source=JOOBLE` → solo ofertas externas Jooble.
8. `GET /api/jobs?source=INVALID` → `400 VALIDATION_ERROR`.
9. No regresión de filtros existentes (`q`, `remote`, `seniority`+`ANY`, `contractType`, `tags`) — al menos un caso combinado.
10. No regresión de paginación (`{ data, total, page, limit }`, `page`/`limit`).

Aserción recomendada para 1/2: comprobar ausencia tanto en el objeto (`expect(item.externalId).toBeUndefined()`) como en el JSON crudo (`expect(JSON.stringify(res.body)).not.toContain("externalId"/"ingestedAt")`), siguiendo el patrón de los tests de `profile-links-preferences`.

## Fixtures / datos de test

- Crear vía **Prisma real de test** (sin llamar a Jooble), reutilizando `truncateTables` (ya incluye `"Job"`) en `beforeEach`.
- **1 oferta `INTERNAL`:** `source: "INTERNAL"`, `externalId: null`, `sourceUrl: null`, `ingestedAt: null`, `status: ACTIVE`.
- **1 oferta `JOOBLE`:** `source: "JOOBLE"`, `externalId: "ext-1"`, `sourceUrl: "https://jooble.org/jdp/ext-1"`, `ingestedAt: new Date()`, `status: ACTIVE`.
- Auth real con `registerUser` (patrón de los tests de jobs existentes).
- Para 6/7, contar/identificar por `source`; para 8, query param inválido.

## Fase RED

- **Archivo previsto:** `apps/api/src/jobs/jobs-visibility.integration.test.ts`.
- **Resultado esperado (RED):**
  - 1/2 fallan: la API devuelve el `Job` Prisma completo → `externalId`/`ingestedAt` presentes.
  - 6/7/8 fallan: `source` aún no existe como query param (`.strip()` lo descarta → no filtra; `INVALID` no produce 400).
  - 3/4/5 pueden "pasar" parcialmente porque hoy ya se exponen `source`/`sourceUrl` (al venir de Prisma) — se mantienen para fijar el contrato y validar en GREEN por la razón correcta.

## Fase GREEN

- **Archivos potenciales:**
  - `apps/api/src/jobs/jobs.serializer.ts` (nuevo): `serializeJob(job): JobPublicDto` con los 17 campos públicos.
  - `apps/api/src/jobs/jobs.router.ts`: aplicar `serializeJob` en list (`data.map(serializeJob)`) y en detail.
  - `apps/api/src/jobs/jobs.schemas.ts`: añadir `source: z.enum(["INTERNAL","JOOBLE"]).optional()` a `listJobsQuerySchema`.
  - `apps/api/src/jobs/jobs.service.ts`: `buildJobsWhere` → `if (source) where.source = source`.
- **Cambios esperados:**
  - Introducir `serializeJob` (DTO explícito) y usarlo en ambos endpoints.
  - Añadir filtro `source` manteniendo los filtros y la paginación actuales.
  - **No** tocar Prisma ni migraciones; el serializer solo transforma la salida.
- **Decisión de tipo:** `serializeJob(job: Job): JobPublicDto` devolviendo un objeto con campos explícitos (mismo patrón que `serializeProfile`/`serializeSkill` en `profile.router.ts`).

## Riesgos

- **Regresión de tests existentes:** `jobs-list`/`jobs-detail` aseveran campos concretos (no provenance) → el serializer que conserva esos campos no debería romperlos; **verificar** en GREEN que el detalle expone todos los campos que esos tests comprueban.
- **`jobs-provenance`:** usa Prisma directo (no la API) → no afectado por el serializer.
- **Filtro `source` y datos previos:** el seed marca internas como `INTERNAL`; al combinar con otros filtros, el `where` debe acumular sin clobber (igual que hoy).
- **Forma de la respuesta de listado:** mantener exactamente `{ data, total, page, limit }`; `data` cambia de `Job[]` a `JobPublicDto[]`.
- **`sourceUrl` null en internas:** el DTO debe incluir la clave con valor `null` (no omitirla) para un contrato estable.

## Fuera de alcance

- Saved Jobs (M04), Frontend, Matching (M05), Dashboard (M06).
- Prisma / migraciones / seed.
- Ingesta Jooble / cliente / script manual / cron/scheduler/n8n / llamadas reales.
- Deploy.

## Verificaciones esperadas

- `pnpm --filter @jobit/api test -- jobs-visibility` (nuevo).
- `pnpm --filter @jobit/api test -- jobs-list`.
- `pnpm --filter @jobit/api test -- jobs-detail`.
- `pnpm --filter @jobit/api test -- jobs-provenance`.
- `pnpm --filter @jobit/api typecheck`.
- `pnpm --filter @jobit/api build`.
- Suite completa API (`pnpm --filter @jobit/api test`) si es seguro, contra la DB de test (`localhost:5434`), sin reset ni seed destructivo.

## Secuencia de fases

1. **RED** — `jobs-visibility.integration.test.ts` (falla por Prisma completo + `source` inexistente). Commit RED.
2. **GREEN** — `serializeJob` + filtro `source`; tests en verde + no regresión. Commit GREEN.
3. **Audit + PR** hacia `dev` (sin merge).
