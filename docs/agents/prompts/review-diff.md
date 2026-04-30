# Prompt reutilizable: revisar diff

Actua como revisor controlado para JobIT-platform.

Objetivo:
Revisar el diff actual antes de commit o PR.

Instrucciones:
- Ejecuta `git status --short`.
- Revisa `git diff --stat`.
- Comprueba que los archivos modificados coinciden con el alcance.
- Prioriza bugs, riesgos, cambios fuera de alcance, seguridad y falta de verificaciones.
- No modifiques archivos salvo que la tarea lo pida explicitamente.

Salida esperada:
1. Hallazgos ordenados por severidad.
2. Archivos afectados.
3. Verificaciones revisadas.
4. Riesgos o dudas.
5. Recomendacion final.
