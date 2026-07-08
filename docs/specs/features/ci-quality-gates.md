# Spec — CI quality gates (Sprint 19)

## Objetivo

Añadir la primera capa mínima de integración continua para JobIT: un workflow de GitHub
Actions que ejecute automáticamente en cada PR las mismas verificaciones que hoy se ejecutan
a mano al cierre de cada sprint (typecheck/test/build de la API; lint/typecheck/test/build de
la web). Sin E2E automático, sin deploy y sin secrets.

## Usuario/equipo afectado

- **Operador/desarrollador**: recibe señal automática de regresión en cada PR hacia `dev` o
  `main`, sin depender de ejecutar las suites a mano.
- **Agentes IA**: el resultado del CI se convierte en verificación objetiva del flujo
  SDD + TDD + AI Audit antes del merge.
- **Candidato (indirecto)**: menor probabilidad de que una regresión llegue a `dev`.

## Contexto

- El repo no tenía `.github/` (auditado en Plan Mode del Sprint 19): el CI parte de cero.
- Tests API: 399 tests de integración real contra PostgreSQL. El `globalSetup` de Vitest
  (`apps/api/src/tests/setup.ts`) ejecuta `prisma migrate deploy` contra `DATABASE_URL_TEST`,
  por lo que la migración en CI es automática. `apps/api/vitest.config.ts` ya está endurecido
  para infra ruidosa (`fileParallelism: false`, `retry: 2`, timeouts 30 s).
- Tests web: 291 tests Vitest + RTL con APIs mockeadas; no necesitan base de datos.
- No hay hook `postinstall` que genere el cliente Prisma: se requiere `prisma generate`
  explícito tras `pnpm install` (documentado en `docs/agents/operating-environment.md`).
- Node local: v20; pnpm fijado por `packageManager: pnpm@10.0.0` en el `package.json` raíz.
- PostgreSQL local: contenedor `postgres:16-alpine` → paridad en CI con `postgres:16`.
- El smoke E2E de Playwright (Sprint 18) está diseñado para el stack local del operador
  (API en `:4000` que el config no arranca, seed local, `reuseExistingServer: true`).

## Flujo principal

1. El desarrollador abre o actualiza un PR hacia `dev` o `main` (o hace push a `dev`).
2. GitHub Actions lanza el workflow **JobIT CI** con dos jobs paralelos e independientes.
3. Job `api`: levanta un service `postgres:16` con healthcheck, instala dependencias con
   lockfile congelado, genera el cliente Prisma y ejecuta typecheck → tests de integración
   (que migran la base efímera solos) → build.
4. Job `web`: instala dependencias y ejecuta lint → typecheck → tests RTL → build de Next.
5. Ambos checks aparecen por separado en el PR; cualquier fallo bloquea la revisión humana
   con señal concreta de qué capa falló.

## Workflows

| Workflow | Archivo | Estado |
|---|---|---|
| JobIT CI | `.github/workflows/ci.yml` | Implementado en este sprint |
| E2E manual | `.github/workflows/e2e.yml` | **NO implementado** — fase posterior (ver Estrategia E2E) |

Triggers de `ci.yml`:

- `pull_request` hacia `dev` y `main`.
- `push` hacia `dev` (verificación post-merge).
- `workflow_dispatch` (ejecución manual para diagnóstico).

`concurrency` por workflow + ref con `cancel-in-progress: true`: pushes consecutivos a la
misma rama cancelan la ejecución anterior y ahorran minutos de Actions.

## Jobs

### Job `api` (ubuntu-latest, timeout 20 min)

- Service `postgres:16` con `POSTGRES_DB: jobit_test` y healthcheck `pg_isready`
  (interval 10 s, timeout 5 s, retries 5); puerto 5432 publicado al runner.
- Pasos: checkout → pnpm (`pnpm/action-setup`, versión desde `packageManager`) → Node 20 con
  cache pnpm → `pnpm install --frozen-lockfile` → `prisma generate` → typecheck → test →
  build.

### Job `web` (ubuntu-latest, timeout 15 min)

- Sin servicios (los tests RTL mockean las APIs).
- Pasos: checkout → pnpm → Node 20 con cache pnpm → `pnpm install --frozen-lockfile` →
  lint → typecheck → test → build.

## Comandos

Idénticos a los del checklist local (`docs/agents/operating-environment.md`); el CI no
introduce comandos nuevos ni modifica scripts:

```bash
pnpm install --frozen-lockfile
pnpm --filter @jobit/api exec prisma generate
pnpm --filter @jobit/api typecheck
pnpm --filter @jobit/api test
pnpm --filter @jobit/api build
pnpm --filter @jobit/web lint
pnpm --filter @jobit/web typecheck
pnpm --filter @jobit/web test
pnpm --filter @jobit/web build
```

`@jobit/api` no tiene script `lint`; añadirlo queda fuera de alcance (tocaría
`package.json`).

## Variables dummy

Ninguna variable del CI es un secreto real; **no se usa GitHub Secrets**:

| Job | Variable | Valor | Nota |
|---|---|---|---|
| `api` | `DATABASE_URL_TEST` | `postgresql://postgres:postgres@localhost:5432/jobit_test?schema=public` | Base efímera del service; se destruye al acabar el job |
| `web` | `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | Variable pública por diseño; el build no contacta ese host |

Los tests de la API se autoproveen `JWT_ACCESS_SECRET` (valor fijo de test dentro de los
propios tests); no se define en el workflow. `NODE_ENV=test` lo fija `vitest.config.ts`.

## Reglas de negocio/operativas

- El CI ejecuta exactamente los scripts existentes de los workspaces: no se crean scripts
  nuevos ni se modifican los actuales.
- `--frozen-lockfile` obligatorio: un lockfile desincronizado debe fallar, no regenerarse.
- Node 20 fijado en el workflow (no hay `engines`/`.nvmrc` en el repo).
- La versión de pnpm se resuelve desde `packageManager` (una sola fuente de verdad).
- Jobs `api` y `web` independientes: un fallo de uno no oculta el resultado del otro.
- Prohibido introducir secrets, deploy o E2E automático en este workflow.

## Validaciones

- El workflow valida en cada PR: tipos (tsc), lint (eslint web), comportamiento (suites
  Vitest API+web) y compilación (tsc build API, next build web).
- El healthcheck de PostgreSQL garantiza que los tests no arrancan contra una base aún no
  disponible.

## Errores esperados

- **Lockfile desincronizado** → `pnpm install --frozen-lockfile` falla (comportamiento
  deseado: obliga a regenerar el lockfile en local de forma consciente).
- **Cliente Prisma no generado** → typecheck fallaría con `TS2305`; el paso explícito
  `prisma generate` lo previene.
- **PostgreSQL no disponible** → el healthcheck retiene el job; si nunca llega a healthy,
  el job falla por timeout del service (señal de infra, no de código).
- **Test flaky de integración** → `retry: 2` ya configurado en `vitest.config.ts` (un fallo
  real falla los 3 intentos).
- **Job colgado** → `timeout-minutes` (20 API / 15 web) corta la ejecución.

## Criterios de aceptación

- [ ] `.github/workflows/ci.yml` existe con jobs `api` y `web` según esta spec.
- [ ] El job `api` pasa en verde en GitHub Actions con la suite completa de integración.
- [ ] El job `web` pasa en verde con lint + typecheck + tests + build.
- [ ] Ningún secret configurado; solo variables dummy documentadas aquí.
- [ ] `package.json`, `pnpm-lock.yaml`, Prisma, seed y código funcional intactos.
- [ ] El E2E de Playwright NO se ejecuta en PR (sigue siendo local/manual).
- [ ] Las verificaciones locales equivalentes pasan antes de abrir el PR del sprint.

## Tests/verificaciones mínimas

El CI no lleva tests propios (es infraestructura declarativa). Verificación en dos niveles:

1. **Local (pre-PR)**: ejecutar los nueve comandos de la sección Comandos en el clon
   canónico + `git diff --check`.
2. **Real (post-push)**: la primera ejecución del workflow en el PR del propio sprint actúa
   como test de aceptación del CI; se revisan tiempos reales y se ajustan timeouts si hiciera
   falta (follow-up documentado, no en este sprint).

## Estrategia E2E

**Manual bajo demanda (Sprint 19B) — NO automática en PR ni push, NO required check.**

- El smoke E2E (7 tests Playwright) exige stack completo: PostgreSQL migrado **y seedeado**,
  API real en `:4000` (el config de Playwright no la arranca), web en `:3000` y Chromium
  instalado. Su config actual es deliberadamente local-first (`reuseExistingServer: true`,
  `retries: 0`).
- El Sprint 19B añade `.github/workflows/e2e.yml` (**JobIT E2E (manual)**), con trigger
  único `workflow_dispatch`: monta el stack completo en el runner (service `postgres:16`
  migrado y seedeado, API con `node dist/server.js`, web con `next build && next start`)
  usando solo variables dummy, ejecuta el smoke y sube traces/logs como artifacts solo en
  fallo. Gracias a `reuseExistingServer: true` no fue necesario tocar
  `apps/web/playwright.config.ts`. Detalle:
  `docs/sprints/sprint-19b-e2e-manual-workflow-plan.md`.
- Camino de promoción por estabilidad: ejecución manual voluntaria en PRs relevantes →
  si demuestra estabilidad, promoción a check automático no bloqueante → solo entonces,
  candidato a required check. Cada salto es decisión explícita del operador.
- El E2E sigue ejecutándose también en local según el Sprint 18
  (`pnpm --filter @jobit/web test:e2e` contra el stack local seedeado).
- Adaptar `apps/web/playwright.config.ts` a CI (retries condicionales, reporter con
  artefactos) seguirá requiriendo autorización expresa si alguna fase futura lo necesita.

## Fuera de alcance

- Workflow E2E (`e2e.yml`) y cualquier ejecución de Playwright en CI.
- Deploy, Docker, staging, VPS, secrets de producción.
- Cambios en `package.json`, `pnpm-lock.yaml`, scripts, dependencias, Prisma o seed.
- Script `lint` para la API.
- Coverage thresholds, SAST/CodeQL, Dependabot, cache de browsers Playwright.
- Branch protection / required checks: configuración de GitHub que decide y aplica el
  operador en la UI tras observar el workflow estable (se propondrá en el informe final).
- `.nvmrc` / campo `engines` (propuesto como micro-tarea aparte si el Director lo aprueba).
