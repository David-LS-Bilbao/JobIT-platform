# Sprint 06 — Candidate Dashboard Agent Brief

> Documento de Fase 0 (documental). Fija contexto, alcance, decisión de
> arquitectura, contrato preliminar, plan SDD/TDD, riesgos y criterios de
> aceptación **antes** de cualquier implementación. No implementa código.
>
> Spec fuente: [docs/specs/features/dashboard.md](../specs/features/dashboard.md).
> Decisiones aplicables: ADR-0005, ADR-0006, ADR-0007, ADR-0008.

## Estado de partida

- Rama activa: `feat/sprint-06-candidate-dashboard`, working tree limpio.
- Alineada con `origin/dev` en `e076852` (mismo commit; sin divergencia).
- Backend Express bajo prefijo `/api` (ADR-0007), Prisma/PostgreSQL (ADR-0008),
  auth JWT access token + refresh token en cookie HttpOnly (ADR-0006).
- Módulos previos cerrados e integrados en `dev`:
  - **M01 Auth MVP** — registro/login/logout/me, `requireAuth`, JWT.
  - **M02 Profile/CV** — perfil, skills, experiencia, educación, proyectos,
    links, preferencias; cálculo de completitud.
  - **M02.5 Hardening Profile/CV**.
  - **M03 Jobs MVP** + **M03.5 Jooble backend-only** + **M03.6 visibility policy**.
  - **M04 Saved Jobs MVP**.
  - **M05 Match básico explicable** — scoring puro, determinista, sin red externa.
- Servicios reales ya disponibles y reutilizables (verificados en código):
  - `requireAuth` expone `req.auth.userId` ([require-auth.middleware.ts](../../apps/api/src/auth/require-auth.middleware.ts)).
  - `getOrCreateCandidateProfile(userId)` y `calculateCompletionPercentage(profile)`
    ([profile.service.ts](../../apps/api/src/profile/profile.service.ts)).
  - `listSavedJobs(userId)` ordenado por `savedAt` desc ([saved-jobs.service.ts](../../apps/api/src/saved-jobs/saved-jobs.service.ts)).
  - `getTopMatchesForUser(userId, limit)` ordenado por `score` desc ([match.service.ts](../../apps/api/src/match/match.service.ts)).
  - `serializeJob` / `JobPublicDto` sin `externalId` ni `ingestedAt` ([jobs.serializer.ts](../../apps/api/src/jobs/jobs.serializer.ts)).

## Objetivo del sprint

Dar al candidato autenticado una **vista de entrada agregada** que resuma el
estado de su perfil, su actividad reciente (ofertas guardadas, matches) y
próximos pasos útiles. El dashboard **no añade funcionalidad nueva**: compone y
presenta información ya existente de M01–M05. Es **backend-first**,
**candidate-first**, **privado** y **solo lectura**.

## Decisión operativa de arquitectura

La spec deja abierta la composición entre:

- **Opción A** — endpoint agregado en backend.
- **Opción B** — composición en cliente desde endpoints existentes.

**Decisión operativa de este sprint: Opción A — endpoint privado agregado en backend.**

Justificación frente a la Opción B:

- El objetivo declarado del Sprint 06 es **implementar un endpoint backend-first**;
  la Opción B no produce código backend nuevo y desplaza el trabajo al frontend,
  que está fuera de alcance.
- Centralizar la composición en el servidor mantiene `userId` derivado del token
  en un único punto (ADR-0007 §"Separación de datos por usuario") y evita que el
  cliente orqueste varias llamadas privadas.
- Permite garantizar en un solo lugar que la salida usa los serializers públicos
  (`serializeJob`) y no filtra campos internos.
- Produce una respuesta determinista y testeable con tests de integración, en
  línea con el flujo SDD/TDD del proyecto.
- Reduce viajes de red y acoplamiento del frontend a la forma interna de cada módulo.

