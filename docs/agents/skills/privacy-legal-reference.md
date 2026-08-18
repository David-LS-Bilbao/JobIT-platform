# Skill neutral: Privacy / Legal Reference

## Objetivo

Determinar si un cambio tiene impacto en privacidad y, cuando lo tenga, consultar de forma
controlada la baseline juridica preparatoria de `S22-PRIV-01` en
[`docs/legal/reference/`](../../legal/reference/), sin convertir conclusiones preliminares en
obligaciones juridicas ni en autorizaciones de implementacion.

Esta skill es documental, neutral y de solo lectura. No es una skill nativa, no es configuracion
ejecutable, no instala herramientas, no define hooks ni gates de CI y no concede permisos.

Esta skill **no sustituye la revision juridica humana** y **no puede levantar ningun gate legal**.

## Cuando usarla

Antes de disenar, especificar o implementar cualquier cambio que pueda afectar a datos
personales, autenticacion, visibilidad publica, portfolio, uploads, cookies o almacenamiento en
terminal, conservacion, borrado, derechos, proveedores, profiling, match, Recruit o Candidate
Discovery.

En la practica:

- al redactar o revisar una spec en `docs/specs/`;
- al planificar un sprint que toque datos de personas;
- al revisar un diff antes de PR;
- al evaluar un proveedor o servicio externo nuevo;
- como complemento de [`security.md`](security.md) cuando la revision de seguridad alcanza datos
  personales.

Ante la duda, ejecutar el precheck: es barato y su resultado puede ser `PRIVACY_IMPACT: NO`.

## Entradas necesarias

- Descripcion del cambio propuesto (spec, brief o diff).
- Datos personales tratados, si los hay.
- Superficies afectadas (publica, privada, backend, almacenamiento, terceros).
- Proveedores o servicios externos implicados.
- Estado del sprint y nivel de riesgo asignado.

## Archivos permitidos

Ninguno. La skill es de solo lectura.

Ambito de lectura legal de esta skill:

```text
DEFAULT_LEGAL_READ_SCOPE:
docs/legal/reference/**

OTHER_DOCS_LEGAL:
NOT_AUTOMATICALLY_AUTHORIZED

DO_NOT_READ_BY_THIS_SKILL:
- controller-decisions.md
- docs/legal/candidate-rights-and-support.md
```

Esta skill **no puede abrir, resumir, inspeccionar ni reconstruir** los documentos listados en
`DO_NOT_READ_BY_THIS_SKILL`, ni directamente ni a traves de citas, indices o inferencias.
Cualquier otro documento bajo `docs/legal/**` requiere autorizacion explicita en el brief.

Fuera de `docs/legal/`, la lectura se limita a `docs/specs/` y al diff en revision.

Crear, editar o borrar bajo `docs/legal/reference/**` requiere autorizacion documental explicita
en el brief; sin ella se activa el kill-switch `LEGAL_REFERENCE_MUTATION_NOT_AUTHORIZED`.

---

## PRIVACY_IMPACT_PRECHECK

Doce preguntas. Responder `YES` o `NO` a cada una, sin omitir ninguna.

```text
 1. NEW_PERSONAL_DATA
    El cambio introduce, deriva o infiere algun dato personal nuevo.

 2. NEW_PURPOSE
    El cambio anade una finalidad nueva o reutiliza datos existentes
    para una finalidad distinta de la original.

 3. ACCESS_OR_VISIBILITY_CHANGE
    El cambio altera quien puede ver o acceder a datos ya existentes
    (roles, permisos, defaults, alcance de una consulta).

 4. DATA_PUBLICATION
    El cambio publica datos hacia una superficie accesible sin sesion
    o accesible por terceros.

 5. NEW_PROVIDERS
    El cambio introduce un proveedor, servicio externo, SDK, CDN,
    hosting o subencargado nuevo.

 6. COOKIES_STORAGE_TRACKING
    El cambio escribe o lee en el terminal del usuario: cookies,
    localStorage, sessionStorage, medicion, analitica o tracking.

 7. AUTH_SESSION_REFRESH_TOKEN
    El cambio afecta a autenticacion, sesion, cookie de refresh,
    expiracion, rotacion o cierre de sesion.

 8. RETENTION_DELETION_BACKUPS
    El cambio afecta a plazos de conservacion, supresion, inactividad,
    anonimizacion, backups o restore.

 9. DATA_SUBJECT_RIGHTS
    El cambio afecta al ejercicio de derechos: acceso, rectificacion,
    supresion, oposicion, limitacion, portabilidad.

10. PORTFOLIO_AVATAR_UPLOADS
    El cambio afecta al portfolio publico, al avatar, a imagenes o a
    cualquier fichero subido por la persona usuaria.

11. AI_SCORING_PROFILING_MATCH
    El cambio introduce o modifica IA, scoring, ranking, perfilado o
    logica de match sobre personas.

12. RECRUIT_OR_CANDIDATE_DISCOVERY
    El cambio afecta a Recruit, a Candidate Discovery o a cualquier
    superficie donde un tercero busca o evalua candidatos.
```

