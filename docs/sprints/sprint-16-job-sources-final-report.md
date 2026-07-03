# Informe final operador — Sprint 16 Job Sources Discovery & Aggregation v1

## Sprint o tarea

Sprint 16 — Job Sources Discovery & Aggregation v1.

## Objetivo inicial

Evaluar fuentes externas de empleo para JobIT y proponer una ampliación **segura** del modelo
actual (Jooble como única fuente externa) hacia un sistema multi-fuente, sin romper el patrón
arquitectónico rector:

> fuentes externas → ingesta controlada → base de datos JobIT → búsqueda local → enlace oficial externo

**Este NO ha sido un sprint de implementación.** Las seis fases ejecutadas (Startup Report,
Due Diligence Matrix, Architecture Review, Product Rules & Ranking, Implementation Plan, y este
informe final) son **exclusivamente documentales**: ningún archivo de código, Prisma, frontend,
`package.json` ni `.env` ha sido creado ni modificado en todo el sprint.

## Material revisado

- **Documentos internos**: `docs/architecture/03-job-sources-and-search.md`,
  `docs/specs/features/jobs.md`, `docs/specs/features/external-jobs-jooble.md`,
  `docs/specs/features/jooble-ingestion.md`, `docs/specs/00-mvp-scope.md`,
  `docs/sprints/sprint-15f-jooble-ingestion-config-final-report.md`,
  `docs/sprints/sprint-15g-jooble-location-ingestion-final-report.md`,
  `README.md`, `AGENTS.md`, `docs/agents/operating-environment.md`.
- **Arquitectura y código actual de Jobs** (solo lectura): `apps/api/prisma/schema.prisma`
  (modelo `Job` + enums), `jobs.serializer.ts`, `jobs.service.ts`, `jobs.schemas.ts`,
  `jobs.router.ts`, `apps/api/src/jobs/external/jooble/**` (client, normalizer, ingest.service,
  schemas, types), los 3 scripts de ingesta Jooble existentes, `apps/api/.env.example`.
- **Documentación oficial de fuentes externas**: Jooble, Adzuna, InfoJobs, Tecnoempleo, Remotive,
  Jobicy, We Work Remotely, Himalayas, Careerjet, Greenhouse, Lever, Ashby, Workable, y los
  portales de LinkedIn/Indeed/Randstad (para confirmarlas como bloqueadas).
- **Documentos generados en este sprint** (los 4 previos a este informe):
  matriz de fuentes, revisión arquitectónica, reglas de producto + ranking, plan de
  implementación incremental.

## Estado actual de Jobs en JobIT

- JobIT ya tiene **Jobs UI** (`/jobs`, `/jobs/[id]`), **Saved Jobs UI** (`/saved-jobs`),
  **Match UI** (`/match`) con match explicable en detalle de oferta, y **fuente externa segura**
  con enlace validado (http/https) y aviso honesto cuando no hay URL de inscripción (Sprints 15C-15E).
- **Jooble** ya existe como fuente de **ingesta controlada** (Sprints 03.5, 15E-15G), con host
  configurable por entorno (`JOOBLE_API_BASE_URL`) y comandos manuales single/multi-ubicación.
- **JobIT busca en su propia DB** (`GET /api/jobs`); no hay llamadas live a Jooble ni a ninguna
  fuente externa por cada búsqueda del candidato.
- `enum JobSource` actual: **`INTERNAL`, `JOOBLE`** — solo dos valores.
- El modelo `Job` tiene `source`, `externalId?`, `sourceUrl?`, `ingestedAt?`, `expiresAt?`,
  `postedAt`. **No hay `applyUrl`** separado de `sourceUrl`. **No hay `salaryCurrency`** (los
  importes son `Int?` sin divisa explícita).
- Se detectaron **scripts Jooble duplicados**: el oficial actual bajo
  `apps/api/src/jobs/scripts/` (Sprints 15F/15G, env-based, dentro de `src/` → pasa por
  typecheck/build) y uno más antiguo, `apps/api/scripts/ingest-jooble.ts` (Sprint 03.5, CLI
  `--flags`, **fuera de `src/`**, por lo que no pasa por `typecheck`/`build`).

