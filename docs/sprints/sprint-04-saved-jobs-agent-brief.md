# Sprint 04 — Saved Jobs Agent Brief

> Documento operativo (Fase 0). No implementa código ni modifica Prisma.
> Fija alcance, contrato heredado, reglas de negocio, kill-switch y flujo de trabajo
> del Sprint 04 antes de iniciar SDD Review y TDD Planning.

## Estado inicial verificado

- **Rama:** `feat/sprint-04-saved-jobs`.
- **Base dev/origin:** `1d33863`, equivalente a `dev == origin/dev` (la rama parte de `dev` actualizado, sin commits propios ni divergencia).
- **Working tree:** limpio (`git status --short` vacío).
- **Repo anidado:** ninguno; solo el `./.git` raíz.
- **Documentos presentes:** `docs/specs/features/saved-jobs.md`, `jobs.md`, `external-jobs-jooble.md`, `00-mvp-scope.md`; toda la biblioteca `docs/agents/*` requerida; ADR-0005/0006/0007/0008/0011; reportes finales de Sprint 03 y 03.5; código de Jobs (`jobs.router.ts`, `jobs.service.ts`, `jobs.schemas.ts`, `jobs.serializer.ts`) y `apps/api/src/auth/`.
- **Documento ausente no bloqueante:** `docs/sprints/sprint-03-6-jobs-api-visibility-final-report.md` no existe como archivo (el cierre de Sprint 03.6 se entregó como texto del operador). Riesgo documental de trazabilidad, no bloqueante para el SDD de Sprint 04, dado que el contrato de visibilidad sí está aplicado en código (`jobs.serializer.ts`) y verificado en `dev`.

## Objetivo del sprint

Permitir que el **candidato autenticado** pueda **guardar**, **quitar** y **listar** ofertas de empleo guardadas. Los datos guardados pertenecen exclusivamente al candidato autenticado, no puede haber duplicados, y las ofertas embebidas en las respuestas deben usar el contrato público de Jobs ya estabilizado en Sprint 03.6.

## Alcance funcional

- **Modelo `SavedJob`** (si no existe): relación entre el usuario candidato y una oferta.
- **Relación User–Job:** `SavedJob` referencia a `User` (propietario) y a `Job` (oferta guardada).
- **Constraint único** por `(userId, jobId)`: impide duplicados a nivel de base de datos.
- **GET listado de guardadas:** devuelve las ofertas guardadas del candidato autenticado.
- **POST guardar oferta:** crea el registro de guardado del candidato.
- **DELETE quitar oferta:** elimina el registro de guardado del candidato.
- **`requireAuth` en todas las rutas:** ninguna ruta de Saved Jobs es pública.
- **Ownership estricto:** todas las operaciones se acotan al `userId` autenticado.
- **Reutilización de `serializeJob` / `JobPublicDto`:** el Job embebido en el listado usa el serializador público de Jobs, sin duplicar lógica de serialización.
- **Compatibilidad con `source` INTERNAL y JOOBLE:** funciona con ofertas internas y con ofertas ingeridas de Jooble ya persistidas.
- **Tests mínimos:** cobertura de integración para guardar, listar, quitar, idempotencia, ownership y contrato público.
- **Errores normalizados:** respuestas de error con el formato `{ error: { code, message } }` coherente con Jobs.

## Fuera de alcance

Queda explícitamente **fuera de alcance** de este sprint:

- frontend;
- match / matching de ofertas;
- dashboard;
- recruiter;
- ATS;
- admin;
- scraping;
- nuevas APIs externas;
- nuevas llamadas reales a Jooble;
- cron / scheduler / n8n;
- automatización de ingesta;
- cambios grandes en Jobs;
- cambios en Auth;
- cambios en Profile/CV;
- monetización;
- deploy;
- CI/CD.

## Contrato heredado de Jobs

- Saved Jobs **debe reutilizar** `serializeJob` / `JobPublicDto` (`apps/api/src/jobs/jobs.serializer.ts`).
- **No debe duplicar** la serialización de `Job` ni reimplementar el mapeo de campos.
- **No debe devolver `externalId`** en ninguna respuesta.
- **No debe devolver `ingestedAt`**, ya que la política pública de Sprint 03.6 lo ocultó.
- **Debe respetar** los campos públicos `source` y `sourceUrl` (con `sourceUrl = null` para ofertas internas).

