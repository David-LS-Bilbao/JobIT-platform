# Informe final — Sprint 06 Candidate Dashboard

## Sprint o tarea

Sprint 06 — Candidate Dashboard.

## Objetivo inicial

Implementar un endpoint privado de dashboard del candidato autenticado,
**backend-first** y **candidate-first**, de **solo lectura**, que **componga
servicios ya existentes** (Auth, Profile/CV, Saved Jobs, Match) en una vista
agregada de entrada. Sin funcionalidad nueva de dominio, **sin IA avanzada**,
**sin persistencia nueva**, sin llamadas externas y sin frontend.

## Estado de partida

- Rama `feat/sprint-06-candidate-dashboard`.
- Base `e076852`, alineada con `origin/dev` al iniciar el sprint (confirmado en el
  Startup + Alignment Report).
- Sprints previos integrados en `dev`: Auth (M01), Profile/CV (M02 + 02.5),
  Jobs (M03), Jooble backend-only (M03.5), Jobs API visibility (M03.6),
  Saved Jobs (M04), Match básico explicable (M05).
- Frontend y deploy: pendientes (fuera de alcance de este sprint).

## Trabajo realizado

- **Startup + Alignment Report:** verificación de rama/estado, repo no anidado,
  spec presente → `READY_FOR_PHASE_0`.
- **Fase 0 — Brief documental:** contexto, decisión de arquitectura (Opción A),
  contrato preliminar, plan SDD/TDD, riesgos y kill-switch.
- **SDD Review:** contraste de la spec contra el backend real; cierre de
  decisiones (completionPercentage, sin missingFields/metrics, límites 3,
  tolerancia por bloque pospuesta) → `READY_FOR_TDD_PLANNING`, sin spec update ni ADR.
- **TDD Planning:** plan de tests por grupos (Auth, Ownership, Contract/DTO,
  Empty states, Saved Jobs, Match, Serialization/Security, nextActions,
  No external/No AI) → `READY_FOR_TESTS_RED`.
- **Tests RED:** `dashboard.integration.test.ts` con 15 tests; todos fallando por
  `404` (endpoint inexistente), sin errores de setup → `RED_CONFIRMED_READY_FOR_GREEN`.
- **Implementación GREEN:** módulo `dashboard` (types/service/router) + montaje en
  `app.ts`; 15/15 en verde → `GREEN_CONFIRMED_READY_FOR_VERIFICATION`.
- **Verificaciones finales técnicas:** test específico, suite completa, typecheck,
  build, diff y alcance → `VERIFICATION_PASS_READY_FOR_AUDIT`.
- **Auditoría quality/security:** seguridad, ownership, contrato, reutilización,
  alcance y calidad → `AUDIT_PASS_WITH_NOTES_READY_FOR_FINAL_REPORT`.

## Archivos creados

- `docs/sprints/sprint-06-candidate-dashboard-agent-brief.md`
- `docs/sprints/sprint-06-candidate-dashboard-tdd-plan.md`
- `docs/sprints/sprint-06-candidate-dashboard-final-report.md`
- `apps/api/src/dashboard/dashboard.integration.test.ts`
- `apps/api/src/dashboard/dashboard.types.ts`
- `apps/api/src/dashboard/dashboard.service.ts`
- `apps/api/src/dashboard/dashboard.router.ts`

## Archivos modificados

- `apps/api/src/app.ts` (2 líneas: import del router + `app.use("/api/dashboard", dashboardRouter)`).

No se modificaron: frontend (`apps/web/**`); Prisma/schema/migraciones;
`package.json`; `pnpm-lock.yaml`; specs; README; `.env` ni variantes;
`docker/**`; CI/CD (`.github/**`).

## Endpoint implementado

- **Método:** GET.
- **Ruta:** `/api/dashboard/me`.
- **Auth:** `requireAuth` (obligatorio).
- **Identidad:** `req.auth.userId`.
- **Sin** `userId` por body/query/params.

## Contrato de respuesta

```jsonc
{
  "profile": {
    "firstName": "string|null",
    "lastName": "string|null",
    "headline": "string|null",
    "completionPercentage": 0
  },
  "skills": ["string"],
  "savedJobs": {
    "total": 0,
    "recent": []
  },
  "matches": [],
  "nextActions": []
}
```

- `completionPercentage`, **no** `completeness`.
- **No** `missingFields`.
- **No** objeto `metrics` separado.
- **No** tolerancia parcial por bloque.
- `savedJobs.recent` limitado a 3 (orden `savedAt` desc); `savedJobs.total` cuenta todas.
- `matches` limitado a 3 (orden `score` desc), cada item con `job` (`JobPublicDto`),
  `score`, `level`, `matchedSkills`, `missingSkills`.
- `nextActions` deterministas: `complete_profile` (si `completionPercentage < 100`)
  y `explore_jobs` (si `savedJobs.total === 0` o `matches.length === 0`).

## Reutilización de servicios existentes

- **Profile/CV:** `getOrCreateCandidateProfile(userId)`.
- **Completion:** `calculateCompletionPercentage(profile)` (sin duplicar lógica).
- **Saved Jobs:** `listSavedJobs(userId)`.
- **Jobs serializer / JobPublicDto:** reutilizado **indirectamente** vía los
  contratos públicos de Saved Jobs (`SavedJobDto`) y Match (`ProfileJobMatchDto`);
  sin serializer paralelo.
