# Codex: modo de operacion seguro

> La fuente canonica es [`../jobit-operating-model-v2.md`](../jobit-operating-model-v2.md), que prevalece ante cualquier contradiccion.

## Objetivo

Definir el modo de trabajo seguro para Codex en JobIT-platform: autonomia controlada por nivel de riesgo, alcance controlado, verificaciones explicitas y revision humana en los limites. Tras `PLAN_APPROVED`, Codex ejecuta las fases internas del plan de forma continua; el control paso a paso se reserva para Nivel 3, incidentes, bloqueos o cambios de alcance.

## Reglas base

- Codex sigue siempre `AGENTS.md` como contrato principal.
- No se trabaja directamente sobre `main` ni sobre `dev`.
- Cada tarea debe pertenecer a una rama corta con prefijo claro.
- Cada tarea debe tener archivos permitidos definidos.
- Cada tarea debe tener restricciones explicitas.
- Cada tarea debe tener criterios de aceptacion verificables.

## Antes de modificar

1. Confirmar rama activa.
2. Confirmar que no es `main` ni `dev`.
3. Ejecutar `git status --short` y revisar el resultado.
4. Leer los documentos base relevantes para la tarea.
5. Identificar archivos afectados.
6. Avisar si se detectan cambios previos no relacionados.

## Durante la tarea

- Ejecutar el plan aprobado de principio a fin, con cambios reversibles, sin pedir permiso entre fases internas mientras no cambie el contrato aprobado.
- No mezclar documentacion, codigo e infraestructura en un mismo cambio salvo aprobacion.
- No instalar dependencias.
- No introducir secretos, tokens ni credenciales.
- No tocar archivos fuera del alcance autorizado.

## Antes de cerrar

- Revisar diff completo.
- Ejecutar verificaciones acordadas para el alcance.
- Aplicar `docs/agents/audit-quality-security-skill.md`.
- Si la auditoria devuelve `FAIL`, corregir y repetir antes de cerrar.

## Modo solo lectura

Codex puede operar en modo solo lectura para investigacion, revision de diffs o auditoria documental. En este modo:

- No se modifica ningun archivo.
- Se devuelven hallazgos, riesgos y recomendacion.
- La decision final queda en revision humana.

## Escalado

Codex debe detenerse y pedir aclaracion cuando:

- La rama activa no coincide con la solicitada.
- El working tree no esta limpio sin justificacion.
- Aparece un cambio fuera de alcance.
- Se detecta un riesgo de seguridad no documentado.
- Faltan criterios de aceptacion o archivos permitidos.

## Cierre

Cada tarea cerrada debe entregar resumen final con: rama, archivos, verificaciones, auditoria, riesgos y siguiente paso recomendado.
