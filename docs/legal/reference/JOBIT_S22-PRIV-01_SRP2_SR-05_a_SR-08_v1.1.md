# JOBIT — S22-PRIV-01
# SPECIALIZED REVIEW PACKAGE 2
# SR-05 / SR-06 / SR-07 / SR-08

---

## PORTADA

**DOCUMENT:**
JOBIT — S22-PRIV-01 · Specialized Review Package 2

**VERSION:**
1.1

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
SR-05, SR-06, SR-07 y SR-08 exclusivamente. No se abre SR-09 a SR-15. No se reabren SR-01 a SR-04 salvo dependencia declarada.

**STATUS:**

```
SPECIALIST_REVIEW_COMPLETED:  NO
LEGAL_DECISIONS_APPROVED:     NO
TRAMO_B:                      NOT_AUTHORIZED
PRODUCTION:                   NOT_AUTHORIZED
REAL_CANDIDATE_DATA:          NOT_AUTHORIZED
```

**RESTRICCIONES OBSERVADAS:**
No se ha modificado repositorio, ni creado branch, commit, push o PR. No se ha implementado código. No se han redactado textos legales públicos definitivos. No se han inventado hechos sobre JobIT. No se han reconstruido ni solicitado valores del registro privado.

---

## DIRECTOR_CORRECTIONS_APPLIED

| # | Corrección solicitada | Tratamiento en v1.1 |
|---|---|---|
| 1 | SR-07 — transferencias internacionales no son criterio de la lista AEPD art. 35.4 | **Aplicada.** Retirada del contador. Reclasificada como `AEPD_35_4_CRITERION: NO` / `ROLE_IN_DPIA_ASSESSMENT: GENERAL_RISK_CONTEXT_ONLY`. Se aclara su relación con el capítulo V RGPD |
| 2 | SR-07 — el portfolio no es criterio autónomo; recalcular los 11 criterios | **Aplicada.** Recálculo íntegro sobre el texto oficial de los 11 criterios. Portfolio reclasificado como `GENERAL_RISK_FACTOR: YES` / `AEPD_35_4_STANDALONE_CRITERION: NO`. `FINAL_CLASSIFICATION` reformulada sin apoyarse en transferencias |
| 3 | SR-05 — no afirmar categóricamente la ausencia de monitorización habitual y sistemática | **Aplicada.** Reformulado como `NOT_NECESSARY_TO_RESOLVE_FOR_CURRENT_RESULT / HUMAN_VALIDATION_REQUIRED`. La conclusión pasa a descansar en `LARGE_SCALE: NO_ON_CURRENT_FACTS`. `NOT_RECOMMENDED` trasladado a `GOVERNANCE_RECOMMENDATION` |
| 4 | SR-06 — reforma en curso del art. 30.5 | **Aplicada.** Nueva sección `REGULATORY_WATCH — GDPR ARTICLE 30(5)`. Conclusión reetiquetada como `RAT_REQUIRED_UNDER_CURRENT_LAW: YES`. Distinción explícita entre obligación y recomendación |
| 5 | SR-06 — hechos técnicos no verificados en la matriz A-M | **Aplicada.** Revisión completa. Todo detalle no aportado en el contexto canónico marcado como `TECHNICAL_FACT_STATUS: TO_VERIFY_IN_REPOSITORY`. Retiradas las afirmaciones sobre hash/salt, expiraciones, invalidación de tokens, cifrado en reposo y pruebas de restauración |
| 6 | SR-08 — art. 50 del Reglamento de IA no es automático | **Aplicada.** Sustituida la afirmación general por el desglose A–E por rol y caso de uso. Se mantiene `ANY_NEW_AI_OR_LLM: AI_ACT_REASSESSMENT_TRIGGER` sin equipararlo a incumplimiento |
| 7 | SR-08 — no cerrar el estatus DSA | **Aplicada.** Retirada la afirmación categórica. `DSA_ONLINE_PLATFORM_STATUS: CONDITIONAL / HUMAN_REVIEW_REQUIRED`. `ART_27_DSA: DO_NOT_CLOSE_IN_SR-08`. P2B mantenido separado y condicionado |
| 8 | Development guidance — naturaleza preparatoria | **Aplicada.** Añadidos `DEVELOPMENT_GUIDANCE_STATUS` e `IMPLEMENTATION_REQUIRES` |
| 9 | Mantener flags de estado | **Aplicada.** Sin cambios |
| 10 | Portada v1.1 con QUALIFICATION_NOTICE íntegra | **Aplicada** |
| 11 | Tabla de correcciones | **Aplicada** (esta tabla) |

---

## DEPENDENCIAS DECLARADAS RESPECTO DE SR-01 A SR-04

Las conclusiones del Paquete 1 son preparatorias y están pendientes de validación humana. Se utilizan aquí **como hipótesis de trabajo declaradas**, nunca como hechos jurídicos definitivos.

| Dependencia | Referencia | Impacto |
|---|---|---|
| DEPENDENCY: SR-03 | Calificación de JobIT como prestador de servicios de la sociedad de la información (CONDITIONAL) | **IMPACT:** condiciona la aplicabilidad del art. 34.1.d) LOPDGDD en SR-05 |
| DEPENDENCY: SR-02 | Matriz de tratamientos A-M y bases jurídicas | **IMPACT:** esqueleto de la matriz RAT de SR-06; si una base cambia tras la validación humana, debe reemitirse la columna correspondiente |
| DEPENDENCY: SR-02 | Estado técnico canónico de `req.ip` | **IMPACT:** determina RETENTION_STATUS del tratamiento L y el criterio 3 de la lista AEPD en SR-07 |
| DEPENDENCY: SR-02 | Evaluación preliminar del art. 22 diferida a SR-08 | **IMPACT:** se resuelve en este paquete |
| DEPENDENCY: SR-04 | Límite 18+ y ausencia de tratamiento intencional de datos de menores | **IMPACT:** elimina el criterio 9 de la lista AEPD |

No se ha modificado silenciosamente ninguna conclusión anterior.

---

## FUENTES OFICIALES UTILIZADAS

**EUR-Lex.** Reglamento (UE) 2016/679 (RGPD): arts. 4.4, 5, 12, 13.2.f), 14.2.g), 15.1.h), 21, 22, 24, 25, 30, 32, 35, 37-39, capítulo V, y considerandos 71, 75, 82, 84, 91 y 97. Reglamento (UE) 2024/1689 (Reglamento de IA): arts. 3.1, 3.12, 4, 6, 50, 113 y Anexo III. Reglamento (UE) 2026/1744. Reglamento (UE) 2022/2065 (DSA): arts. 3.g), 3.i), 27 y considerando 13. Reglamento (UE) 2019/1150 (P2B): art. 5.

**BOE.** LO 3/2018 (LOPDGDD), arts. 31, 34, 35 y 36. Ley 34/2002 (LSSI), arts. 1, 2 y Anexo a).

**AEPD.** «Listas de tipos de tratamientos de datos que requieren evaluación de impacto relativa a protección de datos (art. 35.4)» — texto oficial de los once criterios, reproducido y aplicado en SR-07. «Lista orientativa de tipos de tratamientos que no requieren EIPD (art. 35.5)». Sección «Designación de un delegado de protección de datos».

**EDPB / GT29.** WP243 rev.01 (DPD). WP248 rev.01 (EIPD). WP251 rev.02 (decisiones automatizadas y perfilado).

**Comisión Europea.** Directrices sobre la definición de «sistema de IA» conforme al art. 3.1 del Reglamento (UE) 2024/1689, de 6 de febrero de 2025.

**TJUE.** C-634/21 (SCHUFA Holding, 7 de diciembre de 2023). C-203/22 (Dun & Bradstreet Austria, 27 de febrero de 2025).

**Verificación de vigencia a 18/08/2026.** Calendario del Reglamento de IA modificado por el Reglamento (UE) 2026/1744, en vigor desde el 27 de julio de 2026. Paquete Ómnibus Digital presentado por la Comisión el 19 de noviembre de 2025: la parte relativa al Reglamento de IA se ha materializado ya en norma; **la parte relativa al RGPD, incluida la propuesta de modificación del art. 30.5, permanece en tramitación legislativa y no es Derecho vigente** (ver `REGULATORY_WATCH` en SR-06).

---

# REFERENCE: SR-05 — DELEGADO DE PROTECCIÓN DE DATOS (v1.1)

**CONCLUSION:**

```
DPO_MANDATORY_NOW:              NO
LARGE_SCALE:                    NO_ON_CURRENT_FACTS
REGULAR_SYSTEMATIC_MONITORING:  NOT_NECESSARY_TO_RESOLVE_FOR_CURRENT_RESULT /
                                HUMAN_VALIDATION_REQUIRED
DPO_VOLUNTARY:                  POSSIBLE
```

**OFFICIAL_BASIS:**
RGPD art. 37.1 y considerando 97; LOPDGDD arts. 34, 35 y 36; EDPB/GT29 WP243 rev.01; AEPD, sección «Designación de un delegado de protección de datos».

**FACTS:**
Producto candidate-first en fase MVP previa a producción; sin datos reales de candidatos; responsable persona física; sin recruiters; sin acceso de empleadores a base de datos; sin analytics de terceros, publicidad ni tracking comercial; match determinista sin persistencia de resultados; portfolio público opt-in desactivado por defecto; usuarios 18+; sin tratamiento intencional de categorías especiales; `req.ip` efímera, en memoria, no persistida y no registrada.

**ANALYSIS:**

**1. Art. 37.1.a) RGPD — autoridad u organismo público.** No concurre.

**2. Art. 37.1.b) RGPD — actividades principales que requieran observación habitual y sistemática de interesados a gran escala.** Tres elementos acumulativos.

- *Actividades principales:* **se cumple.** El perfil/CV, la búsqueda y el match son la actividad nuclear del servicio, no funciones auxiliares de soporte en el sentido de WP243.

- *Observación habitual y sistemática:* **CORRECCIÓN APLICADA — no se resuelve en este documento.** La v1.0 concluía negativamente sobre la base de que los datos son declarados por el propio candidato. Ese razonamiento es insuficiente y se retira. WP243 no limita el concepto al rastreo conductual: entre sus ejemplos de observación habitual y sistemática figuran formas de elaboración de perfiles y de puntuación —incluidas las utilizadas en contextos como la evaluación de riesgos o la publicidad comportamental—, y el carácter «habitual» abarca lo que sucede de forma recurrente o continua en un período determinado, mientras que «sistemático» abarca lo que responde a un sistema, es preestablecido, organizado o metódico. El match de JobIT es recurrente y responde a un sistema preestablecido. Que los datos de entrada sean declarados por el interesado **no excluye por sí solo** que el resultado constituya una forma de puntuación encuadrable en el concepto. La cuestión es interpretativamente abierta y **no es necesario resolverla** para el resultado actual, porque el tercer elemento falla de forma independiente.

  ```
  REGULAR_SYSTEMATIC_MONITORING: NOT_NECESSARY_TO_RESOLVE_FOR_CURRENT_RESULT /
                                 HUMAN_VALIDATION_REQUIRED
  ```