## Matriz de fuentes

16 fuentes evaluadas con documentación oficial: **JOOBLE, INFOJOBS, TECNOEMPLEO, REMOTIVE,
HIMALAYAS, JOBICY, WE_WORK_REMOTELY, CAREERJET, ADZUNA, GREENHOUSE, LEVER, ASHBY, WORKABLE,
LINKEDIN, INDEED, RANDSTAD**.

Clasificación resumida:
- **Must-have**: Jooble (ya integrada), Adzuna (condicionada a ToS).
- **Should-have**: Jobicy, We Work Remotely, ATS curado (Greenhouse/Lever/Ashby), Tecnoempleo
  (si se valida acceso).
- **Could-have**: Himalayas, Careerjet, Workable, Remotive (con cautela por su cláusula
  anti-agregador).
- **No MVP**: aplicar desde JobIT, búsqueda live, IA sobre personas, dedupe cross-source agresivo,
  recruiter/ATS completo.
- **Bloqueadas por credenciales/partner/legal**: LinkedIn, Indeed, Randstad, InfoJobs (alto valor
  para España, pero pendiente de aprobación de partner/ToS).

## Fuentes recomendadas

- **Jooble**: mantener como base ya integrada; sin cambios funcionales urgentes salvo el
  housekeeping de scripts.
- **Adzuna**: primera fuente nueva recomendada, **condicionada** a confirmar su ToS completo
  (solo se leyó la overview técnica, no el documento de términos íntegro).
- **ATS curado (Greenhouse/Lever/Ashby)**: alternativa **legalmente más limpia** — son feeds
  públicos pensados explícitamente para que terceros los ingieran (job boards), a cambio de
  curar manualmente una lista de empresas tech.
- **Jobicy / We Work Remotely**: alternativas remotas simples, sin credenciales, tras revisar sus
  restricciones (Jobicy: atribución + ~1 consulta/hora; WWR: RSS público con `expires_at`).
- **Tecnoempleo / InfoJobs**: alto valor para España, pero **pendientes** de confirmar acceso y
  ToS claros (Tecnoempleo: estructura de campos del RSS y su programa "API/partners"; InfoJobs:
  proceso de aprobación de app/partner).

## Fuentes descartadas o bloqueadas

- **LinkedIn**: bloqueada — requiere partnership formal (Talent/Job Postings API es de partner).
- **Indeed**: bloqueada — sin partner formal no hay API pública simple de búsqueda de ofertas.
- **Randstad**: bloqueada/pendiente — sin API pública de búsqueda claramente documentada en su
  portal de desarrolladores.
- **Scraping**: prohibido, en cualquier fuente, sin excepción.
- **Aplicar desde JobIT**: fuera del MVP — la inscripción ocurre siempre en el origen.
- **Búsqueda live contra APIs externas en cada búsqueda del candidato**: fuera del patrón de
  JobIT (siempre ingesta controlada → DB local → búsqueda local).

## Riesgos legales/ToS

- **Redistribución de contenido**: varias fuentes (Remotive, Jobicy) prohíben explícitamente
  reenviar sus ofertas a otros agregadores.
- **Descripción completa vs. snippet**: cada fuente tiene su propio límite de qué se puede
  mostrar/almacenar.
- **Atribución visible**: obligatoria en varias fuentes (Remotive exige mención explícita;
  Himalayas pide "Originally posted on Himalayas").
- **Rate limits**: distintos por fuente (Jobicy sugiere ~1 consulta/hora; Adzuna tiene free tier
  con límites no confirmados en esta pasada).
- **Fuentes detrás de login**: descartadas por regla de producto sin acuerdo explícito.
- **Restricciones anti-agregador**: presentes en Remotive y Jobicy; requieren lectura fina antes
  de decidir el modelo de visualización final.
- **Términos por fuente sin verificar del todo**: Adzuna (ToS completo), InfoJobs (aprobación de
  partner), Tecnoempleo (campos RSS y programa de partners), Himalayas (auth/rate), Randstad
  (existencia de API pública).
- **Secretos/API keys**: regla ya validada en 15F/15G — nunca en el repo, nunca impresas en logs.
- **No scraping**: reafirmado como regla transversal en toda la documentación generada.

