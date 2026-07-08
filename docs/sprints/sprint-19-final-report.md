# Informe final — Sprint 19

## 1. Sprint o tarea

Sprint 19 — CI quality gates y gobernanza de merges, con sus subfases:

- **Sprint 19**: CI básico API/Web (`JobIT CI`).
- **Sprint 19D / 19D.1**: sincronización documental tras el CI.
- **Sprint 19E**: branch protection / required checks en `dev`.
- **Sprint 19B**: workflow E2E manual (`JobIT E2E (manual)`), incluido el fix 19B.4 y la
  validación 19B.5.

Ramas utilizadas (todas desde `dev`, todas mergeadas vía PR):
`feat/sprint-19-ci-quality-gates`, `chore/sprint-19-docs-finalization`,
`feat/sprint-19b-e2e-manual-workflow`, `fix/sprint-19b-e2e-web-port`. Este informe se
entrega en `docs/sprint-19-final-report`.

## 2. Objetivo inicial

Convertir las verificaciones manuales de cierre de sprint en quality gates automáticos de
GitHub Actions para cada PR (API y Web por separado), decidir una estrategia segura para el
E2E de Playwright en CI (manual, no bloqueante) y convertir la norma documental "las PR
hacia `dev` deben pasar CI" en regla técnica real de GitHub. Sin deploy, sin secrets y sin
tocar código funcional.

## 3. Resumen ejecutivo

Todo el arco se completó y validó en verde. JobIT tiene ahora: CI automático en cada PR
(typecheck/test/build de API con PostgreSQL real; lint/typecheck/test/build de Web),
branch protection en `dev` que exige esos dos checks, documentación principal sincronizada,
y un workflow E2E manual que monta el stack completo efímero en Actions y ejecuta el smoke
de Playwright bajo demanda. La única incidencia (colisión de puerto por `PORT` global) se
diagnosticó con los artifacts del propio workflow y se corrigió con un fix de 2 líneas.
Validación final: run manual E2E en success con **7/7 tests Playwright** en ~1m44s.

**Sprint 19: PASS. Sprint 19B: PASS.**

## 4. Trabajo realizado

1. **Plan Mode 19**: auditoría del monorepo (sin `.github/`, scripts disponibles, requisitos
   de Postgres/Prisma en CI, variables dummy) y diseño del CI mínimo por fases.