Regla de decision:

```text
Todas NO   ->  PRIVACY_IMPACT: NO
                LEGAL_REFERENCE_REQUIRED: NO
                Continuar con el flujo normal del sprint.

Alguna YES ->  PRIVACY_IMPACT: YES
                LEGAL_REFERENCE_REQUIRED: YES
                Aplicar el procedimiento de consulta.
```

No se admite responder «parcialmente» ni saltarse preguntas por considerarlas obvias. Una sola
respuesta `YES` basta.

---

## Procedimiento de consulta

Cuando `LEGAL_REFERENCE_REQUIRED: YES`:

1. Leer [`docs/legal/reference/README.md`](../../legal/reference/README.md) y confirmar el estado
   juridico vigente.
2. Identificar los SR relevantes con la tabla de ruteo.
3. Leer **unicamente** los paquetes necesarios. No abrir los cuatro por costumbre.
4. Clasificar cada elemento utilizado segun las reglas de interpretacion.
5. Emitir el bloque del contrato de salida.

## Tabla de ruteo SR

| SR | Materia | Archivo |
|---|---|---|
| SR-01 | Responsable e identidad | [`SR-01_a_SR-04`](../../legal/reference/JOBIT_S22-PRIV-01_SR-01_a_SR-04_v2.0.md) |
| SR-02 | Finalidades y bases juridicas | [`SR-01_a_SR-04`](../../legal/reference/JOBIT_S22-PRIV-01_SR-01_a_SR-04_v2.0.md) |
| SR-03 | Terminos, aviso legal y LSSI | [`SR-01_a_SR-04`](../../legal/reference/JOBIT_S22-PRIV-01_SR-01_a_SR-04_v2.0.md) |
| SR-04 | Edad y menores | [`SR-01_a_SR-04`](../../legal/reference/JOBIT_S22-PRIV-01_SR-01_a_SR-04_v2.0.md) |
| SR-05 | Delegado de proteccion de datos (DPO) | [`SRP2_SR-05_a_SR-08`](../../legal/reference/JOBIT_S22-PRIV-01_SRP2_SR-05_a_SR-08_v1.1.md) |
| SR-06 | Registro de actividades de tratamiento (RAT) | [`SRP2_SR-05_a_SR-08`](../../legal/reference/JOBIT_S22-PRIV-01_SRP2_SR-05_a_SR-08_v1.1.md) |
| SR-07 | Evaluacion de impacto (EIPD / DPIA) | [`SRP2_SR-05_a_SR-08`](../../legal/reference/JOBIT_S22-PRIV-01_SRP2_SR-05_a_SR-08_v1.1.md) |
| SR-08 | Match, articulo 22, perfilado y AI Act | [`SRP2_SR-05_a_SR-08`](../../legal/reference/JOBIT_S22-PRIV-01_SRP2_SR-05_a_SR-08_v1.1.md) |
| SR-09 | Cookies, autenticacion y almacenamiento en terminal | [`SRP3_SR-09_a_SR-12`](../../legal/reference/JOBIT_S22-PRIV-01_SRP3_SR-09_a_SR-12_v1.2.md) |
| SR-10 | Proveedores, encargados y transferencias | [`SRP3_SR-09_a_SR-12`](../../legal/reference/JOBIT_S22-PRIV-01_SRP3_SR-09_a_SR-12_v1.2.md) |
| SR-11 | Conservacion, supresion e inactividad | [`SRP3_SR-09_a_SR-12`](../../legal/reference/JOBIT_S22-PRIV-01_SRP3_SR-09_a_SR-12_v1.2.md) |
| SR-12 | Ejercicio de derechos | [`SRP3_SR-09_a_SR-12`](../../legal/reference/JOBIT_S22-PRIV-01_SRP3_SR-09_a_SR-12_v1.2.md) |
| SR-13 | Portfolio profesional publico | [`SRP4_SR-13_a_SR-15`](../../legal/reference/JOBIT_S22-PRIV-01_SRP4_SR-13_a_SR-15_v1.1.md) |
| SR-14 | Avatar, imagenes y uploads | [`SRP4_SR-13_a_SR-15`](../../legal/reference/JOBIT_S22-PRIV-01_SRP4_SR-13_a_SR-15_v1.1.md) |
| SR-15 | Incidentes, brechas y reclamaciones | [`SRP4_SR-13_a_SR-15`](../../legal/reference/JOBIT_S22-PRIV-01_SRP4_SR-13_a_SR-15_v1.1.md) |

