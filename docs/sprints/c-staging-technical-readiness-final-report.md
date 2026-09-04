# Informe final — Fase C · STAGING TECHNICAL READINESS (ejecución local)

**Unidad:** `C — STAGING TECHNICAL READINESS`
**Tipo:** `PRE_STAGING_TECHNICAL_READINESS`
**Riesgo:** `LEVEL_3`
**Baseline:** `bd4608f7d349fdbcfbad33a6f4aa5e35803fde0b`
**Rama:** `feat/c-staging-technical-readiness` (sin commits)

> **Informe de ejecución LOCAL, no informe post-merge.** No existe commit, ni push, ni PR,
> ni CI de PR, ni merge. Nada de lo aquí descrito autoriza desplegar.

## 1. Objetivo

Preparar técnicamente un futuro entorno de staging **exclusivamente sintético**, de modo que
el eje `PRE_STAGING_TECHNICAL` pueda revisarse con evidencia real en lugar de con
afirmaciones.

## 2. Alcance ejecutado

Dos bloques, autorizados por separado por el Chat Director.

| Bloque | Contenido |
|---|---|
| 1 | C0 spec · C1 contrato de modo de datos y guarda de seed · C3 liveness/readiness · C4 guarda de arranque, guarda de registro, marcado de ofertas, marcador de entorno |
| 2 | C2 compose canónico + ensayo aislado · C5 modo externo de Playwright · C6 golden staging + persistencia · C7 contrato de migraciones y rollback · C8 reconciliación documental |

## 3. Ficheros

**Nuevos (13)**

```text
apps/api/src/config/synthetic-mode.ts (+ test)
apps/api/src/routes/ready.routes.ts (+ test)
apps/web/src/components/layout/synthetic-environment-banner.tsx (+ test)
apps/web/e2e/staging-golden.spec.ts
docker-compose.staging.rehearsal.yml
scripts/operations/staging/lib.sh
scripts/operations/staging/run-local-rehearsal.sh
docs/specs/features/staging-technical-readiness.md
docs/deployment/staging-local-rehearsal.md
docs/sprints/c-staging-technical-readiness-final-report.md
```

**Modificados (20)**

```text
docker-compose.staging.yml            contrato canónico
apps/web/Dockerfile                   build-arg NEXT_PUBLIC_JOBIT_DATA_MODE
apps/api/src/app.ts                   montaje de /ready
apps/api/src/server.ts                guarda de arranque
apps/api/src/lib/database-safety.ts   contrato de seed + guarda de arranque
apps/api/src/auth/auth.router.ts      guarda de registro sintético
apps/api/src/jobs/internal-seed.service.ts   marcado de las 14 ofertas
apps/web/src/app/layout.tsx           marcador global
apps/web/playwright.config.ts         modo externo
apps/web/e2e/helpers.ts               apiBase() + dominio sintético
apps/web/e2e/account-lifecycle.spec.ts       usa apiBase()
.env.staging.example                  JOBIT_DATA_MODE + NEXT_PUBLIC_JOBIT_DATA_MODE
scripts/operations/backup-restore/lib.sh     constante muerta 8 → 9
+ 5 ficheros de test y 6 documentos (ver §12)
```

## 4. Tests

```text
API   56 ficheros / 825 tests   PASS   (baseline fase B: 54 / 716)
Web   34 ficheros / 467 tests   PASS   (baseline fase B: 33 / 461)
```

Cobertura nueva relevante: matriz completa del contrato de modo de datos (arranque y seed),
producto cartesiano de 20 combinaciones que demuestra que `PRODUCTION` es inalcanzable para
el seed, marcado y convergencia del dataset, guarda de registro con casos de subdominio y
sufijo engañoso, readiness (200/503, sin fuga de detalle, sin logging), marcador web y
contratos de ambos composes.

## 5. Ensayo local aislado

`RUN_ID 20260904t135452z-ff5844f8` · duración 85 s.

