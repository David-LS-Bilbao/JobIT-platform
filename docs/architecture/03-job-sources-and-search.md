# Fuentes de ofertas y búsqueda (arquitectura)

Nota de arquitectura sobre la **procedencia de las ofertas**, la **búsqueda por
ubicación** y cómo el sistema queda **preparado para incorporar más fuentes**
(APIs externas y RSS) sin reescribir el módulo Jobs. Complementa la spec funcional
`docs/specs/features/jobs.md` y la de visibilidad `jobs-api-visibility.md`.

## Modelo de fuentes (`Job.source`)

Cada oferta tiene una procedencia (`source`) y, si aplica, una URL de origen
(`sourceUrl`). El contrato público expone `source` y `sourceUrl` y **oculta** los
campos internos de ingesta (`externalId`, `ingestedAt`).

| `source` | Hoy | Dirección futura |
|---|---|---|
| `INTERNAL` | Ofertas seed/mock de ejemplo (sin `sourceUrl`). | **Ofertas publicadas por empresas en la propia web de JobIT.** Serán ofertas reales con candidatura gestionada dentro de JobIT (no un enlace externo). |
| `JOOBLE` | Ofertas ingeridas de la API de Jooble (con `sourceUrl` real). La inscripción ocurre en el origen (Jooble). | Igual, más fuentes externas del mismo tipo. |
| *(futuras)* | — | Nuevas APIs de empleo y **feeds RSS**, cada una como una `source` nueva del enum. |

Implicación de producto: cuando existan ofertas `INTERNAL` publicadas por empresas,
el copy actual de "oferta de ejemplo para el MVP" (detalle de oferta) deberá
diferenciarse de las ofertas internas reales, que tendrán candidatura propia. Hoy,
al ser todas seed, el aviso honesto es correcto.

## Búsqueda por ubicación (eje principal)

Las fuentes externas de empleo (Jooble y las que vendrán) buscan **por ubicación**.
Por eso la búsqueda de JobIT se alinea con ese eje:

- `GET /api/jobs` acepta `location` (búsqueda parcial, insensible a mayúsculas, sobre
  `Job.location`), además de `q` (texto en título/descripción) y los filtros
  estructurales (`remote`, `seniority`, `contractType`, `tags`).
- En la UI de `/jobs`, el antiguo **selector de "Fuente" se sustituyó por un campo de
  "Ubicación"**. El motivo: con varias fuentes activas, el usuario no debería elegir
  "de qué portal" busca; buscará por sus parámetros (ubicación, rol, etc.) y el
  sistema devolverá resultados de **todas las fuentes disponibles**.
- El parámetro `source` **sigue existiendo** en el contrato del backend (útil para
  depuración/administración), pero ya no se expone como filtro en la UI del candidato.

## Preparado para más fuentes (APIs y RSS)

El módulo Jooble (`apps/api/src/jobs/external/jooble/`) es el **patrón de referencia**
para añadir una fuente nueva sin tocar el resto del sistema:

1. **Client** (`*.client.ts`): obtiene y valida la forma cruda de la fuente. La
   configuración (API key, base URL, timeout) se inyecta por `deps` (no se lee de
   `process.env` dentro del cliente), de modo que los tests no usan red.
2. **Normalizer** (`*.normalizer.ts`): mapea el payload crudo a un DTO interno
   autónomo (`NormalizedExternalJob`), descartando registros inválidos sin abortar.
3. **Ingest service** (`*.ingest.service.ts`): backend-only y manual/controlado (no
   se invoca desde routers ni requests). Persiste con `source = <FUENTE>` y **upsert
   idempotente por `(source, externalId)`**.
4. El listado `GET /api/jobs` sirve todas las fuentes desde la DB de forma uniforme
   (mismo `serializeJob` / `JobPublicDto`).

Para una **fuente RSS** el patrón es el mismo, cambiando el client (parseo del feed
RSS en vez de JSON de API) y el normalizer; el ingest service y el contrato público
no cambian. Cada fuente nueva es un valor más del enum `JobSource`.

Pendiente al añadir fuentes (deuda técnica / decisiones futuras, fuera del alcance
actual):

- **Orquestación de ingesta**: hoy la ingesta es manual (script controlado, ver abajo).
  Con varias fuentes convendrá un disparador programado (comando/cron/endpoint admin),
  aún por decidir. No hay scraping.
- **Sinónimos de ubicación**: Jooble usa nombres en español ("Vizcaya", no "Bizkaia");
  buscar por el nombre en euskera no encuentra resultados. Análogo en otras lenguas
  cooficiales. Futuro: normalización/mapa de sinónimos (Vizcaya↔Bizkaia, País
  Vasco↔Euskadi…). No implementado aún.
- **Búsqueda que dispara ingesta**: a futuro, una búsqueda por ubicación podría
  consultar las fuentes externas en vivo (además de la DB). Requiere diseño (caché,
  rate limits, deduplicación) y decisión de producto.

## Ingesta controlada (dev/staging)

JobIT **no** consulta Jooble en cada request: la búsqueda `GET /api/jobs` lee la **DB
local**. Las ofertas externas se **ingieren** de forma controlada y quedan persistidas.

- **Host configurable**: `JOOBLE_API_BASE_URL` (opcional; default `https://jooble.org/api`).
  Algunas API keys son **regionales**: la de España responde en `https://es.jooble.org/api`
  y el host global devuelve `403`. Se valida http/https y se normaliza sin barra final.
- **Comando (backend-only, manual)**: `apps/api/src/jobs/scripts/ingest-jooble.ts`
  (`tsx`), parametrizado por entorno (`ING_KEYWORDS`, `ING_LOCATION`, `ING_LIMIT`). No
  expone endpoint, no borra seed, no crea usuarios; upsert idempotente por `(source, externalId)`.
- **Estrategia recomendada por ubicación**: ingerir por plazas relevantes para cubrir el
  MVP —p. ej. `Bilbao`, `Madrid`, `Barcelona`, `remoto` y `España` (general)— repitiendo
  el comando con cada `ING_LOCATION`. La `JOOBLE_API_KEY` nunca se imprime.

## Seguridad y honestidad (recordatorio)

- Enlaces externos: `target="_blank"` + `rel="noopener noreferrer"`, y solo se
  renderizan si la `sourceUrl` es `http`/`https` válida.
- Nunca se exponen `externalId`/`ingestedAt` ni la API key (viaja solo servidor→fuente).
- Las ofertas de ejemplo (seed) se marcan como tales y no muestran enlace de inscripción.
