# Sprint 03.5 — Fase 3 — Provenance en Job: TDD Plan

> Documento de planificación (Fase 3A). **No** modifica Prisma, seed, código ni tests. La implementación corresponde a fases posteriores (3B en adelante).

## 1. Objetivo

Preparar la extensión del modelo `Job` con **provenance** (trazabilidad de origen) para que JobIT pueda persistir, en una única tabla, ofertas internas (seed) y externas (Jooble) con atribución de fuente y **deduplicación** idempotente, sin romper `GET /api/jobs` ni `GET /api/jobs/:id` (M03) y sin introducir cliente HTTP, red, endpoints ni uso de `JOOBLE_API_KEY`.

Alineado con [external-jobs-jooble.md](../specs/features/external-jobs-jooble.md) (modelo de datos previsto) y [ADR-0011](../decisions/ADR-0011-jooble-external-jobs-integration.md) (decisión 5–7: trazabilidad, dedup, modelo unificado).

## 2. Alcance (Fase 3 completa, a implementar en 3B+)

- Añadir enum `JobSource { INTERNAL, JOOBLE }`.
- Añadir a `Job`: `source` (default `INTERNAL`), `externalId`, `sourceUrl`, `ingestedAt`.
- Añadir `UNSPECIFIED` al enum `RemoteType` para admitir la salida del normalizador.
- Migración Prisma aditiva (`add_job_provenance`) con índice único parcial `(source, externalId)` para `externalId` no nulo.
- Marcar el seed interno como `source = INTERNAL` (explícito, además del default).
- Tests de modelo/dedup y no regresión.

## 3. Fuera de alcance

- Cliente HTTP de Jooble y llamadas reales a la red.
- Servicio de ingesta/upsert (Fase 4).
- Uso de `JOOBLE_API_KEY` o `.env` real.
- Scheduler, cron, n8n.
- Cambios funcionales en `/api/jobs` y `/api/jobs/:id` (más allá de que el objeto `Job` devuelto incluya los nuevos campos).
- Frontend, Saved Jobs (M04), Match (M05), Dashboard (M06).
- Otras fuentes externas distintas de Jooble.

## 4. Estado actual del modelo Job

`apps/api/prisma/schema.prisma` (post Sprint 03):

```prisma
enum RemoteType { REMOTE HYBRID ON_SITE }
enum JobSeniority { JUNIOR MID SENIOR ANY }
enum JobStatus { ACTIVE CLOSED }

model Job {
  id           String       @id @default(uuid())
  title        String
  company      String
  location     String?
  remoteType   RemoteType
  description  String
  requirements String[]
  seniority    JobSeniority
  contractType String
  salaryMin    Int?
  salaryMax    Int?
  tags         String[]
  status       JobStatus    @default(ACTIVE)
  postedAt     DateTime     @default(now())
  expiresAt    DateTime?
  @@index([status]) @@index([remoteType]) @@index([seniority]) @@index([contractType]) @@index([postedAt])
}
```

Observaciones relevantes:
- **No** existe ningún campo de provenance todavía.
- El seed ([seed.ts](../../apps/api/prisma/seed.ts)) crea 14 ofertas **sin** setear `source` (no existe).
- El servicio ([jobs.service.ts](../../apps/api/src/jobs/jobs.service.ts)) devuelve el objeto `Job` completo (sin serializer dedicado); al añadir columnas, estas **aparecerán** en la respuesta de `GET /api/jobs` y `/:id`.
- El DTO del normalizador ([jooble.types.ts](../../apps/api/src/jobs/external/jooble/jooble.types.ts)) ya emite la forma de provenance esperada: `source: "JOOBLE"`, `externalId`, `sourceUrl`, `ingestedAt`, `remoteType: "REMOTE"|"HYBRID"|"ON_SITE"|"UNSPECIFIED"`, `contractType: string`, `rawSource`.

## 5. Propuesta de campos de provenance en `Job`

| Campo | Tipo Prisma | Default | Notas |
|---|---|---|---|
| `source` | `JobSource` | `@default(INTERNAL)` | Origen de la oferta. Filas previas y seed → `INTERNAL`. |
| `externalId` | `String?` | — | Id de la oferta en la fuente. `null` para `INTERNAL`; requerido para `JOOBLE`. |
| `sourceUrl` | `String?` | — | URL canónica en la fuente (atribución / enlace de salida). |
| `ingestedAt` | `DateTime?` | — | Momento de ingesta/normalización. `null` para datos no ingeridos (internos). |

