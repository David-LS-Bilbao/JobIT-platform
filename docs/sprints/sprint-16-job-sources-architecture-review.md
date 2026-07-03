# Sprint 16 — Job Sources Architecture Review

## Objetivo

Validar si la arquitectura y el modelo de datos actuales de JobIT permiten evolucionar de
**una** fuente externa (Jooble) a **múltiples** fuentes sin romper el patrón de ingesta
controlada:

> fuentes externas → ingesta controlada → base de datos JobIT → búsqueda local → enlace oficial externo

Es una **revisión documental**: no modifica Prisma, no crea migraciones ni toca código
funcional. Complementa `docs/sprints/sprint-16-job-sources-discovery-matrix.md`.

**Conclusión adelantada:** el modelo actual **sí soporta un MVP multi-fuente** con **cambios
mínimos** (ampliar `enum JobSource`, garantizar unicidad `(source, externalId)`, promover el
contrato normalizado ya existente a uno compartido). El resto son mejoras diferibles; hay que
evitar sobreingeniería.

## Estado actual

- **Modelo `Job`** (Prisma): `id, title, company, location?, remoteType, description, requirements[],
  seniority, contractType, salaryMin?, salaryMax?, tags[], status(@default ACTIVE), postedAt(@default now),
  expiresAt?` + provenance `source(@default INTERNAL), externalId?, sourceUrl?, ingestedAt?`;
  relación `savedBy SavedJob[]`. Índices: status, remoteType, seniority, contractType, postedAt, **source**.
  **No** hay `applyUrl`, `publishedAt`, `salaryCurrency`, `rawSourcePayload` ni `updatedAt`.
- **Enums:** `JobSource { INTERNAL, JOOBLE }`, `RemoteType { REMOTE, HYBRID, ON_SITE, UNSPECIFIED }`,
  `JobSeniority { JUNIOR, MID, SENIOR, ANY }`, `JobStatus { ACTIVE, CLOSED }`.
- **Unicidad/dedupe:** el servicio de ingesta hace upsert por `(source, externalId)` (protegido por
  índice único parcial; reintenta ante `P2002`). No hay dedupe entre fuentes distintas.
- **Contrato normalizado ya existente:** `NormalizedExternalJob` (jooble.types.ts): `source, externalId,
  sourceUrl, ingestedAt, title, company, location, description(=snippet HTML-stripped), salaryMin,
  salaryMax, remoteType(inferido), contractType, postedAt(=updated|fallback), rawSource`. Al persistir
  (`toJobData`) se fija `requirements: [], seniority: "ANY", tags: [], status: "ACTIVE"` y se **descarta**
  `rawSource` (no hay columna). No hay `currency` ni `applyUrl` ni `expiresAt` en la ingesta Jooble.
- **Serialización pública** (`serializeJob`/`JobPublicDto`): expone `source` y `sourceUrl`; **oculta**
  `externalId`/`ingestedAt`. Cubierto por tests de visibility/provenance. **Ya es multi-fuente-ready.**
- **Servicios jobs:** `listJobs` (filtros `q, location, remote, seniority, contractType, source, tags` +
  paginación; solo ACTIVE y no expiradas) y `getActiveJobById`. No hay llamadas live a fuentes.
- **Scripts Jooble (3):** `apps/api/scripts/ingest-jooble.ts` (Sprint 03.5, CLI `--flags`, **fuera de
  `src/` → no entra en typecheck/build**) + `apps/api/src/jobs/scripts/ingest-jooble.ts` (15F, env `ING_*`)
  + `.../ingest-jooble-locations.ts` (15G, multi-ubicación). Los tres llaman al mismo `ingestJoobleJobs`.
- **Frontend:** `/jobs`, `/jobs/[id]`, `/saved-jobs`, `/match` ya muestran `Fuente: JobIT/Jooble` y el
  CTA externo seguro (`sourceUrl`, `target=_blank`+`rel=noopener`), con aviso honesto para seed sin URL.

## Evaluación del modelo actual (campo por campo)

