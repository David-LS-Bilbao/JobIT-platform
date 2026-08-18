# JOBIT — S22-PRIV-01

## SPECIALIZED REVIEW PACKAGE 1 · SR-01 a SR-04 · Versión 2.0 (revisada)

---

## PORTADA — IDENTIFICACIÓN DEL DOCUMENTO

| Campo | Contenido |
|---|---|
| **Documento** | JOBIT — S22-PRIV-01 · Specialized Review Package 1 · SR-01 a SR-04 |
| **Versión** | 2.0 (revisada). Sustituye a la v1.0 y responde a las 12 correcciones del Chat Director |
| **Fecha de revisión** | 18 de agosto de 2026 |
| **Identidad y cualificación del revisor** | Análisis elaborado por un asistente de IA (Claude, Anthropic) actuando en el rol funcional de especialista en protección de datos y derecho digital. **No es abogado colegiado, no está inscrito en ningún Colegio de Abogados y no presta asesoramiento jurídico en el sentido legal del término.** No existe relación abogado-cliente ni cobertura de responsabilidad civil profesional. El documento está construido sobre fuentes oficiales verificables y es apto como base técnica de trabajo, pero **requiere validación y firma de letrado colegiado antes de cualquier decisión, publicación o autorización de tramo.** Esta advertencia es material y debe conservarse en todas las versiones. |
| **Alcance exacto** | Únicamente SR-01 (responsable e información identificativa), SR-02 (finalidades y bases jurídicas, tratamientos A-M), SR-03 (términos, aviso legal y LSSI) y SR-04 (edad y menores). Quedan expresamente fuera: encargados y transferencias, plazos de conservación, cookies y autenticación (SR-09), DPD, art. 30, EIPD y clasificación definitiva del match bajo art. 22 RGPD y Reglamento (UE) 2024/1689 (SR-08). |
| **Estado** | SPECIALIST_REVIEW_COMPLETED: **NO** (pendiente de validación humana colegiada) |
| **Reservas y puntos abiertos** | (1) Calificación de JobIT como servicio de la sociedad de la información, pendiente de confirmar el carácter económico de la actividad. (2) Art. 22 RGPD: evaluación preliminar; conclusión reservada a SR-08. (3) Clasificación AI Act del match: reservada a SR-08. (4) LSSI art. 22.2 y cookie/refresh token: reservada a SR-09. (5) Suficiencia del soporte duradero sin proveedor de email transaccional: conclusión con condiciones técnicas y reserva parcial (SR-03.6). (6) Riesgo regulatorio del PLO de protección de menores en entornos digitales, en tramitación. |

---

## TABLA DE CORRECCIONES APLICADAS

| # | Corrección solicitada | Tratamiento |
|---|---|---|
| 1 | Fuentes oficiales como fundamento principal | Aplicada. Ver «Fuentes oficiales» y citas en cada SR |
| 2 | AI Act: «con ML entraría» | **Corregida y retirada.** Reformulada como test de cuatro pasos; clasificación diferida a SR-08 |
| 3 | Fotografía como art. 9 | **Corregida.** Reformulada conforme al Cdo. 51 y art. 4.14 RGPD |
| 4 | Rate limiting / IP | **Corregida.** Sustituido el hecho por el estado técnico canónico; retirada la retención inventada |
| 5 | Art. 22 RGPD | **Corregida.** Reformateada como ART_22_PRELIMINARY_ASSESSMENT + DEFERRED_TO_SR-08 |
| 6 | Confirmación contractual sin email | **Corregida.** Distinción LSSI 28 / TRLGDCU 98.7; respuesta A con condiciones + reserva parcial B |
| 7 | LSSI art. 22.2 «en todo caso» | **Corregida.** Condicionada al ámbito de la LSSI; conclusión diferida a SR-09 |
| 8 | CC arts. 240 y 1263 | **Corregida.** Actualizada la referencia y reformulado el razonamiento sobre capacidad |
| 9 | DSA art. 28.3 | **Corregida.** Retirada la lectura prohibitiva; sustituida por juicio de necesidad/proporcionalidad |
| 10 | Persona física vs. sociedad | **Corregida.** Tratada como intención empresarial confirmada; solo consecuencias jurídicas |
| 11 | Flags de estado | Mantenidos sin alteración |
| 12 | Portada | Incorporada |

---

## FUENTES OFICIALES UTILIZADAS

**Derecho de la Unión (EUR-Lex):** Reglamento (UE) 2016/679 (RGPD), en particular Cdo. 49, Cdo. 51 y arts. 4.14, 5, 6, 7, 8, 9, 12-22, 24, 25, 32, 33; Reglamento (UE) 2022/2065 (DSA), arts. 3, 28 y 35; Reglamento (UE) 2024/1689 (AI Act), arts. 3, 6 y Anexo III; Reglamento (UE) 2026/1744 (ómnibus digital sobre IA); Reglamento (UE) 2024/3228 (supresión de la plataforma RLL/ODR); STJUE de 7 de diciembre de 2023, C-634/21 (SCHUFA); STJUE de 5 de julio de 2012, C-49/11 (Content Services); STJUE de 25 de enero de 2017, C-375/15 (BAWAG).

**Derecho español (BOE):** Ley 34/2002 (LSSI), ELI BOE-A-2002-13758, texto consolidado; LO 3/2018 (LOPDGDD), BOE-A-2018-16673; RDL 1/2007 (TRLGDCU), BOE-A-2007-20555; Ley 7/1998 (LCGC), BOE-A-1998-8789; Código Civil, BOE-A-1889-4763, texto consolidado tras la Ley 8/2021; Resolución de 22 de enero de 2025 (BOE-A-2025-1136), que publica el Acuerdo de derogación del RDL 9/2024.

**Autoridades:** AEPD, «Decálogo de principios. Verificación de edad y protección de personas menores de edad ante contenidos inadecuados» y notas técnicas asociadas; EDPB, Statement 1/2025 on age assurance, adoptada en el plenario de febrero de 2025, que enumera diez principios para el tratamiento conforme de datos personales al determinar la edad o la franja de edad de una persona; EDPB Guidelines 2/2019 (art. 6.1.b en servicios en línea), 5/2020 (consentimiento) y 1/2024 (interés legítimo).

