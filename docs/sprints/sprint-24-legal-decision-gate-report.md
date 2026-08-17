# LEGAL_DECISION_GATE — Sprint 24

> **Estado**
>
> Documento interno de gobierno técnico y preparación legal.
>
> No constituye aviso legal público, asesoramiento jurídico ni acreditación de cumplimiento.
>
> Las decisiones sensibles y las evidencias completas se mantienen fuera del repositorio.
>
> No autorizado para producción hasta completar la revisión especializada.

> **Nota de custodia.** El registro de decisiones del responsable y el runbook operativo de
> derechos y soporte **se conservan fuera de este repositorio**. Las referencias del tipo `D-NN`
> identifican decisiones de ese registro segregado y no son resolubles desde el repositorio
> público.

**Sprint:** Sprint 24 · Candidate Legal Governance (`PRIV-01` / `PRIV-02`)
**Tramo:** A — análisis y documentación · **revisión tras `PASS_WITH_NOTES`**
**Nivel de riesgo:** Nivel 3 — privacidad y gobierno de datos personales
**Rama:** `feat/sprint-24-candidate-legal-governance`
**Baseline:** `98492754d5dd00ebd081e7d5b82b36600b6c9372`
**Fecha:** 28 de julio de 2026

---

## 1. Estado del repositorio

Ruta canónica del proyecto (documentada en `docs/agents/operating-environment.md`), repositorio
`git@github.com:David-LS-Bilbao/JobIT-platform.git`, rama
`feat/sprint-24-candidate-legal-governance` sobre el baseline indicado. Staging vacío, sin
repositorios anidados y sin cambios ajenos a los seis documentos autorizados.

## 2. Trabajo documental realizado

Construcción del paquete documental que permite decidir y revisar antes de publicar cualquier
superficie legal, y posterior **corrección** conforme a las observaciones de la revisión
sustantiva del gate.

## 3. Entregables del sprint y custodia

Cuatro se versionan en el repositorio público; dos se conservan fuera de Git por contener
gobernanza interna y detalle operativo.

| Documento | Contenido |
|---|---|
| `docs/specs/features/candidate-legal-governance.md` | Spec SDD: taxonomía, actores, superficies, flujos, reglas, validaciones, criterios, gate |
| `docs/legal/data-inventory.md` | Inventario de datos y tratamientos, matriz, cookies y almacenamiento, retención, cuestiones de aplicabilidad pendientes |
| Registro de decisiones del responsable | 42 decisiones con hojas de aprobación, encargados y registro de aprobación. **Conservado fuera del repositorio** |
| Runbook operativo de derechos y soporte | Derechos, soporte, canal externo, reclamaciones, incidentes, responsabilidades y escalado. **Conservado fuera del repositorio** |
| `docs/legal/public-surfaces-policy.md` | Portfolio público, match, datos ilustrativos, superficies previstas |
| `docs/sprints/sprint-24-legal-decision-gate-report.md` | Este informe |

## 4. Correcciones aplicadas tras la revisión

| # | Observación | Corrección |
|---|---|---|
| 1 | Recuento de decisiones incorrecto | Recontado fila por fila: **34 / 7 / 1 = 42**, con verificación aritmética explícita y nota de discrepancia (§11) |
| 2 | D-03 presentaba el identificador fiscal como requisito automático de privacidad | Reformulado en cuatro cuestiones: disponer, publicar, superficie y exigibilidad. Bloqueante para términos y aviso legal, **no** requisito automático de privacidad |
| 3 | D-07 planteado como preferencia libre | Reformulado a cuatro opciones y a la pregunta correcta sobre obligatoriedad o conveniencia. `[REVISIÓN ESPECIALIZADA]`; pasa a **bloqueante** |
| 4 | D-09 no separaba edad, menores, consentimiento y verificación | Descompuesto en D-09.1 a D-09.4, con los hechos técnicos que lo condicionan |
| 5 | D-20 trataba acceso, copia, exportación y portabilidad como equivalentes | Separados en cuatro conceptos, con aplicabilidad de la portabilidad como revisión especializada |
| 6 | D-31 pedía aprobar una conclusión jurídica | Reformulado: solo aprueba copy factual; calificación jurídica y art. 22 quedan pendientes de revisión |
| 7 | D-36 afirmaba ausencia absoluta de tecnologías no esenciales | Sustituido por la redacción de evidencia limitada, con ocho elementos pendientes de verificación |
| 8 | El canal externo podía leerse como integración automatizada | Bloque 8 nuevo con 13 decisiones operativas; declaración explícita de que JobIT no gestiona automáticamente estas solicitudes |
| 9 | Decisiones del responsable y revisión especializada mezcladas | Separadas en dos evidencias dentro del **único** gate |
| 10 | Casillas de aprobación insuficientes | Hoja de aprobación de 8 campos en las 42 decisiones, con estado `PENDIENTE — NO PUBLICAR` |

