# Spec: Database & Seed Safety Gates (Sprint 23)

## 1. Objetivo

Impedir que una configuración ausente, ambigua o incorrecta permita:

- que el setup de tests de `@jobit/api` migre o trunque una base de datos que no sea una
  base de test dedicada;
- que el seed de desarrollo (`apps/api/prisma/seed.ts`) borre Jobs ajenos o Saved Jobs de
  cualquier usuario, en cualquier entorno alcanzable.

Esta spec cubre exclusivamente los hallazgos `TEST-01` y `DATA-04` de
`docs/sprints/sprint-22-production-readiness-real-data-audit-report.md`. No amplía, redefine
ni reabre ningún otro hallazgo de ese informe.

## 2. Contexto y origen en TEST-01/DATA-04

- **TEST-01** (`docs/sprints/sprint-22-production-readiness-real-data-audit-report.md`,
  matriz principal y §13): `apps/api/src/tests/setup.ts` resuelve
  `process.env["DATABASE_URL_TEST"] ?? process.env["DATABASE_URL"] ?? ""` antes de ejecutar
  `prisma migrate deploy`, y `truncateTables()` ejecuta `TRUNCATE ... RESTART IDENTITY CASCADE`
  sobre 12 tablas (incluidas `"Job"` y `"SavedJob"`) sin comprobar el destino. CI mitiga
  parcialmente porque siempre inyecta `DATABASE_URL_TEST` (`.github/workflows/ci.yml`), pero
  no existe ningún kill-switch verificable para ejecuciones locales.
- **DATA-04** (mismo informe, §9 y §16): `apps/api/prisma/seed.ts` ejecuta
  `prisma.job.deleteMany()` sin `where`. Por la relación `SavedJob.job` con
  `onDelete: Cascade` (`apps/api/prisma/schema.prisma`), ese borrado elimina también
  cualquier `SavedJob` de cualquier usuario, en cualquier base alcanzable por
  `DATABASE_URL`.
- Ambos hallazgos están clasificados `P0` / `SECURITY_REVIEW_REQUIRED` y son el primer sprint
  del roadmap posterior ("Safety gate de datos") antes de cualquier dato real.

## 3. Usuarios y sistemas afectados

- **Operador/agente IA** que ejecuta `pnpm --filter @jobit/api test` o
  `tsx prisma/seed.ts` localmente.
- **CI** (`JobIT CI`, job `api`): ya inyecta `DATABASE_URL_TEST` dummy; debe seguir pasando
  sin cambios en `.github/workflows/ci.yml`.
- **E2E manual** (`JobIT E2E (manual)`): ejecuta `prisma migrate deploy` y
  `tsx prisma/seed.ts` de forma explícita contra `jobit_e2e`, sin pasar por Vitest; debe
  seguir pasando sin cambios en `.github/workflows/e2e.yml`.
- **Candidato (indirecto):** cualquier usuario con ofertas guardadas (`SavedJob`) queda
  protegido de una pérdida silenciosa de su lista por una ejecución de seed.

## 4. Terminología

| Término | Significado |
|---|---|
| Base de test dedicada | Base cuyo nombre clasifica como `TEST` (véase §5), usada exclusivamente por el `globalSetup` de Vitest y los tests de integración de `@jobit/api`. |
| Dataset controlado | Los 14 registros `Job` con `source = INTERNAL` y `externalId` en el namespace `jobit-seed-NNN`, gestionados exclusivamente por `apps/api/prisma/seed.ts`. |
| Destino / target | La base de datos a la que apunta una URL de conexión, una vez parseada (host, puerto, nombre de base). |
| Clasificación | El resultado categórico (§5) obtenido a partir del nombre de base normalizado. |
| Guarda | Función pura que valida un destino y lanza un error sanitizado si no cumple la política, antes de cualquier efecto secundario. |

## 5. Clasificación de destinos

El nombre de base se normaliza a minúsculas y se divide en tokens por cualquier secuencia de
caracteres no alfanuméricos (`_`, `-`, `.`, etc.). Se compara cada token contra marcadores
exactos (no subcadena):

