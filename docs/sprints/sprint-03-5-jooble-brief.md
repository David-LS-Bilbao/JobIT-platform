# Sprint 03.5 — Jooble External Jobs Integration · Brief

## Estado

Fase 1 (documental) en curso. **La implementación permanece BLOQUEADA hasta revisión humana** de la spec y el ADR de esta fase.

- Rama: `feat/sprint-03-5-jooble` (cortada desde `dev`).
- Documentos base: [spec External Jobs — Jooble](../specs/features/external-jobs-jooble.md), [ADR-0011](../decisions/ADR-0011-jooble-external-jobs-integration.md).
- Antecedentes: [Jobs (M03)](../specs/features/jobs.md), [ADR-0008](../decisions/ADR-0008-database-orm-initial-model.md), [informe final Sprint 03](sprint-03-jobs-final-report.md).

## Objetivo

Integrar **Jooble como única fuente externa de ofertas** para el módulo Jobs, mediante ingesta server-side normalizada, persistida, trazable y deduplicada, sin romper el listado existente (M03), sin scraping, sin exponer la API key al cliente y sin llamar a Jooble en el request del candidato ni desde el frontend.

## Alcance

- Documentación SDD + ADR que habilita la integración (Fase 1, esta entrega).
- Modelo de datos con trazabilidad de origen (`source`, `externalId`, `sourceUrl`, `ingestedAt`) y deduplicación `(source, externalId)`.
- Configuración server-side de la API key (`JOOBLE_API_KEY`).
- Cliente HTTP de Jooble, normalizador y servicio de ingesta idempotente.
- Lectura del candidato servida **solo** desde datos persistidos; convivencia de ofertas internas y externas.
- Compatibilidad con el MVP candidate-first y no regresión de M03.

## Fuera de alcance

- Cualquier código funcional en la Fase 1 (solo documentación).
- Scraping de Jooble o de cualquier portal.
- Llamadas a Jooble desde el frontend o desde el request directo del candidato.
- Otras fuentes externas distintas de Jooble.
- Recruiter, ATS, monetización, IA avanzada y matching inteligente.
- Frontend/UI (`apps/web/` no existe), alertas, aplicación directa a ofertas y deploy.

## Entregables

### Fase 1 (esta entrega — documental)

- `docs/specs/features/external-jobs-jooble.md` — spec de la integración.
- `docs/decisions/ADR-0011-jooble-external-jobs-integration.md` — decisión arquitectónica.
- `docs/sprints/sprint-03-5-jooble-brief.md` — este brief.

### Fases posteriores (no en esta entrega)

- Configuración de `JOOBLE_API_KEY` (env + `.env.example` con placeholder).
- Migración Prisma con campos de provenance y constraint de dedup.
- Normalizador + DTO interno con tests de fixtures.
- Cliente HTTP de Jooble con manejo de errores/rate-limit/backoff.
- Servicio de ingesta idempotente (upsert por `source` + `externalId`).
- Tests de no regresión de M03 y de seguridad de la API key.

## Criterios de aceptación

### De la Fase 1 (documental)

- [ ] Existe una rama feature separada desde `dev` (`feat/sprint-03-5-jooble`).
- [ ] Se han creado **solo** los tres documentos indicados.
- [ ] La spec contradice de forma explícita y controlada la exclusión previa de APIs externas, justificando por qué existe el Sprint 03.5.
- [ ] El ADR explica cómo se actualiza la decisión previa (ADR-0008) sin abrir scope creep.
- [ ] El brief deja claro que la implementación sigue bloqueada hasta revisión humana.
- [ ] No hay cambios fuera de `docs/specs`, `docs/decisions` y `docs/sprints`.

### De la feature completa (fases posteriores)

- [ ] Las ofertas externas se muestran solo si están persistidas y normalizadas.
- [ ] Cada oferta externa tiene `source`, `externalId`, `sourceUrl` e `ingestedAt`.
- [ ] No hay duplicados (dedup por `source` + `externalId`).
- [ ] El listado interno/seed de M03 sigue funcionando sin regresiones.
- [ ] La API key nunca se expone al cliente ni en logs.
- [ ] Un error de Jooble no rompe `GET /api/jobs`.

