# JOBIT — S22-PRIV-01
# SPECIALIZED REVIEW PACKAGE 4
# SR-13 / SR-14 / SR-15

---

## PORTADA

**DOCUMENT:**
JOBIT — S22-PRIV-01 · Specialized Review Package 4

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
- Este documento es **referencia preparatoria** (`PREPARATORY_REFERENCE_ONLY`) destinada a diseño, arquitectura, Spec-Driven Development y privacidad desde el diseño.
- **Requiere validación por abogado/a o profesional humano cualificado en privacidad y derecho tecnológico antes de cualquier decisión, publicación, implementación definitiva o autorización de tramo.**

Esta advertencia es material y debe conservarse en todas las versiones y derivados.

**SCOPE:**
SR-13, SR-14 y SR-15 exclusivamente, más la sección consolidada SR-01 a SR-15 y la propuesta de estructura documental. **No se abren nuevas referencias después de SR-15.**

**STATUS:**

```
SPECIALIST_REVIEW_COMPLETED:  NO
LEGAL_DECISIONS_APPROVED:     NO
TRAMO_B:                      NOT_AUTHORIZED
PRODUCTION:                   NOT_AUTHORIZED
REAL_CANDIDATE_DATA:          NOT_AUTHORIZED
```

**RESTRICCIONES OBSERVADAS:**
No se ha modificado repositorio, ni creado branch, commit, push o PR. No se ha implementado código ni creado archivo alguno. No se han redactado textos legales definitivos. No se ha accedido al registro privado. No se han solicitado secretos. No se han inventado hechos. No se han alterado los estados de SR-01 a SR-12.

---

## DIRECTOR_CORRECTIONS_APPLIED

| # | Corrección solicitada | Tratamiento en v1.1 |
|---|---|---|
| 1 | SR-13 — art. 25.2 y defaults | **Aplicada.** Se mantiene `DEFAULT_PRIVATE_CONFIGURATION: STRONGLY_SUPPORTED_BY_ART_25_2` y se **retira** la conclusión de que la divergencia técnica histórica constituya ya una infracción confirmada. Sustituida por `HISTORICAL_DEFAULT_DIVERGENCE: POTENTIAL_NON_CONFORMITY`, `TECHNICAL_VERIFICATION: REQUIRED` y `FINAL_LEGAL_CLASSIFICATION: HUMAN_REVIEW_REQUIRED`. La corrección técnica sigue siendo obligatoria antes de datos reales por decisión empresarial y privacidad desde el diseño |
| 2 | SR-13 — base jurídica | **Aplicada.** Retirados `ART_6_1_A_CONFIRMED` y `PORTFOLIO_CONSENT_REQUIRED: YES` como conclusiones cerradas. Sustituidos por `PRELIMINARY_PREFERRED_BASIS_ART_6_1_A`, `CURRENT_AI_ASSESSMENT`, `HUMAN_VALIDATION: REQUIRED` y `PORTFOLIO_CONSENT_REQUIRED: CONDITIONAL_ON_FINAL_LEGAL_BASIS`. Se conserva todo el diseño opt-in, preview, retirada fácil y evidencia como orientación conservadora |
| 3 | SR-13 — desindexación | **Aplicada.** Retirada toda formulación que la convirtiera en obligación jurídica confirmada. Se mantiene el estado de SR-12 v1.2: `REASONABLE_RISK_MITIGATION_MEASURE`, `LEGAL_OBLIGATION: DO_NOT_PREJUDGE`, `HUMAN_REVIEW: REQUIRED`, sin alterar la distinción respecto de `JOBIT_CONTROLLED_SYSTEMS` |
| 4 | SR-14 — categorías especiales en imágenes | **Aplicada.** Retirada la afirmación de que solo la finalidad de inferir activa el art. 9. Incorporadas las SSTJUE **C-184/20** y **C-21/23**, con refuerzo de C-252/21. Nuevos estados: `PHOTO_OR_IMAGE_REVEALING_OTHER_ART9_DATA: CONDITIONAL`; `PURPOSE_TO_INFER_SPECIAL_CATEGORY: NOT_REQUIRED_IN_ALL_CASES`; `ARTICLE_9_ASSESSMENT: DEPENDS_ON_CONTENT_AND_PROCESSING_CONTEXT` |
| 5 | SR-14 — datos de terceros y art. 14 | **Aplicada.** Retirados los cierres automáticos sobre la condición de responsable y sobre la aplicabilidad del art. 14.5.b). Sustituidos por `HUMAN_REVIEW_REQUIRED`, `ARTICLE_14_APPLICABILITY: CONDITIONAL` y `ARTICLE_14_5_B_DISPROPORTIONATE_EFFORT: DO_NOT_ASSUME`. Se conservan las medidas preparatorias |
| 6 | SR-14 — EXIF | **Aplicada.** Retirada la calificación como exigencia legal. Sustituida por `STRONGLY_INDICATED_PRIVACY_BY_DESIGN_CONTROL` con base en arts. 5.1.c) y 25, `STANDALONE_NAMED_LEGAL_REQUIREMENT: NO` y `HUMAN_VALIDATION: PENDING` |
| 7 | SR-15 — plazo del encargado | **Aplicada.** Retirada la afirmación de que el RGPD exige un plazo contractual concreto inferior a 72 h. Sustituida por `CONTRACTUAL_BREACH_SLA: STRONGLY_RECOMMENDED` y `SPECIFIC_NUMBER_OF_HOURS_REQUIRED_BY_GDPR: NO` |
| 8 | SR-15 — notificar ante duda | **Aplicada.** Retirada como test jurídico. Reformulada como `CONSERVATIVE_NOTIFICATION_WHEN_DOUBT_PERSISTS: GOVERNANCE_RECOMMENDATION`, distinguida del `LEGAL_NOTIFICATION_TEST: ART_33_1_RISK_THRESHOLD` |
| 9 | Baseline consolidada | **Aplicada.** Actualizadas SR-13, SR-14 y SR-15. **Estados de SR-01 a SR-12 sin alteración** |
| 10 | README propuesto | **Aplicada.** Añadidas las cinco cuestiones abiertas indicadas. Estructura sin cambios |
| 11 | Flags | **Aplicada.** Sin cambios |
| 12 | Portada v1.1 y tabla de correcciones | **Aplicada** |

---

## ESTADO DE PAQUETES ANTERIORES

```
PACKAGE_1_SR_01_04:  AI_REFERENCE_BASELINE_ACCEPTED · HUMAN_VALIDATION_PENDING
PACKAGE_2_SR_05_08:  AI_REFERENCE_BASELINE_ACCEPTED_WITH_DIRECTOR_ANNOTATIONS ·
                     HUMAN_VALIDATION_PENDING
PACKAGE_3_SR_09_12:  AI_REFERENCE_BASELINE_ACCEPTED · HUMAN_VALIDATION_PENDING
```

## DEPENDENCIAS DECLARADAS

| Dependencia | Referencia | Impacto |
|---|---|---|
| DEPENDENCY: SR-02.I | Portfolio opt-in, base preliminar art. 6.1.a) | **IMPACT:** SR-13.A contrasta alternativas por indicación del propio paquete, **sin cerrar** la conclusión |
| DEPENDENCY: SR-02.C | Fotografía ordinaria no es dato del art. 9 salvo tratamiento biométrico específico | **IMPACT:** punto de partida de SR-14, que se **matiza** en v1.1 respecto del contenido revelador, sin alterar la conclusión sobre biometría |
| DEPENDENCY: SR-10 | Identidad de encargados `PENDING`; puerta de proveedores | **IMPACT:** destinatarios del art. 33.2 en SR-15; almacenamiento de uploads en SR-14 |
| DEPENDENCY: SR-11 | `ART_32_LOPDGDD_BLOCKING: REQUIRED`; patrón `TO_DESIGN` | **IMPACT:** supresión de imágenes y de portfolio |
| DEPENDENCY: SR-12 | Art. 19 sobre portfolio `HUMAN_REVIEW_REQUIRED`; encargados son destinatarios | **IMPACT:** SR-13.L no cierra; SR-15 lo usa para propagación |
| DEPENDENCY: SR-08 | `DSA_ONLINE_PLATFORM_STATUS: CONDITIONAL`, con art. 19 DSA previo al art. 27 | **IMPACT:** SR-13.M respeta el orden de análisis |
| DEPENDENCY: SR-09 | Revocación del refresh token `TO_VERIFY` | **IMPACT:** efectividad de la despublicación y del cierre de cuenta |

No se modifica silenciosamente ninguna conclusión anterior.

---

## FUENTES OFICIALES UTILIZADAS

**EUR-Lex.** RGPD: arts. 4.1, 4.12, 4.14, 5.1.a), 5.1.c), 5.1.d), 5.1.f), 6.1.a), 6.1.b), 6.1.f), 7, 9.1, 9.2.a), 9.2.e), 12, 13, 14 (incluido 14.5.b), 17, 19, 24, **25 (especialmente 25.2)**, **32**, **33**, **34**, 35; considerandos 35, 39, 51, 75, 78, 85, 86, 87 y 88. Reglamento (UE) 2022/2065 (DSA), arts. 3, **19**, 27. Reglamento (UE) 2024/1689, arts. 3.1 y 6.

**BOE.** LO 3/2018 (LOPDGDD): arts. 5, 12 a 18, 32. Ley 34/2002 (LSSI). Ley Orgánica 1/1982 (contexto, derecho a la propia imagen).

**AEPD.**
- «Guía para la notificación de brechas de datos personales», versión de junio de 2021.
- Herramienta **«Comunica-Brecha RGPD»** (art. 34) y herramienta **«Asesora Brecha»** (art. 33), ambas con la advertencia expresa de que no sustituyen la valoración del responsable ni suponen cumplimiento automático de las obligaciones del RGPD ni de la LOPDGDD.
- Sede electrónica: formulario de notificación de brechas.
- «Guía sobre el uso de las cookies», versión de mayo de 2024 (referencia cruzada SR-09).

**EDPB / GT29.** Guidelines 9/2022 (notificación de violaciones). Guidelines 01/2021 (ejemplos). Guidelines 4/2019 (art. 25). Guidelines 2/2019 (art. 6.1.b). Guidelines 05/2020 (consentimiento). Guidelines 07/2020 (responsable y encargado).

**TJUE.**
- **C-184/20**, *Vyriausioji tarnybinės etikos komisija*, de 1 de agosto de 2022.
- **C-252/21**, *Meta Platforms*, de 4 de julio de 2023.
- **C-21/23**, *Lindenapotheke*, Gran Sala, de 4 de octubre de 2024.
- C-101/01 (Lindqvist); C-131/12 (Google Spain); C-136/17 (GC y otros).

Las fuentes secundarias no fundamentan ninguna conclusión.

---

# REFERENCE: SR-13 — PORTFOLIO PROFESIONAL PÚBLICO (v1.1)

## Hechos utilizados

```
PUBLIC_PORTFOLIO:                  OPT_IN
PORTFOLIO_REQUIRED_TO_USE_JOBIT:   NO
LOCATION_DEFAULT_VISIBILITY:       PRIVATE   (decisión empresarial)
AVAILABILITY_DEFAULT_VISIBILITY:   PRIVATE   (decisión empresarial)
PUBLICATION_PREVIEW:               REQUIRED  (decisión empresarial)
EMAIL_PUBLIC:                      NO
SALARY_PUBLIC:                     NO
AFTER_UNPUBLISH / AFTER_CLOSURE:   REMOVE_FROM_PUBLIC_ACCESS_AS_SOON_AS_POSSIBLE
```