- *Gran escala:* **no se cumple.** WP243 propone valorar número de interesados, volumen y variedad de datos, duración del tratamiento y alcance geográfico. JobIT se encuentra en fase previa a producción, sin datos reales de candidatos, con territorio inicial España y sin volumen acreditado. `LARGE_SCALE: NO_ON_CURRENT_FACTS`.

Al fallar el elemento de gran escala, el art. 37.1.b) no obliga, **con independencia de cómo se resuelva el segundo elemento**.

**3. Art. 37.1.c) RGPD — tratamiento a gran escala de categorías especiales o de datos penales.** No concurre: no hay tratamiento intencional de datos del art. 9, ni datos del art. 10, ni gran escala. El riesgo residual de texto libre identificado en SR-02.C se gestiona por diseño y no constituye tratamiento a gran escala de categorías especiales.

**4. LOPDGDD art. 34.1.** Revisado el listado completo. La única letra potencialmente relevante es la **d): los prestadores de servicios de la sociedad de la información cuando elaboren a gran escala perfiles de los usuarios del servicio.** Las demás letras —colegios profesionales, centros docentes y universidades, operadores de comunicaciones electrónicas, entidades de crédito y establecimientos financieros, aseguradoras y reaseguradoras, empresas de servicios de inversión, distribuidoras de energía, ficheros de solvencia, publicidad y prospección comercial, centros sanitarios, emisoras de informes comerciales, operadores de juego, seguridad privada y federaciones deportivas con datos de menores— no son aplicables.

La letra d) exige dos condiciones acumulativas:

- *Ser prestador de SSI:* probable, **CONDITIONAL** conforme a la dependencia declarada de SR-03.
- *Elaborar perfiles a gran escala:* asumiendo la calificación del match como elaboración de perfiles en sentido amplio (SR-08 Parte B, CONDITIONAL con inclinación afirmativa), **el requisito de gran escala no se cumple sobre los hechos actuales.**

**Es este segundo requisito, y solo él, el que sostiene la conclusión negativa.** La consecuencia práctica es relevante: **el crecimiento del servicio puede activar la obligación sin ningún cambio funcional del producto.**

**5. Designación voluntaria — consecuencias jurídicas objetivas.**

```
DPO_VOLUNTARY: POSSIBLE
```

La designación voluntaria es jurídicamente posible y produce efectos que conviene conocer antes de decidir, sin que ninguno de ellos constituya un impedimento legal:

- El art. 34.3 LOPDGDD obliga a comunicar a la AEPD la designación, nombramiento y cese del DPD **en el plazo de diez días, tanto cuando la designación sea obligatoria como cuando sea voluntaria**. La figura queda inscrita en la lista pública de delegados que mantiene la Agencia.
- Conforme a WP243, al DPD designado voluntariamente le resultan aplicables **los mismos requisitos de los arts. 37 a 39 RGPD** que al designado obligatoriamente: independencia funcional, prohibición de instrucciones sobre el desempeño de sus funciones, prohibición de destitución o sanción por su ejercicio, ausencia de conflicto de intereses, recursos suficientes, participación oportuna en todas las cuestiones relativas a datos personales y publicación de los datos de contacto.
- En una estructura de responsable persona física, satisfacer internamente la ausencia de conflicto de intereses es materialmente difícil: quien determina fines y medios no puede supervisarse a sí mismo.
- WP243 advierte además contra el uso de denominaciones que puedan generar confusión con la figura del DPD cuando no se ha designado uno.

**GOVERNANCE_RECOMMENDATION:**

Recomendación de gobernanza, **no requisito jurídico**: en la configuración actual no resulta aconsejable designar formalmente un DPD, porque la designación activa un estatuto completo sin reducir un riesgo que hoy no existe. Alternativa propuesta: definir internamente un **rol de responsable de privacidad y punto de contacto de derechos**, sin denominarlo delegado de protección de datos, sin comunicarlo a la AEPD como tal y sin publicitarlo con esa etiqueta; ello cubre la necesidad operativa —canal único de SR-01, trazabilidad de derechos, escalado de incidencias— sin activar los arts. 37-39 RGPD ni el art. 34.3 LOPDGDD. Si en el futuro se opta por designar DPD, se recomienda externalizarlo a un tercero independiente en lugar de autodesignación del responsable.

Esta recomendación es revisable por el responsable y por el revisor humano sin que ello altere la conclusión jurídica de no obligatoriedad.

**FUTURE_REASSESSMENT_TRIGGERS:**

| Trigger | Precepto que podría activarse |
|---|---|
| RECRUIT fuera de HOLD | Art. 37.1.b) RGPD y art. 34.1.d) LOPDGDD |
| CANDIDATE_DISCOVERY fuera de HOLD | Ídem, con búsqueda proactiva de personas |
| Crecimiento sustancial de la base de usuarios | Art. 34.1.d) LOPDGDD: es el umbral realmente operativo |
| Perfilado conductual, analítica de uso o tracking | Art. 37.1.b) RGPD: refuerza el elemento de monitorización hoy no resuelto |
| IA/ML en el match o en cualquier función de producto | Art. 37.1.b) RGPD y Reglamento (UE) 2024/1689 |
| Campos que impliquen datos del art. 9 | Art. 37.1.c) RGPD, junto con gran escala |
| Monitorización sistemática de la actividad del candidato | Art. 37.1.b) RGPD |
| Expansión territorial más allá de España | Alcance geográfico como factor de gran escala (WP243) |

**REQUIRED_BEFORE_TRAMO_B:**
1. Fijar y documentar un **indicador cuantitativo interno de revisión** que obligue a reevaluar el art. 34.1.d) LOPDGDD antes de superarlo.
2. Documentar por escrito y fechar el análisis de no obligatoriedad del DPD (art. 5.2 RGPD), **haciendo constar expresamente que el elemento de observación habitual y sistemática queda sin resolver y sujeto a validación humana**.
3. Definir el rol interno de responsable de privacidad y su articulación con el canal único de SR-01.

**NON_BLOCKING_RECOMMENDATIONS:** revisar este apartado ante cada cambio material de alcance del producto, no por calendario.

**PRIVATE_INFORMATION_REQUIRED:** NO

**BLOCKS_LEGAL_GATE:** NO

**CONFIDENCE_OR_OPEN_INTERPRETATION:**
Alta sobre la inexistencia de obligación actual, por descansar en un elemento —gran escala— cuya ausencia es difícilmente discutible en fase previa a producción. **Interpretación expresamente abierta:** el elemento de observación habitual y sistemática, que se deja sin resolver y requiere validación humana; si un revisor lo considerase concurrente, la obligación quedaría a expensas únicamente del crecimiento del servicio. «Gran escala» carece de umbral numérico normativo y se configura en WP243 como valoración multifactorial.

---

# REFERENCE: SR-06 — REGISTRO DE ACTIVIDADES DE TRATAMIENTO (v1.1)

**CONCLUSION:**

```
RAT_REQUIRED_UNDER_CURRENT_LAW: YES
```

La excepción del art. 30.5 RGPD **no resulta utilizable por JobIT conforme al Derecho actualmente vigente**, pese a que el responsable no alcanza las 250 personas empleadas.

**OFFICIAL_LEGAL_BASIS:**
RGPD arts. 5.2, 24, 30.1, 30.2, 30.4, 30.5 y considerando 82; LOPDGDD art. 31.

**ANALYSIS:**

**1. Estructura de la excepción.** El art. 30.5 exime a las organizaciones de menos de 250 personas **salvo** que concurra alguna de estas tres circunstancias: que el tratamiento pueda entrañar un riesgo para los derechos y libertades de los interesados; que **el tratamiento no sea ocasional**; o que incluya categorías especiales de datos o datos relativos a condenas e infracciones penales. La excepción decae si concurre **una sola**. La lectura «menos de 250 empleados igual a exento» es incorrecta.

**2. Criterio decisivo: «no ocasional».** Los tratamientos del producto son estructurales y continuados, no episódicos: la cuenta es persistente; el perfil/CV se conserva y actualiza; la autenticación se ejecuta en cada sesión; las ofertas guardadas persisten por definición funcional; el portfolio, cuando se activa, es una publicación sostenida; las medidas de seguridad operan de forma permanente; los backups son recurrentes; y la atención de solicitudes de derechos es una obligación estructural con trazabilidad interna ya decidida. Ninguno de ellos es ocasional.

**3. Criterio adicional de riesgo.** Con independencia de lo anterior, el portfolio público y el match son tratamientos que «pueden entrañar un riesgo» en el sentido amplio del art. 30.5, lo que refuerza la conclusión por una vía independiente.

**4. Alcance.** Aun cuando la excepción operase parcialmente, el registro debería cubrir en todo caso los tratamientos no excluidos. Para JobIT es más simple y más defendible mantener un RAT completo.

**5. Naturaleza.** El RAT es el instrumento probatorio central del art. 5.2 y la primera pieza que suele solicitarse en una actuación de investigación. Debe estar vivo, fechado y versionado, y ser exhibible en formato electrónico (art. 30.4).

---

## REGULATORY_WATCH — GDPR ARTICLE 30(5)

```
EU_ARTICLE_30_REFORM:                     PENDING_LEGISLATIVE_PROCESS
CURRENT_GDPR_TEXT:                        APPLIES
RECHECK_BEFORE_FINAL_HUMAN_LEGAL_REVIEW:  YES
```

A fecha de 18 de agosto de 2026 existe un procedimiento legislativo de la Unión en curso, en el marco del paquete Ómnibus Digital presentado por la Comisión Europea el 19 de noviembre de 2025, que propone modificar sustancialmente la excepción del art. 30.5 RGPD. La propuesta se encuentra en fase de negociación entre el Parlamento Europeo y el Consejo, con reacciones institucionales del EDPB y del SEPD, y **su contenido final no está determinado**. La parte del paquete relativa al Reglamento de IA ya se ha materializado en norma —Reglamento (UE) 2026/1744—, pero **la parte relativa al RGPD no**.

**Este documento no anticipa cuál será el texto final ni asume ninguno de sus contenidos posibles.**

Consecuencias operativas:

