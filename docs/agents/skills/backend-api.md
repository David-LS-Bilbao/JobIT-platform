# Skill neutral: Backend API

## Objetivo

Guiar el diseno documental de endpoints, contratos de API y reglas de servicio de la version candidate-first; el codigo backend se toca cuando la tarea y la spec lo autoricen.

## Cuando usarla

- Al especificar endpoints de una feature.
- Al definir entradas, salidas, errores y validaciones.
- Al revisar consistencia entre specs de modulos.
- Al evaluar contratos compartidos con frontend.

## Entradas necesarias

- Spec de la feature con flujo principal y reglas de negocio.
- Modulo afectado dentro de la modularidad candidate-first.
- Datos manejados y permisos necesarios.
- Riesgos conocidos.

## Archivos permitidos

- Specs en `docs/specs/`.
- Plantillas en `docs/agents/templates/`.
- Cuando la tarea y la spec lo autoricen: codigo backend.

## Restricciones

- No fijar framework, ORM ni libreria sin ADR aprobado.
- No definir endpoints fuera del alcance actual candidate-first.
- No omitir errores ni codigos HTTP relevantes.
- No exponer datos personales innecesarios en respuestas.
- No introducir autenticacion compleja sin spec aprobada.

## Checklist

- [ ] Endpoints listados con metodo, ruta, entrada y salida.
- [ ] Validaciones definidas para cada entrada.
- [ ] Errores y codigos esperados documentados.
- [ ] Permisos y autenticacion explicitos cuando aplican.
- [ ] Datos personales tratados con minimizacion.
- [ ] Coherencia con otras specs revisada.

## Formato esperado de salida

1. Endpoints propuestos.
2. Entradas y salidas por endpoint.
3. Validaciones y errores esperados.
4. Permisos requeridos.
5. Riesgos o dudas.
6. Siguiente paso recomendado.

## Criterio de parada

Detener la skill cuando los contratos de API quedan documentados en la spec, los errores y permisos son explicitos y la propuesta espera revision humana antes de implementar.