## 4.bis Decisión de segregación (`REGISTRO_SEGREGADO_APPROVED`)

```text
El repositorio es público.

Los identificadores fiscales, direcciones formales, canales privados, contratos y evidencias
confidenciales se mantienen fuera de Git.

VERSIONED_REPOSITORY conserva únicamente:
- estado agregado del gate;
- el recuento canónico 34 / 7 / 1;
- la taxonomía de etiquetado;
- referencias abstractas D-NN, sin estado ni valor;
- información técnica y de gobernanza sanitizada.

PRIVATE_SEGREGATED_REGISTER conserva:
- el estado individual de cada decisión D-NN;
- los valores de las decisiones;
- las evidencias y aprobaciones privadas;
- los datos identificativos y sensibles;
- el detalle operativo privado.

PER_DECISION_STATE_IN_PUBLIC_REPOSITORY:
NO
```

**Reconciliación de custodia** (`ORCHESTRATOR_DECISION_O02: B`, 17 de agosto de 2026). La
enumeración anterior de esta sección afirmaba que el repositorio conservaba el estado, la
categoría, el responsable lógico y la fecha o versión **de cada decisión**. Esa representación
queda sustituida por la separación de arriba: el repositorio versionado conserva estado
**agregado**, y el estado individual permanece en el registro privado segregado. No se ha creado
ningún inventario público de decisiones y no se ha modificado ningún valor privado.

El expediente privado se referencia como `EVIDENCIA_SEGREGADA_FUERA_DEL_REPOSITORIO`, bajo custodia del
responsable, con acceso restringido y **sin ubicación registrada en el repositorio**.

### Estado de seguridad verificado

| Comprobación | Resultado |
|---|---|
| Identificador fiscal en el árbol | **Ninguno** |
| Identificador fiscal en el historial | **Ninguno** |
| Dirección postal privada | **Ninguna** |
| Correo personal duplicado innecesariamente | **Ninguno** |
| Documento privado en el repositorio | **Ninguno** |
| Ruta o ubicación del expediente | **Ninguna** |
| Credenciales | **Ninguna** |
| Valor sensible en nombres de archivo | **Ninguno** |

Las búsquedas se realizaron por **patrón genérico**, sin reproducir los valores buscados.

## 4.ter Paquete para revisión especializada

`SPECIALIST_REVIEW_PACKAGE — READY`. Preparado dentro del registro de decisiones del
responsable, en versión sanitizada y marcado como documento interno no publicable. **Ese
registro se conserva fuera de este repositorio**, por lo que el paquete no es accesible desde
aquí. No se ha creado ningún archivo nuevo.

**Referencias incluidas:** SR-01 responsable e información identificativa · SR-02 finalidades y
bases jurídicas · SR-03 términos, aviso legal y LSSI · SR-04 edad y menores · SR-05 DPO ·
SR-06 artículo 30 · SR-07 EIPD · SR-08 match y artículo 22 · SR-09 cookies y almacenamiento ·
SR-10 encargados y proveedores · SR-11 conservación · SR-12 derechos · SR-13 portfolio público ·
SR-14 avatar · SR-15 incidentes y reclamaciones.

**Decisiones empresariales disponibles para el revisor:** responsable como persona física
(valor segregado), nombre comercial, territorio, público previsto, canal de privacidad
aprobado (segregado), responsable operativo designado (segregado), hosting previsto, carácter
voluntario del portfolio, exclusión del salario del DTO público, match orientativo y derechos
sin autoservicio mediante procedimiento manual.

