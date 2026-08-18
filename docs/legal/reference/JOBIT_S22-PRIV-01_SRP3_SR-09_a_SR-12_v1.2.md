# JOBIT — S22-PRIV-01
# SPECIALIZED REVIEW PACKAGE 3
# SR-09 / SR-10 / SR-11 / SR-12

---

## PORTADA

**DOCUMENT:**
JOBIT — S22-PRIV-01 · Specialized Review Package 3

**VERSION:**
1.2

**DATE:**
18 August 2026

**AUTHOR:**
Claude / Anthropic

**QUALIFICATION_NOTICE:**

El autor de este documento es un sistema de inteligencia artificial (Claude, Anthropic) actuando en el rol funcional de especialista en protección de datos y derecho digital.

- **No es abogado colegiado ni profesional jurídico habilitado.**
- **No presta asesoramiento jurídico** en el sentido legal del término.
- No existe relación abogado-cliente, deber de secreto profesional ni cobertura de responsabilidad civil profesional.
- El documento se construye sobre fuentes oficiales verificables y está destinado a servir como **referencia preparatoria para diseño y desarrollo**.
- **Requiere validación por abogado/a o profesional humano cualificado en privacidad y derecho tecnológico antes de cualquier decisión, publicación, implementación definitiva o autorización de tramo.**

Esta advertencia es material y debe conservarse en todas las versiones y derivados de este documento.

**SCOPE:**
SR-09, SR-10, SR-11 y SR-12 exclusivamente. No se abre SR-13 a SR-15.

**STATUS:**

```
SPECIALIST_REVIEW_COMPLETED:  NO
LEGAL_DECISIONS_APPROVED:     NO
TRAMO_B:                      NOT_AUTHORIZED
PRODUCTION:                   NOT_AUTHORIZED
REAL_CANDIDATE_DATA:          NOT_AUTHORIZED
```

**RESTRICCIONES OBSERVADAS:**
No se ha modificado repositorio, ni creado branch, commit, push o PR. No se ha implementado código. No se han redactado textos legales definitivos. No se han inventado hechos. No se ha accedido ni reconstruido el registro privado. No se han solicitado secretos, credenciales ni claves.

---

## DIRECTOR_CORRECTIONS_APPLIED

### Correcciones de la v1.1 (mantenidas)

| # | Corrección solicitada | Tratamiento |
|---|---|---|
| 1 | SR-09 — versión vigente de la Guía AEPD | **Aplicada.** Referencia actualizada a la versión de **mayo de 2024** |
| 2 | SR-09 — refresh token persistente | **Aplicada.** `PERSISTENT_AUTH_COOKIE_EXEMPTION: NOT_CONFIRMED`; `USER_CHOICE_OVER_PERSISTENCE: RELEVANT_BUT_NOT_DETERMINATIVE`; separados `PRODUCT_CHOICE` y `LEGAL_CONSENT_ART_22_2` |
| 3 | SR-09 — muro de cookies | **Aplicada.** Retirada la afirmación absoluta; reformulada como nota general |
| 4 | SR-09 — banner / CMP | **Aplicada.** `PENDING_TECHNICAL_INVENTORY` |
| 5 | SR-09 — ePrivacy | **Aplicada.** `SPANISH_OPERATIONAL_RULE` / `EU_INTERPRETIVE_FRAMEWORK` |
| 6 | SR-10 — componentes ≠ proveedores | **Aplicada.** Matriz por `SERVICE_COMPONENT` |
| 7 | SR-10 — evaluación de transferencia | **Aplicada.** Bloque `TRANSFER_ASSESSMENT` / `ADEQUACY_DECISION` / `ARTICLE_46_TOOL` |
| 8 | SR-11 — bloqueo art. 32 LOPDGDD | **Aplicada.** Tres patrones posibles; arts. 32.4 y 32.5 incorporados |
| 9 | SR-11 — plazos | **Aplicada.** Retirado el art. 1964.2 CC como plazo universal |
| 10 | SR-12 — art. 19 RGPD | **Aplicada.** Sección incorporada (revisada en v1.2, ver abajo) |
| 11 | SR-12 — limitación | **Aplicada.** `BLOCK_NORMAL_PRODUCT_PROCESSING` con art. 18.2 |
| 12 | SR-12 — identidad | **Aplicada.** `PRIMARY_REASONABLE_VERIFICATION_METHOD` + `STEP_UP_VERIFICATION` |
| 13 | SR-12 — retirada del consentimiento | **Aplicada.** `SELF_SERVICE_TOGGLE_STRONGLY_INDICATED`; `EXACT_UI_MECHANISM: NOT_LEGALLY_PRESCRIBED` |
| 14 | SR-12 — acceso y backups | **Aplicada.** `BACKUP_DATA_ACCESS_HANDLING: HUMAN_REVIEW_REQUIRED` |
| 15 | SR-12 — resumen de derechos | **Aplicada.** Desglose por tratamiento y base jurídica |
| 16 | Development guidance | **Aplicada.** Recategorización a `DESIGN_ONLY` |
| 17-18 | Flags y portada | **Aplicadas** |

### Correcciones nuevas de la v1.2

| # | Corrección solicitada | Tratamiento en v1.2 |
|---|---|---|
| **19** | SR-09 — analítica y medición de audiencia | **Aplicada.** Retirada la afirmación de que toda analítica requiere consentimiento. Incorporada la **«Guía Uso de cookies para herramientas de medición de audiencia» de la AEPD, versión de enero de 2024**, con `AUDIENCE_MEASUREMENT_COOKIES: CONDITIONAL` y `CONSENT_EXEMPTION: POSSIBLE_UNDER_AEPD_JAN_2024_GUIDE`. Se retiran expresamente las dos formulaciones absolutas —«primera parte siempre exige consentimiento» y «tercera parte siempre exenta»—. La corrección afecta al `FUTURE_REASSESSMENT`; **no autoriza analítica en JobIT** |
| **20** | SR-12 — encargados como destinatarios (art. 19) | **Aplicada.** Eliminada la afirmación de que los encargados no son destinatarios en sentido material. Sustituida por `PROCESSOR: NOT_A_THIRD_PARTY` / `PROCESSOR_AS_RECIPIENT: YES_WHERE_PERSONAL_DATA_IS_DISCLOSED_TO_PROCESSOR`, con el art. 28 como mecanismo operativo de propagación, no como exclusión conceptual. Actualizado el impacto sobre alojamiento, almacenamiento, copias, correo, observabilidad y cualquier otro encargado |
| **21** | SR-12 — portfolio público y art. 19 | **Aplicada.** Retirado el cierre automático de la excepción de imposibilidad o esfuerzo desproporcionado. `PUBLIC_PORTFOLIO_ARTICLE_19: HUMAN_REVIEW_REQUIRED`; `SEARCH_ENGINE_DEINDEXING: REASONABLE_RISK_MITIGATION_MEASURE`; `LEGAL_SCOPE: DO_NOT_PREJUDGE` |
| **22** | Development guidance | **Aplicada.** Añadido `RECIPIENT_PROPAGATION_MECHANISM` como `DESIGN_ONLY`. La analítica permanece en `DO_NOT_IMPLEMENT_UNTIL_HUMAN_REVIEW` |

**Alcance de la revisión v1.2:** la v1.1 queda aceptada en todo lo no indicado expresamente. **SR-10 y SR-11 no se modifican**, salvo las referencias cruzadas necesarias.

---

## ANOTACIONES DEL DIRECTOR INCORPORADAS COMO VINCULANTES

```
SR-06  RAT_REQUIRED_UNDER_CURRENT_LAW:      YES
       EU_ARTICLE_30_REFORM:                ONGOING_LEGISLATIVE_PROCEDURE
       RECHECK_BEFORE_FINAL_HUMAN_REVIEW:   YES

SR-07  DPIA_MANDATORY_NOW:                  CONDITIONAL / HUMAN_REVIEW_REQUIRED
       AEPD_CRITERIA_CONFIRMED:             1
       AEPD_CRITERIA_OPEN_TO_REVIEW:        1

SR-08  DSA_ONLINE_PLATFORM_STATUS:          CONDITIONAL / HUMAN_REVIEW_REQUIRED
       Si JobIT resultara plataforma en línea, antes de concluir que el art. 27
       DSA es aplicable debe analizarse la exención para microempresas y
       pequeñas empresas del art. 19 DSA.
```

**Impacto en el Paquete 3:** la condicionalidad de SR-07 impide dar por cerrado el análisis de riesgo en SR-10 y SR-11. La condicionalidad de SR-08 no afecta a SR-09 a SR-12, salvo en que un eventual estatus de plataforma en línea añadiría un canal de reclamaciones que **convive con, pero no sustituye a**, el procedimiento de derechos del art. 12 RGPD.

---

## DEPENDENCIAS DECLARADAS

| Dependencia | Referencia | Impacto |
|---|---|---|
| DEPENDENCY: SR-03 | Calificación como prestador de SSI, **pendiente de validación humana** | **IMPACT:** condiciona la aplicabilidad operativa del art. 22.2 LSSI en SR-09 |
| DEPENDENCY: SR-02 | Matriz A-M y bases jurídicas | **IMPACT:** estructura de SR-11 y SR-12 |
| DEPENDENCY: SR-06 | Campos `PENDING_SR_10` / `PENDING_SR_11` | **IMPACT:** este paquete los cierra parcialmente |
| DEPENDENCY: SR-08 | Inaplicación del art. 22 sobre los hechos actuales del match | **IMPACT:** no se activan los derechos del art. 22.3 |
| DEPENDENCY: SR-02.I | Portfolio opt-in, base art. 6.1.a) | **IMPACT:** retirada del consentimiento y análisis de transferencia |
| DEPENDENCY: SR-10 | Identidad de los encargados, `PENDING` | **IMPACT (nuevo en v1.2):** determina la lista concreta de destinatarios a efectos del art. 19 en SR-12 |

---

## FUENTES OFICIALES UTILIZADAS

**EUR-Lex.** RGPD: arts. **4.9, 4.10**, 4.11, 5.1.e), 6, 7.3, 11, 12 a 22, 24, 25, 28, 29, 30.1.f), 32, 33, 34, 77 y capítulo V (arts. 44 a 49); considerandos 39, 63, 68, 101 y 111. Directiva 2002/58/CE, art. 5.3.

**BOE.** Ley 34/2002 (LSSI), art. 22.2. LO 3/2018 (LOPDGDD): arts. 5, 11, 12 a 18, 31 y 32 (apartados 1 a 5). Código Civil, art. 1964.2 (referencia acotada, no universal).

**AEPD.**
- **«Guía sobre el uso de las cookies», versión de mayo de 2024**, que actualiza la de julio de 2023 para incorporar los criterios del CEPD sobre modelos de «consentimiento o pago».
- **«Guía Uso de cookies para herramientas de medición de audiencia», versión de enero de 2024** *(añadida en v1.2)*, publicada el 11 de enero de 2024 como complemento de la anterior, que establece los criterios y garantías necesarios para que las cookies con fines estadísticos de medición de tráfico o rendimiento puedan considerarse estrictamente necesarias para la prestación del servicio y, por tanto, exentas del consentimiento conforme al art. 22.2 LSSI.
- Notas de prensa asociadas.