## Riesgo SDD pendiente

Existe una **discrepancia de contrato de endpoint** que debe resolverse en SDD Review antes del TDD Planning:

- El briefing inicial orientaba `POST /api/saved-jobs/:jobId` (jobId en la ruta).
- La spec `docs/specs/features/saved-jobs.md` define `POST /saved-jobs` con body `{ "jobId": "uuid" }`.
- La **decisión final** (jobId en path vs. jobId en body) debe tomarse en **SDD Review**.
- **No implementar endpoints** hasta resolver esta discrepancia.
- En esta Fase 0 solo se documenta; no se resuelve.

## Reglas de negocio iniciales

- Solo usuarios **autenticados** pueden operar sobre guardados.
- `userId` se toma **siempre** desde `req.auth.userId` (sesión autenticada).
- **Nunca** aceptar `userId` desde body, query ni params.
- **No duplicados:** un mismo `(userId, jobId)` no puede repetirse.
- **POST idempotente** si la spec se mantiene: guardar una oferta ya guardada responde sin error y sin duplicar.
- **DELETE** de una oferta no guardada devuelve **404** si la spec se mantiene.
- Un usuario solo puede **listar y borrar sus propios** guardados; nunca los de otro usuario.
- Las ofertas **cerradas** guardadas se mantienen en la lista con **indicador de "no disponible"** si el modelo / Jobs API lo permite.
- **Orden por defecto** del listado: `savedAt` descendente.

## Kill-switch específico

Detener el trabajo y marcar **BLOCKED** si:

- la rama activa no es `feat/sprint-04-saved-jobs`;
- se trabaja en `main` o `dev`;
- existe repo anidado `JobIT-platform/.git`;
- el working tree está sucio y no se explica;
- Codex crea otra carpeta `JobIT-platform`;
- Codex implementa sin Startup + SDD Review + TDD Planning previos;
- Codex acepta `userId` desde body / query / params;
- Codex no protege rutas con `requireAuth`;
- Codex devuelve datos guardados de otro usuario;
- Codex duplica la serialización de `Job` ignorando `serializeJob` / `JobPublicDto`;
- Codex expone `externalId`;
- Codex toca frontend;
- Codex hace llamadas reales a Jooble;
- Codex toca la API key;
- Codex modifica `package.json` o lockfiles sin autorización;
- Codex crea cron / scheduler / n8n;
- Codex hace commit / push / merge sin autorización.

## Flujo obligatorio del sprint

1. Fase 0 documental.
2. Startup + Alignment Report.
3. SDD Review.
4. TDD Planning.
5. Decisión ADR si aplica.
6. Modelo Prisma + migración.
7. Tests RED.
8. Implementación GREEN.
9. Verificaciones.
10. Auditoría quality/security.
11. Informe final.
12. Prompt final de actualización documental global.
13. PR checklist.
14. Informe para orquestador.

## Verificaciones mínimas al cierre técnico

- `pnpm --filter @jobit/api test`
- `pnpm --filter @jobit/api typecheck`
- `pnpm --filter @jobit/api build`
- `git diff --check`
- `git status --short`
- Documentar si **lint no está configurado** (verificación informativa, no bloqueante).

## Criterios iniciales de aceptación

- El usuario autenticado puede **guardar** una oferta existente.
- **Guardar dos veces no duplica** (idempotencia / constraint único).
- El usuario autenticado puede **listar solo sus** guardadas.
- El usuario autenticado puede **quitar** una guardada propia.
- **No puede afectar** guardados de otro usuario.
- Todas las respuestas de `Job` usan el **contrato público** (`serializeJob` / `JobPublicDto`).
- **No se expone `externalId`** (ni `ingestedAt`).
- Funciona con ofertas **INTERNAL y JOOBLE** persistidas.
- **Tests mínimos definidos** antes de implementar (RED previo a GREEN).
