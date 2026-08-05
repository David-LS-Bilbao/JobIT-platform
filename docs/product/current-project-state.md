# Estado actual de JobIT Platform

**Fecha del snapshot:** 2026-08-05<br>
**Estado:** Activo — snapshot canónico de estado<br>
**Rama canónica:** `dev`  
**Repositorio:** `David-LS-Bilbao/JobIT-platform`

> Este documento resume el estado vigente. No sustituye Git, las specs, los ADR ni los informes. El Chat Orquestador debe verificar el repositorio antes de utilizarlo.

---

## 1. Baseline canónico de referencia

```text
Baseline canónico de cierre de OPS-03: 84ba62eff7f4a304f6fbd40ebcec3752500048b9 (merge de PR #104)
```

El HEAD operativo del repositorio debe verificarse directamente mediante Git.

Checkpoints relevantes:

```text
194684ade335b0623b2586e53adee61a5b858d28
→ merge de PR #100
→ Sprint 25 — Landing Public Surface Hardening

9509f07d768876a7dd3db2c858a5476b54e5be7b
→ merge de PR #101
→ sincronización documental posterior al Sprint 25

7c759d0206da9731a18e2a5994883ac5a2f7a77b
→ merge de PR #102
→ Sprint 26A, plan documental InfoJobs
→ merge histórico; no es el baseline vigente

9995a8dd7caee487ce2cc8ffaab6cec7627c8edc
→ merge de PR #103
→ incorporación de gobernanza (Global Orchestrator v2, Audits README, este snapshot)
→ checkpoint histórico anterior al cierre de OPS-03

84ba62eff7f4a304f6fbd40ebcec3752500048b9
→ merge de PR #104
→ cierre de OPS-03 (canonicalización de gobernanza)
→ baseline canónico de cierre de OPS-03
```

---

## 2. Estado ejecutivo

```text
Candidate-first:                        PRESERVED
Core product:                           FUNCTIONALLY COMPLETE WITH DEBT
Development/CI:                         OPERATIONAL WITH LIMITATIONS
Private staging:                        POTENTIALLY READY WITH CONFIG
Public staging:                         BLOCKED
Production with real candidates:        BLOCKED
Material scope creep:                   NOT FOUND
```

No se declara staging desplegado ni producción real activa.

---

## 3. Estado del producto

JobIT es una plataforma modular de empleo tecnológico destinada a producción y en hardening candidate-first.

Capacidades implementadas relevantes:

- registro, login y logout;
- perfil candidato;
- CV tech;
- skills, experiencia, educación, proyectos y enlaces;
- dashboard;
- portfolio público configurable;
- búsqueda y detalle de ofertas;
- ofertas guardadas;
- match explicable;
- ingesta y procedencia de fuentes externas;
- tests API, web y E2E;
- CI;
- preparación Docker y staging.

No deben utilizarse candidatos ni datos personales reales hasta cerrar los gates pendientes.

---

## 4. Sprints y bloques cerrados relevantes

### Sprint 22 — Production Readiness & Real Data Audit

- auditoría global técnica y documental;
- identificó bloqueos de seguridad, datos, privacidad y producción;
- continúa siendo una fuente de riesgos y prioridades.

### OPS-02 — Operating Model v2

- estableció Plan Mode, Execution Mode, autonomía por riesgo y gates separados;
- `docs/agents/jobit-operating-model-v2.md` es fuente canónica.

### Sprint 23 — Database & Seed Safety Gates

- resolvió los bloqueos de seguridad de base de datos y seed priorizados;
- introdujo guardas de entorno e idempotencia del seed.

### Sprint 24 — Gobierno legal de candidatos, fase documental

- fase documental cerrada;
- documentación pública sanitizada versionada;
- documentación privada mantenida fuera del repositorio;
- no implementó superficies legales;
- no cerró por sí sola los bloqueos de producción.

### Sprint 25 — Landing Public Surface Hardening

- landing endurecida en contenido, responsive, accesibilidad, navegación y metadatos;
- PR #100 mergeada;
- checkpoint: `194684ade335b0623b2586e53adee61a5b858d28`.

### Sincronización documental post-Sprint 25

- PR #101 mergeada;
- documentación del proyecto alineada con el estado posterior al Sprint 25.

### Sprint 26A — Plan documental InfoJobs

```text
Sprint 26A:
DOCUMENTATION_ONLY
CLOSED
```

- PR #102 mergeada, merge commit `7c759d0206da9731a18e2a5994883ac5a2f7a77b`;
- añadió una spec y un plan condicionado;
- no implementó API, Prisma, provider, frontend, OAuth ni llamadas reales;
- no levantó el bloqueo legal/partner;
- informe final incorporado retrospectivamente mediante OPS-03: `docs/sprints/sprint-26a-infojobs-provider-final-report.md`. No reabre el sprint técnicamente.

### PR #103 — Incorporación de gobernanza

```text
PR #103:
MERGED_DOCUMENTATION_IN_BASELINE
```

Contenido: Global Orchestrator v2 (`docs/agents/jobit-global-orchestrator-v2.md`), Audits README (`docs/audits/README.md`) y este snapshot (`docs/product/current-project-state.md`). No constituye cambio técnico.

---

## 5. Bloqueos de producción

```text
Production blockers técnicos:
- B3-ABUSE-01 — rate limiting ausente.
- B3-SUPPLY-01 — Next.js pendiente de actualización segura.
- B3-BACKUP-01 — backup/restore real no acreditado.

Gate legal principal:
- S22-PRIV-01 — PARTIALLY_REMEDIATED / LEGAL GATE OPEN.
```

