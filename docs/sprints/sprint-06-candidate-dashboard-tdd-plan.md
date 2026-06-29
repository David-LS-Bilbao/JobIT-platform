# Sprint 06 — Candidate Dashboard TDD Plan

> Plan de tests previo a las fases RED/GREEN. Traduce la SDD Review en casos
> concretos, verificables y alineados con el backend real. No crea tests ni
> código todavía.
>
> Fuentes: [brief de Fase 0](sprint-06-candidate-dashboard-agent-brief.md),
> [spec dashboard](../specs/features/dashboard.md),
> [tdd-guidelines](../agents/tdd-guidelines.md).

## Estado de partida

- **Rama:** `feat/sprint-06-candidate-dashboard` (working tree limpio salvo docs del sprint).
- **Fase previa:** SDD Review completada → `READY_FOR_TDD_PLANNING`.
- **Brief existente:** [sprint-06-candidate-dashboard-agent-brief.md](sprint-06-candidate-dashboard-agent-brief.md).
- **Endpoint decidido:** `GET /api/dashboard/me`.
- **Decisiones SDD relevantes:** Opción A (endpoint agregado), `requireAuth`,
  `userId` solo de `req.auth.userId`, sin body/query obligatorios,
  `completionPercentage` (no `completeness`), `missingFields` y `metrics`
  separado **fuera del MVP**, `savedJobs.recent` limitado a 3,
  `matches` = `getTopMatchesForUser(userId, 3)`, reutilizar `serializeJob`,
  `nextActions` determinista, tolerancia por bloque pospuesta (fallo global por
  el error handler), sin ADR ni spec update.

## Objetivo del plan TDD

Definir, **antes** de escribir tests RED o implementar, el conjunto de casos que
fijan el contrato y la seguridad del endpoint del dashboard. La fase RED escribirá
estos tests (que fallarán porque el módulo no existe); la fase GREEN implementará
el mínimo para hacerlos pasar sin romper los tests existentes.

## Contrato bajo prueba

- **Método y ruta:** `GET /api/dashboard/me`.
- **Auth requerida:** sí, `requireAuth` (Bearer access token).
- **Request:** sin body; sin query params obligatorios (un `limit` por query, si
  se añadiese, sería opcional; el MVP fija 3 internamente).
- **userId:** exclusivamente `req.auth.userId`; body/query/params nunca aportan identidad.
- **Shape esperado de respuesta (`200`):**

```jsonc
{
  "profile": {
    "firstName": "string|null",
    "lastName": "string|null",
    "headline": "string|null",
    "completionPercentage": 0          // entero 0..100
  },
  "skills": ["string"],
  "savedJobs": {
    "total": 0,
    "recent": [ { "savedAt": "ISO", "job": { /* JobPublicDto */ } } ]  // máx 3
  },
  "matches": [                          // máx 3
    { "job": { /* JobPublicDto */ }, "score": 0, "level": "string",
      "matchedSkills": ["string"], "missingSkills": ["string"] }
  ],
  "nextActions": [ { "action": "string", "label": "string" } ]
}
```

- **Campos prohibidos en cualquier punto de la respuesta:** `externalId`,
  `ingestedAt`, `passwordHash`, `tokenHash`, refresh tokens, y datos de `User`
  no necesarios (p. ej. email, role, hashes). `source`/`sourceUrl` **sí** pueden
  aparecer dentro de `JobPublicDto` (son públicos).

## Estrategia de test

- **Tipo principal:** test de **integración** con **Supertest + Vitest** contra
  `app` real y base de datos real, siguiendo el patrón del repo
  ([saved-jobs.integration.test.ts](../../apps/api/src/saved-jobs/saved-jobs.integration.test.ts),
  [match.profile.integration.test.ts](../../apps/api/src/match/match.profile.integration.test.ts)).
- **Helpers/factories existentes:** **no hay** `test-utils` compartido. Cada
  archivo de test define localmente: `registerUser(email)` (vía
  `POST /api/auth/register`, devuelve `{ accessToken, userId }`),
  `jobInput()`/`createJob()` (vía `prisma.job.create`), y siembra perfil/skills/
  preferencias a través de los endpoints reales de Profile. Se reutilizará este
  mismo patrón **local** en el archivo de test del dashboard; no se crea un
  módulo de helpers nuevo salvo necesidad clara en RED.
- **Aislamiento de datos:** `beforeEach` con `truncateTables` de
  [tests/setup.js](../../apps/api/src/tests/setup.js), igual que el resto.
