# Informe final — Sprint 15C Match UI

## Objetivo inicial

Implementar la primera UI privada candidate-first para **JobIT Match**, exponiendo
al candidato el match básico y explicable que ya existía en backend (Sprint 05 · M05).
No se trata de IA ni matching avanzado: solo pintar de forma clara y honesta lo que
el backend calcula (puntuación, nivel de afinidad, skills coincidentes/faltantes) y
enlazar al detalle de oferta, reutilizando los patrones de Jobs/Saved Jobs.

## Alcance entregado

- Ruta privada `/match` con guard de autenticación (redirige a `/login` sin sesión).
- Listado de las mejores ofertas del candidato, ordenadas por afinidad por el backend.
- Card de match con: título (enlace al detalle), empresa, ubicación/modalidad,
  seniority, contrato, **score 0-100 + nivel de afinidad** (badge + barra accesible),
  **skills que coinciden** y **skills que podrías sumar**, botón guardar/quitar y
  enlace "Ver oferta →" a `/jobs/[id]`.
- Estados de carga, error genérico, vacío y listado.
- Copy honesto de cabecera: match básico y explicable con reglas visibles; **sin IA**.
- Activación de "JobIT Match" en el AppShell (de `pending` a enlace real `/match`).
- Tests de `/match` y actualización de los tests de navegación afectados.

## Contratos backend usados

Sin cambios en backend. Se consumió el contrato ya existente:

- **`GET /api/profile/me/matches?limit=N`** (privado, `requireAuth`). Respuesta
  envuelta `{ data: ProfileJobMatchDto[] }`, ya ordenada por `score` descendente.
  `limit` opcional (default backend 10, máximo 50); la UI pide `limit=20`.
  Cada item: `{ job: JobPublicDto, score (0-100), level, matchedSkills[], missingSkills[] }`.
- El endpoint `GET /api/jobs/:id/match` (con `factors` y `explanation`) **no** se usa
  en esta UI: el listado no incluye ese desglose y no se ha añadido un panel por-oferta
  en este sprint (queda como deuda/mejora, ver más abajo).

Niveles de afinidad (definidos por backend, solo se humanizan en cliente):
`VERY_LOW` 0-25, `LOW` 26-50, `GOOD` 51-75, `VERY_GOOD` 76-100.

## Rutas frontend añadidas

- `/match` (`apps/web/src/app/match/page.tsx` → `MatchPage`).

## Componentes creados

- `apps/web/src/features/match/match-api.ts` — `getJobMatches(token, limit?)` sobre
  `apiRequest`; requiere `accessToken`; propaga `ApiClientError` (401/400/500) a la UI.
- `apps/web/src/features/match/match-format.ts` — etiquetas y clases de color por
  nivel (`MATCH_LEVEL_LABELS`, `MATCH_LEVEL_BADGE_CLASS`, `MATCH_LEVEL_BAR_CLASS`) y
  `clampScore` defensivo. No recalcula el score.
- `apps/web/src/features/match/match-card.tsx` — `MatchCard`; reutiliza los helpers
  puros de `jobs-format.ts` (`locationLabel`, `SENIORITY_LABELS`, `formatContractType`)
  sin modificar Jobs.
- `apps/web/src/features/match/match-page.tsx` — `MatchPage`; guard de auth, estados,
  guardar/quitar reutilizando `saved-jobs-api`.

## Tests añadidos/actualizados

Añadidos:

- `apps/web/src/features/match/match-page.test.tsx` (14 tests): redirección a `/login`
  sin sesión (sin pedir matches), petición con token, carga, score + nivel + barra
  accesible, skills coincidentes/faltantes, copy honesto sin skills comparables, vacío,
  error genérico sin filtrar el mensaje interno, "Ver oferta" → `/jobs/[id]`,
  guardar/quitar, 401 → limpia sesión y redirige, honestidad (no claims de IA), no
  expone el `accessToken` en el DOM.

Actualizados (Match pasa de "pendiente" a enlace real):

- `apps/web/src/components/layout/site-shell.test.tsx`.
- `apps/web/src/features/dashboard/dashboard-page.test.tsx`.
- `apps/web/src/app/profile/page.test.tsx`.

## Seguridad y privacidad

- Ruta privada: sin `accessToken` redirige a `/login`; `401` limpia sesión y redirige.
- El token viaja solo en `Authorization: Bearer` vía `apiRequest`; nunca se renderiza
  (test explícito de no exposición en el DOM).
