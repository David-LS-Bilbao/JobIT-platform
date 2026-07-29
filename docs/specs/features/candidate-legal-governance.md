# Spec: Gobierno legal del candidato (Sprint 24)

> **Estado**
>
> Documento interno de gobierno técnico y preparación legal.
>
> No constituye aviso legal público, asesoramiento jurídico ni acreditación de cumplimiento.
>
> Las decisiones sensibles y las evidencias completas se mantienen fuera del repositorio.
>
> No autorizado para producción hasta completar la revisión especializada.

**Tramo A completado. Bloqueada en `LEGAL_DECISION_GATE`.** Las superficies públicas descritas
aquí **no están implementadas** y no pueden implementarse hasta `LEGAL_DECISIONS_APPROVED`.

> **Nota de custodia.** El registro de decisiones del responsable y el runbook operativo de
> derechos y soporte **se conservan fuera de este repositorio**. Las referencias del tipo `D-NN`
> que aparecen en este documento identifican decisiones de ese registro segregado y no son
> resolubles desde el repositorio público.

## 1. Objetivo

Resolver los hallazgos `PRIV-01` (P0) y `PRIV-02` (P1) de la auditoría del Sprint 22,
estableciendo:

1. la información que debe recibir el candidato en el momento de la recogida de sus datos;
2. el acceso persistente a esa información desde las superficies públicas;
3. el canal y el procedimiento para ejercer derechos, pedir soporte y reclamar;
4. la transparencia sobre el portfolio público y sobre el match.

Esta spec **no redacta textos legales**. Define estructura, reglas, superficies y criterios
verificables. El contenido depende de decisiones del responsable recogidas en
el registro de decisiones del responsable (**conservado fuera del repositorio**).

## 2. Taxonomía de etiquetado (obligatoria)

Toda afirmación de este sprint —en esta spec y en los documentos de `docs/legal/`— lleva una
de estas cinco etiquetas. Sin etiqueta, la afirmación no es utilizable.

| Etiqueta | Significado |
|---|---|
| `[REQUISITO CONFIRMADO]` | Sostenido por fuente oficial citada y verificada. |
| `[RECOMENDACIÓN]` | Propuesta técnica del equipo, no obligación acreditada. |
| `[DECISIÓN DEL RESPONSABLE]` | Solo puede resolverla el responsable del tratamiento. |
| `[REVISIÓN ESPECIALIZADA]` | Requiere criterio jurídico cualificado; el equipo no concluye. |
| `[FUERA DE ALCANCE]` | Excluido de este sprint por decisión del contrato operativo. |

## 3. Actores

| Actor | Papel |
|---|---|
| Candidato | Persona cuyos datos se tratan. Destinatario de la información y titular de los derechos. |
| Responsable del tratamiento | Decide fines y medios. Identidad pendiente de decisión. |
| Soporte / operación | Recibe y tramita solicitudes de derechos, soporte, reclamaciones e incidentes. |
| Equipo técnico | Implementa superficies y controles. No decide contenido legal. |
| Revisión especializada | Valida las calificaciones jurídicas marcadas como tales. |

## 4. Superficies

### 4.1 Observadas hoy (estado real)

| Superficie | Estado legal actual |
|---|---|
| `/register` | Recoge email y contraseña. **Sin información de tratamiento.** |
| `/login` | Recoge email y contraseña. **Sin enlaces legales.** |
| `/` (landing) | 6 CTAs de acceso. **Footer sin bloque legal.** |
| `/u/[slug]` | Portfolio público, `noindex, nofollow`. **Sin footer legal.** |
| Rutas privadas | Sin superficie de derechos ni soporte. |

### 4.2 Previstas tras el gate `[FUERA DE ALCANCE en Tramo A]`

Rutas propuestas en [`../../legal/public-surfaces-policy.md`](../../legal/public-surfaces-policy.md) §5.
No se crean en este tramo.

## 5. Datos

El inventario completo, con matriz dato → recogida → finalidad aparente → visibilidad →
persistencia → riesgo, vive en [`../../legal/data-inventory.md`](../../legal/data-inventory.md).
Esta spec no lo duplica: hay una sola fuente por dato.

Resumen de lo relevante para las superficies: el registro recoge **email y contraseña**; el
resto del perfil es opcional; el salario deseado se almacena pero **nunca se publica**;
ubicación y disponibilidad **se publican por defecto** cuando el candidato publica su portfolio.

