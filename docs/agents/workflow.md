# Workflow SDD para agentes

> **Nota:** Este documento describe el flujo SDD base e historico del proyecto. El flujo operativo vigente y completo, que incorpora TDD pragmatico, AI Audit y PR, esta en `docs/agents/sdd-tdd-ai-audit-workflow.md`.

JobIT-platform sigue un flujo SDD, Specification-Driven Development:

```text
SPEC -> PLAN -> TASK BRIEF -> EDIT/BUILD -> REVIEW -> MERGE
```

## SPEC

Definir el problema, objetivo, alcance, fuera de alcance, criterios de aceptacion, riesgos y verificaciones.

No se implementa sin spec aprobada.

## PLAN

Dividir la spec en pasos pequenos, reversibles y verificables. Identificar archivos permitidos y restricciones.

## TASK BRIEF

Convertir el plan en una tarea concreta para el agente. Debe indicar rama, contexto, archivos permitidos, entregables y formato de salida.

## EDIT/BUILD

Ejecutar solo los cambios autorizados. En fases documentales, esto significa editar documentacion y no crear codigo ni configuracion ejecutable.

## REVIEW

Revisar diff, criterios de aceptacion, riesgos, seguridad y estado del working tree. La revision humana es obligatoria antes de ampliar alcance o fusionar.

## MERGE

Fusionar solo despues de pasar verificaciones, resolver dudas y confirmar que el cambio respeta la spec aprobada.