1. **El texto vigente del art. 30.5 RGPD es el aplicable hoy**, y bajo él la conclusión es `RAT_REQUIRED_UNDER_CURRENT_LAW: YES`.
2. **Debe recomprobarse el estado de la tramitación inmediatamente antes de la revisión jurídica humana final**, y de nuevo antes de cualquier autorización de producción.
3. **Distinción entre obligación y recomendación:** si una eventual reforma llegara a eliminar o restringir la obligación formal para JobIT, el mantenimiento del RAT seguiría siendo **una recomendación voluntaria de responsabilidad proactiva**, no una obligación. La distinción debe conservarse expresamente en la documentación interna: un RAT mantenido voluntariamente sigue siendo la forma más eficiente de demostrar el cumplimiento de los arts. 5.2 y 24, que no dependen del art. 30, y sigue siendo el insumo del que se alimentan la información al interesado, el análisis de EIPD y la gestión de encargados. **Perder la obligación no haría inútil el instrumento.**
4. No debe planificarse el desarrollo asumiendo la reforma. Una arquitectura de cumplimiento construida sobre una norma no aprobada es una arquitectura sin respaldo.

---

## MATRIZ RAT PRELIMINAR — TRATAMIENTOS A-M (v1.1)

> **Advertencia de uso.** Matriz preparatoria construida sobre la matriz A-M de SR-02, pendiente de validación humana. Se aplican tres marcadores:
>
> - `PENDING_SR_10` — proveedores, encargados, ubicaciones, transferencias.
> - `PENDING_SR_11` — plazos de conservación.
> - `TECHNICAL_FACT_STATUS: TO_VERIFY_IN_REPOSITORY` — **CORRECCIÓN APLICADA:** todo detalle técnico no aportado expresamente en el contexto canónico recibido. La v1.0 describía mecanismos de hash y salt, expiraciones de token, invalidación en logout, cifrado en reposo de backups y pruebas de restauración que **no figuraban en los hechos canónicos**. Se han retirado. No se sustituyen por suposiciones.
>
> Un RAT con datos inventados es peor que un RAT incompleto: desplaza el riesgo de la incompletitud a la inexactitud, que compromete el art. 5.1.d) y la credibilidad del conjunto ante una inspección.

Campos comunes salvo indicación en contrario:

- **CONTROLLER:** persona física identificada en registro privado — `PRIVATE_REGISTRY_REFERENCE`. No reproducir.
- **DATA_SUBJECTS:** candidatos usuarios registrados, mayores de 18 años, territorio España.
- **TRANSFER_STATUS:** `PENDING_SR_10`. **PROCESSORS_STATUS:** `PENDING_SR_10`. **RETENTION_STATUS:** `PENDING_SR_11`.
- **SECURITY_SUMMARY:** `TO_VERIFY_IN_REPOSITORY` salvo las medidas que figuran en el bloque canónico de privacidad por diseño.

---

### A — Gestión de cuenta
- **ACTIVITY:** alta, mantenimiento y baja de cuenta de candidato.
- **PURPOSE:** creación y gestión de la cuenta necesaria para prestar el servicio.
- **DATA_CATEGORIES:** dirección de correo electrónico y credencial de acceso (registro mínimo canónico: email + password). Cualquier metadato adicional de cuenta: `TO_VERIFY_IN_REPOSITORY`.
- **RECIPIENT_CATEGORIES:** `PENDING_SR_10`.
- **SECURITY_SUMMARY:** acceso administrativo excepcional y mínimo (canónico). Mecanismo concreto de almacenamiento de credenciales: `TO_VERIFY_IN_REPOSITORY`.
- **LEGAL_BASIS_REFERENCE:** SR-02.A — art. 6.1.b) RGPD.
- **OPEN_ITEMS:** política de cuentas inactivas; procedimiento de baja.

### B — Autenticación y seguridad de sesión
- **ACTIVITY:** login, mantenimiento y cierre de sesión.
- **PURPOSE:** autenticar al usuario y proteger la sesión.
- **DATA_CATEGORIES:** identificadores de sesión. Detalle: `TO_VERIFY_IN_REPOSITORY`.
- **RETENTION_STATUS:** `TO_VERIFY_IN_REPOSITORY` + `PENDING_SR_09`. No se afirman expiraciones ni mecanismos de invalidación concretos.
- **SECURITY_SUMMARY:** `TO_VERIFY_IN_REPOSITORY`.
- **LEGAL_BASIS_REFERENCE:** SR-02.B — art. 6.1.b) y art. 6.1.f) en relación con el art. 32.
- **OPEN_ITEMS:** régimen del almacenamiento en el terminal reservado a SR-09.

### C — Perfil/CV profesional
- **ACTIVITY:** creación y mantenimiento del perfil profesional.
- **PURPOSE:** construir el CV tecnológico objeto del servicio.
- **DATA_CATEGORIES:** datos profesionales declarados; texto libre. Resto del perfil voluntario (canónico). No se recaban categorías especiales de forma intencional.
- **SECURITY_SUMMARY:** ubicación y disponibilidad privadas por defecto; email nunca público; salario deseado nunca público (canónico).
- **LEGAL_BASIS_REFERENCE:** SR-02.C — art. 6.1.b).
- **OPEN_ITEMS:** advertencia de no aportar datos sensibles en texto libre; verificación de que ningún campo induzca datos del art. 9. Una fotografía de perfil ordinaria no es dato biométrico salvo tratamiento técnico específico de identificación unívoca.

### D — Skills, experiencia, educación, proyectos y enlaces
- **ACTIVITY:** componentes estructurados del perfil.
- **PURPOSE:** completar el perfil y alimentar el cálculo del match.
- **DATA_CATEGORIES:** competencias, historial formativo y profesional declarado, proyectos, enlaces aportados por el usuario.
- **LEGAL_BASIS_REFERENCE:** SR-02.D — art. 6.1.b).
- **OPEN_ITEMS:** prohibición de diseño de enriquecimiento automático rastreando los enlaces aportados; sería finalidad distinta.

### E — Preferencias profesionales
- **ACTIVITY:** registro de preferencias declaradas.
- **PURPOSE:** parametrizar búsqueda, filtros y orden de resultados.
- **DATA_CATEGORIES:** preferencias declaradas por el candidato. Detalle de campos: `TO_VERIFY_IN_REPOSITORY`.
- **LEGAL_BASIS_REFERENCE:** SR-02.E — art. 6.1.b).

### F — Búsqueda de ofertas y filtros
- **ACTIVITY:** consulta del catálogo de ofertas.
- **PURPOSE:** prestación funcional nuclear del servicio.
- **DATA_CATEGORIES:** parámetros de consulta introducidos por el usuario.
- **RETENTION_STATUS:** **no se afirma la existencia de histórico de búsquedas.** Si se implantara, sería finalidad distinta bajo art. 6.1.f) con ponderación documentada.
- **LEGAL_BASIS_REFERENCE:** SR-02.F — art. 6.1.b).

### G — Ofertas guardadas
- **ACTIVITY:** guardado y gestión de oportunidades por el candidato.
- **PURPOSE:** permitir al candidato organizar su búsqueda.
- **DATA_CATEGORIES:** relación entre cuenta y oferta. Metadatos asociados: `TO_VERIFY_IN_REPOSITORY`.
- **LEGAL_BASIS_REFERENCE:** SR-02.G — art. 6.1.b).

### H — Match explicable determinista
- **ACTIVITY:** cálculo, presentación y explicación del score.
- **PURPOSE:** ordenar y explicar ofertas al candidato. Función consultiva.
- **DATA_CATEGORIES:** datos declarados del perfil y atributos de la oferta, procesados en ejecución.
- **RECIPIENT_CATEGORIES:** **ninguno. El score no se comunica a empleadores** (canónico).
- **RETENTION_STATUS:** **no se persisten resultados** (canónico). Función pura, sin llamadas de red.
- **SECURITY_SUMMARY:** cálculo sin salida a terceros (canónico).
- **LEGAL_BASIS_REFERENCE:** SR-02.H — art. 6.1.b).
- **OPEN_ITEMS:** versionado del conjunto de reglas y pesos como evidencia; ver SR-08.

### I — Portfolio público voluntario
- **ACTIVITY:** publicación opt-in de un subconjunto del perfil.
- **PURPOSE:** permitir al candidato exponer públicamente su perfil profesional.
- **DATA_SUBJECTS:** exclusivamente candidatos que activan la función.
- **DATA_CATEGORIES:** subconjunto seleccionado por el usuario, con preview previo. Nunca email ni salario deseado. Ubicación y disponibilidad privadas por defecto (canónico).
- **RECIPIENT_CATEGORIES:** público general. Indexación por motores de búsqueda: `TO_VERIFY_IN_REPOSITORY`.
- **TRANSFER_STATUS:** la publicación en abierto implica accesibilidad desde fuera del EEE; **no constituye por sí misma transferencia internacional en el sentido del capítulo V**, pero debe informarse como consecuencia. Alojamiento y CDN: `PENDING_SR_10`.
- **RETENTION_STATUS:** vigente mientras el usuario mantenga la opción activada. Comportamiento de despublicación y cachés: `TO_VERIFY_IN_REPOSITORY` + `PENDING_SR_11`.
- **LEGAL_BASIS_REFERENCE:** SR-02.I — art. 6.1.a), con acción de consentimiento separada y evidencia (art. 7.1).
- **OPEN_ITEMS:** decisión sobre `noindex` por defecto; imposibilidad de garantizar el borrado en cachés de terceros, que debe informarse expresamente.

### J — Soporte
- **ACTIVITY:** atención de consultas e incidencias a través del canal único.
- **PURPOSE:** dar soporte al usuario y trazar incidencias.
- **DATA_CATEGORIES:** contenido de la comunicación y clasificación interna.
- **SECURITY_SUMMARY:** escalado interno de incidencias de datos (canónico).
- **LEGAL_BASIS_REFERENCE:** SR-02.J — art. 6.1.b) y art. 6.1.f).
- **OPEN_ITEMS:** separación lógica entre soporte y ejercicio de derechos dentro del canal único; plazo propio de conservación.

### K — Ejercicio de derechos
- **ACTIVITY:** recepción, tramitación y acreditación de solicitudes de los arts. 15 a 22 RGPD.
- **PURPOSE:** cumplir obligaciones legales y acreditar su cumplimiento.
- **DATA_CATEGORIES:** identificación del solicitante, contenido, resolución y fechas.
- **SECURITY_SUMMARY:** trazabilidad interna de solicitudes (canónico). Identificación preferente por sesión autenticada, sin exigir copia de documento por defecto.
- **LEGAL_BASIS_REFERENCE:** SR-02.K — art. 6.1.c) y art. 5.2.
- **OPEN_ITEMS:** protocolo de plazos del art. 12.3.

