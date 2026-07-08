# Sprint 19B — E2E manual workflow (plan)

## Objetivo

Ejecutar el smoke E2E de Playwright (Sprint 18) en GitHub Actions **bajo demanda**, mediante
un workflow manual `workflow_dispatch`, sin convertirlo en gate automático de PR ni en
required check. El E2E pasa de ser solo local a poder lanzarse también en CI cuando el
operador lo decida.

## Contexto (Sprints 18 / 19 / 19E)

- **Sprint 18**: smoke E2E local (7 tests Playwright, 4 specs) del flujo candidato real
  contra web `:3000` + API `:4000` + PostgreSQL seedeado. Config local-first:
  `reuseExistingServer: true`, Chromium only, `workers: 1`, `retries: 0`,
  `trace: retain-on-failure`.
- **Sprint 19**: workflow `JobIT CI` con quality gates API/Web en cada PR (2 runs reales en
  verde en PRs #75 y #76).
- **Sprint 19E**: branch protection en `dev` con los dos checks del CI como required.
- **Plan Mode 19B**: el workflow E2E manual es viable **sin tocar ningún archivo de runtime**
  (ni `playwright.config.ts`, ni package.json, ni el CI existente).

## Decisión: workflow manual, no required check

- El historial de estabilidad del smoke es corto (3 runs locales + 0 en CI): convertirlo en
  gate bloqueante sería prematuro. Un E2E flaky como required check entrena a re-lanzar sin
  mirar, que es peor que no tener E2E en CI.
- Camino de promoción por estabilidad: workflow manual → ejecución voluntaria en PRs
  relevantes durante 2–3 sprints → check automático no bloqueante → solo entonces, candidato
  a required check. Cada salto es decisión explícita del operador.
- Trigger único `workflow_dispatch`: sin `pull_request`, sin `push`, sin `schedule`.

## Requisitos del stack E2E en CI

El smoke exige el stack completo vivo, en este orden:

1. PostgreSQL efímero (service `postgres:16` con healthcheck, base `jobit_e2e`).
2. `prisma generate` + `prisma migrate deploy` explícito (aquí no hay `globalSetup` de
   Vitest que migre solo).
3. Seed (`tsx prisma/seed.ts`): autónomo e idempotente, solo tabla `Job` (14 ofertas); la
   búsqueda E2E "Developer" casa con 3 ofertas activas del seed.
4. API real en `:4000` (el config de Playwright no la arranca).
5. Web real en `:3000`.
6. Chromium de Playwright instalado en el runner.

## Variables dummy

Sin GitHub Secrets; ninguna es un secreto real:

| Variable | Valor | Ámbito |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/jobit_e2e?schema=public` | job |
| `JWT_ACCESS_SECRET` | `e2e-ci-access-secret` | job |
| `PORT` / `CORS_ORIGIN` | `4000` / `http://localhost:3000` | job |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | job (se inlinea en el build de Next) |
| `NODE_ENV` | `production` | **solo el step de arranque de la API** |

`NODE_ENV=production` no puede definirse a nivel de job: `pnpm install` omitiría las
devDependencies (tsx, prisma CLI, playwright, typescript) y rompería todos los pasos
siguientes. `JWT_REFRESH_SECRET` no se define: el runtime de la API no lo usa (verificado en
Plan Mode; solo `JWT_ACCESS_SECRET` en `jwt.util.ts`).

## Estrategia PostgreSQL / migrate / seed

Service `postgres:16` (paridad con el contenedor local y con el job `api` del CI), con
healthcheck `pg_isready`. Migración con `prisma migrate deploy` explícito y seed con
`tsx prisma/seed.ts`, ambos contra la base efímera del job. Cada run parte de una base
limpia: los usuarios `e2e+…@jobit.local` que crean los journeys desaparecen con el job.

## Estrategia de arranque de la API

`pnpm --filter @jobit/api build` (tsc) y arranque en background con `node dist/server.js`
(`NODE_ENV=production` en ese step), log a `$RUNNER_TEMP/jobit-api.log`. Espera activa de
`GET /health` con reintentos (30 × 2 s); si no llega, el step falla mostrando el log. Los
procesos en background persisten entre steps del mismo job en GitHub Actions.

## Estrategia de arranque de la Web

**Decisión del Director: `next build && next start`** (build de producción). Sin compilación
on-demand — la mayor fuente de timeouts de `next dev` en runners compartidos.
`NEXT_PUBLIC_API_BASE_URL` queda inlineada en el build. Arranque en background
(`pnpm start`, puerto 3000 por defecto), log a `$RUNNER_TEMP/jobit-web.log` y espera activa
de `:3000`. Matiz aceptado: los 7 tests del Sprint 18 se validaron contra `next dev`; la
primera run manual confirmará el comportamiento contra el build de producción (ese es
precisamente el valor de que el workflow sea manual y no bloqueante).

## Estrategia de Playwright

`pnpm --filter @jobit/web exec playwright install chromium --with-deps` (solo Chromium) y
`pnpm --filter @jobit/web test:e2e`. Gracias a `reuseExistingServer: true`, Playwright
detecta la web viva en `:3000` y **no** lanza su propio `webServer` → cero cambios en
`apps/web/playwright.config.ts`. Se mantienen `workers: 1` y `retries: 0` (señal honesta de
estabilidad; si tras varias runs aparece ruido real de infra, se valorará un cambio puntual
de config con autorización expresa).

## Artefactos en fallo

Solo si el job falla se suben dos artifacts (retención 7 días):

- `playwright-test-results`: `apps/web/test-results/` (traces `retain-on-failure`).
- `server-logs`: logs de arranque de API y web (`$RUNNER_TEMP/jobit-*.log`).

En verde no se sube nada (el reporter `list` queda en el log del job).

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| `next start` es entorno no probado por el smoke (validado contra `next dev`) | Primera run manual como validación; fallo = diagnóstico, no bloqueo |
| `retries: 0` → un fallo transitorio tumba el run | Aceptado en fase 1: workflow no bloqueante; traces + logs como diagnóstico |
| Cold start de API/web en runner | Esperas activas con reintentos (60 s máx.) en vez de sleeps fijos |
| `workflow_dispatch` no visible en la UI de Actions hasta que `e2e.yml` exista en la rama por defecto (`main`) | Lanzar por CLI: `gh workflow run e2e.yml --ref dev` (funciona con el workflow en la ref) |
| `NODE_ENV=production` a nivel de job rompería `pnpm install` | Definido solo en el step de arranque de la API (comentado en el propio workflow) |

## Fuera de alcance

- E2E como required check o trigger en `pull_request`/`push`/`schedule`.
- Cambios en `.github/workflows/ci.yml`, branch protection, `playwright.config.ts`,
  `package.json`, lockfile, Prisma/seed, código funcional o tests E2E.
- Deploy, Docker, secrets, environments, merge queue.
- Multi-browser, mobile, regresión visual, cache de browsers Playwright (optimización
  futura si el uso lo justifica).

## Criterios de aceptación

- [ ] `.github/workflows/e2e.yml` existe con trigger único `workflow_dispatch`.
- [ ] El job monta el stack completo (Postgres + migrate + seed + API + web) con variables
      dummy y ejecuta los 7 tests del smoke.
- [ ] Sin secrets configurados; sin cambios en archivos prohibidos.
- [ ] La spec `ci-quality-gates.md` refleja el nuevo estado de la estrategia E2E.
- [ ] PR hacia `dev` pasa los dos required checks del CI.
- [ ] Primera ejecución manual tras el merge documentada (verde o diagnóstico).

## Primera ejecución manual tras el merge

```bash
# Lanzar el workflow sobre dev (la UI de Actions puede no listarlo hasta que
# e2e.yml llegue a main; el CLI funciona con la ref directamente):
gh workflow run e2e.yml --ref dev -R David-LS-Bilbao/JobIT-platform

# Seguir la ejecución:
gh run list -R David-LS-Bilbao/JobIT-platform --workflow=e2e.yml
gh run watch -R David-LS-Bilbao/JobIT-platform <run-id>
```

Si la run falla: descargar los artifacts `playwright-test-results` y `server-logs` desde la
página de la run para diagnóstico antes de tocar nada.
