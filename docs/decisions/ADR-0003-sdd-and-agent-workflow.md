# ADR-0003: SDD y flujo con agentes IA

## Estado

Aprobada documentalmente.

## Contexto

JobIT-platform usara agentes IA para acelerar documentacion, analisis, revisiones y tareas futuras. Para mantener control de alcance, seguridad y calidad, el trabajo debe estar guiado por specs y revision humana.

El repositorio ya cuenta con `AGENTS.md`, `CLAUDE.md` y documentacion neutral en `docs/agents/`.

Esta decision define la base SDD y el uso controlado de agentes. La evolucion metodologica con TDD pragmatico, auditoria quality/security y PR queda formalizada despues en `ADR-0004-sdd-tdd-ai-audit-workflow.md`.

## Decision

El proyecto usara SDD, Specification-Driven Development, y agentes IA guiados por:

- Specs.
- Task briefs.
- Checklists.
- Prompts reutilizables.
- Revision de diffs.
- Revision humana antes de ampliar alcance o fusionar.

El flujo base sera:

```text
SPEC -> PLAN -> TASK BRIEF -> EDIT/BUILD -> REVIEW -> MERGE
```

## Consecuencias

Positivas:

- Reduce scope creep.
- Mejora trazabilidad de decisiones.
- Facilita revisiones humanas.
- Mantiene cambios pequenos y reversibles.
- Permite usar agentes IA sin delegar decisiones criticas sin control.

Costes:

- Requiere escribir specs antes de implementar.
- Puede ralentizar cambios pequenos si no se calibra bien.
- Obliga a mantener documentacion actualizada.

## Reglas operativas

- No implementar codigo sin spec aprobada.
- No ampliar alcance sin aprobacion humana.
- No crear configuracion ejecutable sin task brief claro.
- Revisar `git status --short` y diff antes de cerrar tareas.
- Entregar siempre resumen final con verificaciones, riesgos y siguiente paso.
