# Flujo SDD + TDD pragmatico + AI Audit

> Documento especializado del flujo tecnico de entrega. La fuente canonica es [`jobit-operating-model-v2.md`](jobit-operating-model-v2.md), que prevalece ante cualquier contradiccion.

## Objetivo

Formalizar el flujo de trabajo de JobIT-platform para pasar de una idea a una Pull Request revisable sin perder control de alcance, calidad, seguridad ni documentacion.

Este flujo aplica a features, fixes relevantes, cambios de arquitectura y tareas documentales con impacto en metodologia o producto.

## Plan Mode y Execution Mode

El flujo se ejecuta en dos modos:

- **Plan Mode (solo lectura):** inspeccion del repositorio y entrega de un plan — estado inicial, documentos revisados, riesgos, alcance, archivos previstos, estrategia SDD/TDD, verificaciones, fases internas y decisiones pendientes. No se edita, no se crean archivos, no se ejecutan acciones Git.
- **Execution Mode (tras `PLAN_APPROVED`):** el agente completa de forma continua las fases internas del plan:

  ```text
  spec → tests RED → implementacion GREEN → refactor → verificaciones → auditoria → documentacion → informe final
  ```

  No requiere prompts entre cada fase mientras no cambie el contrato aprobado. El control paso a paso se reserva para Nivel 3, incidentes, bloqueos o cambios de alcance.

## Fases

1. Rama desde `dev`

   Crear una rama corta desde `dev` actualizado. Usar prefijos claros: `docs/*`, `feat/*`, `fix/*` o `chore/*`.

2. Spec

   Antes de implementar una feature debe existir una spec en `docs/specs/`. La spec define objetivo, usuario afectado, alcance, fuera de alcance, criterios de aceptacion, tests minimos y auditoria requerida.

3. Tests minimos / TDD

   Definir los tests minimos antes de implementar. El proyecto aplica TDD pragmatico: usar Red-Green-Refactor cuando aporte claridad y mantener tests suficientes para cubrir el comportamiento critico.

4. Implementacion asistida

   Dentro de un plan aprobado, el agente implementa de forma autonoma y continua (RED → GREEN → refactor) con alcance controlado y cambios reversibles, sin pedir permiso entre fases internas. No decide ampliar producto, arquitectura o dependencias sin aprobacion humana.

   Una tarea pequena, documental o puramente interna puede reutilizar una spec existente o el brief aprobado como fuente de verdad, indicando cual actua como tal, en lugar de crear una spec nueva.

5. Verificacion local

   Ejecutar tests, lint, build o verificaciones equivalentes disponibles para el tipo de cambio. Si el proyecto aun no tiene tooling, documentar que no aplica y usar verificaciones de Git y revision documental.

6. Auditoria quality/security

   Aplicar la auditoria documental/tecnica definida en `docs/agents/audit-quality-security-skill.md` antes de abrir PR.

7. Correcciones

   Si la auditoria o las verificaciones fallan, corregir dentro de la misma rama. No abrir PR con resultado `FAIL`.

8. Actualizacion documental

   Actualizar README, specs, ADRs, docs de sprint o documentacion afectada dentro de la misma rama. La documentacion forma parte de la entrega, no es una tarea posterior.

9. PR hacia `dev`

   Abrir PR hacia `dev` cuando el alcance este completo, las verificaciones esten documentadas y la auditoria haya pasado como `PASS` o `PASS_WITH_NOTES`.

## Reglas de bloqueo

- No implementar features sin spec en `docs/specs/`.
- No abrir PR hacia `dev` con auditoria `FAIL`.
- No fusionar sin revision humana.
- No introducir dependencias, infraestructura, CI/CD o codigo de aplicacion fuera de alcance.
- No ocultar deuda tecnica o riesgos conocidos; deben quedar documentados en la PR.
- No dejar documentacion desactualizada si el cambio altera flujo, alcance, arquitectura o comportamiento.

## Responsabilidades

### Humano

- Define prioridades y valida decisiones.
- Aprueba specs, alcance y excepciones.
- Revisa diffs, riesgos y PRs.
- Decide si una deuda tecnica es aceptable.

### Agente IA

- Ejecuta tareas acotadas y trazables.
- Respeta archivos permitidos, restricciones y criterios de aceptacion.
- Propone tests, verificaciones y documentacion necesaria.
- Informa riesgos, dudas y cambios realizados.
- Ejecuta autonomamente el plan aprobado, pero no lo redefine ni sustituye la revision humana final ni las autorizaciones Git.

## Fuera de alcance

- Crear herramientas ejecutables de auditoria.
- Crear CI/CD.
- Implementar frontend o backend.
- Instalar dependencias.
- Automatizar merges.
- Delegar aprobaciones finales a agentes IA.
