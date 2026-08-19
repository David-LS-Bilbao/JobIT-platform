# Spec: Continuidad de sesion y recuperacion transversal ante 401

> Fuente de verdad de la unidad `SESSION_CONTINUITY_AND_401_RECOVERY`.
> Findings que resuelve: `AUTH-03`, `B4-STATE-02`.
> Continua y amplia [`auth.md`](auth.md) (M01) sin sustituirla.
> Decision de arquitectura asociada: [`ADR-0014`](../../decisions/ADR-0014-session-continuity-refresh-contract.md).

## Objetivo

Permitir que la sesion del candidato sobreviva a una recarga de pagina y que una peticion
autenticada que recibe `401` por expiracion del access token se recupere de forma transversal,
sin que el candidato pierda el trabajo en curso ni tenga que volver a introducir credenciales.

## Usuario afectado

Candidato tech autenticado. Afecta a todas las superficies privadas: dashboard, JobIT CV,
portfolio, ofertas, guardadas y match.

## Problema actual

- El access token vive solo en memoria de React (ADR-0006). Al recargar la pagina la sesion se
  pierde aunque la cookie `refresh_token` siga siendo valida hasta 7 dias.
- No existe endpoint que consuma esa cookie: la persistencia del refresh token es funcionalmente
  inerte.
- El `401` se maneja de forma duplicada en diez puntos de llamada. Cada expiracion del access
  token (cada 15 minutos de uso) expulsa al candidato.
- No hay coordinacion: N peticiones concurrentes que reciben `401` producen N cierres de sesion y
  N redirecciones.

## Modelo de sesion

| Elemento | Contrato |
|---|---|
| Access token | JWT firmado, `expiresIn: 15m`, payload `{ sub: userId }`. Solo en memoria de React. Nunca en `localStorage` ni `sessionStorage`. |
| Refresh token | 32 bytes aleatorios en hexadecimal (256 bits). Persistido **solo como hash SHA-256**. |
| Transporte del refresh | Cookie `refresh_token`, `httpOnly`, `sameSite: lax`, `secure` solo en produccion, `maxAge` 7 dias. Unica via admitida. |
| Expiracion | Absoluta y comun a toda la familia. **Sin expiracion deslizante.** |

## Session bootstrap / reload

```text
montaje de la app  →  sessionStatus = "bootstrapping"
                   →  intento unico de recuperacion via POST /api/auth/refresh
                        200  →  setSession(auth)  →  "authenticated"
                        401  →  "anonymous"        (terminal)
                        5xx / red  →  "unavailable" (transitorio)
```

Reglas:

- Durante `"bootstrapping"` no se renderiza contenido privado y **no se redirige** a `/login`.
- `isAuthenticated` sigue siendo `accessToken !== null`: nunca es `true` sin token real en memoria.
- `sessionStatus` no se persiste: se deriva en cada arranque de una respuesta real del servidor.
- Un unico intento por montaje. Sin bucle, sin temporizador.

## Token family

Una **familia** es el conjunto de refresh tokens derivados de una misma autenticacion inicial. Se
identifica por `RefreshToken.familyId`, un uuid v4 opaco generado por el servidor. Una familia
equivale a una sesion de un navegador o dispositivo; un usuario con N dispositivos tiene N familias
independientes.

| Concepto | Definicion |
|---|---|
| Root token | Primer refresh token de la familia (login o register). `familyId` nuevo; ninguna otra fila lo apunta. |
| Predecessor | `revokedAt != null` **y** `replacedById != null`. Fue sustituido por una rotacion. |
| Successor | Creado por una rotacion valida. Hereda `familyId` y `expiresAt`. |
| Current token | Unico miembro con `revokedAt IS NULL` y `expiresAt > now`. Unico que puede rotar. |
| Familia efectivamente revocada | Sin ningun miembro usable. Estado efectivo, no causa. |

### Estados posibles de un token

| Estado | `revokedAt` | `replacedById` | `expiresAt` | Uso como refresh |
|---|---|---|---|---|
| `CURRENT` | null | null | `> now` | si, rota |
| `EXPIRED` | null | null | `<= now` | no |
| `ROTATED` | no null | no null | cualquiera | solo via ventana de concurrencia; nunca rota |
| `REVOKED_NO_LINEAGE` | no null | null | cualquiera | nunca (logout o revocacion de familia) |

`revokedAt == null AND replacedById != null` es imposible: ambos se escriben en la misma transaccion.

## Simple lineage

```text
predecessor.replacedById → successor.id      (relacion Prisma `replacedBy`)
successor.replaces       → predecessor       (back-relation, sin columna propia)
```

