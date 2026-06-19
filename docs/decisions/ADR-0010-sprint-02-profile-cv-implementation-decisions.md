# ADR-0010: Decisiones de implementación — Sprint 02 Candidate Profile + CV

## Estado

Accepted.

## Fecha

2026-06-19

## Contexto

El Sprint 02 implementa el módulo M02 (Candidate Profile + CV) conforme a la spec `docs/specs/features/candidate-profile-cv.md` y a las decisiones arquitectónicas de ADR-0005 (Express + Zod), ADR-0006 (JWT híbrido), ADR-0007 (REST `/api`) y ADR-0008 (PostgreSQL + Prisma). Construye sobre el módulo M01 Auth, mergeado en `dev` mediante PR #12, y **no lo reimplementa ni lo modifica**.

La fase SDD Review del sprint (PASS_WITH_NOTES) contrastó la spec contra los ADR aplicables e identificó ocho decisiones técnicas que la spec y los ADR previos dejaron abiertas o que entran en tensión con el estado real entregado en Sprint 01. La más sensible es la creación del `CandidateProfile`: ADR-0008 y la spec afirman que el perfil "se crea automáticamente al registrar el usuario", pero el endpoint `register` ya entregado no crea perfil y queda fuera del alcance modificable de este sprint.

Este ADR cierra esas decisiones antes de TDD Planning y de cualquier implementación, evitando que se adopten implícitamente durante la escritura de código y garantizando trazabilidad documental. Las decisiones D-1 a D-8 se registran aquí como contrato de implementación del Sprint 02.

Este ADR no modifica la spec. Cuando una decisión concreta o reinterpreta un detalle de la spec o de un ADR previo, se documenta explícitamente en la sección correspondiente.

## Decisión

### D-1 — Rutas API bajo prefijo `/api`

Todos los endpoints del módulo Profile se implementan bajo el prefijo `/api`, conforme a ADR-0007. La spec lista las rutas como `/profile/me*`; la tabla de equivalencias de ADR-0007 ya las mapea al prefijo `/api`. Rutas resultantes:

- `GET /api/profile/me` — obtener perfil del candidato autenticado (con creación lazy, ver D-2).
- `PUT /api/profile/me` — actualizar datos básicos.
- `POST /api/profile/me/skills` · `DELETE /api/profile/me/skills/:id`
- `POST /api/profile/me/experience` · `PUT /api/profile/me/experience/:id` · `DELETE /api/profile/me/experience/:id`
- `POST /api/profile/me/education` · `PUT /api/profile/me/education/:id` · `DELETE /api/profile/me/education/:id`
- `POST /api/profile/me/projects` · `PUT /api/profile/me/projects/:id` · `DELETE /api/profile/me/projects/:id`
- `PUT /api/profile/me/links` — actualización (upsert) del conjunto de enlaces.
- `PUT /api/profile/me/preferences` — actualización (upsert) de preferencias laborales.

Los métodos `PUT` definidos en la spec (links, preferences, actualización de sub-recursos) quedan aceptados tal como están, conforme a ADR-0007 (L40): `PUT` se mantiene donde la spec ya lo define.

### D-2 — Creación lazy de `CandidateProfile`

El `CandidateProfile` se crea de forma **lazy** (diferida) en el primer `GET /api/profile/me` de un usuario autenticado: si no existe perfil para `req.auth.userId`, se crea uno vacío y se devuelve; si existe, se devuelve el existente.

**No se modifica el flujo de `register` de Sprint 01 Auth.** Esto preserva el alcance del sprint (Auth no se toca) y reduce el riesgo de regresión sobre un módulo ya entregado y testado.

**Concreción/superseción documental:** ADR-0008 (modelo conceptual) y la spec (regla de negocio L156) afirman que el perfil "se crea automáticamente al registrar el usuario". Esta decisión concreta ese detalle: la creación automática se realiza en el primer acceso a `GET /api/profile/me`, no en el flujo de registro. El criterio de aceptación de la spec "el candidato puede ver su perfil vacío tras registrarse" se satisface **conductualmente**: tras registrarse, el primer `GET /api/profile/me` devuelve un perfil vacío. El test mínimo de la spec redactado como "crear perfil vacío al registrar usuario → perfil existe" se **reinterpreta** en este sprint como "el primer `GET /api/profile/me` crea y devuelve un perfil vacío con el `userId` correcto". No se edita la spec; la reinterpretación queda registrada aquí.

`GET /api/profile/me` debe ser **idempotente**: invocarlo varias veces no crea perfiles duplicados (un único perfil por `userId`, garantizado por la unicidad 1:1).

