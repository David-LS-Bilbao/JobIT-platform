# Informe final — Sprint 15F Jooble ingestion configurable

## Objetivo inicial

Corregir la deuda de Sprint 15E: la API key de Jooble usada en local es **regional**
(`https://es.jooble.org/api` funciona; el host global `https://jooble.org/api` devuelve
`403`), y el backend tenía el host **hardcodeado**. Este sprint hace el host configurable
por entorno, documenta cómo poblar ofertas reales y deja una **ingesta controlada** para
dev/staging. JobIT sigue buscando en su DB local; Jooble alimenta esa DB, no es proxy live.

## Alcance entregado

- `JOOBLE_API_BASE_URL` configurable por entorno (opcional, default compatible).
- Validación http/https + normalización (sin doble slash) + fail-fast ante valor inválido.
- Enhebrado de la base URL desde `env`/`deps` hasta el cliente Jooble.
- Endurecimiento del cliente (sin doble slash con cualquier base URL).
- Script de ingesta **controlado, backend-only y manual** para dev/staging.
- Tests de config, cliente e ingesta. Documentación (spec, `.env.example`, local-env,
  arquitectura, README) e informe final.

## Configuración añadida

| Variable | Obligatoria | Default | Notas |
|---|---|---|---|
| `JOOBLE_API_BASE_URL` | No | `https://jooble.org/api` | http/https; regional España `https://es.jooble.org/api`; se normaliza sin barra final. |

- `JOOBLE_API_KEY` sigue **fuera del repo** (solo `apps/api/.env`, ignorado por Git).
- **Decisión** ante valor inválido: **fail-fast** en el arranque (coherente con `parsePort`),
  preferible a ingerir contra un host equivocado. El valor no es secreto.

## Cambios backend

- `apps/api/src/config/env.ts`: `DEFAULT_JOOBLE_API_BASE_URL` + `parseJoobleBaseUrl()`
  (exportados) y `env.JOOBLE_API_BASE_URL`.
- `apps/api/src/jobs/external/jooble/jooble.client.ts`: normaliza la base (strip de barra
  final) al construir `base/{apiKey}`. Sigue sin leer `process.env` (deps inyectados); la
  key nunca aparece en errores.
- `apps/api/src/jobs/external/jooble/jooble.ingest.service.ts`: `JoobleIngestDeps.baseUrl`;
  usa `deps.baseUrl ?? env.JOOBLE_API_BASE_URL` y lo pasa al cliente.

## Script/comando de ingesta

- `apps/api/src/jobs/scripts/ingest-jooble.ts` (backend-only, manual; **sin endpoint**).
  Exige `JOOBLE_API_KEY`; parámetros por entorno (`ING_KEYWORDS`, `ING_LOCATION`,
  `ING_LIMIT` acotado 1..50). Imprime un resumen (keywords/location/fetched/created/
  updated/skipped) **sin la key**; no borra seed ni crea usuarios; upsert idempotente.

  ```bash
  JOOBLE_API_KEY=<KEY> JOOBLE_API_BASE_URL=https://es.jooble.org/api ING_LOCATION=Bilbao \
    pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-jooble.ts
  ```

## Tests añadidos/actualizados

- `apps/api/src/config/env.test.ts` (**nuevo**, 5): `parseJoobleBaseUrl` (default,
  regional https, normaliza barra final, rechaza no-http/https e inválida).
- `jooble.client.test.ts` (+3 → 9): usa default si no se inyecta base URL; usa regional
  sin doble slash; `403` → `JoobleHttpError` sin filtrar la key.
- `jooble.ingest.service.test.ts` (+2 → 7): enhebra `baseUrl` de `deps`; usa el default
  de `env` cuando no se pasa.
- Suite backend: **340 tests** en verde (36 archivos).

## Seguridad y secretos

- `JOOBLE_API_KEY`: solo en `apps/api/.env` (ignorado por Git); **no** commiteada, **no**
  logueada. Verificado que su valor no está en ningún archivo tracked.
- La key viaja solo servidor→Jooble (path de la URL); tests confirman que **no** aparece
  en errores (incluido `403`).
- El script no imprime la key; el error handler solo muestra tipo/mensaje.
- `403` (host/key regional no coincide) se trata como **fallo de proveedor**
  (`JoobleHttpError`), no como crash inseguro.

## Documentación actualizada

- Spec: `docs/specs/features/jooble-ingestion.md` (nueva).
- `apps/api/.env.example`: `JOOBLE_API_BASE_URL` + nota regional (sin key real).
- `docs/development/local-env.md`: sección Jooble (key, base URL, ejemplo España, cómo
  comprobar la key, no commitear `.env`, no pegar la key en logs).
- `docs/architecture/03-job-sources-and-search.md`: base URL configurable (deuda resuelta),
  ingesta controlada y estrategia por ubicación; sinónimos como deuda.
- `README.md`: mención breve de `JOOBLE_API_BASE_URL`.

## Fuera de alcance

- No se tocó `apps/web/**`, Prisma (schema/migrations), `package.json`, `pnpm-lock.yaml`,
  `.env`, `docker/**`, `.github/**`, auth, recruiter, monetización.
- Sin dependencias nuevas, sin scraping, sin LinkedIn API, sin candidatura interna, sin IA.
- Sin endpoint de ingesta, sin cron, sin motor de sinónimos (documentados como deuda).

## Verificaciones

Ejecutadas en el clon nativo de WSL (`/home/david/projects/JobIT-platform`), en verde:

- `pnpm --filter @jobit/api typecheck` → OK.
- `pnpm --filter @jobit/api test` → **340 tests OK** (36 archivos).
- `pnpm --filter @jobit/api build` → OK.
- `git diff --check` limpio; `git status --short` solo cambios de esta rama (sin `.env`).

(Frontend no tocado: no requiere verificaciones web.)

## Riesgos/deuda técnica

- **Orquestación de ingesta**: sigue manual (script). Falta un disparador programado
  (comando/cron/endpoint admin) para staging/prod.
- **Sinónimos de ubicación**: Vizcaya/Bizkaia, País Vasco/Euskadi… no normalizados.
- **Búsqueda live**: no se hace (por diseño); si se quisiera, requiere caché/rate limits.

## Recomendación para el chat director

- **Sprint 15F: COMPLETADO.** Host de Jooble configurable (`JOOBLE_API_BASE_URL`), ingesta
  controlada documentada y probada; backend verde (340). Sin tocar frontend/Prisma/deps.
- Con esto, una key regional (como la de dev) funciona sin parches: basta
  `JOOBLE_API_BASE_URL=https://es.jooble.org/api`.
- **Siguiente sprint recomendado**: orquestación de ingesta (comando/cron controlado por
  ubicación) o normalización mínima de sinónimos de ubicación; alternativamente, producto
  (ofertas INTERNAL publicadas por empresas).

## Prompt sugerido para continuar

> Sprint 15G — Orquestación de ingesta Jooble por ubicación (dev/staging).
> Objetivo: comando/cron controlado que ingiera por una lista de ubicaciones
> (Bilbao/Madrid/Barcelona/remoto/España) reutilizando `ingestJoobleJobs` y
> `JOOBLE_API_BASE_URL`, con resumen agregado y sin exponer la key. Sin endpoint público,
> sin scraping, sin nuevas dependencias pesadas. Spec previa + tests. Rama
> `feat/sprint-15g-jooble-ingestion-orchestration`. No commit/push/PR sin cierre.