### L — Seguridad y rate limiting
- **ACTIVITY:** control de tasa y prevención de abuso.
- **PURPOSE:** proteger la disponibilidad y la integridad del servicio.
- **DATA_CATEGORIES:** dirección IP.
- **RETENTION_STATUS:** **no aplica retención** (canónico): `req.ip` se procesa de forma efímera y en memoria; no se persiste; no se registra en logs; no existe dataset persistente de IP. Debe consignarse literalmente así en el RAT, como medida de minimización documentada (arts. 5.1.c) y 25).
- **SECURITY_SUMMARY:** procesamiento en memoria sin escritura (canónico). Umbrales y configuración concreta: fuera de repositorio por seguridad.
- **LEGAL_BASIS_REFERENCE:** SR-02.L — art. 6.1.f) y art. 6.1.c) en relación con el art. 32.
- **OPEN_ITEMS:** cualquier implementación futura que persista o registre IP es un tratamiento nuevo y exige ponderación, plazo, actualización del RAT y de la información al interesado.

### M — Backups y continuidad operativa
- **ACTIVITY:** copias de seguridad y restauración.
- **PURPOSE:** garantizar disponibilidad, integridad y capacidad de restauración.
- **DATA_CATEGORIES:** las de las actividades A a K, en copia.
- **RECIPIENT_CATEGORIES / TRANSFER_STATUS:** `PENDING_SR_10`.
- **SECURITY_SUMMARY:** `TO_VERIFY_IN_REPOSITORY`. **No se afirma cifrado en reposo ni la existencia de pruebas de restauración**: son requisitos deseables del art. 32.1, no hechos verificados.
- **LEGAL_BASIS_REFERENCE:** SR-02.M — art. 6.1.c) en relación con el art. 32.1.b) y c).
- **OPEN_ITEMS:** verificar existencia y configuración de backups; procedimiento documentado de supresión diferida —bloqueo, exclusión de restauración selectiva y eliminación por rotación—.

---

## SR-06.6 — QUÉ VERSIONAR EN REPOSITORIO Y QUÉ MANTENER FUERA

**Apto para repositorio versionado:** esquema y plantilla del RAT; finalidades, categorías de interesados y de datos, y referencias de base jurídica; descripción funcional de medidas de seguridad a nivel de categoría, sin parámetros explotables; reglas y pesos del match y su versionado; marcadores `PENDING_SR_10`, `PENDING_SR_11` y `TO_VERIFY_IN_REPOSITORY`; procedimientos internos redactados de forma genérica.

**No apto para repositorio:** identidad completa del responsable, identificador fiscal, domicilio y buzón; datos y contratos de encargados; configuraciones de seguridad explotables (rotación de claves, umbrales exactos de rate limiting, topología, reglas de firewall); credenciales, secretos y claves de API; registro de solicitudes de derechos y de incidencias; evidencias de aceptación y de consentimiento; listado nominal de accesos administrativos.

**Regla operativa:** el repositorio contiene **el modelo**; el entorno privado contiene **los valores**. Un RAT versionado debe poder leerse íntegramente sin aportar a un tercero ni un dato personal real ni un vector de ataque.

---

**REFERENCE:** SR-06
**CONCLUSION:** `RAT_REQUIRED_UNDER_CURRENT_LAW: YES`. La excepción del art. 30.5 es inaplicable por el criterio de tratamiento no ocasional, reforzado por el criterio de riesgo. Matriz preliminar A-M emitida con huecos declarados y sin hechos técnicos no verificados. Reforma del art. 30.5 en tramitación y sin efecto jurídico actual.
**CLASSIFICATION:** REQUIRED (bajo Derecho vigente) / REGULATORY_WATCH abierta.
**OFFICIAL_LEGAL_BASIS:** RGPD arts. 5.2, 24, 30 y considerando 82; LOPDGDD art. 31.
**OFFICIAL_SOURCES:** EUR-Lex; BOE; AEPD; información pública sobre el estado de tramitación del paquete Ómnibus Digital.
**FACTS_USED:** cuenta persistente; perfil/CV continuado; autenticación por sesión; ofertas guardadas; portfolio opt-in; seguridad permanente; backups recurrentes; solicitudes de derechos con trazabilidad; `req.ip` efímera; sin proveedores confirmados.
**RESPONSIBLE_DECISIONS_USED:** privacidad por diseño ya decidida; sin analytics de terceros; sin publicidad; sin tracking; nuevos terceros requieren revisión previa.
**SPECIALIST_REASONING_SUMMARY:** El criterio que decide no es el número de empleados sino el carácter no ocasional del tratamiento, propio de cualquier producto con cuenta persistente. La matriz se emite con huecos declarados y con los detalles técnicos no acreditados marcados para verificación, en lugar de rellenarse con supuestos verosímiles. La reforma en curso del art. 30.5 se documenta como vigilancia normativa, sin anticipar su contenido ni condicionar la conclusión.
**REQUIRED_BEFORE_TRAMO_B:** cerrar `PENDING_SR_10` y `PENDING_SR_11`; **verificar en repositorio todos los campos marcados `TO_VERIFY_IN_REPOSITORY` y sustituirlos por hechos acreditados**; fijar plazos propios para soporte y para el registro de derechos; formalizar el RAT con fecha, versión y responsable de mantenimiento; recomprobar el estado del art. 30.5 antes de la revisión humana final.
**NON_BLOCKING_RECOMMENDATIONS:** mantener el RAT en formato estructurado versionado junto al código, con revisión obligatoria ante cualquier cambio funcional que introduzca o modifique un tratamiento.
**PRIVATE_INFORMATION_REQUIRED:** YES — **IF_YES:** categoría «identidad y contacto del responsable» y categoría «proveedores y ubicaciones de tratamiento», solo para custodia privada.
**BLOCKS_LEGAL_GATE:** CONDITIONAL.
**CONFIDENCE_OR_OPEN_INTERPRETATION:** Alta sobre la inaplicabilidad de la excepción bajo Derecho vigente. Abierta: el contenido final de la reforma del art. 30.5, que no se anticipa.

---

# REFERENCE: SR-07 — EVALUACIÓN DE IMPACTO (EIPD / DPIA) (v1.1)

**PRELIMINARY_RISK_ASSESSMENT:**

**Paso 1 — Supuestos del art. 35.3 RGPD.**

- *a) evaluación sistemática y exhaustiva de aspectos personales basada en tratamiento automatizado, incluida la elaboración de perfiles, **sobre cuya base se tomen decisiones** que produzcan efectos jurídicos o afecten significativamente de modo similar:* no concurre. Falta el elemento «decisiones» (SR-08 Parte A). Además la evaluación no es exhaustiva: cuatro factores declarados.
- *b) tratamiento a gran escala de categorías especiales o de datos penales:* no concurre.
- *c) observación sistemática a gran escala de una zona de acceso público:* no concurre.

**Paso 2 — RECÁLCULO ÍNTEGRO DE LOS ONCE CRITERIOS OFICIALES DE LA LISTA AEPD (art. 35.4).**

> **CORRECCIÓN APLICADA.** La v1.0 utilizaba una lista aproximada que incluía indebidamente las transferencias internacionales y trataba la publicación del portfolio como criterio susceptible de computar. Ninguna de las dos figura entre los once criterios oficiales. Se recalcula sobre el texto publicado por la AEPD.

| # | Criterio oficial (enunciado abreviado) | Concurre | Razonamiento |
|---|---|---|---|
| 1 | Perfilado o valoración de sujetos, incluida la recogida de datos en múltiples ámbitos de su vida (desempeño en el trabajo, personalidad y comportamiento), que cubran varios aspectos de su personalidad o sus hábitos | **PARCIAL — se computa como SÍ por prudencia** | El match asigna una valoración basada en atributos personales declarados. Sin embargo, **no** recoge datos en múltiples ámbitos de la vida, **no** cubre personalidad ni hábitos y **no** analiza comportamiento: se limita a cuatro factores profesionales declarados. El criterio se computa afirmativamente por cautela, pero su intensidad es baja y su encaje literal es discutible |
| 2 | Decisiones automatizadas, o que contribuyan en gran medida a ellas, incluida cualquier decisión que impida el ejercicio de un derecho, el acceso a un bien o servicio o formar parte de un contrato | **NO** | El match no descarta, no bloquea candidaturas, no impide postular y no se comunica a empleadores. El catálogo permanece íntegramente accesible mediante búsqueda y filtros |
| 3 | Observación, monitorización, supervisión, geolocalización o control sistemático y exhaustivo, incluida la recogida de datos y metadatos a través de redes o aplicaciones, así como el procesamiento de identificadores únicos que permitan la identificación de usuarios de servicios de la sociedad de la información | **NO en la vertiente de monitorización · HUMAN_REVIEW_REQUIRED en la vertiente de identificadores únicos** | No hay analytics de terceros, tracking, geolocalización ni persistencia de IP. La segunda vertiente del criterio, leída literalmente, alcanzaría a cualquier servicio con cuenta de usuario; la lectura sistemática exige que los identificadores sirvan a una finalidad de observación o seguimiento, que aquí no existe. **Se deja expresamente abierto a revisión humana**, dado que su apreciación afirmativa alcanzaría el umbral de dos criterios |
| 4 | Categorías especiales del art. 9.1, datos de condenas o infracciones del art. 10, o datos que permitan determinar la situación financiera o de solvencia patrimonial, o deducir información relacionada con categorías especiales | **NO, con matiz declarado** | No se recaban datos del art. 9 ni del art. 10 de forma intencional. Se hace constar que el perfil incluye **salario deseado**: es una expectativa declarada, no un dato que determine la situación financiera o la solvencia patrimonial del candidato, y además nunca es público. El matiz se documenta para que el revisor humano pueda contrastarlo |
| 5 | Datos biométricos con el propósito de identificar de manera única a una persona | **NO** | Sin tratamiento biométrico. Una fotografía de perfil ordinaria no lo es sin medios técnicos específicos de identificación unívoca |
| 6 | Datos genéticos para cualquier fin | **NO** | No concurre |
| 7 | Datos a gran escala, conforme a los criterios de WP243 | **NO** | Fase previa a producción, sin datos reales, territorio España |
| 8 | Asociación, combinación o enlace de registros de bases de datos de dos o más tratamientos con finalidades diferentes o responsables distintos | **NO** | Sin enriquecimiento externo, sin fuentes de terceros, sin rastreo de los enlaces aportados por el usuario |
| 9 | Datos de sujetos vulnerables o en riesgo de exclusión social, incluidos menores de 14 años, personas con discapacidad, usuarios de servicios sociales y víctimas de violencia de género | **NO** | Servicio limitado a 18+ con procedimiento reactivo de detección (SR-04). No se recaban datos de discapacidad |
| 10 | Nuevas tecnologías o uso innovador de tecnologías consolidadas, incluida su utilización a nueva escala, con nuevo objetivo o combinadas con otras | **NO** | Función pura determinista con pesos fijos definidos por personas. Sin IA, sin ML, sin llamadas de red, sin persistencia |
| 11 | Tratamientos que impidan a los interesados ejercer sus derechos, utilizar un servicio o ejecutar un contrato | **NO** | Ninguna funcionalidad se condiciona al score |