**EDPB / GT29.** Guidelines 05/2021 v2.0 (14 de febrero de 2023). Guidelines 07/2020. Guidelines 2/2023 sobre el ámbito técnico del art. 5.3 ePrivacy. Guidelines 03/2022 sobre patrones engañosos. Dictamen del CEPD sobre modelos de consentimiento o pago (abril de 2024). WP194. WP242 rev.01.

**TJUE.** C-101/01 (Bodil Lindqvist, 6 de noviembre de 2003).

**Comisión Europea.** Decisión de Ejecución (UE) 2021/914; decisiones de adecuación vigentes.

Las fuentes secundarias no fundamentan ninguna conclusión.

---

# REFERENCE: SR-09 — COOKIES, AUTENTICACIÓN Y ALMACENAMIENTO EN TERMINAL (v1.2)

## Hechos utilizados

**Documentados (canónicos):** autenticación propia; refresh token almacenado mediante cookie; finalidad de autenticación; `httpOnly`; `SameSite=Lax`; persistencia actual de 7 días. Sin analytics de terceros, sin publicidad y sin tracking comercial, por decisión empresarial.

**No documentados — `TECHNICAL_FACT_STATUS: TO_VERIFY_IN_REPOSITORY`:** flag `Secure`; `Domain`; `Path`; mecanismo de revocación; rotación; fingerprinting; almacenamiento del access token; vinculación a dispositivo; logs; existencia y uso de `localStorage` o `sessionStorage`; existencia de cualquier otra cookie o mecanismo de almacenamiento en terminal; existencia de una opción de usuario sobre la persistencia.

---

## A — Base jurídica del tratamiento de autenticación

El tratamiento derivado de la autenticación se ampara en el **art. 6.1.b) RGPD** y, en su vertiente de protección frente a accesos no autorizados, en el **art. 6.1.f)** en relación con el **art. 32**.

Precisión estructural: **la base jurídica del tratamiento y la habilitación para escribir o leer en el terminal son cuestiones distintas.** Tener base del art. 6 no autoriza a almacenar información en el equipo del usuario, y estar exento de la regla de almacenamiento en terminal no exime de tener base jurídica ni de informar conforme al art. 13.

## B — Régimen jurídico de la escritura y lectura en terminal

```
SPANISH_OPERATIONAL_RULE:
LSSI_ART_22_2_IF_APPLICABLE

EU_INTERPRETIVE_FRAMEWORK:
DIRECTIVE_2002_58_ART_5_3
```

La regla operativa española es el **art. 22.2 LSSI**, que permite utilizar dispositivos de almacenamiento y recuperación de datos en los equipos terminales **a condición de que el destinatario haya dado su consentimiento** tras recibir información clara y completa, y cuyo párrafo tercero exceptúa el almacenamiento o acceso **de índole técnica al solo fin de efectuar la transmisión de una comunicación**, o **en la medida en que resulte estrictamente necesario para la prestación de un servicio de la sociedad de la información expresamente solicitado por el destinatario**.

Su aplicabilidad depende de la calificación de JobIT como prestador de SSI, **pendiente de validación humana conforme a SR-03**. El art. 5.3 de la Directiva 2002/58/CE y las Directrices 2/2023 del CEPD se utilizan como marco interpretativo, no como fundamento autónomo de obligación frente a un particular.

**Dos consecuencias independientes de lo anterior:**

1. La exención se define por **finalidad y necesidad estricta**, nunca por propiedades técnicas.
2. **`httpOnly` y `SameSite=Lax` son medidas de seguridad** valorables a efectos del art. 32 RGPD; **no son causas de exención**.

## C — Refresh token cookie: análisis específico

**Fuente vigente.** La **Guía sobre el uso de las cookies de la AEPD, versión de mayo de 2024**, mantiene entre las categorías que pueden entenderse excluidas del ámbito del art. 22.2 LSSI las **«cookies de autenticación o identificación de usuario (únicamente de sesión)»**, junto con las de entrada del usuario, seguridad del usuario, sesión de reproductor multimedia, sesión para equilibrar la carga, personalización de la interfaz y determinadas cookies de complemento para intercambiar contenidos sociales; y mantiene que será necesario informar y obtener el consentimiento para cualquier otro tipo de cookies, de primera o de tercera parte, **de sesión o persistentes**. Conserva la recomendación de preferir cookies de sesión y, cuando sea necesario recurrir a persistentes, reducir su duración al mínimo necesario para la finalidad.

**Aplicación al hecho canónico:**

- La **finalidad** es de autenticación: encaja en la categoría.
- La **persistencia de 7 días** no encaja en la acotación literal «únicamente de sesión».

```
PERSISTENT_AUTH_COOKIE_EXEMPTION:
NOT_CONFIRMED

USER_CHOICE_OVER_PERSISTENCE:
RELEVANT_BUT_NOT_DETERMINATIVE

CURRENT_AUTH_COOKIE_CONSENT_REQUIRED:
CONDITIONAL / HUMAN_REVIEW_REQUIRED
```

La elección del usuario **es relevante** para valorar la necesidad estricta respecto de un servicio expresamente solicitado, y es un elemento favorable, pero **no resuelve por sí sola la exención**: la delimitación de la Guía es literal y se refiere a la duración, no a la voluntad del usuario. Una cookie persistente elegida por el usuario sigue siendo una cookie persistente.

**Distinción que debe mantenerse separada:**

| | `PRODUCT_CHOICE` | `LEGAL_CONSENT_ART_22_2` |
|---|---|---|
| Qué es | Opción funcional «mantener la sesión iniciada» | Consentimiento para almacenamiento o acceso no exento |
| Qué acredita | Que el usuario desea permanecer autenticado | Que el usuario ha consentido la escritura en su terminal |
| Requisitos | Diseño de producto | Art. 4.11 y 7 RGPD: informado, específico, inequívoco, no premarcado, revocable |
| Relación | Puede **coincidir** en la interfaz | **No son automáticamente equivalentes** |

Una casilla de producto puede llegar a servir de vehículo del consentimiento del art. 22.2 si se diseña con los requisitos de éste, pero eso es **una decisión de diseño jurídico expresa**, no una consecuencia automática.

## D — Cookies estrictamente necesarias

La única escritura en terminal documentada es la cookie de refresh token. **No se afirma la existencia de ninguna otra.** Cualquier otra cookie, token, `localStorage`, `sessionStorage`, IndexedDB, service worker, píxel o identificador equivalente: `TO_VERIFY_IN_REPOSITORY`. El inventario completo es requisito previo ineludible.

## E — Diferencia entre RGPD y regla de almacenamiento en terminal

| Dimensión | Art. 22.2 LSSI (marco interpretativo: art. 5.3 ePrivacy) | RGPD |
|---|---|---|
| Objeto | Acceso y almacenamiento en el equipo terminal | Tratamiento de datos personales |
| Alcance | Cualquier información, sea o no dato personal | Solo datos personales |
| Habilitación | Consentimiento, salvo excepción de necesidad estricta | Cualquiera de las bases del art. 6 |
| Estándar del consentimiento | El del art. 4.11 y 7 RGPD, por remisión | Art. 4.11 y 7 |
| Orden de aplicación | Primero: si puede escribirse o leerse | Después: si puede tratarse lo obtenido |

Una escritura exenta sigue generando un tratamiento sujeto al RGPD. Y tener base contractual no habilita a escribir en el terminal si no concurre la excepción.

## F — Necesidad o no de consentimiento

`CONDITIONAL / HUMAN_REVIEW_REQUIRED`. Tres vías, todas legítimas:

- **Vía A — reducir a duración de sesión.** Única que sitúa la cookie con seguridad dentro de la categoría exenta tal como la delimita la Guía.
- **Vía B — mantener la persistencia y recabar consentimiento del art. 22.2**, con estándar RGPD, pudiendo vehicularlo en el formulario de acceso.
- **Vía C — mantener la persistencia sosteniendo la necesidad estricta**, con justificación documentada, asumiendo que `PERSISTENT_AUTH_COOKIE_EXEMPTION: NOT_CONFIRMED`.

La elección es jurídico-empresarial y **no se resuelve en este documento**.

## G — Banner o CMP

```
COOKIE_BANNER_REQUIRED:
PENDING_TECHNICAL_INVENTORY

CURRENT_KNOWN_NON_AUTH_TRACKING:
NONE

FINAL_CLASSIFICATION:
PENDING_SR09_TECHNICAL_VERIFICATION
```

No consta a día de hoy ningún elemento de seguimiento distinto de la autenticación, lo cual es coherente con `THIRD_PARTY_ANALYTICS: NO`, `ADVERTISING: NO` y `COMMERCIAL_TRACKING: NO`. Eso no equivale a un inventario verificado.

- **Si la única escritura resulta exenta**, el banner puede resultar innecesario.
- **Si existe almacenamiento no exento**, debe analizarse el mecanismo apropiado **según el momento y la finalidad**, sin asumir que deba ser un banner site-wide.

**Nota general sobre muros de cookies (no es requisito de producto para JobIT).** La Guía vigente parte de que, para que el consentimiento sea libre, el acceso al servicio no puede condicionarse a que el usuario consienta el uso de cookies; y admite que puedan existir supuestos en que la no aceptación impida el acceso total o parcial al servicio, **siempre que se informe adecuadamente y el editor ofrezca una alternativa de acceso sin necesidad de aceptar cookies, alternativa que no tendrá por qué ser necesariamente gratuita** y que debe ser genuinamente equivalente y prestada por el mismo editor. La versión de mayo de 2024 incorpora los criterios del CEPD sobre modelos de «consentimiento o pago», señalando que ofrecer únicamente una alternativa de pago no debe ser el camino por defecto. La cuestión carece de relevancia para la arquitectura actual de JobIT y se mantiene como nota de contexto.

## H — Información que debe facilitarse

```
COOKIE_POLICY_REQUIRED:
CONDITIONAL / PENDING_TECHNICAL_INVENTORY
```

- Si todo el almacenamiento resulta exento, no es exigible una «política de cookies» autónoma; **sí lo es** informar del tratamiento conforme a los arts. 12 y 13 RGPD.
- Si algún elemento no resulta exento, la información previa del art. 22.2 es obligatoria, con el enfoque por capas de la Guía como modelo.

**Recomendación:** incluir en la Política de Privacidad una sección de *almacenamiento en el dispositivo* con cada elemento, finalidad, duración, carácter propio o de tercero y condición de exento o sujeto a consentimiento.

## I — Duración

La Guía recomienda preferir cookies de sesión y, cuando sea necesario usar persistentes, reducir su duración al mínimo necesario. Los 7 días actuales no son ilícitos por sí mismos, pero **carecen hoy de justificación de necesidad documentada**. Ése es el déficit real.

