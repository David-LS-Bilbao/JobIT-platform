# Spec: External Jobs — Integración Jooble (M03.5)

## Estado

Propuesta — pendiente de revisión humana. **Bloquea la implementación** hasta su aprobación.

Forma parte del Sprint 03.5. Relacionada con [Jobs (M03)](jobs.md), [Saved Jobs (M04)](saved-jobs.md), [ADR-0008](../../decisions/ADR-0008-database-orm-initial-model.md) y [ADR-0011](../../decisions/ADR-0011-jooble-external-jobs-integration.md).

## Contexto y justificación (por qué existe el Sprint 03.5)

La spec de [Jobs (M03)](jobs.md) declaró de forma explícita, para el MVP inicial, que *"No se integran APIs externas ni scrapers"* y situó *"Integración con APIs de empleo (Infojobs, LinkedIn, etc.)"* en **Fuera de alcance**. [ADR-0008](../../decisions/ADR-0008-database-orm-initial-model.md) reforzó esa asunción: *"El MVP es candidate-first… sin APIs de empleo externas"*.

Esta spec **contradice de forma explícita, controlada y acotada** esa exclusión, y deja constancia de ello. La razón: el catálogo seed/mock de M03 sirve para validar el módulo, pero no aporta volumen ni frescura real de ofertas; el valor candidate-first depende de que el candidato encuentre ofertas reales. Sprint 03.5 introduce **una única** fuente externa, **Jooble**, bajo condiciones estrictas (persistencia, normalización, trazabilidad, deduplicación, sin scraping, API key solo backend), sin alterar el resto del MVP.

La contradicción es deliberada y gobernada: **no** se deroga la regla general de "sin scraping ni fuentes no controladas"; se abre una **excepción controlada** para Jooble. La actualización formal de la decisión arquitectónica vive en [ADR-0011](../../decisions/ADR-0011-jooble-external-jobs-integration.md).

## Objetivo

Permitir que el candidato autenticado explore, junto a las ofertas internas/seed, **ofertas reales obtenidas de Jooble**, previamente **normalizadas y persistidas** en la base de datos, con **trazabilidad de origen** y **sin duplicados**, sin romper el listado existente de Jobs (M03) y sin llamar a Jooble en el request del candidato ni desde el frontend.

## Usuario afectado

Candidato tech autenticado que explora ofertas laborales. El candidato **no percibe** la mecánica de integración: ve un listado unificado de ofertas (internas + externas) con atribución de origen cuando la oferta es externa. No existen usuarios recruiter ni administradores de ofertas en este alcance.

## Flujo principal

La integración tiene dos planos separados: **ingesta** (server-side, asíncrona) y **lectura** (candidato).

### A. Ingesta (server-side, fuera del request del candidato)

1. Un proceso de backend controlado (**no** un endpoint del candidato), cuyo mecanismo concreto de disparo se decidirá en fase posterior, solicita ofertas a la API de Jooble usando la API key almacenada solo en backend.
2. El payload externo se **valida y normaliza** a un modelo interno (DTO de oferta).
3. Cada oferta normalizada se **persiste** con sus campos de trazabilidad (`source`, `externalId`, `sourceUrl`, `ingestedAt`).
4. La persistencia es **idempotente**: una oferta ya conocida (`source` + `externalId`) se actualiza en lugar de duplicarse (upsert).
5. Las ofertas inválidas se descartan y se registran sin abortar la ingesta completa.

### B. Lectura (candidato)

1. El candidato accede a la sección de Jobs.
2. El backend sirve el listado **solo desde datos ya persistidos** (internos + externos), aplicando las mismas reglas de visibilidad de M03.
3. El candidato filtra, pagina y consulta el detalle igual que en M03; las ofertas externas muestran su origen y un enlace a la fuente (`sourceUrl`).
4. En ningún momento la lectura del candidato dispara una llamada a Jooble.

## Flujos alternativos

- **Jooble no disponible / error de API durante la ingesta:** la ingesta falla de forma aislada y registra el error; el listado del candidato sigue sirviendo lo ya persistido (internas + externas previas). No se propaga el error al candidato.
- **Payload externo parcial o malformado:** la oferta concreta se descarta y se registra; el resto de la ingesta continúa.
- **API key ausente o inválida:** la ingesta no arranca; el listado interno/seed sigue funcionando con normalidad.
- **Oferta externa repetida entre páginas o re-ingestas:** se deduplica por `source` + `externalId` (no genera registros nuevos).

## Modelo de datos previsto

