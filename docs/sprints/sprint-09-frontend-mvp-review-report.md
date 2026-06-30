# Sprint 09 — Frontend MVP Review Report

> Documento de diagnóstico (solo lectura de código). Audita `apps/web` tras los
> Sprints 07–08 contra el MVP candidate-first, las specs y el backend real. No
> implementa correcciones. Rama: `feat/sprint-09-frontend-mvp-review`.

## Resumen ejecutivo

El frontend es un **slice vertical mínimo y técnicamente sólido**, pero **funcionalmente incompleto** frente al MVP candidate-first. Cubre `landing → login/registro → dashboard (solo lectura) → logout`, con un **cliente API robusto** y **DTOs espejo completos** (incluidos Jobs/Saved/Match, aún sin UI). El **gap principal** es la **ausencia total de UI** para módulos backend ya implementados: Perfil/CV, Skills, Jobs (listado/detalle), Saved Jobs y Match explicable. Como consecuencia, el dashboard se ve "vacío" (perfil 0%, sin skills/guardadas, matches 0/100) y **el usuario no tiene forma de rellenarlo desde la app**. Hay además deudas de **navegación no consciente de sesión** y **estados vacíos no accionables**. El proyecto **no está listo para deploy** hasta cerrar un corte mínimo de UI candidate-first.

## Contexto del sprint

Sprint 09 — Frontend MVP Review & Hardening Plan. Objetivo: auditar el frontend actual, compararlo contra el MVP y el backend real, detectar gaps y preparar un plan de hardening priorizado. El deploy queda pospuesto (frontend verde en checks automáticos pero incompleto en alcance funcional).

## Material revisado

- **Código frontend** (`apps/web/src/**`): rutas App Router, `site-shell`, `api-client`, `types/api`, features de auth y dashboard, tests.
- **Backend como contrato** (`apps/api/src/**`): auth, profile, jobs, saved-jobs, match, dashboard.
- **Specs/docs**: `00-mvp-scope.md`, `features/{auth, candidate-profile-cv, jobs, saved-jobs, match-basic, dashboard, external-jobs-jooble}.md`, reports Sprint 07/08, `docs/agents/skills/frontend-ui.md`.
- **Evidencia visual externa**: capturas aportadas por el usuario (login básico, dashboard oscuro con 0%/sin datos, nav `Inicio/Login/Registro/Dashboard`). **No están versionadas en el repo** (evidencia externa).
- **Mocks de diseño**: **NOT_AVAILABLE en repo** (no hay `docs/design/` ni wireframes versionados).

## Estado real del frontend

- **Stack:** Next.js 16.2.9, React 19.2.4, Tailwind v4, App Router, TypeScript, Vitest.
- **Rutas:** `/` (landing estática), `/login`, `/register`, `/dashboard` (privada con guard). **No existen** `/profile`, `/jobs`, `/jobs/[id]`, `/saved-jobs`, `/matches`, ni `not-found`/`error` personalizados.
- **Auth/session:** `accessToken`+`user` solo en memoria (ADR-0006); se pierde al recargar (no hay `/api/auth/refresh`).
- **Cliente API:** `lib/api-client.ts` robusto (`credentials:"include"`, Bearer opcional, 204, parseo bare/envuelto, `ApiClientError`, 401→sesión expirada, base URL por `NEXT_PUBLIC_API_BASE_URL`).
- **DTOs:** `types/api.ts` completos para Auth, Jobs, Saved, Match, Dashboard y envoltorios → listos para construir UI.
- **Dashboard:** carga `GET /api/dashboard/me`, con loading/error/empty; empties como **texto no accionable**.
- **Nav:** `SiteShell` con enlaces **estáticos** `Inicio/Login/Registro/Dashboard`, **no auth-aware**; landing usa layout propio (inconsistencia de shell).
- **Tests:** 35 (unit/integration con mocks); **sin E2E/visual**.

## Estado real del backend disponible

Todo el backend candidate-first (M01–M06) está implementado:
- **Auth:** `POST /api/auth/register|login|logout`, `GET /api/auth/me`.
- **Profile/CV:** `GET/PUT /api/profile/me` + subrecursos `skills`, `experience`, `education`, `projects`, `links`, `preferences`; `completionPercentage`.
- **Jobs:** `GET /api/jobs` (filtros+paginación), `GET /api/jobs/:id`.
- **Saved Jobs:** `GET /api/saved-jobs`, `POST/DELETE /api/saved-jobs/:jobId`.
- **Match:** `GET /api/jobs/:id/match` (con `factors`/`explanation`), `GET /api/profile/me/matches`.
- **Dashboard:** `GET /api/dashboard/me`.

