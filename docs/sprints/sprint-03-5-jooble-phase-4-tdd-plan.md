# Sprint 03.5 — Fase 4 — Cliente HTTP e ingesta Jooble: TDD Plan

> Documento de planificación (Fase 4A). **No** implementa cliente HTTP, ingesta, scripts ni endpoints. La implementación corresponde a fases posteriores (4B en adelante). Sin red, sin uso de `JOOBLE_API_KEY`.

## 1. Objetivo

Diseñar una implementación **segura y testeable** del cliente HTTP de Jooble y de un servicio de **ingesta controlada** que normaliza y persiste ofertas externas en `Job` con trazabilidad y deduplicación idempotente, sin llamar a Jooble en el request del candidato, sin exponer la API key y sin depender de la red en los tests.

Alineado con [external-jobs-jooble.md](../specs/features/external-jobs-jooble.md) (flujo de ingesta server-side), [ADR-0011](../decisions/ADR-0011-jooble-external-jobs-integration.md) (decisiones 1–8) y la provenance ya integrada en Fase 3.

## 2. Alcance (Fase 4 completa, a implementar en 4B+)

- **Cliente HTTP Jooble** (`jooble.client.ts`): una función para consultar la API oficial de Jooble, con `fetch` inyectable, timeout y validación de respuesta con el schema Zod existente.
- **Jerarquía de errores de dominio** (`jooble.errors.ts` o dentro del cliente): config/HTTP/timeout/respuesta inválida.
- **Servicio de ingesta** (`jooble.ingest.service.ts`): orquesta cliente → `normalizeJoobleJob` → **upsert** por `(source, externalId)`; aísla y cuenta los registros inválidos; devuelve un resumen.
- **Tests unitarios/integración sin red** del cliente y del servicio (con `fetch` mockeado y Prisma real contra DB de test).

## 3. Fuera de alcance

- Llamadas reales a Jooble / red en tests o CI.
- Endpoints nuevos o cambios en `/api/jobs` y `/api/jobs/:id`.
- Disparo automático: cron, scheduler, n8n (ADR-0011 lo prohíbe explícitamente).
- Frontend.
- Cambios en Prisma/migraciones (la provenance ya existe).
- Cambios en `package.json`/lockfiles.
- Otras fuentes externas distintas de Jooble.
- El script manual de ingesta (se **decide** aquí, se **implementa** en Fase 5).

## 4. Estado actual reutilizable

- `env.JOOBLE_API_KEY` — opcional, backend-only, `undefined` si falta; nunca loguear ([config/env.ts](../../apps/api/src/config/env.ts)).
- `joobleSearchResponseSchema` / `joobleJobSchema` — validan `{ totalCount, jobs[] }` ([jooble.schemas.ts](../../apps/api/src/jobs/external/jooble/jooble.schemas.ts)).
- `normalizeJoobleJob(payload, { ingestedAt })` → `NormalizedExternalJob`; lanza `JoobleNormalizationError` ante identidad inválida (`id`/`link`) ([jooble.normalizer.ts](../../apps/api/src/jobs/external/jooble/jooble.normalizer.ts)).
- Modelo `Job` con `source`, `externalId`, `sourceUrl`, `ingestedAt`, enum `JobSource`, `RemoteType.UNSPECIFIED` e índice único **parcial** `(source, externalId) WHERE "externalId" IS NOT NULL`.
- Fixtures: `jooble.valid.json`, `jooble.partial.json`, `jooble.invalid.json`.

## 5. Diseño propuesto del cliente HTTP Jooble

API de Jooble: `POST https://jooble.org/api/<API_KEY>` con body JSON (`{ keywords, location, page, ... }`) y respuesta `{ totalCount, jobs[] }`. **La key viaja en el path de la URL del servidor a Jooble**, nunca al cliente ni a logs.

Firma propuesta (con dependencias inyectables para test):

```ts
export interface JoobleSearchParams {
  keywords: string;
  location?: string;
  page?: number;        // 1-based
}

export interface JoobleClientDeps {
  apiKey: string;                 // se pasa explícito; el servicio lo toma de env
  fetchFn?: typeof fetch;         // inyectable; default global fetch
  timeoutMs?: number;             // default p.ej. 10000
  baseUrl?: string;               // default "https://jooble.org/api"
}

export async function searchJoobleJobs(
  params: JoobleSearchParams,
  deps: JoobleClientDeps
): Promise<JoobleSearchResponseInput>;
```

Comportamiento:
1. Si `apiKey` está vacío → `JoobleConfigError` (no se intenta la llamada).
2. `fetch(POST `${baseUrl}/${apiKey}`, { body, signal })` con `AbortController` + timeout.
3. Si `res.ok` es falso → `JoobleHttpError(status)` (sin volcar la URL con la key).
4. `await res.json()` y validar con `joobleSearchResponseSchema` → si falla, `JoobleResponseError` (envuelve el `ZodError`).
5. Devuelve la respuesta validada.

