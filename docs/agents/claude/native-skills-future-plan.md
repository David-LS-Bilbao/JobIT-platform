# Claude: plan futuro de skills nativas

## Objetivo

Documentar bajo que condiciones JobIT-platform consideraria activar skills nativas de Claude Code en `.claude/skills/`, sin crearlas en esta fase.

## Estado actual

Las skills de JobIT viven hoy en `docs/agents/skills/` como documentos neutrales reutilizables por Codex, Claude Code u otros agentes. No hay `.claude/skills/`, ni `.claude/settings.json`, ni hooks.

Esta separacion permite:

- Trabajar la misma metodologia con varios agentes.
- Mantener trazabilidad documental clara.
- Evitar permisos amplios y automatismos prematuros.

## Condiciones para evaluar skills nativas

Una skill documental podra considerarse para conversion a skill nativa cuando se cumplan **todas** estas condiciones:

- El flujo se ha repetido varias veces sin sorpresas.
- El alcance se puede acotar con permisos especificos.
- El valor de automatizacion es claro y medible.
- Existe un ADR aprobado en `docs/decisions/` que documenta la decision.
- Hay una persona responsable del comportamiento resultante.
- Los riesgos de seguridad son aceptables y reversibles.

Si falta cualquiera de esas condiciones, la skill se mantiene como documento neutral.

## Riesgos a evitar

- Activar skills nativas para flujos no probados.
- Conceder permisos amplios para evitar pedirlos despues.
- Duplicar la fuente de verdad entre `docs/agents/skills/` y `.claude/skills/` sin un mecanismo claro de sincronizacion.
- Saltarse la auditoria quality/security desde una skill activa.
- Acoplar el flujo del proyecto a un unico agente.

## Esquema previsto si se activan en el futuro

Cuando se evalue activar skills nativas:

- Cada skill nativa tendria su contraparte documental neutral mantenida.
- El alcance estaria limitado a archivos y comandos explicitos.
- La activacion seria reversible.
- La decision quedaria documentada en ADR.
- La skill nativa pasaria por revision humana antes de cada uso significativo.

## Posibles candidatas (solo orientativo)

Posibles candidatas futuras, sin compromiso:

- Revision de diff (`code-review`).
- Verificacion de scope (`scope guard`).
- Aplicacion de auditoria quality/security.
- Generacion guiada de specs a partir de un brief aprobado.

Ninguna se activa todavia.

## Cierre

El plan de skills nativas es un horizonte, no un compromiso. Mientras el repositorio este en fase documental y el flujo siga madurando, la respuesta por defecto es mantener las skills como documentos neutrales.