## Comparación contra MVP candidate-first

El MVP requiere: landing, registro, login, logout, sesión privada estable, dashboard útil, perfil/CV editable, skills, ofertas, detalle, guardar/quitar, guardadas, match explicable, navegación coherente, estados loading/error/empty y responsive. **Implementado hoy:** landing, registro, login, logout y dashboard (lectura). **Ausente:** perfil/CV editable, skills, jobs list/detalle, guardar/quitar, guardadas (pantalla propia), match explicable, nav coherente auth-aware y estados accionables. El backend soporta todo lo ausente.

## Matriz MVP frontend vs backend

| Funcionalidad | Estado frontend | Evidencia | Backend disponible | Gap | Prioridad | Recomendación |
|---|---|---|---|---|---|---|
| Landing candidate-first | ✅ | `app/page.tsx` | n/a | usa layout propio (no SiteShell) | Baja | Unificar shell/nav |
| Registro | ✅ | `register-form.tsx` → `/api/auth/register` | Sí | — | — | Mantener |
| Login | ✅ | `login-form.tsx` → `/api/auth/login` | Sí | — | — | Mantener |
| Logout | ⚠️ solo en dashboard | `dashboard-page.tsx` | Sí | no en nav global | Media | Logout en nav auth-aware |
| Sesión privada estable | ⚠️ parcial | `auth-context.tsx` (memoria) | falta `/auth/refresh` | se pierde al recargar | Media/Alta | Documentar + valorar refresh |
| Dashboard útil | ⚠️ parcial | `dashboard-content.tsx` | Sí | datos vacíos sin edición | **Alta** | CTAs accionables |
| Ver perfil/CV | ❌ | sin ruta | `GET /profile/me` | total | **Alta** | Crear `/profile` |
| Editar perfil básico | ❌ | sin ruta | `PUT /profile/me` | total | **Alta** | Form básico |
| Añadir/ver skills | ❌ | sin ruta | `POST/DELETE /profile/me/skills` | total | **Alta** | UI skills |
| Ver ofertas | ❌ | sin ruta | `GET /api/jobs` | total | **Alta** | Crear `/jobs` |
| Ver detalle de oferta | ❌ | sin ruta | `GET /api/jobs/:id` | total | **Alta** | `/jobs/[id]` |
| Guardar/quitar oferta | ❌ | sin UI | `POST/DELETE /saved-jobs/:id` | total | Media/Alta | Botón guardar |
| Ver ofertas guardadas | ⚠️ resumen en dashboard | dashboard | `GET /saved-jobs` | sin pantalla propia | Media | `/saved-jobs` |
| Ver match/explicación | ⚠️ resumen | dashboard matches | `GET /jobs/:id/match` (`factors`/`explanation`) | sin detalle explicable | Media | Detalle de match |
| Navegación coherente | ❌ | `site-shell.tsx` | n/a | no auth-aware, sin enlaces a módulos | **Alta** | Nav condicional |
| Loading/error/empty states | ⚠️ | dashboard sí; auth parcial | n/a | empties no accionables | Media | CTAs en empties |
| Responsive básico | ⚠️ NOT_CHECKED a fondo | clases Tailwind responsive | n/a | sin verificación visual | Media | Revisar en navegador |

## Matriz de pantallas

| Pantalla | Existe | Estado | Problemas UX/UI | Prioridad | Acción recomendada |
|---|---|---|---|---|---|
| Landing | Sí | OK | layout propio (nav distinta a la app) | Baja | Unificar shell |
| Login | Sí | OK | estilo básico | Baja | Mantener / pulir |
| Register | Sí | OK | política de contraseña visible (bien) | — | Mantener |
| Dashboard | Sí | Funciona | empties sin CTA; depende de datos no editables en UI | **Alta** | CTAs/enlaces reales |
| Profile/CV | No | Ausente | sin forma de completar perfil → dashboard 0% | **Alta** | Crear pantalla |
| Jobs list | No | Ausente | módulo backend sin UI | **Alta** | Crear pantalla |
| Job detail | No | Ausente | sin detalle ni guardar/match | **Alta** | Crear pantalla |
| Saved jobs | No | Ausente | solo resumen en dashboard | Media | Crear pantalla |
| Match/profile matches | No | Ausente | explicabilidad (`factors`) no mostrada | Media | Crear pantalla/detalle |
| Not found/error states | No | Ausente | sin `not-found.tsx`/`error.tsx` | Media | Añadir |

## Bugs detectados

