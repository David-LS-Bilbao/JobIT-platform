# ADR-0009: Decisiones de implementación — Sprint 01 Auth

## Estado

Aceptada.

## Contexto

El Sprint 01 Auth implementa el módulo M01 (registro, login, logout, ruta privada `/me`) conforme a la spec `docs/specs/features/auth.md` y a las decisiones arquitectónicas de ADR-0005 (Express + Zod), ADR-0006 (JWT híbrido), ADR-0007 (REST `/api`), ADR-0008 (PostgreSQL + Prisma).

La fase de TDD Planning del sprint identificó nueve decisiones técnicas que ADR-0006 dejó abiertas deliberadamente para el momento de implementación. Este ADR las cierra antes de que la implementación comience, evitando que se adopten implícitamente durante la escritura de código y garantizando trazabilidad documental.

Las decisiones D-A a D-I se cerraron con el operador durante la fase de TDD Planning y se registran aquí como contrato de implementación.

## Decisión

### D-A — Hashing del refresh token

El refresh token se genera como token opaco de 32 bytes aleatorios (256 bits de entropía) mediante `crypto.randomBytes(32)` de `node:crypto`. Se almacena en base de datos como su hash SHA-256 en hexadecimal, calculado con `createHash('sha256').update(token).digest('hex')` del mismo módulo.

No se usa bcrypt ni argon2 para el refresh token. Una función de coste adaptable no aporta ventaja de seguridad cuando la entrada ya tiene alta entropía uniforme; su único efecto sería degradar el rendimiento de cada operación de refresco sin reducir el riesgo real. bcryptjs con factor de coste 12 queda reservado exclusivamente para el hashing de contraseñas de usuario.

### D-B — Layout de archivos de tests de integración

Los tests de integración de endpoints Auth se distribuyen en archivos separados por endpoint bajo `apps/api/src/auth/`:

- `auth.routes.register.test.ts`
- `auth.routes.login.test.ts`
- `auth.routes.logout.test.ts`
- `auth.routes.me.test.ts`

Esta separación permite que cada prompt de implementación de los pasos 4.4 a 4.6 declare un único archivo de test en su lista de `Archivos permitidos`, manteniendo los prompts atómicos, revisables y con alcance cerrado. Un archivo monolítico `auth.routes.test.ts` haría que un solo prompt abarcara toda la suite de auth, lo que viola el principio de prompts pequeños del brief.

### D-C — Descubrimiento de tests por Vitest

El script `test` de `apps/api/package.json` se actualiza en el paso 4.1 de:

```json
"test": "TMPDIR=/tmp TEMP=/tmp TMP=/tmp vitest run src/routes/health.routes.test.ts"
```

a:

```json
"test": "vitest run"
```

Con esto Vitest descubre todos los archivos `**/*.test.ts` del paquete por defecto, sin necesidad de listar cada nuevo archivo de test. El cambio se incluye explícitamente en los `Archivos permitidos` del prompt del paso 4.1.

### D-D — Carga de `.env.test` y configuración de entorno de test

Se crea `apps/api/vitest.config.ts` en el paso 4.1 con configuración que carga las variables de entorno de `.env.test` antes de ejecutar la suite. `DATABASE_URL_TEST` en ese archivo apunta a la base de datos `jobit_test` de PostgreSQL local.

La cookie del refresh token se configura sin el atributo `Secure` en localhost (SameSite=Lax, HttpOnly en todos los entornos). El atributo `Secure` se activa únicamente en producción, condicionado por `NODE_ENV === 'production'`. Esto garantiza que los tests de integración puedan leer y enviar la cookie en HTTP local sin configuración adicional.

### D-E — Auto-login en `POST /api/auth/register`

El endpoint de registro emite access token y refresh token (en cookie HttpOnly) exactamente igual que el endpoint de login. La spec establece que "el candidato queda autenticado y se le redirige al dashboard o al formulario de perfil inicial" tras el registro, lo que implica que la sesión se inicia en el mismo request.

El test de registro verificará que la respuesta contiene un access token y que la cookie `refreshToken` está presente con los atributos HttpOnly y SameSite=Lax.

### D-F — Superficie de `GET /api/auth/me`

La respuesta de `/me` expone únicamente:

```json
{ "id": "...", "email": "...", "role": "CANDIDATE", "createdAt": "..." }
```

No se exponen `passwordHash`, `updatedAt` ni ningún campo de la tabla `RefreshToken`. La limitación de superficie reduce el riesgo de filtración accidental de datos sensibles y es coherente con el principio de mínimo privilegio aplicado a respuestas de API.

### D-G — Aislamiento entre tests de integración

Cada `describe` de los archivos de tests de integración ejecuta en `beforeEach`:

```sql
TRUNCATE "User", "RefreshToken" RESTART IDENTITY CASCADE;
```

El `globalSetup` de Vitest ejecuta `prisma migrate deploy` una única vez antes de lanzar la suite completa, para garantizar que el schema de la base de datos `jobit_test` está actualizado. Los tests no usan SQLite ni mocks de Prisma: se ejecutan contra PostgreSQL real, lo que garantiza que las pruebas de integridad referencial, los índices únicos y el comportamiento de cascada coinciden con producción.

### D-H — Payload del access token

El access token JWT contiene únicamente `{ sub: userId }`. No incluye `role`, `email` ni ningún otro campo.

El motivo es minimizar la superficie de leak: si el token se expone en logs, cabeceras o tráfico interceptado, la información comprometida es solo el identificador de usuario. Cualquier dato adicional (rol, perfil) se resuelve con una consulta a la base de datos en el endpoint que lo necesite, como `/me`. La penalización de rendimiento es aceptada deliberadamente como parte de la estrategia de defensa en profundidad.

