# Estado actual de JobIT Platform — Lean Snapshot

**Fecha:** 2026-08-18
**Estado:** snapshot canónico vigente bajo Orchestrator v3 Lean
**Rama canónica:** `dev`
**Repositorio:** `David-LS-Bilbao/JobIT-platform`

> Este documento resume solo el estado operativo vigente. Git, código, PR, CI y runtime verificados prevalecen si existe divergencia.

## BASELINE

```text
MANDATE_CREATION_CHECKPOINT:
a68066b2782c1b491dcb90dd8928c89d73118ba2

STATE_CHECKPOINT:
a68066b2782c1b491dcb90dd8928c89d73118ba2

CURRENT_DEV:
VERIFY_FROM_GIT
```

`STATE_CHECKPOINT` es el commit histórico de `origin/dev` desde el que se realizó esta reconciliación (merge PR #117, `docs(agents): add lean orchestrator v3 governance`). No se actualiza para perseguir merges posteriores. `CURRENT_DEV` se obtiene de Git cuando sea necesario.

## EXECUTIVE_STATUS

```text
Candidate-first:                  PRESERVED
Core product:                     FUNCTIONALLY_COMPLETE_WITH_DEBT
Open technical P0 blockers:       0
Public staging:                   NOT_AUTHORIZED
Production / real candidates:     NOT_AUTHORIZED
Legal decision gate:              OPEN
```

## ORCHESTRATION

```text
Original Orchestrator:
ARCHIVED_READ_ONLY

Orchestrator v2:
ARCHIVED_READ_ONLY

Orchestrator v3 Lean:
ACTIVE_CANONICAL
```

Solo puede existir un Orquestador Global activo.

## NOW

```text
ORCHESTRATOR_V3_LEAN_MIGRATION:
CLOSED

ACTIVE_FUNCTIONAL_UNIT:
NONE

Decisión inmediata:
ORCHESTRATOR_DECISION_REQUIRED_FOR_NEXT_UNIT
```

## NEXT

```text
NEXT_FUNCTIONAL_CANDIDATE:
SESSION_CONTINUITY_AND_401_RECOVERY

Findings:
AUTH-03
B4-STATE-02

Risk:
LEVEL_3

Implementation:
NOT_AUTHORIZED_YET
```

Evidencia confirmada:

- cookie `refresh_token` httpOnly existe;
- persistencia `RefreshToken` existe;
- no existe endpoint de refresh;
- access JWT expira a 15 minutos;
- access token vive solo en memoria React;
- recargar la página pierde la sesión;
- 401 no tiene recuperación transversal centralizada.

Antes de implementar:

- spec SDD;
- Plan Mode;
- contrato de rotación/revocación;
- recuperación de sesión al bootstrap;
- estrategia single-flight para refresh concurrente;
- retry máximo controlado;
- revisión privacy/legal aplicable.

## LATER

```text
Account lifecycle
- account access lifecycle
- account data lifecycle
- avatar physical deletion where applicable

Jobs/data readiness
- Saved Jobs preservation
- ingestion lifecycle / stale / close
- match data quality
- cross-source dedupe and provider governance

Deployment readiness
- production compose/template
- real staging contract
- observability
- production backups
- migration/deploy hardening
```

El orden interno no queda autorizado por este snapshot.

## BLOCKED

```text
INFOJOBS:
BACKLOG_BLOCKED_BY_PARTNER_AND_TOS

JOB_RADAR:
HOLD_IMPLEMENTATION

RECRUIT:
HOLD_IMPLEMENTATION

CANDIDATE_DISCOVERY:
HOLD_IMPLEMENTATION

REAL_CANDIDATE_DATA:
NOT_AUTHORIZED
```

InfoJobs solo se reactiva mediante decisión expresa tras autorización/partner/ToS compatibles.

## PRE_DEPLOY

```text
S22-PRIV-01:
LEGAL_GATE_OPEN

PRIV-02:
OPEN_FOR_PRODUCTION

Sprint 24B / Tramo B:
DEFERRED_TO_PRE_DEPLOYMENT_GATE

HUMAN_LEGAL_VALIDATION:
PENDING

PUBLIC_STAGING:
NOT_AUTHORIZED

PRODUCTION:
NOT_AUTHORIZED
```

Las superficies legales públicas pueden diferirse al gate final, pero privacy-by-design se aplica durante cada sprint que trate datos, auth, cookies, uploads, retención, borrado, proveedores o profiling.

## OPEN_DECISIONS

```text
1. Numeración de la unidad Session Continuity & 401 Recovery.
2. Contrato exacto de refresh/rotation tras Plan Mode.
```

No reservar `Sprint 26B` para el roadmap general; InfoJobs permanece bloqueado.

## CANONICAL_REFERENCES

```text
AGENTS.md
docs/agents/jobit-operating-model-v2.md
docs/agents/jobit-global-orchestrator-v3.md
docs/agents/jobit-chat-director-contract-v1.md
docs/agents/sdd-tdd-ai-audit-workflow.md
docs/agents/tdd-guidelines.md
docs/agents/audit-quality-security-skill.md
docs/agents/git-pr-skill.md
docs/agents/pr-checklist.md
docs/agents/operating-environment.md
docs/agents/skills/privacy-legal-reference.md
docs/audits/README.md
docs/product/jobit-job-radar-candidate-discovery-strategy.md
```

Leer únicamente specs, ADR, auditorías e informes vinculados a la decisión activa.

## UPDATE_POLICY

Actualizar tras:

- merge importante;
- cambio relevante de `dev`;
- apertura/cierre de gate;
- auditoría aceptada;
- cambio de `NOW` o `NEXT`;
- autorización de staging, producción o datos reales.

No registrar cada commit menor.
