# Informe final operador — Sprint 16C Prisma Multi-source

## Sprint o tarea

Sprint 16C — Prisma minimal multi-source.

## Objetivo inicial

Preparar el modelo Prisma de JobIT para soportar una segunda fuente externa aprobada
(`ADZUNA`) con el cambio mínimo necesario, **sin implementar todavía ninguna integración
nueva**. Este sprint NO implementa Adzuna: solo deja el modelo listo para que una fase
posterior (16D) pueda hacerlo.

## Alcance aprobado por el orquestador

- Añadir **solo** `ADZUNA` al enum `JobSource`.
- **No** añadir `JOBICY`, `WE_WORK_REMOTELY`, `GREENHOUSE`, `LEVER`, `ASHBY` ni otras fuentes.
- **No** añadir `salaryCurrency` (diferido a 16D si Adzuna lo exige).
- **No** añadir `applyUrl`, `publishedAt` ni `rawSourcePayload`.
- Revisar la unicidad `(source, externalId)`: si ya es global y suficiente, no cambiarla.
- Mantener `INTERNAL` y `JOOBLE` funcionando sin cambios de comportamiento.
- No tocar frontend. No implementar Adzuna. No crear provider registry real.

## Estado inicial

- Ruta WSL correcta: `/home/david/projects/JobIT-platform`.
- `dev` actualizado por `git pull --ff-only` (fast-forward tras PR #65 / Sprint 16B, `faec9cb`).
- Working tree limpio antes de crear rama.
- Rama creada: `feat/sprint-16c-prisma-multi-source`, desde `dev`.
- Sin repos anidados.
- Base de datos local disponible: contenedor `jobit-postgres-test` (`:5434`, `jobit_dev`).

## Trabajo realizado

1. Inspección completa del estado Prisma (enum, modelo `Job`, índices, unicidad,
   referencias a `JobSource`/`JOOBLE`/`INTERNAL` en `src`/`prisma` y tests).
2. Confirmación de que la unicidad `(source, externalId)` **ya existe y ya es global**
   (ver "Decisiones técnicas"): no requiere ningún cambio.
3. Añadido `ADZUNA` al enum `JobSource` en `schema.prisma` (una línea).
4. Creación y aplicación de la migración Prisma versionada con el comando real del repo
   (`prisma migrate dev --name add_adzuna_job_source`).
5. Verificaciones completas (typecheck, test, build, `prisma validate`, `prisma generate`).
6. Redacción de este informe final.

## Cambios de schema

Único cambio en `apps/api/prisma/schema.prisma` (1 línea añadida):

```prisma
enum JobSource {
  INTERNAL
  JOOBLE
  ADZUNA
}
```

**No** se modificó el modelo `Job` (ni `salaryCurrency`, `applyUrl`, `publishedAt`,
`rawSourcePayload`), **ni** `SavedJob`, **ni** ningún índice/constraint existente.

### Unicidad `(source, externalId)`: ya global, sin cambios

La unicidad ya está implementada como **índice único parcial en SQL crudo** en la
migración `20260623110355_add_job_provenance`:

```sql
CREATE UNIQUE INDEX "Job_source_externalId_key" ON "Job"("source", "externalId") WHERE "externalId" IS NOT NULL;
```

Es **global y correcta para multi-fuente**: la condición `WHERE "externalId" IS NOT NULL`
se aplica sobre `externalId` (no está restringida a `source = 'JOOBLE'`), por lo que ya
cubre cualquier valor futuro del enum, incluido `ADZUNA`, sin ningún cambio. Además, al
ser parcial, permite que múltiples filas `INTERNAL` con `externalId = NULL` coexistan. Se
escribió a mano en su día porque Prisma no expresa índices únicos parciales en el schema
declarativo; por eso **no** aparece como `@@unique` en `schema.prisma` y no debe añadirse
uno (crearía un índice único total distinto, que bloquearía los múltiples `NULL` de
`INTERNAL`). Decisión: **no tocarla**.

## Migración creada

`apps/api/prisma/migrations/20260703122811_add_adzuna_job_source/migration.sql`:

```sql
-- AlterEnum
ALTER TYPE "JobSource" ADD VALUE 'ADZUNA';
```

Migración **aditiva** (solo añade un valor al enum). En PostgreSQL, `ADD VALUE` sobre un
enum es una operación segura y no bloqueante; no afecta a datos existentes ni a las filas
`INTERNAL`/`JOOBLE`. Aplicada correctamente contra `jobit_dev` (`Your database is now in
sync with your schema`), con regeneración automática del Prisma Client.

## Tests actualizados

**Ninguno.** No hizo falta tocar tests, schemas ni serializers:

- El typecheck pasó sin errores al añadir el valor del enum, porque `jobs.schemas.ts`
  valida el filtro `?source=` con un array de zod propio (`JOB_SOURCES = ["INTERNAL",
  "JOOBLE"]`), **independiente** del enum de Prisma. Ese array define qué fuentes son
  filtrables **por la UI del candidato hoy**; añadir `ADZUNA` al filtro público es una
  decisión de la fase que realmente ingiera Adzuna (16D), no de esta preparación de modelo.
- Los tests de `jobs-visibility` y `jobs-provenance` solo ejercitan `INTERNAL`/`JOOBLE`
  explícitamente; añadir un valor nuevo al enum no los rompe.
- La suite completa quedó en verde sin modificaciones (ver Verificaciones).

## Archivos modificados

- **Modificado**: `apps/api/prisma/schema.prisma` (+1 línea: `ADZUNA` en `enum JobSource`).
- **Nuevo**: `apps/api/prisma/migrations/20260703122811_add_adzuna_job_source/migration.sql`.
- **Nuevo**: `docs/sprints/sprint-16c-prisma-multi-source-final-report.md` (este informe).
- Regenerado (no versionado, en `node_modules`): Prisma Client.

## Tests y verificaciones

Ejecutadas en el clon nativo de WSL, todas en verde:

- `pnpm --filter @jobit/api typecheck` → **OK** (sin errores tras el nuevo valor de enum).
- `pnpm --filter @jobit/api test` → **OK — 37 archivos, 351 tests** (sin regresiones).
- `pnpm --filter @jobit/api build` → **OK**.
- `pnpm --filter @jobit/api exec prisma validate` → **OK** ("The schema is valid").
- `pnpm --filter @jobit/api exec prisma generate` → **OK**.
- `git diff --check` → **OK**.
- `git status --short` → `M schema.prisma` + la carpeta de la nueva migración (untracked);
  nada fuera de alcance (ningún archivo prohibido tocado, verificado).

## Decisiones técnicas

- **No generalizar la unicidad**: ya era global vía índice único parcial (`WHERE
  "externalId" IS NOT NULL`). Añadir `@@unique([source, externalId])` habría sido **peor**
  (índice único total que rompería los múltiples `INTERNAL` con `externalId = NULL`).
- **Migración aditiva de enum**: `ADD VALUE` es seguro en PostgreSQL; no se renombra ni se
  elimina ningún valor, preservando compatibilidad total con datos existentes.
- **No tocar `jobs.schemas.ts`**: el filtro público `?source=` es una superficie de
  producto de la UI del candidato; exponer `ADZUNA` como valor filtrable corresponde a la
  fase que ingiera Adzuna (16D), no a esta preparación de modelo. Mantenerlo intacto evita
  ampliar el contrato público antes de que haya datos Adzuna reales.
- **API pública intacta**: `serializeJob`/`JobPublicDto` siguen exponiendo `source`/
  `sourceUrl` y ocultando `externalId`/`ingestedAt` para cualquier fuente, sin cambios.

## Problemas encontrados

Ninguno. El cambio fue mínimo y limpio; la unicidad ya cubría multi-fuente, así que la
única acción real fue añadir el valor del enum + su migración.

## Pendiente

- Aprobación del orquestador y cierre Git de este sprint (commit + push + PR), pendiente
  de instrucción explícita.
- **Sprint 16D — Adzuna provider spike**: no se ejecuta sin (a) revisar el ToS completo de
  Adzuna, (b) confirmar credenciales fuera del chat, (c) no pegar secretos en la
  conversación, (d) no hacer llamadas reales sin autorización explícita.
- Decisión futura (16D): si Adzuna requiere `salaryCurrency`, se añadirá entonces; y si se
  quiere que la UI filtre por `ADZUNA`, ampliar `JOB_SOURCES` en `jobs.schemas.ts` en esa fase.

## Recomendación para el orquestador

- **Sprint 16C: PASS.** El modelo soporta `ADZUNA` con el cambio mínimo (una línea de enum
  + una migración aditiva). Unicidad `(source, externalId)` confirmada como ya global.
  `INTERNAL`/`JOOBLE` intactos, API pública sin cambios, 351 tests en verde, sin tocar
  frontend, sin implementar Adzuna, sin dependencias ni secretos.
- **Siguiente sprint recomendado: Sprint 16D — Adzuna provider spike without secrets**,
  con las precondiciones de ToS/credenciales indicadas arriba.

## Prompt sugerido para continuar

```
PROMPT PARA CLAUDE — Sprint 16D · Adzuna provider spike without secrets

Objetivo:
Implementar la primera integracion de Adzuna de forma controlada y sin exponer
secretos, siguiendo el patron ya validado con Jooble (client -> normalizer ->
ingest.service -> script manual), reutilizando el valor de enum JobSource.ADZUNA
anadido en Sprint 16C.

PRECONDICIONES OBLIGATORIAS antes de empezar (kill-switch si no se cumplen):
- Revisar el ToS COMPLETO de Adzuna (no solo la overview) y confirmar que el
  modelo "mostrar + enlazar con atribucion" es compatible. Si no lo es, ABORTAR
  y pasar a la alternativa (ATS curado o Jobicy/WWR), como fija product-rules.
- Credenciales (ADZUNA_APP_ID / ADZUNA_APP_KEY) gestionadas por el operador
  FUERA del chat; NUNCA pegarlas en la conversacion.
- No hacer NINGUNA llamada real a Adzuna sin autorizacion explicita del operador.

Contexto:
Sprint 16C dejo JobSource con ADZUNA y confirmo la unicidad (source, externalId)
global. La spec docs/specs/features/job-sources-aggregation.md define el contrato
ExternalJob, las reglas de ingesta, dedupe y legal/ToS.

Archivos/carpetas afectadas:
- apps/api/src/jobs/external/adzuna/** (client, normalizer, ingest.service,
  schemas, types, __fixtures__, *.test.ts)
- apps/api/src/jobs/scripts/ingest-adzuna.ts
- apps/api/.env.example (placeholders sin valores reales)
- docs/specs/features/job-sources-aggregation.md (actualizar estado si procede)
- docs/sprints/sprint-16d-adzuna-provider-final-report.md

Tareas concretas:
1. Actualizar dev y crear rama feat/sprint-16d-adzuna-provider desde dev.
2. Confirmar ToS y precondiciones ANTES de escribir codigo.
3. Implementar client/normalizer/ingest siguiendo el patron Jooble, con config
   inyectada por deps (no leer process.env dentro del client).
4. Fixtures sin datos sensibles; tests unitarios sin red.
5. Script de ingesta manual backend-only, env-based, sin imprimir la key.
6. Anadir ADZUNA al filtro publico JOB_SOURCES en jobs.schemas.ts si se decide
   exponerlo en la UI (y actualizar tests de visibility en consecuencia).
7. Valorar salaryCurrency SOLO si Adzuna lo exige (con migracion aparte y aprobada).
8. Verificaciones backend completas.

Restricciones:
No scraping. No live search. No aplicar desde JobIT. No imprimir la API key.
No pegar secretos. No Co-Authored-By. No commit/push/PR sin autorizacion.
No implementar mas fuentes que Adzuna.

Criterios de aceptacion:
Adzuna se puede ingerir por script manual; upsert idempotente por
(source, externalId); sourceUrl/redirect_url como CTA externo; fuente visible;
sin secretos; Jooble/INTERNAL sin regresiones; typecheck/test/build verdes;
informe final.

Formato esperado de salida:
# Resultado Sprint 16D — Adzuna provider spike
## Estado inicial
## ToS y precondiciones confirmadas
## Cliente/normalizer/ingest
## Fixtures y tests
## Script de ingesta
## Verificaciones ejecutadas
## Estado Git final
## Recomendacion siguiente
```
