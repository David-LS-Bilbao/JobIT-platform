# Codex en JobIT-platform

Codex debe trabajar siguiendo `AGENTS.md` como contrato principal del repositorio.

## Uso recomendado

- Partir de prompts pequenos y concretos.
- Indicar rama, archivos permitidos, restricciones y verificaciones.
- Leer los documentos relevantes antes de editar.
- Revisar `git status --short` antes y despues de modificar.
- Entregar resumen final con cambios, verificaciones, riesgos y siguiente paso.
- Usar `docs/agents/` como biblioteca neutral de apoyo.

## Revisión de diffs

Antes de cerrar una tarea, Codex debe revisar el diff y confirmar que los cambios coinciden con el alcance autorizado.

No se asume aqui que exista un formato nativo de skills en disco para Codex. En este repositorio, las skills bajo `docs/agents/skills/` son guias documentales neutrales.

## Guias especificas para Codex

- [prompt-patterns.md](prompt-patterns.md): patrones de prompt seguros y reproducibles.
- [safe-operating-mode.md](safe-operating-mode.md): modo de operacion seguro paso a paso.
- [codex-scope-guard.md](codex-scope-guard.md): control de alcance para evitar cambios fuera de lista.
- [codex-diff-review.md](codex-diff-review.md): uso de Codex como revisor de diff, no como implementador.
- [codex-task-brief.md](codex-task-brief.md): plantilla operativa de task brief.

Estas guias son documentacion neutral. No configuran Codex ni activan permisos automaticos.
