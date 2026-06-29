# Jobs API External Visibility Policy

## Estado

Propuesta — pendiente de revisión humana. Fija el contrato público de Jobs API antes de Sprint 04 (Saved Jobs). Relacionada con [Jobs (M03)](jobs.md), [External Jobs — Jooble](external-jobs-jooble.md), [ADR-0007](../../decisions/ADR-0007-api-design.md) y [ADR-0011](../../decisions/ADR-0011-jooble-external-jobs-integration.md).

## Objetivo

Definir el contrato público de visibilidad de Jobs API tras la integración de ofertas externas Jooble, evitando que la API pública dependa accidentalmente del modelo Prisma completo. La política establece qué campos de `Job` son públicos, cuáles son internos y cómo se filtran las ofertas por origen (`source`).

## Usuario afectado

- Candidato autenticado que consulta ofertas (`GET /api/jobs`, `GET /api/jobs/:id`).
- Futuro módulo Saved Jobs (M04), que podría embeber/reutilizar el contrato de `Job`.
- Frontend web de JobIT (cuando exista), que mostrará origen y atribución.
- Backend/API, como contrato estable desacoplado de la base de datos.

## Contexto

- Sprint 03 (Jobs) implementó listado y detalle (`GET /api/jobs`, `GET /api/jobs/:id`) con filtros, paginación y reglas `ACTIVE`/no expirada.
- Sprint 03.5 (Jooble) añadió provenance a `Job` (`source`, `externalId`, `sourceUrl`, `ingestedAt`), el cliente HTTP backend-only y el servicio de ingesta con upsert idempotente.
- `Job` tiene ahora campos internos de procedencia.
- Actualmente `GET /api/jobs` y `GET /api/jobs/:id` devuelven el **modelo Prisma `Job` completo** (sin serializer/DTO).
- Esto expone metadatos internos no deseados y acopla el contrato público al schema Prisma.

## Problema

- **Acoplamiento API ↔ Prisma:** sin DTO de salida, cualquier columna nueva del modelo `Job` (metadatos de ingesta, campos de sync futuros) se filtra automáticamente en la API pública.
- **Exposición accidental de campos internos:** hoy se devuelven `externalId` (id de la oferta en la fuente) e `ingestedAt` (metadato de ingesta), que no aportan valor al cliente y revelan detalles internos de la integración.
- **Riesgo para Saved Jobs:** si M04 devuelve el `Job` embebido, heredará el contrato implícito actual y propagará la fuga.
- **Internas vs externas sin política:** no existe forma de distinguir/filtrar por origen ni un acuerdo formal de qué campos de atribución (`source`, `sourceUrl`) son estables y públicos.

## Flujo principal

1. Usuario autenticado consulta `GET /api/jobs`.
2. La API valida y aplica filtros (incluido el nuevo `source` opcional).
3. La API serializa cada `Job` con el DTO público.
4. La API devuelve solo los campos públicos (paginados).
5. Usuario autenticado consulta `GET /api/jobs/:id`.
6. La API devuelve el mismo DTO público para una oferta (o `404` si no disponible).

## Modelo de datos afectado

No se cambia Prisma en este sprint.

Campos existentes relevantes de `Job`:

- `source` — enum `JobSource` (`INTERNAL` | `JOOBLE`).
- `externalId` — id de la oferta en la fuente externa (nullable).
- `sourceUrl` — URL canónica de la oferta en la fuente (nullable).
- `ingestedAt` — momento de ingesta/normalización (nullable).

Política de visibilidad:

| Campo | Política |
|---|---|
| `source` | **Público** |
| `sourceUrl` | **Público** |
| `externalId` | **Interno** (no exponer) |
| `ingestedAt` | **Interno** (no exponer) |

## Endpoints afectados

### GET /api/jobs

Mantiene:
- Autenticación requerida (`requireAuth`).
- Paginación (`page`, `limit`) y respuesta `{ data, total, page, limit }`.
- Filtros existentes (`q`, `remote`, `seniority`, `contractType`, `tags`).

Añade:
- Filtro opcional `source`.

Respuesta:
- `{ data, total, page, limit }` con `data[]` serializado mediante el **DTO público** (no entidades Prisma completas).

### GET /api/jobs/:id

Mantiene:
- Autenticación requerida.
- Validación del `:id` (forma UUID, patrón actual).
- Solo ofertas activas/visibles según la regla actual (`status = ACTIVE` y no expirada; en otro caso `404`).