## Riesgos técnicos

- **Migración Prisma** necesaria para ampliar `enum JobSource` — cambio versionado, con spec
  previa y aprobación explícita (no ejecutado en este sprint).
- **`salaryCurrency` ausente**: relevante si se activan fuentes con salarios en divisas distintas del euro.
- **`sourceUrl` vs. `applyUrl`**: hoy solo existe `sourceUrl`; algunas fuentes (Workable/ATS)
  distinguen claramente listing de apply.
- **Dedupe multi-fuente**: no existe hoy más allá de `(source, externalId)`; la misma oferta
  desde dos fuentes distintas coexistirá como dos filas en el MVP.
- **Expiración/cierre de ofertas**: política de "cierre por ausencia" (oferta que desaparece de
  ingestas sucesivas) aún no diseñada en detalle.
- **No romper `SavedJob`**: cualquier cambio de modelo o de política de expiración debe preservar
  las ofertas guardadas por candidatos.
- **Scripts Jooble duplicados**: uno de ellos vive fuera de `src/` y no pasa por
  `typecheck`/`build`, lo cual es una brecha de calidad a corregir antes de replicar el patrón
  a fuentes nuevas.
- **Normalización remote/seniority/contract/salary**: heterogénea entre fuentes; hoy Jooble
  infiere `remoteType` por palabras clave y deja `seniority`/`tags` vacíos en la ingesta externa.
- **Tests existentes de jobs/jooble**: cualquier cambio de enum o de contrato deberá mantenerlos
  en verde (no verificado en este sprint por ser puramente documental).

## Modelo de datos recomendado

- Mantener el **MVP mínimo**: no sobrediseñar el modelo antes de que una segunda fuente lo exija.
- Ampliar `enum JobSource` **solo con las fuentes aprobadas** explícitamente por el orquestador.
- Mantener el **dedupe por `(source, externalId)`** como único mecanismo del MVP; sin fusión
  automática entre fuentes distintas.
- `salaryCurrency` **solo si** la primera fuente nueva (previsiblemente Adzuna) lo exige de forma clara.
- `applyUrl` **diferido** salvo necesidad clara de una fuente concreta que separe listing de apply.
- **No guardar `rawSourcePayload`** por defecto (coste, tamaño, riesgo de ToS/privacidad).
- `sourceUrl` sigue siendo el **CTA externo del MVP** ("Ver oferta oficial" / copy por fuente).
- **`CLOSED` antes que `delete` físico** para cualquier oferta que deje de estar disponible en su fuente.

## Reglas de producto

- **Fuente siempre visible** en cards y detalle.
- **CTA externo honesto** (nunca engañoso ni oculto).
- **No ocultar el origen** de ninguna oferta.
- **No presentar seed/INTERNAL como oferta real** externa — el aviso actual de "oferta de
  ejemplo" se mantiene mientras `INTERNAL` sea solo seed.
- **No aplicar desde JobIT** en el MVP.
- **No usar IA para evaluar personas** en el MVP (Match sigue siendo reglas visibles).
- **No scraping.**
- **No búsqueda live** por cada búsqueda del candidato.
- **Mantener Saved Jobs estable** aunque cambie o se actualice la fuente de una oferta.
- **Respetar la atribución y las restricciones** propias de cada fuente (redistribución, rate, snippet vs. completo).

## Plan de implementación propuesto

Siete sub-sprints incrementales, cada uno con su propia rama, PR y revisión humana:

- **16A** — Housekeeping Jooble scripts (consolidar los scripts duplicados en uno oficial).
- **16B** — Spec `job-sources-aggregation.md` + plan de migración de `JobSource` (documental).
- **16C** — Migración Prisma mínima multi-source (solo tras aprobar 16B).
- **16D** — Adzuna provider spike sin secretos (client/normalizer/ingest/script, patrón Jooble).
- **16E** — Una fuente remota tech simple (Jobicy / We Work Remotely / Himalayas — elegir una).
- **16F** — ATS curado (Greenhouse/Lever/Ashby, lista de empresas curada).
- **16G** — Bootstrap de datos de staging/demo (sin llamadas live en runtime).

