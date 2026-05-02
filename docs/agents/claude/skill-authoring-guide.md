# Claude: guia de autoria de skills

## Objetivo

Definir como deben escribirse las skills documentales neutrales de JobIT, y bajo que condiciones tendria sentido convertir alguna en una skill nativa de Claude Code en el futuro.

## Skills documentales hoy

En esta fase, todas las skills viven bajo `docs/agents/skills/` como documentos neutrales. No instalan capacidades, no activan herramientas y no conceden permisos.

Cualquier skill nueva debe seguir este esquema:

- Objetivo
- Cuando usarla
- Entradas necesarias
- Archivos permitidos
- Restricciones
- Checklist
- Formato esperado de salida
- Criterio de parada

Reglas:

- Una skill resuelve un tipo de trabajo, no un caso unico.
- El tono debe ser instructivo y operativo.
- Las restricciones deben ser explicitas.
- El criterio de parada debe evitar que la skill amplie alcance silenciosamente.
- El idioma del proyecto es espanol.

## Antes de escribir una skill nueva

1. Confirmar que no existe ya una skill que cubra el caso.
2. Confirmar que el tipo de trabajo es repetible.
3. Confirmar que los archivos permitidos pueden delimitarse.
4. Confirmar que se puede revisar humanamente el resultado.

## Conversion futura a skill nativa de Claude Code

Una skill documental podra evaluarse como skill nativa solo si:

- El flujo se ha probado varias veces sin sorpresas.
- Las restricciones se pueden expresar como permisos acotados.
- El valor de automatizacion supera el coste de mantenimiento.
- Existe un ADR o spec que justifica la activacion.
- Hay un humano responsable del cambio.

Si alguna de esas condiciones no se cumple, la skill se queda como documento neutral.

## Antipatrones

- Skills que duplican otra skill con renombrado superficial.
- Skills sin criterio de parada.
- Skills que asumen permisos no concedidos.
- Skills que activan herramientas externas sin spec.
- Skills que tratan de saltarse `AGENTS.md`.

## Cierre

La autoria de una skill termina con el documento publicado en `docs/agents/skills/` y referenciado desde `docs/agents/README.md`. Cualquier paso hacia configuracion ejecutable requiere ADR aprobado y revision humana.