**Propiedad de cadena simple.** Los miembros de una familia forman un camino simple enraizado en el
root token, sin bifurcaciones ni convergencias:

- `familyId` solo se propaga copiandolo del predecessor al crear un successor; el root recibe un
  uuid nuevo. Un `familyId` equivale a una sola cadena.
- `replacedById @unique` impide que dos predecessors apunten al mismo successor: sin convergencia.
- El CAS mas `SERIALIZABLE` con retry garantizan un solo successor por rotacion: sin bifurcacion.
- `replacedById` es escalar: cada nodo tiene a lo sumo un sucesor.

**Corolario.** Si `familyUsable == 1`, ese miembro es la cola unica de la cadena y **todo miembro con
`replacedById != null` es un ancestro suyo**. Es lo que permite clasificar sin recorrer el linaje ni
cargar el successor directo.

## Modelo de datos

```prisma
model RefreshToken {
  id           String    @id @default(uuid())
  userId       String
  familyId     String
  tokenHash    String    @unique
  expiresAt    DateTime
  revokedAt    DateTime?
  createdAt    DateTime  @default(now())
  replacedById String?   @unique

  user       User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  replacedBy RefreshToken? @relation("RefreshTokenRotation", fields: [replacedById], references: [id], onDelete: SetNull)
  replaces   RefreshToken? @relation("RefreshTokenRotation")

  @@index([familyId])
}
```

| Campo / constraint | Finalidad |
|---|---|
| `familyId` | Agrupar la sesion; revocar la familia en una operacion set-based; consultar el estado efectivo en la clasificacion. |
| `@@index([familyId])` | Soportar el conteo de estado y el `updateMany` de revocacion, ambos en el camino caliente. Justificado por rendimiento; la correccion del contrato no depende de el. |
| `replacedById` | Distinguir «revocado por rotacion» de «revocado sin rotacion» (logout o revocacion de familia). Unica señal persistida que separa concurrencia legitima de reutilizacion. |
| `replacedById @unique` | Impedir la **convergencia** de linaje: dos predecessors no pueden referenciar el mismo successor. Requisito de Prisma para la auto-relacion 1:1. **No** es lo que impide que un predecessor tenga dos successors: es un campo escalar. |
| `tokenHash @unique` | Impedir dos filas con el mismo hash; proveer el indice inexistente; hacer determinista la relectura post-carrera. |

No se persiste ningun marcador forense:

```text
COMPROMISE_CAUSE_PERSISTED:  NO
FAMILY_EFFECTIVELY_REVOKED:  YES
```

Puede determinarse siempre si una familia sigue activa, pero **no** reconstruirse a posteriori si su
revocacion se debio a un logout, a una deteccion de replay o a expiracion. Limitacion aceptada: el
contrato exige comportamiento externo identico en los tres casos, y ninguna decision de autorizacion
consulta la causa.

## Endpoint

### POST /api/auth/refresh

**Autenticacion.** No monta `requireAuth`. La unica prueba de autorizacion es la cookie.

**Credencial admitida.** `refresh_token`, `httpOnly`, leida exclusivamente via
`req.cookies["refresh_token"]`.

```text
PROHIBIDO como via del refresh token:
  body · query · URL · Authorization bearer · header propio del frontend ·
  localStorage · sessionStorage
```

El handler no declara schema de body, no accede a `req.body` ni a `req.query` y no lee
`Authorization` en ninguna rama.

**Exito `200`** — dos resultados internos, una sola forma externa:

```json
{ "accessToken": "<jwt 15m>",
  "user": { "id": "...", "email": "...", "role": "...", "createdAt": "..." } }
```

Devolver `user` es imprescindible: en un reload es el unico modo de rehidratar la identidad sin una
segunda llamada.

| Resultado interno | HTTP | Cookie | Escrituras |
|---|---|---|---|
| `ROTATED` | 200 | `Set-Cookie` nuevo, `expires: successor.expiresAt` | CAS + create + link |
| `LEGITIMATE_CONCURRENT_REFRESH` | 200 | ninguna | **ninguna** |
| Clase A (`FAIL_*`, `REPLAY_OUT_OF_WINDOW`) | 401 | `clearCookie` | replay: revocacion de familia |
| Clase B (`INVARIANT_VIOLATION`, `INTERNAL_TRANSACTION_FAILURE`) | 500 | **intacta** | ninguna (rollback) |

**Rate limiting.** Hereda `generalRateLimiter` montado en `/api`. Sin limitador dedicado.

**CSRF.** `POST` mas `SameSite=Lax`: el navegador no envia la cookie en un POST cross-site.