**Divergencia técnica histórica — CORRECCIÓN APLICADA.** El estado técnico histórico mostró que, una vez publicado el portfolio, `location` y `availability` podían quedar visibles por defecto, lo que diverge de la decisión empresarial posterior.

```
HISTORICAL_DEFAULT_DIVERGENCE:
POTENTIAL_NON_CONFORMITY

TECHNICAL_VERIFICATION:
REQUIRED

FINAL_LEGAL_CLASSIFICATION:
HUMAN_REVIEW_REQUIRED

TECHNICAL_FACT_STATUS:
TO_VERIFY_IN_REPOSITORY

DO_NOT_ASSUME:
CODE_ALREADY_IMPLEMENTS_PRIVATE_DEFAULTS
```

La v1.0 calificaba esa divergencia, de confirmarse, como incumplimiento del art. 25.2. **Esa calificación se retira**: no consta verificación del comportamiento actual del código, la conformidad con el art. 25 se valora sobre el conjunto de medidas y el contexto del tratamiento, y **la calificación jurídica final corresponde a revisión humana**. Lo que sí se mantiene sin matices:

- **la verificación técnica es obligatoria** antes de cualquier tratamiento de datos reales;
- **la corrección de los defaults, si divergen, es igualmente obligatoria**, por decisión empresarial confirmada y por privacidad desde el diseño;
- sigue siendo, en términos de gestión, **el punto de mayor riesgo concreto del paquete**, porque se trata de una divergencia conocida entre una decisión de negocio y un comportamiento técnico previo, y una decisión de negocio no modifica el código por sí sola.

---

## A — Base jurídica

**Se contrastan tres bases posibles. Ninguna conclusión se cierra.**

**Opción 1 — Art. 6.1.a), consentimiento.** A su favor: la publicación **no es necesaria** para prestar el servicio (`PORTFOLIO_REQUIRED_TO_USE_JOBIT: NO`), lo que refuerza el carácter libre del consentimiento a efectos del art. 7.4; es específico, informado —mediante el preview— e inequívoco; y ofrece al candidato el control más fuerte, con retirada inmediata e incondicional del art. 7.3.

**Opción 2 — Art. 6.1.b), entendiendo el portfolio como módulo opcional solicitado.** Argumento: si el usuario solicita expresamente la publicación, ésta sería necesaria para prestar ese servicio concreto. Objeciones: las Directrices 2/2019 del CEPD interpretan la necesidad de forma estricta y objetiva, y desaconsejan la construcción de «micro-contratos» por funcionalidad; sustituiría la retirada del art. 7.3 por una modificación contractual, con peor posición para el candidato; y obligaría a rehacer los análisis de los arts. 20 y 21 de SR-12.

**Opción 3 — Art. 6.1.f), interés legítimo.** El interés en publicar datos de un candidato ante el público mundial difícilmente prevalecería sobre sus derechos, y las expectativas razonables (considerando 47) no amparan la publicación en abierto sin acto propio del afectado. Además vaciaría de sentido el diseño opt-in ya decidido.

```
PORTFOLIO_LEGAL_BASIS:
PRELIMINARY_PREFERRED_BASIS_ART_6_1_A

ALTERNATIVES_ANALYSED:
ART_6_1_B
ART_6_1_F

CURRENT_AI_ASSESSMENT:
ART_6_1_A_BEST_FOUNDED_ON_CURRENT_FACTS

HUMAN_VALIDATION:
REQUIRED

PORTFOLIO_CONSENT_REQUIRED:
CONDITIONAL_ON_FINAL_LEGAL_BASIS
```

**Orientación conservadora que se mantiene con independencia de la base final.** Todo el diseño ya decidido —opt-in, preview previo, retirada tan fácil como el otorgamiento, evidencia de activación y de retirada, defaults privados— **es la configuración más protectora en cualquiera de los tres escenarios** y no debe alterarse a la espera de la validación. Si la base final fuera el art. 6.1.b), ese diseño seguiría siendo válido y prudente; si fuera el art. 6.1.a), sería además exigido.

**Observación sobre categorías especiales.** Si el candidato publica contenido del que se deduzcan datos del art. 9, podría entrar en juego el art. 9.2.e), relativo a datos hechos manifiestamente públicos por el interesado. **No debe utilizarse como estrategia de diseño**: es una salvaguarda residual, no una autorización para inducir a publicar datos sensibles. Ver además SR-14.1-2, cuya corrección en v1.1 refuerza la cautela.

## B — Consentimiento y retirada

*(Aplicable si la base final es el art. 6.1.a); mantenido como orientación conservadora en todo caso.)*

**Requisitos** (arts. 4.11, 7; Directrices 05/2020): acción afirmativa inequívoca; no premarcado; separado de la aceptación de Términos y de cualquier otro consentimiento; informado mediante preview; revocable.

**Evidencia (art. 7.1):** identificador de usuario, fecha y hora, versión de la información mostrada, alcance concreto —qué campos— y método. Conservar también **evidencia de la retirada**.

**Retirada (art. 7.3):** se mantiene sin alteración el estado de SR-12:

```
WITHDRAWAL_EASE:      MUST_BE_AS_EASY_AS_GRANTING
SELF_SERVICE_TOGGLE:  STRONGLY_INDICATED
EXACT_UI_MECHANISM:   NOT_LEGALLY_PRESCRIBED
```

**Granularidad recomendada:** consentimiento por bloques de campos en lugar de un único interruptor. Refuerza la especificidad y encaja con los defaults privados. Recomendación, no exigencia.

## C — Campos publicables

**Enfoque obligado: lista blanca, no lista negra.** Publicable solo lo expresamente marcado; todo campo nuevo nace privado. Con lista negra, cada funcionalidad nueva se publicaría por defecto — exactamente el patrón que la divergencia histórica describe.

| Campo | Estado |
|---|---|
| Email | **Nunca público** (decisión empresarial) |
| Salario deseado | **Nunca público** (decisión empresarial) |
| Ubicación | Privado por defecto; publicable solo por acción del usuario |
| Disponibilidad | Privado por defecto; publicable solo por acción del usuario |
| Skills, experiencia, educación, proyectos, enlaces | Publicables mediante activación |
| Avatar/fotografía | Ver SR-14 |
| Cualquier campo futuro | **Privado por defecto por regla general** |

## D — Defaults

```
DEFAULT_PRIVATE_CONFIGURATION:
STRONGLY_SUPPORTED_BY_ART_25_2

LOCATION_PUBLIC_BY_DEFAULT:     NO
AVAILABILITY_PUBLIC_BY_DEFAULT: NO
```

**Fundamento.** El **art. 25.2 RGPD** obliga a aplicar medidas técnicas y organizativas apropiadas para garantizar que, **por defecto**, solo sean objeto de tratamiento los datos necesarios para cada fin específico, y añade que esas medidas deben garantizar en particular que, **por defecto, los datos personales no sean accesibles, sin la intervención de la persona, a un número indeterminado de personas físicas**.

Esa formulación describe con precisión el supuesto del portfolio público, y las Directrices 4/2019 del CEPD tratan la visibilidad por defecto en perfiles públicos como caso paradigmático. En consecuencia, los defaults privados **cuentan con un respaldo normativo fuerte y directo**, más allá de ser una preferencia de producto.

**Lo que no se afirma (corrección aplicada):** no se concluye que una configuración distinta constituya *per se* una infracción confirmada. La conformidad con el art. 25 se valora sobre el conjunto de medidas, el estado de la técnica, el coste, la naturaleza y el contexto del tratamiento y los riesgos; y la calificación final es `HUMAN_REVIEW_REQUIRED`.

## E — Transparencia previa a la publicación

```
PUBLICATION_PREVIEW:
REQUIRED — decisión empresarial · y, en su caso, condición material del
consentimiento informado si la base final es el art. 6.1.a)
```

Contenido mínimo que debería mostrarse antes de publicar:

1. **Qué campos concretos serán públicos**, con su valor real, no una descripción genérica.
2. Que el portfolio será **accesible desde cualquier lugar del mundo**, sin necesidad de cuenta.
3. Si va a ser **indexable por motores de búsqueda** y, en su caso, que puede aparecer en resultados asociados a su nombre.
4. Que terceros pueden **copiar, cachear o replicar** el contenido, y que **JobIT no puede garantizar su eliminación fuera de sus propios sistemas**.
5. Que puede **despublicar en cualquier momento**, con efecto inmediato en los sistemas de JobIT, y cómo hacerlo.
6. **Qué NO se publicará**: email y salario deseado, y cualquier otro campo privado.
7. Advertencia de no incluir datos sensibles ni datos personales de terceros (enlaza con SR-14).

**Prohibición expresa de promesa imposible:** no debe afirmarse que la despublicación implique el **borrado total de Internet**. JobIT no puede garantizarlo, y prometerlo sería información engañosa además de contrario al art. 5.1.a).

## F — Accesibilidad mundial

```
GLOBAL_ACCESSIBILITY:
INHERENT_TO_PUBLICATION · INFORMATION_DUTY_APPLIES

PUBLIC_PORTFOLIO_AS_CHAPTER_V_TRANSFER:
NO_ON_CURRENT_ANALYSIS · HUMAN_VALIDATION_PENDING
```

Sin alteración respecto de SR-10: no concurre el segundo criterio de las Directrices 05/2021 del CEPD —no hay importador identificado que sea responsable, corresponsable o encargado— y Lindqvist apunta en el mismo sentido. **Sí puede existir transferencia por la infraestructura** que sirve el portfolio.

## G y H — Indexación y `noindex` / `nofollow`

```
SEARCH_ENGINE_INDEXING:
SEPARATE_EXPOSURE_LAYER · SEPARATE_USER_DECISION_STRONGLY_INDICATED

NOINDEX_NOFOLLOW:
CONDITIONAL — RECOMMENDATION_AS_DEFAULT, NOT_AN_EXPRESS_LEGAL_REQUIREMENT
```

Ninguna norma impone `noindex`. Pero la indexación no es consecuencia neutra de la publicación: convierte un perfil accesible en un perfil **encontrable por el nombre de la persona**, escenario que la jurisprudencia del TJUE sobre desindexación (C-131/12, C-136/17) identifica como el de mayor impacto. Aplicando el criterio del art. 25.2, lo más defendible es `noindex` por defecto con activación de la indexación como decisión separada e informada.

**Advertencia técnica:** `noindex`, `nofollow` y `robots.txt` son **indicaciones, no garantías**. No impiden el acceso, no vinculan a rastreadores que las ignoren, no eliminan copias ya obtenidas y no impiden el scraping. No deben presentarse al usuario como protección absoluta.

## I — Cachés y copias externas

**Distinción obligatoria en tres capas — CORRECCIÓN APLICADA en la capa 2.**

