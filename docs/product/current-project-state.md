# Estado actual de JobIT Platform

**Fecha del snapshot:** 2026-07-30  
**Estado:** Draft para revisión y posterior versionado  
**Rama canónica:** `dev`  
**Repositorio:** `David-LS-Bilbao/JobIT-platform`

> Este documento resume el estado vigente. No sustituye Git, las specs, los ADR ni los informes. El Chat Orquestador debe verificar el repositorio antes de utilizarlo.

---

## 1. Baseline actual

```text
dev @ 7c759d0206da9731a18e2a5994883ac5a2f7a77b
```

Últimos checkpoints relevantes:

```text
194684ade335b0623b2586e53adee61a5b858d28
→ merge de PR #100
→ Sprint 25 — Landing Public Surface Hardening

9509f07d768876a7dd3db2c858a5476b54e5be7b
→ merge de PR #101
→ sincronización documental posterior al Sprint 25

7c759d0206da9731a18e2a5994883ac5a2f7a77b
→ merge de PR #102
→ planificación documental InfoJobs gateada
```

El baseline debe volver a comprobarse al arrancar un nuevo Orquestador.

---

## 2. Estado del producto

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

## 3. Sprints y bloques cerrados relevantes

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

- PR #102 mergeada;
- añadió una spec y un plan condicionado;
- no implementó API, Prisma, provider, frontend, OAuth ni llamadas reales;
- no levantó el bloqueo legal/partner.

---

## 4. Bloqueos de producción

### PRIV-01

```text
Estado:
OPEN_FOR_PRODUCTION
```

La fase documental está preparada, pero faltan decisiones definitivas, revisión especializada e implementación de superficies.

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

## 5. Integraciones de ofertas

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

## 6. Auditoría global independiente

```text
Estado:
STARTUP_OR_PLAN_PHASE
```

Existe o se está preparando un Chat Auditor Global independiente.

Reglas:

- solo lectura;
- no modifica código, docs, Git, roadmap ni despliegues;
- compara intención original y estado real;
- diferencia desviaciones negativas y evoluciones justificadas;
- entrega informe para revisión del Orquestador;
- sus hallazgos no cambian el roadmap automáticamente.

No consta todavía en este snapshot una auditoría global aceptada posterior al baseline actual.

---

## 7. Próxima prioridad técnica

```text
Propuesta:
Auth & Session Hardening
```

Objetivos previsibles:

- refresh operativo;
- rotación y revocación;
- restauración de sesión;
- logout y expiración coherentes;
- rate limiting;
- cookies y CORS por entorno;
- errores seguros;
- tests API, web y E2E.

### Numeración

La numeración debe confirmarse al validar el nuevo Orquestador porque `Sprint 26A` ya se utilizó para el plan documental de InfoJobs.

No crear automáticamente un “Sprint 26” distinto sin resolver la numeración.

---

## 8. Roadmap próximo propuesto

Orden lógico, pendiente de validación del Orquestador y de la auditoría:

1. migración y validación del nuevo Chat Orquestador;
2. revisión de la auditoría global independiente;
3. Auth & Session Hardening;
4. Candidate Account Lifecycle;
5. cierre de otros bloqueos de production readiness;
6. Sprint 24B antes del despliegue;
7. staging y despliegue cuando los gates lo permitan.

InfoJobs permanece fuera del roadmap activo.

---

## 9. Decisiones diferidas

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

## 10. Documentos canónicos de arranque

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

## 11. Chat Orquestador

```text
Chat Orquestador original:
ARCHIVED_READ_ONLY

Nuevo Chat Orquestador:
PENDING_STARTUP_VALIDATION
```

El nuevo chat no será canónico hasta emitir:

```text
ORCHESTRATOR_READY_FOR_VALIDATION
```

y recibir:

```text
ORCHESTRATOR_VALIDATED
```

---

## 12. Condiciones para actualizar este documento

Actualizar después de:

- merge de un sprint importante;
- cambio de HEAD de `dev` relevante;
- aceptación de auditoría;
- apertura o cierre de un bloqueo;
- cambio de prioridad;
- autorización de datos reales;
- decisión de staging o producción.

No registrar cada commit menor.