**Fuentes secundarias:** utilizadas únicamente como material complementario de contraste sobre el estado de tramitación del Proyecto de Ley Orgánica de protección de menores en entornos digitales y sobre el calendario del ómnibus digital; no fundamentan ninguna conclusión.

---

# REFERENCE: SR-01 — RESPONSABLE E INFORMACIÓN IDENTIFICATIVA (v2.0)

**CONCLUSION:**

Se parte de la intención empresarial confirmada `FIRST_PRODUCTION_UNDER_CURRENT_NATURAL_PERSON_CONTROLLER`. El informe se limita a exponer sus consecuencias jurídicas; la revalidación de esa opción corresponde al responsable y no se plantea aquí como decisión pendiente.

**Tres capas informativas distintas:**

**(i) Exigible por RGPD (siempre, con independencia de la LSSI).** Art. 13.1.a): identidad y datos de contacto del responsable; art. 13.1.b): datos del DPD si se designa; art. 13.2.d): derecho a reclamar ante la autoridad de control. La marca «JobIT» no satisface por sí sola el art. 13.1.a): el candidato debe poder identificar a la persona responsable del tratamiento.

**(ii) Exigible como prestador bajo LSSI (condicionado al ámbito).** El art. 10.1 obliga a disponer de medios que permitan acceder por medios electrónicos, de forma permanente, fácil, directa y gratuita, a: nombre o denominación social, residencia o domicilio o dirección de un establecimiento permanente en España, dirección de correo electrónico y cualquier otro dato que permita comunicación directa y efectiva (letra a); datos registrales si procede (letra b); autorización administrativa previa si procede (letra c); datos colegiales si es profesión regulada (letra d); **el número de identificación fiscal (letra e)**; información sobre precios cuando el servicio los refiera (letra f); y códigos de conducta a los que esté adherido (letra g). El art. 10.2 precisa que la obligación se cumple incluyendo esa información en el sitio de Internet en las condiciones del apartado 1.

Corrección de la v1.0: el NIF es la letra **e)**, no la f). La precisión importa por el régimen sancionador: el art. 38.3.b) tipifica como **grave** el incumplimiento significativo de las letras a) y f), mientras que el art. 38.4.b) tipifica como **leve** la falta de información sobre las letras b), c), d), e) y g). La omisión del NIF es, por tanto, infracción leve; la omisión del nombre, domicilio o medio de contacto puede ser grave.

**(iii) Recomendable, no obligatoria.** Canal específico de privacidad, mención informativa a la AEPD como autoridad ante la que reclamar, y publicación de un punto de contacto único.

**Viabilidad de la estructura marca + identidad formal separada: SÍ.** El art. 10.1 LSSI exige accesibilidad permanente, fácil, directa y gratuita, no prominencia comercial. Operar bajo el nombre «JobIT» y alojar la identidad formal en el Aviso Legal enlazado desde todas las superficies es conforme, siempre que ese enlace no exija registro ni autenticación.

**Consecuencias jurídicas concretas de mantener la persona física como responsable:**

1. La letra a) del art. 10.1 obliga a publicar residencia o domicilio o, en su defecto, la dirección de un establecimiento permanente en España. La norma admite expresamente la segunda opción, de modo que designar y publicar una dirección profesional distinta del domicilio particular es conforme al precepto, siempre que sea real y apta para comunicaciones.
2. La letra e) obliga a publicar el NIF, que para una persona física coincide con el número de su documento de identidad. No existe excepción por razones de privacidad: la publicación queda amparada por el art. 6.1.c) RGPD (obligación legal) y no constituye por sí misma un tratamiento ilícito.
3. No procede inscripción registral (letra b) salvo inscripción voluntaria; no hay autorización administrativa previa (letra c) — el art. 6 LSSI excluye la sujeción a autorización previa; no hay profesión regulada (letra d).
4. No es aplicable el art. 27 RGPD (representante), por estar el responsable establecido en España.

**Datos que deben ser públicamente accesibles:** identidad formal, nombre comercial, dirección publicable (domicilio o establecimiento), correo electrónico y medio de comunicación directa y efectiva, NIF si LSSI aplica; y en Política de Privacidad, identidad y contacto del responsable, canal de derechos y referencia a la AEPD.

**Datos que permanecen en custodia privada:** copia de documento identificativo, teléfono personal (no obligatorio si existe otro medio directo y efectivo), datos bancarios, documentación fiscal, domicilio particular si se designa establecimiento distinto.

**Canal único de contacto: viable.** Ni el RGPD ni la LSSI exigen buzones diferenciados. El plazo del art. 12.3 RGPD se computa desde la entrada en el canal único, no desde la clasificación interna.

**CLASSIFICATION:** REQUIRED (art. 13 RGPD) / CONDITIONAL (bloque art. 10 LSSI, condicionado al ámbito)

**OFFICIAL_LEGAL_BASIS:** RGPD arts. 12, 13.1.a) y b), 13.2.d); Ley 34/2002, arts. 1, 2, 6, 10.1 y 10.2, 38.3.b) y 38.4.b), y Anexo a); LOPDGDD art. 11.

**FACTS_USED:** territorio España; marca pública JobIT; canal único con clasificación interna; valores formales segregados.

**RESPONSIBLE_DECISIONS_USED:** `FIRST_PRODUCTION_UNDER_CURRENT_NATURAL_PERSON_CONTROLLER`; identidad formal separada de la marca; canal único; no publicación de valores privados en repositorio.

**SPECIALIST_REASONING_SUMMARY:** El RGPD regula quién decide sobre los datos; la LSSI regula quién presta el servicio. Son obligaciones distintas, con superficies distintas y régimen sancionador distinto, y no deben fusionarse en un único documento. La opción de persona física es plenamente lícita; su única consecuencia estructural relevante es que la letra e) del art. 10.1 traslada al espacio público un identificador que en una sociedad sería societario. La letra a) ofrece una vía legal de mitigación —dirección de establecimiento— que no requiere modificar la forma jurídica.

**REQUIRED_BEFORE_TRAMO_B:**

