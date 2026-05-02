# AGENTS.md

Guia operativa para agentes IA que trabajen en JobIT-platform.

## Rol de los agentes

Los agentes IA actuan como asistentes tecnicos controlados. Su funcion es ayudar a documentar, analizar, planificar, implementar tareas autorizadas y revisar cambios cuando exista una especificacion clara.

En la fase documental inicial el rol esta limitado a crear y ordenar documentacion. No se debe implementar codigo ni configurar infraestructura.

## Reglas generales

- Responder siempre en espanol.
- Mantener un tono claro, profesional y practico.
- Priorizar cambios pequenos, seguros y reversibles.
- Trabajar en pasos pequenos, esperar revision humana y no ampliar alcance sin aprobacion.
- Respetar el alcance indicado por la tarea o sprint activo.
- No ampliar producto, arquitectura o tecnologia sin permiso explicito.
- Documentar decisiones relevantes cuando afecten al alcance futuro.
- Separar documentacion, codigo e infraestructura en cambios distintos.
- Usar la IA como copiloto, no como piloto automatico: la revision y validacion final son humanas.

## Flujo obligatorio antes de modificar

Antes de tocar archivos, el agente debe:

1. Confirmar la rama activa.
2. Confirmar que no esta trabajando directamente en `main` ni en `dev`.
3. Revisar `git status --short`.
4. Identificar archivos afectados.
5. Explicar brevemente que va a modificar.
6. Avisar si detecta cambios previos no relacionados.

Si la rama no coincide con la solicitada o el working tree no esta limpio, debe detenerse y diagnosticar antes de editar.

## Formato de prompts recomendado

Cada tarea para agentes deberia ser pequena, controlada y verificable. Para trabajos largos se debe usar prompt chaining: dividir el trabajo en pasos acotados, revisar el resultado de cada paso y continuar solo si el alcance sigue claro.

Cada tarea deberia incluir:

- Objetivo.
- Contexto.
- Rama de trabajo.
- Archivos permitidos.
- Tareas concretas.
- Restricciones.
- Criterios de aceptacion.
- Verificaciones esperadas.
- Formato de salida.

La biblioteca neutral de apoyo para prompts, plantillas, checklists y skills documentales esta en `docs/agents/`. Esa carpeta no es configuracion ejecutable.

## Flujo SDD + TDD + AI Audit

El flujo oficial del proyecto es:

```text
Rama desde dev -> Spec -> Tests minimos/TDD -> Implementacion asistida -> Verificacion local -> Auditoria quality/security -> Correcciones -> Documentacion -> PR hacia dev
```

Reglas obligatorias:

- Toda feature debe tener una spec previa en `docs/specs/`.
- La spec debe incluir tests minimos antes de implementar.
- Se aplica TDD pragmatico, no dogmatico.
- La implementacion asistida por IA debe respetar prompts pequenos, alcance autorizado y cambios reversibles.
- Al terminar una tarea se debe ejecutar una auditoria documental/tecnica de calidad y seguridad.
- Si la auditoria devuelve `FAIL`, se corrige antes de abrir PR.
- Si la auditoria devuelve `PASS` o `PASS_WITH_NOTES`, se puede preparar PR hacia `dev`.
- La documentacion afectada debe actualizarse dentro de la misma rama antes de abrir PR.

Documentos de referencia:

- `docs/agents/sdd-tdd-ai-audit-workflow.md`.
- `docs/agents/tdd-guidelines.md`.
- `docs/agents/audit-quality-security-skill.md`.
- `docs/agents/pr-checklist.md`.
- `docs/specs/spec-template.md`.

## Restricciones de seguridad

- No ejecutar cambios destructivos sin aprobacion explicita.
- No borrar archivos existentes salvo que la tarea lo pida claramente.
- No instalar dependencias sin permiso.
- No crear configuracion tecnica fuera de alcance.
- No introducir secretos, credenciales ni tokens en el repositorio.
- No modificar workflows, despliegues o infraestructura sin una especificacion aprobada.
- En tareas de servidor o produccion, diagnosticar primero y aplicar cambios solo con autorizacion clara.

## Control de alcance

Los agentes no pueden ampliar el alcance sin permiso.

Queda prohibido introducir por iniciativa propia:

- Frontend o backend.
- Base de datos.
- Docker o compose.
- CI/CD.
- Autenticacion.
- IA avanzada.
- Modulo recruiter completo.
- Monetizacion.
- Comunidad real.
- Aplicacion movil.

## Prohibicion de implementar sin spec

No se debe implementar funcionalidad si no existe una especificacion previa en `docs/specs/` con:

- Problema a resolver.
- Alcance.
- Fuera de alcance.
- Criterios de aceptacion.
- Tests minimos.
- Riesgos conocidos.
- Verificaciones esperadas.
- Auditoria requerida.

Si falta la especificacion, el agente debe proponer o crear primero el documento correspondiente.

## TDD pragmatico

Cada feature debe definir tests minimos antes de implementar.

El agente debe aplicar Red-Green-Refactor cuando aporte claridad, especialmente en reglas de negocio, validaciones, seguridad, permisos, errores o bugs reproducibles. Para cambios de bajo riesgo o fases documentales, basta con dejar tests minimos definidos y justificar que no se ejecutan si aun no existe tooling.

No se debe perseguir 100% coverage superficial. La prioridad es cubrir comportamiento critico, errores relevantes y reglas que protegen datos o experiencia de usuario.

## Auditoria antes de PR

Antes de abrir PR, el agente debe revisar:

- Alcance.
- Calidad.
- Tests o verificaciones.
- Seguridad.
- Arquitectura.
- Documentacion.

Resultados posibles:

- `PASS`: se puede preparar PR.
- `PASS_WITH_NOTES`: se puede preparar PR documentando notas, riesgos o deuda tecnica.
- `FAIL`: no se abre PR; primero se corrige y se repite la auditoria.

La auditoria esta definida en `docs/agents/audit-quality-security-skill.md`.

## Resumen final obligatorio

Al cerrar una tarea, el agente debe entregar:

- Rama activa.
- Archivos creados.
- Archivos modificados.
- Resumen de cambios por archivo.
- Confirmacion de restricciones cumplidas.
- Verificaciones ejecutadas.
- Riesgos o dudas.
- Siguiente paso recomendado.

## Checklist antes de cerrar una tarea

- [ ] Rama correcta confirmada.
- [ ] Working tree revisado.
- [ ] Cambios limitados al alcance.
- [ ] No se han creado archivos tecnicos no solicitados.
- [ ] No se han instalado dependencias.
- [ ] No se han introducido secretos.
- [ ] Documentacion escrita en espanol.
- [ ] Criterios de aceptacion revisados.
- [ ] Verificaciones ejecutadas.
- [ ] Auditoria quality/security aplicada o justificada como no aplicable.
- [ ] Documentacion afectada actualizada en la misma rama.
- [ ] Resumen final preparado.
