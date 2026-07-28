# Informe final

## Sprint o tarea

Sprint 23 — Database & Seed Safety Gates.

Resuelve exclusivamente los dos hallazgos P0 técnicos de la auditoría del Sprint 22
(`docs/sprints/sprint-22-production-readiness-real-data-audit-report.md`):

- `TEST-01` — base de datos de tests insegura;
- `DATA-04` — seed destructivo.

## Objetivo inicial

1. Impedir que una configuración ausente, ambigua o incorrecta permita migrar o truncar una
   base que no sea una base de test dedicada.
2. Eliminar el borrado global `job.deleteMany()` del seed de desarrollo y sustituirlo por un
   mecanismo idempetente, aislado e incapaz de eliminar Jobs ajenos o Saved Jobs.

## Clasificación de riesgo

**Nivel 3 — riesgo alto / control estricto.** Afecta a seguridad de datos, bases de datos,
operaciones destructivas, setup de tests, Prisma, seed de desarrollo y relaciones con Saved
Jobs. La ejecución se realizó por gates técnicos con revisión humana en cada punto crítico y
autorización explícita antes de cada operación capaz de conectar con una base de datos.

## Estado inicial y baseline

- Ruta canónica: `/home/david/projects/JobIT-platform`.
- Rama: `feat/sprint-23-database-seed-safety-gates`, creada desde `dev`.
- Baseline: `c65057e64279b038ce3a9ea0a6cd579d8ebc4393` (`dev` = `origin/dev` = merge-base),
  verificado al inicio y de nuevo antes del cierre.
- Working tree limpio al comenzar; sin repositorios anidados.

## Trabajo realizado

- Spec SDD nueva con la política completa de clasificación de destinos, invariantes de ambos
  hallazgos, dataset controlado y limitaciones conocidas.
- Utilidad pura `database-safety.ts` con clasificación por tokens, parsing estructurado y dos
  guardas (tests y seed), con errores sanitizados y códigos cerrados.
- Integración de la guarda en el `globalSetup` de Vitest y en `truncateTables`.
- Servicio `internal-seed.service.ts` con el dataset controlado, el upsert idempotente, el
  runner del seed y el formateador cerrado de fallos.
- Refactor de `apps/api/prisma/seed.ts` a entrypoint fino, sin borrado global.
- Tres suites de test nuevas (unitarias, DB-free e integración real).

## TEST-01 — Protección de la base de tests

Política final:

```text
Protección principal:
DATABASE_URL_TEST debe clasificar como TEST.

Alias permitido:
DATABASE_URL puede apuntar al mismo destino únicamente cuando también es TEST.

Fallback prohibido:
DATABASE_URL_TEST ausente nunca puede sustituirse por DATABASE_URL.
```

Evidencia con referencias:

- `DATABASE_URL_TEST` obligatoria y sin fallback: `apps/api/src/tests/setup.ts:25` invoca
  `assertTestDatabaseUrl(env)` y `apps/api/src/lib/database-safety.ts:150` la exige mediante
  `parseDatabaseTarget(env["DATABASE_URL_TEST"], ...)`. El fallback anterior
  (`DATABASE_URL_TEST ?? DATABASE_URL`) ha desaparecido del fichero.
- Solo se acepta clasificación `TEST`: `apps/api/src/lib/database-safety.ts:152-157`.
- `UNKNOWN` y `AMBIGUOUS` fallan cerrado: `apps/api/src/lib/database-safety.ts:80-85` los
  produce y `:152` los rechaza al no ser `TEST`.
- Protocolos no PostgreSQL rechazados: `apps/api/src/lib/database-safety.ts:117-122`.
- URL ordinaria parseada estrictamente cuando existe:
  `apps/api/src/lib/database-safety.ts:159-164`.
- Alias TEST permitido y distinguido de fallback:
  `apps/api/src/lib/database-safety.ts:165-176`, documentado en la spec §6.1.
- Validación antes de `prisma migrate deploy`: `apps/api/src/tests/setup.ts:25` precede a
  `:32-38`, donde vive el `execSync`.
- Validación antes de `TRUNCATE`: `apps/api/src/tests/setup.ts:47` precede a `:48-50`.
- `truncateTables` no ejecuta SQL si la guarda falla: demostrado en
  `apps/api/src/tests/setup-safety.test.ts:126` (`never executes TRUNCATE when the target is
  unsafe`).
