# Skill neutral: DevOps / VPS

## Objetivo

Documentar criterios y restricciones para futuras tareas de despliegue en VPS, sin crear Docker, CI/CD ni configuracion de produccion en esta fase.

## Cuando usarla

- Al planificar el despliegue futuro del MVP.
- Al evaluar si un cambio impacta operacion o despliegue.
- Al revisar specs que mencionan infraestructura, dominio, certificados o proxy.
- Al recoger requisitos no funcionales.

## Entradas necesarias

- Necesidad operativa concreta.
- Modulo o servicio afectado.
- Restricciones de seguridad y privacidad.
- Riesgos conocidos.

## Archivos permitidos

- Specs en `docs/specs/` cuando la tarea lo autorice.
- Plantillas en `docs/agents/templates/`.
- En fases tecnicas posteriores: archivos de despliegue solo cuando la tarea lo autorice.

## Restricciones

- No crear Docker, compose, workflows ni configuracion de proxy en esta fase.
- No instalar dependencias ni herramientas de despliegue.
- No introducir secretos, tokens ni credenciales.
- No fijar proveedor de hosting sin ADR aprobado.
- No automatizar despliegues sin spec aprobada.

## Checklist

- [ ] Necesidad operativa documentada y justificada.
- [ ] Sin secretos ni credenciales en el cambio.
- [ ] Sin configuracion ejecutable creada.
- [ ] Riesgos operativos identificados.
- [ ] Decision de tooling delegada a ADR futuro cuando aplica.

## Formato esperado de salida

1. Necesidad operativa.
2. Restricciones aplicables.
3. Opciones documentales evaluadas.
4. Riesgos y dudas.
5. Recomendacion sobre crear ADR o spec.
6. Siguiente paso recomendado.

## Criterio de parada

Detener la skill cuando la necesidad operativa queda documentada y se identifica si requiere un ADR futuro. No avanzar a configuracion ejecutable sin aprobacion explicita.
