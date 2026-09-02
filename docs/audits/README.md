# Auditorías de JobIT

**Versión:** 1.0<br>
**Fecha:** 2026-07-30  
**Estado:** Activo — política canónica de auditorías

Esta carpeta define cómo se conservan, revisan y utilizan las auditorías del proyecto.

Una auditoría aporta evidencia y recomendaciones. No autoriza código, no redefine el roadmap y no sustituye una spec, un ADR, una revisión legal ni la decisión del Chat Orquestador.

---

## 1. Objetivo

Mantener auditorías:

- independientes;
- trazables;
- reproducibles;
- separadas de implementación;
- clasificadas por estado;
- útiles para el roadmap;
- seguras para un repositorio público.

---

## 2. Estructura

```text
docs/audits/
├── README.md
├── global/
├── production-readiness/
├── security/
├── privacy/
├── architecture/
├── accessibility/
├── data/
├── integrations/
└── operations/
```

Crear subcarpetas solo cuando exista una auditoría real. No añadir carpetas vacías sin necesidad.

---

## 3. Roles

### Chat Auditor independiente

Puede:

- leer código y documentación;
- inspeccionar estado Git;
- ejecutar verificaciones de solo lectura;
- comparar intención y estado real;
- identificar hallazgos;
- proponer prioridades;
- entregar evidencias.

No puede:

- modificar código;
- modificar documentación;
- crear ramas;
- hacer commit, push, PR o merge;
- modificar roadmap;
- autorizar implementación;
- desplegar;
- usar secretos;
- consultar datos personales reales;
- declarar cumplimiento legal.

### Chat Orquestador

- revisa el informe;
- contrasta evidencia;
- clasifica el resultado;
- decide impacto en roadmap;
- crea un sprint cuando proceda;
- mantiene los bloqueos globales.

### Chat Director

- recibe un mandato de remediación;
- no reinterpreta el informe más allá de su sprint.

---

## 4. Estados

Cada auditoría debe declarar uno:

```text
DRAFT
READY_FOR_ORCHESTRATOR_REVIEW
ACCEPTED
ACCEPTED_WITH_ADJUSTMENTS
REJECTED
SUPERSEDED
```

### DRAFT

Trabajo incompleto o pendiente de revisión del propio auditor.

### READY_FOR_ORCHESTRATOR_REVIEW

Informe completo, sin decisión global.

### ACCEPTED

El Orquestador acepta alcance, evidencia y conclusiones.

### ACCEPTED_WITH_ADJUSTMENTS

Se aceptan hallazgos con cambios de prioridad, clasificación o interpretación.

### REJECTED

Evidencia insuficiente, alcance incorrecto o conclusiones no sostenidas.

### SUPERSEDED

Existe una auditoría posterior o el baseline ya no es representativo.

---

## 5. Metadatos obligatorios

Cabecera recomendada:

```yaml
---
audit_id: AUDIT-YYYY-NNN
title: "..."
category: security
status: READY_FOR_ORCHESTRATOR_REVIEW
baseline: "<commit SHA>"
branch: "dev"
date_started: "YYYY-MM-DD"
date_completed: "YYYY-MM-DD"
auditor_role: "independent-read-only"
scope:
  - "..."
out_of_scope:
  - "..."
orchestrator_review:
  status: "pending"
  date: null
  decision_ref: null
---
```

No incluir nombres personales, secretos, rutas privadas no necesarias ni datos de producción.

---

## 6. Formato de auditoría

```markdown
# Título

## 1. Resumen ejecutivo
## 2. Objetivo
## 3. Baseline y entorno
## 4. Alcance
## 5. Fuera de alcance
## 6. Método
## 7. Documentos revisados
## 8. Código y superficies revisadas
## 9. Evidencias
## 10. Hallazgos
## 11. Evoluciones justificadas
## 12. Desviaciones negativas
## 13. Riesgos
## 14. Priorización
## 15. Recomendaciones
## 16. Dependencias
## 17. Limitaciones
## 18. Preguntas abiertas
## 19. Estado
```

---

## 7. Formato de hallazgo

```markdown
### FINDING-ID — Título

**Severidad:** P0 | P1 | P2 | P3  
**Estado:** OPEN | ACCEPTED_RISK | RESOLVED | NOT_REPRODUCED | SUPERSEDED  
**Categoría:** security | privacy | architecture | accessibility | data | operations | product  
**Tipo:** FACT | INFERENCE | RECOMMENDATION | QUESTION

**Descripción**

...

**Evidencia**

- archivo:línea;
- comando y resultado;
- captura;
- contrato o spec;
- comportamiento reproducido.

**Impacto**

...

**Recomendación**

...

**Dependencias**

...

**Condición de cierre**

...
```

Un hallazgo no debe mezclar hechos e inferencias sin etiquetarlos.

---

## 8. Severidad

### P0

Bloquea producción, puede provocar pérdida o exposición grave de datos, acceso no autorizado o incumplimiento crítico.

### P1

Riesgo alto, defecto importante o deuda que debe tratarse antes de un hito próximo.

### P2