## J — Analítica y medición de audiencia *(sección corregida en v1.2)*

```
AUDIENCE_MEASUREMENT_COOKIES:
CONDITIONAL

CONSENT_EXEMPTION:
POSSIBLE_UNDER_AEPD_JAN_2024_GUIDE
```

**CORRECCIÓN APLICADA.** La v1.1 afirmaba que cualquier cookie o tecnología de analítica o medición, propia o de tercero, requiere consentimiento, y que la analítica de primera parte no está exenta. **Ambas formulaciones se retiran por incorrectas en términos generales.**

El **11 de enero de 2024 la AEPD publicó la «Guía Uso de cookies para herramientas de medición de audiencia»**, que complementa la Guía general de cookies y establece los criterios y garantías necesarios para que las cookies utilizadas con fines estadísticos de medición de tráfico o de rendimiento **puedan considerarse estrictamente necesarias para la prestación del servicio y, por tanto, entenderse exentas del consentimiento conforme al art. 22.2 LSSI**. La Guía parte de que la gestión de un sitio web o de una aplicación requiere generalmente estadísticas de tráfico o rendimiento que a menudo son esenciales para la prestación del servicio.

**La exención no es automática: es condicional y está sujeta a garantías estrictas** que deben analizarse caso por caso, entre otras:

- finalidad **estrictamente limitada** a la medición de audiencia del propio sitio o aplicación;
- tratamiento **por cuenta exclusiva del editor**;
- producción de **estadísticas anónimas o agregadas**;
- **no reutilización** para otras finalidades;
- **no cruce ni combinación** con otros tratamientos;
- **no transmisión no permitida a terceros**;
- **no seguimiento del usuario entre sitios o aplicaciones**;
- **garantías adicionales cuando se recurre a un proveedor de servicios de medición que da servicio a varios editores** (la Guía dedica un apartado específico a este supuesto);
- **límites temporales** previstos en la Guía respecto de la vida de las cookies y de la conservación de los datos, que deben verificarse contra el texto de la Guía en el momento en que se plantee la implantación.

**Dos formulaciones que no deben utilizarse:**

```
FIRST_PARTY_ANALYTICS: ALWAYS_REQUIRES_CONSENT   → INCORRECTO
THIRD_PARTY_ANALYTICS: ALWAYS_EXEMPT             → INCORRECTO
```

La clasificación **depende de la configuración concreta y de las garantías implementadas**, no de que el proveedor sea propio o ajeno. Una solución de primera parte mal configurada —que reutilice datos, cruce tratamientos o permita seguimiento— no está exenta; y una solución de tercero puede llegar a estarlo si el tercero actúa exclusivamente por cuenta del editor y se cumplen las garantías, incluidas las adicionales previstas para proveedores multi-editor.

**Alcance de esta corrección.** Afecta al análisis prospectivo, no al estado actual:

```
THIRD_PARTY_ANALYTICS:   NO   (decisión empresarial vigente)
ADVERTISING:             NO   (decisión empresarial vigente)
COMMERCIAL_TRACKING:     NO   (decisión empresarial vigente)
```

**Esta corrección no autoriza analítica en JobIT.** La analítica permanece excluida por decisión empresarial y sujeta a la puerta de revisión previa (`NEW_DATA_PROCESSING_PROVIDER_GATE`), y en `DO_NOT_IMPLEMENT_UNTIL_HUMAN_REVIEW`. Lo que la corrección aporta es que, **si en el futuro se plantea introducir medición de audiencia, el punto de partida del análisis no es «hace falta banner», sino el test de condiciones y garantías de la Guía de enero de 2024**, cuyo resultado puede ser la exención.

Se mantiene sin cambios que la **publicidad comportamental** requiere consentimiento y queda fuera de cualquier exención.

## K — `localStorage` y `sessionStorage`

La regla no se refiere a «cookies» sino a dispositivos de almacenamiento y recuperación de datos en equipos terminales, y las Directrices 2/2023 del CEPD confirman que alcanza a mecanismos distintos de las cookies. Si JobIT utiliza `localStorage` o `sessionStorage` para el access token o para cualquier otro dato, queda sujeto al mismo análisis. Estado: `TO_VERIFY_IN_REPOSITORY`.

---

```
TECHNICAL_CHANGES_REQUIRED (sujeto a DESIGN_ONLY y a revisión humana):

1. Inventariar exhaustivamente el almacenamiento en terminal.
2. Adoptar decisión motivada entre las vías A, B y C sobre la persistencia.
3. Verificar y, en su caso, establecer el flag Secure (art. 32 RGPD).
4. Documentar el mecanismo de revocación del refresh token.
5. Preparar la sección de almacenamiento en dispositivo de la Política de Privacidad.

TO_VERIFY_IN_REPOSITORY:

- flag Secure; Domain; Path
- mecanismo de revocación y de rotación del refresh token
- fingerprinting o vinculación a dispositivo
- forma de almacenamiento del access token
- logs asociados a la autenticación
- uso de localStorage / sessionStorage
- cualquier otra cookie o mecanismo de almacenamiento
- existencia de una opción de usuario sobre la persistencia de la sesión

FUTURE_REASSESSMENT_TRIGGERS:

- introducción de medición de audiencia → aplicar el test de condiciones y
  garantías de la Guía AEPD de enero de 2024; el resultado puede ser exención
  o consentimiento, según configuración
- publicidad comportamental → consentimiento, sin exención posible
- CDN, widgets, mapas, fuentes web o recursos de terceros que escriban en terminal
- SSO o federación de identidad
- ampliación de la persistencia o del alcance del refresh token
- aplicación móvil con identificadores de dispositivo
- chat, soporte embebido o vídeo de terceros
```

---

**REFERENCE:** SR-09
**CONCLUSION:** La finalidad de autenticación encaja en la categoría exenta; la persistencia de 7 días queda fuera de su acotación literal. La exención de una cookie de autenticación persistente **no está confirmada**. La elección del usuario es relevante pero no determinante. `httpOnly` y `SameSite` no determinan la exención. La procedencia de banner queda pendiente del inventario técnico. **La medición de audiencia no requiere consentimiento en todo caso**: puede quedar exenta bajo las condiciones y garantías de la Guía específica de la AEPD de enero de 2024, sin que ello autorice su implantación en JobIT.
**CLASSIFICATION:** CONDITIONAL / HUMAN_REVIEW_REQUIRED
**OFFICIAL_LEGAL_BASIS:** RGPD arts. 4.11, 6.1.b), 6.1.f), 7, 12, 13, 32; Ley 34/2002, art. 22.2. Marco interpretativo: Directiva 2002/58/CE, art. 5.3.
**OFFICIAL_SOURCES:** AEPD, «Guía sobre el uso de las cookies», versión de mayo de 2024; **AEPD, «Guía Uso de cookies para herramientas de medición de audiencia», versión de enero de 2024**; GT29 WP194; EDPB Guidelines 2/2023 y 03/2022; Dictamen del CEPD sobre modelos de consentimiento o pago (abril de 2024).
**FACTS_USED:** autenticación propia; refresh token en cookie; finalidad de autenticación; `httpOnly`; `SameSite=Lax`; persistencia de 7 días; ausencia de analytics, publicidad y tracking.
**RESPONSIBLE_DECISIONS_USED:** THIRD_PARTY_ANALYTICS: NO; ADVERTISING: NO; COMMERCIAL_TRACKING: NO.
**SPECIALIST_REASONING_SUMMARY:** El apartado acumula dos errores del mismo tipo, ambos corregidos: tratar como absoluto lo que la normativa articula como condicional. La exención de autenticación no depende de la voluntad del usuario ni de propiedades técnicas, sino de la finalidad y de la duración; y la analítica no está sujeta a consentimiento por definición, sino en función de si cumple o no las condiciones de la guía específica. En ambos casos la respuesta correcta es un test, no una regla.
**REQUIRED_BEFORE_TRAMO_B:** inventario completo del almacenamiento en terminal; decisión motivada entre las vías A, B y C con validación humana; verificación de los campos `TO_VERIFY_IN_REPOSITORY`; documentación de la justificación de necesidad de la duración elegida.
**NON_BLOCKING_RECOMMENDATIONS:** documentar el razonamiento sobre la duración con independencia de la vía elegida; si algún día se plantea medición de audiencia, partir del test de la Guía de enero de 2024 y documentar el cumplimiento de cada garantía antes de decidir el mecanismo de consentimiento.
**PRIVATE_INFORMATION_REQUIRED:** NO
**BLOCKS_LEGAL_GATE:** YES — no puede redactarse la información sobre almacenamiento en terminal antes de cerrar el inventario y la decisión de persistencia.
**CONFIDENCE_OR_OPEN_INTERPRETATION:** Media. Interpretación abierta y no resuelta: si un refresh token de duración limitada puede considerarse parte del mecanismo de autenticación estrictamente necesario pese a no ser cookie de sesión. No consta pronunciamiento específico de la AEPD sobre este patrón. Requiere criterio humano.

---

# REFERENCE: SR-10 — PROVEEDORES, ENCARGADOS, SUBENCARGADOS Y TRANSFERENCIAS

> **Sin cambios respecto de la v1.1**, salvo la referencia cruzada al art. 19 que se introduce en SR-12: los encargados que se identifiquen aquí serán **destinatarios** a efectos de dicho precepto (ver SR-12, sección 10).

## Marco de calificación de roles

| Rol | Criterio |
|---|---|
| **CONTROLLER** | Determina fines y medios |
| **PROCESSOR** | Trata por cuenta del responsable, siguiendo sus instrucciones |
| **SUBPROCESSOR** | Contratado por el encargado para tareas del tratamiento |
| **INDEPENDENT_CONTROLLER** | Determina fines propios sobre los mismos datos |
| **JOINT_CONTROLLER** | Determina conjuntamente fines y medios |

**Componentes de servicio ≠ proveedores.** Alojamiento, almacenamiento y copias de seguridad son **componentes de servicio** (`SERVICE_COMPONENT`) y pueden pertenecer al mismo encargado, ser operados directamente dentro de infraestructura ya contratada, o corresponder a proveedores distintos. Cuál de las tres situaciones concurre es `TO_VERIFY`. El futuro RAT debe reflejar **encargados reales**, no componentes técnicos convertidos en encargados.

---

## MATRIZ DE COMPONENTES DE SERVICIO

### 1. Alojamiento y cómputo

