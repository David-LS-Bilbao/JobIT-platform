# Informe final operador — Sprint 16B Job Sources Aggregation Spec

## Sprint o tarea

Sprint 16B — Spec `job-sources-aggregation.md`.

## Objetivo inicial

Crear la spec mínima multi-fuente de JobIT, previa a cualquier cambio de Prisma, que
defina el alcance técnico y de producto para evolucionar desde Jooble como única fuente
externa hacia un sistema multi-fuente seguro, candidate-first y basado en ingesta
controlada. Sprint exclusivamente documental: no se implementa código.

## Estado inicial

- Ruta WSL correcta: `/home/david/projects/JobIT-platform`.
- `dev` actualizado por `git pull --ff-only` (`Already up to date`), incluyendo la PR #64
  (Sprint 16A, housekeeping Jooble) ya mergeada (`9f04099`).
- Working tree limpio antes de crear rama.
- Rama creada: `feat/sprint-16b-job-sources-aggregation-spec`, desde `dev`.
- Sin repos anidados.

## Trabajo realizado

1. Verificación de existencia de los 20 documentos obligatorios listados en el prompt:
   **todos existen** (README.md, AGENTS.md, docs/agents/operating-environment.md,
   00-mvp-scope.md, jobs.md, saved-jobs.md, match-basic.md, external-jobs-jooble.md,
   jooble-ingestion.md, architecture/03, los 4 docs de Sprint 16 + el final-report, el
   final-report de 16A, schema.prisma, .env.example, ambos package.json).
2. Lectura completa de los documentos que aún no tenía frescos en esta sesión (`AGENTS.md`,
   `00-mvp-scope.md`, `jobs.md`, `saved-jobs.md`, `docs/agents/operating-environment.md`);
   el resto ya se había leído/generado en Sprint 16/16A dentro de esta misma conversación.
3. Comprobación de contradicciones críticas: ninguna encontrada (ver sección siguiente).
4. Redacción de `docs/specs/features/job-sources-aggregation.md` siguiendo exactamente la
   estructura de secciones pedida.
5. Redacción de este informe final.

## Spec creada

`docs/specs/features/job-sources-aggregation.md`, con las 24 secciones exactas pedidas
(Estado, Objetivo, Usuario afectado, Contexto, Principios de arquitectura, Flujo
principal, Modelo de datos actual, Cambios de modelo propuestos, `JobSource` enum
propuesto, Contrato normalizado `ExternalJob`, Reglas de ingesta, Reglas de
deduplicación, Reglas de expiración y cierre, Reglas de `sourceUrl` vs `applyUrl`,
Reglas de producto y UX, Reglas legales/ToS, Variables de entorno, Endpoints, Pantallas,
Validaciones, Errores, Tests mínimos, Fases de implementación, Fuera de alcance,
Criterios de aceptación, Preguntas abiertas).

Contenido fiel a lo ya acordado en Sprint 16/16A, sin inventar nada nuevo: consolida y
formaliza en formato de spec SDD las decisiones ya documentadas en la matriz de fuentes,
la revisión arquitectónica, las reglas de producto y el plan de implementación.

## Decisiones documentadas

- El `enum JobSource` **no** se amplía de una sola vez con todas las fuentes candidatas:
  cada fase técnica añade solo el valor de la fuente que implementa, en su propia
  migración versionada.
- `salaryCurrency`, `applyUrl` y `publishedAt` quedan **diferidos**, no descartados
  permanentemente: la spec deja explícita la condición bajo la que cada uno entraría.
- **No se guarda `rawSourcePayload`** por defecto (coste, ToS, privacidad).
- El contrato `ExternalJob` generaliza el `NormalizedExternalJob` ya existente de Jooble,
  con 6 campos obligatorios y 14 opcionales.
- El dedupe del MVP sigue siendo únicamente `(source, externalId)`; cualquier heurística
  cross-source queda fuera de esta spec.
- Se registra explícitamente que las restricciones "sin APIs externas" de `jobs.md` (M03)
  y `00-mvp-scope.md` corresponden a la fase documental inicial, ya superadas por
  ADR-0011 y `external-jobs-jooble.md`; esta spec continúa esa misma línea evolutiva sin
  contradecirla.

## Archivos modificados

- **Nuevo**: `docs/specs/features/job-sources-aggregation.md`.
- **Nuevo**: `docs/sprints/sprint-16b-job-sources-aggregation-spec-final-report.md`.
- Ningún otro archivo tocado (no se encontró ninguna contradicción crítica que exigiera
  modificar `jobs.md`, `jooble-ingestion.md`, `external-jobs-jooble.md` ni ningún otro
  documento prohibido).

## Tests y verificaciones

**No ejecutado: cambio solo documental.** No se han ejecutado `typecheck`/`test`/`build`
porque no hay ningún cambio de código en este sprint.

