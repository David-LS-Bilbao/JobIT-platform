# Spec — Staging technical readiness (Fase C)

**Unidad:** `C — STAGING TECHNICAL READINESS`
**Tipo:** `PRE_STAGING_TECHNICAL_READINESS`
**Riesgo:** `LEVEL_3`
**Plan aprobado:** `STAGING_TECHNICAL_READINESS_PLAN v2` (`APPROVED_WITH_ADJUSTMENTS`)
**Baseline:** `bd4608f7d349fdbcfbad33a6f4aa5e35803fde0b`

> Esta spec cubre la unidad completa de la fase C. Los dos bloques están **implementados y
> acreditados en local**. Lo que sigue pendiente es la integración en el repositorio
> (commit, PR, CI) y, después y por separado, la autorización de despliegue.

## Estado de implementación

```text
BLOCK_1  IMPLEMENTADO
  C0  esta spec
  C1  contrato de modo de datos y guarda de seed
  C3  contrato liveness/readiness
  C4  guarda de arranque, guarda de registro sintético,
      marcado de ofertas sintéticas, marcador de entorno en Web

BLOCK_2  IMPLEMENTADO
  C2  compose canónico de staging + ensayo aislado
  C5  parametrización de Playwright (modo externo)
  C6  golden staging journey + verificación de persistencia
  C7  contrato de migraciones/arranque/rollback en el runbook
  C8  reconciliación de ADR-0012, runbooks activos y current-project-state
```

Evidencia del ensayo local (`docs/deployment/staging-local-rehearsal.md`):

```text
migrate deploy        9 migraciones · migrate status posterior limpio
seed                  created=14 updated=0 total=14
health                DB healthy · /health 200 · /ready 200 · web 200
synthetic banner      presente en el bundle de la imagen production-equivalent
golden staging        run #1 PASS · run #2 PASS · User 0 → 0
persistencia          perfil, skill y avatar sobreviven al reinicio de la API
limpieza física       avatar 404 y fichero ausente del volumen tras el borrado
aislamiento           recursos protegidos idénticos · cero residuos
```

**Lo que sigue sin acreditarse**, y no lo acredita esta spec: la topología real de Nginx
Proxy Manager, TLS y el valor efectivo de `TRUST_PROXY_HOPS` contra ese proxy.

## Gates vigentes

Ninguna parte de esta spec los levanta.

```text
REAL_CANDIDATE_DATA:  NOT_AUTHORIZED
PUBLIC_STAGING:       NOT_AUTHORIZED
PRODUCTION:           NOT_AUTHORIZED
DEPLOY:               NOT_AUTHORIZED
LEGAL_DECISION_GATE:  OPEN
HUMAN_LEGAL_VALIDATION: PENDING
```

---

## 1. Objetivo

Preparar técnicamente un futuro entorno de staging **exclusivamente sintético**, de modo
que el eje `PRE_STAGING_TECHNICAL` pueda acreditarse con evidencia. Esta spec no autoriza
desplegar: acreditar readiness y desplegar son decisiones distintas.

El bloque 1 cierra la parte que no depende de infraestructura: el contrato de modo de
datos, las guardas que impiden sembrar o arrancar contra un destino equivocado, el marcado
inequívoco de los datos ficticios y la separación entre liveness y readiness. El bloque 2
convierte el compose en contrato canónico, añade el ensayo aislado y acredita el recorrido
completo y la persistencia sobre imágenes equivalentes a producción.

## 2. Usuario/equipo afectado

- **Operador/desarrollador:** obtiene guardas deterministas que fallan pronto y con un
  mensaje seguro en lugar de fallar tarde y en un entorno desplegado.
- **Tester autorizado de staging sintético:** ve de forma inequívoca que el entorno y sus
  datos son ficticios, y solo puede registrar identidades sintéticas.
- **Candidato real:** no participa. `REAL_CANDIDATE_DATA` sigue `NOT_AUTHORIZED`.

## 3. Alcance

**Bloque 2:**