| Categoría | Marcadores (token exacto) |
|---|---|
| `DEVELOPMENT` | `dev`, `development` |
| `TEST` | `test` |
| `E2E` | `e2e` |
| `STAGING` | `stage`, `staging` |
| `PRODUCTION` | `prod`, `production` |

Regla de resolución:

- Ningún marcador coincide → `UNKNOWN`.
- Exactamente una categoría coincide → esa categoría.
- Más de una categoría coincide → `AMBIGUOUS`.

Ejemplos contractuales (fijados por el Chat Director, no reinterpretables):

```text
jobit_dev         → DEVELOPMENT
jobit-development → DEVELOPMENT
jobit_test        → TEST
jobit-e2e         → E2E
jobit_stage       → STAGING
jobit_staging     → STAGING
jobit_prod        → PRODUCTION
jobit_production  → PRODUCTION
contest           → UNKNOWN
latest            → UNKNOWN
customer_data      → UNKNOWN
jobit_test_prod   → AMBIGUOUS
```

`UNKNOWN` y `AMBIGUOUS` siempre son rechazados por ambas guardas (§6, §7); ninguna guarda usa
solamente `NODE_ENV`, una denylist aislada, `includes("test")` o la comparación con otra URL
como único criterio.

## 6. Invariantes de TEST-01

1. `DATABASE_URL_TEST` debe estar presente y no vacía (sin `trim()` vacío). Sin fallback a
   `DATABASE_URL` en ningún punto del código.
2. La URL debe ser parseable y usar protocolo `postgresql:`/`postgres:`.
3. El destino debe clasificar exactamente como `TEST`.
4. `UNKNOWN` y `AMBIGUOUS` se rechazan.
5. Si `DATABASE_URL` también está definida, debe ser por sí misma una URL válida (una URL
   ordinaria malformada rechaza la configuración completa por ambigua). Puede resolver al
   **mismo** destino normalizado (host + puerto efectivo + nombre de base) que
   `DATABASE_URL_TEST` únicamente cuando ese destino también clasifica como `TEST`.
6. La guarda se ejecuta antes de crear cualquier `PrismaClient`, antes de
   `prisma migrate deploy` y antes de cualquier `TRUNCATE`.
7. Los errores nunca incluyen usuario, contraseña, URL completa ni query string.

### 6.1 Alias seguro frente a fallback inseguro

`DATABASE_URL_TEST` debe clasificar inequívocamente como `TEST`. `DATABASE_URL` puede
resolver al mismo destino únicamente cuando también clasifica como `TEST`. Este alias
explícito es necesario para los workers de Vitest y **no** constituye un fallback silencioso.

La diferencia es sustancial:

```text
Fallback inseguro (eliminado en este sprint):
DATABASE_URL_TEST ausente → usar DATABASE_URL
```

```text
Alias seguro (comportamiento existente de Vitest, preservado):
DATABASE_URL_TEST válida y clasificada TEST
→ Vitest asigna esa misma URL a DATABASE_URL para el PrismaClient del worker
```

En el fallback, una variable ausente degradaba silenciosamente hacia otro destino posiblemente
peligroso. En el alias, la variable dedicada se valida primero y solo después se reutiliza su
valor ya verificado; `DATABASE_URL` nunca sustituye a `DATABASE_URL_TEST` ni relaja su
validación. Concretamente (`apps/api/vitest.config.ts`), en `globalSetup` solo existe
`DATABASE_URL_TEST`, mientras que en el worker ambas variables apuntan al mismo `jobit_test`.

**Nota técnica.** La comprobación de colisión se conserva como defensa en profundidad. La
protección principal y efectiva es la clasificación positiva de `DATABASE_URL_TEST` como
`TEST`. No debe entenderse `TARGET_COLLISION` como una garantía activa frente a dos nombres
de base iguales con clasificaciones distintas: esa combinación no es posible con el
clasificador actual, que deriva la clasificación de forma determinista del propio nombre.

## 7. Invariantes de DATA-04

