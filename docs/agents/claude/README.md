# Claude Code en JobIT-platform

Claude Code debe apoyarse en `CLAUDE.md` como capa minima especifica y en `AGENTS.md` como fuente principal de reglas del proyecto.

## Uso recomendado

- Consultar `AGENTS.md` antes de actuar.
- Usar `CLAUDE.md` solo para notas especificas de Claude Code.
- Reutilizar prompts, plantillas, checklists y skills neutrales desde `docs/agents/`.
- Mantener cambios pequenos y esperar revision humana.
- No implementar sin spec aprobada.

## Skills nativas futuras

Mas adelante se podra evaluar una capa de skills nativas para Claude Code, si el flujo del proyecto lo necesita.

En este pre-sprint no se crea `.claude/skills/`, hooks, settings ni permisos automaticos.

## Guias especificas para Claude Code

- [skill-authoring-guide.md](skill-authoring-guide.md): como escribir skills documentales y cuando convertirlas en nativas.
- [permissions-and-hooks.md](permissions-and-hooks.md): criterios para NO crear hooks ni configuracion ejecutable hoy.
- [claude-plan-mode.md](claude-plan-mode.md): flujo plan -> aprobacion humana -> edicion.
- [claude-permission-review.md](claude-permission-review.md): revision documental de permisos antes de activar herramientas.
- [claude-research-review.md](claude-research-review.md): modo read-only para investigacion y revision documental.
- [native-skills-future-plan.md](native-skills-future-plan.md): condiciones para evaluar skills nativas en el futuro.

Estas guias son documentacion neutral. No configuran Claude Code ni activan permisos automaticos.
