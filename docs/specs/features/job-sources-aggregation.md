# Spec — Job Sources Aggregation

## Estado

**Draft / Proposed.** Spec documental previa a implementación. No autoriza por sí misma
ningún cambio de código, Prisma ni frontend. Cualquier fase técnica derivada (16C en
adelante) requiere aprobación explícita separada del orquestador.

## Objetivo

Definir el alcance técnico y de producto para evolucionar JobIT desde **Jooble como única
fuente externa** hacia un **sistema multi-fuente seguro, candidate-first y basado en
ingesta controlada**, justificando de antemano los futuros cambios de Prisma, el `enum
JobSource`, el contrato normalizado de fuentes y las reglas de ingesta, antes de
implementar Adzuna o cualquier otra fuente nueva.

Arquitectura rectora, sin excepciones:

```txt
fuentes externas → ingesta controlada → base de datos JobIT → búsqueda local → enlace oficial externo
```

## Usuario afectado

**Principal:**
- Candidato tech que busca ofertas en JobIT.

**Secundarios:**
- Operador/admin técnico que ejecuta las ingestas controladas (scripts backend-only).
- Futuro equipo de producto que decidirá qué fuentes activar y en qué orden.

## Contexto

- **Jooble ya existe** como fuente de ingesta controlada (Sprint 03.5; endurecida en
  Sprints 15E-15G con host configurable por entorno y comandos single/multi-ubicación).