| Capa | Alcance | Qué puede garantizar JobIT |
|---|---|---|
| `JOBIT_CONTROLLED_SYSTEMS` | Base de datos, aplicación, copias de seguridad, cachés propias | **`REMOVE_EFFECTIVELY_AS_SOON_AS_POSSIBLE`.** Garantía plena y exigible |
| `THIRD_PARTY_CACHES_AND_INDEXES` | Motores de búsqueda, archivos web, agregadores | Ninguna garantía. La solicitud de desindexación es `REASONABLE_RISK_MITIGATION_MEASURE`; `LEGAL_OBLIGATION: DO_NOT_PREJUDGE`; `HUMAN_REVIEW: REQUIRED` |
| `USER_OR_THIRD_PARTY_COPIES` | Capturas, descargas, republicaciones, scraping, conjuntos de datos de terceros | Ninguna garantía ni capacidad de acción directa. Solo información previa honesta |

La v1.0 describía la desindexación como «obligación de diligencia». **Esa formulación se retira** y se sustituye por el estado de SR-12 v1.2, sin prejuzgar su alcance jurídico.

## J — Rectificación

La rectificación (art. 16) debe **propagarse a la versión pública** de forma inmediata; un portfolio con datos desactualizados tras una rectificación compromete además el art. 5.1.d). Debe considerarse la activación del art. 19 respecto de los destinatarios identificados (SR-12.10).

## K — Supresión y despublicación

```
UNPUBLISHING / ACCOUNT_CLOSURE:
IMMEDIATE_AND_EFFECTIVE_REMOVAL_FROM_PUBLIC_ACCESS
```

1. Retirada del acceso público **sin demora**.
2. **Invalidación de cachés propias.**
3. **No republicación desde copias de seguridad** — riesgo más concreto identificado en SR-11.
4. **Solicitud de desindexación** como medida razonable de mitigación (sin prejuzgar su carácter obligatorio).
5. Coherencia con el **bloqueo del art. 32 LOPDGDD** (SR-11): la despublicación es inmediata; la supresión del dato subyacente sigue el régimen de bloqueo.
6. Verificación de que la **revocación de sesión y de refresh token** (SR-09) impide reactivar la publicación tras el cierre.

## L — Artículo 19

```
ARTICLE_19:
HUMAN_REVIEW_REQUIRED · DO_NOT_PREJUDGE
```

Sin alteración respecto de SR-12 v1.2.

## M — DSA

```
DSA_STATUS_IMPACT:
CONDITIONAL / HUMAN_REVIEW_REQUIRED
```

Se respeta el orden fijado por el Director: (1) determinar si el portfolio convierte a JobIT en servicio de alojamiento y, en su caso, en plataforma en línea, o si es funcionalidad menor y puramente accesoria; (2) **si resultara plataforma en línea, analizar expresamente y con carácter previo la exención para microempresas y pequeñas empresas del art. 19 DSA** antes de concluir que el art. 27 resulta aplicable; (3) solo entonces, valorar el art. 27 respecto del match. **No se cierra ninguno de los tres pasos.**

## N — Minimización

Arts. 5.1.c) y 25: publicar únicamente lo necesario para la finalidad declarada, con lista blanca, defaults privados y granularidad.

## O — Riesgos específicos del contexto de empleo

| Riesgo | Descripción | Mitigación prevista o recomendada |
|---|---|---|
| **Descubrimiento por el empleador actual** | Un candidato empleado puede ser identificado por su empresa. Riesgo más probable y de mayor impacto individual | Opt-in, defaults privados, `noindex` por defecto, preview explícito, disponibilidad privada |
| **Discriminación** | Nombre, fotografía, fechas o lagunas del historial pueden habilitar sesgos | Fotografía opcional; advertencia; no inducir campos innecesarios |
| **Scraping y reutilización** | Los perfiles públicos son objetivo habitual de scraping y agregadores | Información previa honesta; `noindex` por defecto; medidas anti-scraping como recomendación |
| **Suplantación e ingeniería social** | Un CV público facilita phishing dirigido y falsas ofertas | Email nunca público; advertencia; canal de contacto controlado |
| **Datos sensibles inferidos** | Contenido del que se deduzcan datos del art. 9 — ver SR-14.1-2 | Advertencia previa; no habilitar campos que los induzcan |
| **Permanencia** | El perfil publicado hoy puede perjudicar en el futuro | Preview honesto sobre cachés y copias; desindexación al despublicar |

---

**REFERENCE:** SR-13
**CONCLUSION:** El art. 6.1.a) es la **base preliminar preferida** tras contrastar los arts. 6.1.b) y 6.1.f), sin cerrarse: `HUMAN_VALIDATION: REQUIRED`, y la exigencia de consentimiento queda condicionada a la base final. Los defaults privados cuentan con respaldo fuerte y directo del art. 25.2, sin que ello permita calificar la divergencia técnica histórica como infracción confirmada: `POTENTIAL_NON_CONFORMITY`, verificación técnica obligatoria y calificación jurídica final reservada a revisión humana. El preview y el diseño opt-in se mantienen como orientación conservadora válida en cualquier escenario. `noindex` por defecto es recomendación fuertemente indicada, no requisito. La desindexación es medida razonable de mitigación, sin prejuzgar su carácter obligatorio.
**CLASSIFICATION:** CONDITIONAL
**OFFICIAL_LEGAL_BASIS:** RGPD arts. 4.11, 5.1.a), 5.1.c), 5.1.d), 6.1.a), 6.1.b), 6.1.f), 7, 9.2.e), 12, 13, 16, 17, 19, 25.1 y 25.2; Reglamento (UE) 2022/2065, arts. 3, 19 y 27.
**OFFICIAL_SOURCES:** EDPB Guidelines 4/2019, 05/2020, 2/2019 y 05/2021; STJUE C-101/01, C-131/12 y C-136/17.
**FACTS_USED:** portfolio opt-in; no requerido para usar JobIT; ubicación y disponibilidad privadas por defecto (decisión); preview requerido; email y salario nunca públicos; retirada del acceso público sin demora; divergencia técnica histórica `TO_VERIFY_IN_REPOSITORY`.
**RESPONSIBLE_DECISIONS_USED:** las anteriores.
**SPECIALIST_REASONING_SUMMARY:** La corrección de esta versión afecta al **grado de certeza**, no al contenido operativo: lo que hay que hacer es lo mismo —verificar los defaults, corregirlos si divergen, mantener el diseño conservador—, pero deja de presentarse como conclusión jurídica cerrada. Es una distinción relevante en un documento que será leído por agentes que podrían tomar una calificación de «infracción» como hecho establecido. El respaldo del art. 25.2 sigue siendo el argumento más fuerte del apartado; lo que no puede hacerse es convertir un respaldo fuerte en un veredicto.
**REQUIRED_BEFORE_TRAMO_B:** (1) **verificar en repositorio la visibilidad por defecto real de ubicación y disponibilidad** y corregirla si diverge; (2) implementar y verificar la lista blanca de campos publicables; (3) definir el contenido exacto del preview; (4) decidir el tratamiento de la indexación; (5) verificar la no republicación desde copias; (6) definir el esquema de evidencia; (7) **validación humana de la base jurídica**, de la calificación de la divergencia histórica y de las cuestiones abiertas de arts. 19 y DSA.
**NON_BLOCKING_RECOMMENDATIONS:** granularidad por bloques de campos; `noindex` por defecto con activación separada; solicitud de desindexación al despublicar; revisión periódica de que ningún campo nuevo se publique por defecto.
**PRIVATE_INFORMATION_REQUIRED:** NO
**BLOCKS_LEGAL_GATE:** YES — el portfolio no puede publicarse con datos reales hasta verificar los defaults y cerrar el preview.
**CONFIDENCE_OR_OPEN_INTERPRETATION:** Alta sobre el respaldo del art. 25.2 y sobre las objeciones a las opciones 2 y 3. Media-alta sobre `noindex` por defecto. **Abiertas y no prejuzgadas:** base jurídica final, calificación jurídica de la divergencia histórica, alcance del art. 19, estatus DSA y carácter obligatorio de la desindexación.

---

# REFERENCE: SR-14 — AVATAR, IMÁGENES Y UPLOADS (v1.1)

## Advertencia de partida

Ningún control técnico se da por existente ni por inexistente. Todo lo enumerado en el bloque canónico —reconocimiento facial, biometría, clasificación automática, análisis de imagen, extracción EXIF, geolocalización, moderación automatizada, CDN, almacenamiento externo, transformación automática, antivirus, límites de tamaño, formatos, borrado físico y conservación— se marca como:

```
TECHNICAL_FACT_STATUS:
TO_VERIFY_IN_REPOSITORY
```

Se distingue en todo el apartado entre `LEGAL_REQUIREMENT`, `SECURITY_RECOMMENDATION`, `PRODUCT_RECOMMENDATION` y `TECHNICAL_FACT_TO_VERIFY`.

---

## 1 y 2 — Fotografía, biometría y categorías especiales

### 1.a — Vertiente biométrica

```
ORDINARY_PROFILE_PHOTO_AS_BIOMETRIC_ART9:
NO_UNLESS_SPECIFIC_TECHNICAL_PROCESSING_FOR_UNIQUE_IDENTIFICATION

BIOMETRIC_PROCESSING:
TO_VERIFY
```

Se mantiene sin alteración la conclusión de SR-02.C en esta vertiente. El **considerando 51** establece que el tratamiento de fotografías no debe considerarse sistemáticamente tratamiento de categorías especiales: las imágenes solo quedan comprendidas en la definición de **datos biométricos** del **art. 4.14** cuando se traten **con medios técnicos específicos** que permitan la identificación o autenticación **unívoca**; y el art. 9.1 alcanza a los datos biométricos **cuando se traten con el fin de identificar de manera unívoca** a una persona. Doble condición acumulativa. Una fotografía mostrada y almacenada sin procesamiento no cumple ninguna de las dos.

### 1.b — Vertiente de contenido revelador — **CORRECCIÓN APLICADA**

```
PHOTO_OR_IMAGE_REVEALING_OTHER_ART9_DATA:
CONDITIONAL

PURPOSE_TO_INFER_SPECIAL_CATEGORY:
NOT_REQUIRED_IN_ALL_CASES

ARTICLE_9_ASSESSMENT:
DEPENDS_ON_CONTENT_AND_PROCESSING_CONTEXT
```

La v1.0 afirmaba que una imagen de la que se dedujeran origen étnico, convicciones religiosas o estado de salud **solo** quedaría bajo el art. 9 si la finalidad fuera precisamente deducir o utilizar esa información. **Esa afirmación se retira por ser más restrictiva que la jurisprudencia del TJUE.**

- En **C-184/20**, *Vyriausioji tarnybinės etikos komisija*, de 1 de agosto de 2022, el Tribunal adoptó una interpretación **amplia** del art. 9.1: los datos que, mediante una **operación intelectual de comparación o deducción**, permitan revelar información sensible quedan comprendidos en las categorías especiales, aunque no la expresen de forma directa. El Tribunal subrayó que la finalidad del precepto es garantizar una protección reforzada frente a tratamientos que, por la particular sensibilidad de los datos, pueden constituir una injerencia especialmente grave en los derechos de los arts. 7 y 8 de la Carta.
- En **C-252/21**, *Meta Platforms*, de 4 de julio de 2023, el Tribunal aplicó ese criterio amplio a la navegación y a los datos introducidos por el usuario en relación con las categorías del art. 9.
- En **C-21/23**, *Lindenapotheke*, Gran Sala, de 4 de octubre de 2024, el Tribunal concluyó que los datos que los clientes introducen al pedir por internet medicamentos de venta obligatoria en farmacia **constituyen datos relativos a la salud aunque no estén sujetos a receta médica**, y ello pese a que la relación con el estado de salud del comprador sea solo probable y no cierta, con la consecuencia de que el vendedor debe informar de forma exacta, completa y comprensible y recabar consentimiento explícito.

