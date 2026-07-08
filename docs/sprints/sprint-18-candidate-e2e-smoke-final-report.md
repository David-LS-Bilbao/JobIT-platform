# Informe final — Sprint 18

## Sprint o tarea

Sprint 18 — Candidate E2E smoke / regression hardening.
Rama: `feat/sprint-18-candidate-e2e-smoke` (creada desde `dev` en `aa78f6f`, merge del PR #73
de Sprint 17D).
Fase de cierre: 18.5 — Hardening final + triple run + informe final. **Sin commit, sin push,
sin PR, sin merge** (pendiente de autorización del operador; el cierre Git aplicará
`docs/agents/git-pr-skill.md`).

## Objetivo inicial

Blindar el flujo candidato autenticado real —
Dashboard → JobIT CV → Portfolio → Jobs → Detalle → Guardadas → Match — con smoke E2E
(Playwright, navegador real contra web + API + BD local seedeada), de forma incremental y sin
flakiness. Sin features nuevas: proteger lo construido en 17A–17D.

## Contexto de partida

- `dev` con Sprint 17D mergeado (PR #73). Suites previas: Web 291/291 (Vitest + RTL, nivel
  página con APIs mockeadas), API 399/399 (Vitest, integración por módulos). Nada cubría el
  viaje completo web ↔ API real.
- Sin Playwright ni infraestructura E2E en el repo.
- Restricción de diseño (ADR-0006): la sesión candidata vive solo en memoria React (sin
  localStorage ni refresh; una recarga pierde la sesión).
- Spec SDD del smoke aprobada en 18.0: `docs/specs/features/candidate-e2e-smoke.md`.

## Trabajo realizado

Fases completadas y aprobadas por el operador:

- **18.0 — Startup + spec + plan documental**: rama del sprint desde `dev`; spec SDD
  `candidate-e2e-smoke.md` (flujo, estrategia de auth E2E, datos de prueba, tests mínimos);
  plan `sprint-18-candidate-e2e-smoke-plan.md` con las 11 decisiones del operador registradas.
- **18.1 — Infra Playwright mínima + public smoke**: `@playwright/test ^1.61.1` como
  devDependency de `@jobit/web` (única dependencia del sprint); Chromium headless instalado en
  local (fuera del repo, sin deps de sistema extra); `playwright.config.ts` (testDir `./e2e`,
  Chromium only, `workers: 1`, `retries: 0`, baseURL :3000, `reuseExistingServer: true`,
  trace solo en fallo, screenshots/video off); script `test:e2e`; ignores de artefactos;
  `public-smoke.spec.ts` con 4 tests públicos.
- **18.2 — Auth + Dashboard journey**: `helpers.ts` (usuario único
  `e2e+<timestamp>-<random>@jobit.local`, registro/login por UI, scope del sidebar privado,
  assert del dashboard); `auth-dashboard.spec.ts` (registro → dashboard → 6 enlaces de
  navegación privada). El registro real hace auto-login y redirige a `/dashboard`.
- **18.3 — Jobs + Saved + Match journey**: helper `goToPrivateSection`;
  `jobs-saved-match.spec.ts` (jobs → búsqueda → detalle → guardar → guardadas → quitar →
  empty state → match → guardar desde match). Determinista: captura el título de la primera
  card tras buscar, sin asumir ofertas concretas. Verificado en backend (solo lectura) que
  Match no filtra por score mínimo → no hizo falta preparar skills.
- **18.4 — Profile/CV + Portfolio journey**: helpers de perfil mínimo publicable
  (`createProfileMinimum`, `fillProfileMinimum`, `expectStatusMessage`,
  `getPortfolioPublicPath`, `expectPublicPortfolio`); `profile-portfolio.spec.ts`
  (CV mínimo → guardar → publicar portfolio → visitar `/u/[slug]` público en **pestaña
  nueva** del mismo contexto para no tocar la sesión en memoria → despublicar desde la página
  privada original).
- **18.5 — Hardening final (esta fase)**: auditoría de alcance, triple run E2E completo,
  suites web y API completas, build web con protocolo dev-server, auditorías grep
  específicas y este informe. Ninguna corrección fue necesaria: todo pasó a la primera.

