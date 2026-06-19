# Sprint Agent Brief — Sprint 02 Candidate Profile + CV

## Nombre del sprint

Sprint 02 — Candidate Profile + CV (MVP)

## Objetivo

Permitir que un candidato tech autenticado construya y mantenga un perfil profesional estructurado (datos básicos, skills, experiencia, educación, proyectos, enlaces y preferencias laborales) mediante una API REST privada bajo `/api/profile/me`, con propiedad estricta por usuario y validación server-side. Este perfil es la base para el match básico y la visibilidad futura del candidato.

El sprint construye **sobre** el módulo M01 Auth ya entregado; no reimplementa autenticación.

## Rama esperada

- Rama: `feat/sprint-02-profile-cv`
- Base: `dev` actualizada y sincronizada con `origin/dev` antes de cortar la rama.
- PR destino: `dev`.

Reglas no negociables sobre la rama:

- La rama se crea desde `dev` con la condición previa `dev == origin/dev` y working tree limpio. En el momento de redactar este brief, `origin/dev` ya contiene el Sprint 01 Auth mergeado mediante PR #12; la rama de Sprint 02 debe partir de ese estado, no de un `dev` local desactualizado.
- No se trabaja directamente sobre `dev` ni sobre `main`. Cualquier intento activa el kill-switch.
- No se hace force-push. No se reescribe el historial publicado.
- No se reutilizan ramas contaminadas de intentos previos.

## Contexto necesario

- **Sprint 01 Auth está mergeado en `dev` mediante PR #12.** Aporta: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, modelos `User` y `RefreshToken`, middleware `requireAuth` (extrae `userId` del access token verificado y lo expone en `req.auth.userId`), y la suite de tests de Auth. Todo ello está disponible y testado.
- **Sprint 02 depende de Auth como infraestructura existente.** El middleware `requireAuth` (`apps/api/src/auth/require-auth.middleware.ts`) es la puerta de entrada de todas las rutas de perfil. El tipo `AuthenticatedRequest` exportado por ese módulo es la fuente de verdad del `userId`.
- El stack está fijado por ADRs: Node.js + TypeScript + Express + Zod (ADR-0005), API REST bajo `/api` con errores normalizados `{ error: { code, message } }` y `userId` siempre del token (ADR-0007), PostgreSQL + Prisma (ADR-0008). ADR-0009 fijó decisiones de implementación de Auth que sirven de referencia de estilo (layout de tests, aislamiento por TRUNCATE, PostgreSQL real en tests).
- El sprint es **candidate-first**: el único rol es `CANDIDATE`. No hay recruiter, empresa ni admin.
- El módulo M02 (Profile) es la primera funcionalidad de dominio sobre Auth. Su corrección de ownership condiciona la seguridad de todos los módulos privados posteriores (M03-M06).

## Puntos destacados de SDD Review

Estos puntos deben resolverse o respetarse explícitamente antes y durante la implementación. Surgen de comparar la spec `docs/specs/features/candidate-profile-cv.md` contra los ADR-0005 a 0008:

1. **Alineación de rutas con `/api` (ADR-0007).** La spec lista las rutas como `/profile/me`, `/profile/me/skills`, etc. Por ADR-0007, en implementación deben montarse bajo el prefijo `/api`: `/api/profile/me`, `/api/profile/me/skills`, `/api/profile/me/experience/:id`, etc. La spec no se modifica en este sprint; la alineación se documenta como decisión de implementación.
2. **Creación automática vs. lazy de `CandidateProfile`.** La spec dice en reglas de negocio "el perfil se crea automáticamente al registrar el candidato (vacío)", pero el registro ya está entregado en Sprint 01 y no crea perfil. **Debe decidirse explícitamente antes de implementar** (en SDD Review / mini-ADR): (a) crear el perfil de forma diferida (lazy) en el primer `GET /api/profile/me`, o (b) crearlo en el flujo de registro (requeriría tocar Auth, lo cual este sprint evita), o (c) endpoint explícito de inicialización. La opción lazy es la candidata por defecto porque no obliga a modificar el módulo Auth ya mergeado. La decisión se cierra en un ADR antes de tocar código.
3. **Ownership por usuario autenticado.** Todo recurso de perfil pertenece al `userId` del token. El servidor resuelve el `CandidateProfile` a partir de `req.auth.userId`, nunca de un identificador del cliente.
4. **`userId` jamás desde body ni query.** Heredado de ADR-0007 y de las condiciones de kill-switch de Sprint 01. El `userId` se extrae siempre del access token verificado por `requireAuth`.
5. **Prohibido acceder o modificar recursos de otro usuario.** Las operaciones sobre sub-recursos por id (`/skills/:id`, `/experience/:id`, etc.) deben verificar que el sub-recurso pertenece al perfil del usuario autenticado antes de leer, actualizar o borrar. Un id de otro usuario devuelve 403 (o 404 si se prefiere no revelar existencia; a decidir en implementación de forma coherente con la spec, que indica 403).
6. **No tocar frontend.** Ningún archivo bajo `apps/web`.
7. **No reimplementar Auth.** Auth se consume como dependencia. No se duplica middleware, hashing ni emisión de tokens.
8. **No crear endpoints públicos.** Todas las rutas de perfil son privadas y pasan por `requireAuth`.
9. **No mezclar otros módulos.** Nada de jobs, saved jobs, match ni dashboard en este sprint.

