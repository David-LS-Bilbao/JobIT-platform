# API Rate Limiting

## Estado

```text
Activo — spec de la feature
Blocker: B3-ABUSE-01 (API Abuse Protection and Rate Limiting)
Nivel de riesgo: LEVEL_3 / HIGH_RISK_CONTROLLED
```

## Objetivo

Dotar a la API de JobIT de una protección transversal contra abuso mediante limitación de peticiones por cliente, cerrando el production blocker `B3-ABUSE-01` («Rate limiting ausente»).

La protección debe ser segura frente a falsificación de cabeceras, proporcional al uso legítimo de un producto candidate-first, verificable de forma determinista mediante tests y reversible sin desplegar.

## Usuarios y sistemas afectados

- **Candidatos**: consumen la API autenticada; no deben percibir el límite en un uso normal.
- **Visitantes anónimos**: acceden al portfolio público y a los avatares estáticos.
- **Atacantes**: fuerza bruta sobre login, creación masiva de cuentas, scraping del portfolio público.
- **Sondas de infraestructura**: Nginx Proxy Manager, Docker y CI consultan `GET /health`.
- **Suites automatizadas**: Vitest (integración con Supertest) y Playwright (E2E).

## Contexto

Antes de esta feature la API no disponía de ninguna protección: sin dependencia de rate limiting, sin middleware propio, sin respuesta `429` y sin `trust proxy` configurado.

Dos documentos canónicos anticipaban expresamente este trabajo:

- `docs/specs/features/auth.md` — el rate limiting de login y registro quedó **diferido** en el Sprint 01.
- `docs/specs/features/deploy-staging-readiness.md` — «si alguna feature futura lo necesita (**rate limiting por IP**, redirects), habrá que añadir `app.set("trust proxy", …)`».

Entorno real: Express 5.2.1, Node 20.19.5, pnpm 10.0.0.

## Arquitectura

Un único punto de integración: `apps/api/src/app.ts`. **Ningún router se modifica.**

```text
app.disable("x-powered-by")
app.set("trust proxy", <hops>)      ← antes de que cualquier limitador lea req.ip
helmet()
cors()
express.json()
cookieParser()
healthRouter                         ← GET /health, montado ANTES de los limitadores (exento)
/uploads            → limitador general → express.static
/api/auth/register  → limitador de registro
/api/auth/login     → limitador de login
/api/public/portfolios → limitador de portfolio público
/api                → limitador general
routers existentes
notFoundMiddleware
errorHandlerMiddleware
```

La exención de `GET /health` se consigue montando `healthRouter` **antes** que los limitadores, no mediante una lista de exclusión dentro del limitador. Por eso el limitador general se monta sobre `/api` y `/uploads`, nunca sobre toda la aplicación.

Los limitadores reforzados se montan **antes** que el general sobre rutas más específicas, de modo que agotar el límite reforzado produce `429` aunque quede cupo general.

## Superficies protegidas

| Superficie | Limitador |
|---|---|
| Todo `/api/**` | general |
| `/uploads/**` (avatares) | general |
| `POST /api/auth/register` | registro + general |
| `POST /api/auth/login` | login + general |
| `POST /api/auth/logout` | solo general |
| `GET /api/public/portfolios/:slug` | portfolio público + general |
| `GET /health` | **exento** |

## Orden y prioridad de limitadores

1. `GET /health` se resuelve antes de cualquier limitador.
2. Los limitadores específicos (registro, login, portfolio público) se evalúan antes que el general.
3. El general se aplica después, de modo que registro, login y portfolio público consumen **ambos** cupos.
4. El primero que se agote produce el `429`.

## Política general

```text
Ámbito:          todas las peticiones bajo /api y /uploads
Ventana:         900000 ms (15 minutos)
Máximo:          300 peticiones por clave
Clave:           req.ip (keyGenerator por defecto de express-rate-limit)
Store:           MemoryStore
standardHeaders: draft-8
legacyHeaders:   false
```

Justificación: un candidato navegando de forma intensiva encadena dashboard, listado, detalle, match y guardados. 300 peticiones por IP y cuarto de hora equivalen a ~20/minuto sostenidas — muy por encima del uso legítimo de una persona y muy por debajo de lo que necesita un scraper o un ataque por cómputo.

## Política de registro

```text
Ruta:                   POST /api/auth/register
Ventana:                3600000 ms (1 hora)
Máximo:                 5
Clave:                  req.ip
skipSuccessfulRequests: false  → cuentan todos los intentos
```

