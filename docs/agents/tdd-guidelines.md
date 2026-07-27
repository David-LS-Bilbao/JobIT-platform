# Guia de TDD pragmatico

> Documento especializado sobre la aplicacion proporcional de TDD. La fuente canonica es [`jobit-operating-model-v2.md`](jobit-operating-model-v2.md), que prevalece ante cualquier contradiccion.

## Principio

JobIT aplica TDD pragmatico, no dogmatico. El objetivo es mejorar diseno, confianza y mantenibilidad sin convertir la cobertura en un fin en si mismo.

Cada feature debe definir tests minimos antes de implementar. Cuando el comportamiento sea critico o ambiguo, se recomienda aplicar el ciclo Red-Green-Refactor de forma estricta.

## Ciclo Red-Green-Refactor

1. Red: escribir un test que falle y exprese el comportamiento esperado.
2. Green: implementar lo minimo para que el test pase.
3. Refactor: mejorar diseno, nombres o estructura sin cambiar comportamiento.

Este ciclo debe mantenerse pequeno y revisable. Un ciclo pequeno no equivale a un prompt separado: Red, Green y Refactor son fases internas de Execution Mode y el agente puede completar el ciclo completo, sin permiso intermedio, dentro de un plan aprobado. Si una iteracion requiere ampliar el alcance o cambiar el contrato aprobado, hay que detenerse y elevar la decision.

## Cuando aplicar TDD fuerte

TDD fuerte sigue siendo **obligatorio** cuando el cambio afecta:

- reglas de negocio criticas;
- validaciones con errores o casos limite;
- autenticacion, autorizacion y permisos;
- privacidad y datos de usuario;
- separacion por usuario (ownership);
- contratos HTTP/DTO y endpoints;
- scoring o decisiones sobre personas;
- comportamiento con varias ramas;
- bugs reproducibles;
- features que seran base para otras features.

## Cuando bastan tests minimos

Pueden bastar tests minimos cuando:

- El cambio es documental.
- El cambio es una integracion sencilla ya cubierta por pruebas de mayor nivel.
- El riesgo funcional es bajo.
- El tooling de tests aun no existe y la tarea solo prepara especificaciones.

En esos casos se deben dejar definidos los tests esperados en la spec y documentar que aun no se ejecutan por falta de infraestructura.

## Verificaciones equivalentes

La documentacion, el copy y los cambios puramente visuales no requieren TDD literal. En su lugar deben usarse verificaciones equivalentes justificadas: `grep`, typecheck, lint, build, revision visual, `git diff --check`, enlaces internos y tests existentes. La eleccion debe quedar registrada en el informe final.

## Ejemplos futuros

### Auth

Tests minimos esperados:

- Registro con datos validos.
- Rechazo de email invalido.
- Login con credenciales correctas.
- Rechazo de credenciales incorrectas.
- Proteccion de rutas privadas.

Aplicar TDD fuerte por impacto en seguridad y datos de usuario.

### Profile

Tests minimos esperados:

- Crear perfil de candidato.
- Actualizar skills y experiencia.
- Validar campos obligatorios.
- Evitar guardar datos incoherentes.

Aplicar TDD fuerte en validaciones y reglas de persistencia.

### Jobs

Tests minimos esperados:

- Listar ofertas disponibles.
- Filtrar por criterios basicos.
- Ver detalle de una oferta.
- Gestionar estados de carga, vacio y error.

Aplicar TDD pragmatico con tests de comportamiento principal y casos de error.

### Saved jobs

Tests minimos esperados:

- Guardar una oferta.
- Evitar duplicados.
- Quitar una oferta guardada.
- Listar ofertas guardadas del usuario.

Aplicar TDD fuerte en reglas de duplicado y pertenencia de usuario.

## Cobertura

Evitar obsesion por 100% coverage superficial. Es preferible cubrir bien reglas criticas, errores y flujos principales que escribir tests fragiles sobre detalles internos.

La cobertura puede ser una senal util, pero no sustituye revision de calidad, seguridad ni valor real del test.