**Información segregada:** identificador fiscal, dirección formal, buzón concreto, identidad
completa del responsable y del responsable operativo, contratos y evidencias. Todo bajo
`EVIDENCIA_SEGREGADA_FUERA_DEL_REPOSITORIO`, sin ubicación registrada.

**Documentación compartible:** inventario sanitizado, spec, descripción técnica, decisiones
sanitizadas, procedimiento de derechos, política de portfolio y match, capturas sin datos
reales. Los contratos, solo por canal privado.

**Resultado esperado:** conclusiones por referencia con el formato estructurado solicitado, que
permitan completar `SPECIALIST_REVIEW_COMPLETED`. **`LEGAL_DECISIONS_APPROVED` no se emite
automáticamente**: corresponde al Chat Director.

## 5. Desviación metodológica del Plan Mode

La verificación de cookies y almacenamiento se realizó **en runtime local**, con una **cuenta
sintética** (`priv+<timestamp>@jobit.local`) sobre la base de datos de desarrollo `jobit_dev`,
navegando superficies públicas y privadas con un navegador automatizado.

- No se utilizaron datos personales reales.
- No se abrieron `.env` ni se inspeccionaron uploads.
- No se imprimieron tokens, credenciales ni cookies de terceros.
- La observación corresponde al **entorno de desarrollo**, no a producción.

## 6. Hechos técnicos confirmados

- El registro recoge **email y contraseña**; el resto del perfil es opcional.
- **No se recogen ni persisten IP ni user-agent.** No hay tabla de logs ni de telemetría.
- **Una sola cookie**: `refresh_token`, técnica de autenticación, `httpOnly`, `SameSite=Lax`,
  persistente **7 días**.
- `localStorage` vacío; `sessionStorage` solo con un artefacto de desarrollo de Next.js.
- **No existe integración de correo** en el producto.
- **No existe campo de edad ni fecha de nacimiento**, ni validación técnica de edad.
- El portfolio es **opt-in real**, pero ubicación y disponibilidad **se publican por defecto**.
- El match es determinista, sin IA, sin red y **no persiste resultados**.
- **No existen** borrado de cuenta, exportación, portabilidad, limitación ni oposición
  automatizadas.
- **No existe borrado físico del avatar.**

## 7. Requisitos confirmados