```text
imágenes            postgres:16@sha256:5a65324f… · jobit-{api,web}:rehearsal-<RUN_ID>
orden               SOLO la base → migrate status → migrate deploy → migrate status → seed
                    → API → /ready 200 → Web
migrate deploy      9 migraciones · estado posterior "up to date"
seed                created=14 updated=0 total=14
health              DB healthy · /health 200 · /ready 200 · web 200
marcador sintético  presente EN EL BUNDLE de la imagen production-equivalent
```

La API y la Web **no arrancaron** antes del gate de migraciones: el harness lo comprueba
explícitamente, no por convención.

## 6. Golden E2E

```text
apps/web/e2e/staging-golden.spec.ts   identidad única e2e-golden-<n>@synthetic.jobit.invalid

run #1  PASS
run #2  PASS
User    0 → 0   (sin crecimiento neto tras dos ejecuciones)
```

Recorrido: registro → continuidad de sesión con recarga real → perfil, skill y proyecto →
avatar sintético → publicar portfolio → lectura pública → despublicar (404 verificado) →
republicar → ofertas (marcador `JobIT Synthetic ·` visible en listado y
`[SYNTHETIC TEST DATA]` en detalle) → guardar → verificar en guardadas → match → borrado de
cuenta → token previo 401 → refresh 401 → login 401 → portfolio público 404 → avatar 404.

**Límites de rate:** el recorrido consume **un** registro, así que cabe en
`AUTH_REGISTER_MAX=5/hora` sin tocar nada. No se elevó ningún límite y no se creó ninguna
variable para acomodar tests.

## 7. Persistencia

Verificación a nivel HTTP, con reinicio real del contenedor a mitad del recorrido (algo que
un navegador no puede orquestar):

```text
perfil + skill + avatar creados       avatar servido 200
docker compose restart rehearsal-api  /ready vuelve a 200
tras el reinicio                      perfil, skill y avatarUrl intactos · avatar 200
borrado de cuenta                     avatar 404
comprobación en el volumen            fichero AUSENTE
```

No se repitió el drill de backup/restore: ya está acreditado aparte y esto es verificación
de persistencia y reinicio, no de restauración.

## 8. Aislamiento

```text
recursos protegidos   jobit-staging-db-data · jobit-staging-api-uploads · jobit-postgres-test
snapshot antes/después  IDÉNTICOS
residuos con RUN_ID     containers 0 · volumes 0 · networks 0
```

Guardas JSR-01..JSR-10 activas: RUN_ID validado, project name del namespace del ensayo con
`jobit-staging` explícitamente prohibido, ningún recurso protegido nombrado en el compose,
base sin puerto, API y Web solo en loopback, credenciales sintéticas generadas por run,
imágenes etiquetadas por RUN_ID, modo sintético obligatorio y cleanup acotado sin `prune`.

## 9. Decisiones de seguridad

- **Llave única.** `JOBIT_DATA_MODE` gobierna arranque, seed, registro e interfaz. Se
  descartó una segunda llave: sería una fuente de verdad capaz de discrepar de la primera.
- **`PRODUCTION` inalcanzable.** Dos ramas independientes lo impiden en el seed, y la más
  específica se evalúa primero para que declarar el modo no abra ningún camino.
- **Fail-closed real.** Una base clasificada `STAGING` sin el modo **no arranca**; el
  compose canónico sin `.env` **falla** en vez de usar valores de relleno.
- **Sin puertos de host.** Ni la base, ni la API, ni la Web. Estructural, no configurable.
- **Imágenes inmutables.** `JOBIT_IMAGE_TAG` obligatorio; sin `build:` en el compose
  canónico, para que construir y ejecutar no puedan confundirse.
- **Readiness sin ruido.** `/ready` no cachea, no mantiene estado y **no escribe logs**: con
  la base caída, la sonda no inunda los registros.
- **Límites canónicos intactos.** `rate-limit.config.ts` y `.env.staging.example` no se
  tocaron para hacer pasar ningún test.

## 10. Privacidad