**RECUENTO OFICIAL:**

```
CRITERIA_CONFIRMED:            1  (criterio 1, computado por prudencia)
CRITERIA_OPEN_TO_REVIEW:       1  (criterio 3, vertiente de identificadores únicos)
CRITERIA_NOT_MET:              9
AEPD_TWO_CRITERIA_THRESHOLD:   NOT_REACHED_ON_CURRENT_ANALYSIS
```

**Elementos expresamente excluidos del contador:**

```
INTERNATIONAL_TRANSFERS:
PENDING_SR_10

ROLE_IN_DPIA_ASSESSMENT:
GENERAL_RISK_CONTEXT_ONLY

AEPD_35_4_CRITERION:
NO
```

Las transferencias internacionales **no figuran entre los once criterios de la lista española** y no computan. SR-10 puede modificar el **análisis general de riesgos del art. 35.1** y activar las obligaciones del **capítulo V RGPD** —instrumentos de transferencia, evaluación de impacto de la transferencia, garantías adecuadas—, que son obligaciones autónomas y de naturaleza distinta. Pero SR-10 **no incrementa por sí mismo el contador de criterios de la lista AEPD**.

```
PORTFOLIO_PUBLIC:

GENERAL_RISK_FACTOR:
YES

AEPD_35_4_STANDALONE_CRITERION:
NO
```

La publicación del portfolio es el elemento de mayor exposición del producto y pesa en el análisis general de riesgo del art. 35.1, pero **no constituye por sí misma ninguno de los once criterios**. Su riesgo está mitigado estructuralmente: opt-in, desactivado por defecto, preview previo, exclusión de email y salario, ubicación y disponibilidad privadas por defecto, y revocable.

**Paso 3 — Análisis individualizado del art. 35.1.**

- **Perfil/CV:** datos declarados voluntariamente, bajo control del interesado, con privacidad por defecto en los campos sensibles a exposición. Riesgo bajo.
- **Portfolio público:** riesgo medio-bajo, no sistémico, limitado a quien lo activa mediante acto propio, informado y reversible.
- **Match determinista:** riesgo bajo por diseño. El elemento de riesgo real no es el score sino el tratamiento de los factores ausentes: `factor: null` con `contribution: 0` penaliza sistemáticamente los perfiles incompletos, lo que es una cuestión de equidad (art. 5.1.a) abordada en SR-08 Parte C.
- **Preferencias profesionales:** declaradas y modificables, sin inferencia. Riesgo bajo.
- **Candidatos como categoría de interesados:** adultos en contexto de empleo. El contexto afecta a oportunidades vitales, lo que justifica cautela pese a la baja puntuación en los criterios formales.
- **Seguridad y rate limiting:** minimizado hasta no persistir la IP. Riesgo residual muy bajo.
- **Volumen potencial:** no acreditado. Es el factor que puede desplazar la evaluación.
- **Ausencia de recruiters, de IA/ML, de decisión automatizada de contratación y de categorías especiales intencionales:** las cuatro ausencias sostienen conjuntamente la conclusión.

**DPIA_MANDATORY_NOW: NO**

**FINAL_CLASSIFICATION: CONDITIONAL**

Condicionada exclusivamente a:

1. **Validación humana**, en particular sobre el criterio 1 (computado por prudencia pese a su encaje literal discutible) y sobre la vertiente de identificadores únicos del criterio 3, cuya apreciación afirmativa alcanzaría el umbral de dos criterios.
2. **Cambio material de hechos**, conforme a los triggers enumerados.
3. **Análisis general del art. 35.1**, que opera con independencia del contador de criterios: la lista de la AEPD es orientativa y no exhaustiva, y el art. 35.1 puede exigir EIPD aunque no se alcancen dos criterios si el tratamiento entraña probablemente un alto riesgo por su naturaleza, alcance, contexto o fines.

**La clasificación ya no se condiciona a las transferencias internacionales.**

**Conservación del análisis de no necesidad: SÍ, expresamente recomendada.** Los arts. 5.2 y 24 exigen poder demostrar el cumplimiento, y WP248 recomienda documentar y motivar las razones por las que no se realiza una EIPD. Un documento breve, fechado y firmado, que recoja este recuento de once criterios, la justificación de cada resultado y la fecha de próxima revisión, convierte una decisión discutible en una decisión defendible. Sin él, la ausencia de EIPD es indistinguible de la omisión negligente.

**DPIA_REASSESSMENT_TRIGGERS:**

1. RECRUIT fuera de HOLD.
2. CANDIDATE_DISCOVERY fuera de HOLD.
3. Score comunicado a empleadores → activa el criterio 2.
4. Perfilado con inferencia sobre la persona, o extensión de la valoración a personalidad, hábitos o comportamiento → refuerza el criterio 1 hasta su encaje pleno.
5. IA/ML, embeddings, ranking aprendido o scoring predictivo → activa el criterio 10 y probablemente el 1.
6. Categorías especiales, incluido cualquier campo de discapacidad o salud → criterio 4.
7. Monitorización sistemática de la actividad del candidato o analítica de comportamiento → criterio 3.
8. Combinación o enriquecimiento con fuentes externas, incluido el rastreo de enlaces aportados → criterio 8.
9. Gran escala → criterio 7.
10. Persistencia o registro de direcciones IP → refuerza el criterio 3.
11. Portfolio activado por defecto o ampliación de campos publicables por defecto → art. 35.1.
12. Ampliación territorial más allá de España → criterio 7.
13. Cualquier funcionalidad que oculte, filtre o excluya ofertas en función del score → criterios 2 y 11.
14. Rebaja del límite de edad por debajo de 18 → criterio 9.
15. Cierre de SR-10 con transferencias fuera del EEE → **no altera el contador**, pero obliga a rehacer el análisis general del art. 35.1 y activa el capítulo V RGPD.

---

**REFERENCE:** SR-07
**CONCLUSION:** Recalculados los once criterios oficiales de la lista AEPD: uno confirmado por prudencia, uno abierto a revisión humana, nueve no concurrentes. No se alcanza el umbral de dos criterios. Las transferencias internacionales y la publicación del portfolio no son criterios de la lista y se reclasifican como contexto general de riesgo.
**CLASSIFICATION:** CONDITIONAL
**OFFICIAL_LEGAL_BASIS:** RGPD arts. 24, 35.1, 35.3, 35.4, 35.5, 35.7, 35.11, capítulo V y considerandos 75, 84, 90 y 91; AEPD, listas de los arts. 35.4 y 35.5; GT29/EDPB WP248 rev.01.
**OFFICIAL_SOURCES:** EUR-Lex; AEPD (texto oficial de los once criterios); EDPB.
**FACTS_USED:** los del bloque canónico, sin alteración.
**RESPONSIBLE_DECISIONS_USED:** RECRUIT y CANDIDATE_DISCOVERY en HOLD; RECRUITER_DATABASE_ACCESS: NO; MATCH_ROLE: ADVISORY_ONLY; SCORE_SHARED_WITH_EMPLOYERS: NO; portfolio opt-in desactivado por defecto; privacidad por defecto en ubicación y disponibilidad.
**SPECIALIST_REASONING_SUMMARY:** El producto se sitúa por debajo del umbral de alto riesgo por decisiones de diseño concretas y verificables. El recálculo sobre el texto oficial confirma la conclusión anterior pero por razones distintas y más sólidas: la v1.0 llegaba al resultado correcto con un contador mal construido. Los dos puntos de fricción reales —el encaje del criterio 1 y la vertiente de identificadores únicos del criterio 3— se dejan expuestos en lugar de resueltos, porque cualquiera de ellos podría desplazar el resultado y su apreciación corresponde al revisor humano.
**REQUIRED_BEFORE_TRAMO_B:** (1) emitir y fechar el documento de análisis de no necesidad de EIPD con el recuento de los once criterios; (2) obtener pronunciamiento humano sobre los criterios 1 y 3; (3) incorporar los quince triggers a un checklist de revisión obligatoria previo a cualquier cambio funcional.
**NON_BLOCKING_RECOMMENDATIONS:** una EIPD ligera y voluntaria centrada en el portfolio público sería el ejercicio de mayor rendimiento por esfuerzo. WP248 recuerda que su realización voluntaria no perjudica al responsable.
**PRIVATE_INFORMATION_REQUIRED:** NO
**BLOCKS_LEGAL_GATE:** CONDITIONAL
**CONFIDENCE_OR_OPEN_INTERPRETATION:** Media-alta. Interpretación expresamente abierta en los criterios 1 y 3, cuya apreciación conjunta afirmativa alcanzaría el umbral de dos criterios y convertiría la EIPD en obligatoria. Ésta, y no las transferencias, es la incertidumbre real del análisis.

---

# REFERENCE: SR-08 — MATCH / ARTÍCULO 22 RGPD / AI ACT (v1.1)

> Los hechos técnicos del bloque canónico no se modifican.

---

## PARTE A — ARTÍCULO 22 RGPD

```
AUTOMATED_PROCESSING:            YES
SOLELY_AUTOMATED_DECISION:       NO
LEGAL_EFFECT:                    NO
SIMILARLY_SIGNIFICANT_EFFECT:    NO
ARTICLE_22_APPLIES_NOW:          NO
```

### A.1 — Algoritmo automatizado ≠ decisión automatizada del art. 22

La distinción es jurídicamente correcta. El art. 22.1 no prohíbe el tratamiento automatizado: confiere el derecho a no ser objeto de **una decisión** basada únicamente en tratamiento automatizado **que produzca efectos jurídicos o afecte significativamente de modo similar**. Tres elementos acumulativos: tratamiento únicamente automatizado; existencia de una decisión; efecto cualificado.

El primero concurre. Pero el tratamiento automatizado por sí solo activa las obligaciones generales de licitud, transparencia y exactitud, no el art. 22. Un buscador, un filtro o una ordenación por relevancia son tratamientos automatizados y no son decisiones del art. 22. WP251 rev.02 exige una decisión con impacto real y suficientemente relevante, con referencia a efectos que alteren significativamente circunstancias, comportamiento o elecciones, tengan impacto prolongado o permanente, o conduzcan a exclusión o discriminación.

### A.2 — ¿Existe una «decisión»?

No, en el modelo actual. El sistema produce una **ordenación acompañada de explicación**, dirigida al propio interesado, que conserva íntegramente la capacidad de ignorarla. Quien decide es el candidato. No hay tercero receptor ni efecto automático derivado del resultado.