```
SERVICE_COMPONENT:      Hosting / compute
PURPOSE:                Ejecución de la aplicación y prestación del servicio
EXTERNAL_PROVIDER:      YES (INITIAL_INFRASTRUCTURE: USE_ALREADY_PLANNED_HOSTING)
ROLE:                   PROCESSOR_IF_EXTERNAL_AND_PROCESSING_ON_JOBIT_INSTRUCTIONS
DISTINCT_PROCESSOR:     N/A — componente de referencia
PERSONAL_DATA:          Todas las categorías de las actividades A-M
LOCATION:               PRIVATE_INFORMATION_REQUIRED
SUBPROCESSORS:          TO_VERIFY
CONTRACT_ART_28:        TO_VERIFY
TRANSFER_OUTSIDE_EEA:   TO_VERIFY
TRANSFER_MECHANISM:     TO_VERIFY
TRANSFER_ASSESSMENT:    DEPENDS_ON_MECHANISM_AND_DESTINATION
ADEQUACY_DECISION:      CHECK_IF_APPLICABLE
ARTICLE_46_TOOL:        ASSESS_EFFECTIVENESS_AND_SUPPLEMENTARY_MEASURES_WHERE_REQUIRED
STATUS:                 IN_CURRENT_PRODUCTION_SCOPE
ARTICLE_19_RECIPIENT:   YES (ver SR-12.10)
OPEN_ITEMS:             identidad y región del proveedor; existencia de DPA; lista y
                        ubicación de subencargados; régimen de notificación (art. 28.2)
```

### 2. Base de datos y almacenamiento

```
SERVICE_COMPONENT:      Database / storage
PURPOSE:                Persistencia de cuenta, perfil, ofertas guardadas y portfolio
EXTERNAL_PROVIDER:      TO_VERIFY
ROLE:                   PROCESSOR_IF_EXTERNAL_AND_PROCESSING_ON_JOBIT_INSTRUCTIONS
DISTINCT_PROCESSOR:     TO_VERIFY — puede coincidir con el componente 1
PERSONAL_DATA:          A, C, D, E, G, I, J, K
LOCATION:               TO_VERIFY / PRIVATE_INFORMATION_REQUIRED
SUBPROCESSORS:          TO_VERIFY
CONTRACT_ART_28:        TO_VERIFY — si coincide con el componente 1, el mismo contrato
                        puede cubrirlo; no firmar un DPA adicional por duplicado
TRANSFER_OUTSIDE_EEA:   TO_VERIFY
TRANSFER_ASSESSMENT:    DEPENDS_ON_MECHANISM_AND_DESTINATION
STATUS:                 IN_CURRENT_PRODUCTION_SCOPE
ARTICLE_19_RECIPIENT:   YES_IF_EXTERNAL (ver SR-12.10)
OPEN_ITEMS:             si es servicio gestionado del mismo proveedor, proveedor distinto
                        o base operada directamente sobre infraestructura ya contratada;
                        cifrado en reposo (TO_VERIFY, SR-06)
```

### 3. Copias de seguridad

```
SERVICE_COMPONENT:      Backups
PURPOSE:                Disponibilidad, integridad y restauración (art. 32.1.b y c)
EXTERNAL_PROVIDER:      TO_VERIFY
ROLE:                   PROCESSOR_IF_EXTERNAL_AND_PROCESSING_ON_JOBIT_INSTRUCTIONS
DISTINCT_PROCESSOR:     TO_VERIFY — con frecuencia coincide con 1 o 2
PERSONAL_DATA:          Copia de todas las categorías
LOCATION:               TO_VERIFY — **puede diferir de la del cómputo**
SUBPROCESSORS:          TO_VERIFY
CONTRACT_ART_28:        TO_VERIFY
TRANSFER_OUTSIDE_EEA:   TO_VERIFY
TRANSFER_ASSESSMENT:    DEPENDS_ON_MECHANISM_AND_DESTINATION
STATUS:                 IN_CURRENT_PRODUCTION_SCOPE
ARTICLE_19_RECIPIENT:   YES_IF_EXTERNAL (ver SR-12.10)
OPEN_ITEMS:             **punto ciego habitual**: un proveedor con región europea puede
                        replicar copias fuera del EEE por configuración por defecto
```

### 4. Correo transaccional

```
SERVICE_COMPONENT:      Transactional email
EXTERNAL_PROVIDER:      NOT_PLANNED_FOR_INITIAL_PRODUCTION
ROLE:                   PROCESSOR_IF_EXTERNAL (si llegara a incorporarse)
STATUS:                 NOT_IN_CURRENT_PRODUCTION_SCOPE
ARTICLE_19_RECIPIENT:   YES_IF_INCORPORATED
OPEN_ITEMS:             reserva heredada de SR-03: notificación de cambios de Términos,
                        comunicación del art. 34 RGPD y recuperación de credenciales.
                        Sigue abierta
```

### 5. CDN

```
SERVICE_COMPONENT:      CDN / edge
EXTERNAL_PROVIDER:      NOT_IN_CURRENT_PRODUCTION_SCOPE
ROLE:                   PROCESSOR_IF_EXTERNAL — calificar caso a caso
STATUS:                 NOT_IN_CURRENT_PRODUCTION_SCOPE
OPEN_ITEMS:             afectaría a SR-09 (escritura en terminal), a SR-10 (nodos fuera
                        del EEE) y al portfolio público (caché de contenido publicado)
```

### 6. Analítica

```
SERVICE_COMPONENT:      Analytics / audience measurement
STATUS:                 EXCLUDED_BY_BUSINESS_DECISION (THIRD_PARTY_ANALYTICS: NO)
OPEN_ITEMS:             su introducción activaría el test de la Guía AEPD de enero de
                        2024 (SR-09.J) y una fila completa aquí. Si el proveedor da
                        servicio a varios editores, garantías adicionales
```

### 7. Observabilidad, logs y monitorización

```
SERVICE_COMPONENT:      Observability / logging / APM / error tracking
EXTERNAL_PROVIDER:      TO_VERIFY
ROLE:                   PROCESSOR_IF_EXTERNAL_AND_PROCESSING_ON_JOBIT_INSTRUCTIONS
STATUS:                 NOT_IN_CURRENT_PRODUCTION_SCOPE / TO_VERIFY
ARTICLE_19_RECIPIENT:   YES_IF_EXISTS_AND_PROCESSES_PERSONAL_DATA
OPEN_ITEMS:             **categoría de mayor riesgo silencioso.** Captura con frecuencia
                        datos personales de forma no intencionada y suele incorporarse
                        sin revisión previa. Afectaría al hecho canónico "req.ip no se
                        registra en logs" de SR-02.L
```

### 8. Fuentes de ofertas de empleo

```
SERVICE_COMPONENT:      Job offer sources
EXTERNAL_PROVIDER:      TO_VERIFY
ROLE:                   TO_VERIFY
PERSONAL_DATA:          Respecto de candidatos: en principio ninguno
STATUS:                 TO_VERIFY
OPEN_ITEMS:             origen no incluido en los hechos canónicos. **Ninguna
                        configuración admisible puede implicar flujo de datos de
                        candidatos hacia esas fuentes** (RECRUITER_DATABASE_ACCESS: NO)
```

### 9. Proveedores de IA

```
SERVICE_COMPONENT:      AI / LLM providers
STATUS:                 NOT_IN_CURRENT_PRODUCTION_SCOPE
OPEN_ITEMS:             activaría SR-10, SR-08 Parte D y el recuento de SR-07
```

---

## Requisitos para incorporar un nuevo proveedor

1. **Calificación del rol** motivada, incluyendo si el proveedor ya presta otros componentes.
2. **Garantías suficientes** del art. 28.1.
3. **Contrato del art. 28.3** con su contenido obligatorio.
4. **Régimen de subencargados** del art. 28.2 y 28.4.
5. **Ubicación de tratamiento y de copias.**
6. **Si hay transferencia fuera del EEE:**
   ```
   ADEQUACY_DECISION:   CHECK_IF_APPLICABLE
   ARTICLE_46_TOOL:     ASSESS_EFFECTIVENESS_AND_SUPPLEMENTARY_MEASURES_WHERE_REQUIRED
   ARTICLE_49:          RESIDUAL_ONLY
   TRANSFER_ASSESSMENT: DEPENDS_ON_MECHANISM_AND_DESTINATION
   ```
7. **Evaluación de seguridad** del art. 32.
8. **Actualización del RAT** y de la Política de Privacidad (arts. 13.1.e) y f)).
9. **Recomprobación de SR-07.**
10. **Registro de la decisión** con fecha y responsable.
11. *(referencia v1.2)* **Incorporación del nuevo encargado al mecanismo de propagación del art. 19** (ver SR-12.10 y Development Guidance).

---

## Portfolio público y transferencia internacional

**Marco.** Directrices 05/2021 del CEPD, v2.0: tres criterios acumulativos — exportador sujeto al RGPD; comunicación por transmisión o puesta a disposición **a otro responsable, corresponsable o encargado**; importador en tercer país.

**Aplicación:** criterios 1 y 3 podrían concurrir; **el criterio 2 no se cumple**, porque el destinatario de una página pública es el público en general, no un importador identificado. Al ser acumulativos, no hay transferencia. Las propias Directrices citan la STJUE **Lindqvist (C-101/01)**, conforme a la cual no existe transferencia a un tercer país cuando los datos se publican en un sitio web alojado con un prestador establecido en la Unión.

```
PUBLIC_PORTFOLIO_AS_CHAPTER_V_TRANSFER:
NO_ON_CURRENT_ANALYSIS

HUMAN_VALIDATION:
PENDING
```

**Tres precisiones:** (1) puede haber transferencia por la **infraestructura** que sirve el portfolio; (2) no hay transferencia, pero **sí deber de información** sobre accesibilidad mundial, indexación y cachés (arts. 5.1.a y 13); (3) Lindqvist es anterior al RGPD y las Directrices no abordan monográficamente la publicación abierta.

---

**REFERENCE:** SR-10
**CONCLUSION:** Matriz por componentes de servicio, sin duplicar encargados. Tres componentes en alcance, con `EXTERNAL_PROVIDER` y `DISTINCT_PROCESSOR` pendientes. El análisis de transferencia se articula por mecanismo y destino. La accesibilidad mundial del portfolio no constituye transferencia del capítulo V en el análisis actual, pendiente de validación; sí puede haberla por la infraestructura.
**CLASSIFICATION:** INFORMATION_REQUIRED
**OFFICIAL_LEGAL_BASIS:** RGPD arts. 4.7, 4.8, **4.9**, 24, 26, 28, 29, 30.1, 32, 44 a 49, 13.1.e) y f).
**OFFICIAL_SOURCES:** EDPB Guidelines 05/2021 v2.0; EDPB Guidelines 07/2020; STJUE C-101/01; Decisión de Ejecución (UE) 2021/914.
**FACTS_USED:** INITIAL_INFRASTRUCTURE: USE_ALREADY_PLANNED_HOSTING; TRANSACTIONAL_EMAIL_PROVIDER: NOT_PLANNED_FOR_INITIAL_PRODUCTION; sin analytics, publicidad ni tracking; portfolio opt-in.
**RESPONSIBLE_DECISIONS_USED:** NEW_DATA_PROCESSING_PROVIDER_GATE: MANDATORY_PRE_PRODUCTION_REVIEW; RECRUITER_DATABASE_ACCESS: NO.
**SPECIALIST_REASONING_SUMMARY:** Sin cambios respecto de la v1.1. Se añade únicamente la referencia cruzada al art. 19: cada encargado identificado aquí será destinatario a efectos de propagación de rectificación, supresión y limitación.
**REQUIRED_BEFORE_TRAMO_B:** (1) identidad del proveedor y componentes que presta; (2) región de tratamiento y **región de copias**; (3) contrato del art. 28; (4) subencargados; (5) determinación de transferencia y mecanismo; (6) verificación de observabilidad o logging; (7) formalización de la puerta de incorporación.
**NON_BLOCKING_RECOMMENDATIONS:** verificar la región de las copias; mantener la lista de encargados versionada junto al RAT.
**PRIVATE_INFORMATION_REQUIRED:** YES
**IF_YES:** (a) identidad del proveedor de alojamiento y componentes que presta; (b) región de tratamiento y de copias; (c) existencia y referencia del contrato de encargado; (d) lista de subencargados con ubicación.
**BLOCKS_LEGAL_GATE:** YES
**CONFIDENCE_OR_OPEN_INTERPRETATION:** Alta sobre marco y requisitos. Media-alta sobre la no calificación del portfolio como transferencia.

