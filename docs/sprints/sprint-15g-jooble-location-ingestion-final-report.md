# Informe final — Sprint 15G Orquestación de ingesta Jooble por ubicación

## Objetivo inicial

Crear una forma **controlada y repetible** de poblar la DB con ofertas Jooble reales por
**varias ubicaciones objetivo** (Bilbao, Madrid, Barcelona, Remoto, España…), reutilizando
la config de Sprint 15F (`JOOBLE_API_KEY`, `JOOBLE_API_BASE_URL`, servicio de ingesta), con
un **resumen agregado** y sin endpoint público, sin scraping, sin LinkedIn, sin búsqueda
live. JobIT sigue buscando en su DB local.

## Alcance entregado

- Comando de orquestación multi-ubicación (backend-only, manual, **sin endpoint**).
- Parseo robusto de `ING_LOCATIONS` (CSV, trim, sin vacías, dedupe preservando orden).
- Ingesta **en serie** con **fallo parcial tolerado** y **resumen agregado**.
- Exit code por resultado (0 todo OK, 1 si alguna ubicación falló).
- Tests unitarios del parser y de la orquestación. Spec y docs ampliadas.

## Comando/orquestación

- Lógica pura y testeable: `apps/api/src/jobs/scripts/jooble-locations.ts`
  (`parseLocations`, `resolveKeywords`, `resolveLimit`, `orchestrateIngestion`). Sin efectos
  al importarse; la ingesta real se inyecta (testable sin red ni key).
- Runner: `apps/api/src/jobs/scripts/ingest-jooble-locations.ts` (lee entorno, orquesta,
  imprime resumen por ubicación + agregado, fija exit code).

Uso:

```bash
JOOBLE_API_KEY=<KEY> JOOBLE_API_BASE_URL=https://es.jooble.org/api \
  ING_LOCATIONS="Bilbao,Madrid,Barcelona,Remoto,España" ING_LIMIT=20 \
  pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-jooble-locations.ts
```

Variables (con defaults): `ING_LOCATIONS` (fallback `ING_LOCATION`, luego `España`),
`ING_KEYWORDS` (`developer`), `ING_LIMIT` (`20`, acotado 1..50, por ubicación).

## Cambios backend

- **Nuevos** (solo `apps/api/src/jobs/scripts/**`): `jooble-locations.ts` (lógica pura),
  `ingest-jooble-locations.ts` (runner), `jooble-locations.test.ts` (tests).
- **Reutiliza sin modificar**: `ingestJoobleJobs`, el cliente Jooble y `env.JOOBLE_API_BASE_URL`
  (15F). El script single-location de 15F (`ingest-jooble.ts`) **no** se toca.

## Tests añadidos/actualizados

- `apps/api/src/jobs/scripts/jooble-locations.test.ts` (**nuevo**, 11): `parseLocations`
  (CSV/trim/vacías/dedupe/fallback/default), `resolveKeywords`, `resolveLimit` (default,
  clamp 1..50, inválidos), `orchestrateIngestion` (una llamada por ubicación en serie,
  acumula totales, continúa ante fallo parcial y lo registra, pasa los params correctos).
- Suite backend: **37 archivos, 351 tests** en verde.

## Seguridad y secretos

- `JOOBLE_API_KEY` fuera del repo (solo `apps/api/.env`, gitignored); **nunca** se imprime
  (cabecera ni errores por ubicación). Verificado en el smoke (`grep` de la key → ausente).
- Errores por ubicación saneados (los errores del cliente ya excluyen la key).
- No se escriben archivos de salida; no se commitean datos de DB.

## Documentación actualizada

- `docs/specs/features/jooble-ingestion.md`: sección "Ingesta por múltiples ubicaciones"
  (variables, reglas de ejecución, formato de resumen, error parcial + exit code, seguridad).
- `apps/api/.env.example`: `ING_*` como ejemplos comentados (parámetros de script).
- `docs/development/local-env.md`: comando multi-ubicación.
- `docs/architecture/03-job-sources-and-search.md`: comandos single/multi y estrategia por ubicación.

## Fuera de alcance

- No se tocó `apps/web`, Prisma (schema/migrations), `package.json`, `pnpm-lock.yaml`,
  `.env`, `docker`, `.github`, auth, recruiter, monetización.
- Sin dependencias nuevas, sin scraping, sin LinkedIn API, sin candidatura interna, sin IA,
  **sin endpoint público de ingesta**, sin cron/programación automática, sin sinónimos.

## Verificaciones

Ejecutadas en el clon nativo de WSL (`/home/david/projects/JobIT-platform`), en verde:

- `pnpm --filter @jobit/api typecheck` → OK.
- `pnpm --filter @jobit/api test` → **351 tests OK** (37 archivos).
- `pnpm --filter @jobit/api build` → OK.
- `git diff --check` limpio; `git status --short` solo cambios de esta rama (sin `.env`).

(Frontend no tocado: no requiere verificaciones web.)

## Smoke local

`ING_LOCATIONS="Bilbao,Madrid" ING_LIMIT=3` contra el host regional:

```
[ingest-jooble-locations] keywords="developer" base="https://es.jooble.org/api" limit=3 locations=[Bilbao, Madrid]
  ✓ Bilbao: fetched=3 normalized=3 created=0 updated=3 skipped=0
  ✓ Madrid: fetched=3 normalized=3 created=1 updated=2 skipped=0
[ingest-jooble-locations] DONE locations=2 ok=2 failed=0 → fetched=6 normalized=6 created=1 updated=5 skipped=0
```

Exit `0`; la key **no** aparece en la salida. Datos locales de dev (upsert idempotente; se
pierden al reseedear; no commiteados).

## Riesgos/deuda técnica

- **Orquestación programada** (cron/endpoint admin): sigue fuera; hoy es manual.
- **Sinónimos de ubicación** (Vizcaya/Bizkaia, País Vasco/Euskadi…): documentado, no implementado.
- Sin caché ni rate-limit fino: la ejecución en serie mitiga el rate limiting básico.

## Recomendación para el chat director

- **Sprint 15G: COMPLETADO.** Comando multi-ubicación en serie con resumen agregado, fallo
  parcial tolerado y exit code; backend verde (351). Sin tocar frontend/Prisma/deps y sin
  endpoint. Smoke real OK.
- **Siguiente sprint recomendado**: (a) normalización mínima de sinónimos de ubicación con
  tests, o (b) orquestación programada (cron/endpoint admin con auth) si se decide, o (c)
  volver a producto (ofertas INTERNAL publicadas por empresas).

## Prompt sugerido para continuar

> Sprint 15H — Normalización mínima de sinónimos de ubicación (búsqueda).
> Objetivo: mapa pequeño y testeado (Vizcaya↔Bizkaia, País Vasco↔Euskadi, …) aplicado a la
> ingesta/búsqueda por ubicación, sin full-text ni Prisma. Spec previa + tests. Backend-only.
> Rama `feat/sprint-15h-location-synonyms`. No commit/push/PR sin cierre.