**Consecuencia para JobIT:** la calificación de una imagen bajo el art. 9 **no depende exclusivamente de la intención del responsable**, sino del **contenido de la imagen y del contexto del tratamiento**. No cabe, por tanto, una regla general del tipo «como no analizamos imágenes, nunca hay datos del art. 9».

**Lo que sí puede afirmarse con seguridad:** una fotografía de perfil ordinaria, mostrada tal cual, sin análisis, sin clasificación, sin etiquetado y sin explotación de su contenido, **no constituye por ese solo hecho un tratamiento de categorías especiales**, y esa es la situación de partida. Lo que cambia respecto de la v1.0 es que **esa conclusión no es automática ni universal**, y que la publicación de imágenes que revelen información sensible sitúa el análisis en terreno condicional, especialmente si concurre con el portfolio público.

**Interacción con el art. 9.2.e).** Cuando es el propio interesado quien publica voluntariamente una imagen de la que se deduzca información sensible, puede entrar en juego el supuesto de datos hechos manifiestamente públicos por el interesado. **No debe utilizarse como estrategia de diseño**, y su alcance en este contexto es cuestión abierta.

**Orientación de diseño — no son hechos técnicos salvo verificación:**

```
NO_FACE_RECOGNITION
NO_IMAGE_CLASSIFICATION
NO_SPECIAL_CATEGORY_INFERENCE
```

Se formulan como **orientación de diseño y decisión recomendada**, no como descripción del estado actual del código, que es `TO_VERIFY`. Su valor se refuerza tras esta corrección: si el contenido puede activar el art. 9 con independencia de la intención, la única posición segura es **no construir ninguna capacidad de análisis, clasificación o inferencia sobre imágenes**.

## 3 y 4 — Metadatos EXIF y geolocalización embebida — **CORRECCIÓN APLICADA**

```
EXIF_HANDLING:
TO_VERIFY_IN_REPOSITORY

EXIF_STRIPPING_FOR_PUBLIC_IMAGES:
STRONGLY_INDICATED_PRIVACY_BY_DESIGN_CONTROL

LEGAL_BASIS:
ART_5_1_C + ART_25

STANDALONE_NAMED_LEGAL_REQUIREMENT:
NO

HUMAN_VALIDATION:
PENDING
```

Las imágenes de dispositivos móviles y cámaras incorporan con frecuencia metadatos EXIF: modelo, número de serie, fecha y hora, ajustes y, en muchos casos, **coordenadas GPS del lugar de captura**, que suele ser el domicilio del usuario. Ese contenido es dato personal (art. 4.1) y su tratamiento no responde a ninguna finalidad declarada de JobIT.

La v1.0 calificaba su eliminación como «exigencia práctica» derivada de los arts. 5.1.c) y 25 para imágenes publicadas. **Se retira esa formulación**: los arts. 5.1.c) y 25 dan un **apoyo sólido** a la medida, pero **no existe una obligación nominada** de eliminar metadatos EXIF, y la valoración final es `HUMAN_VALIDATION: PENDING`.

**Lo que sí se mantiene, y es el argumento de fondo:** la decisión empresarial `LOCATION_DEFAULT_VISIBILITY: PRIVATE` quedaría **materialmente vaciada** si el avatar publicado conserva coordenadas GPS del domicilio. Es una incoherencia interna de diseño y un vector de fuga silencioso, con independencia de cómo se califique jurídicamente. Por eso la medida es `STRONGLY_INDICATED`.

**Recomendación técnica:** la **re-codificación de la imagen en la subida** se mantiene como `SECURITY_RECOMMENDATION` y `PRIVACY_RECOMMENDATION`: neutraliza payloads embebidos y elimina metadatos en una sola operación, sin necesidad de una rutina específica de limpieza.

## 5 — Minimización

Avatar **opcional**, nunca obligatorio; ningún requisito de fotografía para completar el perfil ni para el match; formatos y dimensiones acotados; conservación ligada a la del perfil (SR-11).

## 6 a 9 — Seguridad de uploads

**Marco:** el art. 32 obliga a medidas **apropiadas al riesgo**, sin enumerar controles concretos. Ninguno de los siguientes es `LEGAL_REQUIREMENT` nominado, pero su ausencia injustificada dificultaría acreditar el cumplimiento.

```
UPLOAD_SECURITY_CONTROLS:
SECURITY_RECOMMENDATIONS · EXISTENCE_TO_VERIFY_IN_REPOSITORY
```

| Control | Clasificación | Nota |
|---|---|---|
| Validación de tipo **por contenido real**, no por extensión ni `Content-Type` | `SECURITY_RECOMMENDATION` (alta) | La validación por extensión es la vía clásica de subida de ejecutables |
| Lista blanca de formatos | `SECURITY_RECOMMENDATION` | `TO_VERIFY` |
| Límite de tamaño | `SECURITY_RECOMMENDATION` | Disponibilidad, art. 32.1.b). `TO_VERIFY` |
| Re-codificación o normalización | `SECURITY_RECOMMENDATION` (alta) | Neutraliza payloads **y** elimina EXIF |
| Nombres de archivo generados por el sistema | `SECURITY_RECOMMENDATION` | Evita traversal y filtración por el nombre original |
| Almacenamiento fuera de la raíz servible, sin permisos de ejecución | `SECURITY_RECOMMENDATION` (alta) | `TO_VERIFY` |
| Análisis antimalware | `SECURITY_RECOMMENDATION` | Si se externaliza, el proveedor es encargado: SR-10 |
| Cabeceras que impidan la interpretación como HTML/script | `SECURITY_RECOMMENDATION` | XSS almacenado vía SVG es vector conocido |
| **Control de autorización en la lectura de imágenes privadas** | **Condición material** | Una imagen «privada» accesible por URL directa no es privada; comprometería el art. 5.1.f) y vaciaría la distinción público/privado de SR-13 |

**Sobre el último punto:** el patrón de URL no adivinable **no es control de acceso**. Si las imágenes privadas se sirven sin verificación de autorización, la distinción público/privado del portfolio es aparente. `TO_VERIFY`.

## 10 a 13 — Almacenamiento, publicación, copias derivadas y cachés

```
PUBLIC_AVATAR:
OPT_IN_AND_SUBJECT_TO_THE_SAME_REGIME_AS_THE_PORTFOLIO
```

- **Almacenamiento:** ubicación y proveedor `PENDING_SR_10`. Si se externaliza, aplica el régimen íntegro de encargados y transferencias.
- **Copias derivadas:** miniaturas, versiones redimensionadas y previsualizaciones son tratamientos del mismo dato personal. Cualquier supresión debe alcanzarlas. Es la omisión más frecuente: se borra el original y sobreviven las miniaturas.
- **Cachés:** invalidación al despublicar o suprimir; misma distinción de tres capas de SR-13.I.
- **Publicación:** el avatar público hereda el régimen del portfolio, incluidos preview, defaults privados y `noindex`.

## 14 y 15 — Supresión y copias de seguridad

```
DELETION:
MUST_COVER_ORIGINAL + DERIVATIVES + CACHES

BACKUP_IMPACT:
SAME_REGIME_AS_SR-11 · NO_REPUBLICATION_ON_RESTORE
```

Coordinada con el **bloqueo del art. 32 LOPDGDD** (SR-11), cuyo patrón está `TO_DESIGN`.

## 16 — Moderación de contenido

No consta moderación automatizada ni manual: `TO_VERIFY`.

- **Automatizada de imágenes:** implicaría análisis de contenido, lo que —tras la corrección de 1.b— reabriría el análisis del art. 9 **con mayor intensidad**, y exigiría valorar el art. 22 y el Reglamento (UE) 2024/1689 con el test completo de SR-08, sin automatismos.
- **En contexto DSA:** si JobIT resultara plataforma en línea, la moderación activaría declaración de motivos y sistema interno de reclamaciones. Remitido a SR-13.M, sin cerrar.
- **Manual:** implica acceso de personal a contenidos; debe encuadrarse en `ADMIN_DATA_ACCESS: EXCEPTIONAL` y `ADMIN_ACCESS_SCOPE: MINIMUM_NECESSARY`, con registro.

## 17 y 18 — Datos personales de terceros en uploads — **CORRECCIÓN APLICADA**

```
THIRD_PARTY_PERSONAL_DATA_IN_UPLOADS:
REAL_RISK

JOBIT_CONTROLLER_ROLE_FOR_USER_UPLOADED_THIRD_PARTY_DATA:
HUMAN_REVIEW_REQUIRED

ARTICLE_14_APPLICABILITY:
CONDITIONAL

ARTICLE_14_5_B_DISPROPORTIONATE_EFFORT:
DO_NOT_ASSUME
```

El riesgo es real y estructural: un candidato puede subir una fotografía en la que aparezcan otras personas, o incorporar material con datos de terceros —clientes, compañeros, referencias, capturas con nombres—.

**Lo que la v1.0 cerraba indebidamente y ahora se abre:**

1. **Condición de responsable.** La v1.0 afirmaba sin matices que JobIT es responsable respecto de todos esos datos y que la excepción doméstica del art. 2.2.c) no le ampara. La calificación de roles en escenarios de contenido subido por usuarios es una cuestión discutida —alcance de la excepción doméstica respecto del usuario, posición de la plataforma, eventual concurrencia de responsabilidades— y **corresponde a revisión humana**. `HUMAN_REVIEW_REQUIRED`.
2. **Aplicabilidad del art. 14.** Queda condicionada a esa calificación previa. `CONDITIONAL`.
3. **Excepción del art. 14.5.b).** La v1.0 la presentaba como «razonablemente invocable». **Se retira.** El umbral de la imposibilidad o el esfuerzo desproporcionado es **elevado** y debe analizarse **caso por caso**; no puede presumirse por el mero hecho de que los terceros no sean fácilmente contactables. `DO_NOT_ASSUME`.

**Medidas preparatorias que se mantienen, con independencia de cómo se resuelvan las cuestiones anteriores:**

- **Cláusula en Términos** sobre contenido de terceros, que prohíba subir material con datos personales de terceros sin base para ello y traslade al usuario la responsabilidad de disponer de dicha base.
- **Advertencia en el punto de subida**, no solo en el documento legal.
- **Canal de reporte y retirada** accesible para terceros que se identifiquen en contenido publicado — enlaza con SR-15.
- **Minimización**: no solicitar ni fomentar contenido que previsiblemente incluya a terceros.
- **No reconocimiento facial automático** para gestionar este riesgo: la solución generaría un problema mayor que el que resuelve, y tras la corrección de 1.b lo agravaría de forma directa.

**Contexto adicional:** el derecho a la propia imagen de terceros opera además en el marco de la Ley Orgánica 1/1982, con vías de reacción independientes del RGPD.

## 19 — Futuro tratamiento de imágenes con IA

```
FUTURE_AI_IMAGE_PROCESSING:
REASSESSMENT_TRIGGER
```