La doctrina SCHUFA amplió el concepto: el establecimiento automatizado de un valor de probabilidad puede constituir por sí mismo «decisión» del art. 22 cuando se transmite a un tercero y éste lo utiliza de manera determinante para conceder o denegar una relación contractual. **La ampliación descansa en dos elementos que JobIT no reúne: la transmisión a un tercero y la determinación de la decisión de ese tercero.** `SCORE_SHARED_WITH_EMPLOYERS: NO` y `RECRUITER_DATABASE_ACCESS: NO` son literalmente los hechos que sitúan a JobIT fuera del supuesto.

### A.3 — Efecto jurídico y efecto significativamente similar

**Efecto jurídico: NO.** El score no crea, modifica ni extingue posición jurídica alguna.

**Efecto significativamente similar: NO,** con el razonamiento siguiente, que conviene explicitar porque es donde la conclusión podría discutirse. Cabe argumentar que ordenar ofertas de empleo influye materialmente en las oportunidades laborales, y que el empleo es el ámbito donde WP251 sitúa el listón de la afectación significativa. Lo que neutraliza la objeción es un hecho arquitectónico: **el match ordena, pero no filtra.** El candidato mantiene acceso íntegro al catálogo; ninguna oferta se oculta, bloquea ni retira en función del score; no se le impide postular; y la lógica se le explica factor a factor. No hay exclusión, ni pérdida de acceso, ni opacidad.

**Consecuencia de diseño, la más importante del paquete:** el razonamiento deja de sostenerse el día en que el producto oculte, filtre, colapse o degrade la visibilidad de ofertas por debajo de un umbral de score. Una funcionalidad aparentemente inocua —«mostrar solo ofertas con match superior a 60»— convertiría la ordenación en selección. Si se implementa, debe ser **elección explícita y reversible del usuario**, nunca comportamiento por defecto, conservando siempre acceso al catálogo completo.

### A.4 — Efecto de modificar cada hecho

| Cambio de hecho | Efecto sobre el art. 22 |
|---|---|
| Compartir el score con empleadores | **Crítico.** Reproduce el supuesto SCHUFA |
| Recruiters utilizando el score | **Crítico.** Ídem, con uso sistemático |
| Ordenar candidatos para empresas | **Crítico.** Invierte la dirección del producto |
| Excluir candidatos | **Determinante.** Efecto excluyente directo |
| Bloquear una candidatura | **Determinante.** Impide el acceso a una oportunidad |
| Ranking de candidatos | **Crítico.** Ordena personas ante quien decide |
| Recomendación de contratación | **Determinante.** Decisión en sentido material |
| Decisiones basadas sustancialmente en el score | **Determinante.** El criterio de SCHUFA es el carácter determinante |
| Ocultar o filtrar ofertas por umbral | **Alto.** Convierte ordenación en selección |
| Mantener todos los hechos actuales | Art. 22 no aplicable |

### A.5 — Obligaciones que operan pese a la inaplicación del art. 22

Los arts. 13.2.f), 14.2.g) y 15.1.h) exigen información sobre la lógica aplicada en los casos del art. 22.1 y 4; al no activarse el art. 22, no operan de forma autónoma. Subsisten el principio de transparencia y equidad (art. 5.1.a), el de exactitud (art. 5.1.d), la información del art. 13 y la obligación del art. 12 de comunicar de forma concisa, transparente, inteligible y accesible.

**ARTICLE_22_REASSESSMENT_TRIGGERS:** salida de RECRUIT o CANDIDATE_DISCOVERY de HOLD; cualquier comunicación del score o de sus factores a un empleador, directa o indirecta, incluida su exposición en el portfolio; cualquier ordenación o puntuación de personas destinada a un tercero; cualquier filtrado, ocultación o degradación de visibilidad por umbral; cualquier automatismo que produzca efecto sin intervención del candidato; scoring predictivo; integración con ATS.

---

## PARTE B — PERFILADO

```
PROFILING_UNDER_GDPR: CONDITIONAL — con inclinación afirmativa
```

**Definición del art. 4.4:** tratamiento automatizado (i) sobre datos personales (ii) consistente en utilizarlos para **evaluar determinados aspectos personales**, en particular para analizar o predecir aspectos relativos, entre otros, al rendimiento profesional, preferencias, intereses, fiabilidad, comportamiento o ubicación (iii).

(i) y (ii) se cumplen. (iii) es discutible: cabe sostener que el match no evalúa a la persona sino la correspondencia entre atributos declarados y requisitos de una oferta, y que no analiza ni predice —no infiere rendimiento futuro ni deduce rasgos no declarados—. Pero el resultado es un valor numérico personal que incorpora dimensiones que son aspectos personales del candidato, y el propio art. 4.4 menciona expresamente el rendimiento profesional y las preferencias.

| Elemento | Naturaleza | Valoración |
|---|---|---|
| Datos declarados por el candidato | Aportados, verificables y rectificables por él | No son inferencias |
| Reglas con pesos fijos | Definidas por personas, deterministas, estables | No generan conocimiento nuevo |
| Score y nivel | Resultado sintético asociado a la persona | Aproxima la figura al art. 4.4 |
| Inferencias sobre la persona | **Ausentes** | Sin predicción ni deducción |
| Evaluación de aspectos personales | Parcial, limitada a adecuación declarada | Zona gris |

**Conclusión operativa: tratar el match como elaboración de perfiles en sentido amplio**, no por ser la lectura inevitable sino por ser la prudente y de coste prácticamente nulo en este modelo.

**Consecuencias, sin aplicación del art. 22:**

1. **No se activa el art. 21.1** (oposición): opera respecto de tratamientos basados en el art. 6.1.e) o f), y la base del match es el art. 6.1.b). Perfilado no equivale automáticamente a derecho de oposición.
2. **No se activan** las obligaciones específicas de los arts. 13.2.f), 14.2.g) y 15.1.h).
3. **Sí se refuerzan** los principios de equidad y transparencia (art. 5.1.a) y exactitud (art. 5.1.d).
4. **Sí opera el art. 25** sobre configuración de pesos y tratamiento de valores nulos.
5. **Sí cuenta** en el criterio 1 de la lista AEPD (SR-07), sin alcanzar por sí solo el umbral.
6. **Sí es presupuesto** del art. 34.1.d) LOPDGDD, cuya activación depende adicionalmente de la gran escala (SR-05).

---

## PARTE C — TRANSPARENCIA DEL ALGORITMO

```
CURRENT_EXPLAINABILITY_MODEL: SUFFICIENT (respecto de las exigencias hoy aplicables)
                              CONDITIONAL (si cambia algún hecho canónico)
```

**Marco aplicable.** No activado el art. 22, el estándar procede de los arts. 5.1.a) y 12: información concisa, transparente, inteligible, accesible y en lenguaje claro.

Como referencia voluntaria de calidad resulta útil el estándar del TJUE en Dun & Bradstreet Austria (C-203/22, 27 de febrero de 2025), que interpretó la «información significativa sobre la lógica aplicada» del art. 15.1.h) como un derecho a la explicación **del procedimiento y de los principios concretamente aplicados** para explotar de forma automatizada los datos del interesado, de modo que pueda ejercer eficazmente sus derechos, **sin que ello implique comunicar el algoritmo ni el código fuente**, y articulando el equilibrio con los secretos comerciales.

**JobIT no debe publicar código fuente.** No existe obligación de hacerlo ni siquiera en los supuestos plenos del art. 22.

| Elemento | Estado | Valoración |
|---|---|---|
| Score 0-100 | Se muestra (canónico) | Adecuado |
| Nivel | Se muestra (canónico) | Adecuado |
| Desglose por factores | Se muestra (canónico) | Supera el mínimo exigible |
| Explicación comprensible | Se ofrece (canónico) | Supera el mínimo exigible |
| Pesos 50/20/20/10 | Visibilidad al usuario: `TO_VERIFY_IN_REPOSITORY` | Mejora recomendada |
| Tratamiento de factores ausentes | Implementado (canónico); si se explica al usuario: `TO_VERIFY_IN_REPOSITORY` | **Mejora necesaria** |
| Importancia y consecuencias previstas | Parcialmente cubierto por el copy aprobado | Mejora recomendada |
| Naturaleza determinista | Recogida en el copy aprobado | Adecuado |

**REQUIRED_IMPROVEMENTS:**

1. **Explicar el tratamiento de los factores ausentes.** Prioritaria. Que un factor sin información puntúe 0 implica que un perfil incompleto obtiene un score sistemáticamente inferior sin que ello refleje peor adecuación real; si el candidato no lo comprende, el score le resulta engañoso, lo que compromete el art. 5.1.a). Convierte además una penalización opaca en una indicación accionable.
2. **Publicar los pesos y el carácter determinista** en una página de explicación del match accesible sin autenticación.
3. **Versionar el conjunto de reglas** y mostrar el identificador de versión junto al score.
4. **Vincular la explicación a la acción:** indicar qué dato del perfil determina cada contribución, con enlace directo de edición (art. 16).
5. **Disciplina de copy:** el score mide adecuación entre perfil declarado y oferta concreta; no mide valía profesional ni empleabilidad. Evitar lenguaje evaluativo y gamificación.
6. **Replicar el copy empresarial aprobado en la interfaz del match**, no solo en documentos legales.

---

## PARTE C.bis — ESTATUS DSA Y P2B

> **CORRECCIÓN APLICADA.** Se retira la afirmación categórica de la v1.0 según la cual JobIT no es plataforma en línea en su configuración actual.

```
DSA_ONLINE_PLATFORM_STATUS:  CONDITIONAL / HUMAN_REVIEW_REQUIRED
ART_27_DSA:                  DO_NOT_CLOSE_IN_SR-08
```

**Planteamiento del problema.** El portfolio público implica que JobIT **almacena información facilitada por el destinatario del servicio** —el candidato— y, a petición de éste, **la difunde al público**. Esa descripción coincide con la estructura de los conceptos del art. 3 del Reglamento (UE) 2022/2065: servicio de alojamiento de datos, y plataforma en línea como servicio de alojamiento que además difunde al público la información almacenada a petición del destinatario.

**Elemento que debe analizarse y que no se resuelve aquí.** El propio art. 3.i) excluye del concepto de plataforma en línea el supuesto en que esa difusión constituya **una funcionalidad menor y puramente accesoria de otro servicio, o una funcionalidad menor del servicio principal**, que no pueda utilizarse sin ese otro servicio, y siempre que la integración no tenga por objeto eludir la aplicación del Reglamento. El considerando 13 del DSA desarrolla esa exclusión.

Argumentos en ambos sentidos, que se dejan expuestos:

- *A favor de la exclusión:* el portfolio es opt-in, está desactivado por defecto, no puede utilizarse sin la cuenta y el perfil, no constituye el objeto del servicio —que es la búsqueda y el match para el candidato—, no existe interacción entre usuarios ni contenido difundible más allá del propio perfil de quien lo publica, y no hay ánimo de elusión.
- *En contra:* la difusión al público es real y no meramente técnica; el contenido lo aporta el usuario; y la valoración de «menor y puramente accesoria» es cualitativa, no cuantitativa, por lo que no puede resolverse por la mera constatación de que la función esté desactivada por defecto.