---

# REFERENCE: SR-11 — CONSERVACIÓN, SUPRESIÓN E INACTIVIDAD

> **Sin cambios respecto de la v1.1.** Se reproduce íntegro por tratarse de documento único.

## Marco previo

```
LEGAL_RETENTION_REQUIREMENT   Plazo impuesto por norma. Debe citarse la norma.
BUSINESS_RETENTION_CHOICE     Decisión del responsable dentro del margen del art. 5.1.e).
TECHNICAL_BACKUP_LIFECYCLE    Ciclo de rotación de copias. No es plazo de conservación.
```

```
ACTIVE_SYSTEM_DELETION   Supresión en sistemas activos.
BACKUP_EXPIRATION        Desaparición del dato al completarse la rotación.
LEGAL_HOLD               Suspensión de la supresión por requerimiento o litigio.
EVIDENCE_RETENTION       Conservación de evidencia de cumplimiento (arts. 5.2, 7.1, 24).
```

## Plazos legales

```
SPECIFIC_RETENTION_PERIODS_IDENTIFIED_ON_CURRENT_FACTS:
NONE

FINAL_RETENTION_MAPPING:
HUMAN_REVIEW_REQUIRED
```

Sobre los hechos actuales no se identifican plazos específicos de conservación aplicables: no hay facturación ni obligaciones tributarias asociadas, no se identifican obligaciones sectoriales aplicables al responsable y no hay conservación de datos de tráfico. **El mapeo definitivo requiere revisión humana.**

**El art. 1964.2 CC no debe utilizarse como plazo universal.** Puede ser referencia pertinente para determinadas responsabilidades contractuales cuando resulte jurídicamente aplicable, pero no es plazo general de conservación, ni de evidencia, ni de bloqueo. Cada supuesto exige identificar **la responsabilidad concreta** y su régimen de prescripción.

En defecto de plazo legal, corresponde al responsable fijarlos conforme al art. 5.1.e), documentarlos y revisarlos periódicamente. El art. 30.1.f) exige incluirlos en el RAT cuando sea posible.

## Bloqueo del art. 32 LOPDGDD

```
ART_32_LOPDGDD_BLOCKING:   REQUIRED
TECHNICAL_IMPLEMENTATION:  TO_DESIGN
POSSIBLE_PATTERNS:
- logical blocking state
- segregated restricted record
- secure evidentiary copy where art. 32.4 applies
FINAL_PATTERN:             TECHNICAL + HUMAN_LEGAL_REVIEW_REQUIRED
```

El art. 32 obliga a **bloquear** los datos cuando proceda su rectificación o supresión: identificación y reserva, con medidas que impidan su tratamiento, incluida su visualización, **excepto para la puesta a disposición de jueces y tribunales, el Ministerio Fiscal o las Administraciones Públicas competentes, en particular las autoridades de protección de datos, para la exigencia de posibles responsabilidades y solo por el plazo de prescripción de las mismas**; transcurrido ese plazo, destrucción. Los datos bloqueados no pueden tratarse para otra finalidad.

- **Art. 32.4:** cuando los sistemas **no permitieran el bloqueo** o éste **exigiera un esfuerzo desproporcionado**, procede el **copiado seguro** de la información, con evidencia digital u otro medio que acredite autenticidad, fecha de bloqueo y no manipulación.
- **Art. 32.5:** la AEPD y las autoridades autonómicas **podrán fijar excepciones** cuando, atendida la naturaleza de los datos o el número particularmente elevado de afectados, la conservación resulte imposible o implique esfuerzo desproporcionado.

**Duración del bloqueo:** ligada al plazo de prescripción de **la responsabilidad concreta**, no a un plazo genérico.

---

## MATRIZ DE CONSERVACIÓN POR ACTIVIDAD

### A — Cuenta
```
DATA:                      Email, credencial, identificador de cuenta
BUSINESS_STATE:            WHILE_ACCOUNT_REMAINS_ACTIVE
LEGAL_RETENTION_DRIVER:    Ninguno identificado. Art. 5.1.e)
PROPOSED_RETENTION_RULE:   Mientras la cuenta permanezca abierta; tras el cierre,
                           supresión con el mecanismo de bloqueo del art. 32 LOPDGDD
FIXED_PERIOD_REQUIRED:     NO
START_EVENT:               Cierre de cuenta solicitado por el usuario
BACKUP_IMPACT:             Desaparición al completarse la rotación
OPEN_ITEM:                 duración del bloqueo; decisión sobre identificador
                           irreversible anti re-registro y su base
```

### B — Autenticación y sesión
```
DATA:                      Refresh token, identificadores de sesión
PROPOSED_RETENTION_RULE:   Vida del token; revocación al cerrar sesión o cuenta
FIXED_PERIOD_REQUIRED:     NO — duración a justificar (SR-09.I)
OPEN_ITEM:                 **el mecanismo de revocación es TO_VERIFY y es condición
                           material de la efectividad de la supresión**
```

### C, D, E — Perfil/CV, componentes y preferencias
```
BUSINESS_STATE:            WHILE_ACCOUNT_REMAINS_ACTIVE
PROPOSED_RETENTION_RULE:   Igual que la cuenta; eliminación granular a instancia del usuario
OPEN_ITEM:                 alcance del autoservicio: TO_VERIFY_IN_REPOSITORY
```

### F, G — Búsqueda y ofertas guardadas
```
PROPOSED_RETENTION_RULE:   Mientras el usuario las mantenga y la cuenta esté abierta
OPEN_ITEM:                 **no se afirma la existencia de histórico de búsquedas**
```

### H — Match
```
DATA:                      Ninguno persistido (canónico)
PROPOSED_RETENTION_RULE:   No aplica
OPEN_ITEM:                 consignar la no persistencia en el RAT
```

### I — Portfolio público
```
BUSINESS_STATE:            AFTER_UNPUBLISH / AFTER_ACCOUNT_CLOSURE: REMOVE_ASAP
PROPOSED_RETENTION_RULE:   Retirada del acceso público inmediata y efectiva
BACKUP_IMPACT:             Garantizar que una restauración **no republica** contenido
                           despublicado. Riesgo más concreto de la matriz
OPEN_ITEM:                 evidencia del consentimiento retirado (art. 7.1); cachés e
                           indexación de terceros (ver SR-12.10, art. 19)
```

### J — Soporte
```
PROPOSED_RETENTION_RULE:   Plazo propio, más corto que el de la cuenta, a definir
OPEN_ITEM:                 separación interna entre soporte y derechos
```

### K — Ejercicio de derechos
```
LEGAL_RETENTION_DRIVER:    Arts. 5.2 y 24 RGPD; art. 12 LOPDGDD
PROPOSED_RETENTION_RULE:   EVIDENCE_RETENTION motivada por responsabilidad concreta
OPEN_ITEM:                 conservar aunque la cuenta se haya suprimido
```

### Aceptación de Términos y consentimientos
```
LEGAL_RETENTION_DRIVER:    Art. 7.1 RGPD; carga de la prueba de incorporación
PROPOSED_RETENTION_RULE:   EVIDENCE_RETENTION durante el periodo de exigibilidad
OPEN_ITEM:                 conservar el artefacto documental versionado, no solo el hash
```

### L — Seguridad y rate limiting
```
BUSINESS_STATE:            Efímera, en memoria, no persistida, no registrada (canónico)
PROPOSED_RETENTION_RULE:   **No aplica: no hay conservación.** Consignar literalmente
OPEN_ITEM:                 persistencia futura exigiría base, plazo y actualización
```

### M — Backups
```
LEGAL_RETENTION_DRIVER:    Art. 32.1.b) y c) RGPD
PROPOSED_RETENTION_RULE:   TECHNICAL_BACKUP_LIFECYCLE declarado y acotado
OPEN_ITEM:                 existencia, configuración y cifrado: TO_VERIFY;
                           procedimiento de supresión diferida documentado
```

### Incidentes de seguridad
```
LEGAL_RETENTION_DRIVER:    Art. 33.5 RGPD — obligación de documentar
PROPOSED_RETENTION_RULE:   EVIDENCE_RETENTION. Plazo a definir
OPEN_ITEM:                 contiene datos reales; no versionar en repositorio
```

---

## Análisis de `AUTOMATIC_INACTIVITY_DELETION: NO_INITIAL_PRODUCTION`

**Sostenible en primera producción, con condiciones. No de forma indefinida.**

Mientras la cuenta permanezca abierta subsiste el contrato del art. 6.1.b) y la conservación tiene fin; la ausencia de borrado automático no equivale a conservación indefinida si existe vía real de cierre. El riesgo se acumula con el tiempo.

**Condiciones:** (1) cierre manual disponible, localizable y funcional; (2) información en la Política de Privacidad; (3) hito documentado de revisión; (4) registro como `BUSINESS_RETENTION_CHOICE`.

**Recomendación:** preferir aviso previo con oportunidad de reactivación frente a supresión automática silenciosa.

---

**REFERENCE:** SR-11
**CONCLUSION:** Sin cambios respecto de la v1.1. No se identifican plazos específicos sobre los hechos actuales; el mapeo definitivo requiere revisión humana. El bloqueo del art. 32 LOPDGDD es obligatorio con al menos tres patrones posibles. La decisión de inactividad es sostenible bajo cuatro condiciones.
**CLASSIFICATION:** CONDITIONAL / INFORMATION_REQUIRED
**OFFICIAL_LEGAL_BASIS:** RGPD arts. 5.1.e), 5.2, 7.1, 17, 24, 30.1.f), 32, 33.5; LOPDGDD arts. 5, 31 y 32 (apartados 1 a 5); Código Civil art. 1964.2 (acotado).
**OFFICIAL_SOURCES:** EUR-Lex; BOE; AEPD.
**FACTS_USED / RESPONSIBLE_DECISIONS_USED:** los declarados en el bloque canónico de conservación.
**SPECIALIST_REASONING_SUMMARY:** Sin cambios.
**REQUIRED_BEFORE_TRAMO_B:** (1) fijar y motivar plazos identificando la responsabilidad concreta; (2) diseñar el mecanismo de bloqueo eligiendo patrón; (3) garantizar la no republicación desde copias; (4) verificar la revocación del refresh token; (5) documentar la decisión de inactividad; (6) declarar el ciclo de rotación.
**NON_BLOCKING_RECOMMENDATIONS:** expresar plazos mediante criterios cuando las cifras no estén decididas; revisión anual junto con el RAT.
**PRIVATE_INFORMATION_REQUIRED:** NO
**BLOCKS_LEGAL_GATE:** YES
**CONFIDENCE_OR_OPEN_INTERPRETATION:** Alta sobre la obligación de bloqueo. Abierta: duración concreta y patrón de implementación.