> **Enmendado por la Fase C** (`C — STAGING TECHNICAL READINESS`). Las invariantes 1, 2 y 4
> se sustituyen por las de §7.bis. Se conservan aquí, tachadas conceptualmente, para que la
> enmienda quede trazable y no se reinterprete en silencio.

1. ~~El entrypoint CLI del seed solo puede ejecutarse cuando el destino de `DATABASE_URL`
   clasifica como `DEVELOPMENT` o `E2E`.~~ → ver §7.bis
2. ~~`TEST`, `STAGING`, `PRODUCTION`, `UNKNOWN` y `AMBIGUOUS` se rechazan.~~ → ver §7.bis
3. `DATABASE_URL` ausente, vacía, inválida o con protocolo no permitido se rechaza.
4. ~~`NODE_ENV === "production"` bloquea la ejecución aunque el nombre de base clasifique
   como `DEVELOPMENT` o `E2E` (defensa en profundidad).~~ → ver §7.bis
5. La guarda se ejecuta antes de instanciar `PrismaClient` y antes de cualquier operación
   sobre `Job`.
6. No existe ningún `deleteMany()`, `delete()` ni `TRUNCATE` global sobre `Job` en el flujo
   del seed.
7. El dataset controlado (§12) es el único conjunto de filas que el seed puede crear o
   actualizar; ninguna fila ajena (otro `source`, otro `externalId`) puede ser alcanzada por
   sus operaciones.
8. Ningún `SavedJob` puede perderse como efecto de ejecutar el seed.

## 7.bis Enmienda de la Fase C — excepción controlada de staging sintético

**Unidad:** `C — STAGING TECHNICAL READINESS` · **Decisión del Director:** `D1`
**Spec de la unidad:** [`staging-technical-readiness.md`](staging-technical-readiness.md) §8

### Invariante anterior

El seed solo admitía `DEVELOPMENT` y `E2E`. `STAGING` se rechazaba siempre con
`UNSAFE_CLASSIFICATION`, y `NODE_ENV === "production"` bloqueaba en todos los casos.

### Motivo de la enmienda

El procedimiento de staging documentado en
[`staging-vps-deploy-runbook.md`](../../deployment/staging-vps-deploy-runbook.md) §10
dejó de ser ejecutable al introducirse esta guarda: el destino se llama `jobit_staging`
(clasifica `STAGING`) y staging corre con `NODE_ENV=production`, de modo que las
invariantes 2 y 4 lo rechazaban por partida doble. Sin ofertas en la base, los recorridos
de jobs, guardadas y match no pueden validarse en un staging sintético.

La alternativa —renombrar la base para que clasificara `DEVELOPMENT`— se descartó: falsearía
el clasificador, que es precisamente el límite de seguridad del sistema.

### Invariante nuevo (controlado)

| Clasificación | `JOBIT_DATA_MODE` | Seed | Código de rechazo |
|---|---|---|---|
| `DEVELOPMENT` / `E2E` | ausente o `SYNTHETIC_STAGING` | permitido | — (reglas anteriores intactas, incluido el bloqueo por `NODE_ENV=production`) |
| `STAGING` | ausente | **rechazado** | `DATA_MODE_REQUIRED` |
| `STAGING` | valor inválido | **rechazado** | `INVALID_DATA_MODE` |
| `STAGING` | `SYNTHETIC_STAGING` | **permitido**, incluso con `NODE_ENV=production` | — |
| `PRODUCTION` | `SYNTHETIC_STAGING` | **rechazado** | `PRODUCTION_MODE_CONFLICT` |
| `PRODUCTION` | cualquier otro | **rechazado** | `UNSAFE_CLASSIFICATION` / `PRODUCTION_ENVIRONMENT` |
| `TEST` | cualquiera | **rechazado** | `UNSAFE_CLASSIFICATION` |
| `UNKNOWN` / `AMBIGUOUS` | cualquiera | **rechazado** | `UNSAFE_CLASSIFICATION` / `PRODUCTION_ENVIRONMENT` |

Precisiones que acotan la enmienda:

- La relajación de `NODE_ENV=production` alcanza **exclusivamente** a la rama
  `STAGING` + `SYNTHETIC_STAGING`. En cualquier otra clasificación sigue bloqueando.
- `PRODUCTION` permanece **inalcanzable bajo cualquier combinación** de variables. El caso
  `PRODUCTION` + modo sintético se comprueba **antes** que ninguna otra rama, para que
  declarar el modo no pueda abrir ningún camino.
- La llave es **única**. No existen `JOBIT_SEED_SYNTHETIC_STAGING`, `ALLOW_SEED` ni
  `FORCE_SEED`: una segunda variable sería una fuente de verdad capaz de discrepar de
  `JOBIT_DATA_MODE`.
- Sin `JOBIT_DATA_MODE`, el comportamiento en desarrollo, test y CI es idéntico al anterior.
- Las invariantes 3, 5, 6, 7 y 8 se conservan sin cambios.

### Tests que protegen el invariante nuevo

En `apps/api/src/lib/database-safety.test.ts`, bloque
*"assertSeedableDatabaseUrl — contrato de staging sintetico"*:

- las nueve filas de la tabla anterior, una por una;
- `PRODUCTION` recorrido sobre el producto cartesiano de `NODE_ENV` × modo, exigiendo
  rechazo en todos los casos;
- regresión explícita de `DEVELOPMENT`, `E2E` y `TEST` con y sin modo declarado;
- ausencia de credenciales en el mensaje de error.

En `apps/api/src/config/synthetic-mode.test.ts`: vocabulario cerrado, fail-fast ante valor
desconocido o de distinta caja, y ausencia del valor recibido en el mensaje de error.

## 8. Flujo seguro del globalSetup

```text
Vitest arranca globalSetup (apps/api/src/tests/setup.ts)
→ assertTestDatabaseUrl(process.env)   [lanza si no cumple §6]
→ prisma migrate deploy (DATABASE_URL_TEST validada)
→ Vitest carga los ficheros *.test.ts
→ cada test importa el PrismaClient compartido (apps/api/src/lib/prisma.ts)
→ beforeEach: assertTestDatabaseUrl(process.env) [defensa en profundidad] → truncateTables(prisma)
```

Si la guarda lanza, Vitest aborta el `globalSetup` y ningún fichero de test llega a
importarse ni a crear un `PrismaClient`.

## 9. Flujo seguro del seed CLI

```text
tsx prisma/seed.ts
→ assertSeedableDatabaseUrl(process.env)   [lanza si no cumple §7]
→ new PrismaClient()
→ runInternalJobsSeed(prisma)  (findFirst → update|create, dataset controlado)
→ log de resumen (sin secretos)
→ prisma.$disconnect()
```

Si la guarda lanza, el proceso termina con código de salida distinto de cero antes de crear
ningún `PrismaClient` y antes de ejecutar ninguna consulta.

## 10. Validación anterior a efectos secundarios

Ambas guardas (`assertTestDatabaseUrl`, `assertSeedableDatabaseUrl`) son funciones puras y
síncronas: reciben un objeto de entorno (`NodeJS.ProcessEnv` o equivalente inyectable) y
devuelven el destino parseado o lanzan. Ningún llamador puede alcanzar el paso siguiente
(crear cliente, migrar, truncar, sembrar) sin que la guarda correspondiente retorne con éxito
primero. Los tests unitarios (§18) fijan este contrato mediante funciones/objetos inyectables
antes de que exista la integración real en `setup.ts`/`seed.ts`.

## 11. Sanitización

- Los mensajes de error citan como máximo: nombre de la variable de entorno, motivo del
  rechazo (ausente/formato/protocolo/clasificación/ambigüedad/coincidencia) y, cuando ayude a
  diagnosticar, el nombre de base y el host ya extraídos (nunca la URL completa).
- Nunca se incluye en un error ni en un log: usuario, contraseña, query string ni la cadena
  de conexión completa.
- El checkpoint `DB_GATE_READY_FOR_APPROVAL` es el único canal autorizado para mostrar
  host/puerto/nombre de base/clasificación durante la revisión humana.
