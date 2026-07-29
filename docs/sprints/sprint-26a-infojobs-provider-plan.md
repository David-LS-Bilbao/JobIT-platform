# Sprint 26A — InfoJobs Provider Plan

## Objetivo

Definir una implementación **incremental, segura y aprobable por el orquestador** para
incorporar InfoJobs como cuarta fuente externa de ofertas (`INTERNAL`, `JOOBLE`,
`GREENHOUSE`, futura `INFOJOBS`), sin romper el patrón de arquitectura rector:

> fuentes externas → ingesta controlada → base de datos JobIT → búsqueda local → enlace oficial externo

Este documento **no implementa nada**. Define gates técnicos pequeños, revisables y con
Definition of Done propia, condicionados en su totalidad a un **Gate 0 legal/partner** que
este documento tampoco resuelve — ver
[`infojobs-external-jobs.md`](../specs/features/infojobs-external-jobs.md) para el diseño
funcional y el detalle del bloqueo vigente
([`job-sources-aggregation.md`](../specs/features/job-sources-aggregation.md),
[ADR-0011](../decisions/ADR-0011-jooble-external-jobs-integration.md), hallazgo `JOBS-10` en
[`sprint-22-production-readiness-real-data-audit-report.md`](sprint-22-production-readiness-real-data-audit-report.md)).

## Principios de implementación

- **SDD antes de código**: cada gate nace de la spec aprobada o de este plan, no de código
  improvisado.
- **Gates pequeños y revisables**: cada uno es, en su momento, una rama y una PR
  independiente.
- **Gate 0 es bloqueante y no técnico**: ningún gate posterior se ejecuta sin su cierre.
- **No scraping**, en ningún gate.
- **No live search** contra InfoJobs por cada búsqueda del candidato — siempre ingesta
  controlada a BD, búsqueda local.
- **Ingesta controlada**, manual, backend-only, sin endpoint público.
- **Secretos fuera del repo**: solo en `.env` local (gitignored) o variables de entorno del
  despliegue; nunca impresos en logs ni mensajes de error.
- **Tests con fixtures/mocks**, nunca contra red real ni con credenciales reales.
- **Mismo patrón de archivos que Jooble/Greenhouse**: `client.ts`, `schemas.ts`,
  `normalizer.ts`, `ingest.service.ts`, `types.ts`, `__fixtures__/`, `*.test.ts`.
- **No `Co-Authored-By`** en ningún commit.
- **No merge sin revisión humana.**

## Estado actual confirmado (baseline de este plan)

- `apps/api/prisma/schema.prisma` → `enum JobSource { INTERNAL, JOOBLE, ADZUNA, GREENHOUSE }`.
  `INFOJOBS` no existe.
- `apps/api/src/jobs/jobs.schemas.ts` → `JOB_SOURCES = ["INTERNAL", "JOOBLE", "GREENHOUSE"]`.
  `ADZUNA` existe en el enum Prisma pero **no** en este filtro público — precedente directo
  de "enum-only, no expuesto" que este plan replica para `INFOJOBS`.
- `apps/api/src/config/env.ts` → configuración de Jooble (`JOOBLE_API_KEY`,
  `JOOBLE_API_BASE_URL`) y Greenhouse (`GREENHOUSE_API_BASE_URL`). Nada de InfoJobs.
- `apps/api/src/jobs/external/{jooble,greenhouse}/` → patrón de 5 piezas + fixtures + tests
  ya validado dos veces.
- `apps/api/src/jobs/scripts/` → scripts de ingesta manual (`ingest-jooble.ts`,
  `ingest-jooble-locations.ts`, `ingest-greenhouse.ts`), todos con el mismo patrón: abortan
  antes de red si falta configuración, logging sin secretos, `process.exit` explícito.
- `apps/web/src/types/api.ts` → `type JobSource = "INTERNAL" | "JOOBLE" | "GREENHOUSE"`
  (unión cerrada; tampoco incluye `ADZUNA`). `JOB_SOURCE_LABELS` es un `Record` sobre esa
  unión, consumido en `job-detail-page.tsx` y `job-card.tsx`.
- `apps/api/prisma/migrations/` → `20260703122811_add_adzuna_job_source` y
  `20260703151137_add_greenhouse_job_source` muestran el patrón exacto de migración
  aditiva a replicar: una sola línea `ALTER TYPE "JobSource" ADD VALUE '<FUENTE>';`.

## Sprint 26B — Gates técnicos

