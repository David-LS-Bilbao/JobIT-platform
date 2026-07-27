# Codex: patrones de prompt

> La fuente canonica es [`../jobit-operating-model-v2.md`](../jobit-operating-model-v2.md), que prevalece ante cualquier contradiccion.

## Objetivo

Definir patrones de prompt para trabajar con Codex en JobIT-platform de forma controlada, repetible y revisable.

## Principios

- Una tarea por prompt.
- Contexto minimo suficiente, no todo el repositorio.
- Archivos permitidos explicitos.
- Restricciones explicitas.
- Verificaciones esperadas explicitas.
- Formato de salida fijado.
- Revision humana obligatoria al cierre.

## Estructura recomendada

Cada prompt deberia incluir:

1. Rol y contexto breve del proyecto.
2. Sprint o tarea activa.
3. Objetivo concreto del prompt.
4. Estado actual conocido.
5. Rama de trabajo.
6. Archivos permitidos a leer y a modificar.
7. Tareas concretas.
8. Restricciones (lo que no debe hacer).
9. Criterios de aceptacion.
10. Verificaciones obligatorias al final.
11. Formato esperado de salida.

## Patron: tarea documental pequena

```text
Actua como agente documental controlado para JobIT-platform.
Sprint: <id>
Objetivo: <una frase>
Rama: <docs/feat/fix/chore>
Archivos permitidos: <lista corta>
Tareas:
  1. ...
  2. ...
Restricciones:
  - No crear codigo.
  - No ampliar alcance.
Criterios de aceptacion:
  - ...
Verificaciones:
  - git status --short
  - git diff --stat
Formato de salida:
  1. Rama activa
  2. Archivos modificados
  3. Resumen
  4. Riesgos
  5. Siguiente paso
```

## Patron: revision de diff

```text
Revisa el siguiente diff sin modificar archivos.
Devuelve hallazgos por severidad, riesgos y recomendacion final.
No abras PR ni propongas merge.
```

## Patron: prompt chaining (reservado)

El flujo por defecto es Plan Mode + Execution Mode autonomo (ver la fuente canonica). El prompt chaining con revision humana entre pasos se reserva para **Nivel 3**, incidentes, bloqueos, cambios de alcance o decisiones humanas intermedias.

Cuando aplique, dividir en pasos cortos:

1. Investigacion (read-only, devuelve hallazgos).
2. Propuesta (devuelve plan, no edita).
3. Edicion controlada (archivos permitidos limitados).
4. Verificacion (git status, diff, revision documental).
5. Cierre (resumen y siguiente paso).

En ese modo reservado, cada paso espera revision humana antes de continuar.

## Antipatrones

- Prompt enorme con muchas tareas mezcladas.
- Sin archivos permitidos definidos.
- Sin restricciones explicitas.
- Sin formato de salida definido.
- Pedir a Codex que decida ampliar alcance.
- Pedir a Codex que apruebe su propio cambio.

## Cierre

El prompt debe terminar con un resumen final estructurado: rama, archivos, verificaciones, riesgos y siguiente paso. La revision y la decision final son humanas.
