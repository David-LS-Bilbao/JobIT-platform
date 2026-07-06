# Informe final operador — Sprint 17B Dashboard activation

## Sprint o tarea

Sprint 17B — Dashboard activation (frontend-only). Ejecuta el plan de activación definido en la
auditoría de Sprint 17A (`docs/sprints/sprint-17a-dashboard-flow-audit-report.md`, §14 y §20).

## Objetivo inicial

Activar el Dashboard como centro funcional del MVP candidato conectándolo con las pantallas
candidate-first ya operativas, **solo frontend**: enlaces P0 a los módulos reales, renderizado de
los datos que `GET /api/dashboard/me` ya entrega y la UI ignoraba (`savedJobs.recent`, `matches`,
`nextActions`), CTA estático a Portfolio y corrección del bug visible de `GREENHOUSE`
("Fuente: undefined"). Sin backend, sin Prisma, sin nuevas dependencias y sin rediseño visual.

**Estado final recomendado: PASS.**

## Trabajo realizado

Resumen:

- Activación de enlaces P0 del Dashboard (QuickActions + ModuleCards).
- Renderizado de guardadas recientes (`savedJobs.recent`).
- Renderizado de top matches (score/nivel y skills).
- Renderizado de `nextActions` (mapeadas a rutas reales).
- CTA estático a Portfolio (`/profile/portfolio`).
- Fix frontend de `GREENHOUSE` (tipo + labels + CTA).

Por fases, todas PASS:

1. **Fase 1 — Startup + branch**: `dev` sincronizado (`--ff-only`, entró el merge de PR #70 con el
   informe 17A), working tree limpio, rama `feat/sprint-17b-dashboard-activation` creada.
2. **Fase 2 — P0 links**: QuickActions "Explorar ofertas" → `/jobs` y "Revisar matches" → `/match`
   (antes botones `disabled` con badge "Pendiente"); ModuleCards "JobIT Jobs" → `/jobs`,
   "Guardadas" → `/saved-jobs`, "JobIT Match" → `/match` (antes sin `href`). Tests obsoletos
   (`toBeDisabled`) sustituidos por aserciones de `href`.
3. **Fase 3 — Data rendering**: nuevas secciones "Guardadas recientes" (≤3, título → `/jobs/[id]`,
   empresa, ubicación·modalidad, CTA → `/saved-jobs`, empty state → `/jobs`), "Tus mejores matches"
   (≤3, título → `/jobs/[id]`, empresa, badge de score %, skills coincidentes, CTA → `/match`,
   empty state → `/profile`) y "Sugerencias" (`nextActions` con mapa `complete_profile→/profile`,
   `explore_jobs→/jobs`; acción desconocida visible sin enlace, sin riesgo runtime). Nueva
   ModuleCard "Portfolio público" → `/profile/portfolio` (CTA estático, sin estado publicado).
4. **Fase 4 — Fix GREENHOUSE**: `GREENHOUSE` añadido al tipo `JobSource` del front, a
   `JOB_SOURCE_LABELS` ("Greenhouse") y a `externalSourceCtaLabel` ("Abrir en Greenhouse"), con
   tests. Elimina el "Fuente: undefined" que ya se veía en dev con las 3 ofertas reales del smoke
   16F.2.
5. **Fase 5 — Verificaciones finales**: typecheck, suite completa, lint y build web en verde;
   alcance verificado sin archivos fuera de los permitidos.

## Archivos modificados

**Código/tests modificados** — solo frontend, 5 archivos (+295/−13):

- `apps/web/src/features/dashboard/dashboard-content.tsx` (+186) — links P0, secciones nuevas,
  `NEXT_ACTION_ROUTES`, `IconGlobe`, ModuleCard Portfolio.
- `apps/web/src/features/dashboard/dashboard-page.test.tsx` (+95) — 2 aserciones actualizadas +
  4 tests nuevos + empty states; 12 casos en total.
- `apps/web/src/features/jobs/jobs-format.ts` (+9) — label y CTA de GREENHOUSE.
- `apps/web/src/features/jobs/jobs-format.test.ts` (+16) — CTA Greenhouse + bloque
  `JOB_SOURCE_LABELS` exhaustivo.
