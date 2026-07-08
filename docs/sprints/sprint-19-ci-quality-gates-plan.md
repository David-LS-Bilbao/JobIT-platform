# Sprint 19 — CI quality gates (plan)

## Resumen del Plan Mode

El Plan Mode del Sprint 19 (inspección solo lectura, clon canónico en `dev` @ `2c232cb`,
working tree limpio) concluyó:

- No existe `.github/`: el CI parte de cero, sin nada heredado.
- Los scripts necesarios ya existen en ambos workspaces; la API no tiene `lint`.
- Los tests de la API son de integración real: el `globalSetup` de Vitest ejecuta
  `prisma migrate deploy` contra `DATABASE_URL_TEST` → CI necesita un service PostgreSQL,
  pero no un paso de migración aparte.
- `prisma generate` debe ser explícito tras `pnpm install` (no hay `postinstall`).
- Los tests web (RTL, APIs mockeadas) no necesitan base de datos → jobs separables.
- Ninguna variable necesaria es un secreto real → CI sin GitHub Secrets.
- El E2E de Playwright (Sprint 18) es local-first; convertirlo en gate automático de PR
  sería prematuro (histórico de estabilidad de solo 3 runs locales, config sin retries).

Estado final del Plan Mode: `PLAN_ONLY_READY_FOR_DIRECTOR_REVIEW`.

## Decisión aprobada

El Chat Director aprobó el alcance limitado:

- CI básico para API y Web en un único workflow con dos jobs paralelos.
- **No** E2E automático; **no** `e2e.yml` todavía.
- **No** cambios en `package.json` ni `pnpm-lock.yaml`; **no** deploy; **no** secrets.
- Node 20 fijado en el workflow; PostgreSQL `postgres:16` como service; variables dummy
  seguras.

## Alcance implementado (fases 19.0–19.2)

| Fase | Contenido | Archivos |
|---|---|---|
| 19.0 | Rama `feat/sprint-19-ci-quality-gates` desde `dev` + spec SDD + este plan | `docs/specs/features/ci-quality-gates.md`, `docs/sprints/sprint-19-ci-quality-gates-plan.md` |
| 19.1 | Workflow con job `web` (lint + typecheck + test + build, sin DB) | `.github/workflows/ci.yml` |
| 19.2 | Job `api` en el mismo workflow (service `postgres:16` + prisma generate + typecheck + test + build) | `.github/workflows/ci.yml` |

Detalles del workflow **JobIT CI**:

- Triggers: `pull_request` → `dev`/`main`; `push` → `dev`; `workflow_dispatch`.
- `concurrency` por ref con `cancel-in-progress: true`.
- pnpm vía `pnpm/action-setup` leyendo `packageManager` (pnpm 10) + `setup-node` con Node 20
  y cache pnpm + `pnpm install --frozen-lockfile` en ambos jobs.
- Timeouts: 20 min (api) / 15 min (web).

## Fuera de alcance

- E2E en CI (`e2e.yml`), incluso manual — fase posterior con autorización propia.
- Modificar `apps/web/playwright.config.ts`.
- Deploy/Docker/staging/VPS/secrets.
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, Prisma, seed, `.env*`,
  `apps/api/src/**`, `apps/web/src/**`, `apps/web/e2e/**`.
- Branch protection / required checks (decisión del operador en GitHub UI, tras ver el
  workflow estable).
- Coverage, SAST, Dependabot, script `lint` de API, `.nvmrc`.

## Riesgos

1. Duración real de la suite API (399 tests secuenciales, bcrypt) en runner compartido:
   desconocida hasta la primera ejecución.
2. Fallo de typecheck por cliente Prisma ausente si se reordena el workflow.
3. Drift de versión de Node entre local (v20) y CI si alguien edita el workflow.
4. Flakiness de tests de integración en infra compartida.
5. Primera ejecución del workflow solo puede validarse tras el push del PR (los YAML no se
   ejecutan en local).

## Mitigaciones

1. `timeout-minutes: 20` holgado + medición en la primera run del PR; ajuste como follow-up.
2. Paso `prisma generate` explícito y comentado en el propio workflow.
3. `node-version: 20` fijado y documentado en la spec; pnpm desde `packageManager`.
4. `retry: 2`, `fileParallelism: false` y timeouts 30 s ya configurados en
   `apps/api/vitest.config.ts` (endurecido en sprints previos); healthcheck de PostgreSQL.
5. Verificación local completa pre-PR (los nueve comandos del CI) + revisión de la primera
   run como criterio de aceptación del sprint.

## Comandos CI

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

Variables dummy (sin secrets): `DATABASE_URL_TEST` apuntando al service `postgres:16` del
job `api`; `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` en el job `web`.

## Estrategia E2E posterior

Aprobada como "manual primero, promoción por estabilidad" (detalle en la spec):

1. Fase posterior (19.3 o Sprint 19B): `e2e.yml` con `workflow_dispatch` (stack completo:
   Postgres + migrate + seed + API + web + Chromium). Requiere autorización de alcance
   propia, incluida la posible adaptación de `playwright.config.ts` a CI.
2. Ejecución voluntaria en PRs relevantes durante 2–3 sprints.
3. Si demuestra estabilidad: promoción a check automático no bloqueante y, más adelante,
   candidato a required check.

Mientras tanto el smoke E2E sigue siendo local (`pnpm --filter @jobit/web test:e2e`).

## Checklist final

- [ ] Rama `feat/sprint-19-ci-quality-gates` creada desde `dev` actualizado.
- [ ] Spec SDD creada (`docs/specs/features/ci-quality-gates.md`).
- [ ] Plan documental creado (este archivo).
- [ ] `.github/workflows/ci.yml` creado con jobs `api` y `web` según spec.
- [ ] Sin cambios en archivos prohibidos (`package.json`, lockfile, Prisma, src, e2e,
      `.env*`, playwright.config).
- [ ] Sin secrets ni deploy.
- [ ] Verificaciones locales en verde (los nueve comandos + `git diff --check`).
- [ ] Sin commit/push/PR (pendiente de revisión del Chat Director).