No se añade FK ni relación; provenance son columnas planas en `Job` (modelo unificado, ADR-0011 decisión 7).

## 6. Decisión propuesta — `source`: enum vs string

**Decisión: enum Prisma `JobSource { INTERNAL, JOOBLE }`.**
- Value-set cerrado y conocido; coherente con el estilo del proyecto (`RemoteType`, `JobStatus`, `JobSeniority`).
- ADR-0011 (dec. 5) y la spec lo definen como enum.
- Type-safety en cliente Prisma y en el normalizador (`JobSource = "JOOBLE"` ya existe en el DTO).
- Añadir una nueva fuente exigirá nueva spec/ADR + valor de enum (barrera deliberada anti scope-creep).

## 7. Decisión propuesta — `externalId` nullable

**Decisión: `externalId String?` (nullable).**
- `INTERNAL` no tiene id externo → `null`.
- `JOOBLE` requiere `externalId` no vacío (validado por el normalizador y por la ingesta de Fase 4; la DB no puede exigir "requerido solo si source=JOOBLE", se valida en capa de aplicación).
- La unicidad se aplica **solo** cuando no es nulo (ver §11).

## 8. Decisión propuesta — `sourceUrl` / `externalUrl`

**Decisión: usar `sourceUrl` (no `externalUrl`).** Un único campo `String?`.
- Coincide con el nombre del DTO (`NormalizedExternalJob.sourceUrl`), la spec y el ADR → evita un renombrado/mapeo innecesario.
- `null` para `INTERNAL`. Para `JOOBLE`, URL absoluta http(s) ya validada por el normalizador (`validateAbsoluteUrl`).
- No se añade un segundo campo `externalUrl`: sería duplicación sin caso de uso en el MVP.

## 9. Decisión propuesta — `ingestedAt` y `lastSyncedAt`

**Decisión: añadir solo `ingestedAt DateTime?`; NO añadir `lastSyncedAt` en esta fase.**
- La spec y el ADR definen únicamente `ingestedAt`; añadir `lastSyncedAt` sería scope creep no respaldado.
- Semántica acordada para el upsert idempotente (Fase 4): `ingestedAt` registra el momento de ingesta y **se actualiza en cada re-ingesta** (refleja, de facto, el último sync). Si en el futuro se necesita distinguir "primera ingesta" de "último sync", se añadirá `lastSyncedAt` mediante nueva fase/migración aditiva.
- `ingestedAt` es `null` para datos internos/seed (no ingeridos).

## 10. Estrategia para `remoteType = UNSPECIFIED`

El normalizador puede emitir `UNSPECIFIED` cuando no hay evidencia de modalidad (no asume `ON_SITE`). El enum Prisma `RemoteType` actual no lo contempla.

**Decisión: añadir `UNSPECIFIED` al enum `RemoteType` (`REMOTE HYBRID ON_SITE UNSPECIFIED`).**
- Evita inventar una modalidad falsa al persistir ofertas externas.
- **El filtro `remote` de `GET /api/jobs` sigue aceptando solo `REMOTE`/`HYBRID`/`ON_SITE`** (no se añade `UNSPECIFIED` al `z.enum` del query): una oferta `UNSPECIFIED` aparece en el listado sin filtro pero no se filtra por modalidad. No requiere tocar `jobs.schemas.ts` en Fase 3 (el enum de query es independiente del enum Prisma).
- Añadir un valor a un enum Postgres es una migración **aditiva** segura (no reescribe filas).
- Alternativa descartada: mapear `UNSPECIFIED → ON_SITE`/otro fallback en la ingesta → falsearía el dato; contradice el diseño conservador del normalizador.

## 11. Estrategia de seed `INTERNAL`

