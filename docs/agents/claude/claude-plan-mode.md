# Claude: plan mode documental

## Objetivo

Establecer un flujo documental "primero plan, luego aprobacion humana, luego edicion" para tareas no triviales con Claude Code en JobIT-platform.

## Principio

Para cambios que tocan varios archivos, mezclan capas o introducen riesgo de scope creep, el agente debe entregar un plan revisable antes de editar.

## Cuando aplicarlo

- Tareas que afectan mas de 2 o 3 archivos.
- Cambios que tocan documentacion estructural (README, AGENTS, ADRs).
- Cambios con impacto cruzado entre modulos o capas.
- Cambios que pueden afectar gobernanza o flujo del repositorio.
- Cambios donde el alcance no esta totalmente claro.

## Flujo

1. **Plan**

   El agente lee los archivos base, entiende el alcance y devuelve un plan con:

   - Objetivo.
   - Archivos a leer.
   - Archivos a crear o modificar.
   - Cambios concretos previstos por archivo.
   - Restricciones aplicadas.
   - Verificaciones previstas.
   - Riesgos y dudas.

   En este paso no se modifica ningun archivo.

2. **Aprobacion humana**

   La persona revisa el plan, valida alcance, archivos y restricciones, y aprueba, modifica o rechaza.

3. **Edicion controlada**

   Solo despues de la aprobacion el agente edita los archivos autorizados, dentro del alcance del plan.

4. **Verificacion y auditoria**

   Tras editar:

   - `git status --short`.
   - `git diff --stat`.
   - `git diff --check`.
   - Aplicar `docs/agents/audit-quality-security-skill.md`.

5. **Resumen final**

   Entregar resumen estructurado: rama, archivos, verificaciones, auditoria, riesgos y siguiente paso.

## Reglas

- El plan no compromete edicion: si la persona lo rechaza, el agente no edita.
- Si el plan cambia durante la ejecucion, debe revalidarse antes de continuar.
- Si aparece un cambio fuera del plan, detenerse y pedir aclaracion.

## Antipatrones

- Saltarse el plan en tareas grandes.
- Editar mientras se entrega el plan.
- Tratar el plan como un resumen retroactivo de cambios ya hechos.
- Ampliar el plan sin nueva aprobacion.

## Cierre

Plan mode prioriza control y trazabilidad sobre velocidad. Una tarea entregada con plan + aprobacion + edicion es mas auditable que una tarea grande hecha de una sola vez.
