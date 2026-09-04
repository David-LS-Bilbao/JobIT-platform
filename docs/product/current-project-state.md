# Estado actual de JobIT Platform — Lean Snapshot

**Fecha:** 2026-09-04
**Estado:** snapshot canónico vigente bajo Orchestrator v3 Lean
**Rama canónica:** `dev`
**Repositorio:** `David-LS-Bilbao/JobIT-platform`

> Este documento resume solo el estado operativo vigente. Git, código, PR, CI y runtime verificados prevalecen si existe divergencia.

## BASELINE

```text
STATE_CHECKPOINT:
55b9accf434477f619058a8a6d3a689ddb8532aa

CURRENT_DEV:
VERIFY_FROM_GIT
```

`STATE_CHECKPOINT` es el commit histórico de `origin/dev` desde el que se realizó esta reconciliación: el merge commit de PR #120, que incorpora el commit `311b6d0346b54f5cf43bcc2887b67cec1ca90542` (`fix(auth): use fresh token for session recovery`). No se actualiza para perseguir merges posteriores y no representa el HEAD remoto vigente. `CURRENT_DEV` se obtiene de Git cuando sea necesario.

## EXECUTIVE_STATUS

```text
Candidate-first:                  PRESERVED
Core product:                     FUNCTIONALLY_COMPLETE_WITH_DEBT

GLOBAL_REVIEW_PLUS:
TECHNICALLY_COMPLETE

GLOBAL_REVIEW_PLUS_TECHNICAL_FOLLOWUP:
COMPLETE

OPEN_P0_CURRENT:
0

OPEN_P1_CURRENT:
0

Public staging:                   NOT_AUTHORIZED
Production / real candidates:     NOT_AUTHORIZED
Legal decision gate:              OPEN
```

Ledger durable de Global Review+: [`docs/audits/global/global-review-plus-findings-ledger.md`](../audits/global/global-review-plus-findings-ledger.md).

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

A — CANONICAL RECONCILIATION:
COMPLETED

B — CANDIDATE-FIRST FUNCTIONAL CLOSURE:
COMPLETED
```

La fase `A` se cerró con el merge de PR #121 (`docs(governance): reconcile Global Review+ state`). La fase `B` cerró los cinco P1 abiertos en dos bloques: `B-CORE` (PR #123) y `B-HARDENING`. No hay unidad funcional activa; la siguiente acción de gobernanza es el rollover del Orquestador (§OPEN_DECISIONS).

## CLOSED_UNITS

```text
SESSION_CONTINUITY_AND_401_RECOVERY:
CLOSED

PR:
#119

HOTFIX_SESSION_RECOVERY:
CLOSED

PR:
#120

CANDIDATE_FIRST_FUNCTIONAL_CLOSURE:
CLOSED

PR:
#123 (B-CORE)
B-HARDENING
```

Findings cerrados por estas dos unidades:

```text
AUTH-03:
RESOLVED_IN_DEV

B4-STATE-02:
RESOLVED_IN_DEV

POST119-FE-01:
RESOLVED_IN_DEV

POST119-FE-02:
RESOLVED_IN_DEV

HOTFIX-REV-01:
RESOLVED_IN_DEV
```

Punteros:

- contrato de arquitectura: [`docs/decisions/ADR-0014-session-continuity-refresh-contract.md`](../decisions/ADR-0014-session-continuity-refresh-contract.md);
- spec funcional: [`docs/specs/features/session-continuity-401-recovery.md`](../specs/features/session-continuity-401-recovery.md);
- ledger de hallazgos: [`docs/audits/global/global-review-plus-findings-ledger.md`](../audits/global/global-review-plus-findings-ledger.md).

Migración asociada:

```text
VERSIONED_MIGRATION:
20260819091121_add_refresh_token_rotation_lineage

MERGED_IN_DEV:
YES

STAGING_APPLICATION:
PENDING

PRODUCTION_APPLICATION:
PENDING
```

La aplicación de la migración en staging o producción requiere autorización humana separada y no queda concedida por este snapshot.

## NEXT

```text
NEXT_FUNCTIONAL_CANDIDATE:
ORCHESTRATOR_DECISION_REQUIRED

Roadmap sugerido:
C — STAGING TECHNICAL READINESS