## 6. Flujos

### 6.1 Registro con primera capa `[REQUISITO CONFIRMADO]`

```text
El candidato abre /register
→ ve la primera capa informativa antes de enviar el formulario
→ puede abrir la segunda capa sin perder lo introducido
→ envía el formulario
```

La AEPD admite facilitar la información **en capas** y sitúa en la primera capa: identidad del
responsable, descripción sencilla de los fines, base jurídica, previsión de cesiones o
transferencias y referencia al ejercicio de derechos.
Fuente: [AEPD — Derecho de información](https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion).

### 6.2 Acceso persistente a la segunda capa `[RECOMENDACIÓN]`

Footer legal disponible en las superficies públicas, de modo que la información no dependa de
haber pasado por el registro.

### 6.3 Ejercicio de derechos `[REQUISITO CONFIRMADO]` + `[DECISIÓN DEL RESPONSABLE]`

```text
El candidato localiza el canal de ejercicio
→ envía su solicitud
→ el responsable acusa recibo y verifica identidad
→ responde en el plazo aplicable
→ si deniega, motiva e informa de la vía de reclamación
```

Plazo de **un mes**, prorrogable dos meses; ejercicio **gratuito**; denegación motivada con
indicación de la vía de reclamación.
Fuente: [AEPD — Ejerce tus derechos](https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos).
El canal concreto es `[DECISIÓN DEL RESPONSABLE]`.

## 7. Reglas

| # | Regla | Etiqueta |
|---|---|---|
| R-01 | La información de privacidad y la aceptación contractual de términos se mantienen **separadas**. No se fusionan en una sola casilla. | `[RECOMENDACIÓN]` |
| R-02 | **No se añade una casilla genérica de consentimiento** salvo que una finalidad concreta se base realmente en consentimiento. | `[DECISIÓN DEL RESPONSABLE]` |
| R-03 | No se publica ningún texto con marcador de relleno. Si falta una decisión, la superficie **no se implementa**. | `[RECOMENDACIÓN]` |
| R-04 | No se describe como disponible una capacidad que no existe técnicamente. Los derechos sin automatización se describen como **procedimiento manual asistido**. | `[RECOMENDACIÓN]` |
| R-05 | No se afirma cumplimiento jurídico general en ninguna superficie ni documento. | `[RECOMENDACIÓN]` |
| R-06 | El etiquetado de datos ficticios de la landing debe impedir que se lean como personas, empresas u ofertas reales. | `[RECOMENDACIÓN]` |
| R-07 | Los defaults de visibilidad del portfolio **no se modifican** en este sprint. | `[FUERA DE ALCANCE]` |

## 8. Transparencia

### 8.1 Portfolio público

Comportamiento real y campos publicados: ver
[`../../legal/public-surfaces-policy.md`](../../legal/public-surfaces-policy.md) §2.
Punto abierto: ubicación y disponibilidad se publican por defecto (`PORT-02`).
Su corrección técnica es `[FUERA DE ALCANCE]`; su decisión es `[DECISIÓN DEL RESPONSABLE]`.

### 8.2 Match

Comportamiento real: reglas fijas, deterministas, sin IA, sin red, sin persistencia de
resultados; ordena y explica ofertas para el candidato.

La calificación del match respecto al **artículo 22 RGPD** es `[REVISIÓN ESPECIALIZADA]`. Este
sprint **no afirma que el artículo 22 resulte aplicable ni que no lo resulte**.

El alcance exacto del deber de informar sobre la lógica aplicada (arts. 13–15 RGPD) es
`[REVISIÓN ESPECIALIZADA]`: **no se presenta como obligación general confirmada**. Con
independencia de ello, mantener y reforzar la explicación ya visible en la UI es
`[RECOMENDACIÓN]`.

## 9. Validaciones

| Validación | Momento | Etiqueta |
|---|---|---|
| La primera capa contiene los cinco elementos de §6.1 | Render de `/register` | `[REQUISITO CONFIRMADO]` |
| Existe enlace navegable a la segunda capa | Render de `/register` y `/login` | `[RECOMENDACIÓN]` |
| El footer legal expone los cuatro destinos acordados | Superficies públicas | `[RECOMENDACIÓN]` |
| Ningún texto contiene marcador de relleno | Build y tests | `[RECOMENDACIÓN]` |
| Ningún texto afirma cumplimiento general | Revisión y tests | `[RECOMENDACIÓN]` |