## Cookie

| Atributo | Login / register | Rotacion | Nota |
|---|---|---|---|
| `httpOnly` | `true` | `true` | sin cambio |
| `secure` | `NODE_ENV === "production"` | igual | sin cambio |
| `sameSite` | `"lax"` | `"lax"` | mitigacion CSRF del endpoint |
| `path` | no fijado (`/`) | igual | sin cambio |
| `domain` | no fijado (host-only) | igual | sin cambio |
| vida | `maxAge: 604800000` | **`expires: successor.expiresAt`** | ver abajo |

`successor.expiresAt = predecessor.expiresAt`, exactamente. La familia comparte la expiracion
absoluta fijada en el login. Reutilizar `maxAge` completo en cada rotacion la convertiria en
expiracion deslizante: **prohibido**. Por eso la cookie rotada usa `expires`, de modo que caduca en
el navegador en el mismo instante en que el token deja de ser valido en base de datos.

## Rotacion

```text
presentedAt = clock.now()        UNA sola vez, al recibir la presentacion, ANTES del bucle de retry

por cada intento:
  attemptNow = clock.now()

  CAS:  updateMany({ tokenHash, revokedAt: null, expiresAt: { gt: attemptNow } },
                   { revokedAt: attemptNow })

  count === 1  →  ROTATED
       siblingsUsable = count(familyId, revokedAt: null, expiresAt > attemptNow)
       siblingsUsable > 0  →  INVARIANT_VIOLATION (clase B, rollback)
       crear successor { mismo familyId, mismo expiresAt, tokenHash nuevo }
       enlazar predecessor.replacedById = successor.id

  count  >  1  →  INVARIANT_VIOLATION   (imposible con tokenHash @unique)
  count === 0  →  clasificacion post-carrera
```

## Clasificacion post-carrera

Queda **prohibido** clasificar con estado leido antes del CAS: el paso del CAS es la primera
operacion sobre la fila y toda lectura de clasificacion ocurre despues, dentro de la misma
transaccion.

```text
C1. predecessor = findUnique({ tokenHash })                          // RELECTURA
    !predecessor                → FAIL_UNKNOWN         (A)
    revokedAt === null          → FAIL_EXPIRED         (A)
    replacedById === null       → FAIL_NO_LINEAGE      (A)   barrera del logout

C2. familyUsable = count({ familyId, revokedAt: null, expiresAt: { gt: attemptNow } })
    === 0                       → FAIL_FAMILY_INACTIVE (A)
    >  1                        → INVARIANT_VIOLATION  (B, 500)
    === 1                       → continuar

C3. age = presentedAt − predecessor.revokedAt
    age > 10000 ms              → REPLAY_OUT_OF_WINDOW → revocacion de familia (A, 401)

C4. user = findUnique({ id: predecessor.userId })
    !user                       → FAIL_USER_MISSING    (A)
    → LEGITIMATE_CONCURRENT_REFRESH
```

El estado de familia (C2) se evalua **antes** que la ventana (C3): asi una familia cerrada por logout
nunca alcanza la logica de gracia ni provoca escrituras inutiles.

## Contrato de familyUsable

```text
familyUsable = count(familyId = F ∧ revokedAt IS NULL ∧ expiresAt > attemptNow)

== 0   FAMILY_INACTIVE       clase A · 401 · clearCookie · ninguna escritura
== 1   estado normal          continuar clasificacion
 > 1   INVARIANT_VIOLATION    clase B · 500 · sin access token · sin clearCookie · sin revocacion
```

El caso `> 1` es una **asercion de runtime** que detecta una violacion del invariante «un solo current
por familia» y **falla en cerrado**: no elige arbitrariamente un current, no emite credencial y no
destruye la sesion, porque con estado corrupto no puede saberse cual seria correcto. El invariante lo
garantizan el CAS, `SERIALIZABLE` con retry y el camino de gracia sin escrituras; la asercion solo lo
detecta. Simetricamente, tras ganar el CAS `siblingsUsable` debe ser `0`.

## presentedAt frente a attemptNow

```text
presentedAt   capturado UNA vez, antes del bucle de retry.  Decide SOLO la ventana.
attemptNow    recalculado en cada intento.  Decide expiresAt, revokedAt de escrituras nuevas,
              estado actual de familia y timestamps operativos.

LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS = 10000
age = presentedAt − predecessor.revokedAt
age <= 10000  →  dentro (LIMITE INCLUSIVE)
age  > 10000  →  replay
```