---

# REFERENCE: SR-12 — EJERCICIO DE DERECHOS (v1.2)

## Marco general

**Plazos.** Art. 12.3: un mes desde la recepción, prorrogable dos meses más informando dentro del primer mes. Art. 12.4: si no se atiende, informar en un mes de las razones y de la posibilidad de reclamar y de ejercitar acciones judiciales.

**Gratuidad.** Art. 12.5; el carácter manifiestamente infundado o excesivo debe demostrarlo el responsable.

**Identificación.** Arts. 11.2 y 12.6. **Especialidades nacionales.** Arts. 12 a 18 LOPDGDD. **Formato.** Art. 12.1 y 12.3.

---

## Resumen de derechos

```
DATA_SUBJECT_RIGHTS:      APPLY_PER_PROCESSING_AND_LEGAL_BASIS

ACCESS:                   YES
RECTIFICATION:            YES
ERASURE:                  YES_WHERE_ART17_GROUNDS_APPLY
RESTRICTION:              YES_WHERE_ART18_CONDITIONS_APPLY
PORTABILITY:              CONDITIONAL_SCOPE
OBJECTION:                CONDITIONAL_SCOPE
ARTICLE_22_3:             NOT_APPLICABLE_ON_CURRENT_MATCH_FACTS
CONSENT_WITHDRAWAL:       YES_FOR_CONSENT_BASED_PROCESSING
ARTICLE_19_NOTIFICATION:  APPLIES_TO_EACH_RELEVANT_RECIPIENT_UNLESS_IMPOSSIBLE_OR_DISPROPORTIONATE
COMPLAINT_TO_AUTHORITY:   YES (información obligatoria)
```

---

## Análisis por derecho

### 1. Información (arts. 13 y 14)
```
APPLIES:                 YES (art. 13; el art. 14 no aplica)
CURRENT_IMPLEMENTATION:  TO_VERIFY — Política de Privacidad no publicada
LEGAL_DEADLINE:          En el momento de la obtención
TECHNICAL_REQUIREMENT:   Capa informativa en el registro con enlace al texto completo
OPEN_ITEMS:              bloqueado por SR-01, SR-10 y SR-11
```

### 2. Acceso y copia (art. 15)
```
APPLIES:                 YES
CURRENT_IMPLEMENTATION:  MANUAL / PARTIAL
LEGAL_DEADLINE:          1 mes · EXTENSION: +2 meses con información en el primer mes
RESPONSE_REQUIREMENTS:   Copia de los datos e información del art. 15.1.a) a h);
                         formato electrónico de uso común si la solicitud es electrónica
TECHNICAL_REQUIREMENT:   Procedimiento reproducible de extracción por usuario
```

```
BACKUP_DATA_ACCESS_HANDLING:
HUMAN_REVIEW_REQUIRED

DO_NOT_ASSUME:
RESTORE_ALL_BACKUPS_FOR_EVERY_ACCESS_REQUEST
```

Lo exigible es cubrir **los datos personales objeto de tratamiento** y la información del art. 15.1. Riesgo real que se mantiene: **es habitual omitir el histórico de soporte y las evidencias de aceptación y de consentimiento**, que son datos en tratamiento activo y sí deben incluirse. El tratamiento operativo de copias de seguridad, datos bloqueados y archivos históricos **requiere análisis específico y revisión humana**.

### 3. Rectificación (art. 16)
```
APPLIES:                 YES
CURRENT_IMPLEMENTATION:  SELF_SERVICE (parcial)
TECHNICAL_REQUIREMENT:   Que el autoservicio cubra los campos rectificables
OPEN_ITEMS:              alcance: TO_VERIFY_IN_REPOSITORY. Si el portfolio está
                         publicado, la rectificación debe propagarse a la versión
                         pública **y activar el art. 19 respecto de los destinatarios**
```

### 4. Supresión (art. 17)
```
APPLIES:                 YES_WHERE_ART17_GROUNDS_APPLY
CURRENT_IMPLEMENTATION:  MANUAL (cuenta completa) + SELF_SERVICE parcial (granular)
LEGAL_DEADLINE:          1 mes
TECHNICAL_REQUIREMENT:   Supresión en sistemas activos + mecanismo de bloqueo del
                         art. 32 LOPDGDD + revocación efectiva de tokens + no
                         republicación desde copias + retirada inmediata del portfolio
                         **+ propagación a destinatarios (art. 19)**
LEGAL_REQUIREMENT:       Concurrencia de causa del art. 17.1; excepciones del art. 17.3
```

### 5. Limitación (art. 18)
```
APPLIES:                 YES_WHERE_ART18_CONDITIONS_APPLY
CURRENT_IMPLEMENTATION:  MANUAL
RESPONSE_REQUIREMENTS:   Informar antes del levantamiento (art. 18.3)

RESTRICTION_STATE:       BLOCK_NORMAL_PRODUCT_PROCESSING
STORAGE:                 ALLOWED
EXCEPTIONAL_PROCESSING:  ONLY_WHERE_ART_18_2_CONDITIONS_ALLOW_IT
```

El art. 18.2 permite que los datos limitados, **con excepción de su conservación**, sean tratados con el consentimiento del interesado, para la formulación, el ejercicio o la defensa de reclamaciones, con miras a la protección de los derechos de otra persona, o por razones de interés público importante. La conservación no solo está permitida: es el objeto de la figura.

Procesamiento normal de producto a bloquear: **match, publicación del portfolio y uso ordinario del perfil**. Las excepciones definitivas del art. 18.2 aplicables **no se diseñan aquí**. Es el derecho técnicamente más exigente y no puede improvisarse.

### 6. Portabilidad (art. 20)
```
APPLIES:                 CONDITIONAL_SCOPE
CURRENT_IMPLEMENTATION:  MANUAL
RESPONSE_REQUIREMENTS:   Formato estructurado, de uso común y lectura mecánica
```

Tres condiciones acumulativas: datos **facilitados por el interesado**, tratamiento **automatizado**, base en **consentimiento** o **contrato**. WP242 rev.01 incluye los aportados activamente y los observados, **excluyendo los inferidos o derivados**.

| Dato | ¿Art. 20? | Motivo |
|---|---|---|
| Cuenta y email (A) | **SÍ** | Aportado, art. 6.1.b) |
| Perfil/CV, skills, experiencia, educación, proyectos, enlaces (C, D) | **SÍ** | Núcleo del derecho |
| Preferencias profesionales (E) | **SÍ** | Aportadas |
| Ofertas guardadas (G) | **SÍ** | Dato observado |
| Portfolio publicado (I) | **SÍ** | Aportado, art. 6.1.a) |
| Score y desglose del match (H) | **NO** | **Derivado**; además no se persiste |
| Histórico de soporte (J) | **NO, en general** | Base mixta |
| Evidencias (K) | **NO** | Arts. 6.1.c) y 5.2 |
| Datos de seguridad (L) | **NO** | Art. 6.1.f); no se persisten |

### 7. Oposición (art. 21)
```
APPLIES:                 CONDITIONAL_SCOPE
CURRENT_IMPLEMENTATION:  MANUAL
```

| Tratamiento | Base | ¿Art. 21? |
|---|---|---|
| A, B, C, D, E, F, G, H | 6.1.b) | **NO** |
| I — portfolio | 6.1.a) | **NO** — vía retirada del consentimiento |
| J — soporte, calidad y trazabilidad | 6.1.f) | **SÍ** |
| K — derechos | 6.1.c) | **NO** |
| L — seguridad y rate limiting | 6.1.f) | **SÍ**, formalmente |
| M — backups | 6.1.c)/f) | **CONDITIONAL** |

Que el art. 21 aplique **no significa que la oposición deba estimarse**: cabe continuar acreditando motivos legítimos imperiosos o para la formulación, ejercicio o defensa de reclamaciones. Lo obligatorio es **tramitar, valorar y motivar**. El art. 21.2 no tiene objeto hoy.

### 8. Decisiones automatizadas (art. 22)
```
ARTICLE_22_3:
NOT_APPLICABLE_ON_CURRENT_MATCH_FACTS
```
No se activan los derechos del art. 22.3. Recomendación no obligatoria: ofrecer voluntariamente un canal de revisión del resultado del match. Los triggers de SR-08 Parte A los activarían como obligatorios.

### 9. Retirada del consentimiento (art. 7.3)
```
APPLIES:                 YES_FOR_CONSENT_BASED_PROCESSING — hoy, solo el portfolio (I)
WITHDRAWAL_EASE:         MUST_BE_AS_EASY_AS_GRANTING
CURRENT_JOBIT_DESIGN:    SELF_SERVICE_TOGGLE_STRONGLY_INDICATED
EXACT_UI_MECHANISM:      NOT_LEGALLY_PRESCRIBED
```
El art. 7.3 exige que retirar sea tan fácil como prestar, sin prescribir interfaz. Dado que **el portfolio se activa mediante autoservicio**, una desactivación igualmente de autoservicio está **fuertemente indicada**. Efecto inmediato; no sujeto al plazo de un mes. Deben registrarse la evidencia de la retirada, la retirada efectiva del acceso público y la no republicación desde copias.

### 10. Notificación a destinatarios (art. 19) *(sección corregida en v1.2)*

```
PROCESSOR:
NOT_A_THIRD_PARTY

PROCESSOR_AS_RECIPIENT:
YES_WHERE_PERSONAL_DATA_IS_DISCLOSED_TO_PROCESSOR

ARTICLE_19_NOTIFICATION:
APPLIES_TO_EACH_RELEVANT_RECIPIENT_UNLESS_IMPOSSIBLE_OR_DISPROPORTIONATE

ARTICLE_28:
OPERATIONAL_AND_CONTRACTUAL_MECHANISM_FOR_PROCESSOR_PROPAGATION
```

**CORRECCIÓN APLICADA.** La v1.1 afirmaba que los encargados no son destinatarios en el sentido material del art. 19. **Esa afirmación se elimina por incorrecta.**

**Fundamento.** El **art. 4.9 RGPD** define «destinatario» como la persona física o jurídica, autoridad pública, servicio u otro organismo **al que se comuniquen datos personales, se trate o no de un tercero**. El **art. 4.10** define «tercero» excluyendo, entre otros, al encargado del tratamiento y a las personas autorizadas para tratar los datos bajo la autoridad directa del responsable o del encargado. **La exclusión opera sobre el concepto de tercero, no sobre el de destinatario.** Por tanto:

- un encargado **no es un tercero**;
- pero **sí es un destinatario** cuando se le comunican datos personales.

**Consecuencia para el art. 19.** La obligación de comunicar cualquier rectificación, supresión o limitación **alcanza a cada destinatario al que se hayan comunicado los datos**, salvo imposibilidad o esfuerzo desproporcionado; e incluye la obligación de informar al interesado acerca de dichos destinatarios si lo solicita. **Los encargados están comprendidos.**

**Cómo se cumple en la práctica.** El cumplimiento respecto de encargados **puede articularse mediante las instrucciones documentadas, los procesos y el contrato del art. 28** —que ya obliga al encargado a asistir al responsable y a actuar conforme a sus instrucciones—, de modo que la propagación se produzca de forma sistemática y no mediante comunicaciones ad hoc. **Pero esa vía operativa no permite excluir conceptualmente a los encargados del término destinatario**, ni exime de acreditar la propagación, ni de poder identificarlos ante el interesado que lo solicite.

**Impacto actual y futuro.** No se inventan proveedores existentes: la identidad de los encargados está `PENDING_SR_10`. Una vez identificados, todos ellos entran en el ámbito del art. 19.

| Destinatario | Situación | Efecto sobre el art. 19 |
|---|---|---|
| **Alojamiento / cómputo** | En alcance actual; encargado externo confirmado como categoría | **Destinatario.** La propagación se articula vía art. 28; debe existir procedimiento y evidencia |
| **Base de datos / almacenamiento** | `EXTERNAL_PROVIDER: TO_VERIFY` | **Destinatario si es externo.** Si es el mismo encargado que el alojamiento, una sola propagación |
| **Copias de seguridad** | `EXTERNAL_PROVIDER: TO_VERIFY` | **Destinatario si es externo.** Interacción específica con el ciclo de rotación: la propagación debe contemplar qué ocurre con las copias |
| **Correo transaccional** | No previsto | **Destinatario si se incorpora** |
| **Observabilidad / logging** | `TO_VERIFY` | **Destinatario si existe y trata datos personales.** Especialmente relevante por la captura no intencionada |
| **CDN, analítica, IA, cualquier otro encargado futuro** | Fuera de alcance | **Destinatarios si se incorporan.** La puerta de incorporación de proveedores debe incluir su alta en el mecanismo de propagación |
| **Empleadores (RECRUIT)** | HOLD | **Cambio cualitativo.** Destinatarios no encargados; exige registrar a quién se comunicó qué y cuándo |
| **CANDIDATE_DISCOVERY** | HOLD | Igual, agravado por la búsqueda proactiva |

**Consecuencia de diseño:** el mecanismo de propagación no es un requisito futuro condicionado a RECRUIT. **Es ya necesario respecto de los encargados**, aunque su articulación sea contractual y operativa. Lo que RECRUIT añadiría es la necesidad de un registro granular de comunicaciones a destinatarios no encargados, que no puede reconstruirse retroactivamente.

### 10.bis — Portfolio público y art. 19 *(sección corregida en v1.2)*

```
PUBLIC_PORTFOLIO_ARTICLE_19:
HUMAN_REVIEW_REQUIRED

SEARCH_ENGINE_DEINDEXING:
REASONABLE_RISK_MITIGATION_MEASURE

LEGAL_SCOPE:
DO_NOT_PREJUDGE
```

**CORRECCIÓN APLICADA.** La v1.1 concluía que la imposibilidad de alcanzar a terceros que hubieran copiado contenido público encajaba en la salvedad de imposibilidad o esfuerzo desproporcionado del art. 19. **Ese cierre automático se retira.**

Lo que puede afirmarse: la publicación en abierto **no genera una lista identificada de destinatarios** en el sentido del art. 19, y por tanto la aplicación del precepto a quienes accedieron o copiaron información pública **no es evidente en ningún sentido**. Pero **no debe prejuzgarse** que todos ellos queden comprendidos en la excepción: el alcance legal de la salvedad respecto de contenido publicado, indexado o replicado por terceros **requiere revisión humana** y no se resuelve en este documento.

Lo que sí se mantiene como obligación clara y no discutida:

1. **Retirada efectiva e inmediata del contenido desde los sistemas controlados por JobIT**, al despublicar o al cerrar la cuenta.
2. **Garantía de no republicación desde copias de seguridad.**
3. **La solicitud de desindexación a motores de búsqueda es una medida razonable de mitigación de riesgo** —`REASONABLE_RISK_MITIGATION_MEASURE`—, recomendable con independencia de cómo se resuelva la cuestión jurídica de fondo, y que además refuerza la posición del responsable si esa cuestión se discutiera.
4. **Información previa al candidato**, antes de activar el portfolio, sobre accesibilidad mundial, indexación potencial, copias en caché de terceros e imposibilidad de garantizar el borrado completo fuera de los sistemas de JobIT (arts. 5.1.a y 13).

### 11. Reclamación ante la autoridad de control (art. 77)
```
APPLIES:                 YES
LEGAL_REQUIREMENT:       Art. 13.2.d) y art. 12.4
OPEN_ITEMS:              incluir la referencia en la Política de Privacidad y en las
                         respuestas denegatorias
```

---

## Cuestiones específicas

### `ACCOUNT_DELETION` — cierre contractual ≠ derecho de supresión

| | Cierre de cuenta | Derecho de supresión (art. 17) |
|---|---|---|
| Naturaleza | Acto contractual | Derecho subjetivo del RGPD |
| Fundamento | Términos y Condiciones | Art. 17 RGPD |
| Efecto | Termina el contrato | Obliga a suprimir cuando concurre causa del art. 17.1 |
| Plazo | El de los Términos | Un mes, prorrogable |
| Límites | — | Excepciones del art. 17.3 y bloqueo del art. 32 LOPDGDD |

Convergen en la práctica pero no son intercambiables. El flujo de cierre debería explicar qué se suprime, qué queda bloqueado y en qué plazo desaparece de las copias.

### `IDENTITY`
```
DNI_BY_DEFAULT:          NO
AUTHENTICATED_SESSION:   PRIMARY_REASONABLE_VERIFICATION_METHOD
STEP_UP_VERIFICATION:    WHEN_REASONABLE_DOUBTS_EXIST
```
La sesión autenticada es el **método primario razonable**, no infalible: **puede existir compromiso de cuenta**, y una solicitud desde una sesión secuestrada es el escenario en que una respuesta automática de acceso o portabilidad causaría mayor daño. No debe exigirse documento de forma sistemática (art. 12.6; art. 5.1.c), pero debe preverse **verificación reforzada** ante dudas razonables: dispositivo o ubicación anómalos, cambio reciente de credenciales, indicios de compromiso, o solicitudes de especial impacto. Si excepcionalmente se requiere documento, verificación efímera y sin conservación de copia.

### `SINGLE_CONTACT_POINT`
**Viable.** Condiciones: (1) el plazo del art. 12.3 se computa **desde la entrada en el canal único**; (2) clasificación interna documentada; (3) el canal no puede convertirse en embudo; (4) matiz del art. 7.3 para la desactivación del portfolio.

### `MANUAL_PROCESS`
**Viable, con tres condiciones y un matiz.** El derecho del interesado no es lo mismo que una funcionalidad de autoservicio: el RGPD obliga a atender el derecho en plazo y forma, no a implementar un botón.

- **Matiz:** la retirada del consentimiento del portfolio, por la exigencia de equivalencia del art. 7.3.
- **Condición 1:** procedimiento documentado con responsable, registro de entrada, control de plazos y plantillas.
- **Condición 2:** capacidad real, con umbral de volumen que dispare la revisión.
- **Condición 3:** vía de ejercicio visible y sencilla.

`ADMIN_DATA_ACCESS: EXCEPTIONAL` y `ADMIN_ACCESS_SCOPE: MINIMUM_NECESSARY` exigen que cada acceso administrativo quede **registrado y justificado**.

---

**REFERENCE:** SR-12
**CONCLUSION:** Los derechos aplican por tratamiento y base jurídica. El canal único es viable computando el plazo desde su entrada. El proceso manual es viable con tres condiciones. La retirada del consentimiento debe ser tan fácil como su otorgamiento, lo que indica fuertemente autoservicio sin que la norma prescriba interfaz. **Los encargados son destinatarios a efectos del art. 19**, aunque no sean terceros, y la propagación se articula mediante el art. 28 sin excluirlos del concepto. **El alcance del art. 19 respecto del portfolio público no se prejuzga** y requiere revisión humana. El tratamiento del acceso respecto de copias y datos bloqueados requiere análisis específico.
**CLASSIFICATION:** CONDITIONAL
**OFFICIAL_LEGAL_BASIS:** RGPD arts. **4.9, 4.10**, 7.3, 11, 12, 13, 15, 16, 17, 18 (incluido 18.2), **19**, 20, 21, 22, **28** y 77; LOPDGDD arts. 12 a 18 y 32.
**OFFICIAL_SOURCES:** EUR-Lex; BOE; AEPD; GT29 WP242 rev.01.
**FACTS_USED:** SINGLE_CONTACT_POINT; INTERNAL_CLASSIFICATION: YES; RIGHTS_REQUEST_TRACKING: YES; PROCESSING_MODEL: MANUAL_INITIAL_PHASE; MANUAL_ACCOUNT_CLOSURE: YES; ADMIN_DATA_ACCESS: EXCEPTIONAL; ADMIN_ACCESS_SCOPE: MINIMUM_NECESSARY; SENSITIVE_REQUEST_IDENTITY_CHECK: PROPORTIONAL_AND_MINIMAL; DOCUMENTARY_IDENTIFICATION_ALWAYS_REQUIRED: NO; autoservicio parcial para rectificación y eliminación granular; tramitación manual o asistida para el resto. Identidad de los encargados: `PENDING_SR_10`.
**RESPONSIBLE_DECISIONS_USED:** las anteriores.
**SPECIALIST_REASONING_SUMMARY:** La corrección sobre encargados y destinatarios es conceptualmente importante y tiene consecuencia práctica inmediata: **el mecanismo de propagación del art. 19 no es un requisito futuro condicionado a RECRUIT, sino algo ya necesario desde el momento en que exista un encargado externo**, que es el escenario confirmado. La v1.1 aplazaba indebidamente ese trabajo. La corrección sobre el portfolio apunta al mismo defecto en dirección contraria: cerrar por vía interpretativa una excepción cuyo alcance no está resuelto. En ambos casos, lo correcto es dejar la cuestión jurídica abierta y ejecutar lo que sí es indiscutible: retirar el contenido, no republicarlo desde copias y solicitar la desindexación.
**REQUIRED_BEFORE_TRAMO_B:** (1) procedimiento documentado de atención de derechos con control de plazos; (2) decisión sobre el mecanismo de desactivación del portfolio; (3) diseño del estado de limitación conforme al art. 18.2; (4) definición del subconjunto exportable del art. 20; (5) procedimiento de acceso que cubra los datos en tratamiento, con análisis específico para copias y datos bloqueados; (6) registro y justificación de accesos administrativos; (7) umbral de volumen que dispare la revisión del modelo manual; (8) **mecanismo de propagación a destinatarios (art. 19) respecto de los encargados que se identifiquen en SR-10**, y previsión de registro granular ante una eventual activación de RECRUIT.
**NON_BLOCKING_RECOMMENDATIONS:** construir la exportación de perfil como funcionalidad de producto; ofrecer voluntariamente un canal de revisión humana del match; solicitar desindexación a motores de búsqueda al despublicar un portfolio, como medida razonable de mitigación; publicar plazos de respuesta comprometidos y cumplirlos.
**PRIVATE_INFORMATION_REQUIRED:** NO
**BLOCKS_LEGAL_GATE:** CONDITIONAL — el procedimiento de derechos debe existir antes de tratar datos reales.
**CONFIDENCE_OR_OPEN_INTERPRETATION:** Alta en plazos, canal único, delimitación del art. 21 y calificación de los encargados como destinatarios. Media-alta en la delimitación del art. 20 respecto de las ofertas guardadas. **Abierta y reservada a revisión humana:** el alcance del art. 19 respecto del portfolio público y de terceros que hayan accedido o replicado contenido; el tratamiento del acceso respecto de copias y datos bloqueados; y las excepciones del art. 18.2 aplicables.