- Errores internos no se filtran: ante fallo se muestra copy genérico
  ("No se han podido calcular tus matches"), no el mensaje del backend.
- El `job` embebido usa `JobPublicDto` (sin `externalId`/`ingestedAt`).
- Enlaces internos (`/jobs/[id]`) con `next/link`; no se añaden enlaces externos nuevos.

## Decisiones técnicas

- **Reutilización sobre duplicación**: se reaprovechan `jobs-format.ts`,
  `saved-jobs-api.ts`, `SiteShell` y los tipos ya existentes en `types/api.ts`
  (que ya eran espejo del backend: `ProfileJobMatchDto`, `MatchLevel`, etc.).
  No se añadieron tipos nuevos ni se inventaron campos.
- **Card propia** (`MatchCard`) en lugar de tocar `JobCard`: la card de match necesita
  score/nivel/skills; crear un componente separado evita cualquier riesgo sobre Jobs.
- **Sin scoring en cliente**: el nivel y la puntuación se muestran tal cual; `clampScore`
  es solo defensivo (0-100), no recalcula.
- **Honestidad de producto**: como el listado no devuelve `explanation`/`factors`, la
  cabecera explica que es una puntuación básica por reglas visibles y la card muestra
  copy honesto cuando no hay skills comparables. Sin claims de "recomendado por IA".
- **Spec**: `docs/specs/features/match-basic.md` ya cubre la feature y las pantallas
  previstas; no se creó spec nueva para no inflar documentación.

## Fuera de alcance

No se tocó: `apps/api/**` (funcional), `prisma/**`, `packages/**`, `package.json`,
`pnpm-lock.yaml`, `.env*`, `docker/**`, `docker-compose.yml`, `.github/**`, Portfolio/QR,
recruiter, monetización, APIs externas. No se implementó IA/ML, matching avanzado ni
scoring nuevo en frontend. No se añadió panel de `factors`/`explanation` por oferta.

## Verificaciones

Ejecutadas en el clon nativo de WSL (`/home/david/projects/JobIT-platform`), todas en verde:

- `pnpm --filter @jobit/web typecheck` → OK (`tsc --noEmit` sin errores).
- `pnpm --filter @jobit/web test` → **19 archivos, 232 tests OK** (incluye los 14 de `/match`).
- `pnpm --filter @jobit/web lint` → OK (eslint sin errores).
- `pnpm --filter @jobit/web build` → OK; `/match` aparece como ruta prerenderizada (○).
- `git diff --check` → sin problemas; `git status --short` → solo cambios de esta rama
  (5 modificados + 3 nuevos), sin tocar áreas prohibidas.

## Riesgos/deuda técnica

- El desglose por factores y la `explanation` del endpoint `GET /api/jobs/:id/match`
  no se muestran en ninguna vista. Mejora natural: panel de match en `/jobs/[id]`.
- La sesión vive en memoria (ADR-0006): al recargar `/match` se vuelve a `/login`.
- Smoke visual real en navegador contra backend con datos, pendiente (como en sprints previos).

## Recomendación para el chat director

- **Sprint 15C: COMPLETADO.** Match UI básica integrada y navegable desde el AppShell.
- Match queda como ruta real `/match`, privada, consumiendo el contrato existente
  `GET /api/profile/me/matches`. Sin cambios de backend, Prisma, deps ni `.env`.
- Checks locales ejecutados: typecheck, test (232), lint y build en verde.
- **Siguiente sprint recomendado**: Sprint 15D — panel de match explicable en el
  detalle de oferta (`/jobs/[id]`) consumiendo `GET /api/jobs/:id/match` para mostrar
  `factors` y `explanation`; alternativamente, smoke visual E2E del flujo de candidato.

## Prompt sugerido para continuar

> Sprint 15D — Match explicable en detalle de oferta.
> Objetivo: mostrar en `/jobs/[id]` el desglose del match (`GET /api/jobs/:id/match`):
> score, nivel, `factors` (coincide/no coincide/no aplica con `detail`) y `explanation`,
> más aviso de perfil incompleto. Reutilizar `match-api`, `match-format` y los estados
> de Jobs. No tocar backend. Tests de estados y de honestidad (sin IA). Actualizar
> README/informe. Rama `feat/sprint-15d-match-detail`. No commit/push/PR.