Motivo: con `attemptNow` una peticion llegada **dentro** del plazo podia convertirse en replay solo
porque PostgreSQL la hizo esperar y reintentar. El conflicto de serializacion no es culpa del cliente
y no debe cambiar su clasificacion. Simetricamente, una peticion llegada **fuera** no entra en gracia
mas tarde.

**Edad negativa** (la rotacion se comprometio despues de que la peticion llegara) es el caso de
concurrencia legitima mas claro posible y se admite sin ajuste.

## Concurrencia legitima y avance multigeneracion

```text
predecessor presentado
+ replacedById != null
+ familyUsable == 1
+ presentedAt − revokedAt <= 10000 ms
+ el usuario existe
→ LEGITIMATE_CONCURRENT_REFRESH
```

**El estado del successor directo es irrelevante.** Caso multigeneracion:

```text
T0 → T1   (rotacion de la peticion A, comprometida)
la peticion B presenta T0 y queda pendiente de clasificacion o de retry
T1 → T2   (rotacion de la peticion C, legitima, se adelanta)
B clasifica: T0.replacedById = T1, T1.revokedAt != null, la familia sigue sana con T2
```

Es **avance de linaje legitimo**, no replay. Por el corolario de cadena simple, si
`familyUsable == 1` el predecessor es ancestro del current, tanto si su successor directo sigue
vivo como si ya roto. Tratarlo como replay expulsaria al titular en uso multipestaña normal.

Respuesta del perdedor:

```text
200 · { accessToken, user } · SIN Set-Cookie · sin rotacion · sin successor · CERO escrituras
```

No se le devuelve el token del descendiente vivo: solo existe como hash y su valor en claro no se
persiste. No lo necesita: la cookie del navegador, compartida entre pestañas, ya lo contiene.

**La ventana no identifica de forma infalible a un cliente legitimo.** Es una clasificacion temporal
controlada: un atacante que reproduzca el predecessor dentro de la ventana es indistinguible de la
peticion concurrente legitima. Lo que la ventana acota no es la identidad sino la duracion de esa
indistinguibilidad. Riesgo residual documentado, no mitigado.

## Reuse / replay

Constituye replay **un unico caso**: un predecessor con linaje, en una familia que mantiene
exactamente un current usable, presentado **fuera** de la ventana.

| Estado interno | Clase | Revoca familia | HTTP |
|---|---|---|---|
| `FAIL_NO_COOKIE` · `FAIL_UNKNOWN` · `FAIL_EXPIRED` · `FAIL_NO_LINEAGE` · `FAIL_FAMILY_INACTIVE` · `FAIL_USER_MISSING` | A | no | 401 |
| `REPLAY_OUT_OF_WINDOW` | A | **si** | 401 |
| `INVARIANT_VIOLATION` · `INTERNAL_TRANSACTION_FAILURE` | B | no | 500 |

No es replay: un token desconocido, expirado, cerrado por logout, de una familia inactiva, el
perdedor de una carrera dentro de la ventana —incluido el caso multigeneracion—, una violacion de
invariante ni ningun fallo interno.

## Revocacion de familia

```text
updateMany({ familyId, revokedAt: null } → revokedAt = attemptNow)
```

Dentro de la misma transaccion `SERIALIZABLE` que detecto el replay. Alcance: **solo la familia
afectada**; `userId` no interviene, de modo que otras sesiones del usuario quedan intactas. Efecto
permanente: no existe camino que reactive una familia.

Access tokens ya emitidos: los JWT son stateless y **no pueden revocarse**. Ventana residual maxima
de 15 minutos, acotada por su TTL. No se introduce blacklist global de access tokens.

## FAMILY_REVOCATION_INVARIANT

```text
Si REPLAY_DETECTION(F) o LOGOUT(F) termina satisfactoriamente, entonces para esa familia F:

    count( familyId = F ∧ revokedAt IS NULL ∧ expiresAt > now ) == 0

en TODOS los interleavings aceptados. Una rotacion concurrente NO puede escapar.
```

**No basta que el `updateMany` sea set-based.** Bajo `READ COMMITTED` existe un interleaving que lo
rompe: la transaccion de rotacion reclama el current e inserta el successor sin comprometer; la
transaccion de revocacion toma su snapshot, ve el current como usable, se bloquea sobre esa fila, y
al desbloquearse reevalua solo esa fila —que ya esta revocada— sin reexaminar nunca el successor
insertado despues. El resultado seria una familia dada por revocada con un token vivo.

La garantia se apoya en:

1. `SERIALIZABLE` como nivel de aislamiento de ambas operaciones.
2. Una **colision de escritura que siempre se produce**: toda rotacion reclama el current de F y toda
   revocacion de familia revoca ese mismo current, porque es el unico miembro con `revokedAt IS NULL`.
   Bajo `SERIALIZABLE` la segunda transaccion no reevalua el conjunto en silencio: falla con un
   conflicto reintentable.
3. La politica de retry acotada, que reejecuta sobre estado ya establecido.
4. Las aserciones de invariante de la aplicacion.
5. Tests de interleaving **determinista** que fuerzan el orden exacto.

El contrato **no** descansa en ninguna afirmacion sobre la granularidad interna de los predicate
locks de PostgreSQL. `REPEATABLE READ` se evaluo y se descarto: aborta ante conflicto de fila pero no
protege el conjunto leido frente a inserciones.

## Aislamiento y retry

| Operacion | Aislamiento |
|---|---|
| `refreshSession` | **SERIALIZABLE** |
| `logout` | **SERIALIZABLE** |
| `login` / `register` | `READ COMMITTED` (default). `familyId` nuevo: ningun otro actor puede leer ni escribir esa familia. |

```text
RETRYABLE_TRANSACTION_CONFLICT
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034"

Prisma documenta P2034 como «write conflict or deadlock», no como mapeo exclusivo de SQLSTATE
40001. Se trata como la unica señal reintentable, que es el codigo estable expuesto por el cliente.
No se inspeccionan mensajes de texto ni SQLSTATE crudos.

MAX_SERIALIZATION_RETRIES: 2        TOTAL_MAX_ATTEMPTS: 3        BACKOFF: ninguno

RETRYABLE:      solo P2034
NO retryable → clase B: P2002 · P2003 · P2025 · otros codigos Prisma · errores no-Prisma ·
                        errores de conexion · InvariantViolation
NO retryable → clase A: TerminalRefreshFailure y todos los `outcome` (son returns, no throws)
AGOTAMIENTO:    INTERNAL_TRANSACTION_FAILURE → 500 · sin clearCookie · sin revocacion
```

Justificacion del valor `2`: la contencion es de una sola familia (pestañas de un mismo navegador);
el conflicto no se autoperpetua, porque el reintento observa estado establecido y el camino de
concurrencia legitima no escribe; tres intentos mantienen el peor caso muy por debajo del timeout de
la suite; un limite alto convertiria una tormenta de contencion en un multiplicador de trabajo de
base de datos en un endpoint no autenticado.

El reintento **no altera la ventana**: `presentedAt` se captura antes del bucle.

## Logout

Pasa a revocar la **familia completa**, en transaccion `SERIALIZABLE` con la misma politica de retry.

| Caso | Comportamiento |
|---|---|
| Cookie del current | revoca toda la familia · `clearCookie` · `204` |
| Cookie de un predecessor | resuelve por hash, toma su `familyId`, revoca toda la familia · `clearCookie` · `204` |
| Sin cookie | no-op · `clearCookie` · `204` |
| Familia ya revocada | `updateMany` afecta 0 filas · `clearCookie` · `204` idempotente |
| Concurrente con rotacion | se cumple `FAMILY_REVOCATION_INVARIANT` |
| Fallo interno | `500` generico **con** `clearCookie` |

El `WHERE` es siempre por `familyId`, nunca por `userId`: multi-dispositivo preservado.

La asimetria del fallo interno es deliberada: en logout la intencion explicita del usuario es
destruir la credencial en ese terminal, y retirarla es siempre la accion protectora; en refresh, en
cambio, limpiar destruiria una sesion que sigue siendo valida.

**El logout queda estructuralmente fuera de la ventana de gracia**, por dos barreras de estado
persistido independientes: el current revocado por logout tiene `replacedById === null`
(`FAIL_NO_LINEAGE`, termina antes de C2), y cualquier predecessor con linaje encuentra
`familyUsable == 0` (`FAIL_FAMILY_INACTIVE`, termina antes de C3). Ninguna depende de temporizacion.

## Clases de error

```text
CLASE A — TERMINAL SESSION FAILURE
  FAIL_NO_COOKIE · FAIL_UNKNOWN · FAIL_EXPIRED · FAIL_NO_LINEAGE ·
  FAIL_FAMILY_INACTIVE · FAIL_USER_MISSING · REPLAY_OUT_OF_WINDOW

  401 · { "error": { "code": "UNAUTHORIZED", "message": "Authentication required." } }
  byte a byte identico al de `requireAuth`, para todas las causas
  clearCookie: SI

CLASE B — INTERNAL / INVARIANT / TRANSACTION FAILURE
  INVARIANT_VIOLATION · INTERNAL_TRANSACTION_FAILURE

  500 · { "error": { "code": "INTERNAL_ERROR", "message": "Internal server error." } }
  clearCookie: NO · revocacion: NO · access token: NO
```