Se **extiende el modelo `Job` existente** (no se crea una tabla paralela) con campos de trazabilidad de origen. Esto mantiene unificado el listado de M03 y evita romperlo. Las ofertas internas/seed se marcan con `source = INTERNAL`. Es una **decisión pragmática de MVP**, no un diseño definitivo para futuras integraciones: nuevas fuentes o mayor complejidad podrán motivar un modelo separado mediante nueva spec/ADR.

> Nota: el modelo es **conceptual**. La migración Prisma real **no** forma parte de esta spec ni de la Fase 1; se realiza en una fase posterior (ver [brief del sprint](../../sprints/sprint-03-5-jooble-brief.md)).

### Campos añadidos a `Job`

| Campo | Tipo | Notas |
|---|---|---|
| source | enum | Origen de la oferta. `INTERNAL` (seed/mock) o `JOOBLE`. Por defecto `INTERNAL` para no romper datos previos |
| externalId | string \| null | Identificador de la oferta en la fuente externa. `null` para `INTERNAL`; requerido para `JOOBLE` |
| sourceUrl | string \| null | URL canónica de la oferta en la fuente (atribución y enlace de salida) |
| ingestedAt | datetime \| null | Momento de ingesta/normalización. `null` para datos no ingeridos |

### Constraint de deduplicación

| Constraint | Descripción |
|---|---|
| `Job.(source, externalId)` | Único compuesto cuando `externalId` no es nulo. Evita duplicar la misma oferta externa |

El resto de campos de `Job` (title, company, location, remoteType, description, requirements, seniority, contractType, salaryMin/Max, tags, status, postedAt, expiresAt) se reutilizan tal cual; la normalización mapea el payload de Jooble a estos campos con valores por defecto seguros cuando falten.

## Endpoints previstos

No se crean ni modifican endpoints en la Fase 1. La forma final prevista (fases posteriores) es:

| Método | Ruta | Cambio previsto |
|---|---|---|
| GET | /api/jobs | Sigue sirviendo el listado unificado (interno + externo) desde datos persistidos. Posible filtro opcional `source` |
| GET | /api/jobs/:id | Sin cambios funcionales; el detalle puede incluir `source` y `sourceUrl` si la oferta es externa |

- La **ingesta NO es un endpoint del candidato**: es un proceso server-side controlado, cuyo mecanismo de disparo se decidirá en fase posterior. No se expone ninguna ruta pública que llame a Jooble.
- Las rutas de lectura permanecen **privadas** (`requireAuth`), igual que en M03.

## Pantallas afectadas

El frontend (`apps/web/`) **no existe todavía** y queda fuera de alcance de este sprint. A efectos conceptuales, cuando exista, las pantallas de M03 (listado y detalle) mostrarán también ofertas externas con:

- Indicador de origen (`source`) cuando la oferta es externa.
- Enlace de salida a la oferta original (`sourceUrl`).

No se diseñan ni crean pantallas nuevas en M03.5.

## Reglas de negocio

- Solo se exponen al candidato ofertas **ya persistidas y normalizadas**. Nunca se llama a Jooble en el request del candidato ni desde el frontend.
- **No se hace scraping** de Jooble ni de ningún portal; solo se consume su API oficial.
- Toda oferta externa lleva trazabilidad completa: `source`, `externalId`, `sourceUrl`, `ingestedAt`.
- **Deduplicación obligatoria** por `source` + `externalId`; la re-ingesta es idempotente (upsert).
- Las ofertas externas **conviven** con las internas/seed sin romper el listado; se distinguen por `source`.
- Se mantienen las reglas de visibilidad de M03: solo `ACTIVE` y no expirada.
- La **API key de Jooble vive solo en backend**; nunca se expone al cliente ni se registra en logs.
- Se respetan los **rate limits** y los términos de uso de Jooble; la lectura del candidato no depende de la disponibilidad de Jooble.
- La integración es compatible con el MVP candidate-first: no introduce recruiter, ATS, monetización, IA avanzada ni matching inteligente.

## Validaciones

| Elemento | Regla |
|---|---|
| Payload externo | Validado (esquema) antes de persistir; registros que no cumplan el mínimo se descartan |
| Campos mínimos para persistir | `title`, `company`, `externalId`, `sourceUrl` presentes y no vacíos para `source = JOOBLE` |
| Enums normalizados | `remoteType`, `seniority`, `contractType` mapeados a los value-sets internos con fallback seguro |
| externalId | No vacío y único por `source` (constraint de dedup) |
| sourceUrl | Validada como URL absoluta |
| Texto/descripcion | Sanitizada; sin HTML crudo; longitudes acotadas |

## Errores