Correspondencia orientativa entre precheck y SR:

```text
 1 NEW_PERSONAL_DATA             -> SR-02, SR-06
 2 NEW_PURPOSE                   -> SR-02, SR-06
 3 ACCESS_OR_VISIBILITY_CHANGE   -> SR-02, SR-13
 4 DATA_PUBLICATION              -> SR-13, SR-10
 5 NEW_PROVIDERS                 -> SR-10
 6 COOKIES_STORAGE_TRACKING      -> SR-09
 7 AUTH_SESSION_REFRESH_TOKEN    -> SR-09
 8 RETENTION_DELETION_BACKUPS    -> SR-11, SR-14
 9 DATA_SUBJECT_RIGHTS           -> SR-12
10 PORTFOLIO_AVATAR_UPLOADS      -> SR-13, SR-14
11 AI_SCORING_PROFILING_MATCH    -> SR-08, SR-07
12 RECRUIT_OR_CANDIDATE_DISCOVERY-> SR-02, SR-08, SR-13
```

La correspondencia es una ayuda de entrada, no un limite: si la lectura revela otro SR
aplicable, se anade a `AFFECTED_SR`.

El [anexo de fuentes](../../legal/reference/JOBIT_S22-PRIV-01_Anexo_de_fuentes_v1.0.md) **solo se
consulta cuando se necesite trazabilidad o verificacion de una fuente concreta**. Distingue
fuentes verificadas en sesion (categoria A) de fuentes no verificadas en sesion (categoria B); esa
distincion se traslada al informe cuando sea relevante, sin elevar una fuente de categoria B a
hecho acreditado.

---

## Reglas de interpretacion

Cada elemento tomado de la baseline se clasifica en una de estas cuatro categorias:

- **`BUSINESS_DECISION`** — decision del responsable del tratamiento (identidad, contactos,
  territorio, canales, finalidades de negocio, plazos propuestos, comportamiento deseado del
  portfolio). El equipo tecnico y los agentes **no pueden tomarla ni suponerla**.
- **`PREPARATORY_GUIDANCE`** — analisis preparatorio con valor de contexto y restriccion de
  diseno, no de obligacion juridica.
- **`HUMAN_REVIEW_REQUIRED`** — calificacion juridica reservada a la revision especializada
  cualificada.
- **`TECHNICAL_REQUIREMENT`** — requisito tecnico ya establecido de forma independiente por una
  fuente de proyecto aprobada: spec aprobada, ADR, decision empresarial confirmada, requisito de
  seguridad establecido o criterio de aceptacion aprobado.

```text
LEGAL_REFERENCE_ALONE:
CANNOT_CREATE_TECHNICAL_REQUIREMENT
```

