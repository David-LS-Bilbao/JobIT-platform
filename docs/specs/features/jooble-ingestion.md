# Spec — Jooble ingestion configurable

## Objetivo

Permitir configurar el **host/base URL** de la API de Jooble por entorno para soportar
**API keys regionales** (p. ej. la de España responde en `https://es.jooble.org/api`,
mientras el host global `https://jooble.org/api` devuelve `403` para esa key), y dejar
una **forma controlada de ingesta** de ofertas reales para dev/staging. JobIT sigue
guardando y buscando ofertas en su **DB local**; Jooble alimenta esa DB de forma
controlada, no es un proxy en vivo.

## Usuario afectado

- Operador/desarrollador que puebla ofertas reales en dev/staging (backend-only).
- Indirectamente, el candidato: verá ofertas Jooble reales (con `sourceUrl`) una vez
  ingeridas, sin cambios en su flujo de búsqueda.

## Flujo principal

1. Se configura `JOOBLE_API_KEY` y (opcional) `JOOBLE_API_BASE_URL` en `apps/api/.env`.
2. Se ejecuta la ingesta controlada (script backend-only) con `keywords`/`location`.
3. El cliente Jooble llama a `${JOOBLE_API_BASE_URL}/{apiKey}` (host configurado).
4. Las ofertas válidas se normalizan y se persisten con `source=JOOBLE` y `sourceUrl`
   (upsert idempotente por `(source, externalId)`).
5. `GET /api/jobs` sirve esas ofertas desde la **DB local** (sin llamadas a Jooble por
   request), con filtros (`location`, etc.) y el contrato público (`source`/`sourceUrl`,
   sin `externalId`/`ingestedAt`).

## Modelo de datos existente

Sin cambios de Prisma. Se reutiliza el modelo `Job` con las columnas de procedencia
(`source`, `externalId`, `sourceUrl`, `ingestedAt`) ya existentes. No hay entidad nueva.

## Endpoints o comandos afectados

- **Sin endpoints nuevos.** La ingesta NO se expone por HTTP (no hay endpoint público ni
  admin).
- Comando de ingesta (backend-only, manual): `apps/api/src/jobs/scripts/ingest-jooble.ts`,
  ejecutable con `tsx`.
- `GET /api/jobs` no cambia su contrato.

## Configuración

| Variable | Obligatoria | Default | Notas |
|---|---|---|---|
| `JOOBLE_API_KEY` | Para ingerir | — | Solo backend. Nunca se commitea ni se loguea. |
| `JOOBLE_API_BASE_URL` | No | `https://jooble.org/api` | http/https válida. Regional España: `https://es.jooble.org/api`. |

- `JOOBLE_API_KEY` sigue **fuera del repo** (solo `apps/api/.env`, ignorado por Git).
- `JOOBLE_API_BASE_URL` es **opcional**; si falta, se usa el **default global** (compatibilidad).
- La base URL se normaliza sin barra final (no doble slash al construir `base/{apiKey}`).

## Reglas de negocio

- La búsqueda pública (`/api/jobs`) **consulta la DB local**; **no** hace llamadas live a
  Jooble por request.
- La ingesta es **backend-only y manual/controlada** (sin endpoint, sin cron todavía).
- La API key viaja **solo servidor→Jooble** (en el path de la URL); nunca al cliente, ni a
  logs, ni a mensajes de error.
- No hay **scraping**, no hay **LinkedIn API**, no hay **candidatura interna**.
- La ingesta **no borra** seed ni datos existentes; upsert idempotente por
  `(source, externalId)`.

## Validaciones

- `JOOBLE_API_BASE_URL`: debe ser URL `http:`/`https:` válida; se recomienda `https:`.
  Valor inválido → **fallo explícito al arrancar** (fail-fast, coherente con `PORT`).
- Ingesta: exige `JOOBLE_API_KEY` no vacía; si falta, aborta con `JoobleConfigError` sin
  llamar a la red.

## Errores

| Situación | Comportamiento |
|---|---|
| `JOOBLE_API_BASE_URL` inválida | Error al arrancar el backend (mensaje sin secretos). |
| `JOOBLE_API_KEY` ausente en ingesta | `JoobleConfigError`; no se llama a Jooble. |
| Jooble responde `403` (p. ej. host/key regional no coincide) | `JoobleHttpError` con `status`; fallo de proveedor, sin filtrar la key, sin crash inseguro. |
| Registro individual inválido | Se descarta (`skipped`) sin abortar el resto. |

## Criterios de aceptación

- [ ] `JOOBLE_API_BASE_URL` configurable; si falta, comportamiento actual (host global).
- [ ] El cliente Jooble usa la base URL configurada, sin doble slash y sin filtrar la key.
- [ ] La ingesta persiste ofertas `JOOBLE` con `sourceUrl` (upsert idempotente).
- [ ] `GET /api/jobs` sigue sirviendo desde DB local con el contrato público.
- [ ] Existe una forma controlada de disparar la ingesta en dev/staging.
- [ ] Sin secretos en el repo; sin `.env`; sin scraping; sin LinkedIn; sin candidatura interna.

## Tests mínimos

- `parseJoobleBaseUrl`: default si falta; acepta regional https; normaliza barra final;
  rechaza no-http/https y URL inválida.
- Cliente: usa default si no se inyecta base URL; usa regional; evita doble slash; `403`
  → `JoobleHttpError` sin filtrar la key.
- Ingesta: enhebra la base URL (deps y default de entorno) al cliente; no filtra la key.

## Fuera de alcance

- Endpoint HTTP de ingesta (público o admin).
- Cron/orquestación automática de ingesta.
- Motor de sinónimos de ubicación (Vizcaya/Bizkaia…): solo se documenta la deuda.
- Búsqueda live a Jooble por request; scraping; LinkedIn API; candidatura interna.
- Cambios de Prisma, nuevas dependencias o cambios de frontend.
