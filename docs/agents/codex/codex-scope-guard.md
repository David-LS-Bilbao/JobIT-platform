# Codex: scope guard

## Objetivo

Impedir que Codex toque archivos fuera del alcance autorizado por la tarea, incluso cuando una mejora parezca obvia o un refactor parezca razonable.

## Principio

El alcance lo define el prompt y el sprint, no el modelo. Una expansion silenciosa de alcance es un fallo, aunque el resultado parezca util.

## Reglas

- La tarea debe declarar archivos permitidos.
- Codex no edita archivos fuera de esa lista.
- Codex no crea archivos no listados salvo que la tarea lo autorice de forma explicita.
- Codex no renombra ni mueve archivos sin instruccion clara.
- Codex no modifica `.github/`, `.vscode/`, `.claude/`, workflows ni configuracion ejecutable salvo tarea explicita.
- Codex no instala dependencias ni edita lockfiles.
- Codex no toca `docs/product/`, `docs/architecture/` ni `docs/decisions/` salvo autorizacion clara.

## Antes de editar

1. Comparar el listado de archivos afectados con la lista de archivos permitidos.
2. Si existe diferencia, detenerse y pedir aclaracion humana.
3. Si la diferencia es minima pero relevante, proponerla en texto sin editar.

## Durante la edicion

- Mantener cambios proporcionales al alcance.
- Evitar reformatear archivos enteros.
- Evitar cambios cosmeticos no pedidos.
- Evitar reescrituras estilisticas no solicitadas.
- Evitar reordenar bloques sin necesidad.

## Senales de scope creep

- "Aprovecho para...": descartar y volver al alcance.
- "Mejor tambien...": descartar y volver al alcance.
- Cambios masivos en archivos no listados.
- Renames silenciosos.
- Edicion de configuraciones globales.
- Actualizacion de dependencias.

## Verificacion final

Antes de cerrar:

- `git status --short` no debe listar archivos fuera del alcance autorizado.
- `git diff --stat` debe ser proporcional al objetivo.
- Si aparece un archivo no autorizado, revertirlo o documentarlo y pedir confirmacion humana antes de continuar.

## Resumen

El scope guard prioriza control sobre velocidad. Una tarea pequena bien acotada es mas valiosa que un cambio grande con buenas intenciones fuera de alcance.
