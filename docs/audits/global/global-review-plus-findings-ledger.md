---
audit_id: GLOBAL-REVIEW-PLUS
title: "Global Review+ — ledger consolidado de hallazgos"
category: global
status: ACCEPTED_WITH_ADJUSTMENTS
baseline: "55b9accf434477f619058a8a6d3a689ddb8532aa"
branch: "dev"
date_started: "2026-08-19"
date_completed: "2026-09-02"
auditor_role: "independent-read-only"
custody: PUBLIC_SAFE
scope:
  - "Consolidación durable del resultado técnico de Global Review+"
  - "Registro de hallazgos cerrados por PR #119 y PR #120"
  - "Registro del ledger de hallazgos P1 que permanecen abiertos"
out_of_scope:
  - "Implementación o cierre de cualquier hallazgo P1"
  - "Cierre o reinterpretación de S22-PRIV-01"
  - "Autorización de staging, datos reales o producción"
  - "Código, Prisma, migraciones, CI, Docker e infraestructura"
  - "Creación del informe final de unidad en docs/sprints/"
orchestrator_review:
  status: "accepted_with_adjustments"
  date: "2026-09-02"
  decision_ref: "GLOBAL_REVIEW_PLUS_CANONICAL_RECONCILIATION"
---

# Global Review+ — ledger consolidado de hallazgos

`audit_id` no reserva numeración de secuencia: se identifica por nombre, no por índice correlativo.

## 1. Resumen ejecutivo

```text
GLOBAL_REVIEW_PLUS:
TECHNICALLY_COMPLETE

GLOBAL_REVIEW_PLUS_TECHNICAL_FOLLOWUP:
COMPLETE

OPEN_P0:
0

OPEN_P1:
0
```

Global Review+ y su follow-up técnico están cerrados. No queda ningún hallazgo P0 ni P1 abierto: los cinco P1 se resolvieron en la fase B (`CANDIDATE_FIRST_FUNCTIONAL_CLOSURE`), registrados en §10.2. Este documento es el artefacto durable del resultado: sustituye la memoria conversacional como fuente de estado, conforme a `docs/agents/jobit-global-orchestrator-v3.md` §1.

Este ledger **no autoriza implementación**. Una auditoría aceptada no autoriza trabajo (`docs/audits/README.md` §13 y `jobit-global-orchestrator-v3.md` §13).

## 2. Objetivo

Registrar de forma durable y verificable:

- el estado de Global Review+ y de su follow-up técnico;
- los hallazgos cerrados con su evidencia;
- las unidades funcionales cerradas y sus PR;
- la migración versionada asociada y su estado de aplicación por entorno;
- el ledger de hallazgos P1 que permanecen abiertos, con condición de cierre.

## 3. Baseline y entorno

```text
BASELINE:
55b9accf434477f619058a8a6d3a689ddb8532aa

BRANCH:
dev

REPOSITORY:
David-LS-Bilbao/JobIT-platform
```

El baseline corresponde al merge de PR #120 en `origin/dev`, verificado autoritativamente mediante Git de solo lectura tras `git fetch origin`.

## 4. Alcance

Consolidación documental del resultado de Global Review+, de sus dos unidades de remediación y del ledger de hallazgos abiertos.

## 5. Fuera de alcance

Implementación, cierre de P1, decisiones jurídicas, autorización de entornos, código, Prisma, migraciones, CI, Docker, infraestructura y creación de informes de unidad en `docs/sprints/`.

## 6. Método

Inspección de solo lectura del repositorio y del estado Git: lectura de specs, ADR, snapshot, contratos de agentes y migraciones versionadas; búsquedas documentales; verificación de contención de commits en `origin/dev` mediante `git merge-base --is-ancestor`, `git branch -r --contains` y `git log --merges`.

## 7. Documentos revisados