2. **19.0–19.2 (PR #75)**: spec SDD del CI, plan documental y workflow `JobIT CI` con jobs
   `api` y `web`; verificación local completa previa (API 399/399, Web 291/291, builds).
3. **19D/19D.1 (PR #76)**: README, AGENTS, operating-environment y MVP scope actualizados al
   estado real post-CI.
4. **19E**: branch protection aplicada por API de GitHub a `dev` (auditoría previa: sin
   reglas ni rulesets preexistentes; repo público; permiso ADMIN).
5. **Plan Mode 19B**: viabilidad del E2E manual sin tocar archivos de runtime (clave:
   `reuseExistingServer: true`).
6. **19B.0/19B.1 (PR #77)**: workflow `JobIT E2E (manual)` + plan documental + ajuste mínimo
   de la spec de CI.
7. **19B.3**: primera run manual → fallo diagnosticado con artifacts (`server-logs`).
8. **19B.4 (PR #78)**: fix mínimo del scoping de `PORT`.
9. **19B.5**: re-ejecución manual en success, 7/7 tests.

## 5. PRs y merges

| PR | Rama | Contenido | Resultado CI |
|---|---|---|---|
| [#75](https://github.com/David-LS-Bilbao/JobIT-platform/pull/75) | `feat/sprint-19-ci-quality-gates` | CI básico API/Web + spec + plan | ✅ 1ª run real de `JobIT CI` en verde |
| [#76](https://github.com/David-LS-Bilbao/JobIT-platform/pull/76) | `chore/sprint-19-docs-finalization` | Sincronización documental | ✅ 2ª run en verde |
| [#77](https://github.com/David-LS-Bilbao/JobIT-platform/pull/77) | `feat/sprint-19b-e2e-manual-workflow` | Workflow E2E manual + docs | ✅ 3ª run; `mergeState` BLOCKED→CLEAN validó la protección |
| [#78](https://github.com/David-LS-Bilbao/JobIT-platform/pull/78) | `fix/sprint-19b-e2e-web-port` | Fix scoping `PORT` | ✅ 4ª run en verde |

Todos los merges hacia `dev` se hicieron desde la UI de GitHub (nunca por CLI), con commits
sin `Co-Authored-By`, conforme a `docs/agents/git-pr-skill.md`.

## 6. Archivos modificados

- **PR #75 (nuevos)**: `.github/workflows/ci.yml`,
  `docs/specs/features/ci-quality-gates.md`,
  `docs/sprints/sprint-19-ci-quality-gates-plan.md`.
- **PR #76 (modificados)**: `README.md`, `AGENTS.md`,
  `docs/agents/operating-environment.md`, `docs/specs/00-mvp-scope.md` (+51/−5).
- **PR #77**: `.github/workflows/e2e.yml` (nuevo),
  `docs/sprints/sprint-19b-e2e-manual-workflow-plan.md` (nuevo),
  `docs/specs/features/ci-quality-gates.md` (sección Estrategia E2E, +13/−6).
- **PR #78**: `.github/workflows/e2e.yml` (+7/−4).
- **Sprint 19E**: cero archivos (configuración de GitHub vía API, no versionable).
- **Este cierre**: `docs/sprints/sprint-19-final-report.md`.

## 7. CI quality gates API/Web

Workflow **`JobIT CI`** (`.github/workflows/ci.yml`): triggers `pull_request` → `dev`/`main`,
`push` → `dev` y `workflow_dispatch`; `concurrency` con cancelación de runs obsoletas; Node
20 fijado; pnpm resuelto desde `packageManager`; `pnpm install --frozen-lockfile`.

- **Job `api`** (timeout 20 min): service `postgres:16` con healthcheck; `prisma generate`
  explícito (no hay `postinstall`); typecheck; suite de integración real (la migración la
  hace el `globalSetup` de Vitest contra `DATABASE_URL_TEST` dummy); build. Duración real
  en runner: ~2m45s–3m05s.
- **Job `web`** (timeout 15 min): lint, typecheck, tests RTL (APIs mockeadas) y build de
  Next con `NEXT_PUBLIC_API_BASE_URL` dummy. Duración real: ~1m10s–1m15s.

Sin GitHub Secrets: solo variables dummy. Historial: 4/4 runs en verde (PRs #75–#78).

## 8. Branch protection / required checks

Aplicada a **`dev`** vía API REST (Sprint 19E), tras auditar que no existían reglas ni
rulesets previos:

- PR obligatoria antes de merge (aprobaciones requeridas: 0 — repo personal).
- Required checks: **`API (typecheck + test + build)`** y
  **`Web (lint + typecheck + test + build)`**.
- Require branch up to date (strict): desactivado.
- Conversation resolution: activada.
- Force pushes: bloqueados. Borrado de rama: bloqueado.
- `enforce_admins`: **desactivado** como escape hatch personal (decisión registrada;
  activable con un flag si se quiere disciplina estricta).
- `main`: **intacta** (sigue sin protección; candidata a regla similar en tarea futura).

Validación práctica: en la PR #77 el `mergeStateStatus` fue `BLOCKED` mientras corrían los
checks y pasó a `CLEAN` al completarse.

## 9. E2E manual workflow

Workflow **`JobIT E2E (manual)`** (`.github/workflows/e2e.yml`): trigger **único**
`workflow_dispatch` (sin `pull_request`, `push` ni `schedule`); **no es required check**.
Monta el stack completo efímero en el runner: service `postgres:16` → `prisma generate` →
`prisma migrate deploy` explícito → seed (`tsx prisma/seed.ts`) → build API → API en
background (`node dist/server.js`, `NODE_ENV=production` y `PORT=4000` scopeados al step) →
espera de `/health` → build web → `next start` en background → espera de `:3000` →
`playwright install chromium --with-deps` → `pnpm --filter @jobit/web test:e2e`. Traces de
Playwright y logs de servidores como artifacts **solo en fallo**. Variables 100% dummy.

Clave del diseño: el `reuseExistingServer: true` ya existente en
`apps/web/playwright.config.ts` permitió que Playwright reutilizara los servidores del
workflow **sin tocar el config**. Lanzamiento: `gh workflow run e2e.yml --ref dev` (la rama
por defecto del repo es `dev`, así que también aparece en la UI de Actions).

## 10. Incidencia detectada y corrección

- **19B.3 — primera run manual (28959177676): FAILURE** en el step
  `Esperar web (http://localhost:3000)`.
- **Causa raíz** (diagnosticada con el artifact `server-logs`): `PORT=4000` estaba en el
  `env` global del job; `next start` respeta esa variable e intentó escuchar en `:4000`, ya
  ocupado por la API → `Error: listen EADDRINUSE: address already in use :::4000`. En local
  nunca ocurrió porque `PORT` vive solo en `apps/api/.env`.
- **Fix (PR #78, +7/−4)**: quitar `PORT: 4000` del `env` global y definirlo solo en el step
  `Arrancar API en background` (junto a `NODE_ENV: production`, scopeada por el mismo
  motivo); comentario del workflow actualizado para documentar ambas exclusiones.
- Sin reintentos a ciegas: el fallo se analizó antes de tocar nada, y el diseño de
  artifacts-en-fallo demostró su valor en su primer uso real.

## 11. Validaciones locales

Previas a la PR #75, en el clon canónico (`/home/david/projects/JobIT-platform`):

| Verificación | Resultado |
|---|---|
| `pnpm --filter @jobit/api exec prisma generate` | ✅ |
| `pnpm --filter @jobit/api typecheck` / `test` / `build` | ✅ / ✅ 399/399 (226 s) / ✅ |
| `pnpm --filter @jobit/web lint` / `typecheck` / `test` / `build` | ✅ / ✅ / ✅ 291/291 / ✅ 13/13 rutas |
| `git diff --check` (en cada fase) | ✅ |

El build web se hizo con el protocolo dev-server (parar `next dev`, build, relanzar). Los
YAML se validaron localmente con parser antes de cada push. Las fases documentales (19D,
19D.1, este informe) no ejecutaron suites por no tener superficie de runtime.

## 12. Validaciones remotas

- `JobIT CI`: 4/4 runs en verde (PRs #75, #76, #77, #78), tiempos estables (~3 min API,
  ~1m15s web).
- Branch protection verificada con GET independiente tras aplicarla y validada en la
  práctica (BLOCKED→CLEAN en PR #77).
- `JobIT E2E (manual)`: run 28959177676 failure (diagnóstico) → run
  **[28961059235](https://github.com/David-LS-Bilbao/JobIT-platform/actions/runs/28961059235)**
  **success**: `Running 7 tests using 1 worker` → **`7 passed (6.9s)`**, job completo
  ~1m44s, sin artifacts (no hubo fallo).

## 13. Decisiones técnicas

- Un workflow CI con dos jobs paralelos e independientes (checks separados por capa).
- pnpm desde `packageManager` (una sola fuente de verdad); Node 20 fijado en workflows.
- `prisma generate` como paso explícito; migración vía `globalSetup` en CI y vía
  `migrate deploy` explícito en E2E.
- E2E contra build de producción (`next build && next start`): sin compilación on-demand,
  menos flakiness — validado en 19B.5 (los tests se escribieron contra `next dev` y pasaron
  igual contra `next start`).
- `NODE_ENV=production` y `PORT` scopeados al step de arranque de la API: a nivel de job,
  el primero rompe `pnpm install` (omite devDependencies) y el segundo desvía `next start`.
- `retries: 0` y `workers: 1` se mantienen (señal honesta de estabilidad); artifacts solo en
  fallo.

## 14. Decisiones de gobernanza

- Las PR hacia `dev` requieren los dos checks de `JobIT CI` (regla técnica, ya no solo
  documental).
- Aprobaciones requeridas: 0 (repo personal unipersonal; subir a 1 bloquearía el flujo).
- `enforce_admins` desactivado: protección contra descuidos, con escape hatch deliberado.
- **El E2E manual NO es required check** y debe usarse voluntariamente en PRs relevantes
  durante 2–3 sprints antes de plantear su promoción (primero a check automático no
  bloqueante; solo después, candidato a required). Cada salto es decisión explícita del
  operador.
- Merges siempre desde la UI de GitHub; commits sin `Co-Authored-By` ni menciones a IA.

## 15. Fuera de alcance respetado

- ✅ Sin deploy (Docker/VPS/staging siguen pendientes).
- ✅ Sin secrets: todas las variables de CI/E2E son dummies documentadas.
- ✅ Sin cambios en código funcional (`apps/*/src/**` intacto todo el sprint).
- ✅ Sin cambios en `apps/web/playwright.config.ts` ni en los tests E2E.
- ✅ Sin cambios en `package.json`, `pnpm-lock.yaml`, Prisma ni seed.
- ✅ E2E no añadido como required check ni a triggers de PR/push.
- ✅ `main` sin tocar; sin environments, merge queue ni required deployments.

## 16. Riesgos pendientes

- Historial E2E en CI corto (1/1 verde): insuficiente aún para promoción; construir
  historial con uso voluntario.
- Deprecación de Node 20 en runners de Actions: `pnpm/action-setup@v4` y
  `actions/upload-artifact@v4` funcionan hoy forzadas a Node 24; chore futuro de bump.
- Renombrar los jobs del CI rompería los required checks (la regla referencia los nombres
  exactos): cualquier renombrado debe ir acompañado de actualización de la protección.
- `main` sin protección; `strict` (up-to-date) desactivado en `dev` — reevaluar si aparecen
  regresiones por integración cruzada.

## 17. Pendiente recomendado

- Uso voluntario del E2E manual en PRs relevantes (construcción de historial).
- Chore de bump de versiones de actions (Node 20 deprecado).
- Valorar protección de `main` y, más adelante, `.nvmrc`/`engines` para fijar Node también
  en local.
- Purga opcional de deuda heredada del Sprint 18 (hex de Profile, simetría del journey
  18.3) cuando toque.

## 18. Estado final

**Sprint 19: PASS. Sprint 19B: PASS.** CI automático con 4/4 runs verdes, branch protection
activa y validada, documentación sincronizada, E2E manual operativo con 7/7 tests en verde
sobre stack efímero. Sin deploy, sin secrets, sin código funcional tocado.

## 19. Recomendación de siguiente sprint

**Sprint 20 — Deploy dev/staging readiness.** Preparar (sin producción real todavía, salvo
autorización posterior):

- Estrategia Docker para dev/staging (imágenes de API y web, compose o equivalente).
- Target de VPS y acceso.
- Nginx / reverse proxy (y decisión sobre Nginx Proxy Manager).
- PostgreSQL de staging (separada de dev/test locales).
- Mapa de variables de entorno por entorno (sin valores reales en el repo).
- HTTPS y ajuste de cookies cross-site para staging (pendiente desde el Sprint 08).
- Protocolo de deploy documentado (quién, cuándo, cómo se revierte).

Como todo lo anterior: empezar con spec SDD + plan por fases pequeñas antes de tocar
infraestructura.