Cualquier análisis, clasificación, etiquetado, mejora automática, generación o comparación de imágenes obliga a rehacer, **sin automatismos**: la calificación del art. 9 —ahora con el criterio amplio de C-184/20, C-252/21 y C-21/23—; el test de sistema de IA del art. 3.1 del Reglamento (UE) 2024/1689 (SR-08 Parte D); el recuento de criterios de la lista AEPD para EIPD, en particular los de datos biométricos y nuevas tecnologías (SR-07, `CONDITIONAL / HUMAN_REVIEW_REQUIRED`); y el análisis de encargados (SR-10).

---

**REFERENCE:** SR-14
**CONCLUSION:** Una fotografía de perfil ordinaria no es dato biométrico del art. 9 salvo tratamiento técnico específico dirigido a la identificación unívoca. En cambio, respecto del **contenido revelador**, la calificación es `CONDITIONAL`: conforme a C-184/20, C-252/21 y C-21/23 el TJUE interpreta de forma amplia los datos que «revelan» información sensible, incluida la revelación indirecta por deducción, sin que la finalidad de inferir sea requisito en todos los casos. La eliminación de metadatos EXIF en imágenes publicadas es un control de privacidad desde el diseño **fuertemente indicado** con apoyo en los arts. 5.1.c) y 25, **no una obligación nominada**. El control de autorización en la lectura de imágenes privadas es condición material. La condición de responsable respecto de datos de terceros subidos por usuarios y la aplicabilidad del art. 14 y de su excepción 14.5.b) **quedan abiertas a revisión humana**.
**CLASSIFICATION:** CONDITIONAL / INFORMATION_REQUIRED
**OFFICIAL_LEGAL_BASIS:** RGPD arts. 4.1, 4.14, 5.1.c), 5.1.f), 9.1, 9.2.e), 14 y 14.5.b), 17, 25, 32; considerandos 35 y 51; LO 1/1982 (contexto); Reglamento (UE) 2024/1689 (prospectivo).
**OFFICIAL_SOURCES:** STJUE **C-184/20** (1 de agosto de 2022), **C-252/21** (4 de julio de 2023) y **C-21/23** Gran Sala (4 de octubre de 2024); EDPB Guidelines 4/2019; EUR-Lex; BOE; AEPD.
**FACTS_USED:** existencia de avatar/fotografía de perfil y contenido de portfolio; ausencia de afirmación sobre cualquier control técnico; `LOCATION_DEFAULT_VISIBILITY: PRIVATE`.
**RESPONSIBLE_DECISIONS_USED:** ubicación privada por defecto; portfolio opt-in; `ADMIN_DATA_ACCESS: EXCEPTIONAL`; puerta de proveedores.
**SPECIALIST_REASONING_SUMMARY:** La corrección sobre el art. 9 es la de mayor calado del paquete y opera en sentido **agravante**, no atenuante: la v1.0 ofrecía una regla cómoda —sin finalidad de inferir, no hay art. 9— que la jurisprudencia del TJUE no respalda. Reconocerlo tiene una consecuencia de diseño clara y coherente con lo ya decidido: si el contenido puede activar el art. 9 con independencia de la intención, la única posición segura es no construir ninguna capacidad de análisis sobre imágenes, y mantener el avatar estrictamente opcional. Las correcciones sobre EXIF y sobre datos de terceros operan en sentido contrario, reduciendo certeza donde la v1.0 afirmaba de más; el trabajo a realizar, sin embargo, es el mismo.
**REQUIRED_BEFORE_TRAMO_B:** (1) verificar el tratamiento actual de EXIF y decidir su eliminación al menos para imágenes publicadas; (2) verificar el control de autorización en la lectura de imágenes privadas; (3) inventariar los controles de subida; (4) verificar que la supresión alcanza derivadas y cachés; (5) confirmar la ausencia de tratamiento biométrico y de cualquier análisis de imagen; (6) redactar cláusula y advertencia sobre contenido de terceros y habilitar canal de retirada; (7) determinar el almacenamiento y su encargado (SR-10); (8) **validación humana** del rol respecto de datos de terceros y del alcance del art. 14.
**NON_BLOCKING_RECOMMENDATIONS:** re-codificar las imágenes en la subida; mantener el avatar estrictamente opcional; no implantar análisis de imagen de ningún tipo.
**PRIVATE_INFORMATION_REQUIRED:** NO
**BLOCKS_LEGAL_GATE:** CONDITIONAL — bloquea la publicación de imágenes hasta verificar EXIF y autorización de lectura.
**CONFIDENCE_OR_OPEN_INTERPRETATION:** Alta sobre la vertiente biométrica y sobre el riesgo estructural de contenido de terceros. **Abiertas:** alcance del art. 9 respecto de imágenes que revelen indirectamente categorías especiales en el contexto concreto de JobIT; rol de responsable respecto de datos de terceros; aplicabilidad del art. 14 y de su excepción 14.5.b); y calificación jurídica final de la eliminación de EXIF.

---

# REFERENCE: SR-15 — INCIDENTES, BRECHAS Y RECLAMACIONES (v1.1)

## Cuatro conceptos que no son equivalentes

| Concepto | Definición | Consecuencia |
|---|---|---|
| **Incidente de seguridad** | Evento que afecte o pueda afectar a la seguridad de los sistemas | **No genera por sí mismo obligación bajo el RGPD.** Gestión interna |
| **Violación de datos personales** | Art. 4.12: violación de la seguridad que ocasione destrucción, pérdida o alteración accidental o ilícita, o comunicación o acceso no autorizados | **Registro obligatorio del art. 33.5, siempre** |
| **Violación notificable a la autoridad** | Art. 33.1: toda violación **salvo que sea improbable que constituya un riesgo** | Notificación a la AEPD |
| **Violación que exige comunicación a los interesados** | Art. 34.1: cuando sea probable que entrañe un **alto riesgo** | Comunicación directa, con las excepciones del art. 34.3 |

Son **círculos concéntricos con tres umbrales distintos** —riesgo improbable, riesgo, alto riesgo—, que se evalúan por separado.

**Tres afirmaciones que no deben hacerse:**

- «Toda incidencia debe notificarse a la AEPD» → **incorrecto**.
- «72 horas para resolver el incidente» → **incorrecto**: el plazo es para **notificar**.
- «Si notifico a la AEPD, debo comunicar a los afectados» → **incorrecto**: obligaciones **independientes**.

---

## Respuestas requeridas

```
INCIDENT_REGISTER:
RECOMMENDED (incidentes de seguridad en general)

PERSONAL_DATA_BREACH_REGISTER:
REQUIRED — art. 33.5, para TODA violación, sea notificable o no

AEPD_NOTIFICATION_TRIGGER:
Violación de datos personales, salvo que sea improbable que constituya un
riesgo para los derechos y libertades (art. 33.1)

AEPD_NOTIFICATION_DEADLINE:
Sin dilación indebida y, de ser posible, a más tardar 72 horas después de
haber tenido constancia. Si se excede, indicar los motivos de la dilación

DATA_SUBJECT_NOTIFICATION_TRIGGER:
Alto riesgo (art. 34.1), con las excepciones del art. 34.3

PROCESSOR_NOTIFICATION_TO_CONTROLLER:
WITHOUT_UNDUE_DELAY (art. 33.2). El encargado NO está sujeto al plazo de
72 horas ni notifica a la autoridad

CONTRACTUAL_BREACH_SLA:
STRONGLY_RECOMMENDED

PURPOSE:
ALLOW_CONTROLLER_TO_ASSESS_AND_MEET_ART_33_DEADLINE

SPECIFIC_NUMBER_OF_HOURS_REQUIRED_BY_GDPR:
NO

INTERNAL_ESCALATION:
REQUIRED (decisión empresarial ya adoptada)

PRIVATE_RECORD:
REQUIRED

PUBLIC_REPOSITORY:
PROHIBITED para el registro real de incidentes
```

---

## Análisis detallado

### 1 y 2 — Cuándo existe violación y evaluación de riesgo

El art. 4.12 abarca **confidencialidad**, **integridad** y **disponibilidad**. Esta última se olvida con frecuencia: **la pérdida irreversible de datos por fallo de copias es una violación**, aunque nadie haya accedido a nada.

**Evaluación del riesgo** conforme al considerando 75 y a la Guía de la AEPD: naturaleza de la violación; categorías y volumen de datos; facilidad de identificación; gravedad de las consecuencias; características de los afectados; número de personas.

Aplicado a JobIT: datos profesionales declarados, sin categorías especiales intencionales, sin datos de pago, `req.ip` no persistida. Escenarios de mayor riesgo: **acceso no autorizado a credenciales**; **exposición pública indebida de perfiles configurados como privados**, incluida la republicación desde copias de un portfolio despublicado; y **pérdida irreversible por fallo de backups**.

### 3 a 5 — Notificación a la AEPD, plazo y notificación tardía

- **Cómputo:** desde que se tiene **constancia**, no desde que ocurre ni desde que se cierra la investigación. Conforme a las Directrices 9/2022 del CEPD, existe constancia cuando se alcanza un **grado razonable de certeza** de que se ha producido un incidente que ha comprometido datos personales; se admite un breve periodo de investigación previa, que debe documentarse.
- **72 horas es un máximo, no un objetivo.** La obligación primaria es «sin dilación indebida».
- **Notificación por fases (art. 33.4):** si no es posible facilitar toda la información simultáneamente, puede hacerse de manera gradual sin más dilación indebida.
- **Notificación tardía:** admisible, acompañada de los motivos de la dilación.
- **Canal:** formulario de notificación de brechas de la sede electrónica de la AEPD.
- **Herramienta de apoyo:** «Asesora Brecha» (art. 33). Es ayuda a la decisión y **no constituye pronunciamiento de la Agencia**; la valoración final corresponde al responsable.

### 6 — Información mínima (art. 33.3)

Naturaleza de la violación, con las categorías y el número aproximado de interesados y de registros afectados cuando sea posible; punto de contacto donde obtener más información —en JobIT, el rol interno de responsable de privacidad de SR-05, **no un DPD**—; consecuencias probables; y medidas adoptadas o propuestas, incluidas las de mitigación.

### 7 a 9 — Comunicación a los interesados y excepciones

- **Umbral:** alto riesgo (art. 34.1), superior al del art. 33.
- **Forma:** lenguaje claro y sencillo, con el contenido de las letras b), c) y d) del art. 33.3.
- **Excepciones del art. 34.3:** (a) medidas técnicas y organizativas apropiadas aplicadas a los datos afectados, en particular las que los hagan **ininteligibles**, como el cifrado; (b) medidas **ulteriores** que garanticen que ya no exista probabilidad de que se materialice el alto riesgo; (c) **esfuerzo desproporcionado**, en cuyo caso procede comunicación pública o medida semejante de eficacia equivalente.
- **Herramienta de apoyo:** «Comunica-Brecha RGPD» (art. 34), con la advertencia expresa de que su mera utilización no supone cumplimiento automático de las obligaciones del RGPD ni de la LOPDGDD.
- **Consecuencia de diseño:** la excepción (a) premia el cifrado — argumento adicional para verificar el cifrado en reposo de base de datos y copias, hoy `TO_VERIFY`.

### 10 — Registro interno (art. 33.5)

