# Claude: research y revision read-only

## Objetivo

Definir un modo de trabajo read-only para Claude Code orientado a investigacion del repositorio y revision documental, sin modificar archivos.

## Cuando aplicarlo

- Al investigar como esta organizado un area del repositorio.
- Al revisar specs, ADRs o documentacion antes de proponer cambios.
- Al evaluar consistencia entre documentos.
- Al preparar un plan antes de pedir edicion.
- Al apoyar una revision humana de un PR.

## Reglas

- No modificar archivos durante la sesion read-only.
- No crear archivos.
- No instalar dependencias.
- No ejecutar comandos destructivos.
- No proponer merge ni aprobar PRs.
- No tomar decisiones de alcance sin revision humana.

## Entradas necesarias

- Pregunta o tema concreto a investigar.
- Areas o documentos relevantes a leer.
- Criterios de evaluacion (consistencia, alcance, seguridad, claridad).

## Procedimiento

1. Confirmar rama y `git status --short`.
2. Leer los documentos relevantes.
3. Identificar contradicciones, lagunas o referencias rotas.
4. Identificar riesgos documentales o de alcance.
5. Devolver hallazgos estructurados.

## Formato esperado de salida

1. Pregunta o tema investigado.
2. Documentos leidos.
3. Hallazgos por categoria (consistencia, alcance, seguridad, claridad).
4. Contradicciones o referencias rotas detectadas.
5. Riesgos no bloqueantes.
6. Recomendaciones para una eventual edicion.
7. Siguiente paso recomendado.

## Antipatrones

- Editar "para ahorrar tiempo" durante una sesion read-only.
- Resumir sin evaluar.
- Mezclar hallazgos con conclusiones sin separar evidencia.
- Decidir alcance de cambios sin revision humana.
- Inventar referencias que no existen en el repositorio.

## Cierre

La sesion read-only termina con un informe util para una persona que decidira si abrir o no una tarea de edicion. La decision de modificar archivos siempre queda fuera de esta sesion.
