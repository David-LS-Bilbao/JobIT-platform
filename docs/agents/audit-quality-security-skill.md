# Auditoria quality/security

## Objetivo

Definir una auditoria documental y tecnica previa a Pull Request. En esta fase es un documento de trabajo, no una skill ejecutable ni una herramienta automatizada.

Aunque el archivo use `skill` en el nombre, su ubicacion actual en `docs/agents/` indica que es un checklist neutral de trabajo. No crea una skill instalada, no configura agentes y no activa automatizaciones.

## Checklist de alcance

- [ ] La rama coincide con la tarea.
- [ ] El cambio respeta la spec o el brief aprobado.
- [ ] No se han introducido funcionalidades fuera de alcance.
- [ ] No se han creado dependencias, infraestructura o codigo no solicitado.
- [ ] Los riesgos conocidos estan documentados.

## Checklist de calidad

- [ ] El cambio es pequeno, revisable y reversible.
- [ ] La estructura de archivos es coherente con el repositorio.
- [ ] Los nombres son claros y consistentes.
- [ ] No hay duplicacion innecesaria.
- [ ] El contenido esta en espanol cuando aplica a documentacion del proyecto.
- [ ] El diff no mezcla cambios no relacionados.

## Checklist de tests

- [ ] La spec define tests minimos cuando aplica.
- [ ] Se ejecutaron tests disponibles para el alcance.
- [ ] Si no existen tests o tooling, se documento claramente.
- [ ] Los casos criticos y errores relevantes estan cubiertos o planificados.
- [ ] No se usa coverage como sustituto de calidad real.

## Checklist de seguridad

- [ ] No se introducen secretos, tokens ni credenciales.
- [ ] No se exponen datos personales innecesarios.
- [ ] No se relajan controles de autenticacion, autorizacion o privacidad.
- [ ] No se incorporan dependencias sin revision.
- [ ] No se agregan comandos destructivos, permisos amplios o automatismos peligrosos.
- [ ] Las entradas de usuario y errores estan considerados en specs futuras.

## Checklist de arquitectura

- [ ] El cambio respeta la modularidad candidate-first.
- [ ] No introduce acoplamientos prematuros.
- [ ] No fija stack, infraestructura o patrones sin ADR/spec aprobada.
- [ ] Las decisiones relevantes quedan documentadas como ADR cuando corresponde.
- [ ] No se sobreingeniera el MVP.

## Checklist de documentacion

- [ ] README, specs, ADRs o docs afectados estan actualizados.
- [ ] La documentacion refleja el estado real del repositorio.
- [ ] La PR incluye una seccion de documentacion actualizada.
- [ ] Las limitaciones y fuera de alcance quedan claros.
- [ ] Los enlaces internos relevantes funcionan de forma razonable.

## Resultado

### PASS

La auditoria no detecta bloqueos. Se puede preparar PR hacia `dev` con resumen de verificaciones.

### PASS_WITH_NOTES

La auditoria detecta observaciones no bloqueantes. Se puede abrir PR si las notas quedan documentadas como riesgo, deuda tecnica o seguimiento.

### FAIL

La auditoria detecta un bloqueo de alcance, calidad, seguridad, tests o documentacion. No se debe abrir PR. Primero se corrige y se repite la auditoria.

## Acciones segun resultado

- `PASS`: preparar PR con checklist completo.
- `PASS_WITH_NOTES`: preparar PR incluyendo notas, riesgos y seguimiento.
- `FAIL`: corregir dentro de la rama, volver a verificar y repetir auditoria.
