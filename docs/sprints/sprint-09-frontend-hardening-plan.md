# Sprint 09 — Frontend Hardening Plan

> Plan documental por fases para llevar el frontend candidate-first de "esqueleto"
> a un MVP usable y listo para deploy dev/staging. No implementa código. Basado en
> [sprint-09-frontend-mvp-review-report.md](sprint-09-frontend-mvp-review-report.md).
> Rama: `feat/sprint-09-frontend-mvp-review` (la implementación podrá hacerse en
> esta rama o en ramas `feat/sprint-09-*` derivadas, según decida el orquestador).

## Objetivo

Cerrar los gaps de UI del frontend para que el candidato pueda, de extremo a
extremo: autenticarse, navegar con coherencia, completar su perfil y skills,
explorar y guardar ofertas, ver matches explicables y entender sus próximos
pasos — todo consumiendo el backend real ya disponible.

## Principios de hardening

- **Reutilizar lo existente:** `api-client`, `types/api` (DTOs ya completos), `SiteShell`, patrones de estados loading/error/empty del dashboard.
- **No tocar backend ni Prisma:** el contrato existe; solo se consume.
- **Cambios pequeños y verificables por fase**, con tests por fase (Vitest + Testing Library) y typecheck/lint/build en verde.
- **Accesibilidad básica** (labels, roles, foco) y **responsive** desde el inicio.
- **Sin secretos**; `NEXT_PUBLIC_API_BASE_URL` como única config pública.
- **Diseño funcional sobrio** coherente con el shell actual mientras no haya mocks (NOT_AVAILABLE en repo).

## Fuera de alcance

- Backend, Prisma, migraciones, `package.json`/lockfiles (salvo dependencia imprescindible y autorizada).
- `/api/auth/refresh` (deuda de backend; no se implementa aquí).
- Deploy real, CI/CD, Docker.
- Llamadas reales a Jooble.
- Rediseño visual completo / theming avanzado.
- E2E automatizado con Playwright (queda como could-have; el smoke visual de Fase K es manual).

## Orden recomendado de ejecución

A (auth usable) → B (nav auth-aware) → C (dashboard accionable) → D (perfil) → E (skills) → F (jobs list) → G (job detail + save/unsave) → H (saved jobs) → I (match explicable) → J (polish/responsive/errores) → K (smoke visual + pre-deploy).

> **Corte mínimo para deploy dev/staging:** Fases A–J (con I en versión básica) + K. Ver sección final.

---

## Fase A — Auth y sesión usable

- **Objetivo:** asegurar que login/registro/logout funcionan de forma fluida y que el estado de sesión expirada (recarga/401) se comunica con claridad y guía a re-login.
- **Archivos probables:** `features/auth/auth-context.tsx`, `auth-error.tsx`, `login-form.tsx`, `register-form.tsx`, `dashboard-page.tsx` (mensajería de expirada).
- **Fuera de alcance:** implementar refresh token; persistir sesión en storage (prohibido por ADR-0006).
- **Criterios de aceptación:** registro y login redirigen a `/dashboard`; logout limpia sesión y va a `/login`; 401/recarga muestran mensaje claro y enlace a login; errores genéricos sin filtrar detalles del backend.
- **Tests/verificaciones:** unit de formularios y context (ya existen, ampliar); typecheck/lint.
- **Riesgos:** confusión por pérdida de sesión al recargar (documentar el comportamiento conocido).

## Fase B — Navegación auth-aware y shell coherente

- **Objetivo:** `SiteShell` muestra enlaces según sesión: deslogueado → Inicio/Login/Registro; logueado → Dashboard/Perfil/Ofertas/Guardadas/Logout. Unificar shell entre landing y app.
- **Archivos probables:** `components/layout/site-shell.tsx`, `app/page.tsx` (adoptar shell o variante), posible `nav` que use `useAuth`.
- **Fuera de alcance:** menús avanzados, breadcrumbs.
- **Criterios de aceptación:** estando autenticado no se muestran Login/Registro y sí Logout; existen accesos a las áreas que se vayan creando; landing y app comparten cabecera coherente.
- **Tests/verificaciones:** unit de nav según estado de `useAuth` (mock); typecheck/lint.
- **Riesgos:** la nav depende de sesión en memoria → tras recarga aparece como deslogueado (coherente con A).

## Fase C — Dashboard útil y accionable