**Fase inmediata recomendada: 16A — Housekeeping Jooble scripts.**

## Must-have antes de staging/demo

- Fuente visible en toda oferta mostrada.
- CTA externo validado manualmente (enlace real, no roto).
- Sin scraping en ninguna fuente usada para la demo.
- Sin secretos en el repo ni en logs.
- Documentación oficial de cada fuente representada, revisada.
- ToS aprobado (o riesgo explícitamente aceptado por el orquestador) para cada fuente demo.
- Tests verdes en las fases funcionales que se hayan ejecutado (no aplica a este sprint documental).
- **No mezclar** seed INTERNAL con ofertas externas reales sin distinguirlas visualmente.
- Datos de demo **no expirados**.
- Posibilidad de **rollback o desactivación por fuente** (p. ej. por falta de key o por decisión de producto).

## Archivos modificados

- `docs/sprints/sprint-16-job-sources-discovery-matrix.md`
- `docs/sprints/sprint-16-job-sources-architecture-review.md`
- `docs/sprints/sprint-16-job-sources-product-rules-and-ranking.md`
- `docs/sprints/sprint-16-job-sources-implementation-plan.md`
- `docs/sprints/sprint-16-job-sources-final-report.md`

**Solo documentación.** Sin cambios en código (`apps/api/src`, `apps/web/src`), sin cambios
Prisma (`schema.prisma`, migraciones), sin cambios de frontend, sin dependencias nuevas
(`package.json`/`pnpm-lock.yaml` intactos), sin secretos ni `.env` tocados.

## Tests y verificaciones

- `git status --short` → exactamente los 5 documentos de Sprint 16, ningún archivo fuera de
  `docs/sprints/`.
- Confirmado: **solo hay 5 docs** de Sprint 16 en `docs/sprints/` como cambios (ver sección
  Verificaciones más abajo, con el conteo exacto).
- **No ejecutado: cambio solo documental** — no se han ejecutado `typecheck`/`test`/`lint`/`build`
  en este sprint porque no hay ningún cambio funcional que verificar.
- **No** se hizo commit, push, ni PR en ninguna de las 6 fases.
- **No** se añadió ningún trailer `Co-Authored-By` (no aplica: no hubo commits).

## Decisiones técnicas

- Mantener **ingesta controlada** como único patrón de obtención de ofertas externas.
- **No live search** contra ninguna API externa por request de candidato.
- Introducir un **provider por fuente** (client/normalizer/ingest/tests, patrón ya validado con
  Jooble) cuando llegue la **segunda** integración real, no antes.
- **No construir un provider registry complejo** antes de que exista una necesidad real (evitar
  sobreingeniería, YAGNI).
- **Dedupe mínimo** por `(source, externalId)` en el MVP; nada de fusión automática cross-source.
- `sourceUrl` como **CTA externo del MVP**; `applyUrl` **diferido**.
- **Raw payload descartado por defecto** (no se persiste el JSON crudo de las fuentes).
- **`CLOSED` sobre `delete` físico** para preservar historial y `SavedJob`.

## Problemas encontrados

- **Duplicidad de scripts Jooble** (uno fuera de `src/`, sin typecheck/build).
- **Falta de `applyUrl`** separado de `sourceUrl` en el modelo actual.
- **Falta de `salaryCurrency`** en el modelo actual.
- **`JobSource` limitado** a `INTERNAL`/`JOOBLE`, insuficiente para multi-fuente.
- **ToS pendientes de confirmación fina** por fuente: Adzuna (completo), Tecnoempleo (campos RSS
  y programa partners), Himalayas (auth/rate).
- **InfoJobs / LinkedIn / Indeed / Randstad** condicionadas por partner/acceso — ninguna puede
  integrarse sin ese paso previo, fuera del control de este sprint documental.

## Pendiente