- **Sprint 16** (discovery/documental, PR #63) evaluó 16 fuentes candidatas, revisó la
  arquitectura actual, fijó reglas de producto y un plan incremental. Ver
  `docs/sprints/sprint-16-job-sources-*.md`.
- **Sprint 16A** (PR #64) eliminó el script legacy de ingesta Jooble que vivía fuera de
  `apps/api/src/` (sin typecheck/build). Las vías oficiales quedan bajo
  `apps/api/src/jobs/scripts/{ingest-jooble.ts, ingest-jooble-locations.ts}`.
- **No hay búsqueda live**: JobIT sirve `GET /api/jobs`/`GET /api/jobs/:id` siempre desde
  su propia DB; ninguna fuente externa se consulta por request de candidato.
- **MVP candidate-first**: las specs originales de Jobs (M03) y el alcance del MVP
  (`docs/specs/00-mvp-scope.md`) partían de "sin APIs externas" en la fase documental
  inicial; esa restricción quedó **explícitamente superada** por ADR-0011 y la spec
  `external-jobs-jooble.md`, que autorizaron Jooble como integración backend-only
  controlada. Esta spec continúa esa misma línea evolutiva para fuentes adicionales, sin
  reabrir ni contradecir esas decisiones.

## Principios de arquitectura

- **No scraping**, bajo ninguna circunstancia.
- **No live search** contra ninguna API externa por cada búsqueda del candidato.
- **Ingesta manual/programada/controlada**, siempre backend-only, sin endpoint público.
- **DB local como única fuente de lectura** para `GET /api/jobs`/`GET /api/jobs/:id`.
- **`source` siempre visible** en la UI (cards y detalle).
- **Enlace externo oficial** siempre presente (`sourceUrl`, y `applyUrl` si en el futuro procede).
- **Secretos fuera del repo**: solo en `.env` local (gitignored) o variables de entorno del
  despliegue; nunca impresos en logs ni mensajes de error.
- **Tests con fixtures/mocks**, nunca contra red real ni con API keys reales.
- **Un provider por fuente** (client → normalizer → ingest.service) cuando llegue la
  **segunda** integración real — no antes (evitar sobreingeniería / YAGNI).

## Flujo principal

1. El operador configura las variables de entorno de la fuente (`.env` local, nunca commiteado).
2. El operador ejecuta el script de ingesta manual/controlada correspondiente.
3. El **provider** de la fuente (`client.ts`) consulta la API/RSS oficial de esa fuente.
4. El **normalizer** de la fuente transforma el payload crudo a un `ExternalJob` normalizado.
5. El **ingest.service** hace upsert idempotente en la tabla `Job` por `(source, externalId)`.
6. `GET /api/jobs` (y `GET /api/jobs/:id`) leen siempre la **DB local**, nunca la fuente en vivo.
7. El candidato ve la **fuente visible** en la card/detalle de cada oferta.
8. El candidato abre `sourceUrl` (o el futuro `applyUrl` si aplica) para ver/aplicar en el origen oficial.
9. El candidato puede guardar la oferta en `SavedJob`, independientemente de su fuente.

## Modelo de datos actual

Estado real (`apps/api/prisma/schema.prisma`), sin cambios en esta spec:

- `enum JobSource { INTERNAL, JOOBLE }` — solo dos valores.
- `enum RemoteType { REMOTE, HYBRID, ON_SITE, UNSPECIFIED }`.
- `enum JobSeniority { JUNIOR, MID, SENIOR, ANY }`.
- `enum JobStatus { ACTIVE, CLOSED }`.
- `model Job`: `id, title, company, location?, remoteType, description, requirements[],
  seniority, contractType, salaryMin?, salaryMax?, tags[], status(@default ACTIVE),
  postedAt(@default now), expiresAt?` + provenance `source(@default INTERNAL),
  externalId?, sourceUrl?, ingestedAt?`; relación `savedBy SavedJob[]`. Índices: status,
  remoteType, seniority, contractType, postedAt, **source**.
- **No existe** `applyUrl` (distinto de `sourceUrl`).
- **No existe** `salaryCurrency` (los importes son `Int?` sin divisa explícita; se asume implícitamente €).
- **No existe** `publishedAt` (distinto de `postedAt`).
- **No existe** `rawSourcePayload` (el `rawSource` del normalizer de Jooble se descarta al persistir).
- La serialización pública (`serializeJob`/`JobPublicDto`) ya es **fuente-agnóstica**:
  expone `source`/`sourceUrl`, oculta `externalId`/`ingestedAt`.
- El upsert idempotente por `(source, externalId)` ya existe para Jooble (protegido por
  índice único parcial + reintento ante `P2002`).

## Cambios de modelo propuestos

**Sin implementar en esta spec.** Propuestas para una fase técnica posterior (16C), a
aprobar explícitamente:

- **Ampliar `enum JobSource`** solo con las fuentes realmente **aprobadas** para la
  siguiente fase técnica — no con todas las candidatas de la matriz de una sola vez.
- **Confirmar o generalizar** la unicidad `(source, externalId)` a nivel de constraint de
  DB para que aplique a cualquier fuente futura, no solo a `JOOBLE`.
- **Valorar `salaryCurrency`** únicamente si la primera fuente nueva (previsiblemente
  Adzuna) lo exige de forma clara (salarios fuera de la eurozona).
- **Diferir `applyUrl`** salvo que una fuente concreta (p. ej. un ATS) distinga
  claramente listing de apply de forma que `sourceUrl` no baste.
- **No añadir `publishedAt`**: `postedAt` (fecha externa best-effort, con fallback a
  `ingestedAt`) cubre el MVP; introducir un segundo campo sería redundante hoy.
- **No guardar `rawSourcePayload` por defecto**: coste de almacenamiento, riesgo de ToS y
  de privacidad sin beneficio claro en el MVP.
- **Mantener `status = CLOSED` antes que borrado físico** para cualquier oferta que
  desaparezca de su fuente, preservando `SavedJob` e historial.

## JobSource enum propuesto

Lista de referencia (no implementar en esta spec), separando por estado:

**Valores ya existentes:**
```txt
INTERNAL
JOOBLE
```

**Valores candidatos para la siguiente fase técnica** (añadir **solo** los que el
orquestador apruebe explícitamente en 16C, no necesariamente todos a la vez):
```txt
ADZUNA
JOBICY
WE_WORK_REMOTELY
GREENHOUSE
LEVER
ASHBY
```

**Valores diferidos** (Could-have; no urgentes, requieren más due diligence antes de
entrar al enum):
```txt
HIMALAYAS
CAREERJET
WORKABLE
```

**Valores bloqueados / No MVP** (no se añaden al enum sin cambio de circunstancias):
```txt
LINKEDIN        — bloqueado sin partnership formal
INDEED          — bloqueado sin partner formal
RANDSTAD        — bloqueado/pendiente, sin API pública de búsqueda documentada
INFOJOBS        — bloqueado hasta aprobación de app/partner y ToS claros (alto valor España)
TECNOEMPLEO     — pendiente de validar campos RSS y programa de partners
REMOTIVE        — cautela: su ToS restringe explícitamente reenviar ofertas a agregadores
```

**Recomendación explícita**: no realizar una única migración masiva con todos los valores
candidatos. Cada fase técnica (16D, 16E, 16F…) añade **solo** el valor de la fuente que
esa fase implementa, en su propia migración versionada.

## Contrato normalizado ExternalJob

Contrato compartido que cada `normalizer` de fuente debe producir (generaliza el
`NormalizedExternalJob` ya existente y específico de Jooble):

**Obligatorios:**
- `externalId`
- `source`
- `title`
- `company`
- `sourceUrl`
- `remoteType`

**Opcionales:**
- `location`
- `description`
- `descriptionSnippet`
- `requirements`
- `tags`
- `salaryMin`
- `salaryMax`
- `salaryCurrency`
- `contractType`
- `seniority`
- `publishedAt`
- `expiresAt`
- `applyUrl`
- `attribution`

**Reglas:**
- `raw` puede existir como valor efímero dentro de tests/depuración, pero **no se
  persiste** en la tabla `Job` por defecto (coherente con "no `rawSourcePayload`").
- `sourceUrl` y, si existe, `applyUrl` deben ser URLs absolutas `http:`/`https:` válidas
  (mismo patrón de validación que ya usa el normalizer de Jooble).
- Si falta `externalId`, `title`, `company` o la URL oficial (`sourceUrl`), el registro
  se **descarta** (se cuenta como `skipped` en el resumen de ingesta, igual que hoy).
- **Normalización conservadora**: ante ambigüedad (p. ej. inferir `remoteType` por
  palabras clave), se prefiere el valor "sin especificar"/`null` a asumir un dato no
  confirmado por la fuente.

## Reglas de ingesta

- Los scripts de ingesta son **backend-only**, ejecutables manualmente con `tsx`; **no
  hay endpoints públicos de ingesta**.
- **Upsert idempotente** por `(source, externalId)` para toda fuente, sin excepción.
- **Logs sin secretos**: nunca se imprime una API key ni una URL que la contenga.
- **Rate limits por fuente**: cada integración respeta el límite documentado de su
  proveedor (ejecución en serie, nunca en paralelo, como ya hace `ingest-jooble-locations.ts`).
- **Tests con fixtures**: ningún test de client/normalizer/ingest usa red real.
- **No llamadas reales** a ninguna API externa sin autorización explícita del operador
  humano (mismo criterio ya aplicado a Jooble en 15F/15G).
- Cada fuente sigue el mismo patrón de archivos que Jooble: `client.ts`, `normalizer.ts`,
  `ingest.service.ts`, `schemas.ts`, `types.ts`, `__fixtures__/`, `*.test.ts`.

## Reglas de deduplicación

- **MVP**: dedupe **solo** por `(source, externalId)` — el mecanismo ya existente.
- **No fusión agresiva cross-source**: si la misma oferta aparece vía dos fuentes
  distintas, coexisten como dos filas independientes en el MVP.
- Los duplicados entre fuentes son un **riesgo aceptado inicialmente**, no un bloqueante.
- Una **heurística posterior** (opcional, fuera de esta spec) podría marcar posibles
  duplicados por `title + company + location` normalizados — **solo para marcar**, nunca
  para fusionar automáticamente.
- El dedupe **nunca** debe romper `SavedJob`: cualquier estrategia de deduplicación futura
  debe preservar las ofertas ya guardadas por candidatos.

## Reglas de expiración y cierre

- `expiresAt` se puebla **si la fuente lo proporciona**; si no, queda `null` (nunca se inventa).
- **`status = CLOSED` antes que `delete` físico** para cualquier oferta que deje de estar
  disponible en su fuente.
- **No se borran ofertas guardadas** (`SavedJob` debe sobrevivir a cualquier cambio de
  estado de la oferta referenciada).
- **Cierre por ausencia** (una oferta deja de aparecer en ingestas sucesivas) queda **fuera
  de esta spec**; es una fase posterior con regla explícita propia (p. ej. N ausencias
  consecutivas), no un comportamiento implícito del MVP.
- **No inventar expiración**: si una fuente no la proporciona, la oferta permanece activa
  hasta que la fuente la retire explícitamente o el operador la gestione manualmente.

## Reglas de sourceUrl vs applyUrl

- **MVP**: `sourceUrl` es el **CTA externo único** ("Ver oferta oficial" / copy por fuente,
  ya implementado en Sprint 15E).
- `applyUrl` queda **diferido**, salvo que una fuente concreta lo requiera de forma clara
  (p. ej. un ATS que separe explícitamente "ver oferta" de "aplicar").
- **Si en el futuro ambos existen**: `applyUrl` puede convertirse en el CTA principal de
  aplicación, y `sourceUrl` queda como referencia del origen/listing.
- **No se aplica desde JobIT** en ningún caso — la inscripción ocurre siempre en el
  destino externo (`sourceUrl` o `applyUrl`), nunca dentro de la plataforma.

## Reglas de producto y UX

- **Fuente siempre visible** en card y detalle de cada oferta.
- **CTA honesto**: el candidato debe saber dónde acabará al pulsar el enlace externo.
- **No ocultar redirecciones** obligatorias del proveedor (p. ej. tracking URLs).
- **No presentar ofertas seed/`INTERNAL`** como si fueran ofertas reales de una fuente
  externa (el aviso honesto actual de "oferta de ejemplo" se mantiene mientras `INTERNAL`
  sea solo seed).
- **No IA para evaluar personas** — Match sigue siendo reglas visibles, no scoring de candidatos.
- **No aplicar desde JobIT.**
- **Saved Jobs debe permanecer estable** aunque cambie o se re-ingiera la fuente de una
  oferta guardada.

## Reglas legales/ToS

- **No scraping**, en ninguna fuente, bajo ninguna circunstancia.
- **Solo API/RSS/ATS oficiales** como origen de ingesta.
- **ToS completo leído y confirmado compatible** antes de implementar cada fuente nueva
  (no basta con la overview técnica; ver el criterio de aborto ya fijado para Adzuna en
  `sprint-16-job-sources-product-rules-and-ranking.md`).
- **Atribución visible** cuando la fuente la exija.
- **Descripción completa vs. snippet** según lo que cada fuente permita redistribuir.
- **No LinkedIn / Indeed / Randstad** sin acuerdo formal.
- **No fuentes detrás de login** de usuario sin acuerdo explícito con el proveedor.

## Variables de entorno

Patrón propuesto para futuras fuentes (mismo estilo que `JOOBLE_API_KEY`/`JOOBLE_API_BASE_URL`):

```txt
<SOURCE>_API_KEY
<SOURCE>_API_BASE_URL
<SOURCE>_APP_ID
<SOURCE>_APP_KEY
ING_KEYWORDS
ING_LOCATION
ING_LOCATIONS
ING_LIMIT
```

**Aclaraciones:**
- Esta spec **no** añade valores reales de ninguna variable.
- La actualización real de `apps/api/.env.example` (placeholders, sin secretos) ocurre en
  la **fase técnica** que implemente cada fuente (16D en adelante), no aquí.
- **Esta spec no modifica `apps/api/.env.example`.**

## Endpoints

- **No se añaden endpoints nuevos** en esta spec.
- `GET /api/jobs` y `GET /api/jobs/:id` siguen leyendo exclusivamente la **DB local**; su
  contrato público no cambia.
- **No existe ni se propone** un endpoint público de ingesta.
- La API pública sigue **sin exponer** `externalId` ni `ingestedAt`, para cualquier fuente,
  actual o futura.

## Pantallas

Pantallas ya existentes que consumen el modelo multi-fuente (sin cambios en esta spec):

- `/jobs`
- `/jobs/[id]`
- `/saved-jobs`
- `/match`

**Cambios futuros esperados** (fuera de esta spec, en fases posteriores): nuevas entradas
en las etiquetas de fuente (`JOB_SOURCE_LABELS`) por cada `JobSource` que se apruebe;
copy de CTA específico por fuente si procede; posible visualización de fecha de
publicación si aún no se mostrara para una fuente concreta. **No se crean pantallas
nuevas** en el MVP multi-fuente.

## Validaciones

- URLs (`sourceUrl`, `applyUrl` si existe) deben ser `http:`/`https:` válidas.
- Campos mínimos obligatorios del contrato `ExternalJob` presentes (ver sección correspondiente).
- `source` debe ser un valor permitido del enum vigente en cada momento.
- `salaryMin`/`salaryMax` deben ser numéricos si están presentes.
- `salaryCurrency`, si existe, debe acompañar a un valor de salario.
- Fechas (`publishedAt`/`postedAt`, `expiresAt`) deben ser válidas si están presentes.
- `location` es opcional; su ausencia no invalida el registro.
- `remoteType` se infiere de forma conservadora; ante duda, `UNSPECIFIED`.

## Errores

- Configuración ausente (p. ej. API key no definida) → aborta la ingesta sin llamar a la red.
- Error HTTP no-2xx del proveedor.
- Timeout de la petición.
- Respuesta con forma inválida (no cumple el schema esperado).
- Job normalizado inválido (falta un campo obligatorio) → se descarta (`skipped`), no aborta el resto.
- Rate limit alcanzado (según lo que documente cada proveedor).
- Conflicto de upsert (`(source, externalId)` duplicado en condición de carrera) → se
  resuelve como actualización, no como fallo.
- **Todos los mensajes de error se registran sin secretos** (nunca la API key, nunca la
  URL completa con la key).

## Tests mínimos

- Normalizer por fuente, con fixtures (sin red).
- Client con `fetch`/HTTP mockeado (sin red).
- Ingest service con `search`/cliente inyectado (mock), sin red.
- Upsert idempotente por `(source, externalId)` verificado con Prisma de test.
- La API pública **no expone** `externalId` ni `ingestedAt` para ninguna fuente.
- Filtros de `GET /api/jobs` por `source` siguen funcionando con los valores existentes y nuevos.
- Comportamiento de expiración (`expiresAt`, exclusión de ofertas expiradas del listado).
- `SavedJob` no se rompe ante cambios de estado de la oferta referenciada.
- Suite completa de `build`/`typecheck`/`test` del backend en verde tras cualquier cambio.

## Fases de implementación

Referencia al plan ya fijado en `docs/sprints/sprint-16-job-sources-implementation-plan.md`:

- **16C** — Prisma minimal multi-source (migración mínima del enum `JobSource` +
  unicidad general, solo tras aprobar esta spec).
- **16D** — Adzuna provider spike, **solo si** su ToS final resulta compatible.
- **16E** — Una fuente remota tech simple (Jobicy / We Work Remotely / Himalayas).
- **16F** — ATS curated companies (Greenhouse / Lever / Ashby).
- **16G** — Staging/demo data bootstrap.

Cada fase es una rama y una PR independiente, con su propia revisión humana.

## Fuera de alcance

- Scraping, en cualquier fuente.
- LinkedIn / Indeed / Randstad, sin acuerdo formal.
- Aplicar desde JobIT (candidatura interna).
- Búsqueda live contra APIs externas por cada búsqueda de candidato.
- IA para evaluar candidatos/personas.
- Recruiter/ATS completo (gestión de candidaturas, pipelines).
- Cron productivo / orquestación automática de ingesta.
- n8n o cualquier automatización externa.
- Monetización.
- Aplicación móvil.

## Criterios de aceptación

- [ ] La spec justifica los futuros cambios de Prisma (enum `JobSource`, unicidad,
      `salaryCurrency` condicional) sin implementarlos.
- [ ] La spec mantiene el patrón de ingesta controlada (nunca búsqueda live).
- [ ] La spec bloquea explícitamente scraping y búsqueda live.
- [ ] La spec define el contrato normalizado `ExternalJob` (obligatorios/opcionales).
- [ ] La spec define el enum `JobSource` candidato, distinguiendo aprobado/diferido/bloqueado.
- [ ] La spec define reglas de deduplicación y de expiración/cierre.
- [ ] La spec define reglas de producto/UX y legales/ToS.
- [ ] La spec **no implementa código, migraciones ni cambios de frontend**.

## Preguntas abiertas

- ¿Cuál es el resultado de leer el **ToS final completo** de Adzuna (no solo la overview
  ya revisada en Sprint 16)? Condiciona si 16D procede o se salta a la alternativa (ATS
  curado o Jobicy/WWR).
- ¿`salaryCurrency` entra en la migración de **16C** o se pospone hasta que la fuente
  concreta de **16D** lo exija?
- ¿Se añade **solo `ADZUNA`** al enum en la primera migración de 16C, o varios valores
  iniciales (p. ej. también `JOBICY`/`GREENHOUSE`) para no repetir migraciones?
- ¿`applyUrl` espera a la integración de un **ATS** (16F), o alguna fuente anterior lo
  necesita antes?
- ¿Se prioriza **España** o **remoto global** como siguiente foco después de Jooble?
- ¿Qué fuentes se consideran **demo-safe** para staging (16G) sin riesgo legal ni de rate limit?