- `docker-compose.staging.yml` como contrato canónico: sin puertos de host, interpolación
  fail-closed, tag de imagen inmutable, sin `build:`, healthcheck contra `/ready`.
- `docker-compose.staging.rehearsal.yml` y `scripts/operations/staging/` (guardas JSR).
- Modo externo de Playwright (`E2E_BASE_URL`, `E2E_API_BASE_URL`).
- `apps/web/e2e/staging-golden.spec.ts`: recorrido de identidad única.
- Verificación de persistencia con reinicio real del contenedor.
- Reconciliación de runbooks activos, ADR-0012 y `current-project-state`.

**Bloque 1:**

- Módulo puro de modo de datos (`JOBIT_DATA_MODE`) con vocabulario cerrado.
- Reconciliación en el arranque de la API entre clasificación de `DATABASE_URL` y modo.
- Extensión controlada de la guarda de seed para admitir `STAGING` sintético.
- Marcado visible e inequívoco de las 14 ofertas del seed interno.
- Guarda de registro por dominio reservado bajo modo sintético.
- Marcador global de entorno en la Web.
- `GET /ready` DB-aware, separado de `GET /health`.
- Plantilla `.env.staging.example`: solo las dos variables del contrato de modo.
- Enmienda de `database-seed-safety-gates.md`.

## 4. Fuera de alcance

- Cambios en `apps/api/src/config/rate-limit.config.ts` y en cualquier límite canónico.
- Deploy real, VPS, DNS, Nginx Proxy Manager, TLS.
- Ingesta externa real (Jooble/Greenhouse/Adzuna/InfoJobs).
- Carrera `P2002` en `getOrCreatePortfolioSettings` (`OUT_OF_SCOPE`, decisión D5).
- Cualquier cambio de Prisma o migración.

---

## 5. Contrato de modo de datos de staging sintético

Llave canónica **única**. No existe ninguna segunda llave.

```text
JOBIT_DATA_MODE                  (backend)
NEXT_PUBLIC_JOBIT_DATA_MODE      (frontend, se inlinea en el build de Next)
```

Vocabulario cerrado actualmente permitido:

```text
SYNTHETIC_STAGING
```

Reglas del parser:

- Ausente, vacía o solo espacios → `NORMAL` (modo ausente). Es fail-closed: en un destino
  `STAGING` la ausencia **aborta**, no degrada a comportamiento normal.
- Cualquier otro valor, incluido el mismo texto en otra caja → `INVALID_DATA_MODE`
  (fail-fast).
- Determinista, puro, testeable sin base de datos ni red.
- No imprime `DATABASE_URL`, credenciales ni secretos.

## 6. Contrato de clasificación de base de datos

La clasificación de `DATABASE_URL` es el **safety boundary**; `JOBIT_DATA_MODE` es el
**behavior contract**. No son fuentes de verdad competidoras: deben concordar.

Se reutiliza el clasificador ya existente y probado (`classifyDatabaseName`,
`parseDatabaseTarget`). No se duplica lógica de clasificación.

**Limitación residual declarada.** Una base cuyo nombre no contenga `staging`/`stage`
clasifica `UNKNOWN` y el guard de arranque no exigirá el modo. Se mitiga fijando
`jobit_staging` en la plantilla de staging; **no** se elimina. No se presenta como
cobertura universal.

## 7. Guarda de arranque de la API

Se ejecuta en el entrypoint del proceso, antes de escuchar en el puerto.