## Archivos modificados

11 archivos del sprint (+ este informe). Modificados: `apps/web/package.json` (script
`test:e2e` + devDependency), `pnpm-lock.yaml`, `apps/web/.gitignore` (artefactos Playwright).
Nuevos: `apps/web/playwright.config.ts`, `apps/web/e2e/helpers.ts` (151 líneas),
`apps/web/e2e/public-smoke.spec.ts` (31), `apps/web/e2e/auth-dashboard.spec.ts` (27),
`apps/web/e2e/jobs-saved-match.spec.ts` (60), `apps/web/e2e/profile-portfolio.spec.ts` (62),
`docs/specs/features/candidate-e2e-smoke.md`, `docs/sprints/sprint-18-candidate-e2e-smoke-plan.md`
y `docs/sprints/sprint-18-candidate-e2e-smoke-final-report.md` (este informe, 18.5).

## Spec y plan documental

- `docs/specs/features/candidate-e2e-smoke.md`: objetivo, flujo principal (13 pasos),
  estrategia de autenticación E2E (login por UI + navegación client-side, sin goto privado ni
  reloads), datos de prueba, criterios de aceptación y los 4 specs mínimos.
- `docs/sprints/sprint-18-candidate-e2e-smoke-plan.md`: decisiones del operador, fases
  18.0–18.5, riesgos/mitigaciones y kill-switch.

## Infraestructura Playwright

- Única dependencia añadida: `@playwright/test ^1.61.1` (devDependency de `@jobit/web`).
- `pnpm-lock.yaml` cambia solo por ella (auditado: `playwright`, `playwright-core`, su
  optional `fsevents` y la re-resolución del peer opcional de Next).
- Chromium headless en `~/.cache/ms-playwright/` (no versionado).
- Config: solo Chromium, `workers: 1`, `retries: 0`, reporter `list`,
  `trace: retain-on-failure`, screenshots/video off, `webServer` con
  `reuseExistingServer: true` (convive con el protocolo dev-server del operador; la API :4000
  no la arranca, queda documentado en el propio config).

## Public smoke

`public-smoke.spec.ts` — 4 tests sin sesión: landing con CTAs de acceso, formulario de login,
formulario de registro, y `/u/e2e-portfolio-inexistente` → "Portfolio no disponible" (404
honesto contra la API real).

## Auth + Dashboard journey

`auth-dashboard.spec.ts` — usuario único por ejecución, registro por UI (labels reales:
Email, Contraseña, Confirmar contraseña), auto-login del flujo real, dashboard con saludo
"Hola, …" y los 6 enlaces del sidebar privado (Dashboard, JobIT CV, Portfolio, JobIT Jobs,
Guardadas, JobIT Match), scoped al `nav` accesible para no colisionar con las métricas
clicables del dashboard.

## Jobs + Saved + Match journey

`jobs-saved-match.spec.ts` — un único journey autenticado: búsqueda "Developer" → captura del
título de la primera card → detalle (h1) → "Guardar oferta" → feedback accesible "Oferta
guardada." + botón "Quitar de guardadas" → Guardadas (la oferta aparece) → "Quitar" →
"Oferta quitada de guardadas." + empty state → Match ("N ofertas ordenadas por afinidad") →
"Guardar" en la primera card → "Oferta guardada.". Robusto ante BD con ofertas ingestadas
además del seed.

## Profile + Portfolio journey

`profile-portfolio.spec.ts` — CV mínimo publicable (nombre, apellidos, headline, 1 skill,
1 proyecto; datos únicos por run) → guardar con feedback accesible → Portfolio → "Gestionar
publicación" → "Publicar portfolio" → "Portfolio publicado." → ruta pública leída de la UI
real → visita a `/u/[slug]` en pestaña nueva (`context.newPage()`, sin tocar la sesión en
memoria de la página privada) → datos del candidato visibles en el portfolio público →
cierre de pestaña → "Despublicar portfolio" → "Portfolio despublicado.".

## Tests y verificaciones