El cliente **no** normaliza ni persiste; solo obtiene y valida la forma. No lee `env` directamente (recibe `apiKey`), lo que facilita el test y centraliza la política de la key en el servicio.

## 6. Diseño propuesto del servicio de ingesta

```ts
export interface IngestDeps {
  apiKey?: string;                // default env.JOOBLE_API_KEY
  search?: typeof searchJoobleJobs; // inyectable para test
  now?: () => Date;               // default () => new Date()
}

export interface IngestSummary {
  fetched: number;    // jobs recibidos de Jooble
  normalized: number; // normalizados con éxito
  skipped: number;    // descartados (JoobleNormalizationError)
  created: number;
  updated: number;
}

export async function ingestJoobleJobs(
  params: JoobleSearchParams,
  deps?: IngestDeps
): Promise<IngestSummary>;
```

Flujo:
1. Resolver `apiKey` (deps o `env.JOOBLE_API_KEY`). Si falta → `JoobleConfigError` (la ingesta no arranca).
2. Llamar a `searchJoobleJobs(params, { apiKey, ... })`.
3. `ingestedAt = now()`.
4. Por cada job del payload: `try { normalizeJoobleJob(job, { ingestedAt }) } catch (JoobleNormalizationError) { skipped++; log redactado; continue; }`.
5. Persistir cada `NormalizedExternalJob` con **upsert manual** por `(source, externalId)` (ver §11), mapeando el DTO a columnas de `Job` (defaults seguros: `status: ACTIVE`, `seniority`, `tags`/`requirements` `[]` cuando falten, etc.).
6. Devolver `IngestSummary`.
7. Un error de red/HTTP/timeout/respuesta **aborta la ingesta** con un error de dominio (no se persiste nada parcial salvo lo ya escrito; se documenta la semántica). Los errores de normalización **por registro** no abortan: se descartan y se cuentan.

## 7. Contrato de entrada para búsqueda/importación

`JoobleSearchParams`: `keywords` (requerido, no vacío), `location` (opcional), `page` (opcional, entero ≥ 1, default 1). Validable con un pequeño schema Zod en el servicio. La paginación de Jooble (varias páginas) se puede iterar en Fase 5 si se decide; en 4B basta una página por llamada.

## 8. Estrategia de uso de `JOOBLE_API_KEY`

- Se lee **solo** en el servidor desde `env.JOOBLE_API_KEY` (ya implementado, backend-only).
- El servicio la resuelve y la pasa al cliente como argumento; el cliente no la lee de env.
- Si falta → error de dominio controlado (`JoobleConfigError`); el listado interno/seed sigue operativo (no se toca `GET /api/jobs`).

## 9. Estrategia para no exponer la key

- **Nunca** se incluye la key en respuestas de API (no hay endpoint que la devuelva).
- **Nunca** se loguea: los mensajes de error y logs **no** contienen la URL con la key; si se registra la URL, se redacta (`/api/***`).
- La key no viaja al frontend (no hay endpoint de ingesta para el candidato).
- Tests aseguran que el mensaje de error y cualquier log no contienen el valor de la key.

## 10. Estrategia de tests sin red + mock de fetch/cliente

- **Cliente:** inyectar `fetchFn` mock que devuelve un `Response`-like (`{ ok, status, json: async () => fixture }`). Cero red. Fixtures: `jooble.valid.json` (OK), `jooble.invalid.json` (forma inválida → ZodError), y respuestas simuladas de error/timeout.
- **Servicio:** inyectar `search` mock que resuelve un payload (de fixture) o rechaza con un error de dominio; Prisma real contra la DB de test (`localhost:5434`) para verificar upsert; `truncateTables` (ya incluye `"Job"`) en `beforeEach`.
- Ningún test usa `env.JOOBLE_API_KEY` real; se pasa una key ficticia por `deps`.

Casos cubiertos:
1. Sin red en ningún test (todo mockeado).
2. Falta `JOOBLE_API_KEY` → `JoobleConfigError` (la ingesta no arranca; sin llamada).
3. Error HTTP de Jooble (status 4xx/5xx) → `JoobleHttpError` controlado.
4. Timeout (AbortError) → `JoobleTimeoutError` controlado.
5. Payload inválido (forma) → falla por schema (`JoobleResponseError`/ZodError).
6. Jobs válidos → se normalizan y persisten.
7. Registro inválido individual (`JoobleNormalizationError`) → se descarta, `skipped++`, **no aborta** la ingesta del resto.
8. Upsert por `(source, externalId)` → re-ingesta de la misma oferta **actualiza** (no duplica): `created` la 1ª vez, `updated` la 2ª; `count` estable.
9. La key no aparece en mensajes de error ni en logs.
10. `GET /api/jobs` y `/api/jobs/:id` **no** importan ni invocan el cliente Jooble (no regresión; sin llamadas desde requests del candidato).
11. Sin frontend.

## 11. Estrategia de upsert idempotente por `(source, externalId)`

