# Skill neutral: Frontend UI

## Objetivo

Guiar el diseno documental de pantallas, estados, acciones y flujos de usuario para el MVP candidate-first, antes de implementar codigo frontend.

## Cuando usarla

- Al especificar pantallas de una feature.
- Al definir estados de carga, vacio, error y exito.
- Al alinear flujos de usuario con la spec.
- Al revisar consistencia visual o de interaccion entre modulos.

## Entradas necesarias

- Spec con flujo principal y criterios de aceptacion.
- Usuario afectado.
- Datos consumidos y producidos por la pantalla.
- Errores esperados.

## Archivos permitidos

- Specs en `docs/specs/`.
- Plantillas en `docs/agents/templates/`.
- En fases tecnicas posteriores: codigo frontend solo cuando la tarea lo autorice.

## Restricciones

- No fijar framework de UI ni libreria de componentes sin ADR aprobado.
- No introducir patrones visuales complejos antes de validar el flujo basico.
- No ignorar accesibilidad en formularios y navegacion principal.
- No exponer datos personales innecesarios en la interfaz.
- No anadir pantallas fuera del alcance MVP.

## Checklist

- [ ] Pantallas listadas con su proposito.
- [ ] Estados principales cubiertos: carga, vacio, error, exito.
- [ ] Acciones de usuario definidas.
- [ ] Mensajes de error claros y no tecnicos.
- [ ] Accesibilidad basica considerada.
- [ ] Coherencia con otras pantallas revisada.

## Formato esperado de salida

1. Pantallas propuestas.
2. Estados por pantalla.
3. Acciones y resultados esperados.
4. Errores y mensajes asociados.
5. Riesgos o dudas.
6. Siguiente paso recomendado.

## Criterio de parada

Detener la skill cuando las pantallas y estados estan documentados en la spec con criterios verificables. No avanzar a implementacion sin esa base ni revision humana.
