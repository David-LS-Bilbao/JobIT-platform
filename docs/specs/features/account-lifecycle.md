# Spec — Account lifecycle (borrado permanente y exportación)

**Unidad:** `CANDIDATE_FIRST_FUNCTIONAL_CLOSURE` · fase B · `LEVEL_3`
**Findings que cierra:** `S22-AUTH-06 / B4-OPS-02` (account lifecycle), `AUDIT02-LIFE-AVATAR-01` (avatar physical cleanup)
**Contrato:** `ACCOUNT_LIFECYCLE_V1`

## Objetivo

Dar a la persona candidata control sobre su cuenta: **exportar** los datos que le pertenecen y **borrar la cuenta de forma permanente**, con invalidación inmediata de la sesión y limpieza física de los ficheros subidos.

## Usuario afectado

Candidato autenticado (único rol activo). El borrado es una acción destructiva e irreversible iniciada por la propia persona titular.

## Problema actual

No existe ningún endpoint de borrado ni de exportación. La persona no puede ejercer supresión ni portabilidad desde el producto. Además, los ficheros de avatar (`apps/api/uploads/avatars/`) no se borran nunca: se acumulan al reemplazar la imagen y sobrevivirían al borrado de la cuenta.

## Modelo elegido

```text
ACCOUNT_LIFECYCLE: HARD_DELETE
SOFT_DELETE:       NO
ANONYMIZATION:     NO
```

Borrado duro de la fila `User`. Las relaciones de Prisma ya declaran `onDelete: Cascade` para todo lo que pertenece a la persona, de modo que el borrado se propaga en una sola operación.

```text
PRISMA_SCHEMA_CHANGE: NOT_REQUIRED_BY_SELECTED_DESIGN
NEW_MIGRATION:        NOT_REQUIRED_BY_SELECTED_DESIGN
```

No se introduce estado de ciclo de vida, `authVersion`, marca de borrado ni estado de revocación persistente. Si durante la implementación apareciera necesidad real de cualquiera de ellos: `PLAN_REQUIRES_ARCHITECTURAL_DECISION` y parada.

## Endpoints

### `POST /api/auth/me/export`

Exporta los datos que pertenecen a la persona titular.

```text
auth:  access JWT (requireAuth) + reverificación de contraseña actual
body:  { "password": string }
200:   documento de export (JSON, version "1")
400:   VALIDATION_ERROR
401:   UNAUTHORIZED (genérico: JWT inválido, usuario inexistente o contraseña incorrecta)
429:   límite de peticiones
500:   INTERNAL_ERROR (genérico)
```

Es `POST` y no `GET` porque transporta la contraseña en el cuerpo: nunca en query string, nunca en la URL, nunca en logs de acceso.

### `DELETE /api/auth/me`

Borra la cuenta de forma permanente e irreversible.

```text
auth:  access JWT (requireAuth) + reverificación de contraseña actual
body:  { "password": string, "confirmation": "DELETE" }
204:   sin cuerpo; la cookie de refresh se limpia
400:   VALIDATION_ERROR (incluye confirmación distinta de "DELETE")
401:   UNAUTHORIZED (genérico)
429:   límite de peticiones
500:   INTERNAL_ERROR (genérico)
```

## Step-up authentication

```text
STEP_UP_AUTHENTICATION: CURRENT_PASSWORD_REVERIFICATION
```

Aplica a exportación y a borrado permanente. No se añade OTP por email ni MFA en esta unidad.

- Esquema Zod en `auth.schemas.ts`. La contraseña se valida como cadena no vacía; **no** se le aplican las reglas de fortaleza del registro, porque aquí se comprueba una contraseña ya existente.
- **Error genérico**: si el JWT es válido pero la contraseña es incorrecta, la respuesta es el **mismo 401** que ante un JWT inválido. No se distingue la causa, no se indica que la contraseña falló.
- La contraseña **no se registra en ningún log, no se persiste y no se incluye en ninguna traza**. Refuerza el contrato la allowlist de observabilidad de B-HARDENING, que prohíbe registrar el cuerpo de la petición.
- Ambas rutas quedan bajo el limitador general de `/api` ya montado en `app.ts`.