| Campo | Existe | ¿Sirve multi-fuente? | Riesgo | Recomendación |
|---|---|---|---|---|
| `source` | ✅ enum | ⚠️ solo INTERNAL/JOOBLE | Cada fuente nueva = migración | Ampliar enum de forma deliberada (versionada) al añadir cada fuente |
| `externalId` | ✅ | ✅ (dedupe intra-fuente) | Debe ser único por fuente | Garantizar **unique `(source, externalId)`** global, no solo para JOOBLE |
| `sourceUrl` | ✅ | ✅ (enlace al origen) | Algunas fuentes separan listing/apply | Mantener como "ver oferta oficial" |
| `applyUrl` | ✗ | — | Sin él, algunas fuentes pierden el enlace de apply | **Opcional** `applyUrl?` (diferible; MVP usa `sourceUrl`) |
| `postedAt` | ✅ (@default now) | ⚠️ hoy = `updated` externo o fallback | Semántica mezclada (externo vs interno) | Definir: `postedAt` = **fecha externa best-effort**; documentarlo |
| `publishedAt` | ✗ | — | Duplicar con `postedAt` sería redundante | **No añadir** en MVP (evitar sobreingeniería); `postedAt` cumple |
| `expiresAt` | ✅ | ✅ (WWR trae `expires_at`) | Jooble no lo rellena hoy | Poblar cuando la fuente lo dé; base de la política de expiración |
| `ingestedAt` | ✅ | ✅ (auditoría) | No hay `updatedAt` | Considerar `@updatedAt` para auditar re-ingestas (menor) |
| `company` | ✅ | ✅ | — | OK |
| `location` | ✅ | ✅ | Formatos/sinónimos heterogéneos (deuda 15G) | Normalización mínima futura (Vizcaya/Bizkaia) |
| `remoteType` | ✅ enum | ✅ (inferido por fuente) | Inferencia imperfecta | OK; mapear por fuente en su normalizer |
| `salaryMin/Max` | ✅ Int? | ⚠️ sin `currency` | Adzuna/Himalayas traen divisa; hoy se asume € | **`salaryCurrency?`** recomendado pronto (correctitud multi-país) |
| `tags`/`requirements` | ✅ String[] | ⚠️ hoy vacíos en externas | Match por skills se resiente | Poblar cuando la fuente aporte skills/tags |
| `rawSourcePayload` | ✗ | — | Guardar raw = tamaño + posible ToS/privacidad | **No guardar** raw en MVP (por defecto); si hiciera falta debug, fuera de la fila pública |
| `status` | ✅ enum | ✅ ACTIVE/CLOSED | — | Usar CLOSED + `expiresAt` en vez de borrado físico |

## Cambios de modelo propuestos (sin implementar)

**Mínimos (necesarios para MVP multi-fuente):**
- **Ampliar `enum JobSource`** con cada fuente nueva (p. ej. `ADZUNA`), en migración versionada, con spec.
- **Unique `(source, externalId)`** general para todas las fuentes externas (no solo JOOBLE).
- **Frontend:** una entrada por fuente en `JOB_SOURCE_LABELS` y copy del CTA (p. ej. "Abrir en Adzuna").

**Recomendados pronto (según primera fuente):**
- **`salaryCurrency String?`** si la primera fuente (Adzuna) devuelve divisa distinta de €.
- Poblar `expiresAt` y `tags` cuando la fuente los proporcione.

**Diferibles (no MVP; evitar sobreingeniería):**
- `applyUrl?` separado de `sourceUrl` (solo si una fuente lo exige claramente: Workable/ATS).
- `publishedAt` distinto de `postedAt` (redundante hoy).
- `rawSourcePayload` / `sourceMetadata` (por defecto **no**; coste/tamaño/ToS). Si acaso, un JSON
  opcional privado y acotado, nunca en `JobPublicDto`.
- `@updatedAt` (auditoría fina).

**Índices/constraints recomendados:** mantener índice en `source`; añadir la **unique `(source, externalId)`**;
opcional índice en `expiresAt` si la limpieza por expiración se vuelve frecuente. Nada más por ahora.

## Provider Registry propuesto (conceptual)

El patrón por-fuente **ya existe** (Jooble): `client` (HTTP/parseo + config inyectada) → `normalizer`
(→ contrato normalizado) → `ingest.service` (upsert idempotente). Multi-fuente = **repetir el patrón**
más un **registro fino** que asocie cada `JobSource` con su ingesta y su config, para que scripts/
orquestación iteren proveedores sin `if` por fuente.

Estructura por fuente (ejemplo conceptual, **no crear ahora**):

```
apps/api/src/jobs/external/<source>/
├── client.ts            # HTTP/RSS + validación de forma; config (key, baseUrl) por deps/env
├── normalizer.ts        # payload crudo → ExternalJob (contrato normalizado)
├── ingest.service.ts    # upsert idempotente por (source, externalId)
├── schemas.ts           # validación de la respuesta cruda (zod)
├── types.ts             # tipos crudos + ExternalJob si son propios
├── __fixtures__/        # respuestas de ejemplo (sin red en tests)
└── *.test.ts            # client/normalizer/ingest
```

