# Informe final — Fase B · CANDIDATE_FIRST_FUNCTIONAL_CLOSURE

**Unidad:** `CANDIDATE_FIRST_FUNCTIONAL_CLOSURE`
**Fase:** B del roadmap candidate-first
**Riesgo:** `LEVEL_3`
**Bloques:** `B-CORE` (PR #123) y `B-HARDENING`
**Baseline inicial:** `b032837da901bf7082b9d5a9cb0c4e27ad1d881f`

## 1. Objetivo inicial

Cerrar los cinco hallazgos P1 que arrastraba Global Review+ y dejar la fase B completada con `OPEN_P1_CURRENT: 0`.

## 2. Resultado

```text
S22-AUTH-06 / B4-OPS-02:              RESOLVED_IN_DEV
AUDIT02-LIFE-AVATAR-01:               RESOLVED_IN_DEV
AUDIT03-URL-SCHEME-01:                RESOLVED_IN_DEV
AUDIT05-DEPLOY-PROXY-RATELIMIT-01:    RESOLVED_IN_DEV
AUDIT05-OPS-PROD-ERROR-LOG-01:        RESOLVED_IN_DEV

OPEN_P0_CURRENT: 0
OPEN_P1_CURRENT: 0
PHASE_B:         COMPLETED
```

## 3. B-CORE — ciclo de vida de la cuenta (PR #123)

Contrato en `docs/specs/features/account-lifecycle.md`, escrito como primera fase de la misma rama funcional y mergeado en el mismo PR.

- **Borrado duro.** `DELETE /api/auth/me` con reverificación de contraseña y confirmación literal `DELETE`. La propagación la hacen las cascadas ya declaradas en el schema, así que **no hubo cambio de Prisma ni migración nueva**.
- **Exportación.** `POST /api/auth/me/export`, documento JSON versionado construido por allowlist campo a campo en `account-export.ts`. Nunca se serializa un modelo de Prisma: una columna sensible futura no puede colarse por omisión.
- **Invalidación inmediata del access JWT.** `requireAuth` comprueba además que el `User` sigue existiendo. Un token emitido antes del borrado sigue siendo criptográficamente válido pero deja de autorizar. Sin blacklist, sin Redis, sin `authVersion`, sin estado persistente adicional. Un fallo de base de datos devuelve **500, nunca 401**: confundir indisponibilidad con falta de autorización cerraría sesiones válidas durante una incidencia.
- **Limpieza física del avatar** en los tres caminos que dejaban huérfanos: reemplazo por subida, sustitución por URL externa o vaciado vía perfil, y borrado de cuenta. Ruta derivada siempre de la base de datos, validada dentro de `AVATAR_DIR`, borrado idempotente y compensación si la escritura en base de datos falla tras guardar el fichero.
- **Interfaz mínima** en `/profile/account` y **Golden E2E journey 7**.

## 4. B-HARDENING — los tres P1 técnicos

### Public URL protocol hardening

En un entorno desplegado se exige `NEXT_PUBLIC_PUBLIC_BASE_URL` absoluta y `https`. Se eliminó el fallback silencioso a `window.location.origin`, que era justo lo que permitía emitir un enlace `http`. Ante configuración ausente o inválida la interfaz **no ofrece enlace ni QR** en lugar de ofrecer uno degradado: un fallo visible es preferible a un enlace inseguro compartido y codificado en un QR.

Tocar solo `profile-api.ts` no habría bastado: la variable se inlinea en el build de Next, así que viaja por `apps/web/Dockerfile` (ARG + ENV), `docker-compose.staging.yml` (build-arg), ambas plantillas de entorno y `docs/deployment/staging-env.md`.

### TRUST_PROXY_HOPS

El cableado y sus tests de comportamiento (0 saltos, 1 salto, `X-Forwarded-For` forjado) **ya existían**. El hueco real era que el valor correcto para staging no estaba versionado en ninguna plantilla. Ahora `.env.staging.example` declara `TRUST_PROXY_HOPS=1` (un salto de Nginx Proxy Manager) y el compose del smoke local declara `0`, que es lo correcto sin proxy delante.

**El default del código sigue siendo `0` y no se ha tocado.** Subirlo globalmente haría que cualquier entorno sin proxy aceptase `X-Forwarded-For` del cliente. Tests de contrato leen las plantillas reales del repositorio para que el valor no pueda regresar en silencio.

La verificación contra la topología NPM real pertenece al despliegue de staging y **no se afirma aquí**.

### Safe diagnostic observability

Antes, un `500` en staging o producción no dejaba **ninguna** traza: `console.error` solo corría fuera de producción, de modo que un fallo real era indiagnosticable sin exponer detalle al cliente.

- Identificador de correlación por petición, **generado siempre en el servidor** y nunca heredado de una cabecera entrante: aceptar el valor del cliente permitiría inyectar contenido en los logs o falsear la correlación. Se devuelve en `X-Request-Id`.
- Log estructurado por allowlist cerrada: `timestamp`, `requestId`, `method`, ruta saneada, `status`, `code`, `errorName`. Nunca el mensaje del error, que en Prisma arrastra parámetros de consulta.
- La ruta se sanea por defecto-denegar: solo sobreviven segmentos estáticos conocidos. El slug del portfolio, elegido por la persona usuaria y a menudo derivado de su nombre, queda enmascarado.
- La respuesta externa sigue siendo genérica en producción.
- Se cubrieron también los dos caminos de 500 que **no pasan** por el manejador final: `STORAGE_ERROR` del avatar y el fallo transaccional de refresh/logout.

### Cierre del residuo de B-CORE

El fallo de sistema de ficheros posterior al commit del borrado sigue sin revertir la cuenta —el orden es deliberado—, pero ha dejado de ser silencioso: se registra con `ORPHANED_AVATAR_AFTER_ACCOUNT_DELETE` y `ORPHANED_AVATAR_AFTER_REPLACEMENT`.

## 5. Deuda del harness de E2E

El journey 7 elevó la suite Golden E2E a **6 registros**, mientras el default productivo es `AUTH_REGISTER_MAX=5/hora`. En CI la API corre con `NODE_ENV=production`, así que los defaults de test no aplicaban y el último journey habría fallado por rate limiting y no por un defecto real.

Resuelto **solo en el harness**: el workflow `e2e.yml` declara límites altos para su proceso efímero de CI, donde un runner es un único cliente ejecutando toda la suite en secuencia. **Los defaults productivos del código y la plantilla de staging quedan intactos.**

## 6. Verificaciones

```text
API prisma generate:  PASS
API typecheck:        PASS
API tests:            PASS — 54 ficheros / 716 tests
API build:            PASS

Web typecheck:        PASS
Web tests:            PASS — 33 ficheros / 461 tests
Web lint:             PASS
Web build:            PASS

Golden E2E 1–9:       PASS — 16/16
git diff --check:     PASS
```

Los E2E se ejecutaron contra el entorno equivalente al de CI: build de producción servido con `next start` y API con los límites del harness. Es la configuración que reproduce el runner.

## 7. Prisma y despliegue

```text
PRISMA_SCHEMA_CHANGE: NO
NEW_MIGRATION:        NO
DEPLOY:               NO
REAL_CANDIDATE_DATA:  NO
```

## 8. Privacidad y legal

`PRIVACY_IMPACT_PRECHECK` ejecutado y registrado en la spec de account lifecycle: cinco respuestas `YES`, `LEGAL_ASSUMPTIONS_INTRODUCED: NONE`. No se introdujo ninguna conclusión jurídica nueva y el gate permanece exactamente como estaba:

```text
S22-PRIV-01:            LEGAL_GATE_OPEN
LEGAL_DECISION_GATE:    OPEN
HUMAN_LEGAL_VALIDATION: PENDING
REAL_CANDIDATE_DATA:    NOT_AUTHORIZED
PRODUCTION:             NOT_AUTHORIZED
```

## 9. Deuda pendiente

- **Carrera `P2002` en `getOrCreatePortfolioSettings`** (`portfolio.service.ts`): lectura seguida de creación, sin `upsert` ni manejo de la violación de unicidad. Se manifiesta bajo `next dev` por el doble efecto de StrictMode, no en un entorno equivalente a producción. Es **preexistente y quedó fuera del alcance de B**; no se tocó. El cambio de `requireAuth` añade un roundtrip que puede ensanchar esa ventana, así que conviene tratarla en la fase C.
- **Verificación en runtime de `TRUST_PROXY_HOPS`** contra la topología NPM real: pertenece al despliegue de staging.
- **Coste arquitectónico aceptado**: una consulta indexada de existencia de `User` por petición protegida.
- **Sin informe de unidad en `docs/sprints/`** para PR #119 y PR #120: hueco heredado, registrado en el ledger.

## 10. Desviación de proceso registrada

```text
PROCESS_DEVIATION:
PR_123_MERGED_BEFORE_FORMAL_MERGE_APPROVED
```

La PR de `B-CORE` se mergeó antes de que el Chat Director emitiera formalmente `MERGE_APPROVED`. El Orquestador verificó head, base, alcance, CI, ausencia de cambio en Prisma, de migración, de despliegue y de datos reales, y decidió no revertir ni reabrir. No se emitió `MERGE_APPROVED` retroactivo.

## 11. Estado

```text
PHASE_B: COMPLETED
NEXT:    ORCHESTRATOR_DECISION_REQUIRED
```

`C — STAGING TECHNICAL READINESS` es la fase natural siguiente, pero **no queda autorizada** por este informe.