1. Confirmar si existe o se prevé modelo de ingresos (determina el ámbito LSSI).
2. Fijar la dirección concreta que se publicará (domicilio o establecimiento).
3. Confirmar dirección de correo electrónico operativa y dedicada.
4. Confirmar inexistencia de inscripción registral o, en su caso, sus datos.

**NON_BLOCKING_RECOMMENDATIONS:** Aviso Legal, Política de Privacidad y Términos como tres documentos separados, enlazados desde el pie de todas las páginas y accesibles sin autenticación; versionado con fecha visible; enfoque por capas en el formulario de registro; no designar DPD si no procede, dado que la designación activa las obligaciones del art. 38 RGPD.

**PRIVATE_INFORMATION_REQUIRED:** YES

**IF_YES:** categorías: denominación identificativa formal; dirección postal destinada a publicación; existencia y tipología del identificador fiscal; correo electrónico de contacto; datos registrales si existieran. Sin reproducción en repositorio público.

**BLOCKS_LEGAL_GATE:** YES

**CONFIDENCE_OR_OPEN_INTERPRETATION:** Alta sobre RGPD art. 13 y sobre el contenido y régimen sancionador del art. 10 LSSI. Abierta: la calificación como SSI si el servicio fuera permanentemente gratuito y sin actividad económica alguna para el prestador.

---

# REFERENCE: SR-02 — FINALIDADES Y BASES JURÍDICAS (v2.0)

**CONCLUSION:** JobIT no necesita casillas de consentimiento adicionales para el núcleo del servicio. El consentimiento es base residual, no base por defecto. Única acción de consentimiento diferenciada exigible: portfolio público.

**A. Cuenta** — PURPOSE: alta, identificación y gestión de la relación. LEGAL_BASIS: art. 6.1.b). CLASSIFICATION: REQUIRED. OFFICIAL_SOURCE: RGPD art. 6.1.b); EDPB Guidelines 2/2019. CONSENT_REQUIRED: NO. SEPARATE_CONSENT_ACTION_REQUIRED: NO. NOTES: email + contraseña como mínimo necesario es conforme al art. 5.1.c).

**B. Autenticación y seguridad de sesión** — LEGAL_BASIS: art. 6.1.b) para la sesión; art. 6.1.f) y art. 32 para las medidas de seguridad. CLASSIFICATION: REQUIRED. CONSENT_REQUIRED: NO. NOTES: **corrección aplicada.** El régimen del almacenamiento en el terminal (cookie de sesión, refresh token) se rige por el art. 22.2 LSSI y su análisis está reservado a SR-09; su aplicabilidad depende además del ámbito de la LSSI (SR-03.1). Aquí solo se fija la base jurídica del tratamiento subyacente, no el régimen del dispositivo terminal.

**C. Perfil/CV profesional** — LEGAL_BASIS: art. 6.1.b). CLASSIFICATION: REQUIRED. CONSENT_REQUIRED: NO (CONDITIONAL si se habilitan campos que impliquen datos del art. 9). NOTES: **corrección aplicada sobre la fotografía.** El Cdo. 51 RGPD establece que el tratamiento de fotografías no debe considerarse sistemáticamente tratamiento de categorías especiales: las imágenes solo quedan comprendidas en la definición de datos biométricos cuando se traten con medios técnicos específicos que permitan la identificación o autenticación unívoca de una persona física (art. 4.14). Una fotografía de perfil ordinaria, mostrada y almacenada sin procesamiento biométrico, **no** es dato del art. 9. La calificación cambiaría si JobIT implantara reconocimiento facial, deduplicación biométrica o verificación de identidad por imagen. El riesgo real subsistente en el CV es distinto y no fotográfico: texto libre en el que el candidato aporte por iniciativa propia datos de salud, discapacidad o afiliación sindical. Medidas: advertencia expresa de no aportar datos sensibles y ausencia de campos que los induzcan; si en el futuro se habilita un campo específico (p. ej. discapacidad para ofertas de inclusión), se requerirá consentimiento explícito del art. 9.2.a) con acción separada.

**D. Skills, experiencia, educación, proyectos y enlaces** — LEGAL_BASIS: art. 6.1.b). REQUIRED. CONSENT_REQUIRED: NO. NOTES: los enlaces son datos aportados; el enriquecimiento automático del perfil rastreando esos enlaces sería finalidad distinta y exigiría análisis propio.

**E. Preferencias profesionales** — LEGAL_BASIS: art. 6.1.b). REQUIRED. CONSENT_REQUIRED: NO. NOTES: son criterios declarados, no inferidos; ello sostiene la base contractual.

**F. Búsqueda de ofertas** — LEGAL_BASIS: art. 6.1.b). REQUIRED. CONSENT_REQUIRED: NO. NOTES: conservar histórico de búsquedas para mejora del producto sería finalidad distinta bajo art. 6.1.f), con ponderación documentada (EDPB Guidelines 1/2024). No se afirma que exista tal histórico.

**G. Ofertas guardadas** — LEGAL_BASIS: art. 6.1.b). REQUIRED. CONSENT_REQUIRED: NO.

**H. Match explicable determinista** — LEGAL_BASIS: art. 6.1.b). CLASSIFICATION: REQUIRED (en cuanto a la base jurídica del tratamiento). CONSENT_REQUIRED: NO. OFFICIAL_SOURCE: RGPD arts. 6.1.b), 13.2.f), 22; STJUE C-634/21; Reglamento (UE) 2024/1689; Reglamento (UE) 2026/1744.

> **ART_22_PRELIMINARY_ASSESSMENT:**
>
> Sobre los hechos actualmente confirmados —resultado orientativo, no excluyente, no comunicado a empleadores, sin intervención en decisiones de contratación, sin acceso de recruiters a la base de datos y con RECRUIT y CANDIDATE DISCOVERY en HOLD—, no se aprecia, con carácter preliminar, una decisión basada únicamente en tratamiento automatizado que produzca efectos jurídicos o le afecte significativamente de modo similar en el sentido del art. 22.1 RGPD. El elemento determinante identificado como línea de cambio es el de la STJUE C-634/21: cuando un valor de probabilidad se transmite a un tercero y condiciona de manera determinante su decisión, ese cálculo puede constituir por sí mismo «decisión» a efectos del art. 22, aunque el emisor no adopte la decisión final. Esta evaluación es preliminar, no cierra el análisis y no debe utilizarse como base de diseño definitivo.
>
> **FINAL_CLASSIFICATION:** DEFERRED_TO_SR-08

