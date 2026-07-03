# Informe final — Sprint 15D Match explicable en detalle de oferta

## Objetivo inicial

Añadir un panel de match explicable en la página privada `/jobs/[id]`, consumiendo el
endpoint backend existente `GET /api/jobs/:id/match`, para que el candidato entienda
por qué una oferta encaja con su perfil: score, nivel, explicación, factores
positivos/negativos, skills coincidentes/faltantes y aviso honesto si el perfil está
incompleto. Sin IA, sin matching avanzado, sin scoring nuevo en frontend y sin tocar
backend.

## Alcance entregado

- Panel de match explicable integrado en el detalle de oferta, **autocontenido**: carga
  su propio match y su fallo **no rompe** el detalle de la oferta.
- Estados del panel: carga (`aria-busy`), fallo suave y datos.
- Contenido: título "Match con tu perfil", copy honesto (sin IA), score + nivel (badge
  y barra accesible `role="progressbar"`), `explanation`, desglose de `factors` con
  estado legible (coincide / no coincide / sin datos) y `detail`, skills coincidentes y
  faltantes, y CTA a `/profile` cuando no hay skills comparables.
- Fallbacks honestos: si no hay `factors`, copy "El backend devuelve una puntuación
  básica para esta oferta"; ante cualquier error del match, aviso suave sin filtrar
  detalles internos.
- Guardar/quitar y enlace externo del detalle intactos (no se duplican CTAs).

## Contratos backend usados

Sin cambios en backend. Se consumió el contrato existente (Sprint 05):

- **`GET /api/jobs/:id/match`** (privado, `requireAuth`). Respuesta "bare" `JobMatchDto`:
  `{ jobId, score (0-100), level, matchedSkills[], missingSkills[], factors[], explanation }`.
  `factors[]` = `{ name: "skills"|"remote"|"seniority"|"location", match: boolean|null, detail }`.
  Errores: `400` (id sin forma UUID), `404` (oferta no disponible), `401` (sin sesión).

Niveles (definidos por backend, solo se humanizan en cliente): `VERY_LOW` 0-25,
`LOW` 26-50, `GOOD` 51-75, `VERY_GOOD` 76-100.

## Rutas frontend afectadas

- `/jobs/[id]` — el detalle privado ahora incluye el panel de match debajo de la card
  de la oferta.

## Componentes creados/modificados

Creado:

- `apps/web/src/features/match/job-match-panel.tsx` — `JobMatchPanel`; autocontenido,
  carga `getJobMatch` y presenta el match. Reutiliza los helpers de Match.

Modificados:

- `apps/web/src/features/match/match-api.ts` — nuevo `getJobMatch(token, jobId)` sobre
  `apiRequest`; propaga `ApiClientError` (401/400/404/500) para que la UI decida.
- `apps/web/src/features/match/match-format.ts` — nuevos `MATCH_FACTOR_LABELS` y
  `matchFactorState(match)` (etiqueta/color por estado del factor). No recalcula score.
- `apps/web/src/features/jobs/job-detail-page.tsx` — integra `<JobMatchPanel>` en el
  detalle (guardado tras la card de la oferta), sin tocar la carga de oferta ni el
  guardar/quitar existentes.

Tipos: `JobMatchDto`/`MatchFactorDto`/`MatchFactorName`/`MatchLevel` ya existían en
`types/api.ts` (espejo del backend). **No se añadieron tipos nuevos ni campos inventados.**

## Tests añadidos/actualizados

`apps/web/src/features/jobs/job-detail-page.test.tsx` (de 8 a **13 tests**): mock de
`getJobMatch`, fixture `JobMatchDto`, y nuevos casos:

- pide `GET /api/jobs/:id/match` con el token y muestra score + nivel + barra accesible;
- muestra `explanation` y el desglose de `factors` con estado (coincide/no coincide/sin datos);
- muestra skills coincidentes y faltantes;
- si el match falla, el detalle de la oferta **sigue renderizando** con aviso suave y
  **sin filtrar** el mensaje interno;
- panel honesto (sin claims de IA) y **no expone el token** en el DOM.

Resto de la suite intacta (Jobs, Saved Jobs, Match, AppShell, Dashboard, Profile,
Portfolio) en verde.

## Seguridad y privacidad

