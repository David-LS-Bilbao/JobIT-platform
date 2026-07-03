# Sprint 16F.2 — Greenhouse smoke result

## Objetivo

Validar de extremo a extremo, con una **ingesta real controlada y autorizada**, el flujo de la
fuente Greenhouse implementada en Sprint 16F:

```txt
board público de Greenhouse → ingest-greenhouse.ts → normalizer → ingest service → DB JobIT
→ GET /api/jobs?source=GREENHOUSE → respuesta pública sin campos internos
```

Alcance deliberadamente mínimo: un solo board (`vercel`), un máximo de 3 ofertas, en la base
local/dev, sin credenciales y sin convertirlo en automatización.

## Entorno usado

- Repositorio: `/home/david/projects/JobIT-platform` (clon nativo WSL/Linux).
- Rama: `chore/sprint-16f2-greenhouse-smoke`.
- Ejecución con temporales de Linux forzados (`TMPDIR=/tmp TEMP=/tmp TMP=/tmp`).
- Backend API local en `http://localhost:4000` (ya en marcha durante la verificación).

## DB objetivo

- **Local/dev** (contenedor local; `dblocal=yes`, `dbenv=dev`).
- **Riesgo de producción: no.** No se consultó producción ni staging público.
- No se imprimió `DATABASE_URL`, host, usuario, contraseña ni nombre exacto de DB.

## Precondiciones

- Ruta correcta y rama `chore/sprint-16f2-greenhouse-smoke` verificadas.
- Working tree limpio antes del smoke.
- `apps/api/.env` presente (sin imprimir su contenido).
- Prechecks del provider (Sprint 16F / previos) en verde:
  - `typecheck`: PASS
  - `test`: PASS (41 archivos, 385 tests)
  - `build`: PASS
  - `git diff --check`: PASS
  - `git status --short`: limpio
- Fuentes NO ejecutadas: Jooble (no), Adzuna (no), otras fuentes (no).
- API keys: **no** (el Job Board API de Greenhouse es público, sin auth). Cron/recurrente: **no**.

## Conteo previo

Conteos agregados inmediatamente antes del smoke (sin exponer IDs internos, `externalId`,
`ingestedAt` ni payload crudo):

- Jobs `source=GREENHOUSE`: **0**
- Jobs totales: **55**

## Comando ejecutado

Ejecutado **una única vez** (retry técnico tras el primer intento bloqueado; ver Incidencias):

```bash
TMPDIR=/tmp TEMP=/tmp TMP=/tmp ING_GREENHOUSE_TOKENS=vercel ING_LIMIT=3 \
  pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-greenhouse.ts
```

- Board usado: `vercel`
- `ING_LIMIT`: `3`
- No se probaron variantes adicionales ni se repitió el comando.

## Resultado del script

- boards: `1`
- processed: `1`
- failed: `0`
- fetched: `3`
- normalized: `3`
- **created: `3`**
- updated: `0`
- skipped: `0`
- errors: `0`

## Conteo posterior

- Jobs `source=GREENHOUSE`: **3** (antes 0 → **+3**)
- Jobs totales: **58** (antes 55 → **+3**)

Coherente con `created=3`, sin updates ni skips.

## Verificación API

- Backend local/dev disponible.
- Healthcheck `GET http://localhost:4000/health`: **200**.
- Endpoint verificado: `GET http://localhost:4000/api/jobs?source=GREENHOUSE`
  - Probe sin token: **401** (el endpoint exige autenticación).
  - Con auth: **200**. El token se obtuvo con un **usuario dev desechable** creado solo en la
    base local/dev para esta verificación (no es un secreto; no se documenta credencial alguna).
  - `total=3`, `returned=3`, `limit=20`.
  - Todas las ofertas con `source=GREENHOUSE`.
  - `sourceUrl` presente en todas y con esquema `http/https` válido (host público
    `job-boards.greenhouse.io`).
  - Sin errores internos visibles.