> **AI_ACT_PRELIMINARY_NOTE (corrección aplicada):**
>
> Se retira la afirmación «con ML entraría». La clasificación no se sigue automáticamente del uso de aprendizaje automático y requiere un examen secuencial: (i) si el sistema cumple la definición de sistema de IA del art. 3.1 del Reglamento (UE) 2024/1689, conforme a las directrices de la Comisión Europea sobre dicha definición; (ii) cuál es su finalidad prevista en el sentido del art. 3.12; (iii) el filtro del art. 6, incluidas las excepciones de su apartado 3 —tarea procedimental limitada, mejora del resultado de una actividad humana previa, detección de patrones o desviaciones sin sustituir la valoración humana, tarea preparatoria— y la salvedad relativa a la elaboración de perfiles; y (iv) el encaje concreto en el punto 4 del Anexo III. Un sistema con componentes de ML puede quedar fuera del alto riesgo si supera el filtro del art. 6.3, y puede quedar dentro sin ML si se dan otros elementos. Calendario aplicable: el Reglamento (UE) 2026/1744, publicado en el DOUE el 24 de julio de 2026 y en vigor desde el 27 de julio de 2026, aplaza las obligaciones de alto riesgo del Anexo III al 2 de diciembre de 2027 y las del Anexo I al 2 de agosto de 2028, manteniendo el 2 de agosto de 2026 para la transparencia del art. 50.
>
> **FINAL_CLASSIFICATION:** DEFERRED_TO_SR-08

**I. Portfolio público voluntario (opt-in)** — LEGAL_BASIS: art. 6.1.a). CLASSIFICATION: CONDITIONAL (solo si se activa). OFFICIAL_SOURCE: RGPD arts. 6.1.a), 7.1, 7.3, 7.4, 13.2.a). CONSENT_REQUIRED: YES. SEPARATE_CONSENT_ACTION_REQUIRED: **YES**. NOTES: único tratamiento del paquete con acción de consentimiento diferenciada. No puede integrarse en la aceptación de Términos (art. 7.4). Requisitos: casilla no premarcada, desactivada por defecto, revocable con la misma facilidad (art. 7.3), evidencia conservada (art. 7.1) e información previa de consecuencias —indexación, cachés, acceso desde fuera del EEE, imposibilidad de garantizar borrado en sistemas de terceros—. Recomendación de proporcionalidad: `noindex` por defecto con activación separada.

**J. Soporte** — LEGAL_BASIS: art. 6.1.b) cuando versa sobre el servicio; art. 6.1.f) para calidad y trazabilidad. REQUIRED. CONSENT_REQUIRED: NO. NOTES: al ser canal único, evitar que las solicitudes de derechos queden mezcladas en un histórico de soporte sin plazo propio.

**K. Ejercicio de derechos** — LEGAL_BASIS: art. 6.1.c) en relación con arts. 12-22 RGPD y art. 12 LOPDGDD; art. 5.2 para la evidencia. REQUIRED. CONSENT_REQUIRED: NO. NOTES: no exigir copia de documento identificativo por defecto; el art. 12.6 solo habilita información adicional ante dudas razonables y fundadas, y la sesión autenticada opera como medio de identificación.

**L. Seguridad / rate limiting** — **Corrección aplicada: hecho sustituido por el estado técnico canónico.**

- PURPOSE: prevención de abuso, fuerza bruta y uso automatizado no autorizado.
- FACTS (canónicos): `req.ip` se procesa de forma efímera y en memoria; no se persiste; no se registra en logs; no existe actualmente dataset persistente de direcciones IP ni, por tanto, plazo de conservación asociado.
- LEGAL_BASIS: art. 6.1.f) RGPD, con apoyo interpretativo en el Cdo. 49, y art. 6.1.c) en relación con el art. 32.
- CLASSIFICATION: REQUIRED.
- CONSENT_REQUIRED: NO. SEPARATE_CONSENT_ACTION_REQUIRED: NO.
- NOTES: el carácter efímero y no persistente **no excluye** que exista tratamiento —el art. 4.2 comprende la consulta y la utilización, con o sin almacenamiento—, de modo que subsisten la base jurídica, el deber de información y la inscripción en el RAT. Lo que decae, precisamente por la ausencia de persistencia, es la necesidad de declarar un plazo de conservación: el RAT y la Política de Privacidad deben reflejar de forma expresa «tratamiento en memoria, sin persistencia ni registro», que es en sí misma una medida de minimización (arts. 5.1.c) y 25) y debe documentarse como tal. Transparencia mínima exigible: mención del tratamiento de la dirección IP con finalidad de seguridad y control de tasa, sin afirmar retención. **Si una implementación futura persistiera o registrara la IP —logs, WAF, antifraude, analítica de seguridad—, ello constituiría un tratamiento nuevo y requeriría análisis específico: ponderación documentada de interés legítimo, plazo de conservación, actualización del RAT y de la información al interesado.** Este informe no anticipa ese análisis.

**M. Backups y continuidad operativa** — LEGAL_BASIS: art. 6.1.c) en relación con el art. 32.1.b) y c); subsidiariamente art. 6.1.f). REQUIRED. CONSENT_REQUIRED: NO. NOTES: el backup no puede restituir datos suprimidos; procedimiento admitido: bloqueo del registro, exclusión de restauración selectiva y eliminación efectiva al completarse el ciclo de rotación, documentado y con plazo máximo declarado.

**CLASSIFICATION:** REQUIRED, con CONDITIONAL en C (art. 9 solo si se habilitan campos) e I (activación del portfolio); DEFERRED en H (art. 22 y AI Act).

**OFFICIAL_LEGAL_BASIS:** RGPD Cdo. 49, Cdo. 51 y arts. 4.2, 4.14, 5, 6.1.a)/b)/c)/f), 7, 9, 12-22, 25, 32; LOPDGDD arts. 6, 11, 12; Ley 34/2002 arts. 21 y 22.2 (este último sujeto a SR-03.1 y SR-09); STJUE C-634/21; Reglamento (UE) 2024/1689 y Reglamento (UE) 2026/1744; EDPB Guidelines 2/2019, 5/2020 y 1/2024.

