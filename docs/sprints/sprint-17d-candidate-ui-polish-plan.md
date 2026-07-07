# Sprint 17D — Candidate UI polish

## Objetivo

Pulir la experiencia visual y de uso del flujo candidato autenticado —
**Dashboard → JobIT CV → Portfolio → Jobs → Guardadas → Match** — sobre lo ya existente:
consistencia de color mediante tokens, estados de carga/error/vacío dignos (con reintento y
feedback accesible), y limpieza de CTAs/copys duplicados o engañosos. **Sin ampliar backend ni
contrato API** y sin rediseño de marca.

## Contexto de partida

- Sprint 17C mergeado en `dev` (PR #72, merge `ede2f38`): el Dashboard consume datos reales
  (summary, avatar, cvSections, portfolio, nextActions), Portfolio está en la navegación y el
  avatar admite 5 MB. Suites en verde (API 399/399, Web 265/265).
- Auditoría visual del Plan Mode 17D (inventario por grep + lectura de componentes):
  - **190 colores hex hardcodeados** en ~20 archivos (top: dashboard-content 46, site-shell 15).
  - **18 archivos** con error "Inténtalo de nuevo" **sin botón de reintento**.
  - **0 usos de `aria-live`** en la app: los toggles de guardar/quitar y la subida de avatar
    fallan o confirman sin anuncio accesible (toggles con `catch` vacío → fallo silencioso).
  - 12+ estados de carga como texto plano, sin skeleton (saltos visuales bruscos).
  - Empty de `/jobs` con filtros activos sin CTA "limpiar filtros".
  - Métricas del hub no clicables; CTA "Preparar JobIT CV" repetido ×3 en la misma pantalla.
  - "Ajustes (futuro)" y "Ayuda (futuro)" como ruido no accionable en el sidebar.
  - Match ya está notablemente pulido (badges/barras por nivel, factores, ARIA): polish mínimo.

## Alcance aprobado

Solo frontend/UX (`apps/web`), incremental y revisable:

1. **Tokens de color** `@theme` en `globals.css` (Tailwind v4, sin dependencias), **conservando
   los valores actuales de la marca** (#006591, #004c6e, #006c49, #eff4ff, #dce9ff, #c8e6ff,
   #f8f9ff…), y migración progresiva de las clases arbitrarias `[#hex]` a los tokens.
2. **Componentes pequeños de feedback** reutilizables (`components/ui/feedback.tsx`):
   `LoadingState` (con skeleton simple), `ErrorState` (mensaje + botón **Reintentar**),
   `EmptyState` (copy + CTA), con tests RTL.
3. **Retry** en todos los estados de error de carga del flujo candidato.
4. **Feedback accesible** (`aria-live`/`role="status"`) en guardar/quitar oferta y subida de
   avatar; los fallos dejan de ser silenciosos.
5. **Dashboard**: métricas clicables hacia su módulo; deduplicación del CTA "Preparar JobIT CV"
   (cambios ligeros de copy en "Tu próximo paso"); skeleton de carga.
6. **Jobs**: CTA "Limpiar filtros" en el empty con filtros activos.
7. **Sidebar**: retirar "Ajustes (futuro)" y "Ayuda (futuro)".
8. **Copy UX** menor donde la auditoría detectó textos confusos, sin cambios de comportamiento.
9. Tests RTL de cada comportamiento nuevo + informe final.

## Fuera de alcance

- Backend (`apps/api/**`), Prisma, migraciones, contrato API (`types/api.ts` sin cambios).
- Dependencias nuevas (**Playwright fuera** — requeriría dependencia), `package.json`,
  `pnpm-lock.yaml`.
- **Header real con nombre/avatar** (decisión del operador: fuera de 17D).
- **Iconos compartidos/consolidación** (decisión del operador: diferido, no tocar en 17D).
- Rediseño de marca, cambio masivo de arquitectura CSS, nuevas features de producto,
  auth/session, fuentes externas, IA, recruiter, monetización, deploy, app móvil, landing.

## Decisiones del operador

1. Tokens `@theme` en `globals.css`: **aprobados**, conservando valores actuales (sin cambiar
   la marca).
2. Componentes UI pequeños de feedback: **aprobados**.
3. Métricas del Dashboard clicables: **aprobadas**.
4. Retirar "Ajustes (futuro)" y "Ayuda (futuro)" del sidebar: **aprobado**.
5. Header real con nombre/avatar: **fuera de 17D**.
6. Iconos compartidos: **diferido, no tocar en 17D**.
7. Deduplicar CTA "Preparar JobIT CV" en Dashboard: **aprobado con cambios ligeros**.
8. Una sola rama/PR para todo 17D: **aprobado** (`feat/sprint-17d-candidate-ui-polish`).

Además, heredadas del marco del sprint: Playwright fuera; backend fuera; contrato API fuera.

## Fases previstas

| Fase | Contenido | Verificación |
|---|---|---|
| **17D.0** | Startup + este plan documental | git limpio, doc creado |
| **17D.1** | Foundations: tokens `@theme` en `globals.css` + `components/ui/feedback.tsx` (LoadingState/ErrorState/EmptyState + skeleton) + tests RTL del ErrorState/EmptyState + migración de tokens en `site-shell` (incluye retirar "(futuro)") | typecheck/test/lint web |
| **17D.2** | Dashboard polish: skeleton de carga, ErrorState con retry, métricas clicables, dedupe CTA (copy "Tu próximo paso"), migrar los 46 hex a tokens | tests dashboard actualizados |
| **17D.3** | Jobs + Guardadas: retry, "Limpiar filtros", feedback accesible en toggles (aria-live + aviso de fallo), tokens | tests jobs/saved |
| **17D.4** | CV + Portfolio: retry en cargas, `aria-live` en guardado/subida, coherencia de badges, tokens | tests profile |
| **17D.5** | Match + remates de layout: retry, tokens restantes | tests match/site-shell |
| **17D.6** | Verificación final (typecheck/test/lint/build web con protocolo dev-server) + informe final + cierre Git con autorización | suites completas |

Cada fase termina con suites verdes de los archivos tocados; los cambios de copy actualizan sus
tests en la misma fase.

## Archivos probablemente afectados

- `apps/web/src/app/globals.css` (tokens `@theme`).
- **Nuevos**: `apps/web/src/components/ui/feedback.tsx` (+ `feedback.test.tsx`).
- `apps/web/src/components/layout/site-shell.tsx` (+ test) — tokens, retirar "(futuro)".
- `apps/web/src/features/dashboard/dashboard-content.tsx`, `dashboard-page.tsx` (+ test).
- `apps/web/src/features/jobs/jobs-page.tsx`, `job-detail-page.tsx`, `job-card.tsx` (+ tests).
- `apps/web/src/features/saved-jobs/saved-jobs-page.tsx` (+ test).
- `apps/web/src/features/match/match-page.tsx`, `match-card.tsx`, `job-match-panel.tsx` (+ test).
- `apps/web/src/features/profile/**` (page/content/secciones/portfolio: tokens, retry,
  aria-live) (+ tests).
- `docs/sprints/sprint-17d-candidate-ui-polish-plan.md` (este doc) y el informe final.
- **Prohibidos**: `apps/api/**`, `apps/web/src/types/api.ts`, Prisma, package/lockfile, `.env*`,
  docker, `.github`.

## Riesgos y mitigaciones

- **Deriva hacia rediseño** → tokens con los mismos valores (cambio visualmente neutro);
  migración por fases; nada de nuevos layouts.
- **Tests acoplados a copy** → cada cambio de copy actualiza su test en la misma fase.
- **`@theme` de Tailwind v4** → verificar con build en 17D.1; si una clase token no compila,
  fallback documentado a CSS vars + clases arbitrarias `var(...)` sin tocar valores.
- **Diff grande acumulado** → fases pequeñas con verificación por fase; una sola PR final
  revisable por commits/fases.
- **Dev server local del operador** → protocolo conocido: parar `next dev` antes de cualquier
  build y relanzarlo después.

## Criterios de aceptación

- [ ] Cero clases de color arbitrarias `[#hex]` en los archivos migrados (tokens en su lugar),
      **sin cambio visual perceptible** (mismos valores).
- [ ] Todos los estados de error de carga del flujo candidato ofrecen **Reintentar** funcional.
- [ ] Guardar/quitar oferta y subir avatar anuncian resultado con `aria-live` y **ningún fallo
      es silencioso**.
- [ ] `/jobs` con filtros y 0 resultados ofrece "Limpiar filtros".
- [ ] Métricas del hub navegan a su módulo; el CTA "Preparar JobIT CV" no se repite tres veces.
- [ ] "Ajustes (futuro)" y "Ayuda (futuro)" retirados del sidebar.
- [ ] Sin cambios en backend, contrato API, dependencias ni Prisma.
- [ ] Suites web completas + lint + build en verde al cierre.

## Tests/verificaciones previstas

- RTL nuevos: ErrorState (render + `onRetry` re-dispara fetch), EmptyState/CTA, "Limpiar
  filtros", aviso accesible del toggle (role="status"), métricas con `href`, skeleton
  (`aria-busy`), sidebar sin "(futuro)".
- Actualización de tests existentes afectados por copy/estructura (dashboard, site-shell,
  jobs, saved, profile).
- Por fase: typecheck + tests de archivos tocados + lint. Final (17D.6): suites completas web +
  build (API no se toca; su suite solo como regresión final opcional).

## Kill-switch

Detener y marcar BLOCKED si: se necesita tocar `apps/api/**`, Prisma o `types/api.ts`; se
requiere una dependencia nueva; un cambio exige rediseño estructural (nuevo layout global);
working tree con cambios ajenos al sprint; repos anidados; secretos en juego; o cualquier
instrucción fuera de `/home/david/projects/JobIT-platform`. Las decisiones 5 y 6 del operador
(header real, iconos compartidos) actúan como límites duros: si un cambio las necesita, se
aparca y se reporta.
