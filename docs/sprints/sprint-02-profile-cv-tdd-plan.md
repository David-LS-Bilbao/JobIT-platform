# Plan TDD — Sprint 02 Candidate Profile + CV

## Objetivo del plan

Traducir la spec `docs/specs/features/candidate-profile-cv.md` y las decisiones de `ADR-0010` a una estrategia TDD concreta y por fases, de modo que ningún prompt de implementación posterior empiece por código productivo. Cada fase define los tests primero, el fallo esperado (rojo), la implementación mínima (verde) y la verificación. Este documento es un plan; **no crea tests ni código**.

## Alcance

- Estrategia TDD por fases para los endpoints privados de Profile bajo `/api/profile/me*`.
- Definición de archivos de test esperados (sin crearlos) y archivos productivos futuros (sin crearlos).
- Tests mínimos por fase, alineados con los 10 tests mínimos de la spec y con ADR-0010 (D-1 a D-8).
- Precondiciones de entorno y comandos de verificación previstos.
- Reglas de seguridad TDD (ownership, `userId` del token, errores normalizados).

## Fuera de alcance

Frontend, dashboard, perfil público, jobs, saved jobs, match, recruiters, admin, exportación PDF, importación LinkedIn/CV, subida de foto (solo URL externa), IA, deploy, Docker, CI/CD, monetización. Tampoco se reimplementa ni modifica Auth, ni se modifica el flujo de `register`.

## Precondiciones de entorno

