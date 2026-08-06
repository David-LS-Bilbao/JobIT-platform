# Informe final

## Sprint o tarea

Candidate-First API Abuse Protection — `B3-ABUSE-01` (API Abuse Protection and Rate Limiting). Sin numeración oficial de sprint.

## Objetivo inicial

Cerrar técnicamente el production blocker `B3-ABUSE-01` («Rate limiting ausente») dotando a la API de una protección transversal contra abuso, segura frente a falsificación de cabeceras, proporcional al uso legítimo, verificable de forma determinista y reversible sin desplegar.

## Baseline

```text
Repositorio:  git@github.com:David-LS-Bilbao/JobIT-platform.git
Ruta:          /home/david/projects/JobIT-platform
Rama base:     dev
Baseline:      86cdef33a78edccc778c90390906be07368321b8
Rama trabajo:  fix/b3-abuse-01-api-rate-limiting
```

`HEAD`, `dev` y `origin/dev` coincidían exactamente con el baseline. Working tree limpio, staging vacío, sin repositorios anidados ni divergencia local.

Entorno: Express 5.2.1, Node 20.19.5, pnpm 10.0.0.

## Nivel de riesgo

`LEVEL_3` / `HIGH_RISK_CONTROLLED` — seguridad de la API. Ejecución por gates técnicos con verificación completa y autorización Git separada.

## Plan aprobado

Spec previa, TDD (RED → GREEN → refactor), una única dependencia fijada a versión exacta, montaje exclusivo desde `app.ts` sin tocar routers, y lista cerrada de once archivos.

## Estado inicial

Antes de este trabajo no existía: dependencia de rate limiting, middleware propio, respuesta `429` de la API, configuración de `trust proxy` ni protección reforzada de login o registro. Verificado por `grep` sobre `apps/api/src`, `apps/api/package.json` y `pnpm-lock.yaml`.

## Trabajo realizado

Spec → tests RED → dependencia → implementación GREEN → refactor → quality gates → E2E → revisión de seguridad → informe. Sin commit, push, PR, merge ni deploy.

## Arquitectura implementada

Un único punto de integración: `apps/api/src/app.ts`. **Ningún router fue modificado.**

```text
app.disable("x-powered-by")
app.set("trust proxy", rateLimitConfig.trustProxyHops)   ← antes de leer req.ip
helmet() · cors() · express.json() · cookieParser()
healthRouter                                    ← GET /health exento por montaje
/uploads            → generalRateLimiter → express.static
/api/auth/register  → registerRateLimiter
/api/auth/login     → loginRateLimiter
/api/public/portfolios → publicReadRateLimiter
/api                → generalRateLimiter
routers existentes
notFoundMiddleware · errorHandlerMiddleware
```

La exención de `GET /health` se logra **por orden de montaje**, no por lista de exclusión. Por eso el limitador general se monta sobre `/api` y `/uploads`, nunca sobre toda la aplicación.

Los limitadores reforzados se montan antes que el general sobre rutas más específicas: agotar el cupo reforzado corta aunque quede cupo general.

## Políticas implementadas

| Limitador | Ventana | Máximo | `skipSuccessfulRequests` |
|---|---|---|---|
| General | 900 000 ms | 300 | `false` |
| Registro | 3 600 000 ms | 5 | `false` — cuentan todos los intentos |
| Login | 900 000 ms | 10 | `true` — solo cuentan los fallidos |
| Portfolio público | 900 000 ms | 60 | `false` |

`skipSuccessfulRequests` en login no debilita la protección: un atacante de fuerza bruta solo genera respuestas `401`, que sí consumen cupo. Evita penalizar a varios usuarios legítimos tras un mismo NAT. En registro se hace lo contrario, porque allí el éxito repetido **es** el abuso.

## Rutas protegidas

| Superficie | Limitador |
|---|---|
| Todo `/api/**` | general |
| `/uploads/**` | general |
| `POST /api/auth/register` | registro + general |
| `POST /api/auth/login` | login + general |
| `POST /api/auth/logout` | solo general |
| `GET /api/public/portfolios/:slug` | portfolio público + general |
| `GET /health` | **exento** |

## Límites y ventanas

Productivos: `300/15 min` general, `10/15 min` login (fallidos), `5/h` registro, `60/15 min` portfolio público, `TRUST_PROXY_HOPS=0`.

