# ADR-0014: Contrato de continuidad de sesion y refresh con rotacion

## Estado

Aceptada.

## Contexto

[ADR-0006](ADR-0006-auth-strategy.md) fijo la estrategia hibrida —access token JWT de vida corta mas
refresh token persistente en cookie `HttpOnly`— y dejo explicitamente abierta la rotacion:
«Implementar la logica de rotacion del refresh token **si se decide activarla** desde el inicio».
Tambien anticipo el problema que ahora se resuelve: «si se implementa rotacion, hay que manejar el
caso de dos peticiones simultaneas con el mismo token. A resolver en implementacion».

El estado previo del repositorio era: cookie `refresh_token` emitida y persistida como hash, pero
**sin endpoint que la consumiera**. En la practica la persistencia era inerte: al recargar la pagina
la sesion se perdia (`AUTH-03`) y cada expiracion del access token expulsaba al candidato, con el
`401` gestionado de forma duplicada en diez puntos de llamada (`B4-STATE-02`).

La unidad `SESSION_CONTINUITY_AND_401_RECOVERY` resuelve ambos hallazgos. Esta ADR registra las
decisiones de arquitectura con contrapartida; el contrato completo vive en
[`session-continuity-401-recovery.md`](../specs/features/session-continuity-401-recovery.md).

## Decision

**Rotacion de refresh token con soporte de schema, familia de tokens y linaje simple.**

Se añaden a `RefreshToken` exactamente dos columnas (`familyId`, `replacedById`), dos constraints de
unicidad (`tokenHash`, `replacedById`), un indice (`familyId`) y una auto-relacion 1:1. No se crea
ningun modelo nuevo ni se amplia `User`.

Alternativas descartadas por gobernanza humana antes de esta ADR:

- **Sin rotacion**: `REJECTED_BY_HUMAN_GOVERNANCE`.
- **Rotacion con el modelo previo, sin soporte de schema**: `REJECTED_BY_HUMAN_GOVERNANCE`.

### 1. Ventana de concurrencia legitima de 10 000 ms

Un predecessor ya rotado, presentado dentro de los 10 segundos siguientes a su rotacion y con la
familia sana, recibe un access token nuevo sin rotar ni emitir cookie.

**Por que 10 s.** El unico presentador legitimo posible es una peticion que ya estaba en vuelo cuando
el ganador consolido su rotacion: el frontend nunca custodia el refresh token, lo adjunta el
navegador desde una cookie compartida entre pestañas. Cota realista del caso: latencia de ida y
vuelta en malas condiciones (≈2 s) mas la transaccion del ganador (<100 ms) mas el desfase de
planificacion entre pestañas en segundo plano (≈1-2 s). 10 s dan aproximadamente 3x de margen, y son
90 veces menores que el TTL del access token.

**Contrapartida aceptada.** La ventana **no identifica de forma infalible a un cliente legitimo**. Un
atacante que ya posea el refresh token y lo reproduzca dentro de esos 10 segundos es indistinguible
de la peticion concurrente legitima y obtendra un access token. Lo que la ventana acota no es la
identidad sino la **duracion** de esa indistinguibilidad. El daño esta limitado: no se le emite
refresh token, de modo que **no obtiene persistencia**; el artefacto caduca en 15 minutos y no es
renovable sin repetir la coincidencia temporal; y cualquier uso del mismo token **fuera** de la
ventana revoca la familia entera. Contrapartida adicional y honesta: ese camino es **silencioso**, no
alerta ni cierra la sesion del titular.

Eliminar la ventana (`W = 0`) se evaluo y se descarto: clasificaria como replay a todo perdedor de
una carrera legitima y cerraria la sesion del usuario cada vez que dos pestañas refrescan a la vez.

### 2. No se persiste la causa del compromiso

```text
COMPROMISE_CAUSE_PERSISTED:  NO
FAMILY_EFFECTIVELY_REVOKED:  YES
```

Se persiste el **estado efectivo** de revocacion (`revokedAt` por miembro), no la causa historica. En
cualquier instante puede determinarse si una familia sigue activa; **no** puede reconstruirse a
posteriori si murio por logout, por deteccion de replay o por expiracion.

**Por que no hace falta un marcador.** No es necesario para impedir nuevos refresh —lo hacen el
`WHERE` del CAS y el conteo de familia—, ni para revocar la familia —es una escritura set-based sobre
`familyId`—, ni para el contrato funcional —que exige precisamente que la causa **no** influya en el
comportamiento observable—, ni para los tests —que aseveran revocacion efectiva, formulacion mas
fuerte que comprobar una etiqueta—, ni para la seguridad —ninguna decision de autorizacion lo
consultaria.

**Contrapartida aceptada.** Se pierde capacidad forense. Pertenece a observabilidad y auditoria de
seguridad, fuera de alcance, y exigiria decidir retencion y minimizacion de esos registros. Queda
como deuda explicita para una unidad futura que decida campo, retencion y base juridica de forma
conjunta.