- El entrypoint CLI del seed (`apps/api/prisma/seed.ts`) aplica una capa adicional, más
  conservadora: ante un fallo nunca reenvía el texto original de la excepción. Si es un
  rechazo de la guarda de destino, registra únicamente `UNSAFE_DATABASE_TARGET:<CODE>` con el
  código ya sanitizado de la guarda; cualquier otro error se colapsa a un único mensaje
  genérico (`SEED_OPERATION_FAILED`), sin `message` ni `stack` del error original.

## 12. Dataset controlado

El dataset son los mismos 14 puestos de trabajo ficticios ya existentes en
`apps/api/prisma/seed.ts` (variedad de `remoteType`, `seniority`, `contractType`, `tags`,
salario, un caso `CLOSED` y un caso expirado), reetiquetados con:

- `source: "INTERNAL"` (ya es el default del modelo);
- un `externalId` explícito e inmutable del namespace reservado `jobit-seed-*` (§13).

Ninguna oferta ingerida por Jooble/Greenhouse (`source: "JOOBLE" | "GREENHOUSE"`) ni ninguna
oferta `INTERNAL` fuera de ese namespace pertenece al dataset controlado ni puede ser
alcanzada por el seed.

## 13. Identificadores `jobit-seed-NNN`

Cada una de las 14 entradas declara su propio identificador estático, en el propio literal
del dataset (no derivado de título, empresa, descripción ni de la posición en el array):

```text
jobit-seed-001
jobit-seed-002
...
jobit-seed-014
```

El criterio de pertenencia al dataset controlado es exactamente:

```text
source = "INTERNAL" AND externalId = "jobit-seed-NNN"
```

Si en el futuro se añade o quita una entrada del array, su identificador no se reutiliza ni
se recalcula: cada entrada mantiene el identificador con el que se documentó aquí.

## 14. Estrategia de actualización in place

Patrón reutilizado de `jooble.ingest.service.ts` / `greenhouse.ingest.service.ts` (upsert
manual, porque el índice único parcial `(source, externalId)` no es representable como
`@@unique` en `schema.prisma`):

```text
findFirst({ source: "INTERNAL", externalId: "jobit-seed-NNN" })
→ si existe: update(where: { id }, data: <campos de contenido>)
→ si no existe: create(data: <campos de contenido + source + externalId>)
→ P2002 en el create (carrera): re-find → update
```

**Campos de contenido** (se actualizan en cada ejecución si cambian en el literal del
dataset): `title`, `company`, `location`, `remoteType`, `description`, `requirements`,
`seniority`, `contractType`, `salaryMin`, `salaryMax`, `tags`, `status`.

**Campos temporales excluidos del `update`** (solo se fijan en el `create` inicial, para no
producir deriva en cada ejecución): `postedAt`, `expiresAt`. Una vez creado un registro del
dataset, sus fechas permanecen estables aunque se re-siembre repetidamente.

No se modifica `schema.prisma`. No se añade ninguna migración.

## 15. Estabilidad tras segunda ejecución

Con la estrategia de §14:

- 1ª ejecución: crea 14 filas (`created = 14`, `updated = 0`).
- 2ª ejecución sin cambios en el literal del dataset: encuentra las 14 filas por
  `(source, externalId)`, actualiza los mismos valores de contenido (`created = 0`,
  `updated = 14`), no crea duplicados y no reescribe `postedAt`/`expiresAt`.
- `prisma.job.count({ where: { source: "INTERNAL", externalId: { startsWith: "jobit-seed-" } } })`
  permanece en `14` indefinidamente, salvo que el literal del dataset cambie de tamaño.

## 16. Compatibilidad con CI

Sin cambios en `.github/workflows/ci.yml`. El job `api` nunca invoca
`tsx prisma/seed.ts`; solo ejecuta `pnpm --filter @jobit/api test`, que dispara el
`globalSetup` con `DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/jobit_test?schema=public`
(dummy del service efímero). El nombre `jobit_test` clasifica como `TEST` → `assertTestDatabaseUrl`
lo acepta sin cambios de configuración.