En `NODE_ENV=test` los umbrales se elevan (`1000`, `100`, `100`, `1000`) para no interferir con la suite de integración. **El rate limiting permanece activo en test**: no se desactiva, y la protección se verifica con instancias dedicadas de límite diminuto.

## Dependencia utilizada

```text
express-rate-limit  8.6.2  (versión exacta, sin rango)
Licencia: MIT · peer: express >= 4.11 · engines: node >= 16
```

La versión no es arbitraria: `express-rate-limit` 8.0.0–8.2.1 está afectada por **CVE-2026-30827 / GHSA-46wh-pxpv-q5gq** (alta, CVSS 7.5), donde las direcciones IPv4 mapeadas en IPv6 colapsaban en una única cubeta `::/56` y un solo atacante podía provocar `429` a todo el tráfico IPv4. Corregida en 8.3.0+; se fija 8.6.2 y se mantiene un test de regresión específico.

Ninguna otra dependencia directa fue añadida ni actualizada.

## Configuración

Nueve variables resueltas y validadas en `apps/api/src/config/rate-limit.config.ts`, con `resolveRateLimitConfig` como función pura (recibe el entorno por parámetro, no lee ni muta `process.env`). `apps/api/src/config/env.ts` **no fue modificado**.

Validación *fail-fast*: solo enteros; se rechazan decimales, cadenas vacías, notación científica y valores parcialmente numéricos como `10abc`. Los mensajes nombran la variable y el rango, y nunca incluyen valores de otras variables del entorno (verificado por test).

Precedencia: variable explícita → default de test → default productivo.

## IP, IPv4 e IPv6

Se usa el `keyGenerator` **por defecto** de `express-rate-limit`, que aplica el helper oficial `ipKeyGenerator` sobre `req.ip`. No se implementó ningún generador propio ni normalización casera.

- **IPv4**: dirección completa.
- **IPv6**: enmascarada a `/56`. Dos direcciones del mismo `/56` comparten cupo; de `/56` distintos, no.
- **IPv4 mapeada** (`::ffff:x.x.x.x`): tratada como IPv4. Test de regresión explícito frente a CVE-2026-30827.

## Proxy y X-Forwarded-For

```ts
app.set("trust proxy", rateLimitConfig.trustProxyHops);
```

Valor **numérico**, nunca booleano. `0` en local, test y CI; `1` en staging/producción tras Nginx Proxy Manager (un único salto, conforme a `ADR-0012`).

`app.set("trust proxy", true)` queda prohibido: haría que Express tomase el extremo izquierdo de `X-Forwarded-For`, controlable por el cliente, permitiendo falsificar la IP o suplantar la de un tercero.

Con `hops = 0` la cabecera se ignora por completo — verificado con dos tests que demuestran que variar `X-Forwarded-For`, incluso con una cadena larga, **no** permite bypass.

## Respuesta 429

```json
{ "error": { "code": "RATE_LIMITED", "message": "Demasiadas solicitudes. Inténtalo de nuevo más tarde." } }
```

El `handler` del limitador responde y termina el ciclo; **no** delega en `errorHandlerMiddleware`, que siempre devolvería `500`. El cuerpo no expone IP, clave, contador, límite, ventana, store ni stack; el mensaje no contiene ningún dígito (verificado por test).

## Cabeceras

`standardHeaders: "draft-8"` y `legacyHeaders: false`. Se emiten `RateLimit` y `Retry-After`; no se emite ninguna `X-RateLimit-*`.

Evidencia en runtime sobre la API compilada:

```text
GET /api/jobs   → RateLimit: "300-in-15min"; r=299; t=900
GET /health     → (sin cabeceras de límite)
```

## Archivos creados

```text
docs/specs/features/api-rate-limiting.md
apps/api/src/config/rate-limit.config.ts
apps/api/src/config/rate-limit.config.test.ts
apps/api/src/middlewares/rate-limit.middleware.ts
apps/api/src/middlewares/rate-limit.middleware.test.ts
apps/api/src/tests/rate-limit.integration.test.ts
docs/sprints/b3-abuse-01-api-rate-limiting-final-report.md
```

## Archivos modificados

```text
apps/api/package.json     (+1 línea: express-rate-limit 8.6.2)
apps/api/src/app.ts       (trust proxy + montaje de limitadores)
apps/api/.env.example     (+29 líneas: 9 variables documentadas)
pnpm-lock.yaml            (+23 líneas, 0 eliminaciones)
```

Once archivos en total, exactamente los autorizados.

