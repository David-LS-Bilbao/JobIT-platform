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

## Entorno operativo

El entorno principal de desarrollo y verificacion del proyecto es el clon nativo de WSL:

`/home/david/projects/JobIT-platform`

Antes de ejecutar `pnpm install`, tests, Prisma, typecheck o build, consulta `docs/agents/operating-environment.md`.

No uses el checkout de Windows/OneDrive (`/mnt/c/.../OneDrive`) para ejecutar tooling del proyecto: compartir `node_modules` entre Windows y WSL rompe las dependencias nativas.

## Flujo obligatorio antes de modificar

Antes de tocar archivos, el agente debe:

1. Confirmar la rama activa.
2. Confirmar que no esta trabajando directamente en `main` ni en `dev`.
3. Revisar `git status --short`.
4. Identificar archivos afectados.
5. Explicar brevemente que va a modificar.
6. Avisar si detecta cambios previos no relacionados.

Si la rama no coincide con la solicitada o el working tree no esta limpio, debe detenerse y diagnosticar antes de editar.

## Prompts y documentacion de apoyo

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

Los detalles largos del flujo viven en:

- `docs/agents/sdd-tdd-ai-audit-workflow.md`.
- `docs/agents/tdd-guidelines.md`.
- `docs/agents/audit-quality-security-skill.md`.
- `docs/agents/pr-checklist.md`.
- `docs/specs/spec-template.md`.

## Flujo SDD + TDD + AI Audit

Resumen del flujo oficial:

```text
Rama desde dev -> Spec -> Tests minimos/TDD -> Implementacion asistida -> Verificacion local -> Auditoria quality/security -> Correcciones -> Documentacion -> PR hacia dev
```

El contrato operativo es: spec antes de feature, tests minimos antes de implementar, TDD pragmatico, auditoria quality/security antes de PR y documentacion actualizada en la misma rama.

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

El detalle de aplicacion esta en `docs/agents/tdd-guidelines.md`. No se debe perseguir 100% coverage superficial; la prioridad es cubrir comportamiento critico, errores relevantes y reglas que protegen datos o experiencia de usuario.

## Auditoria antes de PR

Antes de abrir PR, el agente debe aplicar `docs/agents/audit-quality-security-skill.md`.

Si el resultado es `FAIL`, no se abre PR. Primero se corrige y se repite la auditoria.

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