### 3. Sin blacklist global de access tokens

Los JWT son stateless y no pueden revocarse. Tras revocar una familia por replay, los access tokens
ya emitidos siguen siendo validos hasta **15 minutos**.

**Contrapartida aceptada.** Una blacklist global exigiria una consulta a base de datos en cada
peticion autenticada de toda la API: un cambio de arquitectura transversal fuera de alcance. No es
indispensable, porque la rotacion con deteccion de replay ya cierra la via de **persistencia** del
atacante, que es el objetivo de la unidad.

### 4. SERIALIZABLE con retry acotado

`refreshSession` y `logout` se ejecutan en transacciones `SERIALIZABLE`. `login` y `register`
conservan el aislamiento por defecto: generan un `familyId` nuevo y ningun otro actor puede leer ni
escribir esa familia.

```text
RETRYABLE_TRANSACTION_CONFLICT:  Prisma P2034 (unicamente)
MAX_SERIALIZATION_RETRIES:       2        TOTAL_MAX_ATTEMPTS: 3        BACKOFF: ninguno
```

**Por que `READ COMMITTED` no basta.** Con el aislamiento por defecto existe un interleaving que
rompe la revocacion de familia: la transaccion de rotacion reclama el current e inserta el successor
sin comprometer; la de revocacion toma su snapshot, ve el current como usable, se bloquea sobre esa
fila y, al desbloquearse, reevalua **solo esa fila** —que ya esta revocada— sin reexaminar nunca el
successor insertado despues. Resultado: una familia dada por revocada con un token vivo. Afirmar que
un `updateMany` set-based alcanza a los successors concurrentes es incorrecto y queda retirado.

**Por que `REPEATABLE READ` tampoco basta.** En PostgreSQL aborta ante conflicto de escritura sobre
una fila ya modificada, pero no protege el conjunto leido frente a inserciones. El diseño no puede
depender de que el aborto ocurra de forma incidental.

**En que descansa la garantia.** No en la granularidad interna de los predicate locks —afirmacion
retirada del diseño— sino en: (a) `SERIALIZABLE`; (b) una **colision de escritura que siempre se
produce**, porque toda rotacion reclama el current y toda revocacion revoca ese mismo current, de
modo que ambas escriben la misma fila; (c) la politica de retry acotada, que reejecuta sobre estado
establecido; (d) las aserciones de invariante de la aplicacion; y (e) tests de interleaving
**determinista** que fuerzan el orden exacto en lugar de confiar en el planificador.

**Por que `2` reintentos.** La contencion es de una sola familia —las pestañas de un mismo
navegador—; el conflicto no se autoperpetua, porque el reintento observa estado establecido y el
camino de concurrencia legitima no escribe; tres intentos mantienen el peor caso muy por debajo del
presupuesto de una peticion; y un limite alto convertiria una tormenta de contencion en un
multiplicador de trabajo de base de datos en un endpoint no autenticado. Sin backoff: un conflicto
implica que la transaccion antagonista ya comprometio o aborto, de modo que esperar no aporta
informacion y añadiria no determinismo.

**Precision terminologica.** Prisma documenta `P2034` como «write conflict or deadlock», no como
mapeo exclusivo de `SQLSTATE 40001`. Se trata como la unica señal reintentable, que es el codigo
estable expuesto por el cliente; no se inspeccionan mensajes de texto ni SQLSTATE crudos.

### 5. Separacion estricta de clases de error

```text
CLASE A — terminal de sesion  →  401 generico  ·  clearCookie
CLASE B — interno / invariante / transaccional  →  500 generico  ·  cookie INTACTA
```

Un fallo interno **nunca** se presenta como sesion invalida. Es el punto mas delicado: tras el
rollback de una transaccion fallida el predecessor sigue siendo `CURRENT` y la sesion es
perfectamente valida; devolver `401` con `clearCookie` destruiria una sesion sana a causa de un error
de infraestructura. El router del refresh captura la clase B y responde el mismo, sin delegar en el
middleware de error, para que el cuerpo sea identico en desarrollo y en produccion y para que el
objeto de error de Prisma —que puede contener parametros de consulta— no llegue a ningun log.

En el frontend la distincion se propaga con un resultado discriminado
(`refreshed` / `session-lost` / `transient`). El desenlace transitorio no invoca `onSessionLost`, no
limpia la sesion y propaga un error con `status 0`, de modo que las features lo tratan por su rama de
error generico con reintento manual **sin necesidad de modificarlas**.

### 6. `replacedById @unique` impide convergencia, no bifurcacion

La unicidad garantiza que **un successor no puede ser referenciado como `replacedBy` por multiples
predecessors**: evita la convergencia de linaje y satisface el requisito de Prisma para la
auto-relacion 1:1.

