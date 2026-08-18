# AGENTS.md

Guia operativa para agentes IA que trabajen en JobIT-platform.

JobIT es una plataforma fullstack modular de empleo tecnologico **destinada a produccion** y en fase de hardening candidate-first. No debe tratarse en trabajo nuevo como prototipo, demo, experimento ni MVP actual.

Este documento es el **resumen operativo obligatorio y punto de entrada**. El contrato operativo completo y la fuente canonica unica es [`docs/agents/jobit-operating-model-v2.md`](docs/agents/jobit-operating-model-v2.md). Ante cualquier contradiccion, prevalece la fuente canonica.

## Rol de los agentes

Los agentes IA actuan como asistentes tecnicos controlados. Su funcion es ayudar a documentar, analizar, planificar, implementar tareas autorizadas y revisar cambios cuando exista una especificacion clara.

El agente puede ejecutar autonomamente el plan aprobado, pero no puede redefinir el sprint, ampliar alcance ni realizar acciones Git o productivas no autorizadas.

## Modos de trabajo

El agente trabaja en dos modos, definidos en la fuente canonica:

- **Plan Mode:** solo lectura. Inspecciona el repositorio y entrega un plan (estado inicial, documentos revisados, alcance, riesgos, archivos previstos, estrategia SDD/TDD, verificaciones, fases internas y decisiones pendientes). No edita, no crea archivos, no ejecuta acciones Git.
- **Execution Mode:** tras `PLAN_APPROVED`, el agente completa de forma autonoma y continua las fases internas del plan (spec → tests RED → implementacion GREEN → refactor → verificaciones → auditoria → documentacion → informe final) sin pedir permiso entre ellas, mientras no cambie el contrato aprobado.

## Autonomia por nivel de riesgo

El operador clasifica cada sprint antes de empezar:

- **Nivel 1 — riesgo bajo / autonomia alta:** documentacion, copy, ajustes visuales, tokens, accesibilidad frontend localizada, tests frontend, refactors internos, informes. Ejecucion completa tras aprobar el plan.
- **Nivel 2 — riesgo medio / autonomia controlada:** formularios, navegacion, sesion frontend, errores, rutas privadas, E2E, CI, Docker local, refactors transversales. Ejecucion completa dentro del alcance con checkpoint final obligatorio.
- **Nivel 3 — riesgo alto / control estricto:** backend, auth, autorizacion, seguridad, Prisma, migraciones, contratos HTTP/DTO, datos reales, ingesta externa, secretos, despliegue, scoring o decisiones sobre personas. Se permiten fases separadas y revision humana en puntos criticos.

## Reglas generales

- Responder siempre en espanol.
- Mantener un tono claro, profesional y practico.
- Priorizar cambios seguros y reversibles.
- No ampliar alcance sin aprobacion: el plan aprobado es el contrato operativo.
- Respetar el alcance indicado por la tarea o sprint activo.
- No ampliar producto, arquitectura o tecnologia sin permiso explicito.
- Documentar decisiones relevantes cuando afecten al alcance futuro.
- Separar documentacion, codigo e infraestructura en cambios distintos.
- Dentro de un plan aprobado, el agente ejecuta de principio a fin; la revision y validacion finales, y las autorizaciones Git, son humanas.

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

Cada sprint se define con un prompt inicial claro, se aprueba en Plan Mode y se ejecuta de forma autonoma en Execution Mode. No se divide por defecto en micro-prompts (uno por archivo o por test). El prompt chaining y el control paso a paso se reservan para Nivel 3, incidentes, bloqueos, cambios de alcance o decisiones humanas intermedias (ver la fuente canonica, secciones 10-11 y 19).

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

El contrato operativo es: spec antes de feature, tests minimos antes de implementar, TDD pragmatico, auditoria quality/security antes de PR y documentacion actualizada en la misma rama. Estas fases son fases internas de Execution Mode: dentro de un plan aprobado no requieren prompts intermedios. El detalle completo vive en [`docs/agents/jobit-operating-model-v2.md`](docs/agents/jobit-operating-model-v2.md).

## Restricciones de seguridad

- No ejecutar cambios destructivos sin aprobacion explicita.
- No borrar archivos existentes salvo que la tarea lo pida claramente.
- No instalar dependencias sin permiso.
- No crear configuracion tecnica fuera de alcance.
- No introducir secretos, credenciales ni tokens en el repositorio.
- No modificar workflows, despliegues o infraestructura sin una especificacion aprobada.
- En tareas de servidor o produccion, diagnosticar primero y aplicar cambios solo con autorizacion clara.

## Puerta de referencia legal / privacidad

Antes de disenar o implementar cualquier cambio que pueda afectar a datos personales, autenticacion, visibilidad publica, portfolio, uploads, cookies o almacenamiento en terminal, conservacion, borrado, derechos, proveedores, profiling, match, Recruit o Candidate Discovery, el agente debe aplicar la skill documental [`docs/agents/skills/privacy-legal-reference.md`](docs/agents/skills/privacy-legal-reference.md).

Reglas minimas (el detalle vive en la skill):

- Ejecutar el `PRIVACY_IMPACT_PRECHECK` de 12 preguntas. Si alguna respuesta es `YES`, el resultado es `LEGAL_REFERENCE_REQUIRED: YES`.
- En ese caso, leer `docs/legal/reference/README.md` y solo los paquetes SR relevantes segun la tabla de ruteo de la skill.
- Todo lo que vive en `docs/legal/reference/` es `PREPARATORY_REFERENCE_ONLY`. No es aprobacion juridica y no se modifica sin autorizacion documental explicita.
- Prohibido convertir `PRELIMINARY`, `CONDITIONAL`, `TO_VERIFY`, `RECOMMENDATION` o `HUMAN_REVIEW_REQUIRED` en `LEGAL_REQUIREMENT`, `APPROVED` o `COMPLIANT`.
- `SAFE_TO_IMPLEMENT_NOW` no autoriza implementar: sigue haciendo falta autorizacion del orquestador y spec aprobada cuando proceda.
- Prohibido introducir en el repositorio: identidad fiscal o domicilio privados del responsable; credenciales, secrets o claves de API; contratos reales o completos con proveedores o encargados; valores privados de proveedores; incidentes o brechas reales; evidencias reales de ejercicio de derechos o de consentimiento; datos reales de personas candidatas. Esta regla no bloquea plantillas sanitizadas, modelos abstractos ni documentacion autorizada que no contenga valores privados.
- Si el trabajo depende de una conclusion juridica no resuelta, activar `LEGAL_INTERPRETATION_REQUIRED`: detener toda la ejecucion, no modificar mas archivos y emitir `BLOCKED` conforme a [`docs/agents/kill-switch-rules.md`](docs/agents/kill-switch-rules.md). Solo puede reanudarse tras decision humana explicita.

El estado juridico vigente (`LEGAL_DECISION_GATE: OPEN`, `HUMAN_LEGAL_VALIDATION: PENDING`, `TRAMO_B` y `PRODUCTION` no autorizados) no puede levantarlo ningun agente.

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

Para cierres Git, push y Pull Requests, aplicar siempre:

`docs/agents/git-pr-skill.md`

Desde el Sprint 19, las PR hacia `dev` deben pasar ademas los quality gates automaticos del CI (workflow `JobIT CI`, jobs `api` y `web`) antes del merge.

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