**Decisión: un único valor `INTERNAL` (no se crea `INTERNAL_SEED`).**
- La spec/ADR usan `INTERNAL`; un valor extra `INTERNAL_SEED` añadiría complejidad sin valor (todo el catálogo interno actual es seed).
- Con `@default(INTERNAL)`, las filas existentes y futuras del seed quedan `INTERNAL` automáticamente; `externalId`, `sourceUrl`, `ingestedAt` quedan `null`.
- En 3B el seed se actualizará para setear **explícitamente** `source: "INTERNAL"` (claridad y test determinista), aunque el default ya lo cubra.

## 12. Estrategia de deduplicación

- Clave lógica de dedup: **`(source, externalId)`** (ADR-0011 dec. 6).
- Re-ingesta idempotente mediante **upsert** por esa clave (implementación en Fase 4).
- En Fase 3 solo se crea la **constraint** que la soporta (ver §13); la lógica de upsert no entra aquí.

## 13. Límites de Prisma e índice único parcial

- Prisma **no** permite expresar un índice único **parcial** (`WHERE`) en el schema: `@@unique([source, externalId])` genera una unique normal sin cláusula `WHERE`.
- En PostgreSQL, una unique normal sobre `(source, externalId)` con `externalId` nullable usa por defecto **NULLS DISTINCT**, por lo que **permitiría múltiples filas `INTERNAL` con `externalId = NULL`** (no colisionan) y, a la vez, bloquearía duplicados `JOOBLE` con el mismo `externalId`. Funcionalmente podría bastar.
- **Decisión propuesta:** ser explícitos y robustos con un **índice único parcial** `CREATE UNIQUE INDEX "Job_source_externalId_key" ON "Job" ("source", "externalId") WHERE "externalId" IS NOT NULL;`, porque:
  - documenta la intención ("solo dedup cuando hay id externo"),
  - es inmune a configuraciones de `NULLS [NOT] DISTINCT`,
  - no penaliza las filas internas con `externalId` nulo.
- **Cómo, dado el límite de Prisma:** generar la migración con `prisma migrate dev --name add_job_provenance` y **editar el SQL** de esa migración para sustituir/añadir el índice parcial (Prisma respeta el SQL de migración escrito a mano). Documentar el ajuste en el propio archivo de migración. (Alternativa A, más simple: dejar `@@unique([source, externalId])` nativo y aceptar la semántica NULLS DISTINCT; se documenta como opción pero se prefiere el índice parcial.)

## 14. Estrategia de migración

- Nombre: `add_job_provenance`.
- Cambios (aditivos, no destructivos):
  1. `CREATE TYPE "JobSource" AS ENUM ('INTERNAL', 'JOOBLE');`
  2. `ALTER TYPE "RemoteType" ADD VALUE 'UNSPECIFIED';`
  3. `ALTER TABLE "Job" ADD COLUMN "source" "JobSource" NOT NULL DEFAULT 'INTERNAL';`
  4. `ADD COLUMN "externalId" TEXT;` · `ADD COLUMN "sourceUrl" TEXT;` · `ADD COLUMN "ingestedAt" TIMESTAMP(3);`
  5. Índice único parcial sobre `(source, externalId)` (ver §13).
  6. Opcional: `@@index([source])` para el posible filtro `source` futuro.
- Datos previos: las filas existentes adoptan `source = INTERNAL` por el default; el resto de columnas quedan `NULL`. Sin pérdida de datos.
- Nota de entorno: solo está disponible la DB de test (`jobit_test`, `localhost:5434`); la migración se generará/aplicará allí con `migrate dev` y se validará con `migrate deploy` (no hay DB dev en 5432).
- Atención a `ALTER TYPE ... ADD VALUE`: en PostgreSQL no puede ejecutarse dentro de algunas transacciones junto con su uso inmediato; Prisma lo gestiona en su propia migración. Verificar en 3B que la migración aplica limpia.

## 15. Estrategia de tests

Todos sin red, sin `JOOBLE_API_KEY`, sin cliente HTTP; fixtures Prisma directos.