## Invalidación inmediata del access JWT

Mecanismo aprobado, implementado en `requireAuth`:

```text
verify JWT → extract userId → verify User still exists → authorize only if User exists
```

- No se usa blacklist de JWT, Redis, `authVersion` ni estado persistente adicional.
- Tras el commit del borrado, un access JWT emitido antes sigue siendo **criptográficamente válido**, pero la siguiente petición protegida no encuentra `User` y recibe un **401 genérico**.
- La comprobación es una consulta por clave primaria indexada con `select: { id: true }`, sobre el singleton `apps/api/src/lib/prisma.ts`.
- **Un fallo de base de datos en esa comprobación devuelve `500`, nunca `401`.** No se puede confundir indisponibilidad con falta de autorización.
- `requireAuth` pasa a ser asíncrono. Express 5 reenvía el rechazo al error handler, así que los routers no cambian.

## Invalidación global de sesión

El borrado elimina **todas las familias de refresh** del usuario, en todos los dispositivos, por la cascada `RefreshToken.user onDelete: Cascade`. No se revoca familia por familia: la fila `User` desaparece y con ella todas sus filas de refresh.

Tras el commit, `POST /api/auth/refresh` no puede recuperar sesión: `attemptRefresh` ya carga el `User` dentro de la transacción y, al no encontrarlo, produce un fallo terminal de sesión (401 genérico + limpieza de cookie).

## Concurrencia

### Borrado frente a refresh

- **Caso A — el refresh commitea antes del borrado.** Puede emitir credenciales nuevas. El borrado elimina después `User` y todas sus filas de refresh. El access JWT recién emitido falla en la siguiente petición protegida por la comprobación de existencia de `User`.
- **Caso B — el borrado commitea primero.** La búsqueda del refresh y su relación con `User` ya no resuelven: fallo genérico de sesión, sin revelar la causa.

### Borrado frente a petición protegida

Invalidación inmediata significa que **toda autenticación iniciada después del commit falla**. No se cancela retroactivamente una petición que ya fue autorizada antes del commit; esa petición termina su trabajo con normalidad.

Los invariantes críticos se verifican con tests deterministas de interleaving, reutilizando los seams ya existentes del contrato de refresh (`runSerializable`, `clock`, `hooks`; ver ADR-0014).

## Disposición de datos

| Entidad | Disposición |
|---|---|
| `User` | `DELETE` |
| `RefreshToken` (todas las familias y dispositivos) | `CASCADE_DELETE` |
| `CandidateProfile` | `CASCADE_DELETE` |
| `Skill` · `Experience` · `Education` · `Project` · `Link` · `JobPreferences` | `CASCADE_DELETE` vía `CandidateProfile` |
| `PortfolioSettings` | `CASCADE_DELETE` |
| `SavedJob` | `CASCADE_DELETE` |
| `Job` | `PRESERVE` — catálogo global de ofertas, no pertenece a la persona |
| Fichero físico de avatar | `DELETE` — limpieza explícita; ninguna cascada de base de datos alcanza el sistema de ficheros |
| Portfolio público | `UNAVAILABLE_AFTER_COMMIT` |
| Estado derivado de match | `NO_PERSISTED_CANDIDATE_STATE_TO_DELETE` — el match se computa a partir del perfil y la oferta; no existe tabla que lo persista, y desaparece con el perfil |
| Backups ya creados | `NOT_MUTATED_BY_ENDPOINT` |

La fila de backups describe **el alcance técnico del endpoint**: la operación de borrado actúa sobre la base de datos viva y no reescribe copias de seguridad existentes. No es una conclusión jurídica sobre plazos de conservación ni sobre el tratamiento de backups, que quedan fuera de esta spec.

## Contenido del export

Documento JSON versionado, construido por **allowlist explícita de campos**. Nunca por serialización directa de un modelo de Prisma.