- Errores sin URL, usuario, contraseña ni query string:
  `apps/api/src/lib/database-safety.ts:92-129` construye mensajes con el nombre de variable y
  el motivo; verificado por los tests de sanitización de
  `apps/api/src/lib/database-safety.test.ts`.
- Tests de orden validación → efecto: `apps/api/src/tests/setup-safety.test.ts:108` y `:140`.
- Regresión estática contra el fallback anterior:
  `apps/api/src/tests/setup-safety.test.ts:166`.
- Compatibilidad con los tests históricos: la suite API completa (45 ficheros, 532 tests)
  pasa sin cambios en ningún test preexistente salvo el ajuste de política descrito más abajo.

## DATA-04 — Seed idempotente y no destructivo

Evidencia con referencias:

- Dataset de exactamente 14 Jobs: `apps/api/src/jobs/internal-seed.service.ts:41-301`.
- `externalId` literales `jobit-seed-001` … `jobit-seed-014`, escritos entrada por entrada
  (`apps/api/src/jobs/internal-seed.service.ts:45`, `:63`, `:81`, `:99`, `:117`, `:135`,
  `:153`, `:171`, `:189`, `:207`, `:225`, `:243`, `:262`, `:281`); no derivados de título,
  empresa, fecha ni posición.
- Todos con `source: "INTERNAL"` (14 ocurrencias en el mismo bloque).
- Fechas deterministas desde una constante fija:
  `apps/api/src/jobs/internal-seed.service.ts:22` (`SEED_REFERENCE_DATE`) y `:24-25`
  (`beforeReference`/`afterReference`). Sin `Date.now()` ni `new Date()` sin argumentos en la
  construcción del dataset.
- Sin `job.deleteMany`, sin `job.delete`, sin borrado y recreación, sin `createMany` para
  reemplazar el dataset: la interfaz `InternalSeedPrismaClient`
  (`apps/api/src/jobs/internal-seed.service.ts:303-313`) ni siquiera declara operaciones de
  borrado.
- Búsqueda por `source + externalId`: `apps/api/src/jobs/internal-seed.service.ts:382-385`.
- Actualización por el `id` existente: `apps/api/src/jobs/internal-seed.service.ts:388`.
- `source`, `externalId`, `postedAt` y `expiresAt` excluidos del update:
  `apps/api/src/jobs/internal-seed.service.ts:369-371` (`toUpdateData` devuelve solo
  contenido mutable, definido en `:321-335`).
- Jobs `JOOBLE`/`GREENHOUSE` e `INTERNAL` fuera del namespace intactos: garantizado
  estructuralmente por el `where` de `:383`, verificado en integración real.
- Recuperación de `P2002` por relocalización y update por `id`:
  `apps/api/src/jobs/internal-seed.service.ts:396-405`; el resto de errores se propaga (`:406`).
- Validación antes de crear `PrismaClient`: `apps/api/src/jobs/internal-seed.service.ts:442`
  precede a `:443`; `apps/api/prisma/seed.ts:17` solo entrega la factory.
- `$disconnect` en éxito y error: `apps/api/src/jobs/internal-seed.service.ts:446-448`
  (`finally`).
- `formatSeedFailure` con formatos cerrados:
  `apps/api/src/jobs/internal-seed.service.ts:459-464`.
- `seed.ts` como entrypoint fino y sin ejecutar el seed al importarlo:
  `apps/api/prisma/seed.ts:26-33` (guarda de ejecución directa).

## Archivos modificados

Modificados (2):

- `apps/api/prisma/seed.ts` — de 253 a 34 líneas; entrypoint fino sin borrado global.
- `apps/api/src/tests/setup.ts` — guarda integrada en `globalSetup` y `truncateTables`.

Creados (8):

- `apps/api/src/lib/database-safety.ts`
- `apps/api/src/lib/database-safety.test.ts`
- `apps/api/src/tests/setup-safety.test.ts`
- `apps/api/src/jobs/internal-seed.service.ts`
- `apps/api/src/jobs/internal-seed.service.test.ts`
- `apps/api/src/jobs/internal-seed.integration.test.ts`
- `docs/specs/features/database-seed-safety-gates.md`
- `docs/sprints/sprint-23-database-seed-safety-gates-final-report.md`