## Fases propuestas

1. **Fase 1 — Governance documental (esta entrega).** Spec + ADR-0011 + brief. Sin código. Cierre: revisión humana.
2. **Fase 2 — Contrato externo + configuración (sin red real).** `JOOBLE_API_KEY` en env + `.env.example`; DTO/normalizador y esquema de validación del payload; tests del normalizador con fixtures.
3. **Fase 3 — Modelo de provenance.** Migración Prisma: campos `source`, `externalId`, `sourceUrl`, `ingestedAt` + constraint `(source, externalId)`; seed marcado como `INTERNAL`; tests de compatibilidad.
4. **Fase 4 — Cliente + proceso de ingesta controlado.** Cliente HTTP de Jooble con manejo de errores/rate-limit; **proceso de ingesta controlado** e idempotente (upsert por `source` + `externalId`), cuyo mecanismo concreto de disparo se decide en esta fase sin autorizar scheduling en producción; lectura del candidato solo desde persistencia; tests con cliente mockeado y no regresión de M03; auditoría quality/security → PR a `dev`.

## Decisiones pendientes antes de implementar

> Se registran aquí y deben cerrarse en la fase correspondiente, antes de escribir el código que dependa de cada una.

- **Mecanismo de ingesta:** proceso de backend controlado; el disparo concreto (script manual/controlado **vs** scheduler futuro) se decide en fase posterior. No se autoriza scheduling en producción en este sprint.
- **`source` como enum Prisma vs `String`:** a decidir por coherencia con ADR-0008 (que eligió `String` para `contractType` para evitar *churn* de enums).
- **Índice único parcial para `(source, externalId)`:** con `externalId` nullable en PostgreSQL, definir índice único parcial (`WHERE externalId IS NOT NULL`). A cerrar en la fase de migración.
- **Política de defaults para campos Jooble incompletos:** valores por defecto seguros al mapear `status`, `expiresAt`, `seniority`, `remoteType`, etc.
- **Política de frescura/caducidad de ofertas externas:** cadencia de re-ingesta y criterio de expiración/retirada de ofertas externas obsoletas.
- **Fuentes externas distintas de Jooble quedan FUERA de alcance:** cualquier otra fuente exigirá nueva spec/ADR; ADR-0011 solo autoriza Jooble.

## Riesgos principales

| Riesgo | Mitigación |
|---|---|
| Governance: implementar contradiciendo M03/ADR-0008 | Fase 1 (spec + ADR) aprobada antes de cualquier código |
| API key expuesta o commiteada | Solo backend; placeholder en `.env.example`; nunca en logs ni respuestas |
| Rate limits / cuotas / coste de Jooble | Ingesta desacoplada y cacheada; backoff; sin llamadas en el request del candidato |
| Datos externos sin normalizar | Capa de normalización + validación; defaults seguros; descarte de inválidos |
| Duplicados | Constraint `(source, externalId)` + upsert idempotente |
| Mezcla indistinguible interno/externo | Campo `source`; seed marcado `INTERNAL` |
| Errores de la API externa rompen el listado | Aislamiento en ingesta; lectura desde persistencia |
| Tests dependientes de red | Mock del cliente HTTP; sin red real en CI |

## Verificación final esperada

### Fase 1

- `git status -sb` y `git diff --stat` muestran **solo** los tres documentos creados bajo `docs/`.
- Sin cambios en `apps/`, `packages/`, Prisma, `package.json`, `.env`/`.env.example` ni lockfiles.
- Sin commits ni push (revisión humana primero).

### Fases posteriores

- Suite de M03 en verde (no regresión) + nuevos tests de normalizador, dedup, resiliencia y seguridad.
- `typecheck` y `build` en verde.
- Auditoría quality/security en `PASS`/`PASS_WITH_NOTES` antes de abrir PR a `dev`.
