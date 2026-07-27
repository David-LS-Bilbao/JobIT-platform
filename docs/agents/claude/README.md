# Claude Code en JobIT-platform

Claude Code debe apoyarse en `CLAUDE.md` como adaptador minimo, en `AGENTS.md` como resumen operativo y en [`../jobit-operating-model-v2.md`](../jobit-operating-model-v2.md) como contrato canonico, que prevalece ante cualquier contradiccion.

## Uso recomendado

- Consultar `AGENTS.md` y la fuente canonica antes de actuar.
- Usar `CLAUDE.md` solo para notas especificas de Claude Code.
- Reutilizar prompts, plantillas, checklists y skills neutrales desde `docs/agents/`.
- Trabajar por niveles de riesgo: Plan Mode (solo lectura) y, tras `PLAN_APPROVED`, Execution Mode autonomo, sin micro-prompts por defecto. La revision final y las autorizaciones Git son humanas.
- No implementar sin spec aprobada (o brief aprobado).

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
