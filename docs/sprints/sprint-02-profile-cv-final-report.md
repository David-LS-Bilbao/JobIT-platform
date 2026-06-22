# Informe final

## Sprint o tarea
Sprint 02 — Candidate Profile & CV

## Objetivo inicial
Implementar el módulo candidate-first de perfil/CV básico para JobIT Talent, siguiendo SDD/TDD, con endpoints privados, ownership por usuario autenticado, validaciones y cobertura de tests.

## Trabajo realizado
- **Documentación inicial del sprint:** brief de agente (`sprint-02-profile-cv-agent-brief.md`) con alcance y reglas del módulo M02.
- **ADR-0010:** decisiones de implementación cerradas antes de TDD (creación lazy del perfil, ownership, completitud, preferencias 1:1, unicidad de skills, validaciones de experiencia, disciplina TDD).
- **Plan TDD:** `sprint-02-profile-cv-tdd-plan.md` con el orden de fases por área de endpoint.
- **Modelos Prisma profile/CV:** `CandidateProfile`, `Skill`, `Experience`, `Education`, `Project`, `Link`, `JobPreferences` y enums asociados, con migración aplicada.
- **Servicio base de perfil:** creación lazy idempotente y carga de relaciones.
- **GET/PUT `/api/profile/me`:** lectura del perfil (con creación lazy) y actualización de datos básicos.
- **Skills:** alta/baja con normalización case-insensitive y unicidad por perfil.
- **Experience:** alta/edición/baja con validación de fechas y `current`.
- **Education:** alta/edición/baja con validación de fechas y `current`.
- **Projects:** alta/edición/baja con tecnologías y URLs validadas.
- **Links:** reemplazo total (PUT) preservando el orden de envío.
- **Preferences:** upsert (PUT) de preferencias laborales 1:1.
- **completionPercentage:** campo derivado sobre 7 secciones, no persistido.
- **Auditoría final:** revisión de calidad/seguridad/ownership/validación con resultado PASS_AUDIT_WITH_NOTES.

## Archivos modificados

**Docs**
- `docs/sprints/sprint-02-profile-cv-agent-brief.md`
- `docs/decisions/ADR-0010-sprint-02-profile-cv-implementation-decisions.md`
- `docs/sprints/sprint-02-profile-cv-tdd-plan.md`

**Prisma**
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260619184721_add_candidate_profile_cv_models/`

**API profile source**
- `apps/api/src/profile/profile.router.ts`
- `apps/api/src/profile/profile.schemas.ts`
- `apps/api/src/profile/profile.service.ts`
- `apps/api/src/profile/profile.ownership.ts`

**API profile tests**
- `apps/api/src/profile/profile.integration.test.ts`
- `apps/api/src/profile/profile-skills.integration.test.ts`
- `apps/api/src/profile/profile-experience.integration.test.ts`
- `apps/api/src/profile/profile-education.integration.test.ts`
- `apps/api/src/profile/profile-projects.integration.test.ts`
- `apps/api/src/profile/profile-links-preferences.integration.test.ts`
- `apps/api/src/profile/profile-completion.integration.test.ts`
- `apps/api/src/profile/profile.service.test.ts`

## Tests y verificaciones
- **API tests:** 120/120 passing (17 test files).
- **typecheck:** PASS.
- **build:** PASS.
- **lint:** no configurado en @jobit/api.
- **audit:** PASS_AUDIT_WITH_NOTES.

## Decisiones técnicas
- **CandidateProfile lazy en `GET /me`:** se crea en el primer acceso autenticado; no se modifica el flujo de `register` de Auth. Idempotente (un perfil por `userId`).
- **`userId` siempre desde `req.auth.userId`:** poblado por `requireAuth` a partir del access token verificado.
- **No aceptar `userId`/`profileId` del cliente:** los schemas usan `.strip()` y descartan esas claves del body; los params solo aportan IDs de subrecurso.
- **Subrecursos privados bajo `/api/profile/me`:** todas las rutas pasan por `requireAuth`; sin endpoints públicos.
- **`403 FORBIDDEN` para recurso ajeno, `404 NOT_FOUND` para inexistente:** verificado antes de leer/actualizar/borrar subrecursos.
- **Skills con `normalizedName` case-insensitive:** `trim().toLowerCase()` + `@@unique([profileId, normalizedName])`; duplicado devuelve `409 CONFLICT`. `normalizedName` no se expone.
- **`JobPreferences` 1:1 por `profileId`:** tabla separada con relación 1:1; upsert por perfil.
- **Links como reemplazo total por PUT:** se eliminan los anteriores y se recrean en orden de envío.
- **Preferences como reemplazo completo/upsert por PUT:** crea si no existe, actualiza si existe.
- **`completionPercentage` sobre 7 secciones:** `Math.round((completedSections / 7) * 100)`; preferences vacías o solo `remotePreference: ANY` no cuentan.
- **No IA evaluando personas:** fuera de alcance del módulo.

## Problemas encontrados
- **Docker/puerto de test en Mac/Windows:** se resolvió trabajando en el checkout de Windows con la DB de test en `localhost:5434` (`jobit-postgres-test`). El checkout WSL2 permanece en `dev` y no refleja el sprint.
- **Revisión de diffs grandes:** se resolvió mediante commits pequeños por área de endpoint y revisión remota en GitHub.
- **Orden de links:** se ajustó a creación secuencial en transacción para preservar el orden de envío.
- **Lint no configurado:** el control de estilo se apoya únicamente en `tsc`/typecheck.

## Pendiente
- Configurar ESLint/lint para @jobit/api o a nivel de monorepo.
- Añadir tests `404 NOT_FOUND` autenticados para IDs de subrecurso inexistentes (el código ya cubre el branch; falta el caso de test dedicado).
- Limpiar el TODO obsoleto en `apps/api/src/profile/profile.service.test.ts`.
- Decidir si `GET /me` debe seguir exponiendo `userId` (decisión de producto).
- Preparar la integración con el frontend cuando corresponda.
- Abrir PR hacia `dev` tras este informe.

## Recomendación para el orquestador
- Abrir PR `feat/sprint-02-profile-cv` → `dev`.
- No mergear hasta revisar el PR y el estado de CI (si existe).
- Crear issues/backlog para los hallazgos no bloqueantes (lint, tests 404, TODO obsoleto, exposición de `userId`).
- Siguiente sprint sugerido: JobIT Jobs o integración UI de Profile, según roadmap.

## Prompt sugerido para continuar

```
Fase: Sprint 02 — Abrir PR hacia dev.
Rama: feat/sprint-02-profile-cv (HEAD esperado: informe final commiteado sobre 6f19632).
Tareas:
1. Verificar git: rama feat/sprint-02-profile-cv, working tree limpio, origin alineado.
2. Comitear el informe final (docs/sprints/sprint-02-profile-cv-final-report.md) con
   "docs(sprint): add sprint 02 final report" y hacer push normal.
3. Abrir PR feat/sprint-02-profile-cv -> dev con resumen del sprint, resultado de tests
   (120/120), audit PASS_AUDIT_WITH_NOTES y lista de hallazgos no bloqueantes.
4. No mergear. Esperar revisión humana y CI.
```