Autorización:
NOT_GRANTED_BY_THIS_SNAPSHOT
```

`ACCOUNT_LIFECYCLE` era el candidato anterior y quedó implementado en la fase `B`. Con `OPEN_P1_CURRENT: 0`, la siguiente fase natural del roadmap candidate-first es `C`, pero **no está autorizada**: requiere decisión expresa del Orquestador y, en lo que toca a despliegue, autorización humana adicional.

## LATER

`OPEN_P1_CURRENT: 0`. Los cinco P1 que arrastraba Global Review+ quedaron resueltos en `dev` durante la fase B; el detalle y su evidencia viven en el ledger.

```text
S22-AUTH-06 / B4-OPS-02
Account lifecycle
RESOLVED_IN_DEV

AUDIT02-LIFE-AVATAR-01
Physical avatar cleanup
RESOLVED_IN_DEV

AUDIT03-URL-SCHEME-01
Public URL protocol hardening
RESOLVED_IN_DEV

AUDIT05-DEPLOY-PROXY-RATELIMIT-01
Proxy / TRUST_PROXY_HOPS
RESOLVED_IN_DEV

AUDIT05-OPS-PROD-ERROR-LOG-01
Safe staging/production error observability
RESOLVED_IN_DEV
```

Backlog restante por dominios, sin prioridad autorizada:

```text
Jobs/data readiness
- Saved Jobs preservation
- ingestion lifecycle / stale / close
- match data quality
- cross-source dedupe and provider governance

Deployment readiness
- production compose/template
- real staging contract
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
BLOCKED

COMMUNITY_CHAT_FORUMS:
LATER

MONETIZATION_SUBSCRIPTIONS_ADS:
LATER

ADVANCED_AI_MATCHING:
LATER

MOBILE_APP:
LATER

MASSIVE_EXTERNAL_APIS:
LATER

N8N_PRODUCTION_AUTOMATION:
LATER
```

InfoJobs solo se reactiva mediante decisión expresa tras autorización/partner/ToS compatibles.

## PRE_DEPLOY

Tres ejes de readiness. Ninguno es una autorización: ningún eje habilita por sí solo despliegue, staging ni producción.

```text
PRE_STAGING_TECHNICAL:
technical readiness axis for synthetic staging.
Does not authorize deployment.

PRE_PRODUCTION_TECHNICAL:
technical readiness axis for future production.
Does not authorize production.

PRE_PRODUCTION_LEGAL:
legal/privacy readiness axis for real-data or production use.
Remains OPEN/PENDING where applicable.
```

Catálogo compacto de requisitos por eje. Ninguna entrada está marcada como completada: son requisitos pendientes de evidencia.

```text
READINESS_REQUIREMENTS

PRE_STAGING_TECHNICAL
- CI green
- reverse proxy / TRUST_PROXY_HOPS
- staging env/config
- TLS
- versioned migrations + migrate deploy protocol
- synthetic seed
- healthchecks
- safe diagnostic logging
- Golden E2E readiness
- guards against real candidate data

PRE_PRODUCTION_TECHNICAL
- off-host backups / retention
- restore drill
- monitoring / alerts
- production observability
- final migration / rollback readiness
- branch / dependency hardening
- operational / incident controls

PRE_PRODUCTION_LEGAL
- S22-PRIV-01 closure
- human legal validation
- privacy policy / notices
- retention policy
- data-subject rights
- provider / processing agreements when applicable
- explicit authorization for real candidate data
```

```text
These are readiness requirements, not assertions of completion.
No individual requirement or gate authorizes staging, real data or production.
```

`PRE_STAGING_TECHNICAL` reutiliza la arquitectura de staging ya existente y no la rediseña: [`docs/decisions/ADR-0012-staging-deploy-architecture.md`](../decisions/ADR-0012-staging-deploy-architecture.md), [`docs/specs/features/deploy-staging-readiness.md`](../specs/features/deploy-staging-readiness.md), [`docs/deployment/staging-env.md`](../deployment/staging-env.md), [`docs/deployment/staging-vps-deploy-runbook.md`](../deployment/staging-vps-deploy-runbook.md), [`docs/deployment/backup-restore-runbook.md`](../deployment/backup-restore-runbook.md).

Modos de dato operativos:

```text
MODE_1:
LOCAL_SYNTHETIC_DEVELOPMENT