Deuda media con impacto controlado.

### P3

Mejora menor o mantenimiento.

La prioridad final de roadmap pertenece al Orquestador.

---

## 9. Evolución frente a desviación

La auditoría debe comparar:

```text
intención original
vs.
documentación vigente
vs.
código real
vs.
comportamiento observado
```

Clasificaciones:

```text
ALIGNED
JUSTIFIED_EVOLUTION
NEGATIVE_DRIFT
OBSOLETE_DOCUMENTATION
UNVERIFIED
```

No toda diferencia respecto al diseño original es una regresión. Puede ser una evolución aprobada.

---

## 10. Evidencia

Evidencia fuerte:

- código actual;
- tests;
- ejecución reproducible;
- schema;
- migraciones;
- configuración;
- PR mergeada;
- CI;
- spec o ADR vigente.

Evidencia débil:

- memoria del chat;
- comentario sin verificar;
- inferencia no reproducida;
- documento histórico superado;
- medición con herramienta incompatible.

La auditoría debe declarar limitaciones.

---

## 11. Custodia

Antes de versionar una auditoría en un repositorio público, revisar:

- datos personales;
- secretos;
- credenciales;
- direcciones;
- correos privados;
- rutas privadas;
- detalles de incidentes;
- arquitectura sensible innecesaria;
- proveedores no confirmados;
- afirmaciones de cumplimiento;
- decisiones legales no revisadas.

Clasificación:

```text
PUBLIC_SAFE
PUBLIC_AFTER_SANITIZATION
PRIVATE_ONLY
```

Los informes `PRIVATE_ONLY` no se suben al repositorio público.

---

## 12. Flujo

```text
Mandato de auditoría
→ Plan Mode de solo lectura
→ AUDIT_PLAN_READY
→ aprobación
→ auditoría autónoma de solo lectura
→ READY_FOR_ORCHESTRATOR_REVIEW
→ revisión del Orquestador
→ ACCEPTED / ACCEPTED_WITH_ADJUSTMENTS / REJECTED
→ decisión de roadmap
```

El auditor no realiza la remediación.

---

## 13. Versionado del informe

El Chat Auditor puede generar el contenido, pero no debe modificar Git.

Para versionar una auditoría pública:

1. el Orquestador la acepta;
2. se revisa custodia;
3. un sprint documental o un operador autorizado crea el archivo;
4. se aplican Git gates;
5. se mergea a `dev`.

**Nota adicional.** Una corrección final sobre una auditoría ya revisada se integra
directamente en el informe consolidado, sin crear un documento separado. La deduplicación de
hallazgos entre bloques o entre auditorías pertenece a la revisión del Orquestador, no al
propio auditor. Un informe aceptado fuera de este repositorio (`ACCEPTED` o
`ACCEPTED_WITH_ADJUSTMENTS`) sigue este mismo flujo de versionado (pasos 1-5) antes de
considerarse publicado en `docs/audits/`.

---

## 14. Índice recomendado

Cuando existan varias auditorías, mantener una tabla:

| Audit ID | Categoría | Baseline | Estado | Fecha | Decisión |
|---|---|---|---|---|---|
| [GLOBAL-REVIEW-PLUS](global/global-review-plus-findings-ledger.md) | global | `55b9acc` | ACCEPTED_WITH_ADJUSTMENTS | 2026-09-02 | `GLOBAL_REVIEW_PLUS_CANONICAL_RECONCILIATION` |

No añadir auditorías todavía inexistentes.

**Nota operativa.** Deben distinguirse dos resultados globales distintos:

- **Evidencia histórica previa.** El flujo descrito en este documento fue ejercitado mediante una
  auditoría global independiente sobre el baseline `9995a8d`, aceptada para gobernanza y
  priorización con correcciones finales
  (`GLOBAL_INDEPENDENT_AUDIT: ACCEPTED_WITH_FINAL_CORRECTIONS`). Ese informe consolidado sigue sin
  estar versionado dentro de `docs/audits/` y se conserva únicamente como evidencia histórica.
- **Global Review+ ahora versionado.** El resultado de Global Review+ y de su follow-up técnico sí
  está versionado en [`global/global-review-plus-findings-ledger.md`](global/global-review-plus-findings-ledger.md),
  sobre el baseline `55b9acc`, con el ledger de hallazgos cerrados y de los que permanecen
  abiertos. Ese archivo es el ledger; este README sigue siendo únicamente la política e índice.

---

## 15. Relación con el estado global

Una auditoría aceptada que cambie:

- bloqueos;
- prioridad;
- baseline relevante;
- preparación para producción;
- integraciones;
- deuda P0/P1;

debe reflejarse en `docs/product/current-project-state.md`.

---

## 16. Criterios de calidad

Una auditoría está lista cuando:

- tiene baseline;
- delimita alcance;
- explica método;
- aporta evidencia;
- separa hechos e inferencias;
- identifica limitaciones;
- no contiene secretos;
- no usa datos reales;
- no modifica el sistema;
- propone condiciones de cierre;
- termina en `READY_FOR_ORCHESTRATOR_REVIEW`.
