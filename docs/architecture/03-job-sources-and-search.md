# Fuentes de ofertas y búsqueda

## Propósito

Esta nota describe la procedencia de las ofertas, la búsqueda por ubicación y el
patrón implementado para agregar proveedores sin acoplarlos a las requests del
candidato. Complementa las specs
[`jobs.md`](../specs/features/jobs.md),
[`jobs-api-visibility.md`](../specs/features/jobs-api-visibility.md) y
[`job-sources-aggregation.md`](../specs/features/job-sources-aggregation.md).

## Modelo de procedencia

Cada `Job` guarda `source` y, cuando procede, `sourceUrl`, `externalId` e
`ingestedAt`. El contrato público:

- expone `source` y `sourceUrl`;
- oculta `externalId` e `ingestedAt`;
- se reutiliza en Jobs, Saved Jobs, Match y Dashboard.

| `source` | Estado actual | Comportamiento |
|---|---|---|
| `INTERNAL` | Activo para dataset controlado de desarrollo | Ofertas sintéticas sin inscripción. No representa aún publicación empresarial. |
| `JOOBLE` | Provider e ingesta activos | Requiere API key backend-only; la candidatura ocurre en el origen. |
| `GREENHOUSE` | Provider e ingesta activos | Usa Job Board API pública y una lista versionada de empresas curadas. |
| `ADZUNA` | Reserva de modelo | Existe en el enum y una migración, pero no hay client, ingesta ni filtro público. |

El filtro backend `source` acepta actualmente `INTERNAL`, `JOOBLE` y `GREENHOUSE`.
La UI del candidato no obliga a elegir proveedor.

## Búsqueda por ubicación

`GET /api/jobs` opera sobre ofertas persistidas y admite:

- `q`, sobre título y descripción;
- `location`, parcial e insensible a mayúsculas;
- `remote`;
- `seniority`;
- `contractType`;
- `source`;
- `tags`;
- `page` y `limit`.

La UI prioriza ubicación y criterios laborales. Con varias fuentes, el candidato
debe buscar una oportunidad, no elegir el portal que la suministra.

Existe deuda conocida en sinónimos geográficos y lenguas cooficiales, por ejemplo
`Vizcaya`/`Bizkaia` o `País Vasco`/`Euskadi`. No hay normalización de ubicaciones
implementada.

## Patrón de provider

Jooble y Greenhouse comparten la separación:

1. **Client:** obtiene y valida el payload externo. Configuración y dependencias se
   inyectan para que los tests no usen red.
2. **Normalizer:** convierte registros válidos a un DTO interno común y descarta
   entradas inválidas sin exponer el payload crudo.
3. **Ingest service:** persiste con upsert idempotente por `(source, externalId)`.
4. **Script:** dispara la ingesta manual desde backend, fuera de routers y requests.
5. **Lectura:** la API sirve la base local mediante `JobPublicDto`.

Una futura API o fuente RSS debería seguir el mismo patrón y requerir una ampliación
del enum, spec y tests explícitos. La presencia de `ADZUNA` en el enum no autoriza a
implementar ese provider.

## Jooble

Configuración:

- `JOOBLE_API_KEY`: secreta y solo backend.
- `JOOBLE_API_BASE_URL`: opcional; por defecto `https://jooble.org/api`. Algunas
  claves requieren un host regional.
- `ING_KEYWORDS`, `ING_LOCATION`, `ING_LOCATIONS` e `ING_LIMIT`: parámetros
  operativos de scripts.

Comandos:

```bash
JOOBLE_API_KEY=<KEY> ING_LOCATION=Bilbao \
  pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-jooble.ts

JOOBLE_API_KEY=<KEY> \
  ING_LOCATIONS="Bilbao,Madrid,Barcelona,Remoto,España" \
  ING_LIMIT=20 \
  pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-jooble-locations.ts
```

No pegues la clave en documentación, logs, chats o PR. Los ejemplos muestran
placeholders, no valores reales.

## Greenhouse

La Job Board API es pública y no necesita API key. La lista pequeña de
`boardToken -> company` vive en
`apps/api/src/jobs/external/greenhouse/greenhouse.companies.ts` para ser revisable.

Configuración:

- `GREENHOUSE_API_BASE_URL`: opcional; por defecto el endpoint público documentado.
- `ING_GREENHOUSE_TOKENS`: subset opcional de la lista curada.
- `ING_LIMIT`: límite por board.

Comando:

```bash
ING_GREENHOUSE_TOKENS=vercel ING_LIMIT=3 \
  pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-greenhouse.ts
```

Si la selección no contiene boards curados, el script aborta antes de hacer llamadas.
Añadir empresas exige revisar procedencia, términos, calidad y riesgo reputacional.

## Seguridad y operación

- No hay scraping.
- No hay ingesta programada ni endpoint administrativo.
- No se llama a proveedores durante `GET /api/jobs`.
- Los tests usan fixtures e inyección de dependencias, no red ni credenciales reales.
- Los enlaces externos se muestran solo para URLs `http`/`https` válidas y se abren
  con `noopener noreferrer`.
- Los scripts no deben imprimir secretos.
- El seed interno conserva ofertas `JOOBLE` y `GREENHOUSE`.

## Límites y decisiones futuras

Fuera del estado actual:

- scheduler/cron o cola de ingestas;
- deduplicación semántica entre proveedores;
- ranking multi-fuente avanzado;
- normalización geográfica;
- búsqueda que dispara consultas externas en vivo;
- provider ADZUNA;
- publicación empresarial y candidatura interna.

Cada ampliación debe evaluar rate limits, términos del proveedor, privacidad,
observabilidad, reintentos, deduplicación y retirada de datos.