- Rama `feat/sprint-02-profile-cv`, cortada de `dev` con Sprint 01 Auth incluido (PR #12).
- Node + pnpm; paquete `@jobit/api`.
- Prisma 6.x con cliente generado; Auth (`User`, `RefreshToken`, `requireAuth`, `AuthenticatedRequest`) disponible.
- PostgreSQL de test operativo en `localhost:5434` (contenedor `jobit-postgres-test`), base `jobit_test`.
- Vitest configurado con `globalSetup` (`prisma migrate deploy`), `fileParallelism: false`, carga de `.env.test`.

### Base de datos de test esperada

`DATABASE_URL_TEST` se provee **como variable local de terminal / `.env.test`, nunca versionada**:

```
postgresql://jobit:jobit_test_password@localhost:5434/jobit_test?schema=public
```

`.env.test` está cubierto por `.gitignore` (`.env.*`). La URL real no se escribe en ningún archivo versionado.

## Estrategia de datos de test

- Aislamiento por `beforeEach` con `TRUNCATE "User", "RefreshToken", "CandidateProfile", "Skill", "Experience", "Education", "Project", "Link", "JobPreferences" RESTART IDENTITY CASCADE` (heredado de ADR-0009 D-G; ampliado con las tablas de perfil). El `CASCADE` desde `CandidateProfile` cubre sub-recursos, pero se truncan explícitamente para determinismo.
- Helpers de test:
  - `registerAndLogin(email)` → crea usuario vía `POST /api/auth/register` y devuelve `{ accessToken, userId }`. Reutiliza Auth real (no se mockea).
  - Para casos de ownership: dos usuarios (`userA`, `userB`); `userB` intenta operar sobre sub-recursos de `userA` → 403.
- Estilo de app de test: instancia `express()` local que monta `cookieParser`, `express.json`, el `profileRouter` bajo `/api/profile` y un error handler JSON (patrón heredado de los tests de Auth).
- PostgreSQL real, no SQLite ni mocks de Prisma (ADR-0009 D-G).

## Archivos de test previstos (no se crean en esta fase)

- `apps/api/src/profile/profile.integration.test.ts` — GET/PUT `/api/profile/me`, lazy create, idempotencia, completion básico.
- `apps/api/src/profile/profile-skills.integration.test.ts` — skills.
- `apps/api/src/profile/profile-experience.integration.test.ts` — experiencia.
- `apps/api/src/profile/profile-education.integration.test.ts` — educación.
- `apps/api/src/profile/profile-projects.integration.test.ts` — proyectos.
- `apps/api/src/profile/profile-links-preferences.integration.test.ts` — links y preferencias.

## Archivos productivos futuros (no se crean en esta fase)

- `apps/api/src/profile/profile.router.ts` — rutas Express bajo `/api/profile/me`, todas con `requireAuth`.
- `apps/api/src/profile/profile.service.ts` — lógica de negocio (lazy create, CRUD sub-recursos, ownership).
- `apps/api/src/profile/profile.schemas.ts` — schemas Zod de validación de entrada.
- `apps/api/src/profile/profile.types.ts` — tipos de dominio y de respuesta (sin campos internos).
- `apps/api/src/profile/profile.completion.ts` — cálculo de `completionPercentage`.
- `apps/api/src/profile/profile.ownership.ts` — verificación de pertenencia de sub-recursos al perfil del usuario.

Adicionalmente, una fase autorizará tocar `apps/api/prisma/schema.prisma` (+ migración) y `apps/api/src/app.ts` (montaje del router), siempre declarado en el prompt correspondiente.

## Fases TDD

Cada fase es un prompt operativo independiente. Regla por defecto: un prompt = una fase. Ninguna fase avanza sin revisión humana `PASS`/`PASS_WITH_NOTES`.

### Fase 4.1 — Prisma / modelos / migración

- **Sin test unitario previo obligatorio.** Justificación: es infraestructura/schema, no lógica con ramas (conforme a `tdd-guidelines.md` y ADR-0010 D-8).
- Modelos: `CandidateProfile` (1:1 `User`), `Skill` (con `normalizedName`, `@@unique([profileId, normalizedName])`), `Experience`, `Education`, `Project`, `Link`, `JobPreferences` (1:1), con enums y `onDelete: Cascade` desde `CandidateProfile`.
- **Verificación:** `prisma validate`; `prisma migrate deploy` (o `migrate dev` en local) contra `jobit_test`; `prisma migrate status` limpio; inspección manual de la migración generada.
- **No endpoints en esta fase.**
- Red/Green/Refactor: N/A (infraestructura). El "verde" es migración aplicada y `migrate status` sin pendientes.

### Fase 4.2 — Servicio base de profile

- **Tests primero:** lazy create de `CandidateProfile` (servicio crea si no existe); idempotencia (segunda invocación no duplica); `completionPercentage` de perfil vacío = 0.
- **Después:** implementación mínima del service (`getOrCreateProfile`, lectura).
- Red: tests fallan (no existe service). Green: service mínimo. Refactor: extraer helpers.

### Fase 4.3 — GET / PUT `/api/profile/me`

- **Tests primero:**
  - `GET` sin token → 401.
  - `GET` crea perfil vacío y lo devuelve (con `completionPercentage: 0`).
  - `GET` repetido no duplica perfil (idempotencia).
  - `PUT` con datos básicos válidos → 200, persistido.
  - `PUT` con `firstName` vacío → 400 `VALIDATION_ERROR`.
  - `PUT` con `summary` > 1000 → 400.
  - `completionPercentage` refleja `basicInfo` completo tras `PUT` válido.
- **Después:** router/controller mínimo + montaje en `app.ts`.

### Fase 4.4 — Skills

- **Tests primero:**
  - `POST` skill válida → aparece en el perfil.
  - Duplicado exacto → 409 `CONFLICT`.
  - Duplicado case-insensitive (`React` / `react`) → 409.
  - `DELETE` skill propia → desaparece.
  - `DELETE` skill ajena → 403 `FORBIDDEN`.
  - La respuesta **no expone** `normalizedName`.
- **Después:** implementación de skills + `profile.ownership.ts`.

### Fase 4.5 — Experience

- **Tests primero:**
  - Crear experiencia válida.
  - `startDate > endDate` → 400.
  - `current === true` fuerza `endDate: null` (rechaza endDate no nulo con current).
  - `update` experiencia propia → 200.
  - `update`/`delete` experiencia ajena → 403.
- **Después:** implementación.

### Fase 4.6 — Education

- **Tests primero:**
  - Crear educación válida.
  - `update` educación propia.
  - `delete` educación propia.
  - `update`/`delete` educación ajena → 403.
  - Fechas incoherentes si aplica → 400.
- **Después:** implementación.

### Fase 4.7 — Projects

- **Tests primero:**
  - Crear proyecto válido con `technologies[]`.
  - `url`/`repoUrl` inválida → 400.
  - `update`/`delete` proyecto propio.
  - `update`/`delete` proyecto ajeno → 403.
- **Después:** implementación.

### Fase 4.8 — Links + Preferences

- **Tests primero:**
  - `PUT /links` con enlaces válidos → upsert, 200.
  - URL inválida → 400.
  - `PUT /preferences` con datos válidos → upsert, 200.
  - `salaryMin <= 0` → 400.
  - `salaryMax < salaryMin` → 400.
  - Preferencias privadas y propias (solo el dueño las ve/edita).
  - Intento sobre recurso ajeno si aplica → 403.
- **Después:** implementación (`JobPreferences` 1:1 upsert, `Link` reemplazo de conjunto).

### Fase 4.9 — Completion

- **Tests primero:**
  - Perfil vacío → `completionPercentage: 0`.
  - Solo `basicInfo` completo → `14` (`Math.round(1/7*100)`).
  - 7/7 secciones completas → `100`.
  - Verificación de la fórmula `Math.round((completedSections / 7) * 100)`.
- **Después:** `profile.completion.ts` + integración en `GET /me` (refactor).

## Tests mínimos por fase (resumen → spec)

| Fase | Tests mínimos | Test de la spec cubierto |
|---|---|---|
| 4.1 | migración aplica/valida | (infraestructura) |
| 4.2 | lazy create, idempotencia, completion 0 | "crear perfil vacío" (reinterpretado, ADR-0010 D-2) |
| 4.3 | 401, GET crea/idempotente, PUT válido, PUT requerido vacío, summary>1000, completion básico | "ver perfil vacío", "actualizar básicos", "requerido vacío" |
| 4.4 | POST, 409 exacto, 409 case-insensitive, DELETE propia, DELETE ajena 403, sin normalizedName | "añadir skill", "skill duplicada", "eliminar skill", "acceso ajeno 403" |
| 4.5 | crear, fechas 400, current⇒endDate null, update propia, ajena 403 | "experiencia fechas incoherentes", "experiencia actual" |
| 4.6 | crear, update/delete propia, ajena 403, fechas | (CRUD educación, ownership) |
| 4.7 | crear con technologies, URL 400, update/delete propio, ajeno 403 | "URL inválida", CRUD proyectos, ownership |
| 4.8 | links válidos, URL 400, preferences válidas, salario 400, ajeno 403 | "URL de enlace inválida", preferencias |
| 4.9 | 0, 14, 100, fórmula | "indicador de completitud" |

## Criterios Red / Green / Refactor

- **Red:** se escriben los tests de la fase y se ejecutan; deben fallar por ausencia de la implementación (o cubrir explícitamente el contrato esperado). Se observa y documenta el fallo esperado.
- **Green:** se implementa el mínimo necesario para que los tests de la fase pasen, sin añadir comportamiento no cubierto por tests.
- **Refactor:** se mejora diseño, nombres y extracción de helpers (`ownership`, `completion`) sin cambiar comportamiento ni romper tests.
- Iteraciones pequeñas: si una fase obliga a tocar demasiados archivos, se subdivide.

## Verificaciones por fase

Comandos previstos (scripts reales del paquete `@jobit/api`; **no se modifica `package.json`**):

```bash
pnpm --filter @jobit/api test
pnpm --filter @jobit/api typecheck
pnpm --filter @jobit/api build
```

Verificaciones de raíz/monorepo si están disponibles (adaptar a los scripts reales; si no existen, indicarlo y no inventarlos):

```bash
pnpm lint
pnpm test
pnpm build
```

Bloque git de solo lectura en cada fase:

```bash
git branch --show-current
git status --short
git diff --check
```

La fase 4.1 verifica además: `prisma validate`, `prisma migrate deploy`/`status` contra `jobit_test`.

## Reglas de seguridad TDD

- Todo endpoint privado requiere `requireAuth`. No hay endpoints públicos.
- `userId` siempre desde `req.auth.userId`. **Nunca** desde body, query ni params.
- Tests de ownership obligatorios para cada sub-recurso con id: acceso ajeno → 403.
- Errores normalizados `{ error: { code, message } }` conforme a ADR-0007 (`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`).
- No exponer `normalizedName` ni ningún campo interno en respuestas.
- No exponer datos sensibles (sin `passwordHash`, sin tokens; salario privado al dueño).

## Riesgos

- **R-1:** dependencia de `jobit_test` operativo; si el contenedor no publica el puerto, los tests de integración fallan en setup. Mitigación: revalidar `docker port` / `pg_isready` antes de cada fase con tests.
- **R-2:** ampliar el `TRUNCATE` a las nuevas tablas requiere que `setup.ts` las incluya; si una tabla falta en el truncate, habrá fugas entre tests. Mitigación: revisar `setup.ts` en la fase 4.2/4.3 (declarándolo en el prompt).
- **R-3:** la creación lazy (D-2) puede generar carreras si dos `GET /me` concurrentes crean el perfil; mitigación con `upsert` por `userId` único (1:1) y constraint de DB.
- **R-4:** `fileParallelism: false` mantiene aislamiento pero alarga la suite a medida que crece; aceptable en MVP (ADR-0009 D-G riesgo conocido).
- **R-5:** divergencia entre la redacción del test de la spec (creación en register) y D-2 (lazy); ya documentada en ADR-0010, se aplica la reinterpretación.

## Kill-switch TDD

Se activa `BLOCKED` si en cualquier fase: se empieza por código productivo sin tests previos sin justificación (salvo 4.1); se acepta `userId` del cliente; se permite acceso cruzado entre usuarios; se crea un endpoint sin `requireAuth` o público; se reimplementa o modifica Auth; se modifica `register`; se toca frontend; se modifica `schema.prisma`/migración sin prompt que lo autorice; se expone `normalizedName` o datos sensibles; se modifican manifests/lockfiles o se instalan dependencias sin autorización; se trabaja sobre `main`/`dev`.

## Definición de Done (para pasar a implementación)

Este plan TDD se considera completo y habilita el inicio de la fase 4.1 cuando:

- El plan está creado, revisado por el operador y (si se decide) commiteado.
- Las fases 4.1–4.9 están definidas con sus tests mínimos.
- Los archivos de test y productivos esperados están nombrados (no creados).
- Las precondiciones de entorno y la DB de test están confirmadas disponibles.
- Las reglas de seguridad TDD y el kill-switch están explícitos.

Cada prompt técnico posterior debe: (1) crear primero los tests de la fase; (2) ejecutarlos y observar el fallo esperado cuando proceda; (3) implementar lo mínimo; (4) ejecutar de nuevo los tests de la fase; (5) no avanzar a la fase siguiente sin revisión humana.