**FACTS_USED:** registro mínimo email+contraseña; resto del perfil voluntario; match determinista, orientativo, no comunicado a empleadores; portfolio opt-in; sin acceso de recruiters; sin IA/ML en el alcance actual; `req.ip` efímera, en memoria, no persistida, no registrada.

**RESPONSIBLE_DECISIONS_USED:** RECRUITER DATABASE ACCESS = NO; RECRUIT y CANDIDATE DISCOVERY en HOLD; portfolio opt-in; aceptación expresa de Términos.

**SPECIALIST_REASONING_SUMMARY:** Las decisiones empresariales confirmadas son lo que sostiene el art. 6.1.b) como base dominante. Si RECRUIT o CANDIDATE DISCOVERY salieran de HOLD, aparecerían comunicaciones de datos a terceros y decaerían las conclusiones sobre H e I. En materia de IP, la conclusión se ha reconstruido sobre el estado técnico real: existe tratamiento, existe base, no existe retención que declarar.

**REQUIRED_BEFORE_TRAMO_B:**

1. Confirmar que ningún campo del perfil induce o admite datos del art. 9, y aprobar el texto de advertencia.
2. Confirmar si se conserva histórico de búsquedas.
3. Confirmar si se enviarán alertas de ofertas y por qué medio (delimita art. 21 LSSI).
4. Confirmar plazos de conservación por tratamiento.
5. Confirmar encargados y ubicación (paquete posterior).

**NON_BLOCKING_RECOMMENDATIONS:** Construir el RAT (art. 30) sobre esta misma matriz A-M; documentar la ausencia de persistencia de IP como medida de minimización; conservar documentación técnica versionada del carácter determinista del match como insumo probatorio para SR-08.

**PRIVATE_INFORMATION_REQUIRED:** NO

**BLOCKS_LEGAL_GATE:** CONDITIONAL (plazos de conservación y encargados)

**CONFIDENCE_OR_OPEN_INTERPRETATION:** Alta en A, C, D-G, I-M. Diferida en H.

---

# REFERENCE: SR-03 — TÉRMINOS, AVISO LEGAL Y LSSI (v2.0)

**CONCLUSION:**

**1. Ámbito LSSI.** El art. 2.1 declara aplicable la Ley a los prestadores de servicios de la sociedad de la información establecidos en España, entendiéndose establecido el prestador cuando su residencia o domicilio social se halle en territorio español y coincida con el lugar de centralización efectiva de la gestión y dirección de sus negocios. El Anexo a) y la exposición de motivos condicionan la calificación a que el servicio represente una actividad económica para el prestador. Con el modelo previsto, JobIT entra previsiblemente en el ámbito de la LSSI; la gratuidad para el candidato no lo excluye. **CLASSIFICATION: CONDITIONAL**, pendiente de confirmar el carácter económico.

**Corrección aplicada (punto 7):** se retira la afirmación de que el art. 22.2 LSSI aplica «en todo caso». El art. 22.2 se dirige a los «prestadores de servicios» en el sentido de la propia Ley, de modo que su aplicabilidad depende del ámbito determinado conforme a los arts. 1 y 2. Si JobIT no fuera SSI, no sería el art. 22.2 el precepto aplicable. La conclusión específica sobre cookie de sesión y refresh token queda **reservada a SR-09**.

Sobre la adaptación española al DSA: el DSA es directamente aplicable; lo pendiente en España es el régimen sancionador y de supervisión interno, tras dejarse sin efecto las modificaciones de la LSSI introducidas por el RDL 9/2024 en virtud de la Resolución de 22 de enero de 2025 (BOE-A-2025-1136). Ello no altera el art. 10 LSSI.

**2 y 3. Información permanente y superficies.** La del art. 10.1 (ver SR-01), accesible de forma permanente, fácil, directa y gratuita, sin registro ni autenticación: Aviso Legal enlazado desde el pie de todas las páginas, con URL estable, replicado en la aplicación si existe y enlazado desde el formulario de registro. Adicionalmente, el art. 27.1 obliga, antes de iniciar el procedimiento de contratación, a informar sobre los trámites a seguir, si el prestador archivará el documento electrónico y si será accesible, los medios técnicos para identificar y corregir errores, y la lengua o lenguas de formalización. El art. 27.4 obliga a poner a disposición las condiciones generales **de manera que puedan ser almacenadas y reproducidas por el destinatario** —precepto decisivo para el punto 6.

**4. Requisitos de la aceptación.** Casilla no premarcada y separada del acto de pulsar «Crear cuenta»; acceso al texto íntegro antes de aceptar mediante enlace que abra el documento completo; concreción, claridad, sencillez y accesibilidad (art. 80.1 TRLGDCU) y posibilidad real de conocimiento previo (arts. 5 y 7 LCGC, con la consecuencia de no incorporación); identificación de versión en pantalla; y cumplimiento de los arts. 59.4, 60, 97 y 98 TRLGDCU, aplicables a los contratos a distancia con consumidores, incluidos aquellos en que el consumidor facilita datos personales sin pago.

**5. Evidencia de aceptación.** Identificador de usuario; identificador y hash de la versión exacta mostrada; artefacto documental archivado e inmutable de esa versión; sello de fecha y hora con zona horaria; método de aceptación; resultado; idioma/locale; y registro separado de la información de privacidad presentada. La carga de acreditar la incorporación de las condiciones generales recae sobre el predisponente. Conservación recomendada: vigencia de la relación más el plazo de prescripción de acciones personales del art. 1964 CC.

**6. Confirmación contractual sin proveedor de email transaccional — CORRECCIÓN APLICADA.**

Se retira la afirmación de la v1.0 de que el correo electrónico sea la única vía válida. Son dos obligaciones distintas:

**(a) LSSI art. 28.1.** El precepto ofrece dos medios alternativos: el envío de acuse de recibo por correo electrónico u otro medio de comunicación electrónica equivalente en las veinticuatro horas siguientes, **o** la confirmación, por un medio equivalente al utilizado en el procedimiento de contratación, de la aceptación recibida, tan pronto como el aceptante haya completado dicho procedimiento, siempre que la confirmación pueda ser archivada por su destinatario. La letra b) es una alternativa autónoma y plenamente suficiente. **Conclusión: la decisión `TRANSACTIONAL_EMAIL_PROVIDER: NOT_PLANNED_FOR_INITIAL_PRODUCTION` es compatible con el art. 28 LSSI** mediante una pantalla de confirmación posterior al alta, en el mismo canal web, que sea archivable por el destinatario.

**(b) TRLGDCU art. 98.7.** Obliga a facilitar al consumidor la confirmación del contrato celebrado **en soporte duradero**, en plazo razonable tras la celebración y, a más tardar, antes del inicio de la ejecución del servicio. Aquí el estándar es más exigente: la jurisprudencia del TJUE (C-49/11, Content Services) descarta que la mera puesta a disposición en un sitio web constituya soporte duradero, y (C-375/15, BAWAG) admite que un buzón o repositorio electrónico lo sea únicamente si garantiza la inalterabilidad del contenido, su accesibilidad durante un período adecuado y su reproducción idéntica, y si el consumidor recibe un elemento activo que le permita tomar conocimiento, no una simple disponibilidad pasiva.

**RESPUESTA A LA OPCIÓN A — alternativa jurídicamente suficiente, con condiciones acumulativas:**

1. Pantalla de confirmación obligatoria inmediatamente posterior al alta, que constituya la confirmación del art. 28.1.b) LSSI.
2. Generación automática, en ese momento, de un documento (PDF) que contenga: confirmación del contrato, versión y hash de los Términos aceptados, fecha y hora, identificación del usuario y del prestador, y la información del art. 97.1 TRLGDCU.
3. **Descarga activada automáticamente** y botón de descarga persistente, de modo que el documento quede en poder del consumidor y fuera del control del prestador — este es el elemento que sostiene el requisito de soporte duradero conforme a C-49/11 y C-375/15.
4. Copia inmutable y versionada disponible en el área de cuenta, como refuerzo, nunca como sustituto de (3).
5. Cumplimiento previo del art. 27.4 LSSI: condiciones generales almacenables y reproducibles antes de iniciar la contratación.
6. Registro de evidencia de que se generó y ofreció el documento.

**Conclusión: A es viable con esas condiciones. CLASSIFICATION: CONDITIONAL.** Riesgo residual identificado y no ocultado: si el usuario no ejecuta la descarga, el elemento «entregado en soporte duradero» descansa únicamente en el repositorio de cuenta, cuya persistencia depende del prestador; ese escenario es defendible pero no está exento de discusión. El incumplimiento del art. 98.7 no invalida el contrato, pero tiene consecuencias en el régimen de desistimiento y constituye, en su caso, infracción leve del art. 38.4.f) LSSI en cuanto a la confirmación.

**RESERVA PARCIAL EN LÍNEA CON LA OPCIÓN B:** la decisión `NOT_PLANNED_FOR_INITIAL_PRODUCTION` resuelve el alta, pero **no resuelve otras obligaciones de ciclo de vida que no pueden satisfacerse íntegramente dentro de la aplicación**: (i) notificación con preaviso de modificaciones de Términos, exigida para evitar la abusividad del art. 85 TRLGDCU; (ii) comunicación de violaciones de seguridad al interesado (art. 34 RGPD) cuando el usuario no accede a la aplicación; (iii) recuperación de credenciales. Se concluye expresamente que **para estos tres supuestos la decisión debe revisarse o sustituirse por un mecanismo equivalente acreditable**, y que su resolución es requisito previo al Tramo B. No se transforma esa reserva en una obligación de contratar email transaccional: se identifica el requisito, no el proveedor.

**7. Distinción de las tres capas.** Aceptación contractual (acto negocial, art. 6.1.b), información de privacidad (acto informativo, arts. 12-14, que no se acepta ni se consiente) y consentimientos específicos (portfolio, y en su caso art. 22.2 LSSI y art. 21 LSSI), separados en interfaz, documento y registro. Es admisible una casilla de «he sido informado de la Política de Privacidad» como evidencia de información, siempre que no se etiquete como «acepto» ni se presente como consentimiento.

**8. Requisitos previos a la redacción:** ver REQUIRED_BEFORE_TRAMO_B.

**CLASSIFICATION:** REQUIRED (aceptación y evidencia) / CONDITIONAL (ámbito LSSI; suficiencia del soporte duradero sin email)

**OFFICIAL_LEGAL_BASIS:** Ley 34/2002, arts. 1, 2, 6, 10, 21, 22.2, 27.1 y 27.4, 28.1, 38.3.b) y 38.4.b) y f); TRLGDCU arts. 59.4, 60, 80, 85, 90, 97, 98.7; LCGC arts. 5 y 7; RGPD arts. 6.1.b), 7, 12, 13, 13.3, 34; CC art. 1964; STJUE C-49/11 y C-375/15; Reglamento (UE) 2024/3228 (deroga el Reglamento (UE) 524/2013 con efecto desde el 20 de julio de 2025 y suprime la plataforma europea de resolución de litigios en línea, por lo que no debe citarse en los Términos); Resolución BOE-A-2025-1136.

**FACTS_USED:** aceptación expresa deseada; documentos diferenciados; aprobación humana previa a publicación; usuarios consumidores; `TRANSACTIONAL_EMAIL_PROVIDER: NOT_PLANNED_FOR_INITIAL_PRODUCTION`.

**RESPONSIBLE_DECISIONS_USED:** aceptación expresa en el alta; separación documental; ningún texto legal se publica sin aprobación humana; no previsión de email transaccional en primera producción.

**SPECIALIST_REASONING_SUMMARY:** El riesgo dominante no es la ausencia de textos, sino la fusión de capas y la confusión entre dos obligaciones de confirmación con estándares distintos. La LSSI admite expresamente la confirmación en el propio canal; el TRLGDCU exige además soporte duradero, y es ahí —no en el art. 28— donde la ausencia de email transaccional obliga a un diseño técnico deliberado.

**REQUIRED_BEFORE_TRAMO_B:**

