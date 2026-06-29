# Sprint 05 — Match básico explicable — TDD Plan

> Plan de tests previo a la implementación. No escribe tests ni toca código.
> Fija casos RED, fixtures, helpers reutilizables y el orden RED→GREEN del módulo
> `match` antes de crear nada.

## 1. Objetivo del plan

Fijar **antes de implementar** qué tests se escribirán, en qué orden y qué deben verificar, de modo que el módulo Match se construya por TDD (RED→GREEN) sobre el contrato y el algoritmo ya cerrados en SDD Review. El plan separa la lógica **pura** de scoring (unit) del **contrato HTTP** (integración).

## 2. Estado previo

- **Rama:** `feat/sprint-05-match-basic`.
- **Commits documentales previos:** `37be9cc` (agent brief), `4dae6d1` (spec alineada tras SDD Review).
- **Spec alineada:** `docs/specs/features/match-basic.md` (endpoints, contrato, pesos, niveles, mapeo).
- **Implementación:** pendiente (no existe `apps/api/src/match/`).
- **Tests de Match:** no existen todavía.

## 3. Contrato bajo prueba

- **Endpoints (privados, `requireAuth`):** `GET /api/jobs/:id/match`, `GET /api/profile/me/matches`.
- **Autenticación:** sin sesión → `401 UNAUTHORIZED`.
- **Identidad:** `userId` **siempre** desde `req.auth.userId`; nunca de body/query/params.
- **Response `/jobs/:id/match`:** `{ jobId, score, level, matchedSkills, missingSkills, factors[], explanation }`.
- **Response `/profile/me/matches`:** `{ data: [{ job (JobPublicDto), score, level, matchedSkills, missingSkills }] }`, orden `score` desc, `limit` (default 10, máx 50).
- **Errores esperados:** `401` sin sesión; `400` UUID inválido / `limit` inválido; `404` oferta no disponible (inexistente/cerrada/expirada).
- **Campos prohibidos:** `externalId`, `ingestedAt` (en cualquier nivel).
- **Límites éticos:** score determinista y explicable, sin IA/ML/embeddings/LLM, sin llamadas a Jooble, orientativo (no bloquea explorar/guardar).

## 4. Estrategia TDD

1. Tests **unitarios RED** de scoring puro (`match.scoring`).
2. Tests **integración RED** de `GET /api/jobs/:id/match`.
3. Tests **integración RED** de `GET /api/profile/me/matches`.
4. **Implementación GREEN mínima** (`match.scoring.ts`, `match.service.ts`, `match.schemas.ts`, `match.types.ts`, `match.router.ts`, montaje aditivo en `app.ts`).
5. **Refactor seguro** sin cambiar contrato.
6. **Verificaciones finales** (test, typecheck, build, diff-check).

## 5. Tests unitarios propuestos — `match.scoring`

Función pura determinista (entradas: skills normalizadas del candidato, preferencias, oferta; salida: `{ score, level, matchedSkills, missingSkills, factors, explanation }`).

- **Determinismo:** mismas entradas → mismo resultado (sin aleatoriedad).
- **Skills (peso 50):**
  - coincidencia parcial → `score_skills = 50 * matched/total` (redondeo definido);
  - `matchedSkills` ordenados alfabéticamente;
  - `missingSkills` ordenados alfabéticamente;
  - candidato sin skills → factor `match: null`, contribución 0;
  - oferta sin tags → factor `match: null` "no aplica", contribución 0.
- **Modalidad (peso 20):**
  - `remotePreference = ANY` → match (20);
  - coincidencia exacta `remotePreference == remoteType` → 20;
  - mismatch → 0;
  - `Job.remoteType = UNSPECIFIED` o preferencia ausente → `null`.
- **Seniority (peso 20):**
  - coincidencia exacta → 20;
  - mismatch → 0;
  - `Job.seniority = ANY` → match (20);
  - preferencia ausente → `null`.
- **Ubicación (peso 10):**
  - oferta `REMOTE` → `null` "no aplica";
  - coincidencia case-insensitive (`Job.location` ∈ `preferredLocations`) → 10;
  - mismatch → 0;
  - ubicación o preferencias ausentes → `null`.
- **Perfil incompleto:**
  - factores sin datos → `match: null`;
  - `explanation` incluye invitación a completar el perfil.
- **Niveles (fronteras):** 25/26 (VERY_LOW→LOW), 50/51 (LOW→GOOD), 75/76 (GOOD→VERY_GOOD).
- **Suma de pesos:**
  - máximo 100 (todos los factores aplican y coinciden);
  - mínimo 0 (ningún factor coincide o todos `null`);
  - **sin renormalización** de factores ausentes (los `null` contribuyen 0).

## 6. Tests integración — `GET /api/jobs/:id/match`

- `401` sin sesión;
- `400` con `:id` de forma UUID inválida;
- `404` (contrato) para job inexistente (UUID válido);
- `404` (contrato) para job inactivo/cerrado/expirado;
- `200` con usuario autenticado y job **INTERNAL**;
- `200` con usuario autenticado y job **JOOBLE** persistido;
- response **incluye** `jobId`, `score`, `level`, `matchedSkills`, `missingSkills`, `factors`, `explanation`;
- response **NO incluye** `externalId` ni `ingestedAt` (assert por propiedad y `JSON.stringify`);
- **no acepta** `userId` desde query/body/params (se ignora; usa el del token);
- usa el **perfil del usuario autenticado**;
- **perfil incompleto** → `200` con `explanation`, sin bloqueo;
- **no** llama a Jooble ni red externa.

