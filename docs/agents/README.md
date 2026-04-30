# Arquitectura documental de agentes

Esta carpeta define una primera biblioteca documental para trabajar con agentes IA en JobIT-platform.

`docs/agents/` no es configuracion ejecutable. No instala herramientas, no activa permisos y no define automatizaciones. Su objetivo es ordenar conceptos, flujos, checklists, plantillas, prompts reutilizables y skills neutrales.

## Capas documentales

- `AGENTS.md`: reglas transversales para cualquier agente IA que trabaje en el repositorio.
- `CLAUDE.md`: capa minima especifica para Claude Code, siempre subordinada a `AGENTS.md`.
- `docs/agents/`: biblioteca neutral reutilizable para Codex, Claude Code u otros agentes.
- `docs/agents/codex/`: notas de uso para trabajar con Codex.
- `docs/agents/claude/`: notas de uso para trabajar con Claude Code.

## Principio de uso

Los agentes deben partir de `AGENTS.md`, consultar la documentacion neutral necesaria y ejecutar tareas pequenas con archivos permitidos, criterios de aceptacion claros y revision humana.

No se debe implementar codigo sin spec aprobada.
