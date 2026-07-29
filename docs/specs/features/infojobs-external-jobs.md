# Spec: External Jobs — Integración InfoJobs (Sprint 26)

## Estado

Propuesta — **bloqueada** hasta aprobación legal/partner y confirmación de ToS. **No
autoriza implementación** por sí misma.

Esta spec es la "nueva spec/ADR" que [ADR-0011](../../decisions/ADR-0011-jooble-external-jobs-integration.md)
exige para cualquier fuente distinta de Jooble — es decir, **condición necesaria, pero no
suficiente**. ADR-0011 autoriza explícitamente solo Jooble y descarta como scope creep
*"Múltiples fuentes desde el inicio (Infojobs, LinkedIn, Adzuna…)"*. Además,
[`job-sources-aggregation.md`](job-sources-aggregation.md) clasifica InfoJobs, hoy, en
*"Valores bloqueados / No MVP"*:

> `INFOJOBS — bloqueado hasta aprobación de app/partner y ToS claros (alto valor España)`

Y la auditoría de production readiness la marca como hallazgo abierto:

> `JOBS-10 | InfoJobs | Sin implementación; términos restringen caching y determinados usos.
> | … | LEGAL_REVIEW_REQUIRED | P1 | Producto agregador podría requerir acuerdo.`
> — [`sprint-22-production-readiness-real-data-audit-report.md`](../../sprints/sprint-22-production-readiness-real-data-audit-report.md)

Esta spec **no levanta ese bloqueo**. Documenta el diseño técnico previsto para cuando el
bloqueo se resuelva mediante una decisión legal/partner separada (ver Gate 0 en
[`sprint-26a-infojobs-provider-plan.md`](../../sprints/sprint-26a-infojobs-provider-plan.md)),
incluyendo la recomendación de un nuevo ADR (`ADR-0013`, número libre siguiente al momento de
escribir esta spec) que autorice InfoJobs bajo condiciones explícitas, mismo patrón que
ADR-0011 hizo para Jooble.

Relacionada con [`job-sources-aggregation.md`](job-sources-aggregation.md),
[`external-jobs-jooble.md`](external-jobs-jooble.md),
[ADR-0011](../../decisions/ADR-0011-jooble-external-jobs-integration.md) y
[`docs/architecture/03-job-sources-and-search.md`](../../architecture/03-job-sources-and-search.md).

## Contexto y justificación

JobIT ya sirve ofertas externas reales desde **Jooble** (ADR-0011, Sprint 03.5) y
**Greenhouse** (Sprint 16F), ambas ingeridas de forma controlada y persistidas antes de
mostrarse al candidato. **Adzuna** existe solo en el enum `JobSource`, sin provider ni
ingesta. **InfoJobs no tiene ningún código, migración ni provider** — está, además,
explícitamente marcada como bloqueada, no simplemente "pendiente de implementar" como
Adzuna.