| Clasificación de `DATABASE_URL` | `JOBIT_DATA_MODE` | Arranque |
|---|---|---|
| `DEVELOPMENT` / `TEST` / `E2E` | ausente | **OK** (comportamiento actual intacto) |
| `DEVELOPMENT` / `TEST` / `E2E` | `SYNTHETIC_STAGING` | **OK** |
| `STAGING` | ausente | **ABORT** · `DATA_MODE_REQUIRED` |
| `STAGING` | valor inválido | **ABORT** · `INVALID_DATA_MODE` |
| `STAGING` | `SYNTHETIC_STAGING` | **OK** |
| `PRODUCTION` | ausente | **OK** (producción futura normal) |
| `PRODUCTION` | `SYNTHETIC_STAGING` | **ABORT** · `PRODUCTION_MODE_CONFLICT` |
| `UNKNOWN` / `AMBIGUOUS` | ausente | **OK** (compatibilidad, §6) |
| `UNKNOWN` / `AMBIGUOUS` | `SYNTHETIC_STAGING` | **ABORT** · `UNVERIFIABLE_TARGET_MODE_CONFLICT` |
| ausente / malformada | ausente | **OK** (comportamiento actual intacto) |
| ausente / malformada | cualquier modo | **ABORT** · `UNVERIFIABLE_TARGET_MODE_CONFLICT` |

**Invariante dura:** una base clasificada `STAGING` no arranca jamás en modo normal.

El fallo de arranque emite un código de vocabulario cerrado. Nunca incluye cadena de
conexión, credenciales, secretos ni detalle crudo de Prisma.

## 8. Contrato de seed

Extiende `assertSeedableDatabaseUrl` sin debilitar ninguna prohibición existente.

| Clasificación | `JOBIT_DATA_MODE` | Seed |
|---|---|---|
| `DEVELOPMENT` / `E2E` | ausente | **PERMITIDO** — reglas actuales, incluido el bloqueo por `NODE_ENV=production` |
| `DEVELOPMENT` / `E2E` | `SYNTHETIC_STAGING` | **PERMITIDO** — mismas reglas actuales |
| `STAGING` | ausente | **FAIL** · `DATA_MODE_REQUIRED` |
| `STAGING` | valor inválido | **FAIL** · `INVALID_DATA_MODE` |
| `STAGING` | `SYNTHETIC_STAGING` | **PERMITIDO**, y solo en esta rama `NODE_ENV=production` deja de bloquear |
| `PRODUCTION` | `SYNTHETIC_STAGING` | **FAIL** · `PRODUCTION_MODE_CONFLICT` |
| `PRODUCTION` | cualquier otro | **FAIL** |
| `TEST` | cualquiera | **FAIL** (prohibición actual conservada) |
| `UNKNOWN` / `AMBIGUOUS` | cualquiera | **FAIL** (prohibición actual conservada) |

**Invariante absoluta:** `PRODUCTION` es inalcanzable para el seed bajo cualquier
combinación de variables.

No existen `JOBIT_SEED_SYNTHETIC_STAGING`, `ALLOW_SEED` ni `FORCE_SEED`. Una segunda llave
crearía una fuente de verdad capaz de discrepar de `JOBIT_DATA_MODE`; además el seed ya es
un acto manual explícito (no está en el entrypoint de la imagen ni cableado en
`package.json`), y ese acto es la barrera humana.

## 9. Marcado de datos sintéticos

### 9.1 Ofertas del seed interno

Se conservan sin cambios `source = INTERNAL`, `externalId = jobit-seed-001..014`, `title`,
`tags`, `contractType`, `remoteType`, `location`, la lógica salarial y la lógica temporal.

Se añade marcado inequívoco en información visible:

```text
company:      JobIT Synthetic · <company original>
description:  [SYNTHETIC TEST DATA] <description original>
```

Motivo: `externalId` **nunca** se expone en el DTO público (contrato de
`jobs-api-visibility`), de modo que el único marcador previo era inalcanzable por API, por
captura de pantalla y por copia del contenido. `company` y `description` sí forman parte
del DTO público y de la interfaz, y `company` se renderiza en la tarjeta de listado con
truncado por el final, por lo que el prefijo sobrevive siempre.

El scoring de match consume `tags` y campos estructurados, nunca `company` ni
`description`: el marcado no altera ninguna afinidad.

### 9.2 Convergencia del seed

```text
Reejecutar el seed interno debe converger cada registro gestionado jobit-seed-*
al dataset sintético canónico vigente.
```