## Documentos obligatorios

El ejecutor debe haber leído antes de iniciar:

- [AGENTS.md](../../AGENTS.md)
- [README.md](../../README.md)
- [docs/agents/executor-startup-skill.md](../agents/executor-startup-skill.md)
- [docs/agents/sprint-agent-brief-template.md](../agents/sprint-agent-brief-template.md)
- [docs/agents/codex-claude-skill-invocation.md](../agents/codex-claude-skill-invocation.md)
- [docs/agents/operator-safety-checklist.md](../agents/operator-safety-checklist.md)
- [docs/agents/kill-switch-rules.md](../agents/kill-switch-rules.md)
- [docs/agents/sdd-tdd-ai-audit-workflow.md](../agents/sdd-tdd-ai-audit-workflow.md)
- [docs/agents/tdd-guidelines.md](../agents/tdd-guidelines.md)
- [docs/agents/audit-quality-security-skill.md](../agents/audit-quality-security-skill.md)
- [docs/agents/pr-checklist.md](../agents/pr-checklist.md)
- [docs/specs/features/candidate-profile-cv.md](../specs/features/candidate-profile-cv.md)
- [docs/sprints/sprint-01-auth-agent-brief.md](sprint-01-auth-agent-brief.md)

Si alguno falta o no es accesible, se activa kill-switch antes de continuar.

## Specs aplicables

- **Obligatoria**: [docs/specs/features/candidate-profile-cv.md](../specs/features/candidate-profile-cv.md).

Reglas sobre la spec:

- Si la spec falta, está incompleta para alguno de los puntos relevantes (modelos `CandidateProfile`, `Skill`, `Experience`, `Education`, `Project`, `Link`, `JobPreferences`; endpoints privados; ownership; validaciones; criterios de aceptación; tests mínimos) o contradice el sprint, se activa kill-switch antes de implementar.
- Cualquier cambio que se considere necesario en la spec se realiza como tarea previa y separada, con su propia revisión humana. No se modifica la spec en el mismo prompt en el que se implementa.

## ADRs aplicables

- [docs/decisions/ADR-0005-backend-framework.md](../decisions/ADR-0005-backend-framework.md) — Express + Zod.
- [docs/decisions/ADR-0006-auth-strategy.md](../decisions/ADR-0006-auth-strategy.md) — JWT híbrido; relevante solo como contrato de la dependencia Auth ya entregada.
- [docs/decisions/ADR-0007-api-design.md](../decisions/ADR-0007-api-design.md) — REST bajo `/api`, errores JSON normalizados, validación server-side, `userId` del token.
- [docs/decisions/ADR-0008-database-orm-initial-model.md](../decisions/ADR-0008-database-orm-initial-model.md) — PostgreSQL + Prisma; se amplía el modelo con las entidades de perfil.
- [docs/decisions/ADR-0009-sprint-01-auth-implementation-decisions.md](../decisions/ADR-0009-sprint-01-auth-implementation-decisions.md) — referencia de estilo (layout de tests, aislamiento por TRUNCATE, PostgreSQL real).

Reglas sobre los ADRs:

- Cualquier desviación respecto a estos ADRs requiere un ADR nuevo aprobado antes de implementarla.
- Las decisiones abiertas de este sprint (creación automática vs. lazy del perfil, política de 403 vs. 404 en acceso a recurso ajeno, estrategia de `links` y `preferences` como upsert 1:1) deben cerrarse en el primer prompt operativo mediante un mini-ADR (propuesto **ADR-0010 — Sprint 02 Profile implementation decisions**) antes de tocar código.

## Skills documentales obligatorias

Cada prompt operativo del sprint debe declarar explícitamente:

```txt
Skill documental aplicada:
Fase:
```

Skills mínimas esperadas, asociadas a la fase:

- [docs/agents/executor-startup-skill.md](../agents/executor-startup-skill.md) — fase Startup.
- [docs/agents/sdd-tdd-ai-audit-workflow.md](../agents/sdd-tdd-ai-audit-workflow.md) — fases SDD Review, TDD Planning, Implementación, Verificación.
- [docs/agents/tdd-guidelines.md](../agents/tdd-guidelines.md) — fase TDD Planning y durante Implementación.
- [docs/agents/audit-quality-security-skill.md](../agents/audit-quality-security-skill.md) — fase Audit.
- [docs/agents/pr-checklist.md](../agents/pr-checklist.md) — fase Informe final / PR.
- [docs/agents/codex-claude-skill-invocation.md](../agents/codex-claude-skill-invocation.md) — contrato de cada prompt operativo.
- [docs/agents/operator-safety-checklist.md](../agents/operator-safety-checklist.md) — validación humana previa y posterior a cada prompt.
- [docs/agents/kill-switch-rules.md](../agents/kill-switch-rules.md) — condiciones de parada inmediata.

Un prompt sin declaración explícita de skill y fase se rechaza con `BLOCKED`.

## Regla TDD obligatoria

Esta regla es vinculante para todas las fases de implementación del sprint:

- **Ninguna fase de implementación puede comenzar directamente por código productivo.**
- Cada fase técnica debe comenzar con tests o con un plan TDD aprobado por el operador.
- Los tests deben **fallar primero** (red) o cubrir explícitamente el contrato esperado antes de escribir la implementación que los hace pasar (green).
- Si para una fase concreta no es posible escribir tests antes (por ejemplo, una migración de schema pura), debe **justificarse explícitamente** en el prompt antes de implementar, y la verificación se hace por otra vía documentada (p. ej. inspección de la migración generada y prueba de `migrate deploy` contra `jobit_test`).
- El estilo de tests sigue las decisiones de ADR-0009: integración con Supertest contra PostgreSQL real (`jobit_test`), aislamiento por `TRUNCATE ... RESTART IDENTITY CASCADE` en `beforeEach`, un archivo de test por área de endpoint.

## Alcance

Dentro de alcance para Sprint 02:

- **Modelos Prisma** para el dominio de perfil, conforme a la spec: `CandidateProfile` (1:1 con `User`), `Skill`, `Experience`, `Education`, `Project`, `Link` y `JobPreferences` (1:1 con `CandidateProfile`), con sus relaciones, enums y `onDelete: Cascade` desde `CandidateProfile`. Migración inicial del módulo contra `jobit_test`.
- **Endpoints privados bajo `/api/profile/me`** conforme a la tabla de la spec (alineados a `/api`): obtener y actualizar datos básicos; CRUD de skills, experiencia, educación y proyectos; actualización de enlaces y de preferencias laborales.
- **Ownership estricto por usuario autenticado**: el `CandidateProfile` se resuelve desde `req.auth.userId`; los sub-recursos por id se validan como pertenecientes a ese perfil antes de cualquier lectura o mutación.
- **Validación server-side** con Zod (ADR-0005), conforme a la tabla de validaciones de la spec (longitudes, campos requeridos, coherencia de fechas, formato de URL, rangos de salario, skill no duplicada por perfil).
- **Tests de integración mínimos** cubriendo al menos los 10 tests mínimos de la spec, incluido el caso de acceso a recurso de otro usuario (403).
- **Completitud básica del perfil**: cálculo y exposición de un indicador de completitud del perfil (porcentaje o secciones pendientes) conforme al criterio de aceptación de la spec.
- **Documentación del sprint**: mini-ADR de decisiones de implementación (ADR-0010), e informe final del sprint.

## Fuera de alcance

Sprint 02 no incluye, ni siquiera de forma parcial:

- Frontend Next.js (`apps/web`) y cualquier pantalla.
- Dashboard.
- Jobs / ofertas.
- Saved jobs.
- Match básico.
- Perfil público visible para recruiters o empresas.
- Recruiters, empresas, admin o cualquier rol distinto de `CANDIDATE`.
- Exportación del perfil a PDF.
- Importación desde LinkedIn o CV externo.
- Subida de foto / archivos (solo URL externa, sin upload).
- IA de cualquier tipo.
- Deploy a cualquier entorno.
- Docker nuevo o cambios de infraestructura de contenedores.
- CI/CD.
- Monetización.

Si una de estas áreas parece necesaria para que Profile funcione, se trata como dependencia bloqueante, no como ampliación del sprint.

## Archivos permitidos por fase

La lista de archivos permitidos **no es global**. Se autoriza por fases, prompt a prompt, con listas cerradas y rutas concretas. Reglas por fase:

- **Startup + Alignment Report**: solo lectura. Sin archivos modificados. Comandos git de diagnóstico de solo lectura. Salida: informe en chat.
- **SDD Review**: solo lectura. Archivos accesibles: la spec de perfil y los ADR-0005 a 0009. Sin escritura.
- **Decision Capture (mini-ADR)**: crear únicamente `docs/decisions/ADR-0010-sprint-02-profile-implementation-decisions.md`.
- **TDD Planning**: solo lectura más, opcionalmente, plan documental. Si se guarda, en `docs/sprints/sprint-02-profile-cv-plan.md` mediante prompt aparte autorizado.
- **Implementación**: cada prompt declara su propia lista cerrada, pequeña, sin comodines amplios. Áreas previstas (orientativo, siempre por prompt):
  - `apps/api/prisma/schema.prisma` y la migración generada, solo si el prompt lo autoriza explícitamente.
  - `apps/api/src/profile/**` para router, servicio, schemas Zod y validadores de ownership del perfil.
  - `apps/api/src/profile/*.test.ts` para tests de integración del módulo.
  - `apps/api/src/app.ts` solo si una fase necesita montar el `profileRouter`, declarándolo explícitamente.
- **Verificaciones**: sin nuevos archivos de código. Pueden generarse logs/transcripts de tests, no añadidos al repo.
- **Audit**: sin escritura sobre código. Informe en chat o, si el operador lo autoriza, en archivo documental aparte.
- **Informe final**: sin escritura sobre código. Si el operador lo autoriza, `docs/sprints/sprint-02-profile-cv-final-report.md`.

No se admiten comodines amplios tipo `apps/**` o `**/*` para todo el sprint.

## Archivos prohibidos

Salvo autorización explícita y documentada en un prompt operativo:

- Rama `main`.
- Rama `dev`.
- `.claude/` y cualquier contenido suyo.
- `JobIT-platform/` como subcarpeta del repo (señal de repo anidado, condición de kill-switch).
- `apps/web/**` (frontend) y cualquier pantalla.
- `apps/api/src/auth/**` (módulo Auth ya entregado): no se reimplementa ni se modifica; solo se importa `requireAuth` y `AuthenticatedRequest`.
- `package.json` y cualquier `package.json` de paquetes hijos sin autorización explícita.
- Lockfiles: `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, sin autorización explícita. (Nota operativa: este monorepo usa **pnpm**; un `package-lock.json` es un artefacto anómalo y no debe comitearse.)
- `docker-compose.yml` y cualquier compose adicional.
- Scripts de deploy y configuración de despliegue.
- Configuración de CI/CD (`.github/workflows/**`, etc.).
- [AGENTS.md](../../AGENTS.md), [CLAUDE.md](../../CLAUDE.md), `docs/context/current-state.md`.
- Cualquier archivo no listado en el prompt operativo en curso.

Cualquier intento de tocar uno de estos sin autorización activa el kill-switch.

## Secuencia de prompts

La ejecución sigue esta secuencia ordenada. Cada paso es un prompt operativo independiente. Ninguno se inicia si el anterior no terminó con `PASS` o `PASS_WITH_NOTES` aceptado por el operador. Regla por defecto: "un prompt = una fase".

1. **Startup + Alignment Report**. Ritual completo de `executor-startup-skill.md`: verificación de repo, top-level, rama (esperada `feat/sprint-02-profile-cv`), working tree limpio, ausencia de repo anidado, lectura de documentos base, listado de spec y ADRs aplicables. Solo lectura. Decisión `PASS / PASS_WITH_NOTES / BLOCKED`.
2. **SDD Review**. Revisar la spec de perfil contra ADR-0005 a 0008. Confirmar cobertura de objetivo, alcance, modelos, endpoints, ownership, validaciones, errores, criterios de aceptación y tests mínimos. Identificar y dejar listas para cierre las decisiones abiertas (creación lazy vs. automática, 403 vs. 404, alineación `/api`). Solo lectura.
3. **Decision Capture**. Crear `ADR-0010` con las decisiones cerradas en SDD Review.
4. **TDD Planning**. Traducir los 10 tests mínimos de la spec a un plan concreto por área de endpoint; nombrar archivos de test esperados sin crearlos; identificar dependencias (Supertest, `jobit_test`, fixtures). Solo lectura.
5. **Implementación por fases pequeñas** (una capa por prompt, cada una empezando por tests o contrato según la Regla TDD obligatoria):
   - 5.1 Modelos Prisma de perfil + migración inicial contra `jobit_test`. (Fase con justificación TDD: verificación por inspección de migración y `migrate deploy`.)
   - 5.2 `GET /api/profile/me` con creación lazy del perfil (según ADR-0010) + tests.
   - 5.3 `PUT /api/profile/me` (datos básicos) con validación Zod + tests.
   - 5.4 Skills: `POST` y `DELETE /api/profile/me/skills[/:id]` con no-duplicado y ownership + tests.
   - 5.5 Experiencia: `POST` / `PUT` / `DELETE /api/profile/me/experience[/:id]` con coherencia de fechas y ownership + tests.
   - 5.6 Educación: `POST` / `PUT` / `DELETE /api/profile/me/education[/:id]` + tests.
   - 5.7 Proyectos: `POST` / `PUT` / `DELETE /api/profile/me/projects[/:id]` + tests.
   - 5.8 Enlaces y preferencias: `PUT /api/profile/me/links`, `PUT /api/profile/me/preferences` (upsert 1:1) + tests.
   - 5.9 Indicador de completitud del perfil expuesto en `GET /api/profile/me` + tests.
   - (El número y agrupación de fases es orientativo; el operador puede subdividir, pero ningún prompt mezcla más de una fase sin autorización.)
6. **Verificaciones**. Ejecutar el bloque de verificaciones obligatorias. Documentar salida. Los fallos vuelven a una fase de Implementación específica, no se corrigen en el mismo prompt de verificación.
7. **Audit**. Aplicar `audit-quality-security-skill.md` sobre el conjunto. Emitir `PASS / PASS_WITH_NOTES / FAIL`. En `FAIL`, kill-switch y vuelta a Implementación.
8. **Informe final**. Emitir el informe en el formato definido, listo para alimentar la PR hacia `dev`.

## Criterios de aceptación

Sprint 02 se considera válido cuando:

- Existe un Alignment Report aceptado al inicio del sprint.
- Se realizó la SDD Review sobre la spec de perfil y se cerraron las decisiones abiertas en ADR-0010.
- Se respetaron ADR-0005, ADR-0007 y ADR-0008 (Express+Zod, REST `/api` con errores normalizados y `userId` del token, PostgreSQL+Prisma).
- Los modelos `CandidateProfile`, `Skill`, `Experience`, `Education`, `Project`, `Link` y `JobPreferences` existen en `schema.prisma` con relaciones y cascada correctas, y la migración aplica limpiamente sobre `jobit_test`.
- Los endpoints privados bajo `/api/profile/me` funcionan conforme a la spec y todos pasan por `requireAuth`.
- El ownership es estricto: ningún usuario puede leer ni modificar el perfil o sub-recursos de otro; el caso de recurso ajeno devuelve 403 conforme a la spec.
- El `userId` se obtiene siempre del token; nunca del body ni de la query.
- Existen tests de integración que cubren al menos los 10 tests mínimos de la spec, incluido el de acceso a recurso ajeno (403), y todos pasan.
- El perfil expone un indicador de completitud básica.
- No se tocaron archivos fuera de los listados en cada prompt; no se modificó Auth ni el frontend.
- La auditoría final devolvió `PASS` o `PASS_WITH_NOTES` documentado.
- El informe final se entregó en el formato definido y la PR hacia `dev` cumple `docs/agents/pr-checklist.md`.

Sprint 02 **no** es válido si: se trabajó en rama incorrecta; se aceptó `userId` del cliente; se permitió acceso cruzado entre usuarios; se crearon endpoints públicos; se reimplementó Auth; se mezclaron jobs/saved jobs/match/dashboard; se creó código sin tests previos sin justificación; o la auditoría no fue `PASS`/`PASS_WITH_NOTES`.

## Verificaciones obligatorias

Bloque base, aplicable en todas las fases:

```bash
git branch --show-current
git status --short
git diff --check
```

Bloque adicional, para fases con código implementado (en Verificaciones y antes de la PR):

```bash
pnpm --filter @jobit/api typecheck
pnpm --filter @jobit/api test
pnpm --filter @jobit/api build
```

Reglas sobre los comandos:

- Este monorepo usa **pnpm**; los scripts reales del paquete `@jobit/api` son los anteriores. No se usa `npm`.
- La base de datos de test `jobit_test` (PostgreSQL en `localhost:5434`) debe estar disponible antes de ejecutar tests de integración. `DATABASE_URL_TEST` se provee como variable local de entorno / `.env.test`, nunca versionada.
- Si una verificación no aplica en una fase concreta, se indica explícitamente con una nota; no se omite en silencio.

## Condiciones de kill-switch

Se heredan todas las condiciones de [docs/agents/kill-switch-rules.md](../agents/kill-switch-rules.md). Para Sprint 02 se añaden, específicas:

- Aceptar `userId` (o id de perfil) desde el body o la query en lugar de derivarlo del token verificado.
- Permitir que un usuario lea, actualice o borre el perfil o cualquier sub-recurso de otro usuario (fallo de ownership).
- Crear endpoints de perfil públicos o sin pasar por `requireAuth`.
- Reimplementar, duplicar o modificar el módulo Auth (`apps/api/src/auth/**`) en lugar de consumirlo.
- Tocar el frontend (`apps/web/**`).
- Mezclar Profile con módulos fuera de alcance (jobs, saved jobs, match, dashboard) en el mismo sprint.
- Modificar `schema.prisma` o crear migraciones sin un prompt específico que lo autorice.
- Empezar una fase de implementación por código productivo sin tests previos ni justificación explícita (violación de la Regla TDD obligatoria).
- Introducir subida de archivos, exportación PDF, importación de CV/LinkedIn o IA.
- Modificar manifests o lockfiles sin autorización; comitear un `package-lock.json` (artefacto anómalo en repo pnpm).
- Trabajar sobre `main` o `dev` directamente, o crear la rama desde un `dev` local desactualizado respecto a `origin/dev`.
- Crear una subcarpeta `JobIT-platform/` (repo anidado) o carpetas raíz no autorizadas.

Ante cualquiera de estas condiciones, el ejecutor activa kill-switch, emite informe `BLOCKED`, no modifica más archivos y espera decisión del operador.

## Formato de informe final

El informe de cierre del sprint sigue exactamente esta estructura:

```md
# Informe final

## Sprint o tarea
## Objetivo inicial
## Trabajo realizado
## Archivos modificados
## Tests y verificaciones
## Decisiones técnicas
## Problemas encontrados
## Pendiente
## Recomendación para el orquestador
## Prompt sugerido para continuar
```

Reglas sobre el informe:

- Cada sección se rellena con contenido real, sin marcadores.
- `Archivos modificados`: lista exacta de rutas afectadas en todo el sprint, agrupadas por fase si ayuda.
- `Tests y verificaciones`: comandos ejecutados, resultados (pasados/fallados/omitidos con justificación) y cobertura de los tests mínimos de la spec.
- `Decisiones técnicas`: decisiones cerradas durante el sprint (creación lazy vs. automática del perfil, política 403/404, estrategia de upsert de links/preferences, cálculo de completitud), con referencia a ADR-0010.
- `Problemas encontrados`: incidencias reales, kill-switches activados, correcciones aplicadas.
- `Pendiente`: deuda técnica aceptada, mejoras diferidas, riesgos abiertos.
- `Recomendación para el orquestador`: siguiente paso natural (abrir PR, corregir, planear Sprint 03).
- `Prompt sugerido para continuar`: propuesta concreta del próximo prompt operativo, conforme al contrato de `codex-claude-skill-invocation.md`.

Este informe es la entrada natural a la descripción de la PR y a la actualización documental que exige `sdd-tdd-ai-audit-workflow.md`.