**Obligatorio para toda violación**, se notifique o no. Debe documentar los hechos, sus efectos y las medidas correctivas, de forma que la autoridad pueda verificar el cumplimiento.

**Contenido recomendado por entrada:** identificador; fecha y hora del incidente, de la detección y de la constancia; descripción; sistemas y datos afectados; categorías y número aproximado de afectados; evaluación de riesgo motivada; **decisión de notificar o no, con justificación expresa**; comunicación a interesados y su justificación; medidas de contención y correctivas; lecciones aprendidas; responsable de la decisión.

### 11 — Responsables internos

`RESPONSIBLE_OPERATOR: CONFIRMED_PRIVATE_VALUE_AVAILABLE`. **No se publican nombres privados.** El procedimiento designa responsable de la decisión y sustituto, sin reproducir identidades en documentación versionable. Se articula con el rol interno de responsable de privacidad de SR-05, **que no es un DPD**.

### 12 y 13 — Encargados y proveedores — **CORRECCIÓN APLICADA**

```
PROCESSOR_NOTIFICATION_TO_CONTROLLER:
WITHOUT_UNDUE_DELAY (art. 33.2)

CONTRACTUAL_BREACH_SLA:
STRONGLY_RECOMMENDED

SPECIFIC_NUMBER_OF_HOURS_REQUIRED_BY_GDPR:
NO
```

El art. 33.2 obliga al encargado a notificar al responsable **sin dilación indebida** tras tener conocimiento. No le corresponde notificar a la autoridad ni le aplica el plazo de 72 horas.

La v1.0 afirmaba que el contrato «debe incluir un plazo contractual concreto y más breve». **Esa formulación se retira**: el RGPD **no exige un número concreto de horas**. Lo que sí es cierto, y se mantiene como recomendación fuerte, es la **finalidad** del SLA contractual: `ALLOW_CONTROLLER_TO_ASSESS_AND_MEET_ART_33_DEADLINE`. Si el traslado desde el encargado es lento, el margen del responsable se reduce de hecho, aunque su plazo se compute desde su propia constancia.

**Un plazo concreto podrá definirse posteriormente como requisito contractual propio de JobIT**, no como exigencia normativa.

Consecuencias operativas, enlazadas con SR-10: incluir la obligación de notificación en el contrato del art. 28.3; conocer canal y punto de contacto de cada encargado; incorporar la verificación a la puerta de incorporación de proveedores; y tener presente que un incidente en el proveedor de alojamiento, almacenamiento o copias **es un incidente de JobIT** a efectos de los arts. 33 y 34.

### 14 y 15 — Evidencias y acceso administrativo

- **Evidencias:** conservar registros técnicos, cronología y decisiones, de modo que acrediten la diligencia y el momento de la constancia. Interactúan con la ausencia de persistencia de IP (SR-02.L): la investigación forense será limitada por diseño, lo que es coherente con la minimización pero **debe conocerse y documentarse de antemano**, no descubrirse durante un incidente.
- **Acceso administrativo:** `EXCEPTIONAL`, `MINIMUM_NECESSARY`, `AUTHORIZED_PERSONNEL_ONLY`. Precisión: **un acceso administrativo indebido —por personal autorizado pero fuera de finalidad— puede constituir en sí mismo una violación** en el sentido del art. 4.12. De ahí que el registro y la justificación de cada acceso (SR-12) sean también control de detección de brechas.

### 19 — Copias de seguridad

Doble papel: **mitigación** —permiten restaurar y pueden evitar que una pérdida de disponibilidad alcance alto riesgo— y **superficie de riesgo** —una copia comprometida es una violación—. Además, la **republicación desde copias** de un portfolio despublicado (SR-11, SR-13) sería una violación de confidencialidad, no un simple error funcional.

### 20 — Incidentes en preproducción

`REAL_CANDIDATE_DATA: NOT_AUTHORIZED`. Un incidente en preproducción con datos sintéticos **no es una violación de datos personales**. Pero si datos reales llegaran a preproducción, cualquier incidente allí sí lo sería, y el propio traslado podría constituir un tratamiento no autorizado. La separación de entornos no es higiene: es control de cumplimiento.

---

## Ciclo de vida del incidente

```
DETECT     Identificación del evento. Registro de fecha y hora.
CONTAIN    Contención inmediata. Prioritaria sobre cualquier análisis jurídico.
ASSESS     ¿Hay datos personales? ¿Hay violación del art. 4.12? Evaluación de riesgo.
           Aquí se fija el momento de "constancia" y arranca el plazo del art. 33.
DOCUMENT   Registro del art. 33.5. Obligatorio en todo caso, incluso si no se notifica.
NOTIFY     AEPD si procede (art. 33). Interesados si procede (art. 34). Decisiones
           independientes entre sí.
REMEDIATE  Medidas correctivas y de mitigación.
REVIEW     Análisis posterior, actualización de medidas del art. 32 y, en su caso,
           reconsideración de SR-07.
```

**Regla operativa:** contener primero, calificar después, documentar siempre.

## Incertidumbre inicial sobre si hay datos personales afectados — **CORRECCIÓN APLICADA**

```
LEGAL_NOTIFICATION_TEST:
ART_33_1_RISK_THRESHOLD

AWARENESS:
REASONABLE_DEGREE_OF_CERTAINTY

WHEN_INFORMATION_INCOMPLETE:
PHASED_NOTIFICATION_AVAILABLE

CONSERVATIVE_NOTIFICATION_WHEN_DOUBT_PERSISTS:
GOVERNANCE_RECOMMENDATION
```

La v1.0 formulaba «ante duda razonable y persistente, notificar» de forma que podía leerse como test jurídico. **Se retira esa lectura.** El test legal es y sigue siendo el del **art. 33.1**: notificar salvo que sea improbable que la violación constituya un riesgo. La duda no sustituye al test.

Procedimiento correcto:

1. **La incertidumbre no detiene el reloj indefinidamente.** Se admite un periodo breve de investigación hasta alcanzar un grado razonable de certeza, pero no puede utilizarse para dilatar la calificación.
2. **Actuar como si hubiera violación** durante la investigación: contener, preservar evidencias y documentar desde el minuto uno.
3. **Documentar la cronología**, que es lo que justificará después el momento en que se fijó la constancia.
4. **Si la información es incompleta pero se ha alcanzado la constancia y se supera el umbral del art. 33.1**, procede notificación por fases (art. 33.4).
5. **Si la duda persiste tras la investigación razonable**, notificar de forma conservadora es una **recomendación de gobernanza** —reduce el riesgo de notificación tardía injustificada—, **no una obligación legal**. La decisión debe motivarse en cualquiera de los dos sentidos.
6. **Si se concluye que no hubo violación o que el riesgo era improbable, dejar constancia motivada** en el registro. La decisión de no notificar es una decisión que debe poder acreditarse.

---

## RECLAMACIONES — separación de canales

`USER_VISIBLE_CONTACT_MODEL: SINGLE_CONTACT_POINT` e `INTERNAL_CLASSIFICATION: YES`.

**Viable para la recepción inicial**, con la misma condición que en SR-12: el plazo se computa desde la entrada en el canal único. Un punto de entrada único es incluso preferible, porque reduce la probabilidad de que un aviso relevante se pierda.

**Los canales jurídicos deben permanecer separados internamente:**

| Tipo | Régimen | Plazo | Destino interno |
|---|---|---|---|
| `PRIVACY_RIGHTS_REQUEST` | Arts. 12 a 22 RGPD; arts. 12 a 18 LOPDGDD | 1 mes, +2 prorrogable | Procedimiento de derechos (SR-12) |
| `SECURITY_INCIDENT` | Art. 32 RGPD; gestión interna | Inmediato, sin plazo legal de notificación | Procedimiento de incidentes |
| `DATA_BREACH` | Arts. 33 y 34 RGPD | 72 h desde la constancia | Escalado inmediato |
| `USER_COMPLAINT` | Contractual y de consumo | El que fijen los Términos | Soporte |
| `AEPD_COMPLAINT` | Art. 77 RGPD y ss.; procedimiento administrativo | El que fije la AEPD | Escalado inmediato; **nunca como soporte ordinario** |
| `DSA_COMPLAINT_IF_APPLICABLE` | Reglamento (UE) 2022/2065, si aplicable | Según el DSA | Pendiente de SR-13.M |

**Tres reglas de clasificación:**

1. **Una comunicación puede pertenecer a varias categorías.** «He visto datos de otra persona en mi cuenta» es incidente **y** posible brecha, aunque se formule como consulta de soporte. Clasificar por contenido, no por la etiqueta del remitente.
2. **La categoría más exigente marca el plazo.**
3. **Un requerimiento de la AEPD nunca se gestiona por soporte ordinario.**

**Coordinación con DPD.** No existe DPD y no es obligatorio (SR-05). Si se designara, sería el punto de contacto del art. 33.3.b). Mientras tanto, esa función la asume el rol interno de responsable de privacidad, **que no debe denominarse DPD**.

---

**REFERENCE:** SR-15
**CONCLUSION:** Los cuatro conceptos son círculos concéntricos con umbrales distintos. El registro del art. 33.5 es obligatorio para toda violación, se notifique o no. Las 72 horas son plazo de notificación desde la constancia, no de resolución, y admiten notificación por fases. La comunicación a interesados es obligación independiente con umbral de alto riesgo. El encargado notifica **sin dilación indebida**, sin que el RGPD imponga un número concreto de horas; un SLA contractual es **fuertemente recomendable** para permitir al responsable evaluar y cumplir el plazo del art. 33. Notificar ante duda persistente es **recomendación de gobernanza**, no test jurídico: el test es el umbral de riesgo del art. 33.1. El canal único es viable con separación interna estricta de los seis regímenes.
**CLASSIFICATION:** REQUIRED (registro y procedimiento) / CONDITIONAL (notificaciones, caso a caso)
**OFFICIAL_LEGAL_BASIS:** RGPD arts. 4.12, 5.1.f), 5.2, 24, 28.3, 32, **33 (1 a 5)**, **34 (1 a 4)**, 77; considerandos 75, 85, 86, 87 y 88; LOPDGDD arts. 5 y 12 a 18.
**OFFICIAL_SOURCES:** AEPD, «Guía para la notificación de brechas de datos personales», versión de junio de 2021; herramientas «Asesora Brecha» y «Comunica-Brecha RGPD», con sus advertencias expresas; sede electrónica de la AEPD; EDPB Guidelines 9/2022 y 01/2021.
**FACTS_USED:** `DATA_INCIDENT_ESCALATION: YES`; `DATA_INCIDENT_INTERNAL_RECORD: YES`; `INITIAL_INCIDENT_PROCESS: MANUAL`; `RESPONSIBLE_OPERATOR: CONFIRMED_PRIVATE_VALUE_AVAILABLE`; `ADMIN_DATA_ACCESS: EXCEPTIONAL`; `ADMIN_ACCESS_SCOPE: MINIMUM_NECESSARY`; `ADMIN_ACCESS_ACTOR: AUTHORIZED_PERSONNEL_ONLY`; `SINGLE_CONTACT_POINT`; `INTERNAL_CLASSIFICATION: YES`; `req.ip` no persistida; `REAL_CANDIDATE_DATA: NOT_AUTHORIZED`.
**RESPONSIBLE_DECISIONS_USED:** las anteriores.
**SPECIALIST_REASONING_SUMMARY:** El apartado sigue orientado a evitar los tres errores más caros del ámbito. Las dos correcciones de esta versión afectan a la frontera entre norma y buena práctica: ni el RGPD fija un plazo contractual para el encargado, ni convierte la prudencia ante la duda en obligación. Mantener esa frontera nítida importa especialmente aquí, porque un procedimiento interno que presente recomendaciones como obligaciones acaba generando incumplimientos formales de sus propias reglas.
**REQUIRED_BEFORE_TRAMO_B:** (1) procedimiento documentado con el ciclo DETECT→REVIEW; (2) registro del art. 33.5 con el campo de justificación de la decisión de no notificar; (3) designación de responsable de la decisión y sustituto, sin publicar nombres; (4) **SLA contractual de notificación para encargados**, como requisito propio de JobIT, incorporado a la puerta de SR-10; (5) plantillas de notificación y de comunicación; (6) matriz de clasificación de los seis regímenes; (7) verificación del cifrado en reposo, relevante para el art. 34.3.a).
**NON_BLOCKING_RECOMMENDATIONS:** simulacro documental antes de producción; uso de «Asesora Brecha» y «Comunica-Brecha RGPD» como apoyo, dejando constancia de la valoración propia; registro de incidentes fuera de todo repositorio versionado.
**PRIVATE_INFORMATION_REQUIRED:** YES
**IF_YES:** categoría — **datos de contacto del punto interno de escalado y de la persona responsable de la decisión de notificar**, para custodia privada y plantillas. No se solicitan nombres para su reproducción documental, ni secretos, ni credenciales.
**BLOCKS_LEGAL_GATE:** YES — no puede tratarse dato real de candidatos sin procedimiento de incidentes y registro operativos.
**CONFIDENCE_OR_OPEN_INTERPRETATION:** Alta en la delimitación de los cuatro conceptos, umbrales y plazos. Interpretación abierta: el momento exacto de la «constancia» en incidentes de calificación dudosa, casuístico; y el alcance de la excepción de esfuerzo desproporcionado del art. 34.3.c) en una base de usuarios reducida, donde difícilmente sería invocable.

