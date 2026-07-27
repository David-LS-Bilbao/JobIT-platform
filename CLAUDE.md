# CLAUDE.md

Guia minima para Claude Code en JobIT-platform.

Claude Code debe seguir siempre las reglas de [AGENTS.md](AGENTS.md). Este archivo es un adaptador documental breve y no duplica el contrato completo. El contrato operativo canonico es [JobIT Operating Model v2](docs/agents/jobit-operating-model-v2.md).

## Notas especificas

- Usar `AGENTS.md` como resumen operativo y punto de entrada, subordinado a la fuente canonica [`docs/agents/jobit-operating-model-v2.md`](docs/agents/jobit-operating-model-v2.md).
- Consultar `docs/agents/` como biblioteca neutral de prompts, plantillas, checklists y skills documentales (no es configuracion ejecutable).
- Plan Mode es solo lectura: inspeccionar y proponer un plan, sin editar ni ejecutar acciones Git.
- Tras `PLAN_APPROVED`, Execution Mode puede completarse de forma autonoma, sin revisiones intermedias, mientras no cambie el contrato aprobado.
- No crear `.claude/skills/`, hooks, settings ni permisos automaticos sin una tarea explicita.
- No implementar codigo sin spec aprobada (o brief aprobado) y sin revision humana; las acciones Git requieren autorizacion separada.