```text
version:      "1"
exportedAt:   ISO 8601
account:      id, email, role, createdAt
profile:      datos básicos + skills, experience, education, projects, links, preferences
portfolio:    ajustes y estado de publicación (incluido el slug)
savedJobs:    relaciones guardadas con metadatos mínimos de la oferta
```

Excluido por contrato, sin excepción:

```text
passwordHash
refresh tokens · tokenHash · familyId · replacedById
access JWT
cookies
secretos y variables de entorno
cualquier material interno de credenciales
```

## Avatar cleanup

Se implementa borrado físico en **dos** caminos:

1. **Reemplazo de avatar** (`POST /api/profile/me/avatar`): al guardar la imagen nueva y actualizar la base de datos, se borra la anterior.
2. **Borrado de cuenta**: se borra el fichero vigente.

Reglas:

- La ruta se **deriva siempre del estado en base de datos** (`CandidateProfile.avatarUrl`), nunca de una ruta enviada por el cliente.
- El destino se valida dentro de `AVATAR_DIR` antes de cualquier operación de borrado; una ruta que se resuelva fuera se rechaza sin tocar el sistema de ficheros.
- El borrado es **idempotente**: un fichero ya ausente no es un error y no rompe el ciclo de vida.
- **Orden en el reemplazo**: se guarda la imagen nueva → se actualiza la base de datos → solo entonces se borra la anterior. Si la actualización de base de datos falla, se borra por compensación la imagen recién guardada, para no dejarla huérfana.
- **Orden en el borrado de cuenta**: se lee la ruta del avatar → se borra la fila `User` (commit) → se borra el fichero. Un fallo de sistema de ficheros **después** del commit **no revierte** el borrado de la cuenta: la cuenta queda borrada y el incidente se registra por el mecanismo de observabilidad. El criterio es explícito: prevalece la irreversibilidad del borrado de cuenta sobre la limpieza secundaria de un fichero.

## Portfolio

Tras el commit del borrado, `PortfolioSettings` desaparece por cascada. En consecuencia:

```text
GET /api/public/portfolios/:slug  → 404
/u/:slug                          → no disponible
```

El slug queda liberado. No se introduce tombstone, redirección ni estado adicional de ciclo de vida.

## Superficie de frontend

Ruta `/profile/account`, enlazada desde el perfil.

```text
My data      → exportar los datos de la cuenta (descarga del JSON)
Danger zone  → borrado permanente de la cuenta
```

Flujo de borrado: aviso de irreversibilidad → contraseña → confirmación explícita escribiendo `DELETE` → llamada al backend → limpieza de la sesión y del estado de auth en el cliente → redirección fuera del área privada.

Sin asistente por pasos, sin MFA, sin OTP, sin funcionalidades añadidas.

## Errores

| Situación | Respuesta |
|---|---|
| Falta cabecera `Authorization` o JWT inválido | `401 UNAUTHORIZED`, cuerpo genérico |
| JWT válido, `User` inexistente | `401 UNAUTHORIZED`, cuerpo genérico e idéntico |
| JWT válido, contraseña incorrecta | `401 UNAUTHORIZED`, cuerpo genérico e idéntico |
| Confirmación distinta de `DELETE` | `400 VALIDATION_ERROR` |
| Fallo de base de datos en `requireAuth` | `500 INTERNAL_ERROR`, nunca `401` |
| Fallo interno del borrado o del export | `500 INTERNAL_ERROR`, cuerpo genérico |

Ninguna respuesta revela si un correo existe, si la contraseña era correcta o si la cuenta fue borrada.

## Privacy impact precheck