Una persona legítima crea **una** cuenta. 5 por hora tolera errores de validación y un hogar compartido, y frena la creación masiva. Aquí no se omiten los éxitos porque el registro exitoso repetido **es** precisamente el abuso.

## Política de login

```text
Ruta:                   POST /api/auth/login
Ventana:                900000 ms (15 minutos)
Máximo:                 10 intentos fallidos
Clave:                  req.ip
skipSuccessfulRequests: true   → solo cuentan las respuestas >= 400
```

Análisis de `skipSuccessfulRequests`:

- **Fuerza bruta**: sin efecto negativo. El atacante que prueba contraseñas solo genera respuestas `401`, que sí cuentan; agota su cupo en 10 intentos.
- **Enumeración**: sin efecto negativo, por el mismo motivo.
- **Bypass**: el único modo de no consumir cupo es autenticarse correctamente, lo que exige ya poseer credenciales válidas — deja de ser fuerza bruta.
- **Usuarios legítimos**: es la razón de activarlo. Sin él, varias personas tras un mismo NAT consumirían el cupo simplemente iniciando sesión con normalidad.

Los intentos correctos siguen consumiendo el limitador **general**.

## Política de portfolio público

```text
Ruta:            GET /api/public/portfolios/:slug
Ventana:         900000 ms (15 minutos)
Máximo:          60
Clave:           req.ip
standardHeaders: draft-8
legacyHeaders:   false
```

Es la única superficie pública que expone datos personales. 60 lecturas por IP y cuarto de hora cubren de sobra a un reclutador consultando varios portfolios y encarecen la enumeración de slugs. El `404` uniforme ya existente se conserva.

## Health check

```text
GET /health → EXENTO
```

No consume cupo y no devuelve cabeceras de rate limiting. Es la sonda de liveness de Nginx Proxy Manager, Docker y CI: limitarla podría provocar reinicios en cascada. No expone datos.

## Archivos estáticos

```text
/uploads/** → limitador general
```

Los avatares son contenido público servido desde disco. El límite general no estorba a un uso normal y evita la descarga masiva.

## Identificación del cliente

Se usa el `keyGenerator` **por defecto** de `express-rate-limit`, que aplica internamente el helper oficial `ipKeyGenerator` sobre `req.ip`.

**No se usa** ninguna cabecera suministrada por el cliente como clave, ni ningún atributo del cuerpo de la petición, ni User-Agent, ni email, ni cookies. No hay fingerprinting ni device tracking.

## IPv4

La clave es la dirección completa.

## IPv6

La clave se enmascara al prefijo **`/56`** (`ipv6Subnet: 56`, valor por defecto de la librería). A un cliente doméstico se le asigna habitualmente un `/56` o `/64`; sin máscara, rotar dentro del propio prefijo anularía el límite.

Consecuencia aceptada: dos direcciones IPv6 dentro del mismo `/56` comparten cupo.

## IPv4 mapeada en IPv6

En despliegues dual-stack, Node entrega direcciones con forma `::ffff:x.x.x.x`.

`express-rate-limit` anterior a 8.3.0 las trataba como IPv6 nativas y, al enmascarar a `/56`, **todas colapsaban en una única cubeta `::/56`** — un solo atacante provocaba `429` a todo el tráfico IPv4 (CVE-2026-30827 / GHSA-46wh-pxpv-q5gq, severidad alta, CVSS 7.5; afectadas 8.0.0–8.2.1).

Por eso esta feature fija **`express-rate-limit@8.6.2`**, muy por encima de la primera versión corregida, y mantiene un test de regresión específico que demuestra que dos clientes IPv4 mapeados distintos **no** comparten cubeta.

## Proxy y trust proxy

Topología acreditada en `ADR-0012` y `docs/specs/features/deploy-staging-readiness.md`:

```text
Internet → Nginx Proxy Manager (TLS, único punto expuesto) → contenedor API (HTTP interno)
```

Un **único** salto de proxy en staging/producción; ninguno en local, CI y E2E.

```ts
app.set("trust proxy", rateLimitConfig.trustProxyHops);
```

```text
local / test / CI:                     0  (por defecto)
staging / producción tras NPM:         1  (vía TRUST_PROXY_HOPS)
```

**Queda prohibido `app.set("trust proxy", true)`**: haría que Express tomase el extremo izquierdo de `X-Forwarded-For`, enteramente controlable por el cliente; cualquiera podría falsificar su IP para evadir el límite o suplantar la de un tercero para bloquearlo.

Con `hops = 0` la cabecera `X-Forwarded-For` **se ignora por completo**. Con `hops = 1` Express descarta los valores inyectados por el cliente y toma únicamente el salto añadido por el proxy de confianza.

