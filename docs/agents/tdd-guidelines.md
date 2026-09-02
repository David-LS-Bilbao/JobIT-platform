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

## Modelo de verificacion por riesgo

Formalizacion del modelo proporcional ya descrito en la fuente canonica (`jobit-operating-model-v2.md`
secciones 5, 8 y 15). No lo sustituye ni lo amplia: lo nombra para que sea verificable.

```text
TESTING_MODEL:
RISK_BASED

TDD_MODEL:
SELECTIVE

E2E_MODEL:
CRITICAL_FLOW_MILESTONE_BASED
```

Semantica por nivel de riesgo:

```text
LEVEL_1:
TDD = NOT_REQUIRED
Verification = proportional

LEVEL_2:
TDD = OPTIONAL
Tests = targeted to affected behavior

LEVEL_3:
TDD = SELECTIVE_BUT_REQUIRED_FOR_CRITICAL_INVARIANTS
```

En Nivel 3, los invariantes criticos que exigen TDD selectivo son los que afectan a:

- autenticacion y sesion;
- seguridad;
- permisos, autorizacion y separacion por usuario;
- Prisma, schema y migraciones;
- integridad de datos;
- concurrencia y condiciones de carrera;
- contratos HTTP/DTO;
- flujos criticos del candidato.

`SELECTIVE` significa dirigido, no exhaustivo: no debe forzarse un ciclo Red/Green artificial para
cambios triviales, renombrados, copy o ajustes puramente visuales, aunque ocurran dentro de una
unidad clasificada como Nivel 3. La eleccion debe justificarse en el informe final.

Modelo operativo de ejecucion de tests:

```text
FULL_LOCAL_SUITE_PER_ITERATION:
NO

AFFECTED_TESTS_DURING_IMPLEMENTATION:
YES

AFFECTED_PACKAGE_GATE_BEFORE_FINAL_REVIEW:
YES_WHEN_APPLICABLE

CI_GLOBAL_PRE_MERGE:
AUTHORITATIVE

E2E_PER_SMALL_FIX:
NO
```

Durante la implementacion se ejecutan los tests afectados, no la suite completa en cada iteracion.
Antes de la revision final se ejecuta el gate del paquete afectado cuando aplique. La CI global de
la PR hacia `dev` es la verificacion autoritativa previa al merge.

## Golden E2E

Catalogo conceptual de los journeys criticos del candidato. Es una referencia de gobernanza, no una
suite: no enumera archivos de test ni fija su implementacion.

```text
1. register -> login -> dashboard
2. reload -> session continuity
3. profile / CV edit
4. job search -> detail -> save / unsave
5. explainable match
6. portfolio publish -> public -> unpublish
7. account lifecycle
8. logout
9. protected request -> 401 -> refresh -> retry
```

Ejecucion preferente (`E2E_MODEL: CRITICAL_FLOW_MILESTONE_BASED`):

```text
milestone closure
pre-staging
staging validation
high-risk cross-cutting changes
```

No se ejecuta E2E por cada correccion pequena. Los journeys que todavia no tienen cobertura
ejecutable se tratan como deuda registrada, no como bloqueo automatico.

La suite ejecutable y su especificacion viven fuera de este documento, en `apps/web/e2e/` y en
`docs/specs/features/candidate-e2e-smoke.md`. Este catalogo no los modifica ni los sustituye.

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