Cada gate solo se abre tras cerrar el anterior. Ninguno se ejecuta como parte de Sprint 26A.

### Gate 0 — Legal / Partner (bloqueante, no técnico)

**Objetivo:** decidir si InfoJobs puede activarse, no cómo.

**Alcance:**
- Leer el ToS completo y vigente de InfoJobs (no solo la overview técnica ya revisada en
  Sprint 16/22).
- Confirmar el estado real de aprobación de app/partner ante InfoJobs.
- Redactar y aprobar un nuevo ADR (recomendado `ADR-0013`, próximo número libre; mismo
  patrón que ADR-0011) que registre la decisión de forma explícita, acotada y revisable.
- Actualizar `job-sources-aggregation.md` (fila `INFOJOBS`) de "bloqueado" al estado que
  corresponda, **solo si** este gate se cierra en positivo.

**Fuera de alcance:** cualquier código, migración o cambio de configuración.

**Archivos permitidos:** `docs/decisions/ADR-0013-*.md` (nuevo); actualización puntual de
`docs/specs/features/job-sources-aggregation.md`.

**Criterios de aceptación:** ADR aprobado por el orquestador; ToS confirmado compatible o
riesgo aceptado explícitamente por el orquestador; sin este gate, **ningún** gate posterior
puede abrirse.

**Riesgo principal:** que el ToS final no resulte compatible con las reglas de producto ya
fijadas (mismo criterio de aborto ya usado para Adzuna en
`sprint-16-job-sources-product-rules-and-ranking.md`) — en ese caso, InfoJobs permanece
bloqueada indefinidamente y este plan no continúa.

### Gate 1 — Prisma minimal (migración)

**Objetivo:** añadir el valor de enum, nada más.

**Alcance:**
```sql
-- AlterEnum
ALTER TYPE "JobSource" ADD VALUE 'INFOJOBS';
```
Mismo formato exacto que `20260703122811_add_adzuna_job_source` y
`20260703151137_add_greenhouse_job_source`. Ningún otro cambio de `schema.prisma`.

**Fuera de alcance:** `salaryCurrency`, `applyUrl`, `publishedAt` u otros campos nuevos
(mismas razones ya fijadas en `job-sources-aggregation.md` para no añadirlos sin necesidad
concreta).

**Archivos permitidos:** `apps/api/prisma/schema.prisma`,
`apps/api/prisma/migrations/<ts>_add_infojobs_job_source/migration.sql`.

**Archivos prohibidos:** `jobs.schemas.ts`, `apps/web/**`.

**Tests/verificaciones:** `pnpm --filter @jobit/api exec prisma generate`; `pnpm --filter
@jobit/api typecheck`; `pnpm --filter @jobit/api test` (suite completa de `jobs`, sin
regresiones); revisar si existe algún test que itere el enum `JobSource` completo y
actualizarlo si corresponde.

**Riesgos:** bajo, técnicamente — `ADD VALUE` es aditivo y ya se usó dos veces sin
incidentes. El riesgo real es de categoría (Prisma/migraciones = Nivel 3), no de
complejidad.

### Gate 2 — Configuración (`env.ts` + placeholders)

**Objetivo:** preparar la configuración backend sin secretos reales.

**Alcance:**
- `INFOJOBS_CLIENT_ID`, `INFOJOBS_CLIENT_SECRET` (secretos; `optionalString`; nunca
  logueados; nunca expuestos al cliente).
- `INFOJOBS_API_BASE_URL` (no necesariamente secreto) con un `parseInfoJobsBaseUrl`
  fail-fast, mismo patrón exacto que `parseJoobleBaseUrl`/`parseGreenhouseBaseUrl`
  (default si falta, error explícito si la URL no es `http:`/`https:` válida).
- Placeholders **sin valores reales** en `apps/api/.env.example` y `.env.staging.example`
  (raíz), mismo estilo/comentarios que las secciones existentes de Jooble/Greenhouse.

**Nota de diseño (pendiente de confirmar, no decidida):** el nombre y forma de estas tres
variables sigue lo pedido en el prompt de este sprint. La forma exacta del flujo de
autenticación que `client.ts` deberá implementar en Gate 3 **no está confirmada todavía** —
ver Gate 3 y la sección "Riesgos legales y credenciales" de la spec.

**Archivos permitidos:** `apps/api/src/config/env.ts`, `apps/api/.env.example`,
`.env.staging.example` (raíz).