Contrato público (claves devueltas por oferta):

```txt
company, contractType, description, expiresAt, id, location, postedAt, remoteType,
requirements, salaryMax, salaryMin, seniority, source, sourceUrl, status, tags, title
```

- `source` expuesto: **sí**
- `sourceUrl` expuesto: **sí**
- `externalId` expuesto: **no**
- `ingestedAt` expuesto: **no**
- Raw payload expuesto: **no**
- Otros campos internos expuestos: **no**

## Seguridad

- No se imprimió `.env`, `DATABASE_URL`, tokens, cookies ni credenciales.
- No se usaron API keys (endpoint público).
- No se ejecutó cron ni automatización recurrente.
- No se ejecutó Jooble, Adzuna ni otras fuentes.
- No se borraron datos.
- Única mutación de datos: 3 ofertas Greenhouse en local/dev (ingesta autorizada) + un usuario dev
  desechable para obtener token de lectura. Ningún archivo del repo modificado durante el smoke ni
  la verificación de API.

## Incidencias

- **Primer intento bloqueado (técnico, antes de ejecutar la lógica).** `tsx` intentó abrir su
  socket IPC temporal en un directorio de Windows montado en WSL
  (`/mnt/c/Users/David/AppData/Local/Temp/tsx-1000/*.pipe`), fallando con
  `listen ENOTSUP: operation not supported on socket`. La ingesta **no llegó a ejecutarse** y el
  working tree quedó limpio.
- **Retry técnico autorizado.** Se repitió el mismo comando **una sola vez** forzando temporales de
  Linux (`TMPDIR=/tmp TEMP=/tmp TMP=/tmp`). El fallo desapareció y la ingesta se completó con
  `created=3` y `errors=0`.
- **Riesgo documental (medio, no bloqueante).** El informe del provider existe como
  `docs/sprints/sprint-16f-greenhouse-provider-final-report.md`; una referencia previa esperaba
  `docs/sprints/sprint-16f-greenhouse-final-report.md` (nombre distinto). No afecta al resultado del
  smoke; conviene alinear las referencias en el informe final.

## Decisiones

- Smoke restringido a un board (`vercel`) y `ING_LIMIT=3` para minimizar impacto y confirmar el flujo
  sin masificar datos.
- Temporales de ejecución forzados a Linux (`/tmp`) como corrección de entorno, sin tocar código.
- Verificación de la API pública mediante el contrato serializado (`JobPublicDto`), confirmando que
  no se filtran `externalId`, `ingestedAt` ni payload crudo.
- No se convierte el smoke en cron ni automatización recurrente.

## Pendiente

- **Gate de producción (bloqueante antes de producción):** revisar y confirmar ToS/atribución y la
  política de uso de contenido externo de Greenhouse antes de cualquier ingesta en producción o de
  exponer estas ofertas fuera de dev. Mantener la atribución visible ("company" + fuente + enlace
  `sourceUrl`) y evaluar el logo/atribución específica que exija el proveedor.
- **Curación de la lista de empresas:** `GREENHOUSE_COMPANIES` debe mantenerse pequeña y revisada por
  producto antes de staging/demo.
- **No automatizar:** no habilitar cron ni orquestación recurrente sin decisión explícita.
- **Alinear referencia documental** del informe del provider (nombre del archivo Sprint 16F).

## Recomendación

- **Sprint 16F.2: PASS.** El flujo Greenhouse funciona de extremo a extremo en local/dev: ingesta
  real controlada (created=3), persistencia correcta (`GREENHOUSE` 0→3, total 55→58) y API pública
  correcta (`?source=GREENHOUSE` → 200 con auth, 3 ofertas, sin fuga de campos internos).
- **Siguiente paso:** preparar el informe final del operador para el orquestador (cierre del smoke),
  manteniendo el gate ToS/atribución como condición previa a producción y sin activar automatización.
