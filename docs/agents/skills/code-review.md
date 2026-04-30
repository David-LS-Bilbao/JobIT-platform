# Skill neutral: Code Review

## Objetivo

Revisar cambios con foco en riesgos, alcance, seguridad, regresiones y verificaciones.

## Cuando usarla

- Antes de merge.
- Al revisar un PR.
- Al validar un diff generado por un agente.

## Entradas necesarias

- Diff o PR a revisar.
- Spec o task brief asociado.
- Criterios de aceptacion.
- Verificaciones ejecutadas.

## Archivos permitidos

Por defecto, ninguno. La revision debe ser de solo lectura salvo que la tarea autorice correcciones.

## Restricciones

- Priorizar hallazgos concretos sobre resumen general.
- No aprobar cambios fuera de alcance.
- No ignorar riesgos de seguridad.
- No modificar archivos sin permiso.

## Checklist

- [ ] El diff coincide con el alcance.
- [ ] No hay secretos ni configuracion sensible.
- [ ] No hay cambios tecnicos no autorizados.
- [ ] Los criterios de aceptacion estan cubiertos.
- [ ] Las verificaciones son suficientes.

## Formato esperado de salida

1. Hallazgos por severidad.
2. Riesgos o dudas.
3. Verificaciones revisadas.
4. Resumen breve.
5. Recomendacion final.