**Tests/verificaciones:** unitarios de `parseInfoJobsBaseUrl` (default, error fail-fast,
normalización sin barra final) — mismo patrón que los tests ya existentes para Jooble/Greenhouse
si los hubiera, o análogos a los del propio `env.ts`.

**Riesgos:** ninguno más allá de los ya cubiertos por el patrón existente; el único riesgo
real es introducir una variable que luego no coincida con el flujo de auth confirmado en
Gate 0/Gate 3.

### Gate 3 — Provider (`client → schemas → normalizer → ingest.service`)

**Objetivo:** implementar el adaptador de InfoJobs siguiendo el patrón ya validado.

**Alcance:**
- `apps/api/src/jobs/external/infojobs/infojobs.types.ts`
- `apps/api/src/jobs/external/infojobs/infojobs.schemas.ts` (zod, sobre la forma real del
  payload de InfoJobs confirmada en Gate 0)
- `apps/api/src/jobs/external/infojobs/infojobs.client.ts` — **el flujo de autenticación
  concreto que este archivo implemente debe seguir la documentación oficial vigente de
  InfoJobs confirmada en Gate 0, no una suposición de este plan.** La matriz de discovery
  (`sprint-16-job-sources-discovery-matrix.md`) describe el acceso como *"Registro app +
  OAuth"*, lo que **sugiere, sin confirmar**, un posible intercambio de credenciales de
  aplicación por un token antes de poder consultar ofertas — esto es una **hipótesis a
  verificar en Gate 0/Gate 3**, no una decisión cerrada. Si se confirma, el cliente
  necesitará su propio manejo de errores de autenticación (p. ej. una clase de error
  dedicada), análogo a `JoobleConfigError`/`GreenhouseConfigError` pero para el paso de
  autenticación adicional; si no se confirma ese flujo, el cliente se diseñará según lo que
  la documentación oficial realmente especifique.
- `apps/api/src/jobs/external/infojobs/infojobs.normalizer.ts` — mapea al contrato
  `ExternalJob`; recomendación de `descriptionSnippet` (ver spec) en vez de descripción
  completa.
- `apps/api/src/jobs/external/infojobs/infojobs.ingest.service.ts` — upsert idempotente por
  `(source, externalId)`, mismo patrón exacto que `jooble.ingest.service.ts`.
- `apps/api/src/jobs/external/infojobs/__fixtures__/*.json` — basadas en la forma
  documentada oficial (confirmada en Gate 0), nunca en llamadas reales con credenciales
  reales.

**Fuera de alcance:** cualquier llamada real a InfoJobs; cualquier credencial real.

**Archivos permitidos:** los listados arriba, bajo `apps/api/src/jobs/external/infojobs/`.

**Archivos prohibidos:** cualquier archivo de `external/jooble/` o `external/greenhouse/`
salvo lectura de referencia; `jobs.schemas.ts`; `apps/web/**`.

**Tests/verificaciones:** mismo nivel que Jooble/Greenhouse — client (config ausente sin
llamar a red; éxito con fetch inyectado; error HTTP; timeout; payload inválido; credencial
nunca aparece en un mensaje de error), schemas (contrato zod), normalizer (payload
válido/parcial/inválido; inferencia conservadora de `remoteType`; URL absoluta obligatoria),
ingest.service (persistencia con provenance; idempotencia; nunca filtra credenciales;
`truncateTables` en integración). `pnpm --filter @jobit/api typecheck`; `pnpm --filter
@jobit/api test`; `pnpm --filter @jobit/api build`.

**Riesgos:** que la forma real del payload/autenticación de InfoJobs difiera de lo asumido
al diseñar `schemas.ts`/`client.ts` — mitigado al no cerrar este gate hasta confirmar contra
documentación oficial vigente en Gate 0.

### Gate 4 — Script de ingesta manual

**Objetivo:** disparo manual, backend-only, sin endpoint público.

**Alcance:** `apps/api/src/jobs/scripts/ingest-infojobs.ts`, mismo patrón que
`ingest-jooble.ts`: comprueba configuración antes de cualquier llamada de red y aborta con
`process.exit(1)` si falta, sin exponer secretos; reutiliza `ING_KEYWORDS`/`ING_LOCATION`/
`ING_LIMIT`; logging de resumen sin secretos ni URLs con credenciales.

**Archivos permitidos:** `apps/api/src/jobs/scripts/ingest-infojobs.ts` (+ variante
multi-ubicación análoga a `jooble-locations.ts` **solo si** se justifica, no por defecto).

**Tests/verificaciones:** si se añade lógica pura extraíble (parseo de ubicaciones, límites),
tests unitarios mismo patrón que `jooble-locations.test.ts`. Sin llamadas reales.