- `/jobs/[id]` sigue siendo privado (sin `accessToken` redirige a `/login`).
- El panel usa API autenticada (`Bearer` vía `apiRequest`); el token nunca se renderiza
  (test de no exposición).
- Errores del match no se filtran: cualquier fallo (401/400/404/500) degrada a un aviso
  suave genérico; no se muestran mensajes internos.
- El fallo del panel **no rompe** el detalle de la oferta (componente aislado).
- El `job` embebido en Jobs sigue usando `JobPublicDto` (sin `externalId`/`ingestedAt`).
- Enlace externo de la oferta intacto: `target="_blank"` + `rel="noopener noreferrer"`.

## Decisiones técnicas

- **Panel autocontenido** (fetch propio) en lugar de subir la carga a la página: aísla
  el fallo del match del detalle y simplifica la página.
- **Reutilización total** de los helpers de Match del Sprint 15C (`match-format`,
  `match-api`) y de los tipos ya existentes; se añaden solo `getJobMatch`,
  `MATCH_FACTOR_LABELS` y `matchFactorState`.
- **Sin scoring en cliente**: `clampScore` es defensivo; score/level/factores/explicación
  se muestran tal cual los devuelve el backend.
- **Ubicación del panel**: card hermana bajo la oferta (identidad de la oferta primero,
  luego el match). Cumple "no bloquear el detalle".
- **Copy honesto**: "Match básico y explicable basado en tu perfil JobIT CV. No usa IA
  avanzada ni decide por ti; solo compara datos de tu perfil con la oferta."
- **Spec**: `docs/specs/features/match-basic.md` ya contempla el indicador en el detalle
  y el desglose por factores; no se creó spec nueva.

## Fuera de alcance

No se tocó: `apps/api/**` (funcional), `prisma/**`, `packages/**`, `package.json`,
`pnpm-lock.yaml`, `.env*`, `docker/**`, `docker-compose.yml`, `.github/**`, Portfolio/QR,
recruiter, monetización, APIs externas. No se implementó IA/ML, matching avanzado ni
scoring nuevo en frontend.

## Verificaciones

Ejecutadas en el clon nativo de WSL (`/home/david/projects/JobIT-platform`), en verde:

- `pnpm --filter @jobit/web typecheck` → OK.
- `pnpm --filter @jobit/web test` → 19 archivos, **237 tests OK** (job-detail: 13).
- `pnpm --filter @jobit/web lint` → OK.
- `pnpm --filter @jobit/web build` → OK.
- `git diff --check` limpio; `git status --short` solo cambios de esta rama.

## Riesgos/deuda técnica

- El panel hace una petición extra por detalle de oferta (aceptable; sin caché en MVP).
- Sesión en memoria (ADR-0006): al recargar `/jobs/[id]` se re-autentica.
- Smoke visual real en navegador pendiente (como en sprints previos).

## Recomendación para el chat director

- **Sprint 15D: COMPLETADO.** El detalle de oferta muestra el match explicable
  (score/nivel/explicación/factores/skills), reutilizando el contrato existente.
- Con `/match` (15C) + panel en `/jobs/[id]` (15D), **el flujo candidato de Jobs + Match
  queda completo** en la UI: explorar → guardar → ver detalle → entender el match.
- Checks locales: typecheck, test (237), lint y build en verde. Sin cambios de backend,
  Prisma, deps ni `.env`.
- **Siguiente sprint recomendado**: smoke visual E2E del flujo candidato (Jobs + Match)
  contra backend con datos sembrados; o consolidación/pulido de estados vacíos y
  accesibilidad. Alternativa de producto: aviso de perfil incompleto más guiado
  (checklist de skills/preferencias) enlazado desde el panel.

## Prompt sugerido para continuar

> Sprint 15E — Smoke visual E2E del flujo candidato (Jobs + Match).
> Objetivo: validar en navegador el flujo `/jobs` → `/jobs/[id]` (con panel de match) →
> `/match`, contra backend dev con datos sembrados. Documentar PASS/FAIL con evidencias,
> sin tocar backend ni añadir dependencias pesadas si el entorno no lo permite. Registrar
> hallazgos y crear informe. Rama `chore/sprint-15e-candidate-smoke`. No commit/push/PR.