### D-3 — Ownership y acceso a recursos ajenos

- El `userId` se obtiene **siempre** de `req.auth.userId`, poblado por el middleware `requireAuth` a partir del access token verificado.
- **Nunca** se acepta `userId` (ni `profileId`) desde el body, la query ni los params de la petición.
- **Todas** las rutas del módulo Profile pasan por `requireAuth`. No hay endpoints públicos.
- Para operaciones sobre sub-recursos por id (`/skills/:id`, `/experience/:id`, `/education/:id`, `/projects/:id`), el servidor verifica que el sub-recurso pertenece al `CandidateProfile` del usuario autenticado **antes** de leer, actualizar o borrar. Un id que pertenece a otro usuario devuelve **`403 FORBIDDEN`** (code `FORBIDDEN`), conforme a ADR-0007 (L51) y al test mínimo de la spec (L210).
- `401 UNAUTHORIZED` queda reservado para el usuario no autenticado (token ausente, inválido o expirado), gestionado por `requireAuth`.

### D-4 — Completitud básica del perfil

`GET /api/profile/me` devuelve un campo derivado `completionPercentage`: entero de 0 a 100, no persistido, calculado en cada lectura sobre **7 secciones**:

1. `basicInfo` — completa si `firstName` **y** `lastName` están informados.
2. `skills` — completa si hay al menos un elemento.
3. `experience` — completa si hay al menos un elemento.
4. `education` — completa si hay al menos un elemento.
5. `projects` — completa si hay al menos un elemento.
6. `links` — completa si hay al menos un elemento.
7. `preferences` — completa si existe registro de preferencias con al menos un campo significativo informado.

Fórmula: `Math.round((completedSections / 7) * 100)`. Un perfil recién creado (vacío) devuelve `0`.

### D-5 — `JobPreferences` como tabla 1:1 separada

`JobPreferences` se implementa como **tabla separada con relación 1:1** con `CandidateProfile` (no como columnas embebidas en `CandidateProfile`), conforme al modelo de la spec y resolviendo la decisión abierta de ADR-0008 (L248). Motivos: encaja con los campos array nativos de PostgreSQL (`desiredRoles`, `preferredLocations`, `contractTypes`), aísla un bloque opcional del perfil y simplifica el upsert.

- `PUT /api/profile/me/preferences` realiza un **upsert** (crea si no existe, actualiza si existe) sobre el perfil del usuario autenticado.
- El salario es un dato **privado** (no visible para otros en el MVP).
- Validación: `salaryMin > 0` y `salaryMax >= salaryMin` cuando ambos existan.

### D-6 — Unicidad de skills case-insensitive

Se evita la duplicación de skills por perfil de forma **case-insensitive**:

- Se normaliza el nombre con `trim().toLowerCase()` en un campo interno `normalizedName`.
- Constraint único compuesto `@@unique([profileId, normalizedName])`.
- `React` y `react` (y `  react `) se consideran la misma skill: el segundo intento devuelve `409 CONFLICT`.
- El campo `name` conserva el valor original tal como lo introdujo el candidato (p. ej. "React").
- `normalizedName` es un detalle de implementación: **no se expone** en las respuestas de la API.

### D-7 — Validaciones de `Experience`

- `startDate <= endDate` (cuando `endDate` exista).
- Si `current === true`, entonces `endDate` debe ser `null`.
- La regla de **solapamiento** de experiencias actuales (spec L160, redacción ambigua y ausente de la tabla de validaciones) queda **deferred / fuera de Sprint 02**, salvo que el operador la autorice explícitamente en una fase posterior. No entra en los tests mínimos de este sprint.

### D-8 — Disciplina TDD del sprint

- Ninguna fase de implementación comienza directamente por código productivo.
- Cada fase comienza con tests o con un contrato TDD aprobado por el operador (Red-Green-Refactor donde aporte claridad).
- Ownership (D-3) y validaciones (D-5, D-6, D-7) requieren **tests de integración** (Supertest contra PostgreSQL `jobit_test`), con un caso explícito de acceso a recurso ajeno que devuelva 403.
- La fase de schema Prisma + migración puede justificarse sin test unitario previo, por ser infraestructura: la verificación se hace por inspección de la migración generada y `prisma migrate deploy` contra `jobit_test` (conforme a `tdd-guidelines.md`).
- Estilo de tests heredado de ADR-0009: un archivo de test por área de endpoint, aislamiento por `TRUNCATE ... RESTART IDENTITY CASCADE` en `beforeEach`, `fileParallelism: false`.

## Consecuencias