| Situación | Comportamiento esperado |
|---|---|
| Error de API externa (timeout, 4xx/5xx, rate limit) | Aislado en la ingesta; no afecta al listado del candidato; se sirve lo ya persistido |
| Payload de una oferta malformado | Se descarta esa oferta, se registra y la ingesta continúa |
| API key ausente/ inválida | La ingesta no arranca; el listado interno sigue operativo |
| Intento de duplicar oferta externa | Bloqueado por constraint `(source, externalId)`; se resuelve como upsert |

## Criterios de aceptación

> Aplican a la **feature completa** (fases posteriores), no a la Fase 1 documental.

- [ ] Las ofertas externas se muestran al candidato **solo** si están persistidas y normalizadas.
- [ ] Cada oferta externa tiene `source`, `externalId`, `sourceUrl` e `ingestedAt`.
- [ ] No existen duplicados de ofertas externas (dedup por `source` + `externalId`).
- [ ] El listado interno/seed de M03 **sigue funcionando** sin regresiones.
- [ ] Jooble **no** se llama desde el request del candidato ni desde el frontend.
- [ ] La API key de Jooble **no** aparece en respuestas de API ni en logs.
- [ ] Un error de la API de Jooble **no** rompe el endpoint de listado.

## Tests mínimos

> Aplican a fases posteriores; se enumeran aquí para fijar el contrato de pruebas.

- Normalizador: payload Jooble válido → DTO interno correcto.
- Normalizador: payload incompleto/ inválido → descartado sin romper la ingesta.
- Deduplicación: misma oferta (`source` + `externalId`) ingerida dos veces → un único registro (upsert).
- Listado: ofertas internas y externas conviven; filtro por `source` (si se implementa) devuelve lo esperado.
- No regresión: los tests de listado/detalle de M03 siguen en verde.
- Resiliencia: error de la API externa no rompe `GET /api/jobs`.
- Seguridad: la API key no aparece en la respuesta ni en logs.

## Fuera de alcance

- **Fase 1 (esta entrega):** cualquier código funcional. Solo documentación (esta spec, ADR-0011 y brief).
- Scraping de Jooble o de cualquier portal.
- Llamadas a Jooble desde el frontend o desde el request directo del candidato.
- Cliente HTTP, configuración de `JOOBLE_API_KEY`, migración Prisma, normalizador y servicio de ingesta (implementación posterior, fases 2-4 del brief).
- Cambios funcionales en `/api/jobs` y `/api/jobs/:id` en la Fase 1.
- Otras fuentes externas distintas de Jooble (Infojobs, LinkedIn, Adzuna, etc.).
- Recruiter, ATS, monetización, IA avanzada y matching inteligente.
- Aplicación directa a ofertas, alertas, UI y deploy.

## Riesgos conocidos y decisiones pendientes

> Estos puntos se **registran ahora** pero se **resuelven en fases posteriores** (2-4), no en la Fase 1 documental.

### Riesgos conocidos

- **Exposición o registro de `JOOBLE_API_KEY`:** la clave podría filtrarse al cliente o quedar en logs. Mitigación: vive solo en backend, nunca viaja al frontend ni se escribe en logs y nunca se commitea.
- **Rate limits / cuotas de Jooble:** un volumen excesivo de llamadas puede agotar la cuota, generar coste o provocar bloqueo. Mitigación: ingesta desacoplada del request del candidato, con control de volumen y backoff.
- **Datos externos incompletos o malformados:** el payload de Jooble puede traer campos ausentes o inconsistentes. Mitigación: validación y normalización, descartando y registrando los registros inválidos sin abortar la ingesta.
- **Duplicados:** la misma oferta puede repetirse entre páginas o re-ingestas. Mitigación: deduplicación por `(source, externalId)` con upsert idempotente.

### Decisiones pendientes

- **Mecanismo de ingesta:** script manual/controlado **vs** scheduler futuro. La Fase 1 no decide el disparo; se resolverá en fase posterior. Esta spec **no autoriza** scheduling en producción.
- **Índice único parcial:** en PostgreSQL una unique compuesta `(source, externalId)` no colisiona entre filas con `NULL`; cuando `externalId` sea nullable habrá que definir un índice único **parcial** (`WHERE externalId IS NOT NULL`). A cerrar en la fase de migración.
- **Defaults seguros de mapeo:** política de valores por defecto al normalizar campos incompletos de Jooble (`status`, `expiresAt`, `seniority`, `remoteType`, etc.). A definir junto al normalizador.

## Auditoría requerida

- [ ] Quality/security documental.
- [ ] Revisión humana de la contradicción controlada con M03/ADR-0008.
- [ ] Coherencia con [ADR-0011](../../decisions/ADR-0011-jooble-external-jobs-integration.md) y el [brief del sprint](../../sprints/sprint-03-5-jooble-brief.md).