---

# DEVELOPMENT GUIDANCE — PACKAGE 3 (v1.2)

```
DEVELOPMENT_GUIDANCE_STATUS:
PREPARATORY_REFERENCE_ONLY

IMPLEMENTATION_REQUIRES:
ORCHESTRATOR_AUTHORIZATION + SDD_SPEC_WHEN_APPLICABLE

TRAMO_B:
NOT_AUTHORIZED
```

> `SAFE_TO_IMPLEMENT_NOW` significa únicamente que el elemento **no depende de una conclusión jurídica pendiente**. **No** es autorización de implementación.

## SAFE_TO_IMPLEMENT_NOW *(sujeto a `IMPLEMENTATION_REQUIRES`)*

Solo tareas de verificación y documentación:

1. **Inventario del almacenamiento en terminal** (cookies, `localStorage`, `sessionStorage`, IndexedDB, service workers).
2. **Verificación de los campos `TO_VERIFY_IN_REPOSITORY` de SR-09.**
3. **Verificación de si existe alguna herramienta de observabilidad, logging o APM en uso**, y de si captura datos personales.
4. **Verificación de la región real de las copias** y de qué componentes presta cada proveedor.
5. **Procedimiento documentado de atención de derechos** con registro de entrada, control de plazos y plantillas.
6. **Registro y justificación de accesos administrativos.**
7. **Documentación de la decisión de inactividad** como `BUSINESS_RETENTION_CHOICE`, con hito de revisión.
8. **Consignar en el RAT** que el match no persiste resultados y que `req.ip` no se persiste ni registra.
9. **Umbrales internos de revisión**: volumen de solicitudes de derechos y volumen de usuarios.

## DESIGN_ONLY

1. **Mecanismo definitivo de persistencia y consentimiento de la cookie de autenticación** — decisión entre vías A, B y C.
2. **Mecanismo definitivo de bloqueo del art. 32 LOPDGDD** — estado lógico, registro segregado o copia segura del art. 32.4.
3. **Plazos de conservación** — no fijar ni publicar antes de la decisión motivada del responsable.
4. **Tratamiento definitivo de la limitación del art. 18**, incluidas las excepciones del art. 18.2.
5. **`RECIPIENT_PROPAGATION_MECHANISM`** *(añadido en v1.2)* — mecanismo que permita propagar **rectificación, supresión y limitación** a encargados y otros destinatarios cuando corresponda, y acreditar dicha propagación; con capacidad de identificar los destinatarios ante el interesado que lo solicite. Objetivo futuro; **no implementar todavía una arquitectura definitiva basada únicamente en este borrador.**
6. **Exportación de perfil** delimitada al subconjunto del art. 20.
7. **Procedimiento de acceso del art. 15**, con análisis específico para copias y datos bloqueados.
8. **Flujo de cierre de cuenta** con explicación de qué se suprime, qué se bloquea y en qué plazo desaparece de copias.
9. **Garantía de no republicación desde copias** de portfolios despublicados y cuentas cerradas.
10. **Solicitud de desindexación a motores de búsqueda** al despublicar un portfolio.
11. **Sección de almacenamiento en dispositivo** de la Política de Privacidad.
12. **Ciclo de rotación de copias** declarado y acotado, con procedimiento de supresión diferida.
13. **Mecanismo de desactivación del portfolio** coherente con el art. 7.3.
14. **Canal voluntario de revisión humana del match.**
15. **Puerta documental de incorporación de proveedores**, incluyendo el alta del nuevo encargado en el mecanismo de propagación del art. 19.

## DO_NOT_IMPLEMENT_UNTIL_HUMAN_REVIEW

1. Publicación de cualquier texto informativo sobre cookies o almacenamiento en terminal.
2. Banner o CMP de cookies, mientras el inventario técnico no esté cerrado.
3. Incorporación de cualquier proveedor nuevo, incluidos correo transaccional, CDN, observabilidad, analítica y proveedores de IA.
4. Fijación o publicación de plazos de conservación concretos.
5. Supresión automática por inactividad.
6. Cualquier borrado definitivo que no contemple el mecanismo de bloqueo del art. 32 LOPDGDD.
7. Persistencia o registro de direcciones IP.
8. **Analítica o medición de audiencia de cualquier tipo, propia o de terceros** — por decisión empresarial vigente y por la puerta de incorporación de proveedores, con independencia de que pudiera resultar exenta del consentimiento conforme a la Guía AEPD de enero de 2024.
9. Publicidad o tracking comercial.
10. Publicación de la Política de Privacidad, el Aviso Legal y los Términos.
11. Tratamiento de datos reales de candidatos en cualquier entorno, incluidos los de preproducción.

---

## ESTADO FINAL DEL PAQUETE 3 (v1.2)

```
SPECIALIST_REVIEW_COMPLETED:  NO
LEGAL_DECISIONS_APPROVED:     NO
TRAMO_B:                      NOT_AUTHORIZED
PRODUCTION:                   NOT_AUTHORIZED
REAL_CANDIDATE_DATA:          NOT_AUTHORIZED

SR-09  CURRENT_AUTH_COOKIE_CONSENT_REQUIRED:   CONDITIONAL / HUMAN_REVIEW_REQUIRED
       PERSISTENT_AUTH_COOKIE_EXEMPTION:       NOT_CONFIRMED
       USER_CHOICE_OVER_PERSISTENCE:           RELEVANT_BUT_NOT_DETERMINATIVE
       COOKIE_BANNER_REQUIRED:                 PENDING_TECHNICAL_INVENTORY
       CURRENT_KNOWN_NON_AUTH_TRACKING:        NONE
       COOKIE_POLICY_REQUIRED:                 CONDITIONAL
       AUDIENCE_MEASUREMENT_COOKIES:           CONDITIONAL
       CONSENT_EXEMPTION:                      POSSIBLE_UNDER_AEPD_JAN_2024_GUIDE
       FINAL_CLASSIFICATION:                   PENDING_SR09_TECHNICAL_VERIFICATION
       SPANISH_OPERATIONAL_RULE:               LSSI_ART_22_2_IF_APPLICABLE
       EU_INTERPRETIVE_FRAMEWORK:              DIRECTIVE_2002_58_ART_5_3

SR-10  COMPONENT_MATRIX:                       EMITTED_WITH_OPEN_FIELDS
       IN_SCOPE_COMPONENTS:                    hosting · database/storage · backups
       DISTINCT_PROCESSOR (2 y 3):             TO_VERIFY
       TRANSFER_OUTSIDE_EEA:                   TO_VERIFY
       TRANSFER_ASSESSMENT:                    DEPENDS_ON_MECHANISM_AND_DESTINATION
       PUBLIC_PORTFOLIO_AS_CHAPTER_V_TRANSFER: NO_ON_CURRENT_ANALYSIS
       HUMAN_VALIDATION:                       PENDING
       PRIVATE_INFORMATION_REQUIRED:           YES (4 categorías)

SR-11  SPECIFIC_RETENTION_PERIODS_IDENTIFIED_ON_CURRENT_FACTS: NONE
       FINAL_RETENTION_MAPPING:                HUMAN_REVIEW_REQUIRED
       ART_32_LOPDGDD_BLOCKING:                REQUIRED
       TECHNICAL_IMPLEMENTATION:               TO_DESIGN
       FINAL_PATTERN:                          TECHNICAL + HUMAN_LEGAL_REVIEW_REQUIRED
       AUTOMATIC_INACTIVITY_DELETION:          SUSTAINABLE_WITH_CONDITIONS

SR-12  DATA_SUBJECT_RIGHTS:                    APPLY_PER_PROCESSING_AND_LEGAL_BASIS
       PORTABILITY / OBJECTION:                CONDITIONAL_SCOPE
       ARTICLE_22_3:                           NOT_APPLICABLE_ON_CURRENT_MATCH_FACTS
       PROCESSOR:                              NOT_A_THIRD_PARTY
       PROCESSOR_AS_RECIPIENT:                 YES_WHERE_DATA_IS_DISCLOSED
       ARTICLE_19_NOTIFICATION:                APPLIES_TO_EACH_RELEVANT_RECIPIENT
                                               UNLESS_IMPOSSIBLE_OR_DISPROPORTIONATE
       PUBLIC_PORTFOLIO_ARTICLE_19:            HUMAN_REVIEW_REQUIRED
       SEARCH_ENGINE_DEINDEXING:               REASONABLE_RISK_MITIGATION_MEASURE
       LEGAL_SCOPE:                            DO_NOT_PREJUDGE
       RESTRICTION_STATE:                      BLOCK_NORMAL_PRODUCT_PROCESSING
       AUTHENTICATED_SESSION:                  PRIMARY_REASONABLE_VERIFICATION_METHOD
       WITHDRAWAL_EASE:                        MUST_BE_AS_EASY_AS_GRANTING
       EXACT_UI_MECHANISM:                     NOT_LEGALLY_PRESCRIBED
       BACKUP_DATA_ACCESS_HANDLING:            HUMAN_REVIEW_REQUIRED
       SINGLE_CONTACT_POINT:                   VIABLE
       MANUAL_PROCESS:                         VIABLE_WITH_CONDITIONS

DEPENDENCIAS ABIERTAS:  SR-01 a SR-08 pendientes de validación humana
                        SR-13 a SR-15 no abiertos
                        Reserva heredada de SR-03 sobre notificaciones sin correo
                        transaccional: sigue abierta
```

---

*Fin del documento. JOBIT — S22-PRIV-01 · Specialized Review Package 3 · SR-09 a SR-12 · v1.2 · 18 de agosto de 2026. Pendiente de validación por profesional humano cualificado.*