- **Match:** `getTopMatchesForUser(userId, 3)`.
- **Auth:** `requireAuth` y `AuthenticatedRequest`.
- **Sin Prisma directo** en `dashboard.service.ts`.

## Tests y verificaciones

- **Tests RED:** 15 tests inicialmente fallando por `404` (endpoint inexistente).
- **GREEN:** 15/15 tests del dashboard pasan.
- **Suite completa API:** 278/278 tests pasan.
- **Typecheck:** sin errores (`tsc --noEmit`).
- **Build:** sin errores (`tsc -p tsconfig.build.json`).
- **git diff --check:** limpio.
- **dist/:** generado por build, ignorado por git; no contamina `git status`.
- **Lint:** no existe script de lint específico en `@jobit/api` (`package.json` solo
  define `test`, `typecheck`, `build`, `dev`, `start`, `clean`); no se ejecutó lint.

## Seguridad y ownership

- Endpoint **privado** (`requireAuth`).
- `userId` derivado **solo** del token (`req.auth.userId`).
- **No** se aceptan identificadores de usuario externos (body/query/params).
- **Aislamiento por usuario:** todos los servicios reciben el `userId` autenticado
  y filtran por él; tests de ownership y de intento de suplantación en verde.
- **No** se exponen `passwordHash`, `tokenHash` ni refresh tokens.
- **No** se exponen `externalId` ni `ingestedAt` (jobs vía `serializeJob`).
- **Sin** secretos ni variables de entorno en la respuesta.
- **Sin** llamadas externas.
- **Sin** IA avanzada.
- **Sin** evaluación automatizada de candidatos.
- **Sin** ranking para recruiters.

## Decisiones técnicas

- **Opción A** — endpoint agregado en backend (frente a composición en cliente).
- Ruta `GET /api/dashboard/me` (convención `/me`, ADR-0007).
- `savedJobs.recent` limitado a 3.
- `matches` limitado a 3 vía `getTopMatchesForUser(userId, 3)`.
- `skills` usando `normalizedName`.
- `nextActions` deterministas (`complete_profile`, `explore_jobs`).
- **Sin `missingFields`** por no existir respaldo en el backend (solo hay % agregado).
- **Sin objeto `metrics` separado** por no haber métricas persistidas.
- **Sin tolerancia parcial por bloque** en el MVP (fallo global por el error handler).
- **Sin ADR nueva** (cubierto por ADR-0007/0008 y la spec).

## Auditoría quality/security

- **Estado:** `AUDIT_PASS_WITH_NOTES_READY_FOR_FINAL_REPORT`.
- **Críticos:** ninguno.
- **Mayores:** ninguno.
- **Menores / notas:**
  - `skills` usa `normalizedName` (p. ej. en minúsculas); el frontend deberá
    considerarlo para presentación.
  - Awaits secuenciales en el servicio; `Promise.all` para `savedJobs` y `matches`
    sería una optimización opcional futura.
  - `headline` incluido como cabecera de bienvenida útil, sin exposición sensible.

## Problemas encontrados

- RED esperado por `404` mientras la ruta no estaba montada (comportamiento correcto).
- Diferencia entre el ejemplo **orientativo** de la spec (`completeness`) y el
  backend real (`completionPercentage`); resuelta usando `completionPercentage`.
- `missingFields` y `metrics` no implementados por falta de respaldo en el backend real.
- Tolerancia parcial por bloque pospuesta (más propia de la composición en cliente).

## Pendiente / backlog

- Actualización global de documentación y README.
- PR checklist.
- Posible optimización futura con `Promise.all` en el servicio.
- Frontend del Candidate Dashboard.
- Deploy dev/staging.
- Mantener `missingFields`/`metrics` como posible mejora futura **si se especifica**.
- No implementar IA avanzada en el MVP.

## Estado actual del proyecto

- El backend MVP incluye ahora: Auth, Profile/CV, Jobs, Jooble backend-only,
  Jobs API visibility policy, Saved Jobs, Match básico explicable y Dashboard.
- Pendientes principales: **Frontend** y **Deploy dev/staging**.
- Sprint 06 listo técnicamente para la revisión documental global y el PR checklist,
  pero aún **sin commit, push ni PR**.

## Recomendación para el orquestador

- Aceptar Sprint 06 como **PASS_WITH_NOTES** si la actualización documental global
  y el PR checklist son correctos.
- Después, preparar la fase de **Frontend** o de **Deploy** según la prioridad del
  orquestador.
- **No ampliar** el Dashboard backend salvo necesidad real del frontend.

## Prompt sugerido para continuar

> Fase: Actualización global documental Sprint 06 (solo documentación, sin tocar
> código). Objetivo: reflejar el cierre técnico del Sprint 06 Candidate Dashboard
> en la documentación global del proyecto y en README.md (estado del backend MVP,
> endpoint `GET /api/dashboard/me`, pendientes Frontend/Deploy), sin modificar
> código, specs de features, Prisma ni dependencias. Verificar rama, working tree
> esperado y ejecutar `git diff --check` y `git status --short` al cierre.