### D-I — Test de logout idempotente

El archivo `auth.routes.logout.test.ts` incluye un test adicional que verifica el comportamiento idempotente del logout:

```
it("is idempotent: returns 204 without error when called without an active session")
```

El endpoint `POST /api/auth/logout` debe devolver 204 tanto si hay un refresh token válido como si no existe sesión activa (cookie ausente, token ya revocado o token expirado). Esto evita que el cliente tenga que gestionar errores en el flujo de cierre de sesión cuando el token ya no es válido.

## Consecuencias positivas

- Las nueve decisiones quedan trazadas antes de la primera línea de código, reduciendo decisiones implícitas durante la implementación.
- El layout por archivo (D-B) mantiene los prompts de implementación pequeños y con alcance cerrado, en línea con el contrato del brief de Sprint 01.
- El uso de `node:crypto` para el refresh token (D-A) elimina una dependencia externa para una operación que no requiere función de coste adaptable.
- El payload mínimo del access token (D-H) aplica el principio de mínimo privilegio de forma consistente con ADR-0007 (REST) y ADR-0006 (JWT híbrido).
- La estrategia de aislamiento por TRUNCATE (D-G) es determinista y portable entre entornos de CI sin necesidad de fixtures complejos.

## Riesgos

- **D-A**: sha256 sin coste adaptable es seguro únicamente si el refresh token tiene entropía suficiente. Cualquier reducción de la longitud del token por debajo de 32 bytes (256 bits) invalida esta decisión y requiere revisión del ADR.
- **D-C**: actualizar el script de test en `package.json` activa el descubrimiento global. Si existieran archivos `*.test.ts` con errores en otros módulos del paquete, el pipeline de tests fallará al ejecutar la suite completa. Se asume que el estado del paquete es limpio en el momento del paso 4.1.
- **D-G**: el TRUNCATE por `beforeEach` impacta el rendimiento de la suite a medida que crece el número de tests. Es aceptable en MVP; si la suite supera los 50 tests de integración, se debe evaluar una estrategia alternativa de aislamiento.
- **D-H**: el payload mínimo del access token implica una query extra a la base de datos en cada llamada a `/me`. Aceptado por seguridad; si `/me` se llama con frecuencia muy alta, puede requerir caché de sesión en el futuro.
- Si la spec `docs/specs/features/auth.md` se modifica después de cerrar este ADR, las decisiones deben revisarse para mantener coherencia.

## Alternativas consideradas

### bcrypt para el refresh token (descartada, aplica a D-A)

bcryptjs con factor de coste 12 para hashear el refresh token. Descartada porque el coste adaptable de bcrypt está diseñado para contrarrestar ataques de fuerza bruta cuando la entrada tiene baja entropía (como contraseñas humanas). Un token de 32 bytes aleatorios tiene entropía tan alta que la fuerza bruta es computacionalmente inviable con o sin coste adaptable. Usar bcrypt aquí solo añadiría latencia sin reducir el riesgo real.

### Tests en un único archivo `auth.routes.test.ts` (descartada, aplica a D-B)

Concentrar todos los tests de integración de auth en un único archivo. Descartada porque obliga a que un prompt de implementación incluya la ruta completa del archivo monolítico en `Archivos permitidos`, agregando más responsabilidad por prompt de la que el contrato del brief permite. La separación por endpoint es más costosa en número de archivos pero más segura en el flujo de prompts.

### SQLite o mock de Prisma para tests (descartada, aplica a D-G)

Usar SQLite en memoria o mocks de Prisma para aislar los tests de la base de datos real. Descartada porque la divergencia entre SQLite y PostgreSQL en comportamiento de índices únicos, tipos de datos, cascadas y transacciones ha causado falsos positivos en proyectos anteriores donde los tests pasaban en CI pero fallaban en producción. Los tests de integración de Auth deben ejecutarse contra PostgreSQL real para ser significativos.

### Access token con `role` y `email` en el payload (descartada, aplica a D-H)

Incluir campos adicionales en el JWT para evitar queries a la base de datos. Descartada porque cualquier campo adicional en el token amplía la superficie de filtración si el token se expone. La query extra en `/me` es un coste asumido deliberadamente por defensa en profundidad.

## Impacto en specs

Este ADR no modifica `docs/specs/features/auth.md`. Las correcciones C1-C7 de la spec ya fueron aplicadas en el commit b1638b1 y son coherentes con las decisiones D-A a D-I aquí registradas.

La decisión D-E (auto-login en registro) confirma la lectura de la spec: "el candidato queda autenticado" tras el registro implica emisión de tokens, no solo creación del usuario.

La decisión D-F (superficie de `/me`) concreta el criterio de aceptación "GET /api/auth/me devuelve datos del usuario autenticado" sin exponer campos sensibles.

## Impacto en fase 4.1

- El prompt del paso 4.1 debe incluir `apps/api/package.json` y `apps/api/vitest.config.ts` en su lista de `Archivos permitidos` para implementar D-C y D-D.
- El prompt del paso 4.2 cierra el schema Prisma con los modelos `User` y `RefreshToken` conforme a ADR-0008 y D-A (campo `tokenHash` de tipo `String`, nunca texto plano).
- Los prompts de los pasos 4.3 a 4.6 declaran archivos de test conforme a D-B, uno por endpoint, en sus respectivos `Archivos permitidos`.
- El entorno de test (`.env.test`, base de datos `jobit_test`) debe estar operativo antes de ejecutar cualquier test de integración. El paso 4.1 debe verificarlo.