Un fallo interno **nunca** puede presentarse como sesion invalida: tras el rollback el predecessor
sigue siendo `CURRENT` y la sesion es perfectamente valida. El router del refresh captura la clase B
y responde el mismo, sin delegar en el middleware de error, para que el cuerpo sea identico en
desarrollo y en produccion y para que el objeto de error de Prisma no llegue a ningun log.

Nunca se revela, ni en cuerpo ni en cabeceras ni en logs: `invalid`, `expired`, `revoked`,
`replayed`, `family compromised`, `unknown token`, `user missing`, conflicto de serializacion,
recuento de reintentos, codigo Prisma, SQLSTATE, hash, token, `familyId`, `id`, `userId`, email ni
stack.

## Recuperacion centralizada de 401

```text
CENTRAL_401_RECOVERY_SCOPE:  apiRequest  +  apiUpload
```

Ambos comparten `ensureRefreshed()`, single-flight, `AuthBridge`, retry maximo 1, token fresco, no
recursion y la distincion terminal/transitorio.

```text
peticion autenticada → 401 → ensureRefreshed() → refresh compartido → reintento unico
```

Condicion de recuperabilidad, todas obligatorias:

```text
status === 401
∧ se proporciono token          (la peticion pretendia estar autenticada)
∧ no se ha reintentado ya       (retry maximo = 1)
∧ no es la propia llamada de refresh
```

`login`, `register` y las lecturas publicas no pasan token: su `401` nunca entra en el flujo.

### apiUpload

Recupera igual que `apiRequest`, con dos exigencias adicionales:

- **No se fija `Content-Type` manualmente**: el navegador debe seguir construyendo
  `multipart/form-data; boundary=...`.
- El `FormData` original debe poder reutilizarse en el reintento.

## Single-flight

```text
N peticiones con 401  →  1 POST /api/auth/refresh  →  N waiters con el MISMO resultado
```

Resultado discriminado:

| Resultado | Reintento de la original | `onSessionLost()` | Error propagado |
|---|---|---|---|
| `refreshed` | **si, exactamente una vez**, con el token nuevo | no | ninguno |
| `session-lost` | no | **si, una sola vez por ciclo** | el `401` original |
| `transient` | **no** | **no** | `REFRESH_UNAVAILABLE` con `status 0` |

`REFRESH_UNAVAILABLE` tiene `status 0` deliberadamente, para que `isSessionExpiredError` sea `false`
y cada feature caiga en su rama de error generico con reintento manual, **sin modificar ninguna
feature**.

La promesa compartida se limpia siempre al terminar, de modo que un `401` posterior pueda iniciar un
ciclo nuevo. Sin ese saneamiento, un fallo transitorio dejaria la sesion bloqueada de forma
permanente.

## Retry maximo y no recursion

```text
MAX_RETRY: 1     por peticion original, y SOLO tras un refresh con resultado `refreshed`
```

Tres barreras independientes contra la recursion:

1. **Estructural**: la llamada de refresh no usa `apiRequest`; usa un cliente de bajo nivel que
   comparte URL, `credentials` y parseo, pero **no** contiene el manejador de `401`.
2. **Semantica**: la llamada de refresh no pasa token, de modo que aunque alcanzase el manejador
   incumpliria la condicion de recuperabilidad.
3. **Explicita**: marca interna y comprobacion de ruta, como red de seguridad ante refactors.

## Bootstrap transitorio / unavailable

Un refresh de bootstrap que falla por `5xx`, red o error interno **no significa sesion invalida**.

```text
BOOTSTRAP_TRANSIENT:
  NO clearSession · NO onSessionLost · NO clearCookie
  NO redireccion automatica a /login
  NO contenido privado
  NO bucle de reintento · NO temporizador
```

Se representa con un estado explicito `"unavailable"`. La recuperacion es a iniciativa del usuario:
reintento manual o recarga. Las guardas privadas distinguen cuatro estados:

```text
bootstrapping        sin redirect · sin contenido privado
authenticated        contenido privado
anonymous            redireccion segun el contrato existente (terminal)
unavailable          sin redirect · sin contenido privado · estado de error con reintento
```

## Generation guard

Cuando `logout` o `clearSession` ocurren mientras hay un refresh en vuelo, se invalida la generacion
de sesion. Si ese refresh termina despues, **no puede reinstalar la sesion cerrada**. Combinado con la
revocacion de familia del backend, el cierre es efectivo en ambos extremos.

