# Claude: permisos y hooks

## Objetivo

Definir criterios documentales para decidir cuando NO crear permisos automaticos, hooks ni configuracion ejecutable para Claude Code en JobIT-platform.

## Estado actual

JobIT-platform no usa `.claude/skills/`, `.claude/settings.json` ni hooks. Esa decision es deliberada en fase documental inicial.

Cualquier activacion de configuracion ejecutable requiere:

- Necesidad real y repetida.
- Flujo previamente probado de forma manual.
- ADR o spec que justifique el cambio.
- Permisos acotados al minimo.
- Revision humana del cambio antes de activarlo.

## Criterios para NO crear hooks o settings

No se debe crear configuracion ejecutable cuando:

- No hay una necesidad repetida documentada.
- El flujo todavia no se ha probado de forma manual y consciente.
- El cambio implica permisos amplios o globales.
- El cambio puede ejecutar comandos destructivos.
- El cambio puede tocar secretos, credenciales o infraestructura.
- El cambio puede modificar dependencias o lockfiles automaticamente.
- El cambio puede modificar archivos fuera del alcance autorizado.
- No hay un humano responsable del comportamiento resultante.

## Criterios minimos para activar algo en el futuro

Cuando llegue el momento de evaluar configuracion ejecutable:

- Permisos especificos, no comodines.
- Acciones reversibles por defecto.
- Logs claros de lo que se ejecuta.
- Posibilidad de desactivar sin efectos colaterales.
- Documentacion en `docs/agents/claude/` actualizada.
- ADR aprobado en `docs/decisions/`.

## Antipatrones

- Activar hooks "porque parece util".
- Conceder permisos amplios para evitar pedirlos despues.
- Ejecutar comandos destructivos desde un hook.
- Tocar `.env`, `.git`, dependencias o despliegues desde un hook.
- Saltarse la auditoria quality/security desde una automatizacion.

## Cierre

Mientras el repositorio este en fase documental, la respuesta por defecto a "activamos un hook" es "no, todavia no". El umbral para activar configuracion ejecutable es alto y requiere trazabilidad documental.
