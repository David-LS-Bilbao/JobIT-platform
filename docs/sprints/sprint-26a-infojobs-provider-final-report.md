# Informe final

> Este informe se incorpora retrospectivamente durante OPS-03 para cerrar una ausencia
> documental. No modifica el alcance ejecutado ni reabre Sprint 26A.

## Sprint o tarea

Sprint 26A — InfoJobs Provider Plan.

## Objetivo inicial

Definir una implementación incremental, segura y aprobable por el orquestador para
incorporar InfoJobs como cuarta fuente externa de ofertas (`INTERNAL`, `JOOBLE`,
`GREENHOUSE`, futura `INFOJOBS`), sin romper el patrón de arquitectura rector (fuentes
externas → ingesta controlada → base de datos JobIT → búsqueda local → enlace oficial
externo), documentando el diseño técnico y los gates de aprobación sin implementar nada.

## Baseline inicial

```text
dev @ 9509f07d768876a7dd3db2c858a5476b54e5be7b
```

Rama de trabajo: `docs/sprint-26a-infojobs-provider-plan`, head en
`bd3661ef5e987ea989f5de260991bcea2400330f`.

## Trabajo realizado

- Creación de la spec técnica `docs/specs/features/infojobs-external-jobs.md`: diseño
  condicionado de la integración (ingesta backend-only, lectura exclusiva desde
  PostgreSQL, sin scraping, sin live search, sin OAuth de usuario), con Gate 0
  legal/partner como precondición explícita de cualquier código.
- Creación del plan de gates `docs/sprints/sprint-26a-infojobs-provider-plan.md`: ocho
  gates (0 a 7) revisables de forma independiente, replicando el patrón de cinco piezas
  ya validado con Jooble/Greenhouse, con archivos permitidos/prohibidos y Definition of
  Done por gate.
- Ningún gate técnico (0–7) fue ejecutado durante Sprint 26A. Sprint 26A es exclusivamente
  documental.

## Archivos modificados

Ningún archivo existente fue modificado. Se crearon dos archivos nuevos:

```text
docs/specs/features/infojobs-external-jobs.md      (267 líneas)
docs/sprints/sprint-26a-infojobs-provider-plan.md   (349 líneas)
```

Total: 2 archivos nuevos, 616 inserciones, 0 eliminaciones.

## Pull request y merge

```text
PR:      #102
Título:  docs(sprint-26a): plan InfoJobs provider gate
Base:    dev @ 9509f07d768876a7dd3db2c858a5476b54e5be7b
Head:    docs/sprint-26a-infojobs-provider-plan @ bd3661ef5e987ea989f5de260991bcea2400330f
Merge:   7c759d0206da9731a18e2a5994883ac5a2f7a77b
```

## Tests y verificaciones

Verificaciones documentales declaradas en PR #102, no reejecutadas durante OPS-03:

```text
git diff --check:          PASS
enlaces Markdown locales:  PASS
tests/lint/build:          OMITTED — cambio exclusivamente documental
```

No se ejecutó ningún test, typecheck, lint ni build de `apps/api` o `apps/web`, porque el
sprint no tocó código de aplicación.

## Decisiones técnicas

Decisiones de planificación documentadas por la spec y el plan, **no implementadas**:

- Mismo patrón de cinco piezas que Jooble/Greenhouse (`client`, `schemas`, `normalizer`,
  `ingest.service`, `types`) más fixtures y tests, previsto para el Gate 3 de Sprint 26B.
- Ingesta backend-only, manual, sin endpoint público; lectura del candidato siempre desde
  PostgreSQL, sin llamada en caliente a InfoJobs.
- No scraping y no live search, sin excepción, en ningún gate.
- Migración de enum aditiva única (`ALTER TYPE "JobSource" ADD VALUE 'INFOJOBS'`), mismo
  formato que las migraciones ya existentes de `ADZUNA` y `GREENHOUSE`, prevista para el
  Gate 1.
- `descriptionSnippet` recomendado sobre descripción completa, como medida conservadora
  ante el hallazgo `JOBS-10` (Sprint 22), a confirmar en Gate 0.
- Exposición pública del filtro (`jobs.schemas.ts`, Gate 5) y del frontend (`apps/web/**`,
  Gate 6) diferidas explícitamente, sin bloquear los gates 1–4.
- Secretos (`INFOJOBS_CLIENT_ID`, `INFOJOBS_CLIENT_SECRET`, `INFOJOBS_API_BASE_URL`)
  previstos exclusivamente como variables de entorno backend, nunca commiteados,
  logueados ni expuestos al cliente; nombres sujetos a validación real en Gate 0.

Estas son decisiones de diseño y planificación aprobables por el orquestador, no
implementación.

## Gate legal/partner

```text
INFOJOBS:
BACKLOG_BLOCKED_BY_PARTNER_AND_TOS

GATE_0:
NOT_CLOSED

SPRINT_26B:
NOT_AUTHORIZED
```

Gate 0 (legal/partner, no técnico) es bloqueante para cualquier gate posterior. Requiere:
lectura completa del ToS vigente de InfoJobs, confirmación de aprobación de app/partner, y
un nuevo ADR (recomendado `ADR-0013`) aprobado por el orquestador. Ninguno de estos tres
pasos se completó en Sprint 26A ni en OPS-03.

## Problemas encontrados

- Ausencia del informe final de Sprint 26A al momento de mergear PR #102 — corregida
  retrospectivamente mediante este documento, incorporado durante OPS-03.
- Ningún problema técnico de runtime, tests, typecheck, lint o build, porque Sprint 26A no
  incluyó implementación de código.

## Fuera de alcance respetado

- Código, migraciones Prisma, provider, frontend, OAuth o llamadas reales a InfoJobs.
- Credenciales reales de cualquier tipo.
- Redacción del ADR recomendado (`ADR-0013`) — solo recomendado, no creado.
- Levantamiento del bloqueo legal/partner vigente.
- Inscripción o candidatura dentro de JobIT, importación de CVs o datos privados de
  InfoJobs.
- Scraping y búsqueda live contra InfoJobs.
- Cron productivo o automatización de ingesta.
- Recruiter/ATS completo, monetización, aplicación móvil, IA para evaluar personas.

## Pendiente

Gates 1 a 7 completos de Sprint 26B, en particular Gate 0 (legal/partner), sin el cual
ningún gate técnico posterior puede abrirse.

## Estado de Sprint 26B

```text
NOT_AUTHORIZED
```

## Recomendación para el Orquestador

Sprint 26A (spec + plan) puede considerarse cerrado como sprint documental con este
informe final. El siguiente paso recomendado es Gate 0, íntegramente legal/de producto —
no requiere agente de desarrollo escribiendo código, sino una decisión del orquestador
(lectura de ToS, confirmación de partner, aprobación de un nuevo ADR). Ningún gate técnico
(1–7) debe abrirse antes de que Gate 0 esté cerrado. Si Gate 0 se bloquea de forma
indefinida, InfoJobs permanece diseñada, documentada y no implementada, sin coste de
mantenimiento porque no existe código.

## Estado final

```text
SPRINT_26A:
CLOSED_DOCUMENTATION_ONLY

INFOJOBS:
BACKLOG_BLOCKED_BY_PARTNER_AND_TOS

SPRINT_26B:
NOT_AUTHORIZED
```