## Seguridad

```text
refresh token exclusivamente en cookie httpOnly
access token solo en memoria; sin localStorage ni sessionStorage
sin token en body / query / header
401 generico e indistinguible dentro de la clase A
500 generico e indistinguible dentro de la clase B
sin logs de token, hash, cookie ni familyId; sin fugas de debug
validacion siempre en servidor; el frontend no es una frontera de seguridad
un solo linaje activo por familia; sin convergencia de linaje
rotacion atomica con rollback integro
el replay no se revela; el conflicto y el retry son invisibles al cliente
el logout no puede eludirse mediante la logica de gracia
clasificacion solo con estado posterior a la carrera
```

## Privacy / legal

```text
PRIVACY_IMPACT:               YES
LEGAL_REFERENCE_REQUIRED:     YES
AFFECTED_SR:                  SR-09 · SR-11
SR09_D2_GATE:                 PASS
HUMAN_LEGAL_REVIEW_COMPLETED: YES
PRIVATE_CONTENT_EXPOSED:      NO
LEGAL_DECISION_GATE:          UNCHANGED
NO_NEW_LEGAL_INTERPRETATION · NO_LEGAL_COMPLIANCE_CLAIM · NO_PRODUCTION_AUTHORIZATION
```

`familyId` y `replacedById` son identificadores tecnicos opacos generados por el servidor: no hay IP,
ni user-agent, ni huella de dispositivo, ni geolocalizacion, ni marca temporal adicional. La duracion
de la cookie no cambia y la rotacion no introduce expiracion deslizante, de modo que la persistencia
en terminal permanece exactamente como estaba. No se registra el objeto de error, lo que reduce el
dato tratado.

## Migracion

`ADDITIVE` · `MINIMAL` · `BACKWARD_SAFE_WHERE_REASONABLY_POSSIBLE`.

```text
1. ADD COLUMN familyId (nullable temporalmente)
2. ADD COLUMN replacedById (nullable)
3. UPDATE familyId = id WHERE familyId IS NULL          backfill determinista
4. ALTER COLUMN familyId SET NOT NULL
5. CREATE UNIQUE INDEX sobre tokenHash
6. CREATE UNIQUE INDEX sobre replacedById
7. CREATE INDEX sobre familyId
8. FK replacedById → RefreshToken(id) ON DELETE SET NULL ON UPDATE CASCADE
```

No se modifican `expiresAt`, `revokedAt`, `userId`, `createdAt` ni `id`. No se borran filas, columnas
ni tablas. Sin reset.

### Tratamiento de los registros existentes

| Pregunta | Respuesta |
|---|---|
| ¿Necesitan backfill? | SI (`familyId` es `NOT NULL`) |
| ¿Puede generarse `familyId`? | SI — `familyId = id`: uuid ya existente, unico por definicion, idempotente |
| ¿Cada token existente es su propia familia? | SI — exacto, no aproximado: sin rotacion previa, cada fila procede de un login o register propio |
| ¿Se conserva `expiresAt`? | SI |
| ¿Se conserva `revokedAt`? | SI |
| ¿Ambigüedad historica irreconstruible? | NO — el unico escritor de `revokedAt` era el logout, luego `replacedById = NULL` es historicamente exacto |

Ninguna sesion activa se interrumpe: todo token con `revokedAt IS NULL` y `expiresAt > now` sigue
siendo el current de su familia y rota con normalidad.

## Criterios de aceptacion