La forma exacta del DTO se cierra en SDD Review + TDD Planning (ver más abajo).

## Alcance

Entra en Sprint 06:

- Un nuevo módulo backend `dashboard` (router + service + schemas + tests),
  montado bajo `/api`.
- Un endpoint privado de solo lectura que agrega: completitud de perfil,
  últimas ofertas guardadas, mejores matches y próximos pasos orientativos.
- Reutilización estricta de servicios y serializers existentes de M02/M04/M05.
- Tests de integración (auth, ownership, estados vacíos, no exposición de campos
  internos, shape estable).
- Informe final de sprint y actualización documental global al cierre.

## Fuera de alcance

Queda explícitamente fuera de este sprint:

- Frontend.
- UI real.
- Nuevas tablas (salvo justificación posterior vía ADR).
- Persistencia de métricas.
- IA avanzada.
- Embeddings.
- LLMs.
- Evaluación automática de candidatos.
- Recruiter.
- ATS.
- Admin.
- Scraping.
- Nuevas APIs externas.
- Llamadas reales a Jooble.
- Cron / scheduler / n8n.
- Monetización.
- Deploy.
- CI/CD.
- Cambios grandes en Auth / Profile / Jobs / Saved Jobs / Match (solo se
  consumen sus servicios públicos; no se reescriben).

## Endpoint previsto

Contrato base propuesto:

```
GET /api/dashboard/me
```

- Ruta **privada**.
- Protegida por **`requireAuth`**.
- `userId` obtenido **solo** desde `req.auth.userId`.
- **Sin** `userId` por body, query ni params.
- **Sin** request body.
- **Sin** query params obligatorios (si en SDD se decide un parámetro de límite,
  será opcional con default seguro y validado en servidor).
- Respuesta `200` con cuerpo JSON; `401` si no hay sesión válida.

Coherente con ADR-0007: recursos del candidato autenticado bajo `/me`
(`/api/profile/me`, `/api/profile/me/matches`). El router se montará en `/api`
sin modificar los routers de otros módulos.

## Contrato preliminar de respuesta

DTO **preliminar** (la forma exacta se cierra en SDD Review + TDD Planning). Solo
incluye datos que ya existen en backend; los campos sin respaldo actual se marcan
como **a confirmar**.

```jsonc
{
  "profile": {
    "firstName": "string|null",
    "lastName": "string|null",
    "completeness": 65            // calculateCompletionPercentage(profile) (0-100)
    // "missingFields": [...]     // A CONFIRMAR: hoy el backend solo expone un %,
    //                            // no una lista de campos pendientes (ver Riesgos)
  },
  "skills": ["string"],          // profile.skills (nombres); forma a confirmar
  "savedJobs": {
    "total": 4,                   // nº total de guardadas del usuario
    "recent": [ /* SavedJobDto (savedAt + JobPublicDto), top N */ ]
  },
  "matches": [ /* ProfileJobMatchDto: { job: JobPublicDto, score, level, matchedSkills, missingSkills }, top N */ ],
  "metrics": {                    // A CONFIRMAR en SDD: solo agregados derivables
    // p.ej. savedJobsCount, matchesCount; sin métricas persistidas
  },
  "nextActions": [                // mapea a "nextSteps" de la spec
    { "action": "complete_profile", "label": "..." },
    { "action": "explore_jobs", "label": "..." }
  ]
}
```

Notas de fidelidad al backend real:

- `profile.completeness` proviene de `calculateCompletionPercentage` (7 secciones,
  entero 0–100). **No existe** hoy una lista `missingFields`; si se quiere, debe
  derivarse en SDD sin inventar datos.
- `savedJobs.recent[].job` y `matches[].job` deben usar `JobPublicDto` vía
  `serializeJob` (sin `externalId` ni `ingestedAt`).
- `matches` reutiliza `ProfileJobMatchDto` y `getTopMatchesForUser(userId, limit)`.
- `nextActions` son sugerencias orientativas (no bloquean al candidato).

