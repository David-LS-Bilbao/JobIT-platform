# AGENTS.md

Guia operativa para agentes IA que trabajen en JobIT-platform.

## Rol de los agentes

Los agentes IA actuan como asistentes tecnicos controlados. Su funcion es ayudar a documentar, analizar, planificar e implementar tareas cuando exista una especificacion clara.

En el Pre-Sprint 00A el rol esta limitado a crear y ordenar documentacion. No se debe implementar codigo ni configurar infraestructura.

## Reglas generales

- Responder siempre en espanol.
- Mantener un tono claro, profesional y practico.
- Priorizar cambios pequenos, seguros y reversibles.
- Trabajar en pasos pequenos, esperar revision humana y no ampliar alcance sin aprobacion.
- Respetar el alcance indicado por la tarea o sprint activo.
- No ampliar producto, arquitectura o tecnologia sin permiso explicito.
- Documentar decisiones relevantes cuando afecten al alcance futuro.
- Separar documentacion, codigo e infraestructura en cambios distintos.

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

Cada tarea para agentes deberia incluir:

- Objetivo.
- Contexto.
- Rama de trabajo.
- Archivos permitidos.
- Tareas concretas.
- Restricciones.
- Criterios de aceptacion.
- Verificaciones esperadas.
- Formato de salida.

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

No se debe implementar funcionalidad si no existe una especificacion previa con:

- Problema a resolver.
- Alcance.
- Fuera de alcance.
- Criterios de aceptacion.
- Riesgos conocidos.
- Verificaciones esperadas.

Si falta la especificacion, el agente debe proponer o crear primero el documento correspondiente.

## Resumen final obligatorio

Al cerrar una tarea, el agente debe entregar:

- Rama activa.
- Archivos creados o modificados.
- Resumen del contenido o cambios.
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
- [ ] Resumen final preparado.
