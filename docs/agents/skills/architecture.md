# Skill neutral: Architecture

## Objetivo

Guiar decisiones de arquitectura del MVP candidate-first manteniendo modularidad, trazabilidad y alcance acotado, sin fijar stack ni infraestructura sin ADR aprobado.

## Cuando usarla

- Al proponer o evaluar un cambio que afecta limites de modulos.
- Al revisar una spec con impacto transversal.
- Al detectar acoplamientos prematuros o duplicidad entre modulos.
- Al preparar un ADR nuevo o actualizar uno existente.

## Entradas necesarias

- Problema o decision a resolver.
- Modulo o limite afectado.
- Alternativas consideradas.
- Restricciones del MVP candidate-first.
- Riesgos conocidos.

## Archivos permitidos

- `docs/architecture/` solo cuando la tarea lo autorice de forma explicita.
- `docs/decisions/` para crear o actualizar ADRs autorizados.
- Specs relacionadas en `docs/specs/`.

## Restricciones

- No fijar stack, libreria o infraestructura sin ADR aprobado.
- No introducir patrones complejos antes de tener un caso real.
- No mezclar responsabilidades de modulos sin justificacion documentada.
- No ampliar alcance del MVP candidate-first sin revision humana.
- No crear codigo, configuracion ejecutable ni dependencias.

## Checklist

- [ ] Decision alineada con MVP candidate-first.
- [ ] Alternativas consideradas y descartadas con motivo.
- [ ] Limites de modulos respetados.
- [ ] Riesgos y trade-offs documentados.
- [ ] Necesidad de ADR evaluada.
- [ ] Revision humana prevista.

## Formato esperado de salida

1. Decision o propuesta.
2. Modulo o limite afectado.
3. Alternativas evaluadas.
4. Riesgos y trade-offs.
5. Impacto en documentacion (ADR, specs, README).
6. Siguiente paso recomendado.

## Criterio de parada

Detener la skill cuando la decision queda documentada, los riesgos quedan registrados y la propuesta espera revision humana. No continuar con implementacion ni con cambios fuera del alcance autorizado.