Ejecutadas el 2026-07-08 en `/home/david/projects/JobIT-platform`, rama
`feat/sprint-18-candidate-e2e-smoke`. Resultados exactos:

| Verificación | Comando | Resultado |
|---|---|---|
| Triple run E2E | `pnpm --filter @jobit/web test:e2e` ×3 | ✅ **7/7 · 7/7 · 7/7** (11.4s / 11.4s / 10.8s), 0 retries, 0 flakes |
| Typecheck web | `pnpm --filter @jobit/web typecheck` | ✅ exit 0 |
| Tests web | `pnpm --filter @jobit/web test` | ✅ **291/291** (21 archivos) — RTL intacto |
| Lint web | `pnpm --filter @jobit/web lint` | ✅ exit 0 |
| Build web | `pnpm --filter @jobit/web build` | ✅ 13/13 rutas |
| Typecheck API | `pnpm --filter @jobit/api typecheck` | ✅ exit 0 |
| Tests API | `pnpm --filter @jobit/api test` | ✅ **399/399** (41 archivos) |
| Build API | `pnpm --filter @jobit/api build` | ✅ exit 0 (`tsc -p tsconfig.build.json`) |
| Whitespace | `git diff --check` | ✅ exit 0 |

Protocolo dev-server cumplido: `next dev` corría en :3000 → parado antes del build →
build → relanzado después. La API :4000 no se paró en ningún momento. Verificado al final:
web :3000 → HTTP 200, api :4000/health → HTTP 200.

Auditorías grep específicas del sprint (todas limpias):

- `waitForTimeout` / `localStorage` / `sessionStorage` / API directa en `apps/web/e2e`:
  **0 resultados**.
- `page.goto()` a rutas privadas: **0** — todos los `goto` son públicos (`/`, `/login`,
  `/register`, `/u/...`); la visita pública de 18.4 usa pestaña nueva.
- `screenshot`/`video`: solo `screenshot: "off"` y `video: "off"` en el config (correcto).

## Seguridad y datos sensibles

- No se leyó ni imprimió ningún `.env`, DATABASE_URL, JWT, token, cookie ni credencial.
- La password E2E (`JobitE2e123!`) es un valor fijo de test local, no un secreto.
- Los tests no acceden a la API ni a la BD directamente: todo por UI.

Datos residuales esperados en la BD local de desarrollo (inofensivos, por diseño aprobado):

- Usuarios `e2e+<timestamp>-<random>@jobit.local` (uno por test autenticado y ejecución).
- Una oferta guardada desde Match por cada usuario del journey 18.3 (no se limpia).
- Perfiles con datos E2E y portfolio **despublicado** al final del journey 18.4.

## Decisiones técnicas

- Playwright como runner E2E (Opción A aprobada), una sola dependencia, solo Chromium,
  `workers: 1` — determinismo antes que velocidad en esta primera iteración.
- Sesión en memoria respetada como restricción de diseño: login por UI en cada journey,
  navegación client-side, visita pública en pestaña aparte. Sin persistencia simulada.
- Usuario nuevo por ejecución en lugar de usuario fijo en seed: aislamiento total sin tocar
  backend.
- Selectores exclusivamente por rol/label/texto accesible; los asserts reutilizan los
  feedbacks accesibles introducidos en 17D (`role="status"`), que quedan así protegidos.
- Sin dependencia de ofertas concretas: título capturado en runtime → estable aunque la BD
  tenga datos ingestados de Jooble/Greenhouse.

## Fuera de alcance respetado

- ✅ Sin backend: 0 cambios en `apps/api/**`.
- ✅ Sin Prisma/migraciones/seed.
- ✅ Sin cambios en `apps/web/src/**` (la app no se tocó en todo el sprint).
- ✅ Sin contrato API (`types/api.ts` intacto).
- ✅ Sin CI: `.github/**` intacto.
- ✅ Sin `.env*`, docker ni deploy.
- ✅ `package.json`/lockfile: solo la devDependency `@playwright/test` (autorizada en 18.1).
- ✅ Sin multi-browser, mobile, screenshots/regresión visual ni performance.
- ✅ Sin commit/push/PR/merge y sin Co-Authored-By (no hay commits aún).