Una conclusion preparatoria del baseline juridico NO crea por si sola un requisito tecnico
definitivo. Sin una fuente de proyecto aprobada que lo establezca por su cuenta, el elemento
sigue siendo `PREPARATORY_GUIDANCE` o `HUMAN_REVIEW_REQUIRED`.

Prohibicion central:

```text
PROHIBIDO convertir

  PRELIMINARY
  CONDITIONAL
  TO_VERIFY
  RECOMMENDATION
  HUMAN_REVIEW_REQUIRED

en

  LEGAL_REQUIREMENT
  APPROVED
  COMPLIANT
```

```text
SOURCE_LABEL_PRESERVATION:
YES

FINAL_LEGAL_AUTHORITY:
NO
```

Al citar la conclusion original de un SR se conserva su label tal cual: `REQUIRED`,
`NOT_REQUIRED` o `CONDITIONAL`. Conservar el label no le otorga autoridad juridica final.

Mientras `HUMAN_LEGAL_VALIDATION: PENDING`, esas conclusiones siguen siendo **preparatorias**. El
agente no puede elevarlas, rebajarlas, reinterpretarlas ni convertirlas en obligacion juridica
final: debe citar el SR y conservar la dependencia de revision humana.

Si una spec, ADR, decision empresarial o requisito de seguridad aprobado establece de forma
independiente el mismo comportamiento, se aplica **por esa fuente independiente**, no porque el
baseline de IA sea aprobacion legal.

Marcador especifico de los paquetes:

```text
SAFE_TO_IMPLEMENT_NOW:
DOES_NOT_AUTHORIZE_IMPLEMENTATION
```

`SAFE_TO_IMPLEMENT_NOW` describe unicamente que un elemento no depende de una conclusion juridica
abierta. Toda implementacion sigue requiriendo:

```text
ORCHESTRATOR_AUTHORIZATION
+
SDD_SPEC_WHEN_APPLICABLE
```

Lo mismo aplica a `DESIGN_ONLY` y `DO_NOT_IMPLEMENT_UNTIL_HUMAN_REVIEW`: son restricciones
adicionales, nunca autorizaciones.

---

## Estado juridico vigente

Se reproduce literalmente y **no puede ser levantado ni reinterpretado por esta skill ni por
ningun agente**:

```text
PREPARATORY_REFERENCE_ONLY

SR_01_TO_SR_15_AI_REFERENCE_BASELINE:
COMPLETE

HUMAN_LEGAL_VALIDATION:
PENDING

SPECIALIST_REVIEW_COMPLETED:
NO

LEGAL_DECISIONS_APPROVED:
NO

LEGAL_DECISION_GATE:
OPEN

TRAMO_B:
NOT_AUTHORIZED

PRODUCTION:
NOT_AUTHORIZED

REAL_CANDIDATE_DATA:
NOT_AUTHORIZED
```

Transicion del gate:

```text
LEGAL_DECISION_GATE:
OPEN

GATE_TRANSITION_AUTHORITY:
HUMAN_GOVERNANCE_ONLY

THIS_SKILL_CAN_CHANGE_GATE:
NO
```

El mecanismo por el que el gate cambia de estado pertenece a la gobernanza humana y queda fuera
del alcance de esta skill: no se describe, no se reconstruye y no se infiere. Ninguna salida de
esta skill lo altera ni lo sustituye.

## Restricciones

- No modificar `docs/legal/reference/**` sin autorizacion documental explicita.
- No afirmar cumplimiento, conformidad ni aprobacion juridica.
- No introducir supuestos juridicos propios: `LEGAL_ASSUMPTIONS_INTRODUCED` debe ser `NONE`.
- No tomar decisiones que corresponden al responsable del tratamiento.
- No rellenar huecos marcados `PENDING_SR_10`, `PENDING_SR_11` o `TO_VERIFY_IN_REPOSITORY` con
  valores verosimiles.
- No introducir en el repositorio valores privados ni datos reales: el repositorio contiene **el
  modelo**, el entorno privado contiene **los valores** (frontera descrita en SR-06.6 del
  Paquete 2).
- No copiar bloques extensos de los paquetes SR a otros documentos: se referencia el SR.
- No usar datos reales de personas candidatas en tests, fixtures, ejemplos ni capturas.