Requisitos: solo los 14 registros gestionados se crean o actualizan; ninguna oferta ajena
se borra ni se modifica; ninguna oferta de proveedor externo se toca; sin `deleteMany`
global; sin reset; sin cambio de Prisma; sin migración; sin update amplio.

La unicidad real empleada es la ya existente en la base:

```sql
CREATE UNIQUE INDEX "Job_source_externalId_key"
  ON "Job"("source","externalId") WHERE "externalId" IS NOT NULL;
```

(migración `20260623110355_add_job_provenance`). No se inventa ninguna restricción nueva.

### 9.3 Identidades sintéticas

Dominio reservado único: `synthetic.jobit.invalid` (TLD `.invalid`, RFC 2606: no resoluble,
ningún correo puede entregarse).

## 10. Guarda de registro sintético

Con `JOBIT_DATA_MODE=SYNTHETIC_STAGING`, `POST /api/auth/register` acepta únicamente
direcciones cuyo dominio sea **exactamente** `synthetic.jobit.invalid`.

Aceptado:

```text
candidate@synthetic.jobit.invalid
e2e+abc123@synthetic.jobit.invalid
```

Rechazado:

```text
candidate@gmail.com
candidate@jobit.com
candidate@sub.synthetic.jobit.invalid
candidate@synthetic.jobit.invalid.example.com
```

La comparación es de igualdad exacta sobre el dominio extraído tras la última `@`,
normalizado a minúsculas. **No** se usa `endsWith`, que admitiría subdominios y sufijos
engañosos.

Respuesta:

```text
400
{ "error": { "code": "SYNTHETIC_STAGING_EMAIL_REQUIRED", "message": <genérico> } }
```

La guarda se evalúa **antes** de consultar la base: no introduce enumeración de usuarios,
porque la respuesta depende solo del dominio recibido y nunca de si la cuenta existe.

Sin modo sintético, el comportamiento del registro es idéntico al actual.

## 11. Marcador de entorno en la Web

Con `NEXT_PUBLIC_JOBIT_DATA_MODE=SYNTHETIC_STAGING` la aplicación muestra un marcador
global:

```text
ENTORNO DE STAGING SINTÉTICO · No introducir datos reales ni personales
```

Requisitos: visible globalmente; ausente si la variable no vale exactamente
`SYNTHETIC_STAGING`; legible y accesible; en el flujo del documento, sin superponerse a la
navegación ni a las acciones principales; sin dependencias nuevas; sin rediseño de la
interfaz.

`NEXT_PUBLIC_JOBIT_DATA_MODE` viaja como build-arg en `apps/web/Dockerfile`; el ensayo
verifica que el marcador está realmente en el bundle de la imagen, no solo en el entorno.

## 12. Contrato liveness/readiness

```text
GET /health   LIVENESS  — sin cambios
  200 {"status":"ok","service":"jobit-api"}   mientras el proceso Node responde

GET /ready    READINESS — nuevo
  200 {"status":"ready"}      si PostgreSQL responde a la sonda mínima
  503 {"status":"not_ready"}  si no responde o la consulta lanza
```

- Sonda mínima: `SELECT 1` vía Prisma. Nada más.
- **No** comprueba migraciones: el estado de migraciones es *deployment gate* mediante
  `prisma migrate status`, no responsabilidad de readiness.
- Sin caché, sin memoización, sin sondeo en segundo plano, sin máquina de estados, sin
  dependencia nueva.
- **No emite ninguna línea de log por sonda**, ni en éxito ni en fallo: evita inundar los
  logs mientras la base está caída, sin introducir estado. La diagnosticabilidad se
  conserva por el historial de healthchecks de Docker y por el registro existente de los
  500 de peticiones reales.
- La respuesta no revela error de Prisma, error SQL, hostname, `DATABASE_URL`, schema,
  stack trace ni credenciales.
- Montado junto a `/health`, fuera del alcance de los limitadores por montaje.

El healthcheck de la API consume `/ready` en ambos composes.