## Tests RED

Los tres ficheros se escribieron antes que la implementación y fallaron de forma causal:

```text
rate-limit.config.test.ts      → Cannot find module './rate-limit.config.js'
rate-limit.middleware.test.ts  → Cannot find module './rate-limit.middleware.js'
rate-limit.integration.test.ts → 401 en lugar de 429 (ningún limitador montado)

Test Files 3 failed (3) · Tests 14 failed | 8 passed (22)
```

## Tests GREEN

```text
Test Files 3 passed (3) · Tests 82 passed (82)
```

## Tests y verificaciones

| Gate | Antes | Después |
|---|---|---|
| `pnpm install --frozen-lockfile` | exit 0 | exit 0 |
| `prisma generate` | exit 0 | exit 0 |
| `@jobit/api typecheck` | exit 0 | exit 0 |
| `@jobit/api test` | **45 ficheros, 532 tests** | **48 ficheros, 614 tests** |
| `@jobit/api build` | exit 0 | exit 0 |
| `@jobit/web lint` | exit 0 | exit 0 |
| `@jobit/web typecheck` | exit 0 | exit 0 |
| `@jobit/web test` | 27 ficheros, 404 tests | 27 ficheros, 404 tests |
| `@jobit/web build` | exit 0 | exit 0 |
| `@jobit/web test:e2e` | 12/12 | **12/12** |
| `git diff --check` | exit 0 | exit 0 |

`+3` ficheros y `+82` tests; **cero regresiones** en los 532 preexistentes.

## Resultado de typecheck

API y web: exit 0.

## Resultado de tests

API 614/614; web 404/404.

## Resultado de lint

Web: exit 0, sin warnings. (`@jobit/api` no define script de lint.)

## Resultado de build

API y web: exit 0.

## Resultado de E2E

Playwright **12/12** con el harness documentado del repositorio (Postgres efímero, `prisma migrate deploy`, seed existente, API en `:4000` con `NODE_ENV=production`, web en `:3000`). El harness **no fue modificado**.

Relevante: la ejecución corrió con los límites **productivos** (registro 5/hora) y los tres registros de la suite pasaron sin agotar el cupo.

## Evidencia runtime

Contra la API compilada y en ejecución:

```text
GET /health        → 200 {"status":"ok","service":"jobit-api"}  ·  sin cabeceras de límite
GET /api/jobs      → 401  ·  RateLimit: "300-in-15min"; r=299; t=900
                          ·  RateLimit-Policy: "300-in-15min"; q=300; w=900
                          ·  sin X-RateLimit-*
```

Confirma que el limitador está activo con los defaults productivos, que `/health` está exento y que las cabeceras legacy no se emiten.

## Seguridad y privacidad

- `trust proxy` nunca es `true`; solo un entero validado en 0–10.
- `X-Forwarded-For` se ignora sin proxy de confianza (dos tests lo demuestran).
- La IP se trata de forma **efímera y en memoria**: no se persiste (sin Prisma en el middleware) y **no se registra** (sin `console`, sin logger).
- No se añaden logs, métricas ni observabilidad.
- La respuesta no expone contadores, límites ni detalles internos.
- No se desactivó ninguna validación de seguridad de la librería.
- No se introdujo ninguna API para resetear o inspeccionar stores.
- Auth, Prisma, frontend e infraestructura no fueron modificados.

## Decisiones técnicas

1. **Montaje exclusivo en `app.ts`**, no en los routers: preserva intactos los cuatro ficheros de test de auth, que montan `authRouter` en su propia app.
2. **`/health` exento por orden de montaje**, no por lista de exclusión: más simple y sin lógica condicional dentro del limitador.
3. **Configuración como función pura** con el entorno inyectado: permite 40 casos de test sin mutar `process.env`.
4. **Versión exacta `8.6.2`**, sin `^`: impide que un rango reintroduzca una versión afectada por el CVE.
5. **Defaults elevados en test en lugar de desactivar**: la protección sigue activa y se verifica con instancias de límite diminuto.

## Riesgos encontrados

Ninguno materializado. Los riesgos previstos quedan mitigados con evidencia: spoofing de cabecera (tests), `trust proxy` permisivo (entero validado), bypass IPv6 (versión + test de regresión), montaje tardío (orden verificado), bloqueo de CI/E2E (defaults de test + E2E en verde), contaminación entre tests (stores independientes por instancia), lockfile masivo (+2 paquetes).

