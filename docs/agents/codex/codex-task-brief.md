# Codex: plantilla de task brief

## Objetivo

Comprimir una tarea en un prompt seguro y reproducible para Codex. El task brief reduce ambiguedad, fija alcance y deja la verificacion explicita.

## Cuando usarla

- Al iniciar una tarea documental o tecnica acotada.
- Al delegar parte de un sprint a Codex.
- Al convertir una spec aprobada en un trabajo ejecutable.

## Estructura

```text
Sprint: <id del sprint>
Tarea: <nombre corto>
Objetivo: <una frase verificable>
Contexto: <minimo necesario, sin volcar el repositorio>
Estado actual conocido: <hechos relevantes, no especulacion>
Rama de trabajo: <docs/feat/fix/chore>
Archivos permitidos a leer:
  - ...
Archivos permitidos a crear o modificar:
  - ...
Tareas concretas:
  1. ...
  2. ...
Restricciones:
  - No crear codigo si no se autoriza.
  - No instalar dependencias.
  - No introducir secretos.
  - No tocar archivos fuera de alcance.
Criterios de aceptacion:
  - ...
Verificaciones obligatorias:
  - git status --short
  - git diff --stat
  - git diff --check
Auditoria final:
  - Aplicar docs/agents/audit-quality-security-skill.md
Formato esperado de salida:
  1. Rama activa
  2. Archivos creados
  3. Archivos modificados
  4. Resumen por archivo
  5. Verificaciones ejecutadas
  6. Resultado de auditoria
  7. Riesgos o dudas
  8. Siguiente paso recomendado
```

## Reglas de uso

- Una tarea por brief.
- Si la tarea es grande, dividirla en briefs encadenados.
- Si falta informacion, pedirla antes de empezar.
- Si la rama o el working tree no coinciden, detenerse.

## Antipatrones

- Briefs sin archivos permitidos.
- Briefs sin restricciones.
- Briefs sin criterios de aceptacion.
- Briefs sin formato de salida.
- Briefs que delegan decisiones criticas al modelo.

## Cierre

Un task brief bien hecho permite que la tarea sea reproducible, auditable y revisable por una persona en pocos minutos. Si no cumple eso, debe reescribirse antes de ejecutarse.