- `AGENTS.md`
- `docs/agents/jobit-operating-model-v2.md`
- `docs/agents/jobit-global-orchestrator-v3.md`
- `docs/agents/jobit-chat-director-contract-v1.md`
- `docs/agents/tdd-guidelines.md`
- `docs/agents/skills/privacy-legal-reference.md`
- `docs/audits/README.md`
- `docs/product/current-project-state.md`
- `docs/decisions/ADR-0014-session-continuity-refresh-contract.md`
- `docs/decisions/ADR-0012-staging-deploy-architecture.md`
- `docs/specs/features/session-continuity-401-recovery.md`
- `docs/specs/features/deploy-staging-readiness.md`
- `docs/product/jobit-job-radar-candidate-discovery-strategy.md`
- `docs/sprints/ops-04-job-radar-strategy-canonicalization-final-report.md`

## 8. Código y superficies revisadas

Revisión de existencia y trazabilidad, sin modificación:

- `apps/api/prisma/migrations/20260819091121_add_refresh_token_rotation_lineage/migration.sql`
- `apps/web/src/lib/api-client.ts`
- `apps/web/src/features/auth/auth-context.tsx`
- `apps/web/e2e/session-continuity.spec.ts`

## 9. Evidencias

### 9.1 Unidades cerradas

```text
SESSION_CONTINUITY_AND_401_RECOVERY:
CLOSED

PR:
#119

HOTFIX_SESSION_RECOVERY:
CLOSED

PR:
#120
```

Evidencia de contención en `origin/dev` (Git de solo lectura, posterior a `git fetch origin`):

```text
git rev-parse origin/dev
→ 55b9accf434477f619058a8a6d3a689ddb8532aa

git log --oneline --merges -n 2 origin/dev
→ 55b9acc Merge pull request #120 from David-LS-Bilbao/fix/session-refresh-fresh-token-retry
→ 41251bb Merge pull request #119 from David-LS-Bilbao/feat/session-continuity-401-recovery

git merge-base --is-ancestor 311b6d0346b54f5cf43bcc2887b67cec1ca90542 origin/dev
→ exit 0

git branch -r --contains 311b6d0346b54f5cf43bcc2887b67cec1ca90542
→ origin/dev
```

### 9.2 Migración versionada

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

Verificada por filesystem y por Git (`git ls-files`), sin ejecutar Prisma ni migraciones. La aplicación en staging o producción requiere autorización humana separada.

### 9.3 Contrato y spec

- `docs/decisions/ADR-0014-session-continuity-refresh-contract.md` — Aceptada. Registra el contrato de rotación con familia y linaje, la ventana de concurrencia legítima, el invariante de revocación de familia y la deuda aceptada.
- `docs/specs/features/session-continuity-401-recovery.md` — fuente de verdad funcional de la unidad: bootstrap de sesión, endpoint de refresh, rotación, single-flight, retry máximo, clases de error, privacidad y criterios de aceptación.

## 10. Hallazgos

### 10.1 Hallazgos cerrados

#### AUTH-03 — La sesión no sobrevive a la recarga de página

**Severidad:** P1
**Estado:** RESOLVED
**Categoría:** security
**Tipo:** FACT

```text
AUTH-03:
RESOLVED_IN_DEV
```

**Evidencia.** `ADR-0014` §Contexto documenta el estado previo (cookie `refresh_token` persistida pero sin endpoint que la consumiera). La spec `session-continuity-401-recovery.md` §"Session bootstrap / reload" define la recuperación al arranque. Migración `20260819091121_add_refresh_token_rotation_lineage` mergeada en `dev`. PR #119.

**Condición de cierre alcanzada.** Existe endpoint de refresh, la sesión se recupera en el bootstrap y el comportamiento está cubierto por spec y por la suite de continuidad de sesión.

#### B4-STATE-02 — El 401 se gestionaba de forma duplicada y sin recuperación transversal

**Severidad:** P1
**Estado:** RESOLVED
**Categoría:** architecture
**Tipo:** FACT

```text
B4-STATE-02:
RESOLVED_IN_DEV
```

**Evidencia.** `ADR-0014` §Contexto describe la gestión duplicada del `401` en diez puntos de llamada. La spec §"Recuperacion centralizada de 401", §"Single-flight" y §"Retry maximo y no recursion" define la recuperación centralizada. PR #119.

**Condición de cierre alcanzada.** La recuperación de `401` es transversal, con single-flight y retry acotado, sin lógica duplicada por feature.