## Problemas encontrados

Ninguno bloqueante. Nota operativa: la suite de integración de API requiere PostgreSQL en `localhost:5434`; se utilizó el contenedor de test **preexistente** del usuario (`jobit-postgres-test`), arrancado sin crearlo, modificarlo ni eliminar su volumen, y se dejó en ejecución.

## Cambios respecto al plan

Ninguno en arquitectura, políticas, dependencia, límites, archivos ni tests. El plan aprobado se ejecutó tal cual.

Detalle menor de implementación no especificado en el plan: los tests de integración fijan variables de entorno y recargan la app con `vi.resetModules()` para obtener stores limpios y límites diminutos, restaurando siempre `process.env`. Encaja en lo que el contrato autorizaba expresamente.

## Fuera de alcance respetado

No se tocó `B3-BACKUP-01`, `S22-PRIV-01`, `B4-STATE-02`, MFA, recuperación de contraseña, CAPTCHA, bloqueo permanente, listas negras, fingerprinting, device tracking, WAF, CDN, Redis, infraestructura, Nginx, DNS, staging, producción, deploy, métricas, alertas, Prisma, migraciones, modelos de datos, auth, JWT, cookies, frontend, Job Radar, Recruit, Candidate Discovery, proveedores de empleo ni workflows de CI.

**Hallazgo ajeno documentado y NO corregido** (verificación de enumeración exigida por el contrato): `POST /api/auth/register` devuelve `409 CONFLICT` cuando el email ya existe. El **mensaje es neutro** («No ha sido posible completar el registro»), pero el **código de estado** sigue distinguiendo un email existente de un registro correcto, lo que permite enumeración. `POST /api/auth/login` **no** enumera: devuelve `401` uniforme para email desconocido y contraseña incorrecta. Corregirlo alteraría un contrato HTTP de negocio y queda fuera de alcance. El limitador de registro encarece la explotación pero no la elimina.

**Hallazgo ajeno adicional**: `errorHandlerMiddleware` responde siempre `500`, incluso ante errores que deberían ser 4xx. Deuda preexistente; archivo prohibido, no se tocó.

## Deuda pendiente

1. Sin limitadores específicos para `GET /api/jobs/:id/match`, `GET /api/profile/me/matches` (coste de CPU) ni `POST /api/profile/me/avatar` (coste de disco): quedan cubiertos por el general.
2. `MemoryStore` no comparte estado entre instancias ni sobrevive a reinicios. Válido con la instancia única de `ADR-0012`; **condición de reapertura** si se introduce escalado horizontal.
3. Sin métricas ni alertas de rate limiting.
4. Enumeración por código de estado en `register` (ver arriba).

## Rollback

```bash
git checkout 86cdef33a78edccc778c90390906be07368321b8 -- \
  apps/api/package.json pnpm-lock.yaml apps/api/src/app.ts apps/api/.env.example
rm -f apps/api/src/config/rate-limit.config.ts \
      apps/api/src/config/rate-limit.config.test.ts \
      apps/api/src/middlewares/rate-limit.middleware.ts \
      apps/api/src/middlewares/rate-limit.middleware.test.ts \
      apps/api/src/tests/rate-limit.integration.test.ts \
      docs/specs/features/api-rate-limiting.md \
      docs/sprints/b3-abuse-01-api-rate-limiting-final-report.md
pnpm install --frozen-lockfile
pnpm --filter @jobit/api typecheck && pnpm --filter @jobit/api test
```

Mitigación intermedia sin rollback: todos los límites son variables de entorno; un falso positivo en producción se corrige elevando el valor y reiniciando, **sin desplegar código**.

## Estado Git

```text
Rama:              fix/b3-abuse-01-api-rate-limiting
HEAD:              86cdef33a78edccc778c90390906be07368321b8  (sin mover)
Commits propios:   0
Staging:            vacío
Working tree:      11 archivos (los autorizados)
Push / PR / Merge / Deploy:  ninguno
```

## Recomendación

El trabajo está completo y verificado: 614 tests de API, 404 de web, E2E 12/12 y evidencia en runtime de que la protección actúa con los defaults productivos. Procede revisión humana del diff y, si resulta conforme, autorización separada de commit, push, PR, CI y merge.

```text
IMPLEMENTATION_STATUS:
READY_FOR_REVIEW

B3-ABUSE-01:
PENDING_COMMIT_PR_CI_AND_MERGE
```
