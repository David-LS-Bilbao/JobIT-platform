# Sprint 16F.1 — Greenhouse smoke plan

## Objetivo

Preparar un smoke real, manual y opcional del provider Greenhouse con una lista pequena de boards
publicos curados. Este documento no autoriza la ejecucion: cualquier smoke real requiere aprobacion
explicita del operador antes de lanzar el script.

## Precondiciones

- Ejecutar solo desde `/home/david/projects/JobIT-platform`.
- Usar DB de dev o staging autorizada; no usar la DB de test ni produccion.
- Confirmar que la rama y el working tree estan limpios.
- Revisar `GREENHOUSE_COMPANIES` antes de ejecutar.
- Confirmar que no hay secretos ni API keys: Greenhouse Job Board API es publico.
- Confirmar que no se hace scraping: solo se usa el Job Board API publico de Greenhouse.

## Empresas curadas

Lista inicial pequena, revisada el 2026-07-03 mediante board publico de Greenhouse:

| Company | Board token | Board publico |
| --- | --- | --- |
| Anthropic | `anthropic` | `https://boards.greenhouse.io/anthropic` |
| Vercel | `vercel` | `https://boards.greenhouse.io/vercel` |
| Webflow | `webflow` | `https://boards.greenhouse.io/webflow` |

## Comando previsto

Smoke minimo recomendado, con un solo board y limite bajo:

```bash
ING_GREENHOUSE_TOKENS=vercel ING_LIMIT=3 pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-greenhouse.ts
```

Para probar el subset completo curado, mantener un limite bajo:

```bash
ING_GREENHOUSE_TOKENS=anthropic,vercel,webflow ING_LIMIT=3 pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-greenhouse.ts
```

## Que se permite

- Un board individual o subset pequeno de `GREENHOUSE_COMPANIES`.
- `ING_LIMIT` bajo para reducir impacto.
- Upsert idempotente de ofertas `source=GREENHOUSE`.
- Documentar conteos antes/despues y resumen del script.

## Que esta prohibido

- Ejecutar sin autorizacion explicita.
- Ejecutar contra produccion.
- Ejecutar scraping.
- Usar secretos, API keys o credenciales externas.
- Borrar datos existentes.
- Anadir empresas no revisadas o tokens inventados.
- Aumentar la lista por encima de 5 empresas sin nuevo sprint/revision.

## Verificaciones antes

```bash
git status --short
pnpm --filter @jobit/api typecheck
pnpm --filter @jobit/api test
pnpm --filter @jobit/api build
```

Si se autoriza smoke contra DB dev/staging, registrar antes:

- entorno y base objetivo;
- `ING_GREENHOUSE_TOKENS`;
- `ING_LIMIT`;
- conteo actual de jobs `source=GREENHOUSE`.

## Verificaciones despues

- Revisar salida del script: boards procesados/fallidos, fetched, normalized, created, updated, skipped.
- Consultar conteo posterior de jobs `source=GREENHOUSE`.
- Verificar que no se expongan `externalId` ni `ingestedAt` en la API publica.
- Documentar cualquier fallo HTTP/rate limit como resultado de smoke, no como motivo para relajar controles.

## Rollback / limpieza

- No borrar datos automaticamente.
- Si el smoke se ejecuto contra DB dev/staging y hay que limpiar, hacerlo con una tarea explicita y revisada.
- Preferir rollback por entorno efimero o restauracion controlada de snapshot si aplica.

## Criterios PASS

- Smoke autorizado explicitamente.
- Solo board/subset curado.
- Sin secretos.
- Sin scraping.
- Sin borrado de datos.
- `ING_LIMIT` bajo aplicado.
- Script finaliza con resumen documentado.
- Conteos antes/despues registrados.
- API publica mantiene ocultos `externalId` e `ingestedAt`.