**Riesgos:** ninguno adicional a los ya cubiertos por el patrón Jooble.

### Gate 5 — Filtro público (`jobs.schemas.ts`) — diferido

**Objetivo:** decidir, en su momento, si InfoJobs se expone como valor filtrable en
`GET /api/jobs?source=`.

**Alcance:** añadir `"INFOJOBS"` a `JOB_SOURCES` en `apps/api/src/jobs/jobs.schemas.ts`,
**solo** cuando se decida exponerlo públicamente — mismo punto en el que hoy `ADZUNA`
permanece sin exponerse pese a existir en el enum Prisma.

**No forma parte de los gates 1-4.** Puede quedar abierto indefinidamente sin bloquear el
resto del provider.

### Gate 6 — Frontend (`apps/web`) — diferido

**Objetivo:** evitar que una fuente sin label rompa el render de "Fuente" en card/detalle.

**Alcance:** añadir `"INFOJOBS"` a `type JobSource` (`apps/web/src/types/api.ts`), entrada
en `JOB_SOURCE_LABELS` y en `externalSourceCtaLabel` (`apps/web/src/features/jobs/jobs-format.ts`).

**Condición de cierre obligatoria:** debe completarse **antes** de que exista cualquier fila
real `source = INFOJOBS` visible en cualquier entorno, incluida staging/demo — porque
`JOB_SOURCE_LABELS[job.source]` es un `Record` sobre una unión de tipos hoy cerrada, y una
fuente sin entrada se serializaría igual desde el backend (`jobs.serializer.ts` no filtra
`source`) pero rompería el render en frontend (`undefined`).

**Por qué no entra en el baseline de Sprint 26B (respuesta a la restricción de no tocar
frontend salvo justificación):** mismo precedente que `ADZUNA`, que hoy tampoco está en la
unión de tipos del frontend pese a llevar meses en el enum Prisma. Mientras Gate 5 no se
abra, ninguna oferta `INFOJOBS` puede llegar al candidato, así que no hay ninguna urgencia
funcional de tocar `apps/web/**` en los gates 1-4.

### Gate 7 — Verificación completa

**Objetivo:** cerrar el ciclo con evidencia verde.

**Tests/verificaciones:** `pnpm --filter @jobit/api exec prisma generate`; `pnpm --filter
@jobit/api typecheck`; `pnpm --filter @jobit/api test`; `pnpm --filter @jobit/api build`;
suite completa de `jobs`/`jooble`/`greenhouse` sin regresiones; `git diff --check`; `git
status --short`. Si Gate 6 se cerró: `pnpm --filter @jobit/web typecheck`, `test`, `lint`,
`build`.

## Archivos permitidos / prohibidos (resumen transversal)

| Gate | Permitido | Prohibido hasta ese gate |
|---|---|---|
| 0 | `docs/decisions/ADR-0013-*.md`, actualización puntual de `job-sources-aggregation.md` | Cualquier código, config o migración |
| 1 | `schema.prisma`, nueva migración | `jobs.schemas.ts`, `apps/web/**` |
| 2 | `env.ts`, `.env.example`, `.env.staging.example` | Valores reales de credenciales |
| 3 | `apps/api/src/jobs/external/infojobs/**` | `external/jooble/**`, `external/greenhouse/**` (salvo lectura), `jobs.schemas.ts`, `apps/web/**` |
| 4 | `apps/api/src/jobs/scripts/ingest-infojobs.ts` (+ tests) | Cualquier endpoint nuevo, cualquier cron |
| 5 | `jobs.schemas.ts` (`JOB_SOURCES`) | — |
| 6 | `apps/web/src/types/api.ts`, `jobs-format.ts` | — |
| Todos | — | Credenciales reales, llamadas reales, `Co-Authored-By`, commit/push/PR sin autorización separada |

## Tests mínimos (consolidado)

- Client InfoJobs: config ausente → aborta sin llamar a red; éxito con fetch inyectado;
  error HTTP; timeout; payload inválido; ninguna credencial aparece en un mensaje de error.
- Schemas: contrato zod validado contra fixtures basadas en documentación oficial
  confirmada en Gate 0.
- Normalizer: mapeo válido; parcial → defaults seguros; campo requerido ausente → excepción
  de normalización; `remoteType` conservador; URL absoluta obligatoria.
- Ingest service: persistencia con provenance; idempotencia `(source, externalId)`; nunca
  filtra credenciales; usa `truncateTables`.