## 17. Compatibilidad con E2E

Sin cambios en `.github/workflows/e2e.yml`. El workflow fija
`DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jobit_e2e?schema=public` y ejecuta
`prisma migrate deploy` y `tsx prisma/seed.ts` como pasos explícitos, sin pasar por Vitest ni
por `globalSetup`. El nombre `jobit_e2e` clasifica como `E2E` → `assertSeedableDatabaseUrl` lo
acepta; `NODE_ENV` no está definido a nivel de job en ese step, lo cual también es aceptado
(la guarda solo bloquea cuando `NODE_ENV === "production"`, nunca exige que esté definido).

## 18. Tests mínimos

**Unitarios (sin base de datos; entorno fabricado como argumento, no `process.env` real):**

- `classifyDatabaseName`: los 12 ejemplos contractuales de §5, más case-insensitividad y
  nombre vacío.
- `parseDatabaseTarget`: URL ausente, vacía, malformada, protocolo no permitido, nombre de
  base vacío, extracción correcta de host/puerto/nombre/clasificación, ausencia de
  credenciales/URL/query string en cualquier error lanzado.
- `assertTestDatabaseUrl`: variable ausente/vacía, clasificación distinta de `TEST`,
  `AMBIGUOUS`, `UNKNOWN`, igualdad normalizada con `DATABASE_URL`, caso válido (acepta),
  caso válido con `DATABASE_URL` apuntando a otro destino (acepta), sanitización de
  usuario/contraseña/URL completa/query string en los errores.
- `assertSeedableDatabaseUrl`: variable ausente/inválida, `DEVELOPMENT` acepta, `E2E` acepta,
  `TEST`/`STAGING`/`PRODUCTION`/`UNKNOWN`/`AMBIGUOUS` rechazan, `NODE_ENV=production` rechaza
  incluso con nombre `DEVELOPMENT`, sanitización de errores. **Desde la enmienda de §7.bis**,
  el rechazo de `STAGING` sin modo emite `DATA_MODE_REQUIRED` en lugar de
  `UNSAFE_CLASSIFICATION` —cambia el motivo, no la permisividad— y se añade la batería del
  contrato de staging sintético descrita en §7.bis.
- Orden previo a efectos secundarios: un efecto inyectado (spy) nunca se invoca cuando la
  guarda correspondiente lanza.

**Integración (requieren la base de test dedicada; solo tras `DB_GATE_READY_FOR_APPROVAL`):**

- Primera ejecución del seed crea exactamente 14 `Job` con `source=INTERNAL` y
  `externalId` en el namespace `jobit-seed-*`.
- Segunda ejecución no duplica (conteo estable) y actualiza campos de contenido si cambian.
- Un `Job` de `source="JOOBLE"` creado manualmente antes de sembrar permanece intacto tras
  sembrar.
- Un `SavedJob` creado sobre un `Job` del dataset controlado permanece intacto tras una
  segunda ejecución del seed.
- El `globalSetup` real, apuntado deliberadamente a un destino no-`TEST`, lanza antes de
  completar la migración (demostración manual, no parte de la suite automática — ver plan de
  Sprint 23, §10 nota final).

## 19. Criterios de aceptación

- [ ] `apps/api/src/tests/setup.ts` no contiene ningún fallback de `DATABASE_URL_TEST` hacia
      `DATABASE_URL`.
- [ ] La guarda de test se ejecuta antes de `prisma migrate deploy` y antes de
      `truncateTables`.
- [ ] `apps/api/prisma/seed.ts` no contiene ningún `deleteMany()` ni `TRUNCATE` global sobre
      `Job`.
- [ ] La guarda del seed se ejecuta antes de instanciar `PrismaClient`.
- [ ] Dos ejecuciones consecutivas del seed dejan el dataset controlado estable (sin
      duplicados, sin deriva de fechas).
- [ ] Ningún `SavedJob` ni ningún `Job` ajeno se pierde al ejecutar el seed.
- [ ] `pnpm --filter @jobit/api test`, `typecheck` y `build` pasan en verde.
- [ ] `.github/workflows/ci.yml` y `.github/workflows/e2e.yml` permanecen sin cambios y
      siguen pasando.