- **Objetivo:** convertir los estados vacíos en **CTAs accionables** (enlaces reales a `/profile`, `/jobs`, `/saved-jobs`) y `nextActions` en enlaces/botones.
- **Archivos probables:** `features/dashboard/dashboard-content.tsx`, `dashboard-empty-state.tsx`, `dashboard-section.tsx`.
- **Fuera de alcance:** cambiar el contrato del dashboard backend.
- **Criterios de aceptación:** cada bloque vacío ofrece una acción que navega a la pantalla correspondiente; `nextActions` (`complete_profile`, `explore_jobs`) enlazan a destino real.
- **Tests/verificaciones:** actualizar `dashboard-page.test`/content para CTAs; typecheck/lint.
- **Riesgos:** los destinos deben existir (coordinar con D–H).

## Fase D — Profile/CV básico editable

- **Objetivo:** pantalla `/profile` para ver y editar datos básicos del perfil (`firstName`, `lastName`, `headline`, `summary`, ubicación, disponibilidad) vía `GET/PUT /api/profile/me`.
- **Archivos probables:** `app/profile/page.tsx`, `features/profile/profile-api.ts`, `profile-form.tsx`, tipos en `types/api.ts` (ampliar con DTO de perfil completo si falta).
- **Fuera de alcance:** experiencia/educación/proyectos/links/preferencias (could-have posterior) salvo que se prioricen.
- **Criterios de aceptación:** se carga el perfil; se editan datos básicos y se guardan (PUT) con validación cliente y manejo de error; al volver al dashboard sube `completionPercentage`.
- **Tests/verificaciones:** unit de form + api (mock); typecheck/lint.
- **Riesgos:** validaciones deben alinear con las del backend (errores 400).

## Fase E — Skills UI

- **Objetivo:** añadir/ver/eliminar skills desde el perfil vía `POST/DELETE /api/profile/me/skills`.
- **Archivos probables:** `features/profile/skills-*.tsx`, `profile-api.ts` (extender), `app/profile/page.tsx`.
- **Fuera de alcance:** niveles/categorías avanzadas de skill (opcional).
- **Criterios de aceptación:** se listan skills; se añade una nueva (y aparece); se elimina; duplicados gestionados con mensaje; el dashboard refleja skills.
- **Tests/verificaciones:** unit de UI de skills (mock api); typecheck/lint.
- **Riesgos:** normalización (`normalizedName`) la hace el backend; el front muestra el nombre devuelto.

## Fase F — Jobs list

- **Objetivo:** pantalla `/jobs` con listado de ofertas (`GET /api/jobs`), filtros básicos y paginación.
- **Archivos probables:** `app/jobs/page.tsx`, `features/jobs/jobs-api.ts`, `job-card.tsx`, `jobs-filters.tsx`.
- **Fuera de alcance:** detalle (Fase G), guardar (Fase G).
- **Criterios de aceptación:** lista ofertas activas con título/empresa/ubicación/modalidad; filtros (`q`, `remote`, `seniority`, etc.) y paginación (`page`/`limit`) funcionan; estados loading/error/empty.
- **Tests/verificaciones:** unit de lista/filtros (mock api con `PaginatedJobsResponseDto`); typecheck/lint.
- **Riesgos:** volumen/paginación; respetar contrato público (sin `externalId`/`ingestedAt`).

## Fase G — Job detail + save/unsave

- **Objetivo:** pantalla `/jobs/[id]` (`GET /api/jobs/:id`) con detalle y acción **guardar/quitar** (`POST/DELETE /api/saved-jobs/:jobId`).
- **Archivos probables:** `app/jobs/[id]/page.tsx`, `features/jobs/job-detail.tsx`, `features/saved-jobs/saved-jobs-api.ts`, botón guardar reutilizable.
- **Fuera de alcance:** pantalla de guardadas (Fase H), match detail (Fase I).
- **Criterios de aceptación:** muestra detalle completo; guardar es idempotente (201/200), quitar (204); estado del botón refleja guardado/no; 404 oferta no disponible manejado.
- **Tests/verificaciones:** unit de detalle + acción guardar (mock); typecheck/lint.
- **Riesgos:** sincronizar estado "guardado" si se navega entre list/detalle.

## Fase H — Saved Jobs UI

- **Objetivo:** pantalla `/saved-jobs` (`GET /api/saved-jobs`) con las ofertas guardadas y opción de quitar.
- **Archivos probables:** `app/saved-jobs/page.tsx`, `features/saved-jobs/*`.
- **Fuera de alcance:** notas/etiquetas (fuera del MVP).
- **Criterios de aceptación:** lista guardadas ordenadas por `savedAt` desc; quitar actualiza la lista; estado vacío con CTA a `/jobs`; indicador de "no disponible" si la oferta está cerrada (`status`/`expiresAt`).
- **Tests/verificaciones:** unit (mock `SavedJobsListResponseDto`); typecheck/lint.
- **Riesgos:** consistencia con el botón guardar de Fase G.