**No se resuelve en este documento.** La calificación exige análisis específico y validación humana, porque de ella dependen obligaciones sustantivas: exención de responsabilidad y mecanismos de notificación y acción para servicios de alojamiento; y, en su caso, sistema interno de reclamaciones, declaración de motivos, obligaciones de información y **art. 27 (transparencia de los sistemas de recomendación)** para plataformas en línea. Se hace constar que existen exenciones para microempresas y pequeñas empresas respecto de determinadas obligaciones de la sección 3 del capítulo III, cuyo alcance debe verificarse en el mismo análisis.

**Relación con la Parte C.** Si el análisis concluyera que JobIT es plataforma en línea, el art. 27 DSA impondría obligaciones propias de transparencia sobre los parámetros principales del sistema de recomendación —que el match sería—, con exigencias de redacción y ubicación en las condiciones generales. **Las mejoras 2 y 3 de la Parte C anticipan sustancialmente ese contenido**, por lo que su implementación reduce el riesgo con independencia del resultado del análisis.

**P2B — Reglamento (UE) 2019/1150.** Se mantiene **separado y condicionado**. Su art. 5 impone transparencia sobre los parámetros de clasificación a los servicios de intermediación en línea con **usuarios profesionales**. En la configuración actual no existen empleadores como usuarios profesionales del servicio, por lo que no resulta aplicable. **La activación de RECRUIT o de cualquier funcionalidad business-facing obliga a rehacer este análisis**, y es una consecuencia que suele pasarse por alto al evaluar esa funcionalidad.

---

## PARTE D — REGLAMENTO (UE) 2024/1689 (AI ACT)

**STEP_1 — ¿Cumple el match la definición de «sistema de IA» del art. 3.1?**

| Elemento | Match de JobIT | Cumple |
|---|---|---|
| Basado en máquinas | Software ejecutado en backend | SÍ |
| Autonomía | Se ejecuta sin intervención humana en cada consulta, dentro de reglas íntegramente predefinidas | PARCIAL |
| Capacidad de adaptación tras el despliegue | Ninguna: pesos fijos, sin reentrenamiento ni ajuste automático | NO (elemento potestativo) |
| Objetivos explícitos o implícitos | Ordenar y explicar ofertas | SÍ |
| **Capacidad de inferencia** | **Ausente.** Función pura que aplica una suma ponderada con pesos definidos por personas; no deriva reglas de los datos, no razona, no genera conocimiento nuevo | **NO** |
| Tipos de resultados | Score, nivel y explicación: formalmente una recomendación | SÍ |
| Interacción con el entorno | Influye en un entorno virtual | SÍ |

El elemento decisivo es la **capacidad de inferir cómo generar resultados**, que las Directrices de la Comisión de 6 de febrero de 2025 identifican como el rasgo que distingue un sistema de IA del software tradicional. Las Directrices excluyen los sistemas basados en reglas explícitas definidas únicamente por personas físicas, el tratamiento básico de datos, la optimización matemática y los sistemas basados en heurística clásica o predicciones sencillas.

**No se aplica el atajo «determinista igual a fuera».** Las propias Directrices admiten que sistemas basados en lógica y conocimiento —sistemas expertos con motor de inferencia— sí pueden ser sistemas de IA pese a no usar aprendizaje automático. Lo determinante no es el determinismo, sino la existencia de un mecanismo que derive la manera de producir la salida. El match no lo posee: los pesos 50/20/20/10 son una decisión humana codificada.

```
CURRENT_MATCH_AI_SYSTEM: NO
```

**STEP_2 — Intended purpose (art. 3.12).** Asistir al candidato en la comprensión y ordenación de ofertas publicadas mediante un cálculo de adecuación explicado, con carácter consultivo. **No** está destinado a evaluar candidatos para empleadores, filtrar candidaturas ni apoyar decisiones de contratación. La finalidad prevista es elemento normativo de clasificación: debe quedar documentada y ser coherente con la interfaz, la documentación técnica y el copy aprobado.

**STEP_3 — Art. 6.** `NOT_APPLICABLE`, por no superarse el paso 1. A efectos de futuro: el art. 6.3 contiene un filtro que puede excluir del alto riesgo a sistemas encuadrables en el Anexo III cuando no planteen un riesgo importante de perjuicio y concurra alguno de sus supuestos —tarea procedimental limitada, mejora del resultado de una actividad humana previa, detección de patrones o desviaciones sin sustituir la valoración humana, o tarea preparatoria—, **con la salvedad expresa de que el filtro no opera cuando el sistema realiza elaboración de perfiles de personas físicas**. Dada la conclusión de la Parte B, esta salvedad es especialmente relevante para JobIT.

**STEP_4 — Anexo III, punto 4 (empleo).** `NOT_APPLICABLE` en el estado actual. Analíticamente: el punto abarca los sistemas destinados a la contratación o selección —en particular para publicar anuncios de empleo dirigidos a determinadas personas, analizar y filtrar solicitudes y evaluar candidatos— y los destinados a decidir sobre condiciones de trabajo, promoción o extinción, asignar tareas o supervisar y evaluar el desempeño. Un sistema que ordena **ofertas para una persona** no es el reflejo automático de uno que ordena **personas para una oferta**; pero la referencia a los anuncios de empleo dirigidos a determinadas personas hace que **un ranking personalizado de ofertas basado en aprendizaje automático pueda quedar razonablemente comprendido**, mientras que el mismo ranking determinista no lo está por no ser siquiera sistema de IA. El análisis debe hacerse ahí, y no antes.

```
CURRENT_MATCH_HIGH_RISK: NOT_APPLICABLE
```

**Calendario vigente a 18/08/2026**, tras el Reglamento (UE) 2026/1744:

| Bloque | Fecha |
|---|---|
| Prácticas prohibidas (art. 5) | En aplicación desde febrero de 2025 |
| Alfabetización en materia de IA (art. 4) | En aplicación |
| Obligaciones de transparencia (art. 50) | En aplicación desde el 2 de agosto de 2026 |
| Alto riesgo, Anexo III | Aplazado al 2 de diciembre de 2027 |
| Alto riesgo, Anexo I | Aplazado al 2 de agosto de 2028 |

El aplazamiento no reduce el trabajo técnico, solo su exigibilidad.

### D.bis — ARTÍCULO 50: DESGLOSE POR ROL Y CASO DE USO

> **CORRECCIÓN APLICADA.** Se retira la afirmación de la v1.0 según la cual la introducción de un LLM, un chatbot o contenido generado activaría automáticamente el art. 50. El art. 50 contiene obligaciones **distintas** según el rol —proveedor o responsable del despliegue— y el caso de uso, y ninguna de ellas es automática.

```
ART_50_APPLICATION: NOT_AUTOMATIC — CASE_BY_CASE_ANALYSIS_REQUIRED
```

| Caso | Supuesto | Análisis aplicable |
|---|---|---|
| **A** | Sistema de IA destinado a **interactuar directamente con personas físicas** | Analizar **art. 50.1**: obligación del proveedor de diseñarlo de modo que se informe a la persona de que interactúa con un sistema de IA, salvo que resulte evidente para una persona razonablemente informada, atenta y perspicaz, atendiendo a las circunstancias y al contexto de uso |
| **B** | **Proveedor** de sistema de IA que genera contenido sintético de audio, imagen, vídeo o texto | Analizar **art. 50.2**: marcado de las salidas en formato legible por máquina y detectabilidad de su carácter generado o manipulado artificialmente, con las excepciones y condiciones de eficacia técnica que el propio precepto prevé |
| **C** | **Responsable del despliegue** que genera o manipula contenido de imagen, audio o vídeo constitutivo de **ultrasuplantación** | Analizar **art. 50.4** y sus salvedades, incluidas las relativas a obras manifiestamente artísticas, creativas o satíricas |
| **D** | **Responsable del despliegue** que genera o manipula **texto publicado con el fin de informar al público sobre asuntos de interés público** | Analizar **art. 50.4** y sus excepciones, en particular la relativa a los supuestos con revisión humana o control editorial y responsabilidad editorial sobre la publicación |
| **E** | **Uso interno** de un LLM o de un componente de IA que no encaje en A a D | `ART_50_NOT_AUTOMATIC`. Requiere análisis según función concreta y rol asumido. El uso interno de herramientas de IA para tareas de desarrollo, redacción o soporte **no activa por sí mismo** las obligaciones del art. 50 |

Se hace constar además que el art. 50 contiene un supuesto adicional referido a los responsables del despliegue de sistemas de reconocimiento de emociones o de categorización biométrica, no relevante para JobIT en ningún escenario previsto.

```
ANY_NEW_AI_OR_LLM: AI_ACT_REASSESSMENT_TRIGGER
```

La introducción de cualquier componente de IA o LLM es un **disparador de reevaluación**, no un incumplimiento ni una aplicación automática del art. 50. La reevaluación debe rehacer los pasos 1 a 4 y, por separado, el desglose A–E anterior.

**AI_ACT_REASSESSMENT_TRIGGERS:**

| Trigger | Efecto sobre el análisis |
|---|---|
| Machine learning en el cálculo del match | Reabre el paso 1: aparece capacidad de inferencia. **No implica automáticamente alto riesgo**: exige rehacer los pasos 2, 3 y 4 |
| LLM en cualquier función de producto | Paso 1 probablemente superado. Analizar además el desglose A–E; el rol y el caso de uso determinan si opera el art. 50 |
| Embeddings o similitud semántica aprendida | Paso 1 probablemente superado, según si el modelo deriva la forma de producir la salida |
| Ranking aprendido a partir de datos de uso | Paso 1 superado; aproxima el Anexo III por la vía de los anuncios dirigidos |
| Scoring predictivo | Paso 1 superado y máxima aproximación al Anexo III |
| Evaluación de candidatos | Encaje directo en el Anexo III punto 4, si es sistema de IA |
| RECRUIT fuera de HOLD | Cambia la finalidad prevista: el sistema pasa a servir a quien selecciona |
| CANDIDATE_DISCOVERY fuera de HOLD | Ídem, con búsqueda proactiva de personas |
| Chatbot orientado al usuario | Analizar caso A (art. 50.1), no asumir aplicación automática |
| Generación de contenido sintético | Analizar casos B, C o D según rol y tipo de contenido |
| Uso de sistemas de IA de terceros dentro del producto | Posición de responsable del despliegue, con obligaciones propias |

---

