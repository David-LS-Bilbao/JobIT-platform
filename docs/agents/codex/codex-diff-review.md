# Codex: revision de diff

## Objetivo

Usar Codex como revisor de cambios, no como implementador. La revision es de solo lectura y devuelve hallazgos concretos para apoyar la decision humana.

## Cuando usarlo

- Antes de abrir PR.
- Al revisar un diff generado por otro agente.
- Al validar consistencia entre spec y cambios.
- Al detectar regresiones no obvias.

## Reglas

- Codex no modifica archivos durante la revision.
- Codex no aprueba ni cierra la PR.
- Codex no decide ampliacion de alcance.
- Codex no oculta riesgos para acelerar el merge.

## Entradas necesarias

- Diff o PR a revisar.
- Spec o task brief asociado.
- Criterios de aceptacion.
- Verificaciones declaradas.

## Procedimiento

1. Leer la spec o task brief asociado.
2. Leer el diff completo, no solo titulares.
3. Identificar archivos fuera del alcance autorizado.
4. Identificar cambios sin justificacion.
5. Identificar riesgos de seguridad, datos personales o regresiones.
6. Comprobar que la documentacion afectada se ha actualizado.
7. Comprobar que la auditoria quality/security esta declarada.

## Severidad de hallazgos

- Alta: bloqueo para merge (seguridad, alcance, datos sensibles, ruptura de contrato).
- Media: requiere correccion o nota explicita en la PR.
- Baja: sugerencia opcional.

## Formato esperado de salida

1. Resumen breve del cambio revisado.
2. Hallazgos por severidad.
3. Riesgos no bloqueantes.
4. Verificaciones revisadas.
5. Recomendacion final: PASS, PASS_WITH_NOTES o FAIL.

## Antipatrones

- Resumir el diff en lugar de evaluarlo.
- Aprobar sin leer la spec.
- Ignorar diferencias entre lo prometido y lo entregado.
- Decidir merge sin revision humana.

## Cierre

La revision termina con una recomendacion clara. La decision de merge es siempre humana.