No se implementa ningún parser propio de la cabecera ni se toma su primer valor sin validación.

## Respuesta 429

```text
HTTP 429 Too Many Requests
```

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Demasiadas solicitudes. Inténtalo de nuevo más tarde."
  }
}
```

El `handler` del limitador responde directamente y termina el ciclo. **No delega** en `errorHandlerMiddleware`, que siempre responde `500`.

La respuesta no expone IP, clave, contador, límite numérico, ventana, store, stack ni ningún detalle de implementación. El mensaje es neutro y no revela si un email existe.

## Cabeceras

```text
Requeridas:  RateLimit (draft-8), Retry-After
Prohibidas:  X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
```

Las cabeceras legacy se deshabilitan (`legacyHeaders: false`): no están estandarizadas, duplican información y amplían la superficie de fingerprinting. El frontend no las consume.

## Configuración por entorno

Nueve variables resueltas y validadas en `apps/api/src/config/rate-limit.config.ts`. `apps/api/src/config/env.ts` **no se modifica**.

### Valores productivos por defecto

```text
RATE_LIMIT_WINDOW_MS=900000      RATE_LIMIT_MAX=300
AUTH_LOGIN_WINDOW_MS=900000      AUTH_LOGIN_MAX=10
AUTH_REGISTER_WINDOW_MS=3600000  AUTH_REGISTER_MAX=5
PUBLIC_READ_WINDOW_MS=900000     PUBLIC_READ_MAX=60
TRUST_PROXY_HOPS=0
```

### Valores por defecto cuando `NODE_ENV=test`

```text
RATE_LIMIT_WINDOW_MS=900000      RATE_LIMIT_MAX=1000
AUTH_LOGIN_WINDOW_MS=900000      AUTH_LOGIN_MAX=100
AUTH_REGISTER_WINDOW_MS=3600000  AUTH_REGISTER_MAX=100
PUBLIC_READ_WINDOW_MS=900000     PUBLIC_READ_MAX=1000
TRUST_PROXY_HOPS=0
```

Los defaults de test evitan que la suite de integración existente (532 tests, hasta 27 peticiones por fichero, con `retry: 2`) agote los cupos productivos. **El rate limiting permanece activo en test**: no se desactiva, solo se eleva el umbral, y la protección se verifica con instancias dedicadas de límite diminuto.

Una variable de entorno explícita **siempre prevalece** sobre el default de test.

## Validaciones

Rangos admitidos:

```text
RATE_LIMIT_WINDOW_MS      1000 – 3600000
RATE_LIMIT_MAX            entero >= 1
AUTH_LOGIN_WINDOW_MS      1000 – 3600000
AUTH_LOGIN_MAX            entero >= 1
AUTH_REGISTER_WINDOW_MS   1000 – 86400000
AUTH_REGISTER_MAX         entero >= 1
PUBLIC_READ_WINDOW_MS     1000 – 3600000
PUBLIC_READ_MAX           entero >= 1
TRUST_PROXY_HOPS          0 – 10
```

Reglas: solo enteros; se rechazan decimales, cadenas vacías, `NaN` y valores parcialmente numéricos como `10abc`. El fallo es **fail-fast** al resolver la configuración, con un mensaje explícito que nombra la variable y **nunca** contiene secretos.

## Reglas de seguridad

- La IP se trata de forma **efímera y en memoria**; **no se persiste** en base de datos ni en disco.
- **No se registra** la IP en logs; esta feature no añade logging ni métricas.
- `trust proxy` nunca es `true`.
- `X-Forwarded-For` se ignora cuando no hay proxy de confianza.
- Las validaciones internas de `express-rate-limit` permanecen activas.
- No se introduce ninguna API de producción para resetear o inspeccionar los stores.

## Criterios de aceptación

1. Superar el límite general devuelve `429` con el cuerpo exacto y las cabeceras `RateLimit` y `Retry-After`.
2. No se emite ninguna cabecera `X-RateLimit-*`.
3. `GET /health` no devuelve `429` ni cabeceras de límite bajo carga repetida.
4. `POST /api/auth/register` se corta en el 6.º intento dentro de la ventana.
5. `POST /api/auth/login` se corta en el 11.º intento **fallido**; los correctos no consumen su cupo reforzado.
6. `GET /api/public/portfolios/:slug` se corta al superar 60 lecturas.
7. Dos clientes con IP distinta no comparten cupo.
8. Con `TRUST_PROXY_HOPS=0`, `X-Forwarded-For` no permite separar clientes ni evadir el límite.
9. Con un salto de proxy de confianza, `X-Forwarded-For` sí separa clientes.
10. Dos clientes IPv4 mapeados en IPv6 distintos no colapsan en la misma cubeta.
11. Dos IPv6 del mismo `/56` comparten cupo; de `/56` distintos, no.
12. La configuración falla de forma explícita ante cualquier valor inválido.
13. Los 532 tests preexistentes siguen en verde.

## Estrategia TDD

```text
spec → tests RED → dependencia → implementación GREEN → refactor mínimo → regresión completa
```

## Tests mínimos

- `apps/api/src/config/rate-limit.config.test.ts` — defaults productivos y de test, precedencia de variables explícitas, límites de rango, rechazo de decimales, cadenas vacías, negativos y valores parcialmente numéricos, `TRUST_PROXY_HOPS` 0/1/10 y fuera de rango, fail-fast, ausencia de mutación permanente de `process.env`.
- `apps/api/src/middlewares/rate-limit.middleware.test.ts` — comportamiento del middleware con apps Express mínimas y stores aislados: bajo límite, corte, contrato `429`, cabeceras, aislamiento entre clientes, IPv4, IPv6 `/56`, IPv4 mapeada, proxy de un salto, cabecera ignorada sin proxy, `skipSuccessfulRequests`.
- `apps/api/src/tests/rate-limit.integration.test.ts` — montaje real sobre `app.ts`: exención de `/health`, cobertura de `/api` y `/uploads`, limitadores reforzados, contrato y cabeceras, ausencia de contaminación entre suites.

Los tests **no** usan esperas prolongadas ni dejan expirar ventanas reales: agotan cupos diminutos con peticiones consecutivas.

## Rollback

```bash
git checkout 86cdef33a78edccc778c90390906be07368321b8 -- \
  apps/api/package.json pnpm-lock.yaml apps/api/src/app.ts apps/api/.env.example
