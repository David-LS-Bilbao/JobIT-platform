# Skill neutral: Testing

## Objetivo

Definir o revisar tests minimos para una feature aplicando TDD pragmatico, sin perseguir cobertura superficial y priorizando comportamiento critico.

## Cuando usarla

- Antes de implementar una feature.
- Al cerrar una spec con tests minimos definidos.
- Al revisar un PR que incorpora o modifica tests.
- Al investigar un bug reproducible.

## Entradas necesarias

- Spec con criterios de aceptacion claros.
- Comportamiento critico identificado.
- Reglas de negocio, validaciones y errores relevantes.
- Riesgo funcional estimado.

## Archivos permitidos

- Specs en `docs/specs/`.
- `docs/agents/tdd-guidelines.md` como referencia de criterio.
- Cuando la tarea y la spec lo autoricen: archivos de tests.

## Restricciones

- No usar coverage como sustituto de calidad real.
- No escribir tests fragiles que validan detalles internos.
- No omitir errores y casos limite criticos.
- No introducir tooling ni dependencias sin aprobacion.
- No marcar como cubierto un comportamiento que no lo esta.

## Checklist

- [ ] Tests minimos definidos en la spec.
- [ ] Comportamiento critico cubierto.
- [ ] Errores y casos limite contemplados.
- [ ] Reglas de seguridad o privacidad protegidas con tests cuando aplica.
- [ ] Si no hay tooling aun, justificado y documentado en la spec.
- [ ] TDD pragmatico aplicado, no dogmatico.

## Formato esperado de salida

1. Tests minimos propuestos.
2. Casos criticos cubiertos.
3. Casos no cubiertos y motivo.
4. Riesgos pendientes.
5. Verificaciones planificadas o ejecutadas.
6. Siguiente paso recomendado.

## Criterio de parada

Detener la skill cuando la spec contiene tests minimos verificables y se documenta claramente lo que queda fuera. No avanzar a implementacion sin esa base.
