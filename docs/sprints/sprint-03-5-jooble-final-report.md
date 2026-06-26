# Informe final — Sprint 03.5 Jooble

## Sprint o tarea

Sprint 03.5 — Integración backend-only de ofertas externas **Jooble**.

## Objetivo inicial

Preparar la integración de Jooble como **única fuente externa** de ofertas para el módulo Jobs, de forma **segura, manual y backend-only**: sin exponer endpoints nuevos al candidato, sin scraping y sin automatización (cron/n8n/scheduler). El objetivo de implementación era validar, por capas y con TDD, el **cliente HTTP**, el **schema** del payload, el **normalizador puro**, el **servicio de ingesta** idempotente con **provenance**, y un **script manual** de ejecución controlada, culminando en una **ingesta real end-to-end** verificada.

## Alcance

- **Cliente HTTP de Jooble** (`searchJoobleJobs`) con manejo de errores tipados y timeout; la API key viaja solo server-side y nunca se loguea.
- **Schema Zod** del payload (`joobleSearchResponseSchema` / `joobleJobSchema`).
- **Normalizador puro** (`normalizeJoobleJob`): payload validado → DTO interno, sin red/Prisma/env/fs.
- **Servicio de ingesta** (`ingestJoobleJobs`): normaliza, descarta inválidos sin abortar, persiste con **upsert idempotente** por `(source, externalId)`.
- **Provenance** de ofertas externas: `source = "JOOBLE"`, `externalId`, `sourceUrl`, `ingestedAt`.
- **Script manual** backend-only (`apps/api/scripts/ingest-jooble.ts`), ejecutable con `tsx`.
- **Tests** (schema, normalizer, client, ingest service) y fixtures sintéticos.
- **Validación real controlada** end-to-end contra la API de Jooble.

## Fuera de alcance

- Frontend (`apps/web` no se toca).
- Endpoints públicos nuevos.
- Cron / scheduler / n8n / automatización recurrente.
- Matching avanzado con IA.
- Consumo masivo de APIs externas u otras fuentes distintas de Jooble.
- Producción / deploy.
- Monetización.
- Recruiter / ATS.

## Trabajo realizado

Organizado por fases:

### Fase 4 / PR #19 — Base de integración + provenance + ingesta

Modelo `Job` extendido con campos de provenance (`source`, `externalId`, `sourceUrl`, `ingestedAt`) y su migración; **cliente HTTP** de Jooble y **servicio de ingesta** idempotente con sus tests (cliente inyectable, sin red en tests). Mergeado en `dev` (`a0d973a`). *(El contrato Zod, el DTO/types y el normalizador puro se establecieron en las fases previas de Fase 2/2E, también ya en `dev`.)*

### Fase 5A / PR #20 — Script manual backend-only

`apps/api/scripts/ingest-jooble.ts`: parseo CLI sin dependencias externas (`--keywords`, `--location`, `--page`, `--limit`, `--help`), uso de `ingestJoobleJobs`, impresión de parámetros y resumen, manejo seguro de errores, `process.exitCode` (no `process.exit()`) y cierre `await prisma.$disconnect()`. Sin endpoints/frontend/cron, sin `package.json`/lockfiles/Prisma. Mergeado en `dev` (`a3398fb`).

### Fase 5B — Diagnóstico de la ejecución real

Validación de infra local/dev y primeras ejecuciones reales; detección de dos bloqueos externos consecutivos: **API key rechazada (403)** y, tras corregir la key, **mismatch de contrato** (`JoobleResponseError`).

### Fase 5C — Fix del contrato real (PR #21)

Diagnóstico structure-only del payload real, RED tests, fix mínimo del schema (`id` numérico → string) y GREEN, commit, push y merge en `dev` (`d5cc2bd`).

### Fase 5D — Validación end-to-end

Ingesta real controlada **exitosa** con la key válida y el fix mergeado: 5 ofertas Jooble persistidas con provenance completo.

## PRs y commits