```text
PRIVACY_IMPACT_PRECHECK: REQUIRED — EJECUTADO

 1. NEW_PERSONAL_DATA                 NO
 2. NEW_PURPOSE                       NO
 3. ACCESS_OR_VISIBILITY_CHANGE       NO
 4. DATA_PUBLICATION                  NO
 5. NEW_PROVIDERS                     NO
 6. COOKIES_STORAGE_TRACKING          YES  (limpieza de la cookie de refresh y del estado de sesión en el cliente)
 7. AUTH_SESSION_REFRESH_TOKEN        YES  (invalidación inmediata de access JWT y de todas las familias de refresh)
 8. RETENTION_DELETION_BACKUPS        YES  (supresión de datos de la persona; backups no mutados por el endpoint)
 9. DATA_SUBJECT_RIGHTS               YES  (supresión y portabilidad ejercidas desde el producto)
10. PORTFOLIO_AVATAR_UPLOADS          YES  (portfolio público y borrado físico del avatar)
11. AI_SCORING_PROFILING_MATCH        NO
12. RECRUIT_OR_CANDIDATE_DISCOVERY    NO

PRIVACY_IMPACT:            YES
LEGAL_REFERENCE_REQUIRED:  YES
LEGAL_ASSUMPTIONS_INTRODUCED: NONE
```

Consecuencia operativa: se aplica el procedimiento de consulta de `docs/agents/skills/privacy-legal-reference.md` sobre material `PREPARATORY_REFERENCE_ONLY`. Esta spec **no** introduce ninguna conclusión jurídica nueva, no califica jurídicamente el tratamiento, no fija plazos de conservación y no cierra ningún gate.

```text
S22-PRIV-01:              LEGAL_GATE_OPEN
LEGAL_DECISION_GATE:      OPEN
HUMAN_LEGAL_VALIDATION:   PENDING
REAL_CANDIDATE_DATA:      NOT_AUTHORIZED
PRODUCTION:               NOT_AUTHORIZED
```

Todo el trabajo se realiza sobre datos sintéticos locales. Si apareciese una interpretación jurídica nueva necesaria para implementar: `LEGAL_INTERPRETATION_REQUIRED` y parada.

## Criterios de aceptación

1. `POST /api/auth/me/export` devuelve el documento del titular con contraseña correcta, y `401` genérico sin ella.
2. El export **no contiene** `passwordHash`, tokens, hashes de token, `familyId`, JWT ni cookies.
3. El export solo contiene datos del titular autenticado; nunca de otro usuario.
4. `DELETE /api/auth/me` exige contraseña y confirmación exacta `DELETE`.
5. Tras el borrado desaparecen `User`, refresh tokens, perfil y sus hijos, ajustes de portfolio y ofertas guardadas.
6. `Job` permanece intacto.
7. Un access JWT emitido antes del borrado recibe `401` genérico en la siguiente petición protegida.
8. `POST /api/auth/refresh` no recupera la sesión tras el borrado.
9. Un fallo de base de datos en `requireAuth` produce `500`, no `401`.
10. El portfolio público del slug borrado responde `404`.
11. El fichero de avatar deja de existir tras el borrado de cuenta y tras un reemplazo.
12. Un fichero de avatar ya ausente no rompe ninguno de los dos flujos.
13. El frontend limpia la sesión y redirige fuera del área privada.
14. El esquema de Prisma y las migraciones quedan sin cambios.

## Tests mínimos

**Integración de API**: step-up correcto e incorrecto · ownership del export · ausencia de secretos en el export · borrado duro y cascadas · desaparición de todas las familias de refresh · rechazo del access JWT antiguo · `500` ante fallo de base de datos en `requireAuth` · confirmación inválida · portfolio público a `404`.

**Interleaving determinista**: borrado frente a refresh en ambos órdenes · borrado frente a petición protegida.

**Unitarios**: borrado de avatar idempotente · rechazo de rutas fuera de `AVATAR_DIR` · compensación al fallar la actualización de base de datos.

**Web**: página de cuenta, flujo de confirmación, limpieza de sesión.

**E2E (Golden journey 7)**: registrar usuario sintético → perfil → avatar → publicar portfolio → guardar oferta → exportar → verificar allowlist → borrar con step-up → sesión desaparece → access token previo rechazado → refresh no recupera → portfolio público no disponible → avatar no disponible.

## Fuera de alcance

Recuperación de cuenta tras el borrado · papelera o periodo de gracia · borrado programado por inactividad · exportación asíncrona o por correo · borrado en backups · cierre del gate legal · datos reales · despliegue.
