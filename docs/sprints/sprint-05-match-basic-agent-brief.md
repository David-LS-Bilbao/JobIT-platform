# Sprint 05 — Match básico explicable — Agent Brief

> Documento operativo (Fase 0). No implementa código ni modifica specs/Prisma.
> Fija objetivo, alcance, restricciones éticas, contrato heredado, decisiones SDD
> pendientes, algoritmo orientativo, flujo, kill-switch y criterios de aceptación
> del Sprint 05 antes de Startup post-branch, SDD Review y TDD Planning.

## 1. Estado inicial verificado

- **Rama esperada:** `feat/sprint-05-match-basic` (activa; creada desde `dev`).
- **Base actual:** `b9027bf` (Merge PR #24, Sprint 04), equivalente a `dev == origin/dev`; sin commits propios ni divergencia.
- **Working tree:** limpio.
- **Repo anidado:** ninguno (solo el `./.git` raíz).
- **Documentos clave presentes:** `docs/specs/features/match-basic.md`, `candidate-profile-cv.md`, `jobs.md`, `saved-jobs.md`, `external-jobs-jooble.md`, `00-mvp-scope.md`; biblioteca `docs/agents/*`; ADR-0005/0006/0007/0008/0011; informes finales de Sprint 03/03.5/04.
- **Módulos backend existentes sobre los que se construye:** `apps/api/src/auth/` (`requireAuth` → `req.auth.userId`), `apps/api/src/profile/` (perfil, skills, preferencias), `apps/api/src/jobs/` (`serializeJob`/`JobPublicDto`, servicio/validación), `apps/api/src/saved-jobs/` (patrón schemas/service/router), `apps/api/prisma/schema.prisma` (`CandidateProfile`, `Skill`, `JobPreferences`, `Job`, `SavedJob`), `apps/api/src/app.ts` (montaje de routers `/api/*`).

## 2. Objetivo del sprint

Implementar un sistema **backend-first** de matching **privado, heurístico, determinista y explicable** entre el perfil/CV del candidato autenticado y las ofertas persistidas en JobIT. El match es **orientativo para el candidato**, no una decisión de contratación ni una evaluación para recruiters. Se calcula en tiempo de petición y no persiste entidad nueva en el MVP.

## 3. Alcance funcional

- Endpoints **privados** de match (rutas finales a confirmar en SDD; orientativas: `GET /api/jobs/:id/match`, `GET /api/profile/me/matches`).
- **Cálculo en tiempo de petición** (sin persistencia; sin caché en el MVP).
- Uso del **perfil/CV del candidato autenticado** (skills, preferencias, seniority).
- Funciona con **ofertas persistidas INTERNAL y JOOBLE** (sin red a Jooble).
- **Explicación legible**: desglose de factores con estado (coincide / no coincide / no aplica) y texto breve.
- Factores: **skills coincidentes** (peso alto), **modalidad remota** (medio), **seniority** (medio), **ubicación** (bajo), y **preferencias laborales** si existen.
- **Reutilización obligatoria de `serializeJob` / `JobPublicDto`** para cualquier Job embebido (p. ej. en `/profile/me/matches`).

## 4. Fuera de alcance

Queda explícitamente fuera:

- frontend;
- dashboard;
- recruiter;
- ATS;
- ranking de candidatos para empresas;
- IA avanzada;
- embeddings;
- LLMs;
- scoring opaco;
- scraping;
- nuevas APIs externas;
- llamadas reales a Jooble;
- cron / scheduler;
- n8n;
- deploy;
- CI/CD;
- monetización;
- cambios grandes en Auth / Profile / Jobs / Saved Jobs.

## 5. Restricciones éticas y de producto

- **Candidate-first**: el match sirve al candidato, no a empresas.
- **Orientativo**: indica afinidad perfil-oferta, no decide contratación.
- **No evaluación automatizada de personas**: el score no juzga al candidato.
- **No ranking para recruiters** ni match inverso.
- **No uso de datos sensibles** ni inferencias sobre características protegidas.
- **Explicación siempre visible**: todo score se acompaña de factores legibles; un perfil incompleto no bloquea, pero se refleja en la explicación.

## 6. Contrato heredado y seguridad

- Todas las rutas son **privadas con `requireAuth`**.
- `userId` se obtiene **siempre** de `req.auth.userId`.
- **Prohibido** aceptar/usar `userId` desde body, query o params.
- **No exponer `externalId`** en ninguna respuesta.
- **No exponer `ingestedAt`** en ninguna respuesta.
- **Reutilizar `serializeJob` / `JobPublicDto`** para Jobs embebidos (sin duplicar serialización; `source`/`sourceUrl` públicos).
- **Errores normalizados** con formato `{ error: { code, message } }` (patrón Jobs/Saved Jobs).
- **No confiar en el frontend**: toda validación crítica en servidor.

## 7. Decisiones SDD pendientes

A resolver en SDD Review (no se deciden aquí):

- **Ubicación definitiva de endpoints** y propiedad de módulo: ¿nuevo módulo `apps/api/src/match/` (servicio reutilizable) consumido por los routers de Jobs/Profile, o handlers añadidos directamente a `jobs.router.ts` / `profile.router.ts`? Implica qué archivos quedan "permitidos" en fases posteriores (tocar Jobs/Profile/app.ts).
- **Rutas finales** (orientativas): `GET /api/jobs/:id/match` y `GET /api/profile/me/matches` (ambas ya contempladas en la tabla de ADR-0007).
- **Pesos exactos** del algoritmo y umbrales de nivel.
- **Mapeo real entre campos Prisma y factores**: `Skill.normalizedName` ↔ `Job.requirements`/`Job.tags`; `JobPreferences.remotePreference` ↔ `Job.remoteType`; `JobPreferences.seniority` ↔ `Job.seniority`; `JobPreferences.preferredLocations` ↔ `Job.location`. Definir normalización y reglas de "no aplica".
- **Si Saved Jobs influye** en el match o queda fuera (probable: fuera del cálculo en MVP).
- **Si hace falta ADR nueva** o si **ADR-0007** (diseño de API) y **ADR-0008** (modelo) ya cubren la decisión (probable: no requiere ADR nueva al no persistir entidad).

## 8. Algoritmo orientativo inicial

Descrito sin implementar:

- **Determinista** (mismas entradas → mismo resultado), sin componentes estadísticos ni aleatorios.
- **Sin persistencia** (cálculo en tiempo de petición).
- **Score 0-100** agregando los factores ponderados.
- **Niveles orientativos** (alineados con la spec): `VERY_LOW` (0-25), `LOW` (26-50), `GOOD` (51-75), `VERY_GOOD` (76-100).
- **`factors` / `reasons` legibles**: cada factor con `name`, `match` (true/false/null), `detail`.
- **`matchedSkills`**: skills del candidato que coinciden con requisitos/tags de la oferta.
- **`missingSkills`**: requisitos/tags relevantes de la oferta ausentes en el perfil.
- **`explanation`**: texto/desglose comprensible del resultado.
- **Perfil incompleto** no bloquea el cálculo (se computa con lo disponible) pero debe reflejarse explícitamente en la explicación (p. ej. sin skills → factor skills "no disponible").

## 9. Flujo obligatorio del sprint

1. Fase 0 — Brief documental.
2. Startup + Alignment Report post-branch.
3. SDD Review.
4. TDD Planning.
5. Decidir si hace falta ADR.
6. Diseño de contrato API.
7. Tests RED.
8. Implementación GREEN.
9. Verificaciones.
10. Auditoría quality/security.
11. Informe final Sprint 05.
12. Prompt final de actualización documental global.
13. PR checklist.
14. Informe para Chat Orquestador.

## 10. Kill-switch específico

Detener y marcar BLOCKED si:

- la rama activa no es `feat/sprint-05-match-basic`;
- el working tree está sucio y no se explica;
- existe repo anidado;
- se implementa antes de SDD/TDD;
- se acepta `userId` desde body / query / params;
- alguna ruta queda sin `requireAuth`;
- se reimplementa Auth / Profile / Jobs / Saved Jobs;
- se duplica la serialización de Job ignorando `serializeJob` / `JobPublicDto`;
- se expone `externalId` o `ingestedAt`;
- se usa IA avanzada, embeddings o LLMs para la lógica de producto;
- se hacen llamadas reales a Jooble;
- se tocan API keys o `.env`;
- se toca frontend;
- se modifica `package.json` o lockfiles sin autorización;
- se crea cron / scheduler / n8n;
- se hace commit / push / merge sin autorización.

## 11. Verificaciones mínimas esperadas

- `pnpm --filter @jobit/api test`
- `pnpm --filter @jobit/api typecheck`
- `pnpm --filter @jobit/api build`
- `git diff --check`
- `git status --short`

`lint` se documentará como **deuda preexistente** si no está configurado en `@jobit/api` (a día de hoy no hay script `lint` en el paquete).

## 12. Criterios iniciales de aceptación

- Rutas **privadas** (`requireAuth`).
- `userId` siempre desde `req.auth.userId` (nunca del cliente).
- **Sin IA avanzada** ni scoring opaco.
- Score **heurístico, determinista y explicable**.
- **Razones legibles** (factores con estado + detalle).
- **Reutilización de `serializeJob` / `JobPublicDto`** para Jobs embebidos.
- **No exponer campos privados** de jobs externos (`externalId`/`ingestedAt`).
- **Compatibilidad con jobs INTERNAL y JOOBLE** persistidos.
- **Tests mínimos** definidos antes de implementar (RED previo a GREEN).
- **Typecheck y build** verdes.
- **Auditoría** quality/security PASS o PASS_WITH_NOTES.