1. Valores identificativos de SR-01.
2. Confirmación del modelo de ingresos.
3. Matriz A-M cerrada con plazos de conservación.
4. Encargados y subencargados con ubicación y decisión sobre transferencias.
5. Inventario de cookies y tecnologías equivalentes (entrada de SR-09).
6. Decisión motivada sobre DPD (arts. 37 RGPD / 34 LOPDGDD).
7. Decisión motivada sobre EIPD (art. 35 RGPD y listas AEPD).
8. Diseño del esquema de versionado, evidencia y generación del documento de confirmación.
9. Solución acreditable para notificación de cambios de Términos, art. 34 RGPD y recuperación de credenciales.
10. Ley aplicable y fuero, con respeto al art. 90 TRLGDCU y al foro del consumidor.

**NON_BLOCKING_RECOMMENDATIONS:** No incluir referencia a la plataforma ODR europea; sustituirla por información sobre reclamación ante las autoridades de consumo competentes y ante la AEPD. Publicar los tres documentos con fecha de entrada en vigor visible e histórico de versiones.

**PRIVATE_INFORMATION_REQUIRED:** YES

**IF_YES:** las categorías de SR-01, más la categoría «modelo de ingresos previsto».

**BLOCKS_LEGAL_GATE:** YES

**CONFIDENCE_OR_OPEN_INTERPRETATION:** Alta sobre el art. 28.1.b) LSSI como alternativa válida. Media sobre la suficiencia del repositorio de cuenta como soporte duradero si la descarga no se materializa. Abierta: ámbito LSSI y aplicación práctica del desistimiento en servicio digital gratuito prestado a cambio de datos.

---

# REFERENCE: SR-04 — EDAD Y MENORES (v2.0)

**CONCLUSION:**

**1. Limitación contractual a 18+: lícita — razonamiento reformulado.** Se retira la inferencia de la v1.0 según la cual el menor carecería simplemente de capacidad contractual. El Código Civil, en su redacción vigente tras la Ley 8/2021, establece en el **art. 240** que la mayor edad empieza a los dieciocho años cumplidos, y en el **art. 1263** que los menores de edad no emancipados **podrán celebrar** aquellos contratos que las leyes les permitan realizar por sí mismos o con asistencia de sus representantes y los relativos a bienes y servicios de la vida corriente propios de su edad de conformidad con los usos sociales. La capacidad contractual del menor es, por tanto, **graduada y contextual**, no inexistente.

De ello se sigue el fundamento correcto del límite 18+: no es que el menor no pueda contratar, sino que (i) el art. 1255 CC ampara la libertad del prestador para delimitar el círculo de destinatarios de su servicio; (ii) determinar caso por caso si un contrato de plataforma de empleo es «de la vida corriente propio de su edad conforme a los usos sociales» introduce una incertidumbre que el responsable puede legítimamente evitar ex ante; y (iii) el límite reduce simultáneamente la exposición a los regímenes reforzados de protección de menores. Los umbrales del art. 8 RGPD y del art. 7 LOPDGDD no operan como derecho de acceso del menor: regulan la edad para consentir válidamente cuando el consentimiento es la base jurídica, lo que no ocurre en el núcleo de JobIT. **El límite 18+ es decisión empresarial legítima, no obligación legal, y así debe presentarse.**

**2 y 3. Suficiencia de la autodeclaración — justificación reformulada como juicio de necesidad y proporcionalidad.**

**Corrección aplicada sobre el DSA.** Se retira la lectura de la v1.0. El art. 28.3 DSA no prohíbe la verificación de edad: establece que el cumplimiento de las obligaciones del art. 28 no obliga a los prestadores de plataformas en línea a tratar datos personales adicionales para evaluar si el destinatario es menor. Es una cláusula de no imposición, no una prohibición. El art. 35.1 DSA, por su parte, contempla la verificación de edad entre las posibles medidas de mitigación de riesgos para determinadas plataformas.

La suficiencia de la autodeclaración se sostiene, por tanto, no en una prohibición inexistente, sino en un juicio especializado de necesidad y proporcionalidad conforme a los arts. 5.1.c), 24 y 25 RGPD, articulado sobre cinco elementos:

- **Características actuales del producto:** no hay contenidos para adultos, juego, apuestas, sustancias, comercio, pagos ni mensajería abierta entre usuarios; el servicio consiste en construir un CV y recibir ofertas ordenadas.
- **Riesgos:** no se tratan categorías especiales por defecto; no hay decisiones automatizadas con efectos jurídicos; el vector de riesgo identificado es la exposición pública de un menor a través del portfolio.
- **Minimización:** cualquier medida de verificación implicaría tratar datos adicionales sobre el 100 % de los usuarios adultos para mitigar un riesgo concentrado en una función opcional; la desproporción es evidente.
- **Criterios AEPD/EDPB:** el Decálogo de la AEPD orienta los sistemas de verificación a acreditar la condición de persona autorizada a acceder, sin revelar la condición de menor, y a mantener la identidad separada de la verificación de edad; el EDPB, en su Statement 1/2025 on age assurance adoptada en febrero de 2025, fija diez principios para el tratamiento conforme de datos al determinar la edad, entre ellos la evaluación de la proporcionalidad basada en riesgos, la limitación de la finalidad y la minimización. Ambos marcos conducen al mismo resultado en un servicio con este perfil de riesgo.
- **Carácter opt-in del portfolio:** al estar desactivado por defecto, el vector de exposición no se activa por el mero registro, sino por una acción adicional del usuario, lo que permite concentrar las salvaguardas en esa función en lugar de en toda la base de usuarios.

**Conclusión: la autodeclaración de mayoría de edad es necesaria y proporcionada en el modelo actual; no existe obligación de verificación adicional. CLASSIFICATION: NOT_REQUIRED.** Esta conclusión es sensible al diseño: debería reexaminarse si el portfolio pasara a estar activo por defecto, si se introdujera mensajería entre usuarios, si se activaran RECRUIT o CANDIDATE DISCOVERY, o si JobIT alcanzara una difusión pública que lo aproximara a la condición de plataforma en línea a efectos del DSA.

