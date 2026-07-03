# Informe final operador — Sprint 16F Greenhouse ATS curated source

## Sprint o tarea

Sprint 16F — Greenhouse ATS curated source (segunda fuente externa real de JobIT, tras Jooble).

## Objetivo inicial

Implementar **Greenhouse** como fuente ATS pública y curada, siguiendo el patrón ya validado con
Jooble (client → normalizer → ingest.service → script manual), **sin secretos** y **sin llamadas
reales por defecto**. Pivot desde Sprint 16D (Adzuna en HOLD por gate legal/ToS) hacia la fuente que
la matriz de Sprint 16 calificó como **riesgo legal Bajo** (Job Board API pensada para que job
boards ingieran las ofertas públicas de la propia empresa). Arquitectura rectora intacta:

```txt
fuentes externas → ingesta controlada → base de datos JobIT → búsqueda local → enlace oficial externo
```

## Estado inicial

- Ruta WSL correcta: `/home/david/projects/JobIT-platform` (clon nativo; no OneDrive).
- `dev` actualizado (`git pull --ff-only`, ya al día en `06b740f`, merge PR #66 / Sprint 16C).
- Working tree limpio antes de crear rama; sin repos anidados.
- Rama creada: `feat/sprint-16f-greenhouse-provider`, desde `dev`.
- Base de datos local: contenedor `jobit-postgres-test` (`:5434`), bases `jobit_dev` y `jobit_test`.
- Enum inicial: `JobSource { INTERNAL, JOOBLE, ADZUNA }` (GREENHOUSE aún no existía).

## Trabajo realizado

1. Revisión de la documentación oficial de Greenhouse Job Board API y del patrón Jooble en código.
2. Migración aditiva del enum `JobSource` con `GREENHOUSE`.
3. Provider Greenhouse completo (`client`, `normalizer`, `ingest.service`, `schemas`, `types`,
   `companies`) bajo `apps/api/src/jobs/external/greenhouse/`.
4. Fixtures (valid/empty/invalid) y tests unitarios/integración sin red real.
5. Script de ingesta manual backend-only (`scripts/ingest-greenhouse.ts`).
6. Config/env (`GREENHOUSE_API_BASE_URL`) y placeholders en `.env.example` (sin secretos).
7. `GREENHOUSE` añadido al filtro público `JOB_SOURCES` + test de visibilidad.
8. Verificaciones completas y redacción de este informe.

## Migración enum GREENHOUSE

`apps/api/prisma/migrations/20260703151137_add_greenhouse_job_source/migration.sql`:

```sql
-- AlterEnum
ALTER TYPE "JobSource" ADD VALUE 'GREENHOUSE';
```

Único cambio en `schema.prisma`: `GREENHOUSE` en `enum JobSource` (1 línea). Migración **aditiva**,
segura y no bloqueante en PostgreSQL (mismo tipo que la de ADZUNA en 16C). **No** se tocó el modelo
`Job`, `SavedJob`, índices ni constraints. La unicidad `(source, externalId)` (índice único parcial
global) ya cubre GREENHOUSE sin cambios. Aplicada contra `jobit_dev` (`in sync`), Prisma Client
regenerado.

## Provider Greenhouse

Bajo `apps/api/src/jobs/external/greenhouse/`, replicando el patrón Jooble:

- **`greenhouse.client.ts`** — `fetchGreenhouseBoardJobs(boardToken, deps)`; `GET
  {baseUrl}/{board_token}/jobs?content=true`; endpoint **público sin auth**; `fetchFn`/`baseUrl`/
  `timeoutMs` inyectados por `deps` (no lee `process.env`); `AbortController` para timeout; zod valida
  la forma; errores tipados (`GreenhouseClientError/ConfigError/HttpError/TimeoutError/ResponseError`).
- **`greenhouse.normalizer.ts`** — función **pura** `normalizeGreenhouseJob(job, { company,
  ingestedAt })`. `company` se **inyecta** (el job de Greenhouse no la trae). Limpia `content` (HTML
  **entity-encoded**): decodifica entidades → quita tags → colapsa espacios, **sin dependencias
  nuevas**. Valida `absolute_url` http/https; infiere `remoteType` conservador (HYBRID>REMOTE>ON_SITE>
  UNSPECIFIED); `postedAt` desde `updated_at` con fallback; `tags` desde departments/offices (dedup).
  Descarta (lanza `GreenhouseNormalizationError`) si falta `id`/`title`/`absolute_url`/`company`.
- **`greenhouse.ingest.service.ts`** — `ingestGreenhouseBoards(companies, deps)`; recorre boards **en
  serie** con **fallo parcial tolerado** (un board que falla se cuenta en `boardsFailed` y no detiene
  al resto); **upsert idempotente por `(source=GREENHOUSE, externalId)`** (find→update / create con
  reintento ante `P2002`); cap opcional `limitPerBoard`. Resumen `{ boardsProcessed, boardsFailed,
  fetched, normalized, skipped, created, updated }`.
- **`greenhouse.schemas.ts`** — zod del payload crudo (`jobs[]` + `meta`); `id` acepta number/string
  y se entrega como string; `location`/`content` → null si faltan; `departments`/`offices` → [].
- **`greenhouse.types.ts`** — contrato crudo + `NormalizedExternalJob` autónomo (no importa Prisma;
  `salaryMin/Max` siempre null; incluye `tags`).

## Lista curada de empresas

`apps/api/src/jobs/external/greenhouse/greenhouse.companies.ts`:

- Interfaz `GreenhouseCompany { boardToken; company }` y `GREENHOUSE_COMPANIES` (array tipado).
- **Vacío por defecto**: no se inventan empresas. La selección concreta de empleadores tech (ES/remoto)
  que usan Greenhouse es una **decisión de producto**, a rellenar y revisar en PR. Los board tokens son
  públicos (no secretos), por eso viven **versionados en código**, no en `.env`.
- Helper puro `selectGreenhouseCompanies(all, tokensCsv)` para restringir a un subconjunto vía
  `ING_GREENHOUSE_TOKENS`.

## Fixtures y tests

Fixtures (`__fixtures__/`, sin datos sensibles ni empresas reales): `greenhouse-board.valid.json`
(2 jobs: uno remoto y otro híbrido, con HTML entity-encoded + departments/offices),
`greenhouse-board.empty.json`, `greenhouse-board.invalid.json`.

Tests (sin red real):
- **client** (9): request con `content=true`, respuesta válida/vacía, HTTP 404, HTTP 429, timeout,
  schema inválido, base URL por defecto y con barra final.
- **normalizer** (11): mapeo válido con company inyectada, decode+strip de HTML, `remoteType`
  REMOTE/UNSPECIFIED, location opcional, fallback de fecha, descartes (id/title/url/company), dedup de
  tags.
- **ingest.service** (6, Prisma de test): persistencia GREENHOUSE, upsert idempotente, skip por
  normalización inválida, varios boards en serie, **fallo parcial tolerado**, cap `limitPerBoard`.
- **visibility** (+1): `GET /api/jobs?source=GREENHOUSE` aceptado y sin exponer `externalId`/`ingestedAt`.

## Script de ingesta

`apps/api/src/jobs/scripts/ingest-greenhouse.ts` — backend-only, MANUAL (no expone endpoint, no se
invoca desde requests). Lee `GREENHOUSE_COMPANIES` (filtrable por `ING_GREENHOUSE_TOKENS`), cap
`ING_LIMIT` (1..100), usa `GREENHOUSE_API_BASE_URL`. Si la lista curada resultante está vacía, **aborta
sin llamar a Greenhouse** (exit 1). Imprime un resumen **sin datos sensibles** (no hay secretos).

## Filtro público source=GREENHOUSE

`jobs.schemas.ts`: `JOB_SOURCES = ["INTERNAL", "JOOBLE", "GREENHOUSE"]` (una entrada añadida). El
serializer público ya era fuente-agnóstico (expone `source`/`sourceUrl`, oculta `externalId`/
`ingestedAt`), sin cambios. **No se tocó frontend** (la UI ya no tiene selector de fuente desde 15E).

## Archivos modificados

- **Modificados (5)**: `apps/api/prisma/schema.prisma`, `apps/api/src/config/env.ts`,
  `apps/api/.env.example`, `apps/api/src/jobs/jobs.schemas.ts`,
  `apps/api/src/jobs/jobs-visibility.integration.test.ts`.
- **Nuevos (13)**: la migración `20260703151137_add_greenhouse_job_source/migration.sql`; los 8
  módulos + 3 fixtures de `external/greenhouse/`; y `scripts/ingest-greenhouse.ts`.
- Regenerado (no versionado): Prisma Client.

## Tests y verificaciones

Ejecutadas en el clon WSL, todas en verde:

- `pnpm --filter @jobit/api typecheck` → **OK**.
- `pnpm --filter @jobit/api test` → **OK — 40 archivos, 378 tests** (351 previos + 27 nuevos, sin
  regresiones en Jooble/INTERNAL).
- `pnpm --filter @jobit/api build` → **OK**.
- `pnpm --filter @jobit/api exec prisma validate` → **OK**.
- `pnpm --filter @jobit/api exec prisma migrate dev` → **OK** (migración aplicada, client regenerado).
- `git diff --check` → **OK**; alcance = exactamente los archivos permitidos (ningún prohibido).
- Auditoría: **sin secretos**, **sin fuga de la API key de Jooble**, **sin `Co-Authored-By`**,
  `apps/api/.env` real **intacto**.

## Decisiones técnicas

- **`company` desde lista curada**: el job de Greenhouse no incluye empresa; se inyecta por board
  (`board_token → company`) desde un archivo versionado. Nunca se inventa.
- **`content` HTML entity-encoded**: decode conservador (entidades nombradas + numéricas, `&amp;` al
  final) + strip de tags, sin añadir dependencias. Se guarda la descripción completa limpia.
- **Sin salario**: Greenhouse no lo da → `salaryMin/Max = null`; esto **esquiva `salaryCurrency`**
  (sigue diferido, sin nueva migración).
- **`remoteType` conservador** (default `UNSPECIFIED`) y **`contractType = "unspecified"`** (no hay
  campo estándar).
- **ATS por `board_token`, no búsqueda global**: solo boards curados; ingesta en serie con fallo
  parcial tolerado; `limitPerBoard` opcional.
- **Migración aditiva agrupada** (Opción B): `ADD VALUE` es seguro; se evita una PR extra 16F.1.
- **API pública intacta**: mismo `serializeJob`/`JobPublicDto`.

## Problemas encontrados

- **`exactOptionalPropertyTypes`** rechazó pasar `{ limitPerBoard: undefined }` al ingest → se pasa la
  clave solo cuando está definida.
- **Mocks `vi.fn` sin parámetros tipados** hacían `mock.calls[0]` una tupla vacía → se tiparon los
  parámetros (`_url`, `_init`), igual que en los tests de Jooble.
- Los **diagnósticos del IDE** ("no se encuentra dotenv/zod/@prisma/client/process") eran **falsos
  positivos**: el TS server de VS Code no resuelve los `node_modules` de WSL a través de la ruta UNC;
  el `tsc` real dentro de WSL pasa sin errores.

## Pendiente

- Aprobación del orquestador y **cierre Git** (commit + push + PR a `dev`), pendiente de instrucción
  explícita.
- **ToS/atribución de Greenhouse**: la doc de la API no detalla texto explícito de términos →
  **PENDIENTE** (no bloquea el diseño; riesgo bajo por ser careers pública de cada empresa). Confirmar
  antes de producción. Atribución UI ("company" + "vía Greenhouse" + enlace `absolute_url`) sería un
  cambio de **frontend posterior**.
- **Curar la lista real de empleadores** en `greenhouse.companies.ts` (decisión de producto). Hoy vacía
  → el script no ingiere nada por defecto (comportamiento seguro).
- **Smoke real opcional** contra un board público, solo con autorización explícita del operador.

## Recomendación para el orquestador

- **Sprint 16F: PASS.** Segunda fuente externa (Greenhouse) implementada con el patrón Jooble, ATS
  público curado, **sin secretos** y **sin llamadas reales**; migración aditiva GREENHOUSE aplicada;
  upsert idempotente por `(source, externalId)`; `source=GREENHOUSE` filtrable; API pública intacta;
  378 tests en verde; sin tocar frontend ni Jooble/Adzuna; sin dependencias nuevas.
- **Siguiente sprint recomendado**: (a) curar lista + smoke real Greenhouse con autorización, o (b)
  **Sprint 16G — staging/demo data bootstrap**, o (c) una fuente remota simple (Jobicy / We Work
  Remotely) con el mismo patrón.

## Prompt sugerido para continuar

```
PROMPT PARA CLAUDE — Cierre Git Sprint 16F (Greenhouse ATS curated source)

Objetivo:
Cerrar en Git el Sprint 16F ya implementado y verificado en la rama
feat/sprint-16f-greenhouse-provider (sin re-implementar nada).

Precondiciones:
- Ruta WSL /home/david/projects/JobIT-platform.
- Rama feat/sprint-16f-greenhouse-provider con los cambios de 16F.
- No añadir Co-Authored-By. No tocar código fuera de lo ya hecho.

Tareas:
1. git status/diff para confirmar el alcance (5 modificados + 13 nuevos).
2. Commit con mensaje feat(jobs): add greenhouse ats provider (sin Co-Authored-By).
3. push de la rama.
4. Abrir PR a dev con resumen, alcance y "Not included" (sin merge por CLI).
5. Reportar número de PR y estado de checks.

Restricciones:
No merge por CLI. No secretos. No frontend. No Adzuna real. No dependencias.
```