## Tests y verificaciones

```text
Tests DB-free:
128/128 PASS

Integración DATA-04 localizada:
5/5 PASS

Suite API completa:
45/45 archivos PASS
532/532 tests PASS
0 fallos
0 reintentos observados

Duración suite completa:
197,11 s

Typecheck API:
PASS

Build API:
PASS

Lint API:
no disponible
```

## Evidencia de integración

Verificada contra la base dedicada `jobit_test`, tras checkpoint sanitizado y autorización
explícita:

```text
Primera ejecución:
created 14
updated 0
total 14

Segunda ejecución:
created 0
updated 14
total 14

IDs Prisma:
preservados

Jobs externos:
preservados

INTERNAL ajeno:
preservado

SavedJob:
preservado

Cascada:
no activada
```

La preservación del `SavedJob` es la verificación central del sprint: con el
`job.deleteMany()` anterior, el `onDelete: Cascade` de `SavedJob.job` lo habría eliminado.

## Seguridad

- Ningún `.env*` se abrió, mostró ni versionó en ninguna fase.
- No se imprime `process.env`, ninguna URL, usuario, contraseña ni query string.
- El entrypoint del seed no registra `error.message`, `error.stack`, `error.cause` ni el
  objeto de error: solo formatos cerrados.
- Toda evidencia sobre bases de datos se presentó sanitizada (host, puerto, nombre de base,
  clasificación).
- `TRUNCATE` existe únicamente en el helper de tests `truncateTables`, ahora precedido por la
  guarda.
- No se añadieron secretos, dependencias, migraciones ni cambios de schema o workflows.
- Las credenciales de los tests son literales sintéticos (`fake-user`, `fake-password`,
  `invalid.local`) usados precisamente para comprobar que **no** se filtran.

## Decisiones técnicas

1. **Clasificación positiva por tokens exactos** (`dev`, `development`, `test`, `e2e`,
   `stage`, `staging`, `prod`, `production`) sobre el nombre de base normalizado, en lugar de
   `NODE_ENV`, denylist aislada o `includes("test")`. `UNKNOWN` y `AMBIGUOUS` fallan cerrado.
2. **Utilidad pura con entorno inyectado** (`EnvLike`), sin leer `process.env` ni importar
   Prisma, dotenv o `child_process`: permite probar todas las reglas sin base de datos.
3. **Upsert manual por `(source, externalId)`**, reutilizando el patrón ya auditado de las
   ingestas Jooble/Greenhouse, en lugar de añadir una clave única al schema: evita cualquier
   migración.
4. **Identificadores estáticos `jobit-seed-NNN`** declarados entrada por entrada, y fechas
   derivadas de una constante fija, para que el dataset sea determinista entre procesos.
5. **Actualización in place excluyendo campos temporales**, de modo que re-sembrar no produce
   deriva ni rompe relaciones.
6. **Servicio bajo `src/` con entrypoint fino en `prisma/`**, replicando el patrón existente
   de los scripts de ingesta, para que la lógica quede cubierta por typecheck, build y tests.
7. **Formateo de fallos con vocabulario cerrado**, que nunca reenvía el texto original de la
   excepción.

## Desviaciones y correcciones durante el sprint

Ninguna desvió el alcance aprobado. Incidencias resueltas durante la ejecución:

1. Docker inicialmente inaccesible desde WSL (falta de integración de Docker Desktop),
   impidiendo diagnosticar el contenedor de PostgreSQL.
2. Uso de una configuración temporal de Vitest, fuera del repositorio y sin `globalSetup`,
   para completar los ciclos RED/GREEN sin conexión a base de datos.
3. Primer intento de integración real bloqueado por `TARGET_COLLISION`.
4. Identificación de la causa: `apps/api/vitest.config.ts` asigna deliberadamente
   `DATABASE_URL = DATABASE_URL_TEST` en los workers, un alias intencionado.
5. Política ajustada para permitir ese alias explícito únicamente cuando ambos destinos
   clasifican como `TEST`.
6. Test histórico de `setup-safety.test.ts` actualizado, ya que codificaba la política
   anterior.
7. Reintento de la integración localizada: 5/5 en verde.
8. Suite API completa: 45/45 ficheros y 532/532 tests en verde.