**4 y 5. No recoger fecha de nacimiento ni documento identificativo: NOT_REQUIRED, expresamente.** Recogerlos para el mero control de edad sería tratamiento innecesario, contrario a los arts. 5.1.c) y 25 RGPD, y ampliaría la superficie de riesgo —la fecha de nacimiento es dato de alto valor para suplantación— sin beneficio proporcional. **Esta decisión debe documentarse en el RAT y en el análisis de riesgos como medida activa de minimización, no como omisión.**

**6. Actuación operativa ante detección de una cuenta de menor de 18 años.** Procedimiento documentado, con responsable y plazos: definición de indicio fundado (manifestación del usuario, comunicación de progenitor o tutor, contenido del perfil), sin rastreo proactivo; suspensión cautelar inmediata del acceso y despublicación inmediata del portfolio; comprobación proporcionada y mínima, sin exigir copia de documento de forma sistemática, admitiendo la manifestación del titular de la patria potestad y, si excepcionalmente se requiere documento, verificación efímera sin conservación de copia; supresión de la cuenta y los datos (art. 17.1.d) y f) RGPD), conservando solo lo imprescindible para acreditar el cumplimiento y, en su caso, un identificador irreversible para impedir el re-registro, con base en el art. 6.1.f), plazo definido y declaración en el RAT; registro interno del incidente; valoración de notificación de brecha conforme al art. 33 —improcedente por regla general, salvo que datos de un menor hayan estado públicamente accesibles vía portfolio—; comunicación al usuario y, en su caso, al progenitor; plazo objetivo interno de suspensión inmediata y resolución en un máximo de 30 días.

**7. Requisitos de wording del registro.** Dos acciones afirmativas separadas, ninguna premarcada: (i) declaración expresa de mayoría de edad; (ii) aceptación de Términos con enlace e información de la Política de Privacidad con enlace. La separación no viene impuesta por norma, pero preserva el valor probatorio autónomo de la declaración de edad. Redacción en primera persona, afirmativa, sin dobles negaciones. Aviso visible de que el servicio se dirige exclusivamente a mayores de 18 años, replicado en los Términos con cláusula de edad y consecuencias de su incumplimiento. La declaración de edad no debe ubicarse en la Política de Privacidad. Evidencia registrada con el mismo estándar que los Términos.

**CLASSIFICATION:** NOT_REQUIRED (verificación adicional, fecha de nacimiento, documento identificativo) / REQUIRED (procedimiento de actuación y evidencia de la declaración)

**OFFICIAL_LEGAL_BASIS:** RGPD arts. 5.1.c), 6.1.b), 8, 17.1, 24, 25, 33; LOPDGDD art. 7; Código Civil arts. 240, 1255 y 1263 (redacción vigente tras la Ley 8/2021); Reglamento (UE) 2022/2065, arts. 28.3 y 35.1; AEPD, Decálogo de principios sobre verificación de edad; EDPB, Statement 1/2025 on Age Assurance.

**FACTS_USED:** TARGET_USERS 18+; territorio España; autodeclaración deseada; sin documento identificativo; sin fecha de nacimiento; portfolio opt-in desactivado por defecto; ausencia de contenidos restringidos, pagos y mensajería abierta.

**RESPONSIBLE_DECISIONS_USED:** límite empresarial 18+; modelo de edad de baja fricción; no recogida de documento ni fecha de nacimiento.

**SPECIALIST_REASONING_SUMMARY:** La conclusión no descansa en una prohibición de verificar, sino en que verificar no es necesario ni proporcionado para este perfil de riesgo. El razonamiento sobre capacidad se ha reconstruido: el límite 18+ es una elección empresarial que evita la incertidumbre del art. 1263 CC, no la consecuencia de una incapacidad absoluta del menor.

**REQUIRED_BEFORE_TRAMO_B:**

1. Documentar formalmente la decisión de no recoger fecha de nacimiento ni documento, con su justificación de minimización.
2. Aprobar el procedimiento de detección, suspensión, comprobación y supresión, con plazos y responsable.
3. Confirmar que el portfolio público permanece desactivado por defecto.
4. Definir el esquema de evidencia de la declaración de edad.

**NON_BLOCKING_RECOMMENDATIONS:** Monitorizar la tramitación del Proyecto de Ley Orgánica para la protección de las personas menores de edad en los entornos digitales, cuya tramitación fue admitida por el Pleno del Congreso, y en particular la elevación proyectada del umbral de consentimiento a 16 años, sin anticipar su aplicación como derecho vigente. Evitar diseños que induzcan al usuario a declarar una edad falsa por fricción o presentación engañosa.

**PRIVATE_INFORMATION_REQUIRED:** NO

**BLOCKS_LEGAL_GATE:** NO (salvo aprobación previa del procedimiento de actuación antes de tratar datos reales)

**CONFIDENCE_OR_OPEN_INTERPRETATION:** Alta sobre la licitud del límite 18+ y sobre la inexistencia de obligación de verificación adicional. Media-alta sobre la suficiencia de la autodeclaración, por su dependencia del diseño de producto. Abierta: calificación de JobIT como plataforma en línea a efectos del DSA si el portfolio adquiriera difusión pública relevante.

---

## SÍNTESIS DE PUERTAS DE BLOQUEO

| Referencia | Bloquea | Motivo |
|---|---|---|
| SR-01 | **SÍ** | Faltan valores identificativos formales y dirección publicable |
| SR-02 | **CONDICIONAL** | Faltan plazos de conservación y encargados; H diferido a SR-08 |
| SR-03 | **SÍ** | Depende de SR-01, del ámbito LSSI y de la solución de notificación de ciclo de vida |
| SR-04 | **NO** | Pendiente solo de aprobar el procedimiento de actuación ante detección |

---

## ESTADO FINAL

```
SPECIALIST_REVIEW_COMPLETED: NO
LEGAL_DECISIONS_APPROVED:    NO
TRAMO_B:                     NOT_AUTHORIZED
PRODUCTION:                  NOT_AUTHORIZED
REAL_CANDIDATE_DATA:         NOT_AUTHORIZED
DEFERRED_TO_SR-08:           art. 22 RGPD (match) · clasificación AI Act (match)
DEFERRED_TO_SR-09:           art. 22.2 LSSI (cookie / refresh token)
```

---

*Fin del documento. JOBIT — S22-PRIV-01 · SR-01 a SR-04 · v2.0 · 18 de agosto de 2026.*