## 13. Contrato de migraciones y arranque

Implementado en el bloque 2 y ejercitado en el ensayo local:

```text
backup → prisma migrate status → prisma migrate deploy → prisma migrate status
       → API → /ready 200 → Web
```

API y Web no arrancan antes del gate de migraciones. Ante fallo de migración: parada dura,
sin arranque, sin `migrate down` automático; forward fix cuando sea seguro, o restauración
del backup previo cuando se requiera revertir la base.

`IMAGE_ROLLBACK` tras un cambio de schema solo se permite si la compatibilidad hacia atrás
se ha establecido explícitamente; en caso contrario, forward fix o restore + imagen
compatible. Caso registrado: la migración `20260819091121_add_refresh_token_rotation_lineage`
eleva `RefreshToken.familyId` a `NOT NULL` sin `DEFAULT`, y el código anterior escribía el
token sin ese campo, de modo que retroceder de imagen a través de ella exige también
restaurar la base.

## 14. Contrato de rehearsal

Ensayo local aislado, sintético, reproducible, con imágenes equivalentes a producción,
incapaz de tocar los recursos reales `jobit-staging-db-data`, `jobit-staging-api-uploads`
ni `jobit-postgres-test`: identificador de ejecución único, proyecto Compose propio,
volúmenes y red propios, puertos solo en loopback y dinámicos, snapshot explícito de los
recursos protegidos antes y después, sin `prune`, sin `down -v` genérico, y limpieza
acotada exclusivamente a su propio proyecto.

Implementado en `docker-compose.staging.rehearsal.yml` y
`scripts/operations/staging/` (guardas JSR-01..JSR-10). Detalle operativo en
[`staging-local-rehearsal.md`](../../deployment/staging-local-rehearsal.md).

## 15. Restricciones de privacidad

`PRIVACY_IMPACT: YES` · `LEGAL_REFERENCE_REQUIRED: YES`
`AFFECTED_SR: SR-02, SR-09, SR-11, SR-12, SR-13, SR-14, SR-15`
`LEGAL_ASSUMPTIONS_INTRODUCED: NONE`

Alcance real de la protección, descrito sin exageración:

```text
- se bloquea el registro ordinario con un email real;
- staging queda visiblemente identificado como sintético;
- las ofertas quedan visiblemente marcadas como sintéticas;
- solo se admiten identidades de prueba sintéticas;
- los testers autorizados reciben la instrucción de no introducir datos personales;
- PUBLIC_STAGING y REAL_CANDIDATE_DATA siguen NOT_AUTHORIZED.
```

La medida **reduce fuertemente la entrada accidental** de datos reales. **No es** una
garantía frente a una introducción deliberada: restringir el dominio del correo no impide
que alguien escriba después un nombre, una biografía, una experiencia, un avatar o unos
enlaces personales reales.

Ninguna conclusión jurídica nueva se introduce aquí; la referencia preparatoria consultada
conserva sus etiquetas de origen y sigue dependiendo de revisión humana.

## 16. Restricciones de seguridad

- Ningún mensaje de error incluye `DATABASE_URL`, credenciales, secretos, SQL, hostname,
  schema ni stack trace.
- Los códigos de fallo pertenecen a vocabularios cerrados.
- La guarda de registro no introduce enumeración de usuarios.
- Los límites de rate canónicos no se tocan.
- Los defaults del código no se relajan para acomodar tests.
- Las funciones de guarda son puras: reciben el entorno por parámetro y no crean clientes
  ni conexiones.

## 17. Comportamiento ante error

| Situación | Comportamiento |
|---|---|
| `JOBIT_DATA_MODE` inválida | Fallo inmediato con `INVALID_DATA_MODE`; la API no arranca y el seed no conecta |
| `STAGING` sin modo | `DATA_MODE_REQUIRED`; la API no arranca y el seed no conecta |
| `PRODUCTION` con modo sintético | `PRODUCTION_MODE_CONFLICT`; abortan arranque y seed |
| Destino no verificable con modo declarado | `UNVERIFIABLE_TARGET_MODE_CONFLICT` |
| Registro con dominio no reservado en modo sintético | `400 SYNTHETIC_STAGING_EMAIL_REQUIRED`, sin tocar la base |
| Sonda de readiness falla | `503 {"status":"not_ready"}`, sin detalle y sin log |

