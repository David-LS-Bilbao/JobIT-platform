# Sprint 18 — Candidate E2E smoke / regression hardening

## Objetivo

Blindar el flujo candidato autenticado real —
**Dashboard → JobIT CV → Portfolio → Jobs → Detalle → Guardadas → Match** — con smoke E2E
(Playwright, navegador real contra web + API + BD local seedeada), de forma incremental y sin
flakiness. No se crean features nuevas: se protege lo construido en 17A–17D.

## Contexto de partida

- Sprint 17D mergeado en `dev` (PR #73, merge `aa78f6f`). Working tree limpio.
- Tests actuales: Web 291 tests (Vitest + RTL, nivel página con APIs mockeadas); API 399 tests
  (Vitest, integración por módulos). Nada cubre el viaje completo web ↔ API real.
- No existe Playwright ni infraestructura E2E (auditado en Plan Mode: sin config, sin carpeta
  e2e, sin dependencia en ningún package.json).
- Sesión candidata solo en memoria React (ADR-0006): sin localStorage ni refresh → condiciona
  el diseño de los journeys (login por UI + navegación client-side, sin reloads).
- Seed local de ofertas variado en `apps/api/prisma/seed.ts` (incluye casos CLOSED/expirado).
- Skill de cierre Git/PR disponible en `docs/agents/git-pr-skill.md` (referenciada por
  AGENTS.md); se aplicará al cierre del sprint.
- Spec SDD del smoke: `docs/specs/features/candidate-e2e-smoke.md` (creada en 18.0).

## Decisiones del operador

1. **Opción A aprobada**: añadir Playwright en Sprint 18.
2. `@playwright/test` como devDependency en `apps/web` — **instalación en 18.1, no en 18.0**.
3. `apps/web/package.json` y `pnpm-lock.yaml` autorizados **solo** para esa devDependency y
   **solo** en 18.1.
4. Usuario E2E: creación vía registro UI con email único por ejecución
   (`e2e+<timestamp>@jobit.local`).
5. No tocar backend ni seed para crear un usuario E2E fijo.
6. Playwright puede reutilizar servidores existentes: `reuseExistingServer: true`.
7. Web esperada en `http://localhost:3000`; API esperada en `http://localhost:4000`.
8. CI/GitHub Actions queda fuera de Sprint 18.
9. Solo Chromium.
10. `workers: 1` inicial.
11. Sin screenshots/regresión visual, sin multi-browser, sin mobile, sin
    performance/Lighthouse.

## Alcance aprobado

- Spec SDD + plan documental (18.0).
- Infraestructura Playwright mínima en `apps/web`: devDependency, `playwright.config.ts`
  (baseURL :3000, Chromium, workers 1, `reuseExistingServer: true`), script `test:e2e`,
  gitignore de artefactos (18.1).
- 4 specs E2E incrementales según la spec: `public-smoke`, `auth-dashboard`,
  `jobs-saved-match`, `profile-portfolio` (18.1–18.4).
- Hardening anti-flakiness (triple run), documentación de ejecución local e informe final
  (18.5).
- Cierre Git aplicando `docs/agents/git-pr-skill.md`.

## Fuera de alcance

- CI/GitHub Actions (`.github/**` intacto).
- Backend (`apps/api/**`), Prisma, migraciones, seed, contrato API (`types/api.ts`).
- Auth refresh/persistencia de sesión.
- Multi-browser, mobile, screenshots/regresión visual, performance/Lighthouse.
- Nuevas features de producto, deploy, docker, `.env*`.
- Pulido visual de Profile (candidato a Sprint 17E, no aquí).

## Estrategia técnica

- **Autenticación**: cada journey se registra/loguea por UI y navega solo con clicks/enlaces
  client-side; prohibido `page.goto()` a rutas privadas tras login y prohibido recargar
  (la sesión vive en memoria React y se perdería).
- **Aislamiento de datos**: usuario nuevo por ejecución (email con timestamp); el journey crea
  su propio CV/skills y limpia su estado de guardadas dentro del propio test. Sin dependencia
  de usuarios previos ni de ingesta externa.
- **Determinismo**: smoke solo contra ofertas del seed local; selectores por rol/texto
  accesible (no clases CSS); `workers: 1`; sin sleeps fijos (auto-waiting de Playwright).
- **Servidores**: `reuseExistingServer: true` para convivir con el protocolo dev-server del
  operador (web :3000 / API :4000 ya corriendo); si no están vivos, el config puede levantarlos
  vía `webServer` (a decidir en 18.1 sin cambiar puertos).

## Fases previstas

| Fase | Contenido | Resultado esperado |
|---|---|---|
| 18.0 | Spec + plan documental | Documentación lista |
| 18.1 | Infra Playwright mínima | `test:e2e` público verde |
| 18.2 | Auth + Dashboard journey | Registro/login/dashboard verde |
| 18.3 | Jobs + Saved + Match journey | Flujo ofertas verde |
| 18.4 | Profile + Portfolio journey | CV/portfolio verde |
| 18.5 | Hardening + triple run + informe final | Sprint listo para PR |

Cada fase termina con verificación propia y sin romper las suites RTL/API existentes.

## Archivos probablemente afectados

- **18.0 (solo docs)**: `docs/specs/features/candidate-e2e-smoke.md`,
  `docs/sprints/sprint-18-candidate-e2e-smoke-plan.md`.
- **18.1**: `apps/web/package.json` + `pnpm-lock.yaml` (solo devDependency
  `@playwright/test`), `apps/web/playwright.config.ts`, `apps/web/e2e/public-smoke.spec.ts`,
  gitignore de `playwright-report/`/`test-results/`.
- **18.2–18.4**: `apps/web/e2e/auth-dashboard.spec.ts`, `apps/web/e2e/jobs-saved-match.spec.ts`,
  `apps/web/e2e/profile-portfolio.spec.ts`, posible `apps/web/e2e/helpers.ts`.
- **18.5**: `docs/sprints/sprint-18-candidate-e2e-smoke-final-report.md`, posible doc de
  protocolo E2E local en `docs/agents/`.
- **Prohibidos todo el sprint**: `apps/api/**`, Prisma/seed/migraciones,
  `apps/web/src/types/api.ts`, `.env*`, `docker/**`, `.github/**`, deploy.

## Riesgos y mitigaciones

- **Sesión en memoria** → journeys de un solo hilo con navegación client-side; sin reloads.
- **Estado compartido de BD local** → usuario único por run; el test limpia lo que guarda;
  `workers: 1`.
- **Flakiness** → selectores accesibles, auto-waiting, sin sleeps; triple run en 18.5 como
  criterio de cierre.
- **Instalación de browsers en WSL** → `pnpm exec playwright install chromium` (y
  `--with-deps` si faltan librerías del sistema); documentar el paso en 18.1.
- **Conflicto con dev servers del operador** → `reuseExistingServer: true`; mismos puertos
  3000/4000; el protocolo dev-server del proyecto sigue aplicando para builds.
- **Deriva de alcance hacia backend/CI** → kill-switch explícito (abajo) + decisiones 5 y 8
  del operador como límites duros.

## Criterios de aceptación

- [ ] Spec y plan documental aprobados (18.0).
- [ ] `pnpm --filter @jobit/web test:e2e` en verde con los 4 specs contra stack local seedeado.
- [ ] 3 ejecuciones consecutivas del smoke en verde (18.5).
- [ ] Ningún journey usa `goto` a rutas privadas tras login ni recarga página.
- [ ] Suites existentes intactas: Web 291+ y API en verde; typecheck/lint/build web OK.
- [ ] Cambios en `package.json`/lockfile limitados a `@playwright/test` (devDependency).
- [ ] Sin cambios en backend, Prisma, seed, contrato API, `.env*`, docker, `.github`.
- [ ] Cierre Git conforme a `docs/agents/git-pr-skill.md` (PR en español, resumen breve,
      sin informe completo pegado, sin Co-Authored-By).

## Verificaciones previstas

- Por fase: `pnpm --filter @jobit/web typecheck`, tests RTL afectados si los hubiera, lint,
  y `pnpm --filter @jobit/web test:e2e` (desde 18.1).
- Cierre (18.5): suites completas web + API (`test`, por tocar lockfile), build web con
  protocolo dev-server, `pnpm --filter @jobit/api typecheck`, `git diff --check`, triple run
  E2E.

## Kill-switch

Detener y marcar BLOCKED si:

- se necesita tocar `apps/api/**`, Prisma, seed o `types/api.ts`;
- se necesita cualquier dependencia distinta de `@playwright/test`;
- se necesita CI/`.github/**` o deploy;
- un journey exige persistencia de sesión o endpoint de refresh (feature, no test);
- el smoke requiere datos de ingesta externa para ser estable;
- working tree con cambios ajenos al sprint, repos anidados o secretos en juego;
- cualquier instrucción fuera de `/home/david/projects/JobIT-platform`.
