# Sprint 16 — Job Sources Implementation Plan

## Objetivo

Proponer una implementación **incremental, segura y aprobable por el orquestador** para
evolucionar JobIT desde Jooble como fuente externa única hacia un sistema **multi-fuente**,
sin romper el MVP candidate-first ni el patrón de arquitectura rector:

> fuentes externas → ingesta controlada → base de datos JobIT → búsqueda local → enlace oficial externo

Este documento **no implementa nada**: define fases pequeñas, revisables y con Definition of
Done propia, basadas en la matriz de fuentes (Fase 2), la revisión arquitectónica (Fase 3) y
las reglas de producto (Fase 4) ya cerradas.

## Principios de implementación

- **SDD antes de código**: cada fase técnica nace de una spec o de este plan aprobado, no de
  código improvisado.
- **Fases pequeñas y revisables**: cada sub-sprint (16A–16G) es una rama y una PR independiente.
- **No scraping**, en ninguna fase.
- **No live search** contra APIs externas por cada búsqueda del candidato — siempre ingesta
  controlada a DB, búsqueda local.
- **Ingesta controlada** a base de datos, manual/programada, backend-only, sin endpoint público.
- **Búsqueda local en JobIT** (`GET /api/jobs` sobre su propia DB).
- **Enlace externo oficial** siempre presente y visible.
- **Fuente siempre visible** en cards/detalle.
- **Secretos fuera del repo**: solo en `.env` local (gitignored) o variables de entorno del despliegue.
- **Tests antes de cerrar cada fase**: no se considera "hecha" una fase sin verificaciones en verde.
- **No `Co-Authored-By`** en ningún commit de este proyecto (regla ya vigente en el repo).
- **No merge sin revisión humana**: cada PR queda abierta para aprobación explícita del operador.

## Secuencia recomendada

### Sprint 16A — Housekeeping Jooble scripts

**Objetivo:** consolidar/retirar el script Jooble antiguo fuera de `src/` y dejar una única
vía oficial de ingesta.

**Alcance:**
- Revisar `apps/api/scripts/ingest-jooble.ts` (Sprint 03.5, CLI `--flags`, fuera de `src/` →
  no pasa por `typecheck`/`build`).
- Compararlo con `apps/api/src/jobs/scripts/ingest-jooble.ts` (15F) e
  `ingest-jooble-locations.ts` (15G), ambos env-based y typechecked.
- Decidir si se elimina, se depreca (con aviso) o se documenta como legado.
- Mantener los scripts oficiales bajo `apps/api/src/jobs/scripts/`.
- Actualizar referencias documentales si procede (`docs/specs/features/jooble-ingestion.md`,
  `docs/development/local-env.md` si mencionan el script antiguo).

**Fuera de alcance:** nuevas fuentes; Prisma; migraciones; frontend; cron.

**Archivos probables:** `apps/api/scripts/ingest-jooble.ts`; `apps/api/src/jobs/scripts/**`;
`docs/specs/features/jooble-ingestion.md`; referencias en `package.json` **solo si existieran**
y solo si es estrictamente necesario ajustarlas.

**Contratos:** la ingesta Jooble existente debe seguir funcionando; no cambia la respuesta
pública de `GET /api/jobs`/`GET /api/jobs/:id`.

**Tests/verificaciones:** `pnpm --filter @jobit/api typecheck`; `pnpm --filter @jobit/api test`
(incluye los tests de `external/jooble/**` y `jobs/scripts/**`); `pnpm --filter @jobit/api build`;
`grep -R "ingest-jooble" apps/api docs` para localizar referencias residuales al script antiguo.

**Riesgos:** romper un comando ya documentado en algún sitio no revisado; retirar un script
que alguien seguía usando manualmente; divergencia temporal entre código y docs.

**Criterios de aceptación:** una única vía oficial y clara de ingesta Jooble; sin duplicidad
confusa; tests verdes; documentación coherente con el estado final.

### Sprint 16B — Spec multi-source minimal + JobSource migration plan