**Guard anti-falso-positivo (404):** los casos `404` usarán un helper tipo `assertContract404` que descarte el mensaje genérico `"Route … not found."` del `notFoundMiddleware`, garantizando que el `404` es de contrato (oferta no disponible) y no de ruta no montada — manteniéndolos en RED hasta implementar.

## 7. Tests integración — `GET /api/profile/me/matches`

- `401` sin sesión;
- `400` si `limit` no es número válido;
- `400` si `limit` supera 50 (o `< 1`);
- `200` con `{ data: [] }` si no hay ofertas activas;
- `200` con listado **ordenado por `score` desc**;
- **default** `limit = 10`;
- **máximo** `limit = 50`;
- cada item incluye `job` vía **`JobPublicDto`**;
- cada item incluye `score`, `level`, `matchedSkills`, `missingSkills`;
- **no** incluye `externalId` ni `ingestedAt`;
- incluye ofertas **INTERNAL y JOOBLE** persistidas;
- **solo ofertas activas** (excluye cerradas/expiradas);
- **aislamiento por usuario:** A y B con perfiles distintos obtienen resultados acordes a su propio perfil; `userId` en query **no** cambia identidad.

## 8. Datos de prueba necesarios

Fixtures mínimos (a crear en la fase RED, inline con Prisma; no ahora):

- usuario autenticado (helper `registerUser`); segundo usuario para aislamiento;
- `CandidateProfile` con `Skill[]` (vía servicio o Prisma directo);
- `JobPreferences` (remotePreference, seniority, preferredLocations);
- oferta **INTERNAL** activa con `tags`;
- oferta **JOOBLE** persistida (source JOOBLE, externalId/sourceUrl/ingestedAt poblados, sin red);
- oferta **sin tags**;
- oferta **REMOTE**;
- oferta **HYBRID/ON_SITE**;
- oferta con `seniority` concreto y otra `ANY`;
- oferta **inactiva/cerrada/expirada** (status CLOSED o expiresAt pasado) para el `404` de `/jobs/:id/match` y exclusión en `/profile/me/matches`.

## 9. Helpers y patrones existentes a reutilizar

- **Vitest + Supertest**, `globalSetup` (`src/tests/setup.ts`, `prisma migrate deploy`, `fileParallelism:false`).
- **`truncateTables(prisma)`** en `beforeEach` (ya incluye `SavedJob`, `Job`, `User`, etc.).
- **`registerUser(email)`** → `POST /api/auth/register` → `{ accessToken, userId }`; header `Authorization: Bearer`.
- **Patrón de Saved Jobs** (`saved-jobs.integration.test.ts`): fixtures inline `prisma.job.create`, `itemsOf`, `assertPublicJob`, **`assertContract404`** (a replicar para los 404 de contrato).
- **Serialización pública:** `serializeJob`/`JobPublicDto` (`apps/api/src/jobs/jobs.serializer.ts`) para el job embebido.
- **Perfil:** `getOrCreateCandidateProfile(userId)` (devuelve skills + preferences) como fuente de datos del candidato.
- **404 semántico de oferta:** `getActiveJobById(id)` (`JobsError` 404 "Oferta no disponible").

## 10. Criterios RED

Los tests deben fallar inicialmente **por ausencia de implementación/ruta**, no por setup/sintaxis:

- rutas `/api/jobs/:id/match` y `/api/profile/me/matches` **no montadas** → 404 de ruta;
- módulo `apps/api/src/match/` **inexistente**;
- función `match.scoring` **inexistente** (unit no compila/ejecuta hasta crearla);
- respuestas `401/400/404/200` **no cumplen** el contrato esperado;
- campos prohibidos no verificables aún;
- orden por `score` y `explanation` no disponibles.

Para los `404` de contrato, el guard `assertContract404` evita el falso verde contra el `404` genérico de ruta no montada.

## 11. Criterios GREEN

- Todos los tests planificados (unit + integración) pasan.
- Contrato estable (`score`/`level`/`factors`/`matchedSkills`/`missingSkills`/`explanation`; `{data:[...]}` con `JobPublicDto`).
- Scoring **determinista** y **explicable**.
- Seguridad/privacidad correctas (`requireAuth`, `userId` de token, sin `externalId`/`ingestedAt`, aislamiento por usuario).
- **Sin IA/ML** ni llamadas externas.
- typecheck y build verdes.

## 12. Verificaciones finales del sprint

- `pnpm --filter @jobit/api test`
- `pnpm --filter @jobit/api typecheck`
- `pnpm --filter @jobit/api build`
- `git diff --check`
- `git status --short`

`lint` se documentará como **deuda preexistente** si no hay script `lint` en `@jobit/api` (a día de hoy no existe).

## 13. Riesgos y controles

- **Rutas sin `requireAuth`** → test `401` obligatorio en ambos endpoints.
- **`userId` desde cliente** → tests que envían `userId` por body/query y verifican que se ignora.
- **Exposición de `externalId`/`ingestedAt`** → asserts por propiedad y `JSON.stringify` en todas las respuestas con job.
- **Falso positivo de `404`** por ruta no montada → `assertContract404`.
- **Tests acoplados a datos frágiles** → fixtures deterministas, `matchedSkills`/`missingSkills` ordenados, `savedAt`/orden controlados; fronteras de nivel exactas.
- **Score opaco** → unit que verifican el desglose y la contribución de cada factor.
- **Scope creep** (dashboard/frontend/recruiter) → solo los dos endpoints; sin UI ni ranking para empresas.
- **Tocar Prisma sin necesidad** → no se prevé entidad nueva; el match se calcula en tiempo de petición (sin migración).