**La forma exacta del DTO se cerrará en SDD Review + TDD Planning antes de implementar.**

## Mapa de composición de servicios existentes

| Bloque dashboard | Módulo fuente | Servicio / serializer / DTO a reutilizar | Riesgo | Regla de seguridad |
|---|---|---|---|---|
| Perfil + completitud | M02 Profile/CV | `getOrCreateCandidateProfile(userId)`, `calculateCompletionPercentage(profile)` | `missingFields` no existe hoy; no inventar | Solo `req.auth.userId`; no exponer campos internos del perfil |
| Skills | M02 Profile/CV | `profile.skills` (de `ProfileWithRelations`) | Decidir si se devuelven nombres normalizados o display | Datos solo del usuario autenticado |
| Saved Jobs recientes | M04 Saved Jobs | `listSavedJobs(userId)` → `SavedJobDto[]` (orden `savedAt` desc), `total` por longitud | Limitar a top N en el dashboard (servicio no limita) | Filtrado por `userId`; `job` vía `serializeJob` |
| Serialización de ofertas | M03 Jobs | `serializeJob` / `JobPublicDto` | No duplicar serializer; no crear DTO paralelo | Nunca exponer `externalId` ni `ingestedAt` |
| Matches recomendados | M05 Match | `getTopMatchesForUser(userId, limit)` → `ProfileJobMatchDto[]` (orden `score` desc) | Determinista, sin red externa; respetar `limit` | Cálculo en servidor; sin `userId` externo |
| Autenticación / sesión | M01 Auth | `requireAuth` → `req.auth.userId` | No leer identidad de body/query/params | `401` si no hay token válido |

## Seguridad y ownership

- El endpoint usa **exclusivamente `req.auth.userId`** (poblado por `requireAuth`).
- **No** se acepta `userId` (ni ningún identificador de usuario) desde body, query
  o params.
- **No** se exponen datos de otros usuarios: toda consulta se filtra por el
  `userId` del token (ADR-0007 §"Separación de datos por usuario").
- **No** se exponen secretos ni campos internos: `passwordHash`, refresh tokens
  (`RefreshToken`), `externalId`, `ingestedAt` ni cualquier dato sensible.
  Las ofertas se serializan siempre con `serializeJob`.
- **No** se confía en el frontend: la validación y el filtrado de datos son
  responsabilidad del servidor.

## Reglas de negocio iniciales

Según la spec [dashboard.md](../specs/features/dashboard.md):

- Funciona con **perfil incompleto** (devuelve la completitud calculada y CTAs).
- Funciona **sin ofertas guardadas** (bloque en estado vacío).
- Funciona **sin matches** (bloque en estado vacío).
- **Últimas ofertas guardadas limitadas** (la spec indica las últimas 3, por
  `savedAt` desc).
- **Mejores matches limitados** (la spec indica los 3 con mayor `score`).
- **Respuesta determinista** (sin aleatoriedad).
- **Sin llamadas externas** (no Jooble, no red).
- **Sin IA avanzada** (sin embeddings ni LLMs).
- **Tolerancia a datos ausentes** (perfil/skills/guardadas/matches vacíos no
  rompen la respuesta).

La spec describe además **tolerancia a errores por bloque** (un fallo en un bloque
no rompe el resto). Se documenta aquí como **decisión a revisar en SDD Review**
(p.ej. respuesta parcial vs. fallo global), **no como implementación cerrada**.

## Plan SDD/TDD del sprint

1. **SDD Review** — contrastar [dashboard.md](../specs/features/dashboard.md)
   contra el backend real; cerrar campos del DTO y decidir `missingFields`,
   `metrics` y tolerancia a errores por bloque.
2. **TDD Planning** — derivar la lista de tests RED a partir de la spec.
3. **Decisión ADR si aplica** — solo si surge una decisión arquitectónica nueva
   (p.ej. forma de agregación o tolerancia a fallos). Si no, no se crea ADR.