**Objetivo:** crear la spec mínima multi-fuente **antes** de tocar Prisma.

**Alcance:**
- Spec en `docs/specs/features/job-sources-aggregation.md`.
- Definir el `enum JobSource` ampliado (qué valores nuevos se aprueban, cuáles quedan para después).
- Definir el contrato normalizado mínimo (`ExternalJob`, ya esbozado en la Architecture Review
  de Fase 3: obligatorios `externalId, source, title, company, remoteType, sourceUrl`; opcionales el resto).
- Definir si `salaryCurrency` entra ahora o se difiere (según si la primera fuente lo exige).
- Definir `sourceUrl`/`applyUrl` para el MVP (MVP: solo `sourceUrl`; `applyUrl` diferido salvo
  necesidad clara).
- Definir reglas de expiración (`expiresAt` si la fuente lo da; `CLOSED` sobre borrado físico).
- Definir dedupe por `(source, externalId)` como único mecanismo del MVP (sin dedupe cross-source).

**Fuera de alcance:** implementación de Adzuna; provider registry completo; dedupe cross-source
agresivo; frontend avanzado.

**Archivos probables:** `docs/specs/features/job-sources-aggregation.md`;
`docs/architecture/03-job-sources-and-search.md` **solo si el orquestador lo aprueba explícitamente**.

**Contratos:** no cambia la API pública todavía; no cambia la DB todavía (spec, no migración).

**Tests/verificaciones:** revisión documental; checklist SDD del repo (spec previa a implementación).

**Riesgos:** sobredefinir (meter diseño de fases posteriores); colar fuentes no aprobadas en el
enum objetivo; ampliar el scope del MVP sin querer.

**Criterios de aceptación:** spec aprobable por el orquestador; fuentes No MVP explícitamente
excluidas; cualquier cambio Prisma futuro queda justificado por esta spec antes de tocarse.

### Sprint 16C — Prisma minimal multi-source

**Objetivo:** preparar el modelo para más fuentes con cambios mínimos y seguros.

**Alcance:**
- Ampliar `enum JobSource` con las fuentes aprobadas en 16B (no más).
- Valorar `salaryCurrency` **solo si** 16B lo aprobó.
- Generalizar la unicidad `(source, externalId)` a nivel de constraint de DB si hoy no lo está
  para todas las fuentes (hoy protegido por índice parcial + reintento en `P2002` para JOOBLE).
- Mantener compatibilidad total con `INTERNAL` y `JOOBLE` existentes (sin migrar datos con pérdida).
- Migración Prisma **versionada** (una migración, revisable, con nombre descriptivo).
- Tests actualizados donde el contrato lo requiera (p. ej. tests de provenance que iteren el enum).

**Fuera de alcance:** ingesta de Adzuna; provider registry completo; frontend nuevo; cron; `applyUrl`
salvo decisión explícita ya tomada en 16B.

**Archivos probables:** `apps/api/prisma/schema.prisma`; `apps/api/prisma/migrations/**`;
`apps/api/src/jobs/**` (tipos que referencien el enum); tests relacionados (`jobs-provenance`,
`jobs-visibility`).

**Contratos:** los `Job` existentes siguen funcionando; Jooble sigue funcionando sin cambios de
comportamiento; la API pública sigue sin exponer `externalId`/`ingestedAt`; `source`/`sourceUrl`
siguen visibles exactamente igual que hoy.

**Tests/verificaciones:** `pnpm --filter @jobit/api typecheck`; `pnpm --filter @jobit/api lint`
(si existe script de lint en el repo); `pnpm --filter @jobit/api test`; `pnpm --filter @jobit/api build`;
`prisma validate` / `prisma generate` / `prisma migrate dev` (o `deploy` según entorno) — **solo con
autorización explícita del operador para tocar Prisma**; suite completa de `jobs`/`jooble`.