**No** es lo que impide que un predecessor tenga dos successors: `replacedById` es un campo escalar y
por construccion solo puede contener una referencia. La propiedad «una rotacion produce como maximo
un successor» la garantizan el CAS, la transaccion, la logica de creacion y enlace, y el aislamiento
con su politica de retry.

### 7. Clasificacion por estado de familia, no por successor directo

Se retira el estado `REPLAY_DEAD_SUCCESSOR`. Tratar «successor directo revocado» como replay era un
**falso positivo grave**: en el avance de linaje multigeneracion —`T0 → T1` y, antes de clasificar una
presentacion pendiente de `T0`, `T1 → T2`— revocaba familias **sanas** y expulsaba al titular en uso
multipestaña normal, sin ninguna intrusion.

La decision pasa a basarse en el estado de la familia (`familyUsable == 1`) apoyada en la **propiedad
de cadena simple**: como `familyId` solo se propaga por rotacion, `replacedById @unique` impide la
convergencia y el CAS impide la bifurcacion, una familia es un camino simple; si tiene exactamente un
miembro usable, ese miembro es la cola unica y todo miembro con linaje es ancestro suyo. En
consecuencia **el successor directo deja de cargarse**: la clasificacion es `O(1)` mas un conteo
indexado, y no requiere recorrer la cadena ni acotar su profundidad.

### 8. `presentedAt` para la ventana, `attemptNow` para el estado; contrato ternario de `familyUsable`

`presentedAt` se captura una sola vez, al recibir la presentacion y antes del bucle de reintentos, y
decide **solo** la ventana. `attemptNow` se recalcula en cada intento y decide expiraciones,
`revokedAt` de escrituras nuevas, estado de familia y timestamps operativos.

**Por que.** Con `attemptNow` en la ventana, una peticion llegada dentro del plazo podia convertirse
artificialmente en replay solo porque PostgreSQL la hizo esperar y reintentar. El conflicto de
serializacion no es culpa del cliente y no debe cambiar su clasificacion. Simetricamente, una
peticion llegada fuera no entra en gracia mas tarde.

```text
familyUsable == 0   →  FAMILY_INACTIVE       clase A, 401
familyUsable == 1   →  estado normal
familyUsable  > 1   →  INVARIANT_VIOLATION   clase B, 500, sin access token, sin clearCookie
```

El caso `> 1` es una **asercion de runtime** que detecta una violacion del invariante «un solo current
por familia» y **falla en cerrado**: no elige arbitrariamente un current, no emite credencial y no
destruye la sesion, porque con estado corrupto no puede saberse cual seria correcto. El invariante lo
garantizan el CAS, `SERIALIZABLE` y el camino de gracia sin escrituras; la asercion solo lo detecta.

## Consecuencias positivas

- La sesion sobrevive a la recarga y el `401` se recupera de forma transversal, sin duplicar logica
  en cada feature.
- Un refresh token robado y reutilizado fuera de la ventana revoca la sesion completa de ese
  dispositivo, sin afectar a los demas.
- La rotacion es atomica: es estructuralmente imposible que el predecessor quede revocado sin
  successor.
- El logout se refuerza: pasa a revocar la familia y cierra la carrera con la rotacion.
- Un error de infraestructura ya no puede provocar un cierre de sesion falso.
- Los seams de test (`generateToken`, `runSerializable`, `clock`, `hooks`) permiten verificar
  concurrencia, retry y ventana de forma determinista, sin dependencias nuevas y sin efecto en
  produccion.

## Riesgos y deuda aceptada

| Riesgo | Estado |
|---|---|
| Replay dentro de la ventana de 10 s indistinguible de concurrencia legitima | Aceptado y documentado; sin persistencia para el atacante |
| Perdida de trazabilidad forense de la causa de revocacion | Aceptada; deuda para una unidad de observabilidad de seguridad |
| Ventana residual de 15 min de los access tokens ya emitidos | Aceptada; sin blacklist global |
| Agotamiento de reintentos bajo contencion sostenida | Error interno generico; sin perdida de sesion. En logout, la familia podria quedar sin revocar hasta su expiracion |
| Crecimiento de la tabla `RefreshToken` (≈1 fila por refresh) | Sin purga en esta unidad; deuda registrada |
| `path` de la cookie sin restringir a `/api/auth` | Sin cambio; restringirlo romperia el `clearCookie` del logout. Deuda |

## Impacto en specs

- [`session-continuity-401-recovery.md`](../specs/features/session-continuity-401-recovery.md):
  fuente de verdad de la unidad.
- [`auth.md`](../specs/features/auth.md): recibe un puntero de continuacion y la fila del endpoint
  `POST /auth/refresh`. Sus criterios historicos no se reescriben.
- [`ADR-0006`](ADR-0006-auth-strategy.md): se mantiene vigente. Esta ADR activa la rotacion que
  aquella dejo como opcion y resuelve la concurrencia que dejo abierta.
