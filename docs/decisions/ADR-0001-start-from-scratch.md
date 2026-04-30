# ADR-0001: Empezar desde cero

## Estado

Aprobada documentalmente.

## Contexto

JobIT-platform nace como una plataforma fullstack modular de empleo tecnologico con foco inicial candidate-first.

Existe EXPERTECH como antecedente historico del aprendizaje, ideas y contexto previo del proyecto, pero no se adopta como base tecnica directa.

## Decision

JobIT-platform empieza desde cero.

EXPERTECH queda como antecedente historico, no como fuente tecnica para copiar arquitectura, codigo, configuracion o decisiones de implementacion.

## Consecuencias

Positivas:

- Permite disenar una arquitectura limpia y modular.
- Reduce arrastre de deuda tecnica.
- Facilita aplicar SDD desde el inicio.
- Evita mezclar decisiones antiguas con el MVP candidate-first.

Costes:

- Requiere documentar e implementar cada pieza desde cero.
- No se reutiliza codigo existente de forma directa.
- Las decisiones tecnicas deben validarse paso a paso.

## Implicaciones

Cualquier referencia a EXPERTECH debe tratarse como contexto, no como obligacion tecnica. La implementacion futura de JobIT debe partir de specs y ADRs propias.
