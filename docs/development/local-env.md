# Entorno local — API y Web

## Entorno soportado

Ejecuta el tooling desde el clon nativo de WSL:

```text
/home/david/projects/JobIT-platform
```

No uses un checkout de Windows/OneDrive ni compartas `node_modules` entre sistemas.
Consulta también [`docs/agents/operating-environment.md`](../agents/operating-environment.md).

Requisitos:

- Node.js 20;
- `pnpm@10.0.0`;
- PostgreSQL accesible;
- dependencias instaladas desde la raíz.

```bash
pnpm install --frozen-lockfile
```

No instales dependencias durante un gate de revisión o una tarea documental.

## Configuración de la API

El backend carga `apps/api/.env`, no un `.env` de la raíz:

```bash
cp apps/api/.env.example apps/api/.env
```

La plantilla está versionada con placeholders. El archivo real está ignorado y nunca
debe copiarse a logs, chats, commits o PR.

Variables principales:

| Variable | Uso |
|---|---|
| `NODE_ENV` | `development`, `test` o `production` |
| `PORT` | Puerto Express; por defecto `4000` |
| `CORS_ORIGIN` | Origen exacto permitido para el frontend |
| `DATABASE_URL` | Base de desarrollo/operación local |
| `DATABASE_URL_TEST` | Base exclusiva para tests |
| `JWT_ACCESS_SECRET` | Firma de access tokens |
| `JWT_REFRESH_SECRET` | Firma de refresh tokens |
| `JOOBLE_API_KEY` | Clave backend-only, opcional salvo ingesta Jooble |
| `JOOBLE_API_BASE_URL` | Host global o regional de Jooble |
| `GREENHOUSE_API_BASE_URL` | Job Board API pública de Greenhouse |

Genera secretos JWT largos y aleatorios para local. No reutilices valores de staging
o producción.

## Bases de desarrollo y test

Usa bases separadas, por ejemplo:

- `jobit_dev` para desarrollo;
- `jobit_test` para Vitest.

Genera el cliente y aplica migraciones a la base seleccionada por `DATABASE_URL`:

```bash
pnpm --filter @jobit/api exec prisma generate
pnpm --filter @jobit/api exec prisma migrate deploy
```

Los tests de API:

- exigen `DATABASE_URL_TEST`;
- no hacen fallback a `DATABASE_URL`;
- validan que el nombre se clasifique inequívocamente como test;
- migran esa base en `globalSetup`;
- truncan sus tablas durante la suite.

Nunca apuntes `DATABASE_URL_TEST` a desarrollo, staging o producción.

## Seed interno protegido

El seed de desarrollo se ejecuta explícitamente:

```bash
pnpm --filter @jobit/api exec tsx prisma/seed.ts
```

Antes de conectar valida que `DATABASE_URL` sea un destino permitido para seed. El
servicio usa upsert sobre el namespace `jobit-seed-*`, no hace `deleteMany()` global y
preserva:

- ofertas Jooble;
- ofertas Greenhouse;
- ofertas internas ajenas al dataset controlado;
- relaciones de candidatos que no pertenezcan a ese namespace.

Si la guarda rechaza el destino, no intentes sortearla ni cambies el nombre de una
base real para que parezca local.

## Configuración del frontend

El web necesita:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

Puede guardarse en `apps/web/.env.local`, ignorado por Git. El portfolio público usa
`NEXT_PUBLIC_PUBLIC_BASE_URL` cuando necesita construir URLs absolutas; en local suele
ser el origen real del web. No configures un dominio de producción no aprobado.

## Puertos y CORS

Valores habituales:

- API: `http://localhost:4000`;
- Web: `http://localhost:3000`.

`CORS_ORIGIN` debe coincidir exactamente con el origen del navegador. Si Next.js
arranca en `3001`, configura:

```text
CORS_ORIGIN=http://localhost:3001
```

y reinicia la API.

La plantilla `.env.example` usa `3001` para cubrir entornos donde `3000` ya está
ocupado. No asumas el puerto: comprueba la salida de Next.js.

## Arranque

En una terminal:

```bash
pnpm --filter @jobit/api dev
```

En otra:

```bash
pnpm --filter @jobit/web dev
```

Para fijar el web en `3001`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000 \
  pnpm --filter @jobit/web exec next dev -p 3001
```

## Smoke básico

API:

```bash
curl -i http://localhost:4000/health
```

Respuesta esperada: HTTP `200` y un cuerpo con `status: "ok"`.

Web:

```bash
curl -I http://localhost:3000/
```

Preflight, adaptando el origen al puerto real:

```bash
curl -i -X OPTIONS http://localhost:4000/api/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

`Access-Control-Allow-Origin` debe devolver exactamente el origen configurado.

## Ingesta Jooble

JobIT no consulta Jooble durante una búsqueda. Los scripts obtienen, normalizan y
persisten ofertas de forma manual.

Una ubicación:

```bash
JOOBLE_API_KEY=<KEY> \
  JOOBLE_API_BASE_URL=https://es.jooble.org/api \
  ING_LOCATION=Bilbao \
  pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-jooble.ts
```

Varias ubicaciones:

```bash
JOOBLE_API_KEY=<KEY> \
  JOOBLE_API_BASE_URL=https://es.jooble.org/api \
  ING_LOCATIONS="Bilbao,Madrid,Barcelona,Remoto,España" \
  ING_LIMIT=20 \
  pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-jooble-locations.ts
```

Algunas claves son regionales. No pruebes una clave incluyéndola en comandos que
vayan a compartirse o persistirse en logs.

## Ingesta Greenhouse

Greenhouse usa una API pública sin secreto. La lista de empresas curadas vive en el
código y `ING_GREENHOUSE_TOKENS` solo selecciona un subset:

```bash
ING_GREENHOUSE_TOKENS=vercel ING_LIMIT=3 \
  pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-greenhouse.ts
```

Una selección vacía o no reconocida aborta antes de hacer red. Mantén la lista pequeña
y revisada. `ADZUNA` no dispone de script ni provider.

## Verificaciones

API:

```bash
pnpm --filter @jobit/api exec prisma generate
pnpm --filter @jobit/api typecheck
pnpm --filter @jobit/api test
pnpm --filter @jobit/api build
```

Web:

```bash
pnpm --filter @jobit/web lint
pnpm --filter @jobit/web typecheck
pnpm --filter @jobit/web test
pnpm --filter @jobit/web build
```

E2E local:

```bash
pnpm --filter @jobit/web test:e2e
```

Playwright puede reutilizar un web existente en `3000`, pero no levanta la API. La
API y sus datos deben estar preparados antes de los escenarios que dependan de ella.

## Diagnóstico rápido

- **Login bloqueado por CORS:** compara `CORS_ORIGIN` con el origen exacto del web.
- **API sin variables:** confirma que el archivo es `apps/api/.env`.
- **Tests bloqueados por seguridad:** revisa que `DATABASE_URL_TEST` exista y apunte
  a una base dedicada con nombre inequívoco de test.
- **Jooble responde `403`:** verifica el host regional asignado a la key sin exponerla.
- **Greenhouse no ingiere:** comprueba que los tokens estén en la lista curada.
- **Playwright no alcanza backend:** levanta la API en `4000` y prepara la base.

No ajustes auth, CORS de producción, secretos o infraestructura desde esta guía sin
una tarea y autorización específicas.