**Riesgos:** una migración de `enum` en PostgreSQL puede requerir pasos específicos (añadir
valores es seguro y no bloqueante; renombrar/quitar valores es más delicado — este plan **solo
añade**, nunca quita, en esta fase); impacto sobre datos existentes si se toca algo más allá del
enum; efecto en pipelines de CI si los hay.

**Criterios de aceptación:** migración limpia y reversible en el sentido de "solo aditiva";
tests verdes; sin cambios de UX inesperados (mismos campos visibles, mismo comportamiento para
`INTERNAL`/`JOOBLE`).

### Sprint 16D — Adzuna provider spike without secrets

**Objetivo:** diseñar e implementar la primera integración de Adzuna de forma controlada, sin
exponer secretos, siguiendo el patrón ya validado con Jooble.

**Alcance:**
- Client Adzuna (`external/adzuna/adzuna.client.ts`): HTTP + config inyectada (`app_id`, `app_key`,
  base URL), sin leer `process.env` directamente (mismo patrón que `jooble.client.ts`).
- Schemas de respuesta (`adzuna.schemas.ts`, validación con zod de la forma real de Adzuna).
- Normalizer a contrato interno (`adzuna.normalizer.ts` → `ExternalJob`/`NormalizedExternalJob`).
- Fixtures **sin datos sensibles** (`__fixtures__/adzuna.valid.json`, etc., basados en la forma
  documentada, no en llamadas reales con key real).
- Tests unitarios de normalización (sin red).
- Script de ingesta manual equivalente a Jooble (`apps/api/src/jobs/scripts/ingest-adzuna.ts`,
  env-based, mismo patrón que 15F/15G).
- Variables de entorno en `apps/api/.env.example` **sin valores reales** (`ADZUNA_APP_ID`,
  `ADZUNA_APP_KEY`, posible `ADZUNA_API_BASE_URL` si aplica el mismo patrón regional que Jooble).

**Fuera de alcance:** cron; frontend nuevo (solo el label de fuente si 16C ya lo permite);
aplicar desde JobIT; live search; secretos reales en el repo; **llamadas reales sin autorización
explícita del operador humano** (cualquier smoke con key real requiere confirmación previa, como
se hizo con Jooble).

**Archivos probables:** `apps/api/src/jobs/external/adzuna/**`;
`apps/api/src/jobs/scripts/ingest-adzuna.ts`; `apps/api/.env.example`;
`docs/specs/features/job-sources-aggregation.md` (actualización de estado); fixtures de test.

**Contratos:** ingesta controlada (nunca live); upsert idempotente por `(source, externalId)`;
`sourceUrl`/`redirect_url` de Adzuna como CTA externo; fuente visible ("Fuente: Adzuna").

**Tests/verificaciones:** tests unitarios de client/normalizer con fixtures (sin red);
tests de ingesta con `search` inyectado/mockeado (mismo patrón que `jooble.ingest.service.test.ts`);
suite completa de `jobs` existente sin regresiones; typecheck/test/build.

**Riesgos:** el ToS final de Adzuna resulta no compatible (gate de la Fase 4 — criterio de
aborto ya definido en `product-rules-and-ranking.md`); rate limits del free tier; campos
incompletos o distintos a los documentados en la overview; ambigüedad de salario/divisa fuera
de España; duplicados de la misma oferta ya presente vía Jooble (aceptado como riesgo conocido,
sin dedupe cross-source en el MVP).

**Criterios de aceptación:** sin secretos en el repo; sin scraping; tests verdes; Adzuna puede
activarse/desactivarse por configuración de entorno (si falta la key, la ingesta aborta
igual que Jooble sin key, sin romper el resto del backend); Jooble sigue funcionando sin cambios.

### Sprint 16E — Remote tech source

**Objetivo:** añadir una fuente remota tech simple si encaja legalmente, **una sola** de las
candidatas.

**Candidatas:** Jobicy, We Work Remotely, Himalayas (elegir una; ver matriz de Fase 2 para
matices de ToS de cada una — Jobicy pide atribución + ~1 consulta/hora, WWR es RSS público con
`expires_at`, Himalayas tiene auth/rate PENDIENTE de verificar en detalle).