---

# DEVELOPMENT GUIDANCE — PACKAGE 4 (v1.1)

```
DEVELOPMENT_GUIDANCE_STATUS:
PREPARATORY_REFERENCE_ONLY

IMPLEMENTATION_REQUIRES:
ORCHESTRATOR_AUTHORIZATION + SDD_SPEC_WHEN_APPLICABLE

TRAMO_B:
NOT_AUTHORIZED
```

> `SAFE_TO_IMPLEMENT_NOW` significa únicamente que el elemento **no depende de una conclusión jurídica pendiente**. **No** es autorización de implementación ni de código.

## SAFE_TO_IMPLEMENT_NOW *(sujeto a `IMPLEMENTATION_REQUIRES`)*

Tareas de verificación y documentación:

1. **Verificar en repositorio la visibilidad por defecto real de `location` y `availability`** tras publicar el portfolio. **Máxima prioridad.**
2. **Verificar el control de autorización en la lectura de imágenes privadas.**
3. **Verificar el tratamiento actual de metadatos EXIF.**
4. **Inventariar los controles de subida existentes.**
5. **Verificar que la supresión de imágenes alcanza derivadas y cachés.**
6. **Verificar la existencia, configuración y cifrado de las copias de seguridad.**
7. **Confirmar la ausencia de tratamiento biométrico y de cualquier análisis de imagen.**
8. **Documentar el procedimiento de gestión de incidentes** con el ciclo DETECT→REVIEW.
9. **Definir la estructura del registro de violaciones del art. 33.5**, con el campo de justificación de la decisión de no notificar.
10. **Definir la matriz de clasificación** de los seis regímenes de reclamación.
11. **Designar responsable de la decisión de notificar y sustituto**, en documentación privada.

## DESIGN_ONLY

1. **Defaults privados del portfolio** y lista blanca de campos, con regla de que todo campo nuevo nace privado.
2. **Preview previo a la publicación**, con los siete contenidos mínimos de SR-13.E.
3. **Mecanismo de indexación**: `noindex` por defecto y activación separada.
4. **Solicitud de desindexación** al despublicar, como medida de mitigación.
5. **Garantía de no republicación desde copias.**
6. **Eliminación de metadatos no necesarios en la subida**, preferentemente mediante re-codificación.
7. **Controles de seguridad de uploads** conforme al art. 32.
8. **Supresión en cascada** de original, derivadas y cachés, coordinada con el bloqueo del art. 32 LOPDGDD.
9. **Esquema de evidencia** de activación y de retirada del portfolio.
10. **Cláusula y advertencia sobre contenido de terceros**, y canal de reporte y retirada.
11. **Plantillas** de notificación a la AEPD y de comunicación a interesados.
12. **SLA contractual de notificación de encargados**, como requisito propio de JobIT, integrado en la puerta de SR-10.
13. **Separación interna de canales** manteniendo el punto de contacto único visible.
14. **`RECIPIENT_PROPAGATION_MECHANISM`** (heredado del Paquete 3).

## DO_NOT_IMPLEMENT_UNTIL_HUMAN_REVIEW

1. **Publicación real de cualquier portfolio con datos reales**, antes de verificar los defaults.
2. **Publicación de avatares** antes de resolver EXIF y autorización de lectura.
3. **Indexación por motores de búsqueda** activada por defecto.
4. **Cualquier análisis, clasificación o procesamiento de imágenes**, incluidos reconocimiento facial y moderación automatizada.
5. **Detección automática de rostros** para gestionar contenido de terceros.
6. **Textos legales definitivos**, incluidos los avisos del preview y las cláusulas sobre contenido de terceros.
7. **Publicación del registro de incidentes** o de cualquier extracto con datos reales en repositorio versionado.
8. **Reproducción de nombres del operador responsable** en documentación versionable.
9. **Traslado de datos reales de candidatos a entornos de preproducción.**
10. **Todo lo ya listado en los Paquetes 2 y 3** que permanezca en esta categoría.

---

# CONSOLIDATED PREPARATORY LEGAL BASELINE

> Resumen de referencia. **No sustituye a los documentos completos.** **Los estados de SR-01 a SR-12 no se alteran.**

| REFERENCE | SUBJECT | AI_REFERENCE_STATUS | HUMAN_VALIDATION | BLOCKER_OR_DEPENDENCY | MAIN_DEVELOPMENT_GUIDANCE |
|---|---|---|---|---|---|
| **SR-01** | Responsable e información identificativa | ACCEPTED | PENDING | **BLOCKS** — faltan identidad formal y dirección publicable; NIF exigible si aplica LSSI | Aviso Legal, Política de Privacidad y Términos separados y accesibles sin autenticación |
| **SR-02** | Finalidades y bases jurídicas (A-M) | ACCEPTED | PENDING | CONDITIONAL — faltan plazos y encargados | Base contractual para el núcleo; consentimiento separado solo para portfolio; `req.ip` sin persistencia |
| **SR-03** | Términos, Aviso Legal y LSSI | ACCEPTED | PENDING | **BLOCKS** — depende de SR-01 y del ámbito LSSI; reserva abierta sobre notificaciones sin correo transaccional | Aceptación expresa con evidencia versionada; confirmación archivable; tres capas separadas |
| **SR-04** | Edad y menores | ACCEPTED | PENDING | NO | Autodeclaración 18+; sin fecha de nacimiento ni documento; procedimiento de detección |
| **SR-05** | DPD / DPO | ACCEPTED_WITH_DIRECTOR_ANNOTATIONS | PENDING | NO — `LARGE_SCALE: NO_ON_CURRENT_FACTS`; monitorización no resuelta | Rol interno de responsable de privacidad, **no** denominado DPD; umbral de revisión por volumen |
| **SR-06** | RAT / art. 30 | ACCEPTED_WITH_DIRECTOR_ANNOTATIONS | PENDING | CONDITIONAL — `PENDING_SR_10` y `PENDING_SR_11`; reforma del art. 30.5 en tramitación | RAT versionado con huecos declarados; hechos técnicos `TO_VERIFY_IN_REPOSITORY` |
| **SR-07** | EIPD / DPIA | ACCEPTED_WITH_DIRECTOR_ANNOTATIONS | PENDING | CONDITIONAL — `DPIA_MANDATORY_NOW: CONDITIONAL / HUMAN_REVIEW_REQUIRED`; 1 criterio confirmado, 1 abierto | Documento motivado de análisis; checklist de triggers antes de cada cambio funcional |
| **SR-08** | Match, art. 22 y AI Act | ACCEPTED_WITH_DIRECTOR_ANNOTATIONS | PENDING | CONDITIONAL — `DSA_ONLINE_PLATFORM_STATUS` abierto, con art. 19 DSA previo al art. 27 | El match ordena pero **no filtra**; ningún umbral que oculte ofertas sin revisión |
| **SR-09** | Cookies, auth y terminal | ACCEPTED | PENDING | **BLOCKS** — inventario pendiente; `PERSISTENT_AUTH_COOKIE_EXEMPTION: NOT_CONFIRMED` | Resolver la persistencia por una de las tres vías; sin banner mientras no haya elemento no exento |
| **SR-10** | Proveedores y transferencias | ACCEPTED | PENDING | **BLOCKS** — `PRIVATE_INFORMATION_REQUIRED`; región de copias por verificar | Matriz por componentes, no por proveedores; puerta de incorporación con 11 requisitos |
| **SR-11** | Conservación y supresión | ACCEPTED | PENDING | **BLOCKS** — plazos por decidir; patrón de bloqueo `TO_DESIGN` | Bloqueo del art. 32 LOPDGDD por diseño; no republicación desde copias |
| **SR-12** | Ejercicio de derechos | ACCEPTED | PENDING | CONDITIONAL — art. 19 sobre portfolio abierto; acceso a copias por analizar | Derechos por tratamiento y base; encargados **son** destinatarios; simetría del art. 7.3 |
| **SR-13** | Portfolio público | **CURRENT_PACKAGE** | PENDING | **BLOCKS** — `HISTORICAL_DEFAULT_DIVERGENCE: POTENTIAL_NON_CONFORMITY`; `TECHNICAL_VERIFICATION: REQUIRED`; `PORTFOLIO_LEGAL_BASIS: PRELIMINARY_PREFERRED_ART_6_1_A · HUMAN_VALIDATION_REQUIRED` | Defaults privados con respaldo del art. 25.2; preview con siete contenidos; `noindex` por defecto |
| **SR-14** | Avatar, imágenes y uploads | **CURRENT_PACKAGE** | PENDING | CONDITIONAL — `SPECIAL_CATEGORY_IMAGE_CONTENT: CONDITIONAL`; rol respecto de datos de terceros y art. 14 abiertos; EXIF y autorización de lectura por verificar | Ningún análisis de imagen; eliminación de metadatos antes de publicar; autorización real en lectura privada |
| **SR-15** | Incidentes, brechas y reclamaciones | **CURRENT_PACKAGE** | PENDING | **BLOCKS** — sin procedimiento no puede tratarse dato real | Registro del art. 33.5 siempre; `PROCESSOR_LEGAL_DEADLINE: WITHOUT_UNDUE_DELAY`; `CONTRACTUAL_SLA: RECOMMENDED`; separación de los seis regímenes |