#### POST119-FE-01 — Corrección de frontend posterior a PR #119

**Severidad:** técnica, tratada como follow-up de Global Review+
**Estado:** RESOLVED
**Categoría:** product
**Tipo:** FACT

```text
POST119-FE-01:
RESOLVED_IN_DEV
```

**Evidencia.** Incorporada al follow-up técnico consolidado y contenida en `origin/dev` en el baseline `55b9accf…`.

#### POST119-FE-02 — Corrección de frontend posterior a PR #119

**Severidad:** técnica, tratada como follow-up de Global Review+
**Estado:** RESOLVED
**Categoría:** product
**Tipo:** FACT

```text
POST119-FE-02:
RESOLVED_IN_DEV
```

**Evidencia.** Incorporada al follow-up técnico consolidado y contenida en `origin/dev` en el baseline `55b9accf…`.

#### HOTFIX-REV-01 — Revisión del hotfix de recuperación de sesión

**Severidad:** técnica, tratada como follow-up de Global Review+
**Estado:** RESOLVED
**Categoría:** security
**Tipo:** FACT

```text
HOTFIX-REV-01:
RESOLVED_IN_DEV
```

**Evidencia.** Resuelta por la unidad `HOTFIX_SESSION_RECOVERY` (PR #120, commit `311b6d0`, «use fresh token for session recovery»), verificada como contenida en `origin/dev`.

### 10.2 Hallazgos P1 — resueltos en la fase B

Los cinco hallazgos siguientes estaban abiertos cuando se creó este ledger y quedaron **resueltos en `dev`** por la fase B, en dos bloques: `B-CORE` (PR #123) y `B-HARDENING`. Se conserva la descripción original de cada uno como evidencia de qué se cerró y con qué.

#### S22-AUTH-06 / B4-OPS-02 — Account lifecycle

**Severidad:** P1
**Estado:** RESOLVED
**Categoría:** privacy
**Tipo:** FACT

**Descripción.** Ciclo de vida de cuenta: acceso, datos, exportación, eliminación, retención, anonimización, revocación y propagación del borrado.

**Evidencia disponible.** `docs/product/jobit-job-radar-candidate-discovery-strategy.md` lo registra como `OPEN` con la marca `LEGAL_AND_ACCOUNT_LIFECYCLE_HANDOFF`; confirmado en `docs/sprints/ops-04-job-radar-strategy-canonicalization-final-report.md`.

**Condición de cierre.** Spec aprobada que cubra exportación, eliminación, retención, anonimización, revocación y propagación del borrado, con la revisión privacy/legal aplicable.

```text
S22-AUTH-06 / B4-OPS-02:
RESOLVED_IN_DEV
```

**Resuelto en `B-CORE` (PR #123).** `DELETE /api/auth/me` y `POST /api/auth/me/export`, ambos con reverificación de contraseña. Borrado duro con propagación por las cascadas existentes, sin cambio de schema. Spec: `docs/specs/features/account-lifecycle.md`.

#### AUDIT02-LIFE-AVATAR-01 — Physical avatar cleanup

**Severidad:** P1
**Estado:** RESOLVED
**Categoría:** privacy
**Tipo:** FACT

**Descripción.** Borrado físico de avatares en disco cuando corresponda al ciclo de vida de la cuenta o del perfil.

**Evidencia disponible.** `docs/specs/features/deploy-staging-readiness.md` documenta que los avatares se almacenan en disco local (`apps/api/uploads/avatars/`) como único estado persistente del backend, lo que exige volumen persistente y backup. Sin registro previo del hallazgo con identificador durable antes de este ledger.

**Condición de cierre.** Por definir en la spec de account lifecycle o en una unidad propia; debe cubrir el borrado físico y su verificación.

```text
AUDIT02-LIFE-AVATAR-01:
RESOLVED_IN_DEV
```

**Resuelto entre `B-CORE` y `B-HARDENING`.** `deleteAvatarImage` con ruta derivada de base de datos, validada dentro de `AVATAR_DIR` e idempotente, cableada en los tres caminos que dejaban huérfanos: reemplazo por subida, sustitución o vaciado vía perfil, y borrado de cuenta. El residuo aceptado —fallo de sistema de ficheros posterior al commit— dejó de ser silencioso: `B-HARDENING` lo registra con `ORPHANED_AVATAR_AFTER_ACCOUNT_DELETE` y `ORPHANED_AVATAR_AFTER_REPLACEMENT`.

#### AUDIT03-URL-SCHEME-01 — Public URL protocol hardening

**Severidad:** P1
**Estado:** RESOLVED
**Categoría:** security
**Tipo:** FACT

**Descripción.** Endurecimiento del protocolo y del esquema de las URL públicas generadas por la plataforma.

**Evidencia disponible.** Superficie pública documentada en `docs/specs/features/landing-public-surface.md` y `docs/legal/public-surfaces-policy.md`. Sin registro previo del hallazgo con identificador durable antes de este ledger.

**Condición de cierre.** Por definir. Debe fijar el esquema esperado y su verificación en las superficies públicas afectadas.

```text
AUDIT03-URL-SCHEME-01:
RESOLVED_IN_DEV
```

**Resuelto en `B-HARDENING`.** En un entorno desplegado se exige `NEXT_PUBLIC_PUBLIC_BASE_URL` absoluta y `https`; se eliminó el fallback silencioso a `window.location.origin`, que era justo lo que permitía emitir un enlace `http`. Ante configuración ausente o inválida la interfaz no ofrece enlace ni QR en lugar de ofrecer uno degradado. La variable viaja hasta el build de Next (`Dockerfile`, compose, plantillas de entorno y `staging-env.md`).

#### AUDIT05-DEPLOY-PROXY-RATELIMIT-01 — Proxy / TRUST_PROXY_HOPS

**Severidad:** P1
**Estado:** RESOLVED
**Categoría:** operations
**Tipo:** FACT

**Descripción.** Configuración de confianza en el proxy inverso y su interacción con el rate limiting: sin una cota explícita de saltos de proxy confiables, la identificación de cliente para el rate limiting puede ser incorrecta detrás del reverse proxy.

**Evidencia disponible.** `docs/decisions/ADR-0012-staging-deploy-architecture.md` documenta el uso de Nginx Proxy Manager como reverse proxy; `docs/specs/features/api-rate-limiting.md` define el rate limiting. Sin registro previo del hallazgo con identificador durable antes de este ledger.

**Condición de cierre.** Por definir en el eje `PRE_STAGING_TECHNICAL` / `PRE_PRODUCTION_TECHNICAL`.

```text
AUDIT05-DEPLOY-PROXY-RATELIMIT-01:
RESOLVED_IN_DEV
```

**Resuelto en `B-HARDENING`.** El cableado y sus tests ya existían; lo que faltaba era el valor versionado. `.env.staging.example` declara `TRUST_PROXY_HOPS=1` (un salto de NPM) y el compose del smoke local declara `0`. El default del código sigue siendo `0` y no se ha tocado. Tests de contrato leen las plantillas reales para que no puedan regresar en silencio. La verificación contra la topología NPM real pertenece al despliegue de staging y **no se afirma aquí**.

#### AUDIT05-OPS-PROD-ERROR-LOG-01 — Safe staging/production error observability

**Severidad:** P1
**Estado:** RESOLVED
**Categoría:** operations
**Tipo:** FACT

**Descripción.** Observabilidad segura de errores en staging y producción, sin filtrar datos personales, secretos ni detalle sensible.

**Evidencia disponible.** `ADR-0014` §"Riesgos y deuda aceptada" registra la pérdida de trazabilidad forense de la causa de revocación como deuda explícita para una unidad de observabilidad de seguridad. Sin registro previo del hallazgo con identificador durable antes de este ledger.

**Condición de cierre.** Por definir en el eje `PRE_PRODUCTION_TECHNICAL`, con precheck de privacidad aplicable.

```text
AUDIT05-OPS-PROD-ERROR-LOG-01:
RESOLVED_IN_DEV
```

**Resuelto en `B-HARDENING`.** Identificador de correlación por petición (generado siempre en el servidor, nunca heredado del cliente) y log estructurado por allowlist cerrada, activo también en producción. La respuesta externa sigue siendo genérica. Se cubrieron además los dos caminos de 500 que no pasaban por el manejador final: `STORAGE_ERROR` del avatar y el fallo transaccional de refresh/logout.

## 11. Evoluciones justificadas

`JUSTIFIED_EVOLUTION`. La activación de la rotación de refresh token que `ADR-0006` había dejado como opción abierta se materializa en `ADR-0014`, que además resuelve la concurrencia que aquella dejó pendiente. No es una desviación respecto al diseño original.

## 12. Desviaciones negativas

`OBSOLETE_DOCUMENTATION`, corregida por la unidad `GLOBAL_REVIEW_PLUS_CANONICAL_RECONCILIATION`: antes de esta reconciliación, `docs/product/current-project-state.md` describía la continuidad de sesión como trabajo futuro y no autorizado, y afirmaba que no existía endpoint de refresh, que la recarga perdía la sesión y que el `401` carecía de recuperación transversal. Las tres afirmaciones habían dejado de ser ciertas tras PR #119 y PR #120.

## 13. Riesgos

- Los cinco hallazgos P1 quedaron resueltos en `dev` durante la fase B; ya no son deuda abierta.
- La migración está mergeada en `dev` pero **no aplicada** en staging ni en producción.
- La deuda aceptada de `ADR-0014` (ventana de concurrencia de 10 s, ausencia de causa persistida de compromiso, crecimiento de la tabla `RefreshToken`, `path` de cookie sin restringir) permanece vigente y documentada en esa ADR.

## 14. Priorización

La prioridad de roadmap pertenece al Orquestador (`docs/audits/README.md` §8). Este ledger no la fija.

## 15. Recomendaciones

Ninguna recomendación de implementación se emite desde este ledger. Los hallazgos abiertos se tratan cuando el Orquestador autorice una unidad para ellos.

## 16. Dependencias

Los ejes `PRE_STAGING_TECHNICAL` y `PRE_PRODUCTION_TECHNICAL` definidos en `docs/product/current-project-state.md` §PRE_DEPLOY agrupan la readiness técnica en la que se ubican varios de estos hallazgos. El eje `PRE_PRODUCTION_LEGAL` permanece `OPEN`/`PENDING` y no lo levanta este documento.

## 17. Limitaciones

- El baseline remoto no era verificable durante Plan Mode; se verificó autoritativamente al inicio de Execution Mode mediante `git fetch origin` y comprobaciones Git de solo lectura.
- `POST119-FE-01`, `POST119-FE-02` y `HOTFIX-REV-01` no tenían identificador durable en el repositorio antes de este ledger; su registro aquí es la primera constancia versionada.
- **Deuda documental observada:** no existe informe final específico en `docs/sprints/` para PR #119 ni para PR #120, pese a que `docs/agents/jobit-chat-director-contract-v1.md` §12 lo prevé. Este ledger deja constancia del hueco y **no** crea ese informe: `docs/sprints/` quedó fuera de la allowlist aprobada para esta unidad.

## 18. Preguntas abiertas

- Verificación en runtime de `TRUST_PROXY_HOPS` contra la topología real de Nginx Proxy Manager: pertenece al despliegue de staging, no a la fase B.
- Creación futura del informe de unidad en `docs/sprints/` para PR #119 y PR #120.

## 19. Estado

```text
GLOBAL_REVIEW_PLUS:
TECHNICALLY_COMPLETE

GLOBAL_REVIEW_PLUS_TECHNICAL_FOLLOWUP:
COMPLETE

OPEN_P0:
0

OPEN_P1:
0

CUSTODY:
PUBLIC_SAFE

IMPLEMENTATION_AUTHORIZED_BY_THIS_DOCUMENT:
NO

PHASE_B:
COMPLETED
```

Los cinco hallazgos P1 se cerraron en la fase B `CANDIDATE_FIRST_FUNCTIONAL_CLOSURE`: `B-CORE`
(PR #123) y `B-HARDENING`. Este ledger deja de tener deuda P0/P1 abierta.
