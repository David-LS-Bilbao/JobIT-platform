# Skill neutral: Git Workflow

## Objetivo

Mantener un flujo Git seguro, revisable y compatible con trabajo por ramas.

## Cuando usarla

- Antes de modificar archivos.
- Antes de preparar commit o PR.
- Al diagnosticar cambios pendientes.

## Entradas necesarias

- Rama esperada.
- Archivos permitidos.
- Base de merge prevista.
- Verificaciones requeridas.

## Archivos permitidos

No aplica por defecto. Esta skill orienta comandos y revision de estado, no cambios de contenido.

## Restricciones

- No trabajar directamente en `main` ni en `dev`.
- No usar comandos destructivos sin aprobacion explicita.
- No revertir cambios ajenos sin permiso.
- No mezclar cambios no relacionados.

## Checklist

- [ ] `git branch --show-current` revisado.
- [ ] `git status --short` revisado.
- [ ] Rama distinta de `main` y `dev`.
- [ ] Diff limitado al alcance.
- [ ] Verificaciones finales ejecutadas.

## Formato esperado de salida

1. Rama activa.
2. Estado del working tree.
3. Archivos cambiados.
4. Riesgos o bloqueos.
5. Siguiente paso recomendado.

## Criterio de parada

Detener la skill cuando la rama, estado del working tree, archivos cambiados, riesgos y siguiente paso esten claros. Si la rama es main o dev, hay cambios ajenos o aparece un archivo fuera de alcance, detenerse y pedir revision humana.