## Checklist

- [ ] Las 12 preguntas del precheck estan respondidas explicitamente.
- [ ] Si hay algun `YES`, se ha leido `docs/legal/reference/README.md`.
- [ ] Se han leido solo los paquetes SR necesarios.
- [ ] Cada elemento utilizado esta clasificado en una de las cuatro categorias.
- [ ] No se ha convertido ningun estado preliminar en obligacion, aprobacion o conformidad.
- [ ] `SAFE_TO_IMPLEMENT_NOW` no se ha tratado como autorizacion.
- [ ] No se han introducido supuestos juridicos propios.
- [ ] No aparecen valores privados ni datos reales en el cambio.
- [ ] El estado juridico vigente se mantiene sin alterar.
- [ ] Las dependencias de revision humana estan listadas, no resueltas.

## Formato esperado de salida

```text
PRIVACY_IMPACT:
YES / NO

LEGAL_REFERENCE_REQUIRED:
YES / NO

AFFECTED_SR:
...

BUSINESS_DECISIONS_USED:
...

PREPARATORY_GUIDANCE_USED:
...

HUMAN_REVIEW_DEPENDENCIES:
...

LEGAL_ASSUMPTIONS_INTRODUCED:
NONE

IMPLEMENTATION_STATUS:
CLEAR / DESIGN_ONLY / LEGAL_INTERPRETATION_REQUIRED
```

Lectura de `IMPLEMENTATION_STATUS`:

- **`CLEAR`** — no depende de ninguna conclusion juridica abierta. Sigue necesitando
  autorizacion del orquestador y spec cuando proceda.
- **`DESIGN_ONLY`** — puede disenarse y especificarse, pero no implementarse todavia.
- **`LEGAL_INTERPRETATION_REQUIRED`** — depende de una calificacion juridica no resuelta. Activa
  el kill-switch del mismo nombre.

Si `PRIVACY_IMPACT: NO`, los campos intermedios se rellenan con `N/A` y no se abre ningun
paquete SR.

## Criterio de parada

Detener la skill cuando el bloque de salida esta completo y cada elemento utilizado queda
clasificado y trazado a su SR.

Detenerse y emitir `BLOCKED` conforme a
[`kill-switch-rules.md`](../kill-switch-rules.md) cuando aparezca:

- `LEGAL_INTERPRETATION_REQUIRED`;
- `LEGAL_REFERENCE_MUTATION_NOT_AUTHORIZED`;
- `PRIVATE_LEGAL_DATA_IN_VERSION_CONTROL`.

Cualquier `LEGAL_INTERPRETATION_REQUIRED` activa el kill-switch general. No existe ningun soft
gate ni parada parcial. El agente debe:

1. detener toda la ejecucion;
2. no modificar ningun archivo mas;
3. emitir `BLOCKED`;
4. esperar decision humana explicita.

```text
ACTION:
FULL_STOP

FURTHER_FILESYSTEM_MUTATION:
NO

RESUME:
ONLY_AFTER_EXPLICIT_HUMAN_DECISION
```

## Relacion con otros documentos

- [`AGENTS.md`](../../../AGENTS.md): declara la puerta de referencia legal y remite a esta skill.
- [`docs/agents/jobit-operating-model-v2.md`](../jobit-operating-model-v2.md): fuente canonica.
  Ante contradiccion, prevalece.
- [`docs/agents/kill-switch-rules.md`](../kill-switch-rules.md): condiciones de parada, incluidas
  las tres especializadas de privacidad.
- [`security.md`](security.md): revision de seguridad documental; se aplica junto a esta skill
  cuando el cambio alcanza datos personales.
- [`sdd.md`](sdd.md): la spec recoge el resultado del precheck cuando `PRIVACY_IMPACT: YES`.
- `docs/legal/**` fuera de `docs/legal/reference/`: capa legal de gobierno previa, independiente
  de esta skill y no sustituida por ella. Queda fuera de `DEFAULT_LEGAL_READ_SCOPE` y no se
  consulta sin autorizacion explicita en el brief.