## Problemas encontrados

- Ninguno bloqueante en 18.5: triple run, suites y build pasaron a la primera, sin
  correcciones de estabilidad.
- Operativa menor (fases previas): el dev server web lanzado en background muere si no se
  desacopla con `setsid` (sesiones wsl.exe); resuelto en el protocolo de relanzado.
- Preexistente y cosmético: warning de Next por lockfiles múltiples
  (`/home/david/projects/pnpm-lock.yaml` ajeno al repo); no afecta a build ni tests.

## Deuda pendiente

- **CI E2E** (GitHub Actions) — excluido de 18 por decisión del operador; sprint futuro con
  autorización propia.
- **Purga opcional de usuarios E2E** locales (`e2e+…@jobit.local`) si algún día molestan;
  posible **helper de cleanup** si el volumen lo justifica.
- **Multi-browser, mobile y regresión visual**: fuera por decisión; evaluar solo si aportan
  señal real.
- Simetría menor del journey 18.3: la oferta guardada desde Match no se quita (2 líneas si
  se quiere).
- Heredada de 17D: hex restantes en subsecciones de Profile (candidato a Sprint 17E).

## Resultado final

Sprint 18 completo en working tree y verificado de extremo a extremo: 7 tests E2E estables
(triple run sin flakes), suites Web 291/291 y API 399/399, lint, builds web y API en verde,
alcance auditado sin ningún cambio prohibido. Listo para revisión final del operador y cierre
Git conforme a `docs/agents/git-pr-skill.md`.

**Estado: `SPRINT_18_READY_FOR_OPERATOR_FINAL_REVIEW`**

## Recomendación para el orquestador

1. **Cierre Git de Sprint 18**: commit único (o por fases), push de
   `feat/sprint-18-candidate-e2e-smoke` y PR hacia `dev` con el resumen breve de abajo,
   aplicando `docs/agents/git-pr-skill.md`. Sin Co-Authored-By. No mergear por CLI.
2. Tras el merge, siguiente sprint desde `dev` con scope propio. Candidatos:
   - **Sprint 17E — Profile section visual cleanup** (deuda de 17D, scope pequeño).
   - **Sprint 19 — CI para suites + E2E** (requiere autorización de `.github/**`).

## Resumen breve sugerido para PR

# Sprint 18 — Candidate E2E smoke

## Resumen

Añade infraestructura Playwright y smoke tests E2E para proteger el flujo candidato real
tras los Sprints 17C/17D.

## Cambios principales

- Nueva spec SDD de smoke E2E candidato (`docs/specs/features/candidate-e2e-smoke.md`).
- Playwright configurado en `apps/web` (Chromium, workers 1, `test:e2e`).
- Public smoke: landing, login, register y portfolio público inexistente.
- Journey autenticado: registro → dashboard.
- Journey jobs: jobs → detalle → guardar → guardadas → quitar → match → guardar desde match.
- Journey profile/portfolio: guardar CV mínimo → publicar portfolio → validar `/u/[slug]` →
  despublicar.

## Verificaciones

- `pnpm --filter @jobit/web test:e2e` → OK, 7/7 ×3 sin flakes.
- `pnpm --filter @jobit/web typecheck` → OK.
- `pnpm --filter @jobit/web test` → OK, 291/291.
- `pnpm --filter @jobit/web lint` → OK.
- `pnpm --filter @jobit/web build` → OK, 13/13 rutas.
- `pnpm --filter @jobit/api typecheck` → OK.
- `pnpm --filter @jobit/api test` → OK, 399/399.
- `pnpm --filter @jobit/api build` → OK.
- `git diff --check` → OK.

## Fuera de alcance respetado

- Sin backend ni Prisma/seed.
- Sin CI/GitHub Actions.
- Sin cambios en `apps/web/src/**`.
- Sin `.env` ni deploy.
- Única dependencia nueva: `@playwright/test` (devDependency).

## Informe completo

`docs/sprints/sprint-18-candidate-e2e-smoke-final-report.md`

## Revisión

PR lista para revisión humana. No mergear por CLI.