- [ ] Ningún secreto, credencial ni URL completa aparece en código, tests, logs o
      documentación de este sprint.

## 20. Rollback

No hay migración de base de datos que revertir. El rollback consiste en revertir el commit
de la rama `feat/sprint-23-database-seed-safety-gates` (o los commits concretos que se
autoricen). El `globalSetup` y el seed anteriores no dependían de ningún estado persistente
nuevo; revertir el código basta para volver al comportamiento previo.

## 21. Auditoría

Antes de cualquier autorización Git se aplica
`docs/agents/audit-quality-security-skill.md` completo, con foco específico en:

- ausencia de comandos destructivos sin guarda;
- ausencia de secretos en código/tests/documentación;
- aislamiento demostrado del dataset controlado frente a Jobs/Saved Jobs ajenos;
- idempotencia demostrada tras dos ejecuciones;
- documentación (esta spec y el informe final) coherente con el código entregado.

## 22. Limitaciones conocidas

Limitaciones reales del estado entregado, documentadas para no presentarlas como cubiertas:

- **`prisma/seed.ts` fuera de typecheck y build.** `apps/api/tsconfig.json` declara
  `"rootDir": "src"` e `"include": ["src/**/*.ts"]`, y `tsconfig.build.json` lo extiende sin
  ampliar `include`; el fichero queda fuera de ambas compilaciones (comprobado por la ausencia
  de `dist/prisma/` tras el build). Es preexistente a este sprint. Mitigación: toda la lógica
  sustantiva vive en `internal-seed.service.ts`, bajo `src/`, cubierta por typecheck, build,
  tests unitarios e integración real; el entrypoint queda reducido a cableado.
- **Guarda de ejecución directa no ejercitada empíricamente.** La condición
  `resolve(process.argv[1]) === fileURLToPath(import.meta.url)` de `seed.ts` no se ha
  verificado con una invocación real de `tsx prisma/seed.ts`, porque ejecutar el seed CLI no
  se autorizó durante el sprint. Su ausencia de efectos al importar sí está verificada de
  hecho: el módulo se importa desde la suite sin sembrar nada.
- **`TARGET_COLLISION` es defensa en profundidad, no protección activa.** Con el clasificador
  actual, dos destinos que colisionan comparten nombre de base y por tanto clasificación, de
  modo que esa rama es inalcanzable en la práctica. La protección efectiva es la clasificación
  positiva de `DATABASE_URL_TEST` como `TEST`. Se conserva por contrato y por robustez ante
  cambios futuros del clasificador.
- **Sin script `lint` en `@jobit/api`.** El workspace no define `lint`; el CI tampoco lo
  ejecuta para la API. Preexistente y fuera del alcance de este sprint.
- **Mutación histórica de `process.env` en tests.** Numerosos ficheros de test escriben
  `JWT_ACCESS_SECRET` sin restaurar el valor previo. Es preexistente y benigno con
  `fileParallelism: false`; no afecta a las guardas porque ningún test reescribe
  `DATABASE_URL` ni `DATABASE_URL_TEST`.

## 23. Fuera de alcance

- `PRIV-01` y cualquier otro hallazgo de Sprint 22 distinto de `TEST-01`/`DATA-04`.
- Cambios de schema Prisma, migraciones nuevas, nuevos índices únicos.
- Cambios en `.github/workflows/**`, `apps/api/vitest.config.ts`, `docker/**`,
  `package.json`, `apps/api/package.json`, `pnpm-lock.yaml`.
- Cambios funcionales en Jobs o Saved Jobs (contratos HTTP, DTO, reglas de negocio).
- Frontend, portfolio, match, fuentes externas (Jooble/Greenhouse/Adzuna/InfoJobs).
- Despliegue, staging remoto, VPS, backups, observabilidad.
- Nuevas dependencias.
- Corrección de `docs/development/local-env.md` (prohibida explícitamente en este tramo de
  Execution Mode; queda pendiente de una autorización posterior).