- No regresión: suite completa de `jobs`/`jooble`/`greenhouse` sigue en verde.
- La API pública sigue sin exponer `externalId` ni `ingestedAt` para ninguna fuente.
- (Gate 6, si se cierra) Label de InfoJobs presente y correcto en los tests de
  `jobs-format.test.ts`.

## Riesgos por gate

| Gate | Riesgo principal |
|---|---|
| 0 | ToS final no compatible; aprobación de partner denegada o indefinida |
| 1 | Ninguno significativo más allá de la categoría (Prisma = Nivel 3 por defecto) |
| 2 | Nombrar variables que no encajen con el flujo de auth real confirmado en Gate 0 |
| 3 | Forma real del payload/autenticación distinta de lo asumido al diseñar `schemas.ts`/`client.ts` |
| 4 | Ninguno adicional al ya cubierto por el patrón Jooble |
| 5 | Exponer una fuente antes de que su calidad de datos esté validada |
| 6 | Desincronización entre backend y frontend si Gate 5/6 no se secuencian correctamente |

## Definition of Done (por gate)

- [ ] Gate 0: ADR aprobado por el orquestador; ToS confirmado compatible o riesgo aceptado
      explícitamente.
- [ ] Gate 1: migración aditiva única, revisada; tests/typecheck/build en verde.
- [ ] Gate 2: variables documentadas en `.env.example`/`.env.staging.example` sin valores
      reales; parser fail-fast con tests.
- [ ] Gate 3: cinco piezas (`types`, `schemas`, `client`, `normalizer`, `ingest.service`) +
      fixtures + tests, sin red real, sin credenciales reales.
- [ ] Gate 4: script backend-only, aborta sin config, sin secretos en logs.
- [ ] Gate 5: filtro público añadido solo tras decisión explícita de exponer InfoJobs.
- [ ] Gate 6: frontend actualizado antes de cualquier fila real visible.
- [ ] Gate 7: `typecheck`/`test`/`build` en verde para los paquetes tocados; `git diff
      --check` limpio; informe final de sprint.

## Fuera de alcance global

- Levantar el bloqueo legal/partner de InfoJobs fuera de Gate 0.
- OAuth de usuario / login de candidato contra InfoJobs.
- Inscripción o candidatura dentro de JobIT.
- Importación de CVs, candidaturas o datos privados de InfoJobs.
- Scraping, bajo cualquier circunstancia.
- Búsqueda live contra InfoJobs por request de candidato.
- Cron productivo / orquestación automática de ingesta.
- n8n o cualquier automatización externa.
- Recruiter/ATS completo, monetización, aplicación móvil, IA para evaluar personas.

## Recomendación para el orquestador

- **Sprint 26A** (este documento + la spec) puede cerrarse como sprint documental en cuanto
  exista el informe final del agente.
- **Siguiente paso recomendado: Gate 0**, íntegramente legal/de producto — no requiere
  agente de desarrollo escribiendo código, sino una decisión del orquestador (lectura de ToS,
  confirmación de partner, aprobación de un nuevo ADR).
- **Ningún gate técnico (1-7) debe abrirse antes de que Gate 0 esté cerrado**, con
  independencia de la disponibilidad de tiempo o de agente.
- Si Gate 0 se bloquea de forma indefinida, InfoJobs permanece en el mismo estado que hoy:
  diseñada, documentada, no implementada — sin coste de mantenimiento porque no existe
  código.

## Documentos revisados

`docs/specs/features/infojobs-external-jobs.md`,
`docs/specs/features/job-sources-aggregation.md`,
`docs/specs/features/external-jobs-jooble.md`,
`docs/decisions/ADR-0011-jooble-external-jobs-integration.md`,
`docs/architecture/03-job-sources-and-search.md`,
`docs/sprints/sprint-16-job-sources-implementation-plan.md`,
`docs/sprints/sprint-16-job-sources-discovery-matrix.md`,
`docs/sprints/sprint-22-production-readiness-real-data-audit-report.md`,
`apps/api/prisma/schema.prisma`, `apps/api/src/config/env.ts`,
`apps/api/src/jobs/jobs.schemas.ts`, `apps/api/src/jobs/jobs.serializer.ts`,
`apps/api/src/jobs/external/jooble/**`, `apps/api/src/jobs/external/greenhouse/**`,
`apps/api/src/jobs/scripts/**`, `apps/web/src/types/api.ts`,
`apps/web/src/features/jobs/jobs-format.ts`.