## 10. Errores

| Situación | Comportamiento esperado |
|---|---|
| Falta una decisión del responsable | La superficie **no se implementa**; el sprint permanece bloqueado en el gate. |
| El candidato envía una solicitud de derechos sin identificarse | Procedimiento de verificación de identidad descrito en el runbook operativo interno (**conservado fuera del repositorio**). |
| Solicitud de una capacidad no automatizada | Se tramita como procedimiento manual, comunicando plazo real. |

## 11. Accesibilidad

`[RECOMENDACIÓN]` — la primera capa y el footer legal deben ser alcanzables por teclado, con
foco visible, en escritorio y en móvil, y legibles por lector de pantalla. No se introduce
herramienta nueva de auditoría: `axe-core` **no está disponible** en el proyecto y el plan
aprobado prohíbe añadir dependencias. Se verificará con el tooling existente.

## 12. Criterios de aceptación

### Tramo A (este sprint)

- [x] Inventario de datos, tratamientos, cookies y almacenamiento construido sobre evidencia
      observada.
- [x] Paquete de decisiones del responsable completo y accionable.
- [x] Procedimientos de derechos, soporte, reclamaciones e incidentes documentados.
- [x] Política de superficies públicas documentada.
- [x] Toda afirmación etiquetada según §2.
- [x] Ningún texto legal de cara al usuario redactado.
- [x] `LEGAL_DECISION_GATE` entregado.

### Tramo B (tras `LEGAL_DECISIONS_APPROVED`) `[FUERA DE ALCANCE en Tramo A]`

- [ ] Primera capa en `/register` con los cinco elementos.
- [ ] Enlaces legales desde `/register` y `/login`.
- [ ] Footer legal en las superficies públicas acordadas.
- [ ] Páginas de segunda capa publicadas sin marcadores de relleno.
- [ ] Etiquetado de datos ficticios de la landing.
- [ ] Tests en verde y auditoría quality/security.

## 13. Tests

Tramo A: verificaciones documentales (estructura, enlaces internos, ausencia de marcadores de
relleno, ausencia de afirmaciones absolutas, ausencia de datos personales y secretos, alcance
de archivos).

Tramo B: tests RED → GREEN descritos en el Plan Mode Report §26, con Vitest + RTL y Playwright.
Sin dependencias nuevas.

## 14. Fuera de alcance

Implementación de superficies públicas en este tramo; borrado técnico de cuenta; exportación
automatizada; limitación y oposición automatizadas; borrado físico de avatares; modificación de
`PORT-02`; rediseño de la landing; terminología «MVP»; SEO, Open Graph y canonical; menú móvil;
refresh de sesión; recuperación de contraseña; verificación de email; rate limiting; cambios de
schema, migraciones, auth o scoring; proveedores de empleo; CI, Docker, deploy, observabilidad
y backups; herramientas de cookies, analítica y publicidad.

## 15. Decisiones pendientes

Las 7 categorías y sus opciones están en
el registro de decisiones del responsable (**conservado fuera del repositorio**).

## 16. Gate legal

```text
LEGAL_DECISION_GATE
```

Sin resolución del gate, el Tramo B no puede iniciarse: cualquier texto sería inventado.

## 17. Desviación metodológica registrada

La verificación de cookies y almacenamiento se realizó **en runtime local** creando una
**cuenta sintética** (`priv+<timestamp>@jobit.local`) sobre la base de datos de desarrollo
`jobit_dev`, navegando superficies públicas y privadas con un navegador automatizado.

- No se utilizaron datos personales reales.
- No se inspeccionaron uploads ni `.env`.
- No se imprimieron tokens, cookies reales de terceros ni credenciales.
- La observación refleja el **entorno de desarrollo**, no un entorno productivo.

Consecuencia: los resultados de `sessionStorage` incluyen un artefacto propio del modo
desarrollo de Next.js (`__next_debug_channel`) que **debe reverificarse contra un build de
producción** antes de darse por definitivo. Registrado como limitación en
[`../../legal/data-inventory.md`](../../legal/data-inventory.md) §5.

## 18. Auditoría requerida

- [ ] Quality/security documental (`docs/agents/audit-quality-security-skill.md`).
- [ ] Revisión humana del gate.
- [ ] Revisión especializada de los puntos marcados `[REVISIÓN ESPECIALIZADA]`.

---

**Esta spec no afirma cumplimiento jurídico de ningún tipo.**