| PR | Título | Commit principal | Merge commit | Resumen |
|---|---|---|---|---|
| #19 | base integración Jooble / provenance + ingesta | — | `a0d973a` | Provenance en `Job` (`source`/`externalId`/`sourceUrl`/`ingestedAt`), cliente HTTP y servicio de ingesta idempotente con tests |
| #20 | `feat(jobs): add manual Jooble ingestion script` | `a4139d2` | `a3398fb` | Script manual backend-only `apps/api/scripts/ingest-jooble.ts`; sin endpoints/cron/frontend/manifests |
| #21 | `fix(jobs): accept numeric Jooble job ids` | `b8b4b3f` | `d5cc2bd` | `id: z.string()` → `z.union([z.string(), z.number()]).transform(String)`; solo schema + test |

## Archivos principales

- `apps/api/src/jobs/external/jooble/jooble.client.ts`
- `apps/api/src/jobs/external/jooble/jooble.schemas.ts`
- `apps/api/src/jobs/external/jooble/jooble.normalizer.ts`
- `apps/api/src/jobs/external/jooble/jooble.ingest.service.ts`
- `apps/api/scripts/ingest-jooble.ts`
- `apps/api/src/jobs/external/jooble/jooble.schemas.test.ts`
- `apps/api/src/jobs/external/jooble/jooble.client.test.ts`
- `apps/api/src/jobs/external/jooble/jooble.normalizer.test.ts`
- `apps/api/src/jobs/external/jooble/jooble.ingest.service.test.ts`
- `docs/specs/features/external-jobs-jooble.md`
- `docs/decisions/ADR-0011-jooble-external-jobs-integration.md`
- `docs/sprints/sprint-03-5-jooble-phase-4-tdd-plan.md`

## Validaciones y resultados

- **Tests offline:** schema **10/10**, conjunto Jooble offline (schemas + normalizer + client) **29/29** (ejecutados sin `globalSetup`/DB).
- **Typecheck:** `pnpm --filter @jobit/api typecheck` → **PASS** (0 errores).
- **Validaciones CLI del script:** `--help` → exit 0; argumentos inválidos (sin keywords, argumento desconocido, keywords vacío, `--limit 0`, `--limit 101`) → exit 2, **antes** de llamar al servicio.
- **Migraciones:** `prisma migrate deploy` → 4 migraciones aplicadas, sin pendientes.
- **Status-only (key):** key inicial → 403 (`text/html`); key nueva → **200** (`application/json`).
- **Structure-only (contrato):** root `{ totalCount: number, jobs: array }`, job con las 10 claves esperadas, único mismatch `id: number`.
- **Ingesta final real:** **exitosa** (ver siguiente sección).

## Resultado final end-to-end (Fase 5D.1)

Comando (ejecución **única**):

```bash
pnpm --filter @jobit/api exec tsx scripts/ingest-jooble.ts --keywords "node" --location "Madrid" --page 1 --limit 5
```

Resultado:

- **fetched:** 5
- **normalized:** 5
- **skipped:** 0
- **created:** 5
- **updated:** 0
- **exit code:** 0
- **beforeJoobleCount:** 0
- **afterJoobleCount:** 5
- **diferencia:** **+5**

Muestras persistidas (3): `source = JOOBLE`, con `externalId`, `sourceUrl` e `ingestedAt` **presentes** en todas.

## Incidencias encontradas

1. **Postgres local inicialmente no disponible** (`localhost:5432` cerrado): los gates detuvieron la ejecución sin llamar a Jooble.
2. **`DATABASE_URL` placeholder**: el `.env` conservaba `user:password` de `.env.example` → `P1000` (autenticación) hasta ajustar credenciales/contenedor.
3. **API key Jooble inicial rechazada**: ingesta y status-only → **403** (`text/html`) = key inválida/no autorizada.
4. **Nueva key aceptada**: status-only → **200** (`application/json`).
5. **Mismatch real del payload**: `job.id` venía como **number**, pero `joobleSearchResponseSchema` exigía `string` → `JoobleResponseError`, 0 persistidas.
6. **Fix aplicado en PR #21**: `id` acepta string o number y se normaliza a string.

## Decisiones técnicas