1. **No regresión M03:** `jobs-list.integration.test.ts` (10) y `jobs-detail.integration.test.ts` (6) siguen verdes tras añadir columnas. Verificar que el objeto `Job` devuelto con los nuevos campos no rompe asserts existentes.
2. **Seed interno marcado:** tras el seed, todas las filas tienen `source = "INTERNAL"`, `externalId = null`, `ingestedAt = null`.
3. **Persistencia JOOBLE:** se puede crear vía Prisma una fila `source = "JOOBLE"` con `externalId`, `sourceUrl`, `ingestedAt` y `remoteType` (incluido `UNSPECIFIED`).
4. **Deduplicación:** insertar dos filas `JOOBLE` con el mismo `externalId` → la segunda **falla** por la constraint (o se resuelve como upsert cuando exista la lógica de Fase 4); dos filas `INTERNAL` con `externalId = null` **conviven** sin colisión.
5. **`GET /api/jobs` no se rompe:** listado sigue devolviendo solo `ACTIVE`/no expiradas; (si se añade el filtro `source`, se testea en su fase).
6. **`GET /api/jobs/:id` no se rompe:** el detalle de una oferta activa sigue devolviendo `200`; puede incluir `source`/`sourceUrl`.
7. **Sin uso de API key:** ningún test lee `JOOBLE_API_KEY` ni `.env`.
8. **Sin llamadas reales a Jooble:** ningún test abre red; provenance se prueba con datos creados directamente en la DB de test.
9. `truncateTables` ya incluye `"Job"`; no requiere cambios para estos tests (provenance vive en la misma tabla).

`pnpm --filter @jobit/api test`, `typecheck` y `build` deben quedar verdes; `migrate deploy` sin drift.

## 16. Riesgos

- **Prisma sin unique parcial:** requiere SQL manual en la migración (§13); riesgo de divergencia schema/DB si no se refleja bien. Mitigar verificando con `migrate deploy` y `prisma validate`.
- **`ALTER TYPE ADD VALUE` (RemoteType):** posibles restricciones transaccionales en Postgres; verificar que la migración aplica limpia en 3B.
- **Exposición de campos nuevos:** el servicio devuelve `Job` completo → `source`, `externalId`, `sourceUrl`, `ingestedAt` aparecerán en las respuestas. Es aceptable (la spec contempla mostrar `source`/`sourceUrl`), pero conviene confirmar que no rompe tests y decidir en fase de lectura si conviene un serializer. No hay PII en `Job`.
- **Filtro `remote` y `UNSPECIFIED`:** mantener el `z.enum` del query con solo 3 valores; no exponer `UNSPECIFIED` como filtro para no confundir.
- **Solo DB de test disponible:** la migración se valida en `jobit_test`; cuando exista DB dev habrá que aplicarla allí también.
- **Datos previos:** cubiertos por `@default(INTERNAL)`; sin backfill manual necesario.

## 17. Criterios de aceptación (Fase 3 implementada, 3B+)

- `schema.prisma` incluye `JobSource`, los 4 campos de provenance en `Job` y `UNSPECIFIED` en `RemoteType`.
- Migración `add_job_provenance` aditiva, con índice único parcial `(source, externalId)` para `externalId` no nulo; aplica sin reset ni pérdida de datos.
- El seed marca las ofertas como `source = INTERNAL`.
- Se puede persistir una oferta `JOOBLE` con provenance completa; la dedup bloquea duplicados externos y permite múltiples internos con `externalId` nulo.
- `GET /api/jobs` y `GET /api/jobs/:id` siguen verdes (sin regresiones).
- `typecheck` y `build` verdes; sin uso de `JOOBLE_API_KEY` ni red en tests.

## 18. Fases siguientes recomendadas

- **Fase 3B — Implementación provenance:** editar `schema.prisma`, generar/ajustar migración `add_job_provenance` (índice parcial SQL), actualizar `seed.ts` con `source: "INTERNAL"`, añadir tests de modelo/dedup y de no regresión. Commits pequeños (schema+migración, seed, tests).
- **Fase 4 — Cliente HTTP + servicio de ingesta:** cliente Jooble con `JOOBLE_API_KEY` (mockeado en tests), servicio que normaliza (`normalizeJoobleJob`) y hace **upsert** por `(source, externalId)`; resiliencia ante errores de API; sin exponer la key. Mecanismo de disparo (script controlado) a decidir; sin cron/n8n.
- **Fase 5 (opcional) — Lectura:** filtro `source` en `GET /api/jobs` y exposición de `source`/`sourceUrl` en el detalle, con serializer si procede.
```