- El índice único es **parcial** (`WHERE "externalId" IS NOT NULL`), por lo que Prisma **no** lo expone como clave compuesta en `where` de `upsert` (Prisma solo genera `source_externalId` si hay `@@unique`). Por tanto **no se usa `prisma.job.upsert` con clave compuesta**.
- **Upsert manual** dentro de una transacción: `findFirst({ where: { source: "JOOBLE", externalId } })` → si existe, `update`; si no, `create`.
- La **condición de carrera** entre find y create queda protegida por el índice único parcial a nivel DB: una colisión lanza `P2002`, que se captura y se resuelve como `update` (o se cuenta como duplicado) sin abortar.
- Las ofertas internas (`externalId = null`) nunca entran en este camino (la ingesta solo crea `JOOBLE`).

## 12. Tratamiento de errores HTTP / timeouts / payload inválido

- **HTTP no-2xx:** `JoobleHttpError` con el status; sin exponer la URL/key. La ingesta aborta con error de dominio.
- **Timeout:** `AbortController` con `timeoutMs`; `AbortError` → `JoobleTimeoutError`.
- **Payload inválido:** `joobleSearchResponseSchema.parse` falla → `JoobleResponseError` (envuelve `ZodError`).
- **Normalización por registro:** `JoobleNormalizationError` capturada en el bucle → descarta ese registro, `skipped++`, continúa.
- Jerarquía sugerida: `JoobleClientError` (base) → `JoobleConfigError`, `JoobleHttpError`, `JoobleTimeoutError`, `JoobleResponseError`. Mapeo a HTTP no aplica (no hay endpoint); son errores server-side de la ingesta.

## 13. Captura de `JoobleNormalizationError`

El servicio envuelve cada `normalizeJoobleJob` en `try/catch` específico de `JoobleNormalizationError`: registra (sin datos sensibles ni key), incrementa `skipped` y continúa. Cualquier otro error inesperado se propaga (no se silencia). Esto implementa la regla de spec "registros inválidos se descartan y se registran sin abortar la ingesta".

## 14. Decisión sobre script manual controlado

- **Decisión:** autorizar en **Fase 5** un script manual `apps/api/scripts/ingest-jooble.ts` ejecutable vía `pnpm --filter @jobit/api exec tsx scripts/ingest-jooble.ts` (mismo patrón que el seed), que llama a `ingestJoobleJobs`. **Sin** tocar `package.json` (sin `db:seed`/script npm) salvo autorización explícita aparte.
- **No** se autoriza cron, scheduler ni n8n (ADR-0011). El disparo es manual y controlado por el operador.
- En **Fase 4B** no se crea el script; solo cliente + servicio + tests.

## 15. Fases siguientes recomendadas

- **Fase 4B — Cliente HTTP (RED→GREEN):** `jooble.client.ts` + `jooble.errors.ts` + tests con `fetch` mockeado (config/HTTP/timeout/respuesta inválida/OK).
- **Fase 4C — Servicio de ingesta (RED→GREEN):** `jooble.ingest.service.ts` + tests (normalización, skip de inválidos, upsert idempotente, no exposición de key) con Prisma real de test y `search` inyectado.
- **Fase 4D — Auditoría + PR** hacia `dev`.
- **Fase 5 (opcional) — Script manual de ingesta** y/o filtro `source` + exposición de `source`/`sourceUrl` en lectura.

## 16. Riesgos

- **`fetch` y `AbortSignal` en Node:** Node 20+ trae `fetch` global; aun así el cliente lo recibe inyectable para test y portabilidad. Verificar la versión de Node del proyecto en 4B.
- **Upsert sin clave única de Prisma:** el índice parcial obliga a find-or-create/update manual; mitigar la carrera capturando `P2002`. Documentado.
- **Fuga de la key:** riesgo si se loguea la URL completa; mitigación: redacción + test que verifica ausencia de la key en errores/logs.
- **Defaults de mapeo DTO→Job:** elegir valores seguros (`status: ACTIVE`, arrays vacíos, `seniority` por defecto) sin inventar datos; cerrar en 4C.
- **Semántica de aborto parcial:** si la persistencia falla a mitad, parte de los jobs ya estarán escritos; documentar que la ingesta es reanudable e idempotente (re-ejecutar actualiza).
- **DB de test única (5434):** los tests de ingesta usan esa DB; sin red externa.

## 17. Criterios de aceptación (Fase 4 implementada, 4B+)

- Cliente HTTP con `fetch` inyectable, timeout y validación Zod de la respuesta.
- Errores de dominio controlados: config (key ausente), HTTP, timeout, respuesta inválida.
- Servicio de ingesta que normaliza, **descarta** inválidos sin abortar y hace **upsert idempotente** por `(source, externalId)`.
- Re-ingesta de la misma oferta no duplica (constraint parcial + upsert manual).
- Ningún test hace red; ninguno usa la `JOOBLE_API_KEY` real; la key no aparece en logs/errores.
- `GET /api/jobs` y `/api/jobs/:id` sin cambios ni llamadas a Jooble; suite previa sin regresiones.
- Sin endpoints nuevos, sin frontend, sin cron/scheduler, sin cambios en manifests.
```