- **Tests unitarios:** **no** se planifican unitarios propios del dashboard en el
  MVP; la lógica de scoring/completitud ya está cubierta por M02/M05. El dashboard
  es composición → se valida mejor por integración. Única excepción posible:
  un unitario de `nextActions` si la derivación creciera; por ahora se cubre por
  integración.
- **Preparación de datos:** mínima por grupo, creando solo lo necesario (usuario,
  perfil, skills, jobs ACTIVE, saved jobs con `savedAt` controlado).
- **Validación de ausencia de campos internos:** serializar el body a texto
  (`JSON.stringify(res.body)`) y afirmar que **no** contiene `externalId`,
  `ingestedAt`, `passwordHash`, `tokenHash`; además aserciones puntuales sobre
  `job` embebido. Patrón ya usado en Saved Jobs/Match.
- **Validación de ownership:** crear usuario A y usuario B con datos distintos;
  afirmar que el dashboard de cada uno contiene solo lo propio; enviar
  `?userId=<otro>` y body para comprobar que se ignora.

## Casos de test RED previstos

> Nota RED: mientras `/api/dashboard/me` no esté montado, las peticiones caen en
> `notFoundMiddleware` (404 genérico). Como **ningún** caso del dashboard espera
> un 404 de dominio, todos fallan de forma natural en RED (esperan 200/401),
> evitando falsos verdes.

### Auth
- `GET /api/dashboard/me` sin token → `401`.
- `GET /api/dashboard/me` con token inválido/malformado → `401`.

### Ownership
- Usuario A con perfil/guardadas/matches propios → su dashboard solo refleja lo suyo.
- Usuario B (datos distintos o vacíos) → no ve nada de A.
- `?userId=<id de A>` y/o body con `userId` enviados por B → se ignoran; B sigue
  viendo solo sus datos.

### Contract / DTO
- `200` con claves presentes: `profile`, `skills`, `savedJobs`, `matches`, `nextActions`.
- `profile.completionPercentage` es entero entre 0 y 100.
- Se usa `completionPercentage` (la clave `completeness` **no** aparece).
- `savedJobs` contiene `total` (number) y `recent` (array).
- `matches` es array.
- `nextActions` es array.

### Empty states
- Usuario recién registrado (perfil auto-creado vacío) → shape estable, sin error.
- Sin saved jobs → `savedJobs.total === 0` y `savedJobs.recent === []`.
- Sin matches (sin jobs activos) → `matches === []`.
- Perfil incompleto → `completionPercentage` bajo pero el endpoint responde `200`.

### Saved Jobs composition
- Con 4 ofertas guardadas → `savedJobs.total === 4`.
- `savedJobs.recent` contiene exactamente 3 elementos.
- `savedJobs.recent` respeta orden `savedAt` desc (controlando `savedAt` al sembrar).
- `savedJobs.recent[].job` usa contrato público (`JobPublicDto`): tiene `id`,
  `title`, `source`; no `externalId` ni `ingestedAt`.

### Match composition
- `matches` contiene como máximo 3 elementos.
- Con datos suficientes, `matches` están ordenados por `score` desc.
- `matches[].job` usa contrato público (`JobPublicDto`).
- Cada item conserva info explicable pública: `score`, `level`, `matchedSkills`,
  `missingSkills`.

### Serialization / Security
- `JSON.stringify(res.body)` no contiene `externalId`.
- ... no contiene `ingestedAt`.
- ... no contiene `passwordHash`.
- ... no contiene `tokenHash`.
- ... no contiene refresh tokens.
- No aparece información de `User` innecesaria (email, role, hashes).
- `source`/`sourceUrl` **pueden** aparecer dentro de `JobPublicDto` (válido).

### nextActions
- Perfil incompleto → incluye una acción de completar perfil (p. ej. `complete_profile`).
- Sin saved jobs o sin matches → puede sugerir explorar ofertas (p. ej. `explore_jobs`).
- No contiene evaluación automatizada ni ranking para recruiters.
- Determinista: el mismo estado produce las mismas `nextActions` (dos llamadas → igual salida).

### No external / no AI
- El endpoint no realiza llamadas reales a Jooble (tests sin red; sin `JOOBLE_API_KEY`).
- No usa LLMs, embeddings ni IA avanzada (composición determinista).
- No crea persistencia nueva (no aparece entidad/tabla nueva; sin migraciones).

## Datos de prueba necesarios

