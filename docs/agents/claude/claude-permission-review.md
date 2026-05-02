# Claude: revision de permisos

## Objetivo

Definir un proceso documental para revisar permisos de herramientas antes de activarlas en Claude Code, evitando concesiones amplias o automatismos peligrosos.

## Principio

Los permisos se conceden uno a uno y solo cuando hay una necesidad documentada. La revision de permisos es previa a la activacion, no posterior.

## Cuando aplicarlo

- Antes de habilitar una herramienta nueva.
- Antes de aprobar comandos automaticos en `settings.json` (cuando exista).
- Antes de aceptar un hook propuesto.
- Antes de conceder acceso a recursos externos (red, sistema de ficheros amplio, ejecucion de scripts).

## Procedimiento

1. **Identificar la necesidad**

   - Que problema resuelve este permiso.
   - Cuantas veces se va a usar.
   - Que alternativas existen sin permiso ampliado.

2. **Acotar el alcance**

   - Que comandos o rutas concretas se autorizan.
   - Que comandos o rutas quedan explicitamente fuera.
   - Que datos sensibles podria tocar.

3. **Evaluar riesgos**

   - Puede ejecutar acciones destructivas.
   - Puede tocar secretos, credenciales o despliegues.
   - Puede modificar dependencias o lockfiles.
   - Puede ampliar alcance silenciosamente.

4. **Decidir**

   - Si el riesgo es alto: rechazar.
   - Si el alcance no se puede acotar: rechazar.
   - Si hay alternativa segura: usarla.
   - Si se aprueba: dejarlo documentado y revisable.

5. **Trazabilidad**

   - Registrar la decision en `docs/agents/claude/` o en un ADR cuando aplique.
   - Indicar quien aprobo el permiso y cuando.

## Permisos por defecto

Mientras el repositorio este en fase documental, los permisos por defecto deberian limitarse a:

- Lectura de archivos del repositorio.
- Edicion de archivos explicitamente autorizados por la tarea.
- Comandos de Git no destructivos para verificar estado y diff.

Cualquier permiso mas amplio requiere revision previa con este checklist.

## Antipatrones

- Aprobar permisos amplios para "ahorrar prompts".
- Aprobar comandos comodin sin restriccion de ruta.
- Conceder ejecucion de scripts arbitrarios.
- Aprobar permisos que tocan secretos o despliegues sin spec.
- Tratar la revision como una formalidad.

## Cierre

La revision de permisos es una decision documental con trazabilidad. Si no hay necesidad clara, alcance acotado y riesgo aceptable, no se concede el permiso.