- **Aprobar Sprint 16** (los 5 documentos generados) por parte del orquestador humano.
- **Commit y PR** de los 5 documentos (aún no realizado; requiere instrucción explícita).
- Arrancar **16A — Housekeeping Jooble scripts**.
- Arrancar **16B — Spec `job-sources-aggregation.md`**.
- **Revisar el ToS completo de Adzuna** (no solo el overview técnico ya leído) antes de 16D.
- **Decidir la fuente definitiva** a implementar tras Jooble, según el resultado de esa revisión.
- **Pedir credenciales de cualquier fuente nueva fuera de este chat** y **nunca pegarlas** en la
  conversación (lección explícita de este sprint: la `JOOBLE_API_KEY` viajó por el chat en un
  sprint anterior; para fuentes nuevas debe evitarse repetir ese patrón, usando en su lugar
  variables de entorno gestionadas directamente por el operador).

## Recomendación para el orquestador

- **Cerrar Sprint 16 como PASS documental** si el orquestador acepta los 5 documentos generados
  (matriz, architecture review, product rules, implementation plan, este informe final).
- **Siguiente sprint recomendado: 16A — Housekeeping Jooble scripts.**
- **Después: 16B — spec multi-source** (`job-sources-aggregation.md`), previa a cualquier cambio de Prisma.
- **Adzuna** se implementa **solo tras confirmar que su ToS final es compatible** con las reglas
  de producto ya fijadas.
- **Fallback** si Adzuna se bloquea por ToS: **ATS curado** (Greenhouse/Lever/Ashby) o
  **Jobicy/We Work Remotely**.
- Este informe **cierra el sprint como discovery/documental**, pero **no autoriza** implementación,
  commit, push ni PR — esas acciones requieren instrucción explícita y separada del operador humano.

## Prompt sugerido para continuar

```
PROMPT PARA CODEX/CLAUDE — Sprint 16A · Housekeeping Jooble scripts

Objetivo:
Consolidar la ingesta manual de Jooble en una única vía oficial, eliminando o
deprecando el script duplicado que vive fuera de apps/api/src/ y por tanto no
pasa por typecheck ni build.

Contexto:
Sprint 16 (discovery/documental) detectó que existen tres scripts de ingesta
Jooble: el oficial actual bajo apps/api/src/jobs/scripts/ (Sprints 15F/15G,
env-based, typechecked) y uno más antiguo, apps/api/scripts/ingest-jooble.ts
(Sprint 03.5, CLI --flags, fuera de src/). Antes de sumar fuentes nuevas
(Adzuna u otras) hace falta dejar un único patrón claro.

Archivos/carpetas afectadas:
- apps/api/scripts/ingest-jooble.ts (revisar y decidir: eliminar/deprecar)
- apps/api/src/jobs/scripts/** (mantener como oficial, sin romper 15F/15G)
- docs/specs/features/jooble-ingestion.md (actualizar si menciona el script antiguo)
- docs/development/local-env.md (revisar si menciona el script antiguo)

Tareas concretas:
1. Actualizar dev y crear rama feat/sprint-16a-jooble-housekeeping desde dev.
2. Confirmar que ambos scripts llaman al mismo ingestJoobleJobs sin divergencias de comportamiento.
3. Decidir y ejecutar: eliminar el script antiguo (recomendado si no hay
   referencias externas documentadas) o marcarlo explícitamente como legado
   con comentario de deprecación si se prefiere no borrarlo todavía.
4. Actualizar cualquier referencia documental al script retirado/deprecado.
5. Ejecutar verificaciones backend completas.

Restricciones:
No tocar Prisma. No añadir dependencias. No crear endpoints. No tocar
frontend. No ejecutar llamadas con API keys reales salvo autorización
explícita ya concedida por el operador. No imprimir secretos. No usar
Co-Authored-By en el commit.

Fuera de alcance:
Nuevas fuentes externas. Migraciones. Cron. Provider registry.

Criterios de aceptación:
Una única vía oficial de ingesta Jooble, documentada. Sin duplicidad
confusa. Tests backend verdes. Docs coherentes con el estado final.

Tests/verificaciones:
pnpm --filter @jobit/api typecheck
pnpm --filter @jobit/api test
pnpm --filter @jobit/api build
git diff --check
git status --short

Formato esperado de salida:
# Resultado Sprint 16A — Housekeeping Jooble scripts
## Estado inicial
## Decisión tomada (eliminar/deprecar)
## Archivos modificados
## Verificaciones ejecutadas
## Estado Git final
## Recomendación siguiente
```