La razón de esta spec: InfoJobs es, según la propia matriz de discovery del repo
(`sprint-16-job-sources-discovery-matrix.md`), la fuente de **mayor valor para el mercado
español** ("ES líder"), pero también la de mayor incertidumbre legal ("Alto [riesgo]
(aprobación/ToS)"). Preparar su diseño técnico *antes* de tener la aprobación permite que,
el día que la aprobación legal/partner llegue, la implementación (Sprint 26B) sea rápida,
acotada y siga exactamente el patrón ya validado con Jooble/Greenhouse — sin que eso
implique adelantar ni simular esa aprobación.

Esta spec **no contradice** ADR-0011 ni `job-sources-aggregation.md`: los complementa,
documentando el diseño condicionado a una decisión posterior que esta spec no toma.

## Objetivo

Definir el diseño técnico de una futura integración backend-only de InfoJobs como cuarta
fuente externa de ofertas (`INTERNAL`, `JOOBLE`, `GREENHOUSE`, futura `INFOJOBS`), sirviendo
resúmenes de oferta en JobIT con enlace a la oferta oficial en InfoJobs, **activable
únicamente** tras:

1. Lectura completa del ToS vigente de InfoJobs (no solo overview técnica).
2. Confirmación de aprobación de app/partner por parte de InfoJobs.
3. Un nuevo ADR (recomendado `ADR-0013`) que registre esa decisión de forma explícita,
   acotada y revisable — mismo criterio que ADR-0011 fijó para Jooble.

## Usuario afectado

- **Candidato** tech autenticado que explora ofertas: no percibe la mecánica de ingesta; ve
  un listado unificado con atribución de origen, igual que hoy con Jooble/Greenhouse.
- **Operador** técnico que ejecuta la ingesta manual controlada (backend-only).
- **Futuro revisor legal/partner**, que decide si y cuándo se activa Gate 0.

## Flujo principal

Mismo patrón de dos planos que Jooble/Greenhouse: **ingesta** (server-side, desacoplada del
candidato) y **lectura** (siempre desde BD local).

### A. Ingesta (server-side, backend-only, manual)

1. El operador configura las credenciales de InfoJobs en `.env` local (nunca commiteado).
2. El operador ejecuta el script de ingesta manual (`ingest-infojobs.ts`, previsto en
   Sprint 26B — no existe todavía).
3. El **client** de InfoJobs obtiene el payload oficial. El modelo de autenticación exacto
   **está pendiente de confirmar contra la documentación oficial vigente de InfoJobs
   (Gate 0/Gate 3)**; no se asume aquí ningún flujo concreto como decisión cerrada (ver
   "Riesgos legales y credenciales" más abajo).
4. El **normalizer** valida y convierte el payload a un `NormalizedExternalJob`/`ExternalJob`
   (contrato ya definido en `job-sources-aggregation.md`), descartando registros inválidos
   sin abortar el resto.
5. El **ingest.service** persiste con upsert idempotente por `(source, externalId)`, mismo
   mecanismo ya usado por Jooble y Greenhouse.
6. Los registros inválidos se cuentan como `skipped`, nunca abortan la ingesta completa.

### B. Lectura (candidato)

1. `GET /api/jobs` y `GET /api/jobs/:id` siguen sirviendo **exclusivamente** desde
   PostgreSQL, sin cambios de contrato.
2. Ninguna request de candidato llama a InfoJobs en ningún momento.
3. El candidato ve la oferta con su fuente visible y un enlace (`sourceUrl`) a la oferta
   oficial en InfoJobs, donde ocurre la inscripción real.

## Flujos alternativos

- **Configuración ausente** (credenciales de InfoJobs no definidas): el script aborta antes
  de cualquier llamada de red, sin exponer secretos, mismo patrón que `ingest-jooble.ts`.
- **Error de API durante la ingesta** (timeout, HTTP no-2xx, rate limit): se aísla en la
  ingesta; el listado del candidato sigue sirviendo lo ya persistido.
- **Payload parcial o malformado**: la oferta concreta se descarta (`skipped`) y se registra;
  el resto de la ingesta continúa.
- **Oferta repetida entre ingestas**: se deduplica por `(source, externalId)` (upsert, no
  duplica).
- **ToS no confirmado o aprobación de partner no concedida**: la ingesta real **no se
  ejecuta bajo ninguna circunstancia**, con independencia de que el código exista.

## Modelo de datos previsto

**Sin cambios en esta spec.** Conceptual únicamente, para Sprint 26B tras Gate 0:

| Campo/cambio | Detalle |
|---|---|
| `JobSource.INFOJOBS` | Nuevo valor de enum, **aditivo únicamente** (`ALTER TYPE "JobSource" ADD VALUE 'INFOJOBS'`), mismo patrón exacto que las migraciones ya existentes para `ADZUNA` y `GREENHOUSE`. Ningún otro cambio de schema. |
| `description` vs. `descriptionSnippet` | **Recomendación**: persistir `descriptionSnippet` (campo opcional ya anticipado por el contrato `ExternalJob` de `job-sources-aggregation.md`) en vez de la descripción completa que sí se guarda hoy para Jooble/Greenhouse, como medida conservadora ante el hallazgo `JOBS-10` ("términos restringen caching y determinados usos"). A confirmar/ajustar en Gate 0 tras leer el ToS completo. |
| `rawSourcePayload` | **No se persiste**, igual que para Jooble/Greenhouse (regla ya fijada en `job-sources-aggregation.md`). |

No se crea ninguna migración en Sprint 26A. La migración real es Gate 1 de Sprint 26B, y
depende de que Gate 0 (legal/partner) esté cerrado.

## Endpoints previstos

`No aplica`. No se crean ni modifican endpoints. `GET /api/jobs`/`GET /api/jobs/:id` siguen
sirviendo desde BD local sin cambio de contrato. No existe ni se propone ningún endpoint de
ingesta público.

## Pantallas afectadas

`No aplica` en el baseline previsto para Sprint 26B. Mismo precedente que `ADZUNA` hoy: un
valor de enum puede existir en Prisma sin estar expuesto en el filtro público
(`jobs.schemas.ts`) ni en el frontend (`apps/web/src/types/api.ts`, `JOB_SOURCE_LABELS`).
Exponer InfoJobs en el filtro público y en el frontend queda diferido a gates propios
(Gate 5 y Gate 6 de `sprint-26a-infojobs-provider-plan.md`), estrictamente posteriores y
previos a cualquier fila real `source = INFOJOBS` visible en cualquier entorno (incluida
staging/demo) — para no romper el render de fuente (`JOB_SOURCE_LABELS[job.source]` es un
`Record` sobre una unión cerrada de tipos hoy).

## Reglas de negocio

Heredadas literalmente de `job-sources-aggregation.md`, sin excepción para InfoJobs:

- **No scraping**, bajo ninguna circunstancia.
- **No live search**: ninguna request de candidato dispara una llamada a InfoJobs.
- **Ingesta manual/controlada, backend-only**, sin endpoint público.
- **Upsert idempotente** por `(source, externalId)`.
- **`sourceUrl` como único CTA externo** en el MVP; la inscripción ocurre siempre en
  InfoJobs, nunca dentro de JobIT.
- **No aplicar desde JobIT**: no se implementa inscripción ni candidatura interna.
- **No OAuth de usuario**: las credenciales previstas son de aplicación/backend
  (`INFOJOBS_CLIENT_ID`/`INFOJOBS_CLIENT_SECRET`), no un flujo de login de candidato.
- **No se importan CVs, candidaturas ni datos privados** de InfoJobs.
- **Fuente siempre visible** en card/detalle, una vez exista Gate 6.
- **Atribución visible** si el ToS de InfoJobs la exige (a confirmar en Gate 0).

## Validaciones

Mismo contrato `ExternalJob` ya definido en `job-sources-aggregation.md` (obligatorios:
`externalId`, `source`, `title`, `company`, `sourceUrl`, `remoteType`):

| Elemento | Regla |
|---|---|
| Payload externo | Validado por schema (zod) antes de normalizar; forma inesperada → error de respuesta, no se persiste nada |
| Campos mínimos | `externalId`, `title`, `company`, `sourceUrl` no vacíos; ausencia de cualquiera → registro descartado (`skipped`) |
| `sourceUrl` | URL absoluta `http:`/`https:` válida |
| `remoteType` | Inferencia conservadora; ante duda, `UNSPECIFIED` (nunca asumir) |
| Texto/descripción | Sin HTML crudo; longitudes acotadas; snippet en vez de contenido completo (ver modelo de datos) |

## Errores

| Situación | Comportamiento esperado |
|---|---|
| Configuración ausente (`INFOJOBS_CLIENT_ID`/`INFOJOBS_CLIENT_SECRET` no definidos) | El script aborta **antes** de cualquier llamada de red, con mensaje seguro sin secretos |
| Error HTTP no-2xx de InfoJobs | Aislado en la ingesta; no afecta `GET /api/jobs` |
| Timeout | Igual que Jooble/Greenhouse: error propio, aislado, sin propagarse al candidato |
| Payload con forma inválida (no cumple schema) | Error de respuesta explícito; no se persiste nada de ese lote |
| Job normalizado inválido | Se descarta (`skipped`), no aborta el resto |
| Conflicto de upsert `(source, externalId)` en condición de carrera | Se resuelve como actualización, no como fallo |
| Cualquier error | Se registra **sin secretos**: nunca la credencial, nunca una URL que la contenga |

## Criterios de aceptación

- [ ] La spec documenta el diseño técnico sin implementarlo.
- [ ] La spec documenta explícitamente el bloqueo legal/partner vigente y no lo levanta.
- [ ] La spec identifica Gate 0 (legal/partner + ADR nuevo) como precondición de cualquier
      código o migración real.
- [ ] La spec no afirma como decidido un modelo de autenticación concreto de InfoJobs; lo
      deja pendiente de confirmar contra documentación oficial vigente.
- [ ] La spec mantiene el patrón de ingesta controlada (nunca búsqueda live).
- [ ] La spec recomienda `descriptionSnippet` como default conservador ante el hallazgo
      `JOBS-10`, sujeto a confirmación real en Gate 0.
- [ ] La spec no implica cambios en `jobs.schemas.ts` ni en `apps/web/**` antes de sus
      propios gates diferidos.

## Tests mínimos

> Aplican a Sprint 26B (tras Gate 0), no a esta spec documental. Se listan aquí para fijar
> el contrato de pruebas, mismo patrón que Jooble/Greenhouse:

- Client: fixtures/mocks de HTTP inyectado, sin red real; nunca expone la credencial en un
  mensaje de error (mismo test ya existente para Jooble/Greenhouse, replicado).
- Schemas: contrato zod sobre la forma real del payload de InfoJobs (a confirmar en Gate 0).
- Normalizer: payload válido → DTO correcto; payload parcial/incompleto → defaults seguros;
  campo requerido ausente → excepción de normalización (`skipped`, no abortar ingesta).
- Ingest service: persiste con provenance; idempotencia (`(source, externalId)`); nunca
  filtra la credencial ante fallo de búsqueda; usa `truncateTables` en tests de integración,
  mismo patrón que `jooble.ingest.service.test.ts`/`greenhouse.ingest.service.test.ts`.
- No regresión: la suite completa de `jobs`/`jooble`/`greenhouse` sigue en verde.
- La API pública sigue sin exponer `externalId` ni `ingestedAt` para ninguna fuente,
  incluida InfoJobs.

## Fuera de alcance

- **Esta spec (Sprint 26A):** cualquier código, migración Prisma, credencial real o llamada
  real a InfoJobs.
- Levantar el bloqueo legal/partner de InfoJobs (decisión de Gate 0, no de esta spec).
- Redactar el ADR recomendado (`ADR-0013`) — se recomienda, no se crea aquí.
- OAuth de usuario / login de candidato contra InfoJobs.
- Inscripción o candidatura dentro de JobIT (ocurre siempre en InfoJobs, vía `sourceUrl`).
- Importación de CVs, candidaturas o datos privados de InfoJobs.
- Scraping, bajo cualquier circunstancia.
- Búsqueda live contra la API de InfoJobs por request de candidato.
- Exposición pública del filtro `source=INFOJOBS` (`jobs.schemas.ts`) y cambios de frontend
  (`apps/web/**`) — diferidos a gates propios, posteriores a Gate 0.
- Cron productivo / orquestación automática de ingesta.
- Recruiter/ATS completo, monetización, aplicación móvil, IA para evaluar personas.

## Riesgos legales y credenciales

- **Bloqueo vigente**: `job-sources-aggregation.md` clasifica InfoJobs como *"bloqueado
  hasta aprobación de app/partner y ToS claros"*; ADR-0011 restringe cualquier fuente
  distinta de Jooble a requerir su propia spec/ADR; el hallazgo `JOBS-10` (Sprint 22) lo
  marca `LEGAL_REVIEW_REQUIRED`, prioridad `P1`. **Ninguno de estos tres documentos queda
  derogado por esta spec.**
- **Restricción de caching/republicación**: según el hallazgo `JOBS-10`, el ToS de InfoJobs
  "limita caching/uso y contempla acuerdos de partner para determinados casos". Implica que
  guardar la descripción completa (patrón actual de Jooble/Greenhouse) podría no ser
  compatible sin confirmar — de ahí la recomendación de `descriptionSnippet`.
- **Modelo de autenticación no confirmado**: la matriz de discovery
  (`sprint-16-job-sources-discovery-matrix.md`) describe el acceso como *"Registro app +
  OAuth; ¿aprobación partner?"*, lo que **sugiere, sin confirmar**, un posible flujo con
  intercambio de credenciales de aplicación por un token. Esto es una **hipótesis a
  verificar contra la documentación oficial vigente de InfoJobs en Gate 0/Gate 3**, no una
  decisión cerrada. El `client.ts` definitivo deberá implementarse según el flujo oficial
  que se confirme entonces, no según lo que aquí se especula.
- **Credenciales previstas**: `INFOJOBS_CLIENT_ID`, `INFOJOBS_CLIENT_SECRET`,
  `INFOJOBS_API_BASE_URL` — nombres fijados por el prompt de este sprint, sujetos a
  validación real en Gate 0 contra la documentación oficial vigente. Ninguna vive fuera de
  variables de entorno backend; ninguna se commitea, se loguea ni se expone al cliente.
- **Atribución**: si el ToS de InfoJobs exige atribución visible, se implementará en el
  mismo gate de frontend (Gate 6), no antes.

## Auditoría requerida

- [ ] Quality/security documental.
- [ ] Revisión humana de la coherencia con `job-sources-aggregation.md` y ADR-0011.
- [ ] **Revisión legal/ToS explícita** de InfoJobs (Gate 0) — no sustituible por una
      revisión técnica de overview.
- [ ] Confirmación de aprobación de app/partner por InfoJobs antes de Gate 1.
- [ ] Tests y verificaciones locales (Sprint 26B, tras Gate 0).