Registro conceptual (idea, no diseño final): `providers: Record<JobSource, { ingest, envConfig, limits }>`.
**MVP:** introducirlo **cuando aterrice la 2ª fuente**, no antes (YAGNI). Config y límites por fuente vía
env (patrón `JOOBLE_API_KEY`/`JOOBLE_API_BASE_URL` de 15F): `<SOURCE>_API_KEY`, `<SOURCE>_API_BASE_URL`.

## Contrato normalizado `ExternalJob` (propuesto)

Promover `NormalizedExternalJob` (hoy específico de Jooble) a un contrato **compartido** que cada
normalizer produzca. Obligatorios (O) / opcionales (o):

| Campo | O/o | Nota |
|---|---|---|
| `externalId` | O | identidad fuerte por fuente |
| `source` | O | valor de `JobSource` |
| `title` | O | |
| `company` | O | |
| `location` | o | null si no aplica/remota |
| `remoteType` | O | mapeado/inferido por fuente (default UNSPECIFIED) |
| `descriptionSnippet` | o | resumen (Jooble solo da snippet) |
| `description` | o | completa si la fuente/ToS lo permite |
| `requirements`/`tags` | o | skills cuando existan |
| `salaryMin` / `salaryMax` | o | |
| `currency` | o | necesario si min/max no son € |
| `contractType` | o | string libre normalizado ("unspecified" si falta) |
| `seniority` | o | mapear a `JobSeniority` si la fuente lo da; si no, ANY |
| `publishedAt` | o | fecha externa; alimenta `postedAt` |
| `expiresAt` | o | si la fuente lo aporta |
| `sourceUrl` | O | enlace al detalle/origen (http/https validado) |
| `applyUrl` | o | solo si la fuente separa apply |
| `attribution` | o | texto/flag de atribución requerida por la fuente |
| `raw` | o | **no** persistir por defecto; útil solo en tests/debug efímero |

Reglas: `sourceUrl`/`applyUrl` validadas http/https; descartar registros sin `externalId`/`title`/
`sourceUrl` (como ya hace el normalizer de Jooble, que lanza y el servicio descarta = `skipped`).

## Dedupe multi-fuente

Estrategia **incremental** (evitar fusiones agresivas):
1. **MVP:** dedupe solo por **`(source, externalId)`** (ya existe). La misma oferta desde dos fuentes
   coexiste como dos filas con distinta `source`/`sourceUrl` — aceptable en v1.
2. **Opcional posterior:** heurística por `title + company + location` normalizados para **marcar**
   (no fusionar) posibles duplicados; nunca fusionar automáticamente en MVP.
3. Conservar siempre el `sourceUrl`/`applyUrl` original de cada fuente.
4. **Nunca** borrar datos de usuario: `SavedJob` referencia `Job`; el dedupe/limpieza no debe romper
   guardadas.

## Expiración y actualización

- `expiresAt` cuando la fuente lo proporcione; `GET /api/jobs` ya excluye expiradas.
- **Cierre por ausencia** (posterior): si una oferta externa desaparece de N ingestas consecutivas,
  marcar `status = CLOSED` (no borrar). Requiere marca temporal de "visto por última vez".
- Preferir **CLOSED** frente a **delete físico** (preserva `SavedJob` e historial).
- `ingestedAt` (+ posible `@updatedAt`) como auditoría de re-ingesta (el upsert ya actualiza).

## Source URL vs Apply URL

- **MVP:** `sourceUrl` es suficiente → botón único **"Ver oferta oficial"** (ya implementado en 15E),
  el candidato se inscribe en el origen. **No** se aplica desde JobIT.
- **`applyUrl`** solo si una fuente distingue claramente listing vs. apply (Workable/ATS). Diferible;
  si se añade, es opcional y el frontend elegiría apply cuando exista, si no `sourceUrl`.
- Mantener **siempre** un enlace externo visible y la **fuente** visible.

## Privacidad y legal/ToS

- **No scraping**; solo APIs/feeds oficiales.
- **No guardar secretos** en repo; keys por entorno; **nunca imprimir** la API key (patrón 15F ya lo cumple).
- **No almacenar** datos no permitidos por la fuente (p. ej. descripciones completas si el ToS solo
  permite snippet; datos personales). Por defecto **no** persistir `raw`.