- `apps/web/src/types/api.ts` (+2) — `JobSource = "INTERNAL" | "JOOBLE" | "GREENHOUSE"`.

**Informe final añadido** (Fase 6, sin código):

- `docs/sprints/sprint-17b-dashboard-activation-final-report.md` (este documento).

## Cambios funcionales

Para el candidato, desde `/dashboard` ahora:

- `/dashboard` enlaza desde su **contenido** (no solo la sidebar) a `/profile`, `/jobs`,
  `/saved-jobs`, `/match` y `/profile/portfolio`.
- Ya no queda copy falso de "Pendiente" para módulos operativos (contradicción sidebar↔hub
  resuelta).
- `savedJobs.recent` se muestra con enlaces a `/jobs/[id]` (y CTA general a `/saved-jobs`).
- Los matches se muestran con **score** y skills coincidentes, con enlaces a `/jobs/[id]` (y CTA
  general a `/match`).
- Las **sugerencias** (`nextActions`) del backend se muestran como enlaces accionables.
- **Empty states accionables**: sin guardadas → "Buscar ofertas" (`/jobs`); sin matches →
  "Completar perfil" (`/profile`).
- `GREENHOUSE` muestra label y CTA correctos en `/jobs` y `/jobs/[id]`, evitando
  "Fuente: undefined".

## Tests y verificaciones

Ejecutadas en el clon WSL, todas en verde (Fase 5):

- `pnpm --filter @jobit/web typecheck` → **OK**.
- `pnpm --filter @jobit/web test` → **OK — 20 archivos, 254/254 tests** (12 de Dashboard, incl.
  4 nuevos; 6 de jobs-format, incl. 2 nuevos).
- `pnpm --filter @jobit/web lint` → **OK**.
- `pnpm --filter @jobit/web build` → **OK** (Next build completo, 13 rutas).
- `git diff --check` → **OK**.
- `git status --short` → **cambios esperados** (exactamente los 5 archivos permitidos + este
  informe).
- Backend **sin cambios** → suites API no afectadas (referencia: 385 tests en verde al cierre de
  16F.2).

## Decisiones técnicas

- **Mantener el sprint frontend-only**: cero cambios de backend/contrato; todo lo renderizado sale
  del **DTO existente** de `GET /api/dashboard/me` (no se amplió el contrato).
- **Reutilizar los primitivos existentes** (`QuickAction`/`ModuleCard` ya soportaban `href`):
  la activación P0 es solo datos, sin tocar el diseño.
- **`NEXT_ACTION_ROUTES` como mapa cerrado en la UI**: acción desconocida → se muestra el label
  sin enlace (tolerante a ampliaciones futuras del backend en 17C, sin navegación peligrosa).
- **Reutilizar `locationLabel` de `jobs-format`** en las guardadas recientes (import puro; el
  archivo no se modificó en Fase 3).
- **Exhaustividad por tipos**: `JOB_SOURCE_LABELS: Record<JobSource, string>` obliga en compilación
  a etiquetar cualquier fuente futura que entre al tipo (guardarraíl anti-drift: ADZUNA no podrá
  entrar sin etiqueta).
- **CTA Portfolio estático**: sin estado publicado/slug (el DTO no lo trae); el estado real es
  contrato de 17C vía `portfolioSettings.findUnique`.
- **`within(section)` en tests** para acotar aserciones ambiguas ("80%", "React" existen en varias
  secciones del hub).

## Problemas encontrados

- **Sin bloqueos.** Todas las fases y verificaciones pasaron a la primera; no hubo correcciones en
  Fase 5.
- **Nota operativa**: para ejecutar `build` se detuvo temporalmente el `next dev` local y se
  relanzó después (verificado `200` en `localhost:3000`); la API no se tocó.
- **Pruebas visuales del operador** detectaron que la "Vista previa de JobIT CV" del hub no refleja
  los datos guardados (resumen/proyectos/enlaces placeholder, iniciales en vez de la foto subida).
  Diagnóstico confirmado: el DTO del dashboard no trae `summary`/secciones/`avatarUrl` — es el gap
  **P1 → 17C** ya documentado en 17A; el hallazgo añade `avatarUrl` a la lista del contrato 17C.
  La subida de avatar en `/profile` funciona (archivo único por subida + refresh; verificado un PNG
  de 542 KB en `uploads/avatars/`); el límite actual es **2 MB** (multer 413 + pre-check front), lo
  que explica rechazos con fotos de móvil grandes.