1. **Nav no auth-aware (ALTO):** `SiteShell` muestra siempre `Inicio/Login/Registro/Dashboard`; autenticado sigue ofreciendo Login/Registro y no ofrece Logout en la nav (solo dentro del dashboard).
2. **Nav sin accesos a módulos (ALTO):** no hay enlaces a Jobs/Saved/Perfil (rutas inexistentes).
3. **Empties no accionables (MEDIO):** "Completa tu perfil…", "Explora ofertas…" son texto sin enlace, y sus destinos no existen.
4. **Inconsistencia de shell (BAJO):** landing usa layout propio; el resto usa `SiteShell`.
5. **Typo "Inico": NOT_REPRODUCED.** El código fuente dice **"Inicio"** (`site-shell.tsx`). La captura del usuario probablemente proviene de un server dev en caché de una sesión previa; verificar con recarga/build limpio.
6. **Assets de plantilla sin uso (BAJO):** SVGs de Next en `public/`.

## Gaps funcionales

- Sin UI para: **completar/editar perfil**, **skills**, **listar ofertas**, **detalle de oferta**, **guardar/quitar**, **pantalla de guardadas**, **detalle de match explicable**.
- Dashboard depende de datos que el usuario **no puede generar** desde la app (círculo vicioso del 0%).

## Gaps UX/UI

- Navegación no consciente de sesión y sin accesos a las áreas del producto.
- Estados vacíos sin llamada a la acción.
- Inconsistencia visual entre landing y app (shell distinto).
- Responsive/usabilidad real **no verificada** (sin navegador/Playwright).

## Gaps técnicos

- Sesión solo en memoria; pérdida al recargar (sin `/api/auth/refresh`).
- Sin tests E2E/visuales (smoke visual pendiente, heredado Sprint 08).
- Cookie cross-site/HTTPS sin validar para staging (heredado Sprint 08).
- `prisma db seed` no cableado en `package.json` (afecta a poblar datos de dev; heredado Sprint 08).

## Riesgos

- **Percepción de producto incompleto** (dashboard "vacío" sin vía de relleno) → riesgo de UX alto.
- **Alcance amplio de hardening** (≈5 áreas de UI) → necesidad de priorización y corte mínimo.
- **Verificación visual pendiente** → posibles problemas de responsive/UX aún no detectados.
- **Deuda de sesión** puede confundir en pruebas (recarga = re-login).

## Must-have antes de deploy

1. Nav auth-aware (Login/Registro vs Dashboard/Logout) + accesos a módulos.
2. Perfil/CV básico editable + skills (para que el dashboard deje de estar a 0%).
3. Jobs list + detalle + guardar/quitar.
4. Saved jobs visible + match básico visible.
5. CTAs accionables y estados loading/error/empty razonables.
6. `not-found`/`error` y revisión responsive.
7. Smoke visual manual.

## Should-have antes de demo

- Detalle de match **explicable** (`factors`/`explanation`).
- Filtros/paginación en Jobs list.
- Pulido visual de login/landing y consistencia de shell.
- Mensajería de sesión expirada más clara.

## Could-have posterior

- `/api/auth/refresh` (persistencia de sesión) — requiere backend.
- Nav avanzada, breadcrumbs, theming.
- Tests E2E (Playwright) automatizados.
- Limpieza de assets de plantilla.

## Elementos no verificados

- **Responsive real** y comportamiento visual en navegador: NOT_CHECKED (sin navegador/Playwright en el agente).
- **Typo "Inico"** en runtime: NOT_REPRODUCED en código; pendiente de confirmar con recarga limpia.
- **Tests/build** no re-ejecutados en esta fase (fase documental); última evidencia: web 35/35, api 278/278 (Sprint 08).
- **Mocks de diseño:** NOT_AVAILABLE en repo.

## Conclusión

El backend candidate-first está completo; el frontend es un esqueleto sólido pero parcial. El trabajo de Sprint 09 debe ser **hardening de frontend**: añadir las pantallas/flows ausentes (perfil/skills/jobs/saved/match), hacer la navegación auth-aware y los estados accionables, y validar visualmente. Hasta cerrar ese corte mínimo, **no procede el deploy**.

## Recomendación para el orquestador

- Aprobar el **Hardening Plan** (`sprint-09-frontend-hardening-plan.md`) y ejecutar por fases priorizadas (corte mínimo para deploy definido en ese plan).
- Decidir si se aportan **mocks de diseño** (hoy ausentes) antes de la UI, o si se acepta un diseño funcional sobrio basado en el shell actual.
- Verificar el typo "Inico" con recarga limpia para descartar caché.
- Mantener el deploy pospuesto hasta completar el corte mínimo + smoke visual.