**Positivas:**
- **No se toca Auth.** La creación lazy (D-2) evita modificar el `register` ya entregado, reduciendo el riesgo de regresión sobre un módulo mergeado y testado.
- `GET /api/profile/me` es idempotente: múltiples llamadas no generan perfiles duplicados.
- El ownership estricto (D-3) y el `userId` siempre del token aplican el principio de mínimo privilegio de forma coherente con ADR-0007 y ADR-0008, y sientan la base de seguridad para los módulos privados posteriores (M03 Jobs, M04 Saved Jobs, M05 Match, M06 Dashboard).
- Las respuestas de la API **no incluyen datos sensibles**: sin `passwordHash`, sin `normalizedName`, sin campos internos de tokens. El salario permanece privado.
- El diseño prepara M03 y M04/M05 sin exponer un perfil público: todo el perfil es privado al candidato autenticado.
- La completitud derivada (D-4) no añade estado persistente que mantener sincronizado.

**Negativas / coste asumido:**
- La creación lazy diverge de la letra de ADR-0008/spec sobre creación en register; se acepta y documenta aquí como concreción.
- El cálculo de `completionPercentage` en cada `GET /me` implica contar sub-recursos; coste despreciable en el MVP.
- `normalizedName` añade una columna interna por skill; coste mínimo frente a la garantía de unicidad case-insensitive en la capa de DB.

## Alternativas consideradas

- **Crear el perfil en `register` (D-2):** descartada para este sprint porque obliga a modificar el módulo Auth ya entregado, fuera del alcance del Sprint 02 y con riesgo de regresión. Podría reconsiderarse en un sprint que toque Auth explícitamente.
- **Endpoint explícito de inicialización de perfil (D-2):** descartada por añadir un paso extra al cliente sin valor frente a la creación lazy transparente.
- **`404 NOT_FOUND` para recurso ajeno (D-3):** descartada frente a `403 FORBIDDEN` porque la spec (test L210) y ADR-0007 (L51) especifican 403 para "autenticado sin autorización". El 404 (no revelar existencia) no es lo que pide la spec en este módulo.
- **`JobPreferences` como columnas en `CandidateProfile` (D-5):** descartada frente a tabla 1:1 por la presencia de campos array y por mantener el bloque opcional aislado; coherente con el modelo de la spec.
- **Unicidad de skills case-sensitive (D-6):** descartada porque permitiría "React" y "react" como duplicados efectivos, contradiciendo la intención de la spec (L172, "no duplicada en el mismo perfil").

## Relación con la spec

- Concreta el criterio de aceptación "ver perfil vacío tras registrarse" y reinterpreta el test mínimo de creación de perfil bajo la creación lazy (D-2), sin editar la spec.
- Mantiene los modelos, endpoints, reglas de negocio y validaciones de la spec; concreta las que estaban abiertas (completitud D-4, unicidad de skills D-6, preferencias D-5, experiencia D-7).
- Difiere la regla de solapamiento de experiencias (D-7), no incluida en los tests mínimos.

## Relación con ADR-0007, ADR-0008 y ADR-0009

- **ADR-0007:** D-1 aplica el prefijo `/api`; D-3 aplica `userId` del token, ownership y los códigos `401`/`403`/`409` y el formato de error `{ error: { code, message } }`.
- **ADR-0008:** D-5 resuelve la decisión abierta de `JobPreferences` (tabla 1:1); D-6 resuelve la decisión abierta de unicidad de skills (case-insensitive); D-2 concreta la creación del perfil respecto al modelo conceptual.
- **ADR-0009:** D-8 hereda el estilo de tests de Auth (Supertest, PostgreSQL real `jobit_test`, `TRUNCATE` en `beforeEach`, `fileParallelism: false`, un archivo por área de endpoint).

## Impacto en TDD

- Las fases de implementación se ordenan por área de endpoint; cada una empieza por tests (D-8).
- Tests de integración obligatorios para ownership (403 en recurso ajeno) y para cada regla de validación (D-5, D-6, D-7).
- La fase de schema/migración se verifica por inspección + `migrate deploy` contra `jobit_test`.
- La cobertura mínima objetivo son los 10 tests de la spec, reinterpretando el de creación de perfil según D-2.

## Fuera de alcance

- Frontend (Next.js, `apps/web`).
- Dashboard.
- Perfil público visible para terceros.
- Jobs.
- Saved jobs.
- Match.
- Recruiters.
- Admin.
- Exportación a PDF.
- Importación desde LinkedIn o CV externo.
- Subida de foto / archivos (solo URL externa).
- IA de cualquier tipo.
- Deploy a cualquier entorno.
- CI/CD.