## Fase I — Match visible y explicable

- **Objetivo:** mostrar match explicable: en detalle de oferta (`GET /api/jobs/:id/match` con `factors`/`explanation`) y/o pantalla `/matches` (`GET /api/profile/me/matches`).
- **Archivos probables:** `app/matches/page.tsx`, `features/match/match-api.ts`, `match-explanation.tsx`, integración en `job-detail.tsx`.
- **Fuera de alcance:** algoritmo (backend), ML.
- **Criterios de aceptación:** score/level visibles; desglose por factores (skills/remote/seniority/location) con estado coincide/no/na; `explanation` legible; matchedSkills/missingSkills.
- **Tests/verificaciones:** unit de presentación del match (mock); typecheck/lint.
- **Riesgos:** perfil incompleto → matches bajos; comunicar que completar perfil mejora el match.
- **Versión básica para corte mínimo:** mostrar score/level + matched/missing (la `explanation` por factores puede ser should-have si aprieta el tiempo).

## Fase J — UX polish + responsive + estados error/not-found

- **Objetivo:** pulir consistencia visual, responsive, accesibilidad y añadir `not-found.tsx`/`error.tsx`.
- **Archivos probables:** `app/not-found.tsx`, `app/error.tsx`, `globals.css`, componentes UI compartidos; limpieza de SVGs de plantilla en `public/`.
- **Fuera de alcance:** rediseño/theming avanzado.
- **Criterios de aceptación:** rutas inexistentes muestran 404 amable; errores no controlados muestran pantalla de error; layout usable en móvil/desktop; foco y labels correctos.
- **Tests/verificaciones:** unit de not-found/error; revisión responsive manual; lint a11y básico.
- **Riesgos:** alcance de "polish" puede crecer; mantener sobrio.

## Fase K — Smoke visual y verificación pre-deploy

- **Objetivo:** validar el flujo completo en **navegador real**: `register → completar perfil/skills → ver jobs → detalle → guardar → guardadas → match → logout`, más responsive y estados.
- **Archivos probables:** ninguno de producción (verificación); opcional doc de resultado `docs/sprints/sprint-09-frontend-smoke-result.md`.
- **Fuera de alcance:** E2E automatizado (could-have).
- **Criterios de aceptación:** flujo completo sin errores críticos; dashboard refleja datos reales tras completar perfil; evidencia capturada sin secretos.
- **Tests/verificaciones:** `pnpm --filter @jobit/web typecheck|test|lint|build` en verde; smoke manual en navegador (entorno con navegador, no el agente).
- **Riesgos:** **requiere navegador** (no disponible en el agente actual) → ejecutar en máquina con navegador; cookie cross-site/HTTPS solo aplica en staging.

## Dependencias entre fases

- B depende de A (estado de sesión).
- C depende de que existan destinos (D/F/H) para CTAs útiles (puede iterarse: CTAs apuntan a rutas a medida que se crean).
- G depende de F (detalle desde el listado) y comparte estado "guardado" con H.
- H depende de G (acción guardar) para consistencia.
- I se integra mejor tras F/G (detalle) y D/E (perfil con skills mejora matches).
- J y K dependen de tener el grueso de A–I.

## Riesgos

- **Alcance amplio:** son muchas pantallas; priorizar el corte mínimo y entregar por fases.
- **Sin mocks de diseño** (NOT_AVAILABLE): decidir diseño funcional sobrio o aportar mocks.
- **Smoke visual** requiere navegador (no en el agente).
- **Sesión en memoria** puede confundir en pruebas (recarga = re-login).
- **Cookie cross-site/HTTPS** y `prisma seed` no cableado: deudas heredadas del Sprint 08 (afectan a staging/datos, no al desarrollo local).

## Recomendación de corte mínimo para deploy dev/staging

Entregar antes del deploy (corte mínimo):
- **Auth usable** (Fase A).
- **Nav auth-aware** (Fase B).
- **Dashboard con CTAs reales** (Fase C).
- **Profile/CV básico editable** (Fase D).
- **Skills básicas** (Fase E).
- **Jobs list** (Fase F).
- **Job detail** (Fase G).
- **Save/unsave** (Fase G).
- **Saved jobs visible** (Fase H).
- **Match básico visible** (Fase I, versión básica score/level + matched/missing).
- **Estados loading/error/empty razonables + not-found/error** (Fases C/J).
- **Smoke visual manual** (Fase K).

Con ese corte, el MVP candidate-first es coherente de extremo a extremo y el deploy dev/staging puede plantearse (con la autorización y el target definidos, y resolviendo la cookie cross-site/HTTPS en esa fase).