**Estados utilizados:** `AI_REFERENCE_STATUS`: ACCEPTED / ACCEPTED_WITH_DIRECTOR_ANNOTATIONS / CURRENT_PACKAGE. `HUMAN_VALIDATION`: PENDING en las quince referencias.

**No se utilizan, en ningún punto del expediente, los términos `LEGALLY_APPROVED` ni `COMPLIANT`.**

---

# DOCUMENTACIÓN PARA REPOSITORIO — PROPUESTA

> **No se crea ningún archivo. No se modifica el repositorio.** Se propone exclusivamente estructura y contenido.

## Estructura propuesta

```
docs/legal/reference/
├── s22-priv-01-specialized-review-package-1-sr-01-04.md
├── s22-priv-01-specialized-review-package-2-sr-05-08.md
├── s22-priv-01-specialized-review-package-3-sr-09-12.md
├── s22-priv-01-specialized-review-package-4-sr-13-15.md
└── README.md
```

**Convenciones recomendadas:** ruta `docs/legal/reference/` deliberadamente distinta de cualquier futura `docs/legal/published/`, para que la separación entre *referencia preparatoria* y *texto legal aprobado* sea evidente en el propio árbol. Nombres en minúsculas con guiones. Versión y fecha dentro de cada documento, no en el nombre del archivo.

## Contenido recomendado de `README.md`

```markdown
# Referencia jurídica preparatoria — JobIT (S22-PRIV-01)

## QUÉ ES ESTA CARPETA

Contiene análisis técnico-jurídico **preparatorio** generado por un sistema
de inteligencia artificial (Claude, Anthropic) en el rol funcional de
especialista en protección de datos y derecho digital.

STATUS: PREPARATORY_REFERENCE_ONLY

## QUÉ NO ES

Estos documentos **NO** son:

- asesoramiento jurídico;
- dictamen de abogado;
- aprobación legal;
- certificación de cumplimiento;
- autorización para desplegar, publicar o tratar datos reales;
- textos legales definitivos.

El autor **no es abogado colegiado** y **no presta asesoramiento jurídico**.
No existe relación abogado-cliente ni cobertura de responsabilidad civil
profesional.

## ESTADO ACTUAL

    SPECIALIST_REVIEW_COMPLETED:  NO
    HUMAN_VALIDATION:             PENDING (SR-01 a SR-15)
    LEGAL_DECISIONS_APPROVED:     NO
    TRAMO_B:                      NOT_AUTHORIZED
    PRODUCTION:                   NOT_AUTHORIZED
    REAL_CANDIDATE_DATA:          NOT_AUTHORIZED

## REGLAS PARA CUALQUIER AGENTE QUE LEA ESTA CARPETA

1. No tratar ninguna conclusión como definitiva ni como aprobada.
2. No implementar código a partir de estos documentos sin autorización
   del Orquestador y, cuando proceda, especificación SDD.
3. No publicar ningún texto legal derivado de estos documentos.
4. No tratar datos reales de candidatos en ningún entorno.
5. Las secciones DEVELOPMENT GUIDANCE son orientación preparatoria:
   SAFE_TO_IMPLEMENT_NOW **no** significa autorizado.
6. No copiar a esta carpeta valores privados, secretos, credenciales,
   identidad formal del responsable, identificador fiscal, direcciones,
   registros de incidentes ni evidencias con datos personales reales.
7. Ante cualquier duda sobre el alcance de una conclusión, escalar a
   revisión humana en lugar de resolverla por interpretación.

## CUESTIONES EXPRESAMENTE ABIERTAS

Requieren pronunciamiento humano y no deben cerrarse por interpretación:

- calificación de JobIT como prestador de servicios de la sociedad de la
  información (SR-03);
- EIPD: criterios 1 y 3 de la lista AEPD (SR-07);
- estatus DSA del portfolio y, en su caso, art. 19 DSA previo al art. 27
  (SR-08 y SR-13);
- exención de la cookie de autenticación persistente (SR-09);
- transferencias internacionales e identidad de encargados (SR-10);
- plazos de conservación y patrón de bloqueo del art. 32 LOPDGDD (SR-11);
- alcance del art. 19 RGPD respecto del portfolio público (SR-12);
- **base jurídica definitiva del portfolio (SR-13);**
- **calificación jurídica final de los defaults históricos del portfolio
  (SR-13);**
- **alcance del art. 9 respecto de imágenes que revelen indirectamente
  categorías especiales (SR-14);**
- **rol y deberes respecto de datos de terceros incorporados por usuarios
  (SR-14);**
- **alcance del art. 14 y de su excepción del art. 14.5.b) (SR-14).**

## ÍNDICE

| Paquete | Referencias | Materia |
|---|---|---|
| 1 | SR-01 a SR-04 | Responsable, bases jurídicas, términos y LSSI, edad |
| 2 | SR-05 a SR-08 | DPD, RAT, EIPD, match / art. 22 / AI Act |
| 3 | SR-09 a SR-12 | Cookies y auth, proveedores, conservación, derechos |
| 4 | SR-13 a SR-15 | Portfolio público, imágenes y uploads, incidentes |

## VIGENCIA

Fecha de corte del análisis: 18 de agosto de 2026.

Existen procedimientos legislativos y criterios en evolución que pueden
afectar a estas conclusiones, entre ellos la reforma en tramitación del
art. 30.5 RGPD. Comprobar vigencia antes de la revisión humana final.
```

**Advertencia adicional:** conforme a SR-06.6 y SR-15, **no deben incorporarse a esta carpeta ni a ninguna otra versionada** los valores identificativos privados del responsable, los datos de encargados y contratos, las configuraciones de seguridad explotables, el registro real de incidentes, las evidencias de consentimiento o de aceptación, ni los nombres del personal autorizado.

---

## ESTADO FINAL DEL PAQUETE 4 (v1.1)

```
SPECIALIST_REVIEW_COMPLETED:  NO
LEGAL_DECISIONS_APPROVED:     NO
TRAMO_B:                      NOT_AUTHORIZED
PRODUCTION:                   NOT_AUTHORIZED
REAL_CANDIDATE_DATA:          NOT_AUTHORIZED

SR-13  PORTFOLIO_LEGAL_BASIS:            PRELIMINARY_PREFERRED_BASIS_ART_6_1_A
       ALTERNATIVES_ANALYSED:            ART_6_1_B · ART_6_1_F
       CURRENT_AI_ASSESSMENT:            ART_6_1_A_BEST_FOUNDED_ON_CURRENT_FACTS
       HUMAN_VALIDATION:                 REQUIRED
       PORTFOLIO_CONSENT_REQUIRED:       CONDITIONAL_ON_FINAL_LEGAL_BASIS
       DEFAULT_PRIVATE_CONFIGURATION:    STRONGLY_SUPPORTED_BY_ART_25_2
       LOCATION_PUBLIC_BY_DEFAULT:       NO
       AVAILABILITY_PUBLIC_BY_DEFAULT:   NO
       HISTORICAL_DEFAULT_DIVERGENCE:    POTENTIAL_NON_CONFORMITY
       TECHNICAL_VERIFICATION:           REQUIRED
       FINAL_LEGAL_CLASSIFICATION:       HUMAN_REVIEW_REQUIRED
       PUBLICATION_PREVIEW:              REQUIRED
       NOINDEX_NOFOLLOW:                 CONDITIONAL — RECOMMENDATION_AS_DEFAULT
       SEARCH_ENGINE_DEINDEXING:         REASONABLE_RISK_MITIGATION_MEASURE
       LEGAL_OBLIGATION (deindexing):    DO_NOT_PREJUDGE
       JOBIT_CONTROLLED_SYSTEMS:         REMOVE_EFFECTIVELY_AS_SOON_AS_POSSIBLE
       ARTICLE_19:                       HUMAN_REVIEW_REQUIRED
       DSA_STATUS_IMPACT:                CONDITIONAL / HUMAN_REVIEW_REQUIRED

SR-14  ORDINARY_PROFILE_PHOTO_AS_BIOMETRIC_ART9:
                                         NO_UNLESS_SPECIFIC_TECHNICAL_PROCESSING
       PHOTO_OR_IMAGE_REVEALING_OTHER_ART9_DATA:  CONDITIONAL
       PURPOSE_TO_INFER_SPECIAL_CATEGORY:         NOT_REQUIRED_IN_ALL_CASES
       ARTICLE_9_ASSESSMENT:             DEPENDS_ON_CONTENT_AND_PROCESSING_CONTEXT
       BIOMETRIC_PROCESSING:             TO_VERIFY
       EXIF_HANDLING:                    TO_VERIFY_IN_REPOSITORY
       EXIF_STRIPPING_FOR_PUBLIC_IMAGES: STRONGLY_INDICATED_PRIVACY_BY_DESIGN_CONTROL
       STANDALONE_NAMED_LEGAL_REQUIREMENT: NO
       UPLOAD_SECURITY_CONTROLS:         SECURITY_RECOMMENDATIONS · TO_VERIFY
       PRIVATE_IMAGE_AUTHORISATION:      MATERIAL_CONDITION (art. 5.1.f)
       THIRD_PARTY_PERSONAL_DATA_IN_UPLOADS:      REAL_RISK
       JOBIT_CONTROLLER_ROLE:            HUMAN_REVIEW_REQUIRED
       ARTICLE_14_APPLICABILITY:         CONDITIONAL
       ARTICLE_14_5_B:                   DO_NOT_ASSUME
       DELETION:                         ORIGINAL + DERIVATIVES + CACHES
       FUTURE_AI_IMAGE_PROCESSING:       REASSESSMENT_TRIGGER

SR-15  INCIDENT_REGISTER:                RECOMMENDED
       PERSONAL_DATA_BREACH_REGISTER:    REQUIRED (art. 33.5)
       AEPD_NOTIFICATION_TRIGGER:        Riesgo no improbable (art. 33.1)
       AEPD_NOTIFICATION_DEADLINE:       72 h desde la constancia; fases si procede
       DATA_SUBJECT_NOTIFICATION_TRIGGER: Alto riesgo (art. 34.1), excepciones 34.3
       PROCESSOR_LEGAL_DEADLINE:         WITHOUT_UNDUE_DELAY
       CONTRACTUAL_SLA:                  RECOMMENDED
       SPECIFIC_HOURS_REQUIRED_BY_GDPR:  NO
       LEGAL_NOTIFICATION_TEST:          ART_33_1_RISK_THRESHOLD
       CONSERVATIVE_NOTIFICATION:        GOVERNANCE_RECOMMENDATION
       INTERNAL_ESCALATION:              REQUIRED
       PRIVATE_RECORD:                   REQUIRED
       PUBLIC_REPOSITORY:                PROHIBITED

REFERENCIAS ABIERTAS:  ninguna nueva. SR-01 a SR-15 completo como
                       referencia preparatoria de IA.
HUMAN_VALIDATION:      PENDING para las quince referencias.
```

---

*Fin del documento. JOBIT — S22-PRIV-01 · Specialized Review Package 4 · SR-13 a SR-15 · v1.1 · 18 de agosto de 2026. Referencia preparatoria. Pendiente de validación por profesional humano cualificado.*