- **Usuarios:** vía `registerUser(email)` (crea User + perfil vacío + accessToken).
  Para ownership: al menos A y B.
- **Perfiles:** auto-creados al registrar; completar parcialmente para casos de
  `completionPercentage` y `nextActions` (basic info, skills, preferencias).
- **Skills:** añadir vía `POST /api/profile/me/skills` para alimentar match y el
  bloque `skills`.
- **Jobs persistidos:** crear con `prisma.job.create` (`jobInput`/`createJob`):
  varios `ACTIVE` (para matches), al menos uno `INTERNAL` y uno `JOOBLE` (con
  `externalId`/`ingestedAt` no nulos) para verificar que **no** se filtran.
- **Saved jobs:** crear ≥4 con `savedAt` controlado para validar `total`, límite 3
  y orden.
- **Datos que permitan matches:** preferencias + skills del candidato que
  intersecten con `tags` de las ofertas (patrón de `match.profile.integration.test.ts`).

No existen factories compartidas; se reutilizará el patrón local por archivo. Si
en RED se observa duplicación excesiva entre grupos, se podrá extraer un helper
**local** dentro del propio archivo de test (no un módulo nuevo de test-utils).

## Archivos previstos para fase RED

- `apps/api/src/dashboard/dashboard.integration.test.ts` — único archivo de tests
  RED del dashboard (coherente con el patrón un-router/un-archivo de integración
  de Saved Jobs). Si los grupos crecen mucho, se podría dividir en
  `dashboard.contract.integration.test.ts` y `dashboard.security.integration.test.ts`,
  pero se parte de un solo archivo.

## Archivos previstos para fase GREEN

- `apps/api/src/dashboard/dashboard.router.ts` — define `GET /me`, monta `requireAuth`.
- `apps/api/src/dashboard/dashboard.service.ts` — compone Profile/Saved Jobs/Match.
- `apps/api/src/dashboard/dashboard.types.ts` — DTO de respuesta (sin schema de
  entrada, ya que no hay body/query obligatorios; `dashboard.schemas.ts` solo si
  se añade validación de un `limit` opcional).
- Registro en `apps/api/src/app.ts` — `app.use("/api/dashboard", dashboardRouter)`
  (o `app.use("/api", ...)` con ruta completa, a confirmar en GREEN siguiendo el
  estilo existente).

## Criterios de aceptación TDD

**RED correcto:**
- Los tests fallan porque el endpoint/módulo no existe (404 de `notFoundMiddleware`
  o ausencia de claves), **no** por errores de setup/datos.
- Los tests expresan contrato (claves, tipos, límites, orden) y seguridad
  (ownership, campos prohibidos).
- No se implementa código de producción en RED.

**GREEN correcto:**
- Todos los tests nuevos del dashboard pasan.
- Todos los tests existentes siguen pasando (`pnpm --filter @jobit/api test`).
- `typecheck` pasa.
- `build` pasa.
- Ningún campo interno (`externalId`, `ingestedAt`, `passwordHash`, `tokenHash`)
  aparece en la respuesta.

## Riesgos TDD

- **Tests acoplados a datos internos:** afirmar sobre IDs/fechas exactas frágiles;
  preferir aserciones de forma, conteo y orden relativo.
- **Duplicar serializer de Jobs:** validar que el `job` embebido proviene de
  `serializeJob` (vía Saved Jobs/Match), no de un mapeo manual.
- **Orden no garantizado:** controlar `savedAt` al sembrar para aserciones de
  orden; para matches, construir scores claramente distintos.
- **Datos de match frágiles:** usar intersección skills/tags explícita y estable.
- **Confundir `completionPercentage` con `completeness`:** afirmar la clave exacta
  del backend y que la otra no existe.
- **Exponer campos internos con Prisma sin serializer:** test de seguridad sobre
  `JSON.stringify(body)`.
- **Forzar `missingFields`/`metrics`:** no testearlos; están fuera del MVP.

## Checklist antes de pasar a RED

- [ ] Plan revisado por el operador.
- [ ] Contrato cerrado (endpoint, auth, DTO, campos prohibidos).
- [ ] Archivos permitidos para RED definidos (`apps/api/src/dashboard/**`).
- [ ] No hay spec update pendiente (`NO_SPEC_UPDATE_REQUIRED`).
- [ ] No hay ADR pendiente.
- [ ] Rama correcta (`feat/sprint-06-candidate-dashboard`).
- [ ] Working tree esperado (solo docs del sprint sin seguimiento).