MODE_2:
SYNTHETIC_STAGING

MODE_3:
REAL_DATA_OR_PRODUCTION
```

Para `MODE_1` y `MODE_2`:

```text
FULL_LEGAL_CLOSURE:
DEFERRED

PRIVACY_BY_DESIGN:
ACTIVE

SECURITY_GUARDRAILS:
ACTIVE

LEGAL_DEBT:
RECORDED
```

Restricciones de staging sintético:

```text
SYNTHETIC_STAGING:
REAL_USERS: NO
REAL_CANDIDATE_DATA: NO
SYNTHETIC_DATA: YES
AUTHORIZED_TESTERS_ONLY: YES
DEPLOYMENT_AUTHORIZATION: HUMAN_REQUIRED
```

Datos reales o producción:

```text
REAL_DATA_OR_PRODUCTION:
requires all applicable technical, legal/privacy and human governance gates.
No individual gate authorizes production by itself.
```

Estado jurídico vigente, reproducido sin reinterpretación y no levantable por ningún agente:

```text
S22-PRIV-01:
LEGAL_GATE_OPEN

LEGAL_DECISION_GATE:
OPEN

PRIV-02:
OPEN_FOR_PRODUCTION

Sprint 24B / Tramo B:
DEFERRED_TO_PRE_DEPLOYMENT_GATE

HUMAN_LEGAL_VALIDATION:
PENDING

REAL_CANDIDATE_DATA:
NOT_AUTHORIZED

PUBLIC_STAGING:
NOT_AUTHORIZED

PRODUCTION:
NOT_AUTHORIZED
```

Las superficies legales públicas pueden diferirse al gate final, pero privacy-by-design se aplica durante cada sprint que trate datos, auth, cookies, uploads, retención, borrado, proveedores o profiling. La puerta operativa de referencia legal/privacidad vive en [`AGENTS.md`](../../AGENTS.md) y en [`docs/agents/skills/privacy-legal-reference.md`](../agents/skills/privacy-legal-reference.md); este snapshot no la reinterpreta ni añade conclusión jurídica alguna.

## ROADMAP

Fases nombradas candidate-first. No es numeración de sprint y no reserva numeración.

```text
A — CANONICAL RECONCILIATION
    COMPLETED

B — CANDIDATE-FIRST FUNCTIONAL CLOSURE
    COMPLETED

    B-CORE      account lifecycle + avatar physical cleanup   PR #123
    B-HARDENING public URL + TRUST_PROXY_HOPS + observability

C — STAGING TECHNICAL READINESS
    NOT_AUTHORIZED

D — SYNTHETIC STAGING DEPLOY
    NOT_AUTHORIZED
    HUMAN_AUTHORIZATION_REQUIRED

E — FULL FUNCTIONAL STAGING VALIDATION
    NOT_AUTHORIZED

F — STAGING FIX CYCLE
    NOT_AUTHORIZED

G — PRE-PRODUCTION TECHNICAL HARDENING
    NOT_AUTHORIZED

H — PRE-PRODUCTION LEGAL
    NOT_AUTHORIZED

I — REAL-DATA GATE
    NOT_AUTHORIZED

J — PRODUCTION
    NOT_AUTHORIZED
```

`A` y `B` están completadas. Ninguna fase posterior está autorizada: `C`–`J` requieren decisión expresa del Orquestador y, donde corresponda, autorización humana adicional.

La fase `B` se ejecutó como un bloque técnico indivisible en dos PR funcionales, sin PR documental separada. No se incorporó ningún P2: la posibilidad quedó descartada por falta de evidencia que la justificara.

## OPEN_DECISIONS

```text
ORCHESTRATOR_ROLLOVER:
NEXT_GOVERNANCE_ACTION
NOT_EXECUTED
```

La condición previa se cumplió: la reconciliación está mergeada (PR #121). El handoff mínimo exigido por `docs/agents/jobit-global-orchestrator-v3.md` §17 queda cubierto por este snapshot y por el ledger de Global Review+. El rollover sigue sin ejecutarse desde aquí y requiere decisión humana.

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
docs/audits/global/global-review-plus-findings-ledger.md
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
