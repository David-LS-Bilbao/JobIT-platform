# Entorno local — API y Web

Guía para arrancar JobIT en local sin sorpresas de configuración (CORS / base de
datos). Resuelve el fallo típico de **login bloqueado por CORS** cuando el
frontend corre en un puerto distinto al configurado en el backend.

## Por qué existe `apps/api/.env.example`

El backend (`apps/api`) lee su configuración de variables de entorno
(`NODE_ENV`, `PORT`, `CORS_ORIGIN`, `DATABASE_URL`, `DATABASE_URL_TEST`,
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JOOBLE_API_KEY`). Al arrancar con
`tsx`/`pnpm`, `dotenv` carga el `.env` del **directorio de trabajo** (`apps/api`),
no el `.env` de la raíz. Por eso el backend necesita **su propio** `apps/api/.env`.

`apps/api/.env.example` es la **plantilla versionada, sin secretos**. El archivo
real `apps/api/.env` **NO** se commitea (está en `.gitignore`).

## Crear tu `.env` local

```bash
cp apps/api/.env.example apps/api/.env
# edita apps/api/.env con tus valores locales (DB, secretos, CORS)
```

`apps/api/.env` está ignorado por Git (`.env`, `.env.*`; solo se versiona
`.env.example`). Nunca publiques sus valores ni los pegues en logs/PRs.

## Puerto del frontend y CORS (causa del fallo de login)

El backend permite CORS **con credenciales** solo desde `CORS_ORIGIN`. Ese valor
**debe coincidir con el puerto real del frontend**.

- El frontend por defecto usa el **3000**.
- Si el 3000 está ocupado (p. ej. por un contenedor Docker), arráncalo en **3001**.
- En ese caso, `CORS_ORIGIN` **debe** ser `http://localhost:3001`.

Si `CORS_ORIGIN=http://localhost:3000` pero el web corre en `:3001`, el navegador
bloquea el preflight y el login falla con:

```
Access to fetch at 'http://localhost:4000/api/auth/login' from origin
'http://localhost:3001' has been blocked by CORS policy...
```

El `apps/api/.env.example` ya trae `CORS_ORIGIN=http://localhost:3001` por este
motivo. Ajústalo si tu frontend corre en otro puerto.

## Arrancar API y Web

```bash
# 1) Backend (lee apps/api/.env). Escucha en http://localhost:4000
pnpm --filter @jobit/api dev

# 2) Frontend. Si el 3000 está libre:
pnpm --filter @jobit/web dev
#    Si el 3000 está ocupado, usa el 3001 (y pon CORS_ORIGIN=http://localhost:3001):
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000" pnpm --filter @jobit/web exec next dev -p 3001
```

El frontend necesita `NEXT_PUBLIC_API_BASE_URL` apuntando a la API
(`http://localhost:4000` en dev).

## Verificaciones (smoke)

Health del backend:

```bash
curl http://localhost:4000/health
# -> {"status":"ok","service":"jobit-api"}
```

Preflight CORS para el origen del frontend (debe reflejar tu `CORS_ORIGIN`):

```bash
curl -i -X OPTIONS http://localhost:4000/api/auth/login \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

Resultado esperado (cabecera):

```
Access-Control-Allow-Origin: http://localhost:3001
```

Si ves `http://localhost:3000` ahí, tu `CORS_ORIGIN` no coincide con el puerto del
frontend: corrígelo en `apps/api/.env` y reinicia el backend.

## Base de datos de tests (`DATABASE_URL_TEST`)

Los tests de `@jobit/api` usan una base **independiente** (`jobit_test`): el
`globalSetup` de vitest ejecuta `prisma migrate deploy` y cada test trunca las
tablas. **No** apuntes `DATABASE_URL_TEST` a `jobit_dev` (borraría tus datos).

```bash
# crear la base de test una vez (ejemplo con el contenedor local)
docker exec -e PGPASSWORD=... jobit-postgres-dev \
  psql -U <user> -d postgres -c "CREATE DATABASE jobit_test;"

# ejecutar los tests backend con la base de test
pnpm --filter @jobit/api test
```

`apps/api/.env` con `DATABASE_URL_TEST` definido basta; si no, expórtalo antes de
lanzar los tests.

## Jooble (ingesta de ofertas externas)

JobIT **no** consulta Jooble en cada request: la búsqueda (`GET /api/jobs`) lee la DB
local. Las ofertas Jooble se **ingieren** de forma controlada (backend-only, manual) y
quedan guardadas en la DB con `source=JOOBLE` y `sourceUrl`.

Variables (en `apps/api/.env`, **nunca** commitear el `.env` real):

- `JOOBLE_API_KEY`: clave de Jooble. Solo backend; **nunca** se loguea ni se pega en
  chats/PRs. Sin ella, la ingesta aborta sin llamar a la red.
- `JOOBLE_API_BASE_URL` (opcional): host de la API. Default `https://jooble.org/api`.
  **Algunas keys son regionales**: la de España responde en `https://es.jooble.org/api`
  (el host global da `403`). Debe ser http/https.

Comprobar rápidamente que la key funciona (elige el host correcto; **no** pegues la key
en logs; sustituye `<KEY>` por la tuya):

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "https://es.jooble.org/api/<KEY>" \
  -H "Content-Type: application/json" -d '{"keywords":"developer","location":"Bilbao"}'
# 200 = host correcto para tu key; 403 = host equivocado (prueba el global o el regional)
```

Poblar ofertas reales en dev/staging (backend-only, no borra seed):

```bash
# Ajusta ING_LOCATION por plaza: Bilbao, Madrid, Barcelona, remoto, España…
JOOBLE_API_KEY=<KEY> JOOBLE_API_BASE_URL=https://es.jooble.org/api ING_LOCATION=Bilbao \
  pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-jooble.ts
# Imprime un resumen (keywords/location/fetched/created/updated/skipped); nunca la key.
```

Poblar **varias ubicaciones** de una vez (en serie; continúa si una falla; exit `1` si
alguna falló):

```bash
JOOBLE_API_KEY=<KEY> JOOBLE_API_BASE_URL=https://es.jooble.org/api \
  ING_LOCATIONS="Bilbao,Madrid,Barcelona,Remoto,España" ING_LIMIT=20 \
  pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-jooble-locations.ts
# Resumen por ubicacion + agregado (locations/ok/failed + totales). Nunca imprime la key.
```

Los datos ingeridos son locales de dev y se pierden al reseedear (`prisma db seed`
vacía la tabla `Job`). No se commitean.

## Notas

- No cambies la lógica de auth ni el CORS de producción desde aquí; esto es solo
  documentación de entorno local.
- En producción, `CORS_ORIGIN` debe ser el dominio real del frontend, y el
  frontend necesita `NEXT_PUBLIC_PUBLIC_BASE_URL` para las URLs públicas/QR del
  portfolio.