## 18. Criterios de aceptación

1. `JOBIT_DATA_MODE` es la única llave; no existe ninguna segunda variable de seed.
2. El parser es determinista, de vocabulario cerrado y falla ante cualquier valor no
   reconocido.
3. Una base clasificada `STAGING` no arranca sin `JOBIT_DATA_MODE=SYNTHETIC_STAGING`.
4. `PRODUCTION` con modo sintético aborta el arranque y rechaza el seed.
5. El seed admite `STAGING` sintético incluso con `NODE_ENV=production`, y sigue
   rechazando `PRODUCTION`, `TEST`, `UNKNOWN` y `AMBIGUOUS` bajo cualquier combinación.
6. Sin `JOBIT_DATA_MODE`, dev, test y CI se comportan exactamente igual que antes.
7. Las 14 ofertas conservan `source`, `externalId`, título, tags y lógica salarial, y
   quedan marcadas en `company` y `description`.
8. Reejecutar el seed converge un registro gestionado con valores antiguos al dataset
   canónico marcado, sin duplicar y sin tocar ofertas ajenas.
9. Bajo modo sintético el registro solo acepta el dominio reservado exacto y rechaza
   subdominios y sufijos engañosos con `400 SYNTHETIC_STAGING_EMAIL_REQUIRED`.
10. Sin modo sintético el registro se comporta igual que antes.
11. La Web muestra el marcador global solo con `NEXT_PUBLIC_JOBIT_DATA_MODE=SYNTHETIC_STAGING`.
12. `/health` conserva su contrato exacto; `/ready` devuelve 200 con sonda correcta y 503
    con sonda fallida, sin detalle del error y sin emitir logs.
13. Sin cambio de Prisma, sin migración, sin dependencia nueva, sin cambio de lockfile.

## 19. Tests mínimos

- **Modo de datos:** ausente, vacío, válido, inválido, distinta caja; pureza.
- **Guarda de arranque:** las once filas de la tabla de §7.
- **Guarda de seed:** las nueve filas de la tabla de §8, más la regresión de dev/test/CI.
- **Dataset:** 14 registros, `source` y `externalId` intactos, ambos prefijos presentes,
  determinismo temporal conservado.
- **Convergencia:** registro gestionado con valores antiguos → reejecución → mismos
  valores canónicos, sin duplicado; oferta ajena intacta.
- **Registro:** el schema Zod actual acepta `e2e+abc123@synthetic.jobit.invalid`; modo
  sintético acepta el dominio exacto y rechaza dominio ordinario, subdominio y sufijo
  engañoso; sin modo, comportamiento previo.
- **Readiness:** `/health` sin cambios; `/ready` 200 y 503; ausencia de detalle en la
  respuesta; ausencia de logs ante sonda fallida.
- **Marcador Web:** presente con la variable, ausente sin ella.

## 20. Prisma y dependencias

```text
PRISMA_SCHEMA_CHANGE:  NO
NEW_MIGRATION:         NO
NEW_DEPENDENCY:        NO
LOCKFILE_CHANGE:       NO
```

## 21. Documentos relacionados

- [ADR-0012 — arquitectura de deploy staging](../../decisions/ADR-0012-staging-deploy-architecture.md)
- [Spec — deploy dev/staging readiness](deploy-staging-readiness.md)
- [Spec — database seed safety gates](database-seed-safety-gates.md) (enmendada por esta unidad)
- [Spec — jobs API visibility](jobs-api-visibility.md)
- [Runbook — backup y restore](../../deployment/backup-restore-runbook.md)
- [Skill — privacy/legal reference](../../agents/skills/privacy-legal-reference.md)
