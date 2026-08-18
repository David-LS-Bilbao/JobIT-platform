# Skill neutral: Security

## Objetivo

Revisar cambios y propuestas con foco en seguridad documental: secretos, datos personales, permisos, dependencias y superficie de ataque futura.

## Cuando usarla

- Al revisar specs que toquen autenticacion, autorizacion, datos personales o pagos.
- Al revisar diffs antes de PR.
- Al evaluar la introduccion de una dependencia nueva.
- Al definir reglas de validacion o errores expuestos al usuario.

Cuando la revision alcance datos personales o cualquiera de los disparadores de privacidad (autenticacion, visibilidad publica, portfolio, uploads, cookies o almacenamiento, conservacion, borrado, derechos, proveedores, profiling, match, Recruit o Candidate Discovery), aplicar ademas [`privacy-legal-reference.md`](privacy-legal-reference.md).

## Entradas necesarias

- Spec o diff a revisar.
- Datos manejados por la feature.
- Roles y permisos esperados.
- Dependencias o servicios externos involucrados.

## Archivos permitidos

Por defecto, ninguno. La revision es de solo lectura salvo que la tarea autorice correcciones documentales.

## Restricciones

- No introducir secretos, tokens ni credenciales en el repositorio.
- No relajar autenticacion, autorizacion o privacidad por conveniencia.
- No incorporar dependencias sin revision explicita.
- No exponer datos personales innecesarios en logs, errores ni respuestas.
- No agregar comandos destructivos, permisos amplios ni automatismos peligrosos.

## Checklist

- [ ] No hay secretos ni credenciales en el cambio.
- [ ] Los datos personales tratados estan justificados por la spec.
- [ ] Autenticacion y autorizacion no se debilitan.
- [ ] Dependencias nuevas estan listadas y revisadas.
- [ ] Errores no filtran detalles internos sensibles.
- [ ] Permisos pedidos al sistema o al usuario son los minimos.

## Formato esperado de salida

1. Hallazgos por severidad (alta, media, baja).
2. Riesgos potenciales no bloqueantes.
3. Mitigaciones recomendadas.
4. Verificaciones revisadas.
5. Recomendacion final (PASS, PASS_WITH_NOTES, FAIL).

## Criterio de parada

Detener la skill cuando los hallazgos quedan documentados y se entrega una recomendacion clara. Si aparece un riesgo critico, marcar como `FAIL` y delegar la decision en revision humana antes de avanzar.
