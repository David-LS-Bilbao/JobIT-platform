# ADR-0004: Flujo SDD + TDD pragmatico + AI Audit + PR

## Estado

Aceptada.

## Fecha aproximada

Mayo de 2026.

## Contexto

JobIT-platform esta en fase documental inicial y el MVP sera candidate-first. El proyecto usara agentes IA como apoyo para documentar, analizar, implementar tareas futuras y revisar cambios, pero necesita un flujo controlado para evitar scope creep, deuda invisible y cambios sin trazabilidad.

Ya existe una base SDD y reglas iniciales para agentes, documentadas en `ADR-0003-sdd-and-agent-workflow.md`. Este ADR formaliza la evolucion del flujo incorporando TDD pragmatico, auditoria de calidad/seguridad, Pull Requests hacia `dev` y Docs as Code.

## Decision

Adoptar como flujo oficial:

```text
Rama desde dev -> Spec -> Tests minimos/TDD -> Implementacion asistida -> Verificacion local -> Auditoria quality/security -> Correcciones -> Documentacion -> PR hacia dev
```

Reglas principales:

- Toda feature requiere spec previa en `docs/specs/`.
- Cada feature define tests minimos antes de implementarse.
- Se aplica TDD pragmatico, no dogmatico.
- Los agentes IA trabajan con prompts pequenos y controlados.
- Antes de PR se ejecuta auditoria documental/tecnica de calidad y seguridad.
- No se abre PR si la auditoria devuelve `FAIL`.
- La documentacion afectada se actualiza dentro de la misma rama.
- La IA actua como copiloto; la revision y validacion final son humanas.

## Consecuencias positivas

- Mayor trazabilidad entre decision, spec, implementacion y PR.
- Menor riesgo de scope creep.
- Mejor calidad de entregas pequenas y revisables.
- Seguridad y documentacion tratadas como parte del flujo normal.
- Uso de IA con control humano explicito.

## Riesgos

- Puede aumentar el coste documental de cambios pequenos.
- Puede ralentizar tareas urgentes si el flujo se aplica sin criterio.
- Requiere disciplina para mantener specs y docs actualizadas.
- La auditoria documental no sustituye herramientas reales de seguridad cuando el proyecto avance.

## Alternativas consideradas

- Implementar directamente desde issues sin spec: descartado por baja trazabilidad.
- Usar TDD estricto para todo: descartado por riesgo de rigidez y coste innecesario.
- Delegar auditoria solo a CI/CD futuro: descartado porque aun no existe tooling y la revision documental ya aporta valor.
- Permitir PRs con auditoria fallida: descartado porque debilita el gate de calidad y seguridad.