### PRIV-02

```text
Estado:
OPEN_FOR_PRODUCTION
```

Existen modelos documentales y procedimientos previstos, pero falta cierre operativo y técnico antes de producción.

### Candidatos y datos reales

```text
NOT_AUTHORIZED
```

No incorporar candidatos reales hasta cerrar los gates aplicables.

### Sprint 24B

```text
DEFERRED_TO_PRE_DEPLOYMENT_GATE
```

Debe realizarse antes del despliegue real e incluir la implementación legal aprobada y la revisión especializada.

---

## 6. Deuda candidate-first prioritaria

```text
B4-STATE-02:
OPEN — tratamiento transversal de 401/sesión expirada en mutaciones.

S22-AUTH-06 / B4-OPS-02:
OPEN — ciclo de vida de cuenta, exportación y eliminación.
```

Ninguno de los dos es un production blocker técnico independiente; ambos informan prioridad y deuda, sin bloquear por sí solos un staging privado bajo las condiciones de la sección 5.

---

## 7. Integraciones de ofertas

### Arquitectura vigente

```text
fuentes externas
→ ingesta controlada backend-only
→ PostgreSQL JobIT
→ búsqueda local
→ enlace oficial externo
```

Reglas:

- no scraping;
- no live search por request del candidato;
- secretos fuera del repositorio;
- tests con fixtures;
- fuente visible;
- enlaces oficiales;
- upsert idempotente;
- cierre antes que borrado cuando proceda.

### Estado de fuentes

```text
INTERNAL:
ACTIVE

JOOBLE:
ACTIVE / CONTROLLED INGESTION

GREENHOUSE:
IMPLEMENTED / CONTROLLED PROVIDER

ADZUNA:
ENUM PRESENT / PROVIDER NOT ACTIVE

INFOJOBS:
BLOCKED_BY_PARTNER_AND_TOS
```

InfoJobs queda aparcado.

Condición de reactivación:

- autorización escrita o acuerdo partner compatible;
- ToS claros;
- decisión registrada mediante ADR;
- autorización expresa para persistencia, atribución, Saved Jobs y match explicable.

Sprint 26B de InfoJobs no está autorizado.

---

## 8. Auditoría global independiente

```text
GLOBAL_INDEPENDENT_AUDIT:
ACCEPTED_WITH_FINAL_CORRECTIONS
```

Baseline auditado: `9995a8dd7caee487ce2cc8ffaab6cec7627c8edc`. El informe consolidado fue aceptado para gobernanza y priorización con correcciones finales, pero **no está versionado todavía** dentro de `docs/audits/` (ver nota operativa en `docs/audits/README.md`). Sus hallazgos informan gobernanza y prioridades; no autorizan implementación automáticamente.

---

## 9. Orquestador Global

```text
Chat Orquestador original:
ARCHIVED_READ_ONLY

Orquestador Global v2:
VALIDATED_AND_ACTIVE
```

El proceso normativo de arranque y validación (`ORCHESTRATOR_READY_FOR_VALIDATION` → `ORCHESTRATOR_VALIDATED`, definido en `docs/agents/jobit-global-orchestrator-v2.md`) fue completado por decisión de gobierno de OPS-03. Solo existe un Orquestador Global activo. Su activación no autoriza implementación directa y no sustituye a los Chats Directores.

---

## 10. Próxima prioridad técnica

```text
NEXT_FUNCTIONAL_PRIORITY:
PENDING_ORCHESTRATOR_DECISION_AFTER_OPS_03
```

Condiciones conocidas que enmarcan la decisión, sin asignar todavía número de sprint:

- los tres production blockers técnicos (sección 5);
- el gate legal principal `S22-PRIV-01` (sección 5);
- `B4-STATE-02` (sección 6);
- ciclo de vida de cuenta `S22-AUTH-06` / `B4-OPS-02` (sección 6).

La numeración del siguiente sprint técnico debe confirmarse al validar la decisión, porque `Sprint 26A` ya se utilizó para el plan documental de InfoJobs. No crear automáticamente un "Sprint 26" distinto sin resolver la numeración.

---

## 11. Decisiones diferidas

- implementación legal pública;
- canal operativo definitivo de derechos y soporte;
- recuperación de contraseña;
- verificación de email;
- exportación y eliminación de cuenta;
- retención técnica completa;
- despliegue real;
- dominio productivo;
- integración InfoJobs;
- fuentes adicionales no autorizadas;
- monetización;
- recruiter completo;
- comunidad real;
- IA avanzada.

---

## 12. Documentos canónicos de arranque

```text
AGENTS.md
docs/agents/jobit-operating-model-v2.md
docs/agents/jobit-global-orchestrator-v2.md
docs/agents/sdd-tdd-ai-audit-workflow.md
docs/agents/tdd-guidelines.md
docs/agents/audit-quality-security-skill.md
docs/agents/git-pr-skill.md
docs/agents/pr-checklist.md
docs/agents/operating-environment.md
docs/product/current-project-state.md
docs/audits/README.md
```

Además, leer únicamente las specs, ADR, auditorías e informes vinculados a la decisión activa.

---

## 13. Condiciones para actualizar este documento

Actualizar después de:

- merge de un sprint importante;
- cambio de HEAD de `dev` relevante;
- aceptación de auditoría;
- apertura o cierre de un bloqueo;
- cambio de prioridad;
- autorización de datos reales;
- decisión de staging o producción.

No registrar cada commit menor.
