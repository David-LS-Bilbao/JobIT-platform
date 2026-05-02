# Documentacion de agentes IA

Esta carpeta define la biblioteca documental neutral para trabajar con agentes IA en JobIT-platform.

`docs/agents/` no es configuracion ejecutable. No instala herramientas, no activa permisos y no define automatizaciones. Su objetivo es ordenar conceptos, flujos, checklists, plantillas, prompts reutilizables y skills neutrales.

## Capas documentales

- `AGENTS.md`: contrato corto y transversal para cualquier agente IA que trabaje en el repositorio. Define reglas, limites, seguridad, flujo minimo antes de modificar y resumen final obligatorio.
- `CLAUDE.md`: capa minima especifica para Claude Code. Siempre queda subordinada a `AGENTS.md` y no debe duplicar la gobernanza general.
- `docs/agents/`: biblioteca neutral reutilizable por Codex, Claude Code u otros agentes. Contiene guias, flujos, checklists, prompts y plantillas.
- `docs/agents/skills/`: skills documentales neutrales. Describen como ejecutar tipos de trabajo, pero no son skills instaladas ni configuracion ejecutable.
- `docs/agents/checklists/`: checklists para cierre, pre-merge, seguridad u otras revisiones.
- `docs/agents/templates/`: plantillas documentales reutilizables.
- `docs/agents/prompts/`: prompts reutilizables para tareas frecuentes.
- `docs/agents/codex/`: notas de uso para trabajar con Codex.
- `docs/agents/claude/`: notas de uso para trabajar con Claude Code.

## Skills y configuracion ejecutable

Aunque algunos documentos usen la palabra `skill`, por ahora son documentos de trabajo neutrales. No activan capacidades, no instalan herramientas y no conceden permisos.

No se debe crear `.claude/skills/`, `.claude/settings.json`, hooks ni configuracion ejecutable salvo tarea explicita y aprobada.

## Documentos principales

- `sdd-tdd-ai-audit-workflow.md`: flujo oficial SDD + TDD pragmatico + AI Audit + PR.
- `tdd-guidelines.md`: guia de TDD pragmatico.
- `audit-quality-security-skill.md`: checklist neutral de auditoria quality/security.
- `pr-checklist.md`: plantilla y checklist de Pull Request.
- `workflow.md`: flujo SDD base historico.
- `concepts.md`: glosario conceptual para agentes.

## Principio de uso

Los agentes deben partir de `AGENTS.md`, consultar la documentacion neutral necesaria y ejecutar tareas pequenas con archivos permitidos, criterios de aceptacion claros y revision humana.

No se debe implementar codigo sin spec aprobada.