- **Atribución visible** siempre (fuente + enlace).
- Respetar snippet vs. descripción completa **según cada fuente** (Remotive/Jobicy restringen redistribución).
- **No LinkedIn/Indeed/Randstad** sin acuerdo formal (ver matriz).
- **No llamadas live** por búsqueda de candidato (siempre ingesta → DB local).

## Housekeeping Jooble

Situación: **3 scripts** con interfaces distintas:
- `apps/api/scripts/ingest-jooble.ts` (03.5): CLI `--keywords/--location/--page/--limit`; **fuera de
  `src/`** → **no** pasa por `typecheck`/`build` (brecha de calidad); llama a `ingestJoobleJobs`.
- `apps/api/src/jobs/scripts/ingest-jooble.ts` (15F): env `ING_*`, dentro de `src/` (typechecked).
- `apps/api/src/jobs/scripts/ingest-jooble-locations.ts` (15G): env `ING_*`, multi-ubicación.

**Decisión recomendada:** mantener como **oficiales** los de `src/jobs/scripts/` (typechecked,
documentados, env-based, coherentes con 15F/15G) y **retirar/deprecar** el antiguo
`apps/api/scripts/ingest-jooble.ts` en una **fase 16A separada** (es un cambio de código → **no** en
esta fase documental). Documentar la decisión antes de añadir nuevas fuentes para no propagar el patrón
"fuera de src/".

## Impacto en frontend (sin implementar)

- Añadir **etiqueta de fuente** por cada nueva `source` (`JOB_SOURCE_LABELS`) y copy del CTA
  ("Abrir en <Fuente>" / genérico "Ver oferta oficial").
- Mantener la distinción **seed/ejemplo (INTERNAL sin URL) vs. oferta real** (aviso honesto ya existe).
- Mostrar fecha de publicación (`postedAt`) — ya se muestra en el detalle.
- **No** mostrar campos prohibidos por ToS (p. ej. descripción completa donde no se permita).
- Cambios esperados: **pequeños** (labels + copy), sin nueva ruta ni módulo.

## Plan de migración recomendado

1. **Documentación y reglas** (matriz + esta review) — *hecho en Fase 2/3*.
2. **Housekeeping Jooble** (fase 16A): consolidar scripts; retirar el de fuera de `src/`.
3. **Ampliar `enum JobSource`** (+ unique `(source, externalId)`, + `salaryCurrency?` si aplica) —
   migración Prisma versionada con spec.
4. **Promover contrato `ExternalJob` compartido** + **registro fino** de proveedores.
5. **Primera fuente nueva** (Adzuna, tras confirmar ToS): `external/adzuna/**` siguiendo el patrón.
6. **Tests** (client/normalizer/ingest + fixtures, sin red) y verificaciones.
7. **Datos staging/demo** (ingesta controlada por script; no commitear datos).

## Riesgos

- **Migración Prisma** (enum/constraints) — versionada, con backup/plan; posible impacto en datos.
- **Compatibilidad con datos existentes** (Jooble/seed) — la unique `(source, externalId)` debe respetar lo actual.
- **Dedupe imperfecto** — no fusionar agresivo; aceptar duplicados cross-source en v1.
- **Rate limits / ToS por fuente** — ingesta en serie/programada, respetar límites y atribución.
- **Expiración incorrecta** — no cerrar/borrar de más; proteger `SavedJob`.
- **Descripción no permitida** — snippet vs. completa según ToS.
- **Ruptura de tests existentes** — cambios de enum/serializer podrían tocar tests de jobs; ejecutar suite.
- **Complejidad innecesaria** — no construir provider registry pesado ni campos raw hasta que haga falta.

## Decisión recomendada

- **El modelo actual soporta un MVP multi-fuente** manteniendo el patrón de ingesta controlada. La
  serialización pública y el flujo Jobs/Match ya son fuente-agnósticos.
- **Cambios mínimos necesarios:** ampliar `enum JobSource`; unique `(source, externalId)` global;
  labels de fuente en frontend; (y `salaryCurrency?` si la 1ª fuente lo requiere).
- **Deben esperar:** `applyUrl`, `publishedAt`, `rawSourcePayload`, dedupe cross-source, provider
  registry formal, `@updatedAt`.
- **Primera fase técnica recomendada:** **16A — Housekeeping Jooble** (consolidar scripts) seguida de
  la migración mínima de `JobSource` + contrato `ExternalJob` compartido; después, **Adzuna** como
  primera fuente nueva (con ToS confirmado).