## Riesgos restantes

- **17C debe abordar spec + contrato ampliado** para tener portfolio status real, `summary`,
  `cvSections`, `avatarUrl` y `nextActions` enriquecidas (actualizar
  `docs/specs/features/dashboard.md` antes del código). Hasta entonces, la preview del CV y el
  checklist del hub siguen parcialmente hardcodeados y el CTA de Portfolio es estático.
- Límite de avatar 2 MB sin feedback prominente → ítem de hardening 17C (subir a ~5 MB con test del
  413, o compresión client-side sin dependencias).
- `nextActions` del backend siguen limitadas a 2 acciones (ampliación = 17C, con catálogo en spec).
- **17D queda para polish visual** (tokens, iconos, skeletons, limpieza) — no antes.
- **Fuentes futuras** (p. ej. ADZUNA si sale del HOLD) deberán añadirse al tipo `JobSource` y a los
  labels del frontend; el `Record<JobSource, string>` lo forzará en compilación.

## Fuera de alcance respetado

- Sin backend (`apps/api/**` intacto). Sin Prisma. Sin migraciones.
- Sin `package.json` ni `pnpm-lock.yaml`. Sin dependencias nuevas.
- Sin specs (`docs/specs/**` intacto). Sin deploy. Sin cambios de auth/session.
- Sin `.env*`, `docker/**` ni `.github/**`.
- Sin rediseño visual (tokens/iconos/skeletons → 17D).
- Sin portfolio status real, sin `cvSections`, sin `summary`, sin nextActions ampliadas (→ 17C).
- Sin commit, push ni PR durante las fases 1-6. Sin Co-Authored-By.

## Estado final Git

- Rama: `feat/sprint-17b-dashboard-activation` (local, sin publicar).
- Working tree: 5 archivos modificados (los del alcance) + este informe.
- Base: `dev` en `a56f724` (merge PR #70).
- Pendiente de autorización: commit + push + PR a `dev`.

## Recomendación para el orquestador

- **Sprint 17B: PASS.** Los 6 criterios de aceptación del informe 17A (§15) se cumplen: navegación
  completa desde el contenido del hub, guardadas recientes y matches visibles con datos reales,
  sugerencias enlazadas, CTA Portfolio, cero "Pendiente" falso, cero "Fuente: undefined", suite web
  254/254 y build en verde, sin tocar backend.
- **Revisar este informe** y, si procede, autorizar el **cierre Git** (commit único + push + PR a
  `dev`; sin merge por CLI, la revisión humana decide el merge en GitHub).
- **Siguiente sprint recomendado: 17C — Candidate flow hardening**, empezando por la actualización
  de `docs/specs/features/dashboard.md` (gate SDD) y el contrato ampliado del DTO
  (`portfolio` vía `findUnique`, `cvSections`, `summary`, **`avatarUrl`**, `nextActions`
  ampliadas), seguido de checklist/preview reales, Portfolio en sidebar, header real y el
  hardening de avatar (límite/compresión + feedback).

## Prompt sugerido para continuar

```
PROMPT PARA CLAUDE — Cierre Git Sprint 17B (Dashboard activation)

Objetivo:
Cerrar en Git el Sprint 17B ya implementado y verificado en la rama
feat/sprint-17b-dashboard-activation (sin re-implementar nada).

Precondiciones:
- Ruta WSL /home/david/projects/JobIT-platform.
- Rama feat/sprint-17b-dashboard-activation con los 5 archivos frontend + el informe final.
- No anadir Co-Authored-By. No tocar codigo.

Tareas:
1. git status/diff para confirmar el alcance (5 archivos frontend + informe).
2. Commit unico: feat(web): activate dashboard hub with real data and links
3. push de la rama.
4. Abrir PR a dev con resumen, alcance y "Not included" (sin merge por CLI).
5. Reportar numero de PR.

Restricciones:
No merge por CLI: la PR queda abierta hasta revision humana en GitHub.
No backend. No Prisma. No dependencias. No secretos. No Co-Authored-By.
```