- [x] Un refresh valido devuelve un access token nuevo y los datos del usuario.
- [x] Un refresh sin cookie, desconocido o expirado devuelve `401` generico.
- [x] El refresh token solo se acepta por cookie `httpOnly`.
- [x] Una rotacion valida crea exactamente un successor con la misma familia y la misma expiracion absoluta.
- [x] La cookie rotada conserva `HttpOnly` y `SameSite=Lax` y caduca con el token, sin expiracion deslizante.
- [x] Un predecessor rotado no vuelve a rotar en ningun camino.
- [x] Dos refresh simultaneos con el mismo token no crean dos successors.
- [x] El perdedor de una carrera legitima continua con un access token nuevo, sin nueva cookie y sin escrituras.
- [x] El logout revoca la familia completa y no afecta a otras familias del usuario.
- [x] Un logout no puede eludirse mediante la ventana de concurrencia.
- [x] Un replay con la familia activa revoca efectivamente toda la familia.
- [x] Tras la revocacion, ningun miembro de la familia puede refrescar.
- [x] Una familia ya inactiva no genera escrituras adicionales.
- [x] La clasificacion tras perder el CAS usa exclusivamente estado releido posterior a la carrera.
- [x] La ventana de concurrencia es exactamente 10 000 ms, con limite inclusive.
- [x] Un fallo intermedio deja el predecessor utilizable (rollback integro).
- [x] Ninguna respuesta filtra token, hash, id, familia, email, causa del fallo, codigo Prisma ni estado de retry.
- [x] Un reload con refresh valido recupera la sesion sin pasar por `/login`.
- [x] Un reload sin refresh valido termina en estado anonimo estable, sin bucles.
- [x] N peticiones con `401` disparan exactamente un refresh.
- [x] Cada peticion original se reintenta como maximo una vez, y solo tras un refresh exitoso.
- [x] La llamada de refresh nunca dispara un refresh.
- [x] Un fallo definitivo de sesion limpia la sesion una sola vez y no reintenta.
- [x] Un logout durante un refresh en vuelo no reinstala la sesion.
- [x] No se muestra contenido privado ni se redirige durante el bootstrap.
- [x] Login, register, logout, rutas privadas y publicas siguen funcionando.
- [x] Las sesiones existentes sobreviven a la migracion.
- [x] Replay o logout concurrentes con una rotacion no dejan un successor usable.
- [x] Un fallo interno o transaccional no se presenta como sesion invalida ni provoca `clearCookie`.
- [x] Los conflictos de serializacion se reintentan de forma acotada; otros errores no.
- [x] Un predecessor presentado en ventana es legitimo aunque su successor directo ya haya rotado.
- [x] La ventana se decide con `presentedAt`: un reintento no cambia la clasificacion.
- [x] `familyUsable > 1` produce fallo interno, sin access token y sin `clearCookie`.
- [x] El interleaving critico se demuestra con orden forzado, no solo por estres.
- [x] `apiUpload` recupera el `401` igual que `apiRequest`, preservando el `FormData` y sin fijar `Content-Type`.
- [x] Un bootstrap transitorio no declara la sesion invalida ni redirige automaticamente.

## Tests minimos

**Backend** (`auth.routes.refresh.test.ts`, mas extensiones en los tests de login y logout):
refresh valido · sin cookie · desconocido · invalido · expirado · revocado por logout · rotacion ·
cookie nueva · expiracion absoluta sin deslizamiento · el predecessor no vuelve a rotar · ventana
por debajo del limite · limite exacto inclusive · por encima del limite · familia inactiva · `401`
generico equivalente · rechazo por body, query y cabecera · no filtracion de datos sensibles ·
rollback real · usuario inexistente · regresion de logout · logout tras rotacion · logout concurrente
· atributos de cookie en la emision · retry de `P2034` · errores no reintentables · agotamiento de
reintentos · avance de linaje · concurrencia multigeneracion · ventana preservada a traves del retry
· fuera de ventana sigue siendo replay · `familyUsable > 1` · `siblingsUsable > 0` · REPLAY frente a
ROTATION determinista · LOGOUT frente a ROTATION determinista.

**Frontend** (`api-client.refresh.test.ts`, `session-bootstrap.test.tsx`, mas extensiones):
peticion valida sin refresh · `401` dispara exactamente un refresh · reintento unico con token fresco
· refresh `401` termina la sesion · refresh `5xx` y error de red son transitorios · segundo `401` sin
bucle · N concurrentes comparten un refresh · waiters coherentes en los tres desenlaces ·
`credentials: include` · sin `Authorization` en el refresh · sin recursion · guarda de ruta de
refresh · recuperacion y reintento de `apiUpload` con `FormData` preservado y sin `Content-Type`
manual · bootstrap valido · bootstrap terminal · bootstrap transitorio · sin contenido privado
durante bootstrap o unavailable · sin redireccion prematura · doble montaje · logout durante refresh.

**E2E**: registro o login, ruta privada, recarga real, sesion recuperada sin pasar por `/login`.

## Fuera de alcance

Recuperacion y restablecimiento de contraseña · verificacion de email · ciclo de vida de cuenta ·
borrado y exportacion de datos · UI de gestion de dispositivos o sesiones · blacklist global de
access tokens · purga de refresh tokens expirados · limitador de tasa dedicado para refresh ·
rediseño global de CORS o de cookies · Recruit · Candidate Discovery · Job Radar · InfoJobs ·
matching · IA · proveedores externos · Docker · staging · produccion · deploy · datos reales ·
dependencias nuevas.

## Auditoria requerida

- [x] Quality/security documental.
- [x] Tests y verificaciones locales.
- [ ] Revision humana.