- **Backend-only y manual**: nada se invoca desde routers ni desde el request del candidato.
- **Script manual antes que endpoint/cron**: ingesta controlada y observable; sin automatización en el MVP.
- **No exponer la API key**: vive solo en `env`/backend; nunca se imprime ni se loguea.
- **No imprimir la URL con la key** (la key viaja en el path; los errores solo muestran `status`).
- **Fix del `id`**: `z.union([z.string(), z.number()]).transform((v) => String(v))` — **no** se usó `z.coerce.string()` para no aceptar `null`/`undefined`.
- **Mantener `normalizer`/`types` sin cambios**: la salida inferida de `id` sigue siendo `string`, así que el normalizador y el DTO no requirieron tocarse.
- **No repetir llamadas reales** sin autorización explícita (una única ejecución por fase autorizada).
- **Persistencia con provenance** y **upsert idempotente** por `(source, externalId)`.
- **Sin IA avanzada para matching** en el MVP.

## Seguridad

- `JOOBLE_API_KEY` en variables de entorno (`.env`), leída solo en backend.
- `.env` está **gitignored** (la nueva key se cambió fuera del repo, sin imprimirse).
- **Sin logs de secretos** (ni key, ni `process.env`, ni `DATABASE_URL`).
- **Sin URLs con la key** en mensajes de error (solo `status`).
- **DB validada como local/dev** (`localhost` + `jobit_dev`, sin marcadores de producción) **antes** de cada ingesta.
- **Gating** estricto antes de cualquier llamada real (Postgres, env, local/dev, migraciones, fix presente).
- **Nunca producción**: solo `jobit_dev` local.
- **Manejo seguro de errores** (errores tipados con mensajes acotados).
- **Cierre `await prisma.$disconnect()`** en el script.

## Testing y verificaciones

- **Schema tests:** 10/10.
- **Jooble offline tests:** 29/29 (schemas + normalizer + client).
- **Typecheck:** PASS (0 errores).
- **Validación real final:** exit 0, 5 ofertas creadas.
- **No se ejecutaron tests destructivos de DB** contra `jobit_dev` (la suite de integración hace `TRUNCATE`).
- **`jooble.ingest.service.test.ts`** requiere DB de test/`globalSetup`; no se ejecutó offline (necesita `DATABASE_URL_TEST` aislado).

## Estado final

- `dev` **sincronizada** con `origin/dev`.
- Working tree **limpio**.
- **PR #21 mergeada** (`d5cc2bd`).
- Integración manual de Jooble **validada end-to-end**.
- **5 ofertas Jooble persistidas** en la DB local/dev `jobit_dev`.

## Pendiente

- **Idempotencia real (opcional):** repetir la misma ingesta debería dar `created: 0 / updated: 5` (confirmaría el upsert).
- **Política de actualización/refresco** de ofertas externas (cadencia, expiración/retirada).
- **Documentar el uso operativo** del script manual (cómo cargar env, ejecutar y verificar).
- **Evaluar la exposición** de ofertas externas en `GET /api/jobs` si el MVP lo requiere (ya conviven por el campo `source`).
- **Entorno de DB de test estable** (`DATABASE_URL_TEST`) para `jooble.ingest.service.test.ts`.
- **Futuro:** scheduler/cron/n8n quedan **fuera** del MVP inmediato.

## Recomendación para el orquestador

- **Cerrar el Sprint 03.5 como completado**: la integración Jooble está implementada, segura y validada en real.
- **No seguir haciendo llamadas reales** por ahora (cada una consume cuota y debe ir autorizada).
- **Pasar al siguiente sprint funcional**.
- **Planificar la exposición controlada** de ofertas externas solo si está recogida en spec.
- **Mantener Jooble como ingesta manual** hasta una nueva decisión.

## Prompt sugerido para continuar

```text
Elige UNA opción para la siguiente fase del Sprint 03.5/04 (Jooble):

Opción A — Documentación operativa del script:
  Crear docs/agents/ o docs/sprints/ una guía breve de uso de
  apps/api/scripts/ingest-jooble.ts (carga de env, ejecución, verificación
  en DB, manejo de errores). Solo documentación, sin código ni red.

Opción B — Exponer ofertas externas en la Jobs API:
  Spec + tests + implementación para que GET /api/jobs incluya ofertas
  source=JOOBLE junto a las internas (filtro/atribución), siguiendo SDD/TDD.
  Requiere spec aprobada antes de implementar.

Opción C — Idempotencia real (opcional):
  Una segunda ingesta real controlada con los mismos parámetros para
  confirmar created:0 / updated:5 (upsert por (source, externalId)).
  Requiere autorización (escribe en DB + llamada real).
```