| # | Requisito | Fuente |
|---|---|---|
| R1 | Información en capas; contenido de la primera capa | [AEPD — Derecho de información](https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion) |
| R2 | Contenido de la información ampliada, incluida la del delegado de protección | ídem |
| R3 | Información en el momento de la recogida | ídem |
| R4 | Derechos ejercitables | [AEPD — Ejerce tus derechos](https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos) |
| R5 | Plazo de un mes prorrogable, gratuidad, denegación motivada con vía de reclamación | ídem |
| R6 | Excepción del art. 22.2 LSSI para cookies técnicas de autenticación **de sesión** | [AEPD — Guía de cookies (mayo 2024)](https://www.aepd.es/guias/guia-cookies.pdf) |

## 8. Recomendaciones

Separar información de privacidad y aceptación de términos; no añadir casilla genérica de
consentimiento sin finalidad que la sostenga; no publicar superficies con contenido incompleto;
describir como manuales las capacidades no automatizadas; mostrar al candidato qué campos pasan
a ser públicos antes de publicar el portfolio; no describir el portfolio como privado por llevar
`noindex`; resolver el control de plazos del buzón externo antes de publicar el canal.

## 9. Decisiones operativas del responsable

Identidad, nombre comercial, dirección de contacto, canales de privacidad y soporte, territorio,
finalidades empresariales, datos obligatorios y opcionales, proveedores conocidos, conservación
propuesta, comportamiento deseado del portfolio, copy factual del match, etiquetado de datos
ficticios, procedimientos internos, condiciones del buzón externo, versión y responsable de
aprobación.

Evidencia asociada: `RESPONSIBLE_DECISIONS_APPROVED`.

## 10. Decisiones que requieren revisión especializada

Bases jurídicas por finalidad; menores (D-09.1 a D-09.4); DPO; EIPD; artículo 30; artículo 22 y
calificación del match; cookie `refresh_token`; LSSI; transferencias; encargados y contratos;
plazos de conservación; términos; privacidad; publicación por defecto de ubicación y
disponibilidad; superficie de publicación del identificador fiscal; aplicabilidad y alcance de
la portabilidad.

Evidencia asociada: `SPECIALIST_REVIEW_COMPLETED`.

## 11. Recuento verificado de decisiones

Recuento obtenido **fila por fila** sobre el registro de decisiones del responsable:

| Categoría | Nº |
|---|---:|
| Bloqueantes | 34 |
| No bloqueantes | 7 |
| Condicionadas | 1 |
| **Total** | **42** |

```text
34 + 7 + 1 = 42
```

```text
CANONICAL_SPRINT24_GATE_INVENTORY:
34 / 7 / 1
```

Identificadores D-01 a D-42, **sin duplicados y sin huecos**.

**Discrepancia con el recuento esperado (registro histórico).** La revisión indicó
**32 / 9 / 1**; la verificación arroja **34 / 7 / 1**. Ambas suman 42. Diferencias respecto al
recuento previo (33 / 8 / 1):

```text
HISTORICAL_NON_CANONICAL_EXPECTATION:
32 / 9 / 1
```

1. **D-07 (DPO)** pasa a bloqueante: si existe DPO, sus datos forman parte de la información
   ampliada, y la segunda capa no puede cerrarse sin conocer el resultado.
2. El resumen anterior declaraba 27 / 12 / 3, cifras que no coincidían con su propia tabla.

No se ha ajustado ninguna fila para cuadrar con la cifra esperada. En su momento este informe
dejó abierta la pregunta de qué dos decisiones considerarían no bloqueantes quienes esperaban
**32 / 9 / 1**. Esa pregunta queda cerrada por la nota siguiente.

### 11.bis Nota de reconciliación del recuento

`ORCHESTRATOR_DECISION_O01: A` · 17 de agosto de 2026.

- **`34 / 7 / 1` es el recuento canónico** del inventario del gate del Sprint 24, ratificado por
  decisión del Orquestador.
- **`32 / 9 / 1` fue una expectativa histórica no canónica** de una revisión previa. Se conserva
  en este documento como registro cronológico, no como recuento vigente.
- **No se ha reclasificado ninguna decisión D-NN** para cuadrar la cifra histórica, y **no se
  identifican** las dos decisiones que la habrían cuadrado.
- **No se ha modificado ningún valor ni estado privado.**
- La cronología anterior de esta sección —incluidas las menciones a `33 / 8 / 1` y
  `27 / 12 / 3`— se conserva sin borrado.

## 12. Identidad y contactos

El bloque de identidad y contacto comprende D-01 a D-06; su estado individual permanece en el
registro privado segregado. D-03 reformulado: disponer del identificador fiscal, necesidad de
publicarlo y superficie procedente son cuestiones distintas; **no se presenta como requisito
automático de la información de privacidad**.

## 13. Ámbito, edad y menores

D-08 y D-09. El bloque D-09 se descompone en edad mínima contractual, admisión o exclusión de
menores, intervención de representantes legales y verificación técnica. **No se propone una edad
concreta.** Declarar una edad mínima **no equivale a verificarla técnicamente**, y cualquier
verificación supondría nueva recogida de datos y cambio de modelo, `[FUERA DE ALCANCE]`.

## 14. Finalidades y bases jurídicas

D-10 a D-13. Las finalidades del inventario son **aparentes**, deducidas del uso técnico; no son
finalidades declaradas ni bases jurídicas. La asignación de bases es revisión especializada y
condiciona si procede alguna casilla de consentimiento.

## 15. Proveedores y transferencias

D-14 a D-16. Observado: almacenamiento de avatares en filesystem local; **sin integración de
correo**; sin analítica ni CDN de terceros. Hosting y despliegue productivo **no acreditados**
en el repositorio.

## 16. Conservación

D-17 a D-20. **No existe política de conservación documentada** ni política de inactividad. El
cierre de cuenta, la exportación y la portabilidad no están automatizados.

## 17. Derechos y soporte

Rectificación y supresión granular funcionan por autoservicio. Acceso, copia, exportación,
portabilidad, supresión de cuenta, limitación y oposición son **procedimientos manuales
asistidos**. El canal depende de un **buzón externo**: **JobIT no gestiona automáticamente estas
solicitudes**, y el control de plazos es manual.

## 18. Portfolio público

Opt-in real, despublicación disponible, `noindex, nofollow`. Salario deseado y correo **nunca
públicos**. Punto abierto `PORT-02`: ubicación y disponibilidad visibles por defecto al
publicar; decisión ahora, **corrección técnica fuera de alcance**.

## 19. Match explicable

Hechos confirmados en §6. Copy factual propuesto para aprobación en D-31. **Calificación
jurídica y aplicabilidad del artículo 22: pendientes de revisión especializada.** Este informe
no afirma que el artículo 22 resulte aplicable ni que no lo resulte.

## 20. Cookies y almacenamiento

Una sola cookie técnica de autenticación, persistente 7 días. La excepción confirmada por la
AEPD se refiere a cookies de autenticación **de sesión**, por lo que su encaje **no se decide**
aquí (D-33, D-34). No se propone banner ni CMP. La evidencia sobre ausencia de tecnologías no
esenciales está **limitada al código y al entorno local auditado** (D-36).

## 21. Incidentes y reclamaciones

Procedimiento inicial documentado con seis fases. Las obligaciones formales de notificación
—existencia, plazo y destinatario— son revisión especializada. Regla operativa: durante un
incidente no se copian datos personales a canales de trabajo.

## 22. DPO, artículo 30 y EIPD

- **DPO (D-07):** cuatro opciones; pregunta sobre obligatoriedad o conveniencia; **sin
  concluir**; bloqueante por su efecto en la información ampliada.
- **Artículo 30 (D-40):** aplicabilidad pendiente. El inventario es material de trabajo que
  podría servirle de base; **no se afirma que lo constituya ni que sea exigible**.
- **EIPD (D-39):** aplicabilidad pendiente.

## 23. Gaps para sprints posteriores

Borrado de cuenta; exportación y portabilidad automatizadas; limitación y oposición; borrado
físico de avatares (`AVATAR-02`); política de inactividad; corrección técnica de `PORT-02`;
verificación del inventario contra build de producción o staging; integración de correo.

## 24. Información necesaria del responsable

Las 42 hojas de aprobación del registro de decisiones del responsable, más las 13 condiciones operativas del
buzón externo (Bloque 8) y el registro de aprobación con versión y responsable.

## 25. Información necesaria del revisor especializado

Los puntos de §10, con el material de apoyo: inventario de datos y tratamientos, inventario de
cookies con el matiz de persistencia de `refresh_token`, descripción factual del match,
comportamiento del portfolio y hechos técnicos sobre edad y menores.

## 26. Superficies bloqueadas

No se implementan hasta `LEGAL_DECISIONS_APPROVED`: primera capa de `/register`; enlaces legales
desde `/register` y `/login`; footer legal; páginas de privacidad, términos, cookies y soporte;
etiquetado del preview de la landing; disclaimer de match.

## 27. Estado final

```text
LEGAL_DECISION_GATE
RESPONSIBLE_DECISIONS_APPROVED — PARCIAL
SPECIALIST_REVIEW_PACKAGE — READY
SPECIALIST_REVIEW_COMPLETED — PENDIENTE
BLOCKED_LEGAL_DECISIONS_REQUIRED
```

Nueve decisiones aprobadas o parcialmente aprobadas, registradas de forma sanitizada; 33
diferidas. Paquete de revisión especializada listo con 15 referencias. El Tramo B **no está
autorizado**.

**Este informe no afirma cumplimiento jurídico de ningún tipo.**

### Fuentes oficiales

- [AEPD — Derecho de información](https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion)
- [AEPD — Ejerce tus derechos](https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos)
- [AEPD — Guía sobre el uso de las cookies (mayo 2024)](https://www.aepd.es/guias/guia-cookies.pdf)
- Reglamento (UE) 2016/679 (RGPD) · Ley Orgánica 3/2018 (LOPDGDD) · Ley 34/2002 (LSSI)