Ninguna de estas incidencias permanece abierta.

## Problemas encontrados

- El conflicto entre el invariante inicial de colisión y el diseño preexistente de los workers
  de Vitest solo se manifestó al ejecutar contra PostgreSQL real: los tests DB-free no lo
  detectaron porque construyen el entorno como argumento y no reproducen el aliasing de Vitest.
  Quedó resuelto y documentado en la spec §6.1.
- El intento de importar el formateador desde `prisma/seed.ts` hacia un test bajo `src/`
  provocó `TS6059` por la restricción `rootDir`. Se resolvió moviendo la función al servicio,
  bajo `src/`, sin tocar `tsconfig`.

## Limitaciones conocidas

### Lint API

```text
@jobit/api no dispone de script lint.
```

Preexistente y fuera del alcance del sprint. El CI tampoco ejecuta lint para la API.

### Seed fuera de build/typecheck

```text
apps/api/prisma/seed.ts no está incluido en tsconfig.json ni tsconfig.build.json.
```

Comprobado empíricamente por la ausencia de `dist/prisma/` tras el build. Mitigaciones:

- lógica sustantiva bajo `src/`;
- servicio cubierto por typecheck;
- servicio cubierto por build;
- tests unitarios;
- integración real;
- entrypoint mínimo.

### Guard de ejecución directa

No se ejecutó empíricamente:

```text
tsx prisma/seed.ts
```

porque el seed CLI real no fue autorizado en ningún tramo del sprint. Su ausencia de efectos
al importar sí está verificada de hecho: el módulo se importa desde la suite sin sembrar nada.

### TARGET_COLLISION

Defensa en profundidad; la protección efectiva es la clasificación positiva `TEST`. Con el
clasificador actual, dos destinos que colisionan comparten nombre de base y por tanto
clasificación, de modo que esa rama es inalcanzable en la práctica.

### Variables en tests

La mutación histórica de `JWT_ACCESS_SECRET` sin restauración es preexistente y no afecta a
las variables de base de datos: ningún test reescribe `DATABASE_URL` ni `DATABASE_URL_TEST`.

## Fuera de alcance respetado

Sin cambios en:

```text
apps/web/**
apps/api/prisma/schema.prisma
apps/api/prisma/migrations/**
apps/api/vitest.config.ts
apps/api/src/lib/prisma.ts
.github/workflows/**
docker/**
packages/**
package.json
apps/api/package.json
pnpm-lock.yaml
.env*
docs/development/local-env.md
docs/agents/operating-environment.md
```

Tampoco se abordaron `PRIV-01` ni ningún otro hallazgo del Sprint 22, ni se introdujeron
migraciones, dependencias, contratos HTTP/DTO, cambios funcionales de Jobs o Saved Jobs,
despliegue ni cambios de CI/E2E.

## Pendiente

Posibles tareas futuras separadas, no requisitos pendientes de este sprint:

- evaluar cobertura TypeScript de `prisma/seed.ts`;
- añadir lint API;
- valorar restauración de variables globales en tests;
- verificar manualmente el seed CLI solo mediante procedimiento seguro.

## Recomendación para el orquestador

```text
SPRINT_23_READY_FOR_LOCAL_COMMIT
```

Ambos hallazgos P0 técnicos quedan cerrados y verificados contra PostgreSQL real. El gate de
salida definido en el roadmap del Sprint 22 para el sprint "Safety gate de datos" —
*"ningún seed/test puede operar sobre DB no dedicada; Saved Jobs no se borran por seed"* —
se considera cumplido.

## Prompt sugerido para continuar

```text
Autorizar el cierre remoto del Sprint 23 en dos pasos separados:

1. PUSH_APPROVED — subir la rama feat/sprint-23-database-seed-safety-gates a origin.
2. PR_APPROVED — abrir una Pull Request hacia dev, en español, siguiendo
   docs/agents/git-pr-skill.md: resumen breve, cambios principales, verificaciones
   ejecutadas, fuera de alcance respetado y enlace al informe versionado en
   docs/sprints/sprint-23-database-seed-safety-gates-final-report.md.

No incluir merge: la fusión requiere una autorización MERGE_APPROVED posterior y
la PR debe pasar antes los dos jobs del CI.
```