**Alcance:** elegir una sola fuente; cliente sobre su RSS/API oficial; normalizer; fixtures;
tests; script manual (mismo patrón que Jooble/Adzuna); atribución visible según el ToS concreto
de la fuente elegida.

**Fuera de alcance:** varias fuentes a la vez; scraping; live search; dedupe agresivo.

**Archivos probables:** `apps/api/src/jobs/external/<source>/**`;
`apps/api/src/jobs/scripts/ingest-<source>.ts`; `apps/api/.env.example` si la fuente requiere
credenciales; fixtures de test.

**Contratos:** igual que Jooble/Adzuna (client → normalizer → ingest, upsert idempotente);
`sourceUrl` oficial; `status`/`expiresAt` poblados si la fuente los proporciona.

**Tests/verificaciones:** unitarios de normalizer; integración de ingesta mockeada; suite
completa de `jobs` sin regresiones; typecheck/test/build.

**Riesgos:** restricciones anti-agregador (relevante sobre todo si se elige Jobicy o Remotive
en el futuro); frecuencia de ingesta (respetar el rate documentado); política de expiración
específica de la fuente; contenido permitido (snippet vs. completo).

**Criterios de aceptación:** una fuente remota funcional y documentada; sin ToS dudoso sin
resolver; sin secretos en el repo.

### Sprint 16F — ATS curated companies

**Objetivo:** explorar fuentes ATS por empresa como vía legalmente limpia y de alto valor para
candidatos tech (feeds pensados explícitamente para que terceros los ingieran).

**Candidatas:** Greenhouse, Lever, Ashby (los tres confirmados como públicos/sin auth para GET
en la Fase 2; Ashby requiere `jobPosting.list`/`info` por organización).

**Alcance:** lista curada de empresas tech (ES/remoto) que usen alguno de estos ATS; un adapter
inicial para **una** familia ATS (la más simple de las tres elegidas, probablemente Greenhouse
por su API `board_token` pública y bien documentada); ingesta por empresa configurada (lista de
`board_token`s o cuentas, no búsqueda global); tests con fixtures; documentar qué empresas están
permitidas/curadas y por qué.