```text
PRIVACY_IMPACT: YES          LEGAL_REFERENCE_REQUIRED: YES
AFFECTED_SR: SR-02, SR-09, SR-11, SR-12, SR-13, SR-14, SR-15
LEGAL_ASSUMPTIONS_INTRODUCED: NONE
```

Alcance real de la protección, descrito sin exageración: bloquea el registro ordinario con
un correo real, identifica visiblemente el entorno y marca las ofertas. **No impide** que
alguien introduzca deliberadamente un nombre, una biografía, una experiencia o un avatar
reales una vez registrado. Gates conservados sin alteración:

```text
LEGAL_DECISION_GATE: OPEN      HUMAN_LEGAL_VALIDATION: PENDING
REAL_CANDIDATE_DATA: NOT_AUTHORIZED
PUBLIC_STAGING: NOT_AUTHORIZED      PRODUCTION: NOT_AUTHORIZED
```

## 11. Prisma y dependencias

```text
PRISMA_SCHEMA_CHANGE: NO      NEW_MIGRATION: NO
NEW_DEPENDENCY: NO            LOCKFILE_CHANGE: NO
```

## 12. Documentación reconciliada

Solo documentos **activos**; los informes históricos se conservan intactos.

```text
docs/decisions/ADR-0012-…                 sección de reconciliación; sin ADR nuevo
docs/deployment/staging-vps-deploy-runbook.md   §2 §6 §9 §10 §11 §12 §16 §19
docs/deployment/staging-env.md            modo de datos, compose fail-closed, checklist
docs/deployment/backup-restore-runbook.md 8 → 9 migraciones
docs/specs/features/backup-restore-verification.md   filas 3/4/5: 8 → 9
docs/specs/features/staging-technical-readiness.md   bloques 1 y 2 implementados
docs/product/current-project-state.md     estado factual de la unidad C
scripts/operations/backup-restore/lib.sh  constante muerta 8 → 9 (una línea)

NO MODIFICADOS (histórico verdadero en su fecha):
docs/sprints/sprint-20-4-docker-smoke-result.md   ("8 migraciones" era correcto entonces)
docs/sprints/b-candidate-first-functional-closure-final-report.md
docs/audits/global/global-review-plus-findings-ledger.md
```

La corrección se hizo por **rutas dirigidas**, no por `grep` global: reescribir un informe
histórico para que parezca actual falsearía el registro.

## 13. Deuda residual

- **Validación runtime de `TRUST_PROXY_HOPS`** contra la topología NPM real: fase de deploy.
- **TLS y NPM**: no tocados; el riesgo residual que ADR-0012 declaraba sigue vigente.
- **Limitación del clasificador**: una base de staging sin el token `staging` clasificaría
  `UNKNOWN` y el guard no exigiría el modo. Mitigada por plantilla y test de contrato, no
  eliminada.
- **Carrera `P2002`** en `getOrCreatePortfolioSettings`: `OUT_OF_SCOPE`. No se reprodujo en
  el ensayo con imágenes de producción ni bloqueó ningún recorrido.
- **Imágenes del ensayo** en la caché local, etiquetadas por RUN_ID. No son estado
  compartido; el comando de limpieza está en el runbook del ensayo.
- **Backups operativos de staging**, retención, almacenamiento fuera de host y cifrado:
  `PRE_PRODUCTION_TECHNICAL`.

## 14. Integración pendiente

```text
COMMIT: NOT_AUTHORIZED     PUSH: NOT_AUTHORIZED
PR:     NOT_AUTHORIZED     CI de PR: no ejecutado
MERGE:  NOT_AUTHORIZED

PRE_STAGING_TECHNICAL: PENDING_REPOSITORY_INTEGRATION
```

## 15. Estado

```text
BLOCK_1: IMPLEMENTED       BLOCK_2: IMPLEMENTED
LOCAL_TECHNICAL_GATE: PASS
LOCAL_REHEARSAL: PASS      GOLDEN_STAGING: PASS      PERSISTENCE: PASS
PROTECTED_RESOURCES: UNCHANGED

STAGING_DEPLOY: NOT_AUTHORIZED
```