Respuesta:
- **DTO público de `Job`**. No devolver la entidad Prisma completa.

## DTO público de Job

Debe incluir:

- `id`
- `title`
- `company`
- `location`
- `remoteType`
- `description`
- `requirements`
- `seniority`
- `contractType`
- `salaryMin`
- `salaryMax`
- `tags`
- `status`
- `postedAt`
- `expiresAt`
- `source`
- `sourceUrl`

No debe incluir:

- `externalId`
- `ingestedAt`

## Filtro source

Valores permitidos:
- `INTERNAL`
- `JOOBLE`

Reglas:
- Si `source` no se envía, listar todas las ofertas visibles (internas + externas).
- Si `source=INTERNAL`, listar solo internas.
- Si `source=JOOBLE`, listar solo externas Jooble.
- Un valor inválido devuelve error de validación coherente con el patrón actual (`400 VALIDATION_ERROR`).
- El filtro `source` es combinable con los filtros existentes.

## Pantallas

No hay cambios de frontend en este sprint.

Impacto futuro:
- El frontend podrá mostrar el origen/atribución de la oferta (`source`, `sourceUrl`).
- Saved Jobs (M04) deberá reutilizar el mismo DTO público al exponer ofertas embebidas.

## Reglas de negocio

- La API pública **nunca** debe devolver `externalId`.
- La API pública **nunca** debe devolver `ingestedAt`.
- `sourceUrl` representa únicamente el enlace/atribución a la fuente externa.
- Para ofertas internas, `sourceUrl` puede ser `null` (y `source = INTERNAL`).
- El contrato público **no** debe depender directamente de Prisma: se serializa mediante un DTO explícito.
- Saved Jobs deberá reutilizar este DTO cuando exponga `Job` embebido.

## Validaciones

- `source` opcional.
- `source` solo acepta `INTERNAL` o `JOOBLE`.
- Se mantienen las validaciones existentes de `q` (≤200), `remote`, `seniority`, `contractType`, `tags`, `page` (≥1), `limit` (1-100).

## Errores

- `source` inválido → `400 VALIDATION_ERROR` (patrón actual de Zod/`{ error: { code, message } }`).
- Oferta inexistente o no disponible en detalle → mantener `404 "Oferta no disponible"`.
- Usuario no autenticado → mantener `401 UNAUTHORIZED`.

## Criterios de aceptación

- [ ] Existe esta spec documental.
- [ ] Queda definido el DTO público de `Job`.
- [ ] Quedan definidos los campos internos no expuestos (`externalId`, `ingestedAt`).
- [ ] Queda definido el filtro `source` (`INTERNAL`/`JOOBLE`, opcional).
- [ ] Queda definido que list/detail **no** deben devolver la entidad Prisma completa.
- [ ] Queda definido el impacto sobre Sprint 04 Saved Jobs.
- [ ] No se implementa código en esta fase.

## Tests mínimos futuros

Para la fase técnica posterior:

- `GET /api/jobs` **no** devuelve `externalId`.
- `GET /api/jobs` **no** devuelve `ingestedAt`.
- `GET /api/jobs` devuelve `source`.
- `GET /api/jobs` devuelve `sourceUrl`.
- `GET /api/jobs/:id` aplica la misma política de visibilidad.
- `GET /api/jobs?source=INTERNAL` filtra internas.
- `GET /api/jobs?source=JOOBLE` filtra externas.
- `GET /api/jobs?source=INVALID` devuelve error de validación.
- No regresión de los filtros existentes (`q`, `remote`, `seniority`, `contractType`, `tags`).
- No regresión de la paginación.
- Saved Jobs deberá reutilizar este DTO en Sprint 04.

## Fuera de alcance

- Implementación técnica (serializer, filtro `source`).
- Tests.
- Frontend.
- Saved Jobs (M04).
- Prisma / migraciones.
- Ingesta Jooble / llamadas reales a Jooble / script manual.
- Cron / scheduler / n8n.
- Matching (M05) y Dashboard (M06).
- Deploy.

## Auditoría requerida

- [ ] Quality/security documental.
- [ ] Revisión humana del contrato público propuesto (campos públicos vs internos, filtro `source`).
- [ ] Coherencia con [ADR-0007](../../decisions/ADR-0007-api-design.md) (formato de respuesta/errores) y [ADR-0011](../../decisions/ADR-0011-jooble-external-jobs-integration.md) (provenance/atribución).