**REFERENCE:** SR-08
**CONCLUSION:** El art. 22 RGPD no resulta aplicable al match en su configuración actual, sobre cuatro hechos canónicos. El match constituye elaboración de perfiles en sentido amplio, con consecuencias limitadas en este modelo. El modelo de explicabilidad es suficiente y mejorable en seis puntos. El match no cumple la definición de sistema de IA del art. 3.1 por ausencia de capacidad de inferencia, por lo que la clasificación de alto riesgo no procede. El art. 50 no opera de forma automática y se desglosa por rol y caso de uso. **El estatus del servicio bajo el DSA queda expresamente abierto y no se cierra en este documento.**
**CLASSIFICATION:** Parte A: NOT_REQUIRED (art. 22 no aplicable). Parte B: CONDITIONAL. Parte C: SUFFICIENT con mejoras requeridas. Parte C.bis: CONDITIONAL / HUMAN_REVIEW_REQUIRED. Parte D: NOT_APPLICABLE.
**OFFICIAL_LEGAL_BASIS:** RGPD arts. 4.4, 5.1.a) y d), 12, 13.2.f), 14.2.g), 15.1.h), 16, 21.1, 22, 25 y considerandos 71 y 72; Reglamento (UE) 2024/1689 arts. 3.1, 3.12, 4, 6, 50, 113 y Anexo III punto 4; Reglamento (UE) 2026/1744; Reglamento (UE) 2022/2065 arts. 3, 27 y considerando 13; Reglamento (UE) 2019/1150 art. 5.
**OFFICIAL_SOURCES:** EUR-Lex; Comisión Europea, Directrices sobre la definición de sistema de IA de 6 de febrero de 2025; STJUE C-634/21; STJUE C-203/22; EDPB/GT29 WP251 rev.02.
**FACTS_USED:** los del bloque canónico del match, sin modificación.
**RESPONSIBLE_DECISIONS_USED:** MATCH_ROLE: ADVISORY_ONLY; MATCH_AUDIENCE: CANDIDATE; EMPLOYMENT_DECISION: NO; CANDIDATE_REJECTION: NO; SCORE_SHARED_WITH_EMPLOYERS: NO; FACTOR_BREAKDOWN: YES; EXPLANATION: YES; copy aprobado; RECRUIT y CANDIDATE_DISCOVERY en HOLD.
**SPECIALIST_REASONING_SUMMARY:** Las decisiones de negocio ya adoptadas son el fundamento jurídico operativo de la conclusión, no un contexto favorable. SCHUFA sitúa la frontera del art. 22 exactamente donde JobIT ha decidido no cruzar, y las Directrices de la Comisión sitúan la frontera del concepto de sistema de IA donde el diseño determinista se detiene. La conformidad no está en el código sino en las decisiones de producto, y por eso deben documentarse con evidencia técnica reproducible. La v1.1 corrige dos excesos de la v1.0: la automaticidad del art. 50 y el cierre prematuro del estatus DSA, ambos por la misma razón de fondo —una calificación normativa no puede darse por resuelta sin recorrer sus elementos—.
**REQUIRED_BEFORE_TRAMO_B:** (1) documento técnico versionado que acredite el carácter determinista, la ausencia de persistencia del score y la ausencia de salida hacia terceros; (2) implementación de las mejoras 1 y 6 de la Parte C; (3) documentación de la finalidad prevista (art. 3.12); (4) **análisis específico del estatus DSA del portfolio público, con validación humana**; (5) incorporación de los triggers de las Partes A y D al proceso de cambio de producto.
**NON_BLOCKING_RECOMMENDATIONS:** publicar los pesos; versionar el ruleset con identificador visible; norma interna que exija revisión jurídica previa a cualquier filtrado por umbral de score; registro fechado de cada cambio de pesos.
**PRIVATE_INFORMATION_REQUIRED:** NO
**BLOCKS_LEGAL_GATE:** CONDITIONAL — las conclusiones decaen íntegramente si cualquiera de los hechos canónicos se modifica antes de la validación humana.
**CONFIDENCE_OR_OPEN_INTERPRETATION:** Alta en Parte A sobre los hechos actuales, con reserva expresa en A.3. Media en Parte B. Alta en Parte C. **Baja-media en Parte C.bis: es la cuestión menos resuelta del paquete y se deja deliberadamente abierta.** Alta en Parte D respecto del paso 1, con la advertencia de que las Directrices de la Comisión son interpretativas y no vinculantes, correspondiendo la interpretación última al TJUE.

---

# DEVELOPMENT GUIDANCE — PACKAGE 2

```
DEVELOPMENT_GUIDANCE_STATUS:
PREPARATORY_REFERENCE_ONLY

IMPLEMENTATION_REQUIRES:
ORCHESTRATOR_AUTHORIZATION + SDD_SPEC_WHEN_APPLICABLE

TRAMO_B:
NOT_AUTHORIZED
```

> Esta sección es **input preparatorio** para el Chat Director y el Orquestador. **No autoriza código.** La clasificación `SAFE_TO_IMPLEMENT_NOW` significa únicamente que el elemento **no depende de una conclusión jurídica pendiente**; **no** constituye autorización de implementación, que requiere en todo caso autorización del Orquestador y, cuando proceda, especificación SDD previa.

## SAFE_TO_IMPLEMENT_NOW *(sujeto a `IMPLEMENTATION_REQUIRES`)*

1. Explicación del tratamiento de factores ausentes en la salida del match.
2. Copy empresarial aprobado replicado en la interfaz del match.
3. Versionado del ruleset del match con identificador asociado a cada resultado mostrado.
4. Enlace de edición directa desde cada factor del desglose al campo correspondiente del perfil.
5. Disciplina de copy: eliminar lenguaje que sugiera evaluación de la persona o empleabilidad.
6. Consignar en el RAT el estado real de `req.ip`.
7. Estructura de RAT versionada, con `PENDING_SR_10`, `PENDING_SR_11` y `TO_VERIFY_IN_REPOSITORY` explícitos.
8. **Verificación en repositorio de los campos marcados `TO_VERIFY_IN_REPOSITORY`** y sustitución por hechos acreditados. Es tarea de verificación documental, no de desarrollo.
9. Rol interno de responsable de privacidad, sin denominación de DPD.
10. Indicador cuantitativo interno de revisión del art. 34.1.d) LOPDGDD.
11. Checklist de cambio de producto con los triggers de SR-05, SR-07 y SR-08.
12. Mantener el catálogo íntegramente accesible con independencia del score, convirtiendo esa propiedad implícita en invariante explícito y probado.

## DESIGN_ONLY

1. Publicación de pesos en página de explicación del match: contenido y ubicación; publicación sujeta a aprobación humana del texto.
2. Esquema de evidencia de consentimiento del portfolio y de aceptación de Términos, sin fijar plazos (`PENDING_SR_11`).
3. Modelo de datos del RAT completo, con campos de encargados y transferencias presentes y vacíos.
4. Procedimiento de supresión diferida en backups: flujo de bloqueo, exclusión de restauración y eliminación por rotación.
5. Flujo operativo de detección de cuenta de menor de 18 años (SR-04): estados y transiciones.
6. Página de explicación del match orientada al estándar de «procedimiento y principios aplicados»: prototipar sin publicar.
7. Documento de análisis de no necesidad de EIPD: plantilla con el recuento de los once criterios; emisión sujeta a firma del responsable.
8. Separación entre soporte y ejercicio de derechos dentro del canal único.
9. **Análisis del estatus DSA del portfolio público:** preparar el planteamiento; la conclusión requiere validación humana.

## DO_NOT_IMPLEMENT_UNTIL_HUMAN_REVIEW

1. **Cualquier funcionalidad que filtre, oculte, colapse o degrade la visibilidad de ofertas en función del score.**
2. Cualquier exposición del score o de sus factores fuera de la sesión del propio candidato, incluida su aparición en el portfolio.
3. Cualquier funcionalidad de RECRUIT o CANDIDATE_DISCOVERY, incluidos prototipos con datos reales.
4. Cualquier ordenación, ranking o puntuación de personas destinada a un tercero.
5. Introducción de ML, embeddings, LLM o ranking aprendido en cualquier punto del producto.
6. Persistencia o registro de direcciones IP.
7. Publicación de textos legales definitivos, incluida la página de explicación del match.
8. Activación del portfolio por defecto o ampliación de los campos publicables por defecto.
9. Incorporación de proveedores o encargados nuevos, incluidos correo transaccional, alojamiento adicional o CDN.
10. Habilitación de campos que puedan implicar datos del art. 9.
11. Designación formal de DPD.
12. Tratamiento de datos reales de candidatos en cualquier entorno.

---

## ESTADO FINAL DEL PAQUETE 2 (v1.1)

```
SPECIALIST_REVIEW_COMPLETED:  NO
LEGAL_DECISIONS_APPROVED:     NO
TRAMO_B:                      NOT_AUTHORIZED
PRODUCTION:                   NOT_AUTHORIZED
REAL_CANDIDATE_DATA:          NOT_AUTHORIZED

SR-05  DPO_MANDATORY_NOW:              NO
       LARGE_SCALE:                    NO_ON_CURRENT_FACTS
       REGULAR_SYSTEMATIC_MONITORING:  NOT_NECESSARY_TO_RESOLVE /
                                       HUMAN_VALIDATION_REQUIRED
       DPO_VOLUNTARY:                  POSSIBLE

SR-06  RAT_REQUIRED_UNDER_CURRENT_LAW: YES
       EU_ARTICLE_30_REFORM:           PENDING_LEGISLATIVE_PROCESS
       CURRENT_GDPR_TEXT:              APPLIES
       RECHECK_BEFORE_FINAL_REVIEW:    YES

SR-07  DPIA_MANDATORY_NOW:             NO
       AEPD_CRITERIA_CONFIRMED:        1
       AEPD_CRITERIA_OPEN_TO_REVIEW:   1
       FINAL_CLASSIFICATION:           CONDITIONAL

SR-08  ARTICLE_22_APPLIES_NOW:         NO
       PROFILING_UNDER_GDPR:           CONDITIONAL (tratar como afirmativo)
       CURRENT_MATCH_AI_SYSTEM:        NO
       CURRENT_MATCH_HIGH_RISK:        NOT_APPLICABLE
       ART_50_APPLICATION:             NOT_AUTOMATIC
       DSA_ONLINE_PLATFORM_STATUS:     CONDITIONAL / HUMAN_REVIEW_REQUIRED
       ART_27_DSA:                     DO_NOT_CLOSE_IN_SR-08

DEPENDENCIAS ABIERTAS:  SR-09 (cookies / refresh token)
                        SR-10 (encargados, ubicaciones, transferencias)
                        SR-11 (plazos de conservación)
```

---

*Fin del documento. JOBIT — S22-PRIV-01 · Specialized Review Package 2 · SR-05 a SR-08 · v1.1 · 18 de agosto de 2026. Pendiente de validación por profesional humano cualificado.*