rm -f apps/api/src/config/rate-limit.config.ts \
      apps/api/src/config/rate-limit.config.test.ts \
      apps/api/src/middlewares/rate-limit.middleware.ts \
      apps/api/src/middlewares/rate-limit.middleware.test.ts \
      apps/api/src/tests/rate-limit.integration.test.ts
pnpm install --frozen-lockfile
pnpm --filter @jobit/api typecheck && pnpm --filter @jobit/api test
```

Mitigación intermedia sin rollback de código: al ser todos los valores variables de entorno, un falso positivo en producción se corrige elevando el límite y reiniciando, **sin desplegar código**.

## Limitaciones

- **MemoryStore**: el estado vive en el proceso. No se comparte entre instancias y se pierde al reiniciar. Aceptable porque `ADR-0012` fija una **instancia única** de API.
- La clave es la IP: varios usuarios tras un mismo NAT comparten cupo.
- La rotación de IP por parte de un atacante no se mitiga aquí (requeriría WAF o CDN, fuera de alcance).
- No hay métricas ni alertas de rate limiting.

## Condiciones de reapertura

Esta spec debe revisarse si:

1. Se introduce **escalado horizontal** o más de una instancia de API — el MemoryStore dejaría de ser correcto y haría falta un store compartido.
2. Cambia la topología de proxy (número de saltos, proveedor distinto de Nginx Proxy Manager).
3. Aparece un advisory aplicable a la versión fijada de `express-rate-limit`.
4. Se observan falsos positivos recurrentes sobre usuarios legítimos que la configuración por entorno no baste para corregir.

## Fuera de alcance

`B3-BACKUP-01`, backups y restore; `S22-PRIV-01`, inventario legal y privacidad; `B4-STATE-02`; exportación y eliminación de cuenta; MFA; recuperación de contraseña; CAPTCHA; bloqueo permanente de cuentas; listas negras persistentes; fingerprinting; device tracking; detección avanzada de bots; WAF; CDN; Redis o cualquier store compartido; infraestructura nueva; Nginx; DNS; staging; producción; deploy; métricas; alertas; observabilidad general; Prisma, migraciones y modelos de datos; cambios funcionales de auth, JWT o cookies; frontend; Job Radar, Recruit y Candidate Discovery; proveedores de empleo; actualización masiva de dependencias; refactor general.

**Deuda no bloqueante registrada**: no se añaden limitadores específicos para `GET /api/jobs/:id/match`, `GET /api/profile/me/matches` (coste de CPU) ni `POST /api/profile/me/avatar` (coste de disco). Quedan cubiertos por el limitador general; su refuerzo se valorará si se observa abuso real.