4. **Diseño del contrato API** — congelar `GET /api/dashboard/me` y el DTO final.
5. **Tests RED** — escribir tests de integración que fallen.
6. **Implementación GREEN** — módulo `dashboard` que componga servicios existentes.
7. **Verificaciones** — test, typecheck, build y `git diff --check`.
8. **Auditoría quality/security** — checklist documental + revisión de no
   exposición de campos internos.
9. **Informe final** — `docs/sprints/sprint-06-candidate-dashboard-final-report.md`.
10. **Actualización documental global** — estado del proyecto y referencias.
11. **PR checklist** — según [docs/agents/pr-checklist.md](../agents/pr-checklist.md).

## Tests mínimos previstos

- Requiere autenticación (`401` sin token válido).
- No acepta `userId` externo (body/query/params se ignoran; se usa el del token).
- Solo devuelve datos del usuario autenticado (no datos de otros candidatos).
- Funciona con **perfil incompleto** (devuelve completitud parcial).
- Funciona **sin saved jobs** (bloque vacío).
- Funciona **sin matches** (lista vacía).
- Serializa ofertas con el **contrato público** (`JobPublicDto`).
- **No** expone `externalId` ni `ingestedAt`.
- **No** expone hashes, tokens ni secretos.
- Respuesta con **shape estable** (claves presentes aun en estados vacíos).

## Criterios de aceptación

- [ ] El candidato autenticado obtiene su dashboard en `GET /api/dashboard/me`.
- [ ] La respuesta incluye el porcentaje de completitud del perfil.
- [ ] La respuesta incluye las últimas ofertas guardadas (limitadas).
- [ ] La respuesta incluye los mejores matches por score (limitados).
- [ ] La respuesta incluye próximos pasos orientativos según el estado.
- [ ] Un candidato no puede ver el dashboard de otro candidato.
- [ ] Los estados vacíos (sin perfil completo, sin guardadas, sin matches) se
      manejan sin error y con shape estable.
- [ ] No se exponen campos internos ni secretos.
- [ ] `test`, `typecheck` y `build` pasan; `git diff --check` limpio.

## Riesgos y kill-switch

Disparadores que obligan a marcar **BLOCKED** y detener (ver
[docs/agents/kill-switch-rules.md](../agents/kill-switch-rules.md) y
[operator-safety-checklist.md](../agents/operator-safety-checklist.md)):

- Rama activa incorrecta (no `feat/sprint-06-candidate-dashboard`).
- Working tree sucio no explicado.
- Repositorio anidado (`JobIT-platform/.git` interno).
- Implementación sin SDD/TDD aprobado.
- Aceptar `userId` externo (body/query/params).
- Ruta sin `requireAuth`.
- Devolver datos de otro usuario.
- Duplicar serializers (crear un DTO de oferta paralelo en vez de `serializeJob`).
- Exponer campos internos (`passwordHash`, refresh tokens, `externalId`, `ingestedAt`).
- Llamadas externas (Jooble u otras APIs/red).
- Cambios en frontend (`apps/web/**`).
- Cambios en `package.json` / lockfiles / dependencias.
- Commits / push / merge sin autorización explícita.

Riesgo documental específico: la spec menciona `missingFields` y un bloque de
métricas que **no tienen respaldo directo** en el backend actual. No inventar su
contenido; resolver en SDD Review.

## Verificaciones esperadas al cierre técnico

```
pnpm --filter @jobit/api test
pnpm --filter @jobit/api typecheck
pnpm --filter @jobit/api build
git diff --check
git status --short
```

## Próximo paso

El próximo paso será la **SDD Review** de
[docs/specs/features/dashboard.md](../specs/features/dashboard.md) contra el
backend real, para cerrar el DTO final, decidir `missingFields`/`metrics` y la
estrategia de tolerancia a errores por bloque antes de planificar los tests RED.