Verificaciones de control de alcance ejecutadas:
- `git diff --check` → OK.
- `git status --short` → solo los 2 archivos nuevos esperados.
- `git diff -- docs/specs/features/job-sources-aggregation.md` (archivo nuevo/untracked → sin salida en `diff`, contenido visible en `status`).
- `git diff -- docs/sprints/sprint-16b-job-sources-aggregation-spec-final-report.md` (mismo caso, archivo nuevo).

## Decisiones técnicas

- Ninguna implementación de código en este sprint; todas las "decisiones técnicas" son
  propuestas documentales sujetas a aprobación en 16C.
- Se prefirió **no tocar** `jobs.md`/`jooble-ingestion.md`/`external-jobs-jooble.md` pese
  a que mencionan restricciones ahora ampliadas, porque el prompt indica explícitamente
  no modificarlos salvo contradicción crítica, y esta situación (evolución ya reconocida
  por ADR-0011) no lo es.

## Problemas encontrados

Ninguno. Todos los documentos obligatorios existían; no hubo contradicciones críticas que
requirieran detener el sprint o reportar antes de proceder.

## Pendiente

- Aprobación del orquestador sobre la spec `job-sources-aggregation.md`.
- Cierre Git de este sprint (commit + push + PR), pendiente de instrucción explícita.
- **Sprint 16C — Prisma minimal multi-source**: no se ejecuta sin aprobación explícita del
  orquestador sobre esta spec y sobre el alcance concreto de esa migración (qué valores
  del enum se aprueban, si `salaryCurrency` entra o se difiere).

## Recomendación para el orquestador

- **Sprint 16B: PASS documental.** La spec queda lista como base para justificar 16C y
  las fases posteriores, sin haber tocado Prisma, frontend ni código.
- **Siguiente sprint recomendado: Sprint 16C — Prisma minimal multi-source**, pero **no
  se debe ejecutar automáticamente**: requiere que el orquestador apruebe explícitamente
  el alcance exacto de la migración (qué valores concretos del enum `JobSource` se
  añaden en esta primera migración, y si `salaryCurrency` entra ya o se pospone).

## Prompt sugerido para continuar

```
PROMPT PARA CLAUDE — Sprint 16C · Prisma minimal multi-source

Objetivo:
Ampliar el modelo Prisma con los cambios minimos necesarios para soportar
multi-fuente, segun lo propuesto en docs/specs/features/job-sources-aggregation.md,
SOLO tras aprobacion explicita del orquestador sobre el alcance exacto.

Contexto:
Sprint 16 (discovery), 16A (housekeeping Jooble) y 16B (spec) ya cerrados.
La spec 16B propone: ampliar enum JobSource solo con fuentes aprobadas,
generalizar la unicidad (source, externalId), y valorar salaryCurrency
condicionalmente. NINGUNO de estos cambios esta autorizado todavia sin
confirmacion explicita del orquestador sobre el alcance exacto.

Antes de modificar Prisma, el operador humano debe confirmar por escrito:
- que valores exactos se anaden al enum JobSource en esta migracion
  (recomendacion de la spec: no anadir todos los candidatos de golpe);
- si salaryCurrency entra en esta migracion o se pospone.

Archivos/carpetas afectadas:
- apps/api/prisma/schema.prisma
- apps/api/prisma/migrations/**
- apps/api/src/jobs/** (tipos que referencien el enum)
- tests relacionados (jobs-provenance, jobs-visibility)

Tareas concretas:
1. Actualizar dev y crear rama feat/sprint-16c-prisma-multi-source desde dev.
2. Confirmar con el orquestador el alcance exacto antes de tocar el schema.
3. Ampliar enum JobSource solo con los valores aprobados.
4. Generalizar la unicidad (source, externalId) si aun no lo esta para todas las fuentes.
5. Anadir salaryCurrency solo si fue aprobado.
6. Crear migracion Prisma versionada.
7. Actualizar tests afectados.
8. Ejecutar verificaciones backend completas.

Restricciones:
No implementar ninguna fuente nueva (Adzuna, Jobicy, etc.). No tocar frontend.
No anadir dependencias. No usar Co-Authored-By. No commit/push/PR sin autorizacion.

Fuera de alcance:
Implementacion de Adzuna/Jobicy/WWR/ATS. Provider registry completo. applyUrl
salvo decision explicita ya tomada. Cambios frontend salvo labels minimos si
el orquestador lo aprueba.

Criterios de aceptacion:
Migracion limpia y aditiva. Tests verdes. Jooble e INTERNAL siguen funcionando
sin cambios de comportamiento. API publica sigue sin exponer externalId/ingestedAt.

Tests/verificaciones:
pnpm --filter @jobit/api typecheck
pnpm --filter @jobit/api test
pnpm --filter @jobit/api build
git diff --check

Formato esperado de salida:
# Resultado Sprint 16C — Prisma minimal multi-source
## Estado inicial
## Alcance confirmado por el orquestador
## Cambios de schema
## Migracion creada
## Tests actualizados
## Verificaciones ejecutadas
## Estado Git final
## Recomendacion siguiente
```