**Fuera de alcance:** buscador ATS global (no es una API de búsqueda, es "una empresa = un
board"); scraping de páginas de carreras no oficiales; recruiter/ATS interno; aplicar desde JobIT.

**Archivos probables:** `apps/api/src/jobs/external/greenhouse/**` (y análogos si se añade
Lever/Ashby más adelante); documentación de la lista de empresas curadas (dentro de la spec o
un doc de configuración); fixtures de test.

**Contratos:** `source = GREENHOUSE` (o el valor del enum aprobado en 16B/16C) por posting;
`externalId` por posting (id nativo del ATS); `sourceUrl`/`absolute_url` como CTA externo oficial.

**Tests/verificaciones:** fixtures por empresa/ATS; tests de normalizer; suite `jobs` existente
sin regresiones; typecheck/test/build.

**Riesgos:** estructuras de respuesta distintas entre Greenhouse/Lever/Ashby (mitigado
implementando solo uno primero); empresas curadas sin postings activos en un momento dado;
formato de URL de aplicación variable por empresa; posibles duplicados con ofertas ya ingeridas
vía agregadores (Adzuna/Jooble) para la misma empresa.

**Criterios de aceptación:** una ruta ATS curada viable y documentada; sin scraping; sin datos
no permitidos por el ATS.

### Sprint 16G — Staging/demo data bootstrap

**Objetivo:** preparar datos seguros para staging/demo sin depender de llamadas reales en tiempo
de ejecución del producto (nunca live desde el candidato).

**Alcance:** ingesta manual controlada (o seed) ejecutada por el operador antes de la demo;
ofertas claramente marcadas por fuente; documentar qué fuentes son "demo-safe" (bajo riesgo de
ToS, sin rate limits agresivos — candidatas naturales: seed INTERNAL, Jooble, y la fuente que se
haya cerrado en 16D/16E/16F); evitar datos expirados en la demo; validar manualmente que el CTA
externo de cada fuente representada funciona.

**Fuera de alcance:** producción; cron; automatización externa; n8n.

**Archivos probables:** `apps/api/prisma/seed*` (si se decide ampliar el seed, siempre
manteniendo la distinción seed=INTERNAL); scripts de ingesta manual ya existentes (reutilizados,
no nuevos); documentación en `docs/sprints/` o `docs/development/` sobre el proceso de bootstrap.

**Contratos:** candidate-first; sin secretos; sin scraping; enlace oficial externo funcional en
todas las ofertas de demo.

**Tests/verificaciones:** `prisma db seed`/`migrate` si aplica; suite de `jobs` sin regresiones;
smoke manual en staging si el entorno lo permite (equivalente al smoke de `/jobs`/`/match` ya
hecho en sprints 15C-15E).

**Riesgos:** datos demo que quedan obsoletos/expirados con el tiempo; mezclar seed INTERNAL con
ofertas externas reales sin distinguirlas visualmente; enlaces externos rotos si la oferta
original se retira en el origen.

**Criterios de aceptación:** demo con ofertas claras y trazables por fuente; sin datos
prohibidos por ningún ToS; sin llamadas live por búsqueda del candidato.

## Plan recomendado inmediato

1. **Cerrar Sprint 16 documental** (Fases 1–5 de este ciclo) con el informe final del operador.
2. Abrir **16A — Housekeeping Jooble** (consolidar los scripts duplicados antes de sumar fuentes).
3. Crear la **spec `job-sources-aggregation.md`** (16B) y conseguir su aprobación explícita.
4. Hacer la **migración mínima de `JobSource`** (16C) **solo tras** aprobar 16B — nunca antes.
5. **Implementar Adzuna** (16D) **solo si** el ToS final (leído completo, no solo el overview)
   resulta compatible con las reglas de producto de la Fase 4.
6. **Si Adzuna se bloquea** por ToS, pasar directamente a la alternativa ya identificada: **ATS
   curado** (16F, riesgo legal mínimo) o **Jobicy/We Work Remotely** (16E, sin credenciales).

## Gates de aprobación

- **Gate legal/ToS por fuente**: ninguna fuente nueva se implementa sin haber leído su ToS
  completo (no solo la landing/overview) y sin que el resultado sea compatible con las reglas
  de la Fase 4.
- **Gate secretos/env**: ninguna key real se commitea ni se imprime; toda credencial nueva sigue
  el patrón `<FUENTE>_API_KEY`/`<FUENTE>_API_BASE_URL` documentado en `.env.example` sin valores reales.
- **Gate Prisma/migración**: ningún cambio de `schema.prisma` sin spec previa (16B) y
  autorización explícita del operador para ejecutar la migración.
- **Gate tests**: ninguna fase se da por cerrada sin `typecheck`/`test`/`build` en verde para
  los paquetes tocados.
- **Gate frontend/UX**: ningún cambio de UI se hace sin verificar que sigue las reglas de
  visualización de la Fase 4 (fuente visible, CTA honesto, sin simular ofertas propias).
- **Gate staging/demo**: ningún dato de demo se usa sin confirmar que la fuente es "demo-safe"
  (sin riesgo de ToS ni de rate limit agresivo).
- **Gate no Co-Authored-By**: ningún commit de ninguna fase incluye `Co-Authored-By` (regla ya
  vigente y verificada en todos los cierres de sprint de este proyecto).

## Riesgos por fase

| Fase | Riesgo principal |
|---|---|
| 16A | Romper un comando documentado o retirar un script aún en uso |
| 16B | Sobredefinir el alcance o colar fuentes no aprobadas en la spec |
| 16C | Migración de enum con impacto en datos existentes o en CI |
| 16D | ToS de Adzuna no compatible tras lectura completa; rate limits; duplicados con Jooble |
| 16E | Restricciones anti-agregador de la fuente elegida; frecuencia/expiración mal calibrada |
| 16F | Estructuras distintas entre ATS; empresas curadas sin postings; URLs de apply variables |
| 16G | Datos demo obsoletos; mezcla visual de seed con ofertas externas reales |

## Definition of Done por integración de fuente

Para cualquier fuente nueva (Adzuna, remota tech, ATS…), antes de considerarla "hecha":

- [ ] Documentación oficial revisada (no blogs/mirrors/terceros).
- [ ] ToS aprobado explícitamente (o riesgo aceptado y documentado por el orquestador).
- [ ] Variables de entorno documentadas en `.env.example`, **sin valores reales**.
- [ ] `client` + `normalizer` + `ingest.service` + tests unitarios de cada uno.
- [ ] Fixtures sin datos sensibles ni llamadas reales necesarias para testear.
- [ ] Ingesta manual controlada (script backend-only, sin endpoint público).
- [ ] Upsert idempotente por `(source, externalId)`.
- [ ] Fuente visible en la UI (label + atribución si el ToS la exige).
- [ ] CTA externo funcional (`sourceUrl`/`applyUrl` según corresponda).
- [ ] Sin scraping.
- [ ] Sin búsqueda live por request de candidato.
- [ ] `typecheck`/`test`/`build` en verde para los paquetes tocados.
- [ ] Informe final de sprint (`docs/sprints/sprint-XX-...-final-report.md`).
- [ ] Commit(s) sin `Co-Authored-By`, revisados antes de push/PR.

## Fuera de alcance global

- **LinkedIn / Indeed / Randstad** sin acuerdo formal (bloqueadas, ver Fase 2 y 4).
- **Scraping**, en cualquier fuente, bajo cualquier circunstancia.
- **Aplicar desde JobIT** (candidatura interna) — la inscripción ocurre siempre en el origen.
- **IA para evaluar personas** — Match sigue siendo reglas visibles, no scoring de candidatos.
- **n8n** ni ninguna automatización externa de orquestación.
- **Cron productivo** — toda ingesta de este plan es manual/controlada, no programada aún.
- **Recruiter/ATS completo** (gestión de candidaturas, pipelines) — fuera del MVP candidate-first.
- **App móvil.**
- **Monetización.**

## Recomendación para el orquestador

- **Cerrar Sprint 16** como sprint **discovery/documental** una vez exista el informe final del
  operador (Fase 6) — este plan **no** cierra el sprint por sí mismo.
- **Siguiente sprint recomendado: 16A — Housekeeping Jooble scripts**, por ser el prerequisito
  de menor riesgo y mayor claridad antes de tocar nada relacionado con fuentes nuevas.
- Tras 16A: **16B (spec) → 16C (migración mínima, solo con aprobación explícita)**.
- **Adzuna (16D)** como primera fuente nueva, **condicionado** a que el ToS completo (no solo el
  overview ya revisado) sea compatible con las reglas de producto de la Fase 4.
- Si Adzuna queda bloqueada por ToS, **fallback inmediato** a **ATS curado (16F)** o
  **Jobicy/We Work Remotely (16E)**, ambas ya validadas como legalmente más simples en la matriz
  de Fase 2.
- Ninguna fase de este plan se ejecuta automáticamente: cada una requiere su propio prompt de
  arranque, su propia rama y su propia revisión humana antes de PR/merge.

## Documentos revisados

`docs/sprints/sprint-16-job-sources-discovery-matrix.md`,
`docs/sprints/sprint-16-job-sources-architecture-review.md`,
`docs/sprints/sprint-16-job-sources-product-rules-and-ranking.md`,
`docs/architecture/03-job-sources-and-search.md`,
`docs/specs/features/jobs.md`, `docs/specs/features/external-jobs-jooble.md`,
`docs/specs/features/jooble-ingestion.md`, `docs/specs/00-mvp-scope.md`,
`docs/sprints/sprint-15f-jooble-ingestion-config-final-report.md`,
`docs/sprints/sprint-15g-jooble-location-ingestion-final-report.md`.
