# Política técnica de superficies públicas: portfolio, match y datos ilustrativos

> **Estado**
>
> Documento interno de gobierno técnico y preparación legal.
>
> No constituye aviso legal público, asesoramiento jurídico ni acreditación de cumplimiento.
>
> Las decisiones sensibles y las evidencias completas se mantienen fuera del repositorio.
>
> No autorizado para producción hasta completar la revisión especializada.

**Sprint 24 · Tramo A.** Es una **política técnica interna**: describe el comportamiento
observado del producto y prepara la futura revisión. **No es texto legal definitivo** ni un
sustituto de las superficies legales, que no están implementadas. Etiquetado conforme a
[`../specs/features/candidate-legal-governance.md`](../specs/features/candidate-legal-governance.md) §2.

> **Nota de custodia.** Las referencias del tipo `D-NN` identifican decisiones del registro del
> responsable, **conservado fuera de este repositorio**, y no son resolubles desde aquí.

**Baseline de la observación:** `98492754d5dd00ebd081e7d5b82b36600b6c9372`

## 1. Superficies públicas observadas

| Superficie | Contenido | Acceso a información legal |
|---|---|---|
| `/` (landing) | Marketing + preview ilustrativo + 6 CTAs de acceso | **Ninguno** |
| `/register` | Email, contraseña, confirmación | **Ninguno** |
| `/login` | Email, contraseña | **Ninguno** |
| `/u/[slug]` | Portfolio del candidato publicado | **Ninguno** |

## 2. Portfolio público

### 2.1 Comportamiento real

| Aspecto | Observado | Evidencia |
|---|---|---|
| Publicación | **Opt-in real**: `isPublished` con `@default(false)` | `schema.prisma` |
| Sin publicar | `getPublicPortfolio` devuelve `null` | `public-portfolio.service.ts:129` |
| Despublicación | Existe | `portfolio.router.ts` |
| Indexación | `robots: { index: false, follow: false }` | `app/u/[slug]/page.tsx` |
| Slug | Único, elegido o derivado | `PortfolioSettings.slug` |

### 2.2 Campos publicados

**Siempre que `isPublished = true`:** nombre compuesto, titular profesional, resumen, avatar,
skills (nombre y nivel), experiencias (empresa, rol, fechas, descripción, ubicación), educación
(institución, título, campo, fechas), proyectos (nombre, descripción, tecnologías, `url`,
`repoUrl`) y enlaces externos.

**Condicionados a flags:**

| Campo | Flag | Default |
|---|---|---|
| `location` | `showLocation` | **`true`** |
| `availabilityStatus`, `locationRemote` | `showAvailability` | **`true`** |
| `preferences` | `showPreferences` | `false` |

**Nunca públicos:** `userId`, email, tokens, **salario deseado**, completitud del perfil.
Exclusión explícita y documentada en el propio servicio.

### 2.3 Punto abierto `PORT-02`

La publicación es opt-in, pero **el alcance de lo publicado no lo es**: al publicar, ubicación y
disponibilidad salen por defecto.

- `[REVISIÓN ESPECIALIZADA]` — si el opt-in de publicación cubre suficientemente ese alcance.
- `[DECISIÓN DEL RESPONSABLE]` — `D-27`.
- `[FUERA DE ALCANCE]` — **la corrección técnica de los defaults no se realiza en este
  sprint**: tocaría el modelo de datos.

`[RECOMENDACIÓN]` — con independencia de la decisión, la superficie de publicación debería
mostrar al candidato **qué campos concretos pasarán a ser públicos antes de publicar**. Esto no
requiere cambio de modelo y puede abordarse en el Tramo B si el gate lo aprueba.

### 2.4 Consideración sobre la indexación

`[RECOMENDACIÓN]` — `noindex, nofollow` reduce el descubrimiento por buscadores, pero **no
convierte la URL en privada**: quien conozca el slug accede. La información al candidato no
debe describir el portfolio como «privado» ni como «oculto».

## 3. Match explicable

### 3.1 Comportamiento real observado

| Aspecto | Observado |
|---|---|
| Naturaleza | Determinista y puro; **sin IA, sin ML, sin red** |
| Entradas | Skills del candidato, preferencias (modalidad, seniority, ubicaciones) y datos de la oferta |
| Pesos | Fijos y visibles: skills 50, modalidad 20, seniority 20, ubicación 10 |
| Salida | `score` 0–100, `level`, desglose por factor y explicación textual |
| Factores sin datos | Quedan en `match: null` y aportan 0 |
| Persistencia | **Ninguna**: no existe modelo de resultados; se calcula en cada petición |
| Efecto | **Ordena y explica ofertas para el candidato** |
| No hace | No descarta candidaturas, no se comunica a empleadores, no condiciona el acceso a ofertas |

La UI ya declara que es orientativo, que no usa IA y que no evalúa la valía del candidato.

### 3.2 Separación entre hechos, copy y calificación jurídica (`D-31`)

Se distinguen cuatro planos que **no deben confundirse**:

**1. Hechos técnicos confirmados** — los de §3.1, verificados sobre el código.

**2. Copy factual propuesto para aprobación del responsable:**

```text
JobIT no toma decisiones de contratación, no descarta candidatos y no comunica el score de
match a empleadores dentro del alcance actual.

El match ordena y explica ofertas para el candidato mediante reglas deterministas.
```

Es una **descripción factual del producto**, no una calificación jurídica. Su aprobación es
`[DECISIÓN DEL RESPONSABLE]`.

**3. Calificación jurídica** — `PENDIENTE DE REVISIÓN ESPECIALIZADA`.

**4. Aplicabilidad del artículo 22 RGPD** — `PENDIENTE DE REVISIÓN ESPECIALIZADA`.

**Este documento no afirma que el artículo 22 resulte aplicable ni que no lo resulte.** La
aprobación del copy factual del punto 2 **no debe interpretarse** como una calificación
jurídica de ningún tipo.

### 3.3 Información sobre la lógica aplicada

`[REVISIÓN ESPECIALIZADA]` — el alcance exacto del deber de informar sobre la lógica aplicada
(arts. 13–15 RGPD) **no se presenta aquí como obligación general confirmada**.

`[RECOMENDACIÓN]` — mantener y reforzar la explicación ya visible en la UI es buena práctica de
transparencia con independencia de cómo se resuelva la cuestión anterior, y no tiene coste
técnico relevante.

## 4. Datos ilustrativos de la landing

### 4.1 Elementos ficticios observados

En el preview de producto de `app/page.tsx`:

| Elemento | Valor ficticio |
|---|---|
| Persona | «Ana Rivas», «Frontend developer · Bilbao» |
| Métrica | «Perfil completado 82%» |
| Proyecto | «design-system» |
| Oferta guardada | «Frontend · Acme» |
| Oferta con puntuación | «React Engineer · TechCo», «82», «Coincides: React, TypeScript · Te falta: GraphQL» |
| Dominio | `jobit.app/dashboard` en la barra de la ventana simulada |

### 4.2 Riesgo

`[RECOMENDACIÓN]` — el conjunto se presenta con la estética de una captura real de producto y
**sin etiqueta que lo identifique como ilustración**. Riesgos:

1. Puede leerse como una persona real, empresas reales y una oferta real.
2. Puede leerse como una métrica real de la plataforma.
3. `jobit.app` sugiere un dominio operativo cuya titularidad **no consta acreditada** en el
   repositorio.

Es de la misma familia que el hallazgo `JOBS-03` del Sprint 22 (`MOCK_LEAK`), aunque en una
superficie distinta.

### 4.3 Actuación propuesta

`[DECISIÓN DEL RESPONSABLE]` — `D-32`.

`[RECOMENDACIÓN]` para el Tramo B, sin rediseño:

1. Envolver el preview en `<figure>` con `<figcaption>` visible indicando que es un ejemplo
   ilustrativo con datos ficticios.
2. Sustituir `jobit.app/dashboard` por el dominio real —cuando D-02 lo determine— o por un
   valor neutro que no sugiera un dominio operativo.
3. No alterar la composición visual ni el resto de la landing.

`[FUERA DE ALCANCE]` — rediseño de la landing, terminología «MVP», SEO, Open Graph, menú móvil
y el resto de hallazgos visuales, que pertenecen a un sprint posterior.

## 5. Superficies previstas tras el gate

`[FUERA DE ALCANCE en Tramo A]` — no se implementan en este sprint.

| Superficie | Ruta propuesta | Depende de |
|---|---|---|
| Privacidad (2ª capa) | `apps/web/src/app/legal/privacidad/page.tsx` | Bloques 1–4 de decisiones |
| Términos | `apps/web/src/app/legal/terminos/page.tsx` | D-01…D-04, D-08, D-09 |
| Cookies y almacenamiento | `apps/web/src/app/legal/cookies/page.tsx` | D-33, D-34 |
| Soporte y derechos | `apps/web/src/app/legal/soporte/page.tsx` | D-05, D-06, D-37, D-38 |
| Footer legal compartido | `apps/web/src/components/layout/legal-footer.tsx` | Alcance por decidir |
| Primera capa de registro | `apps/web/src/features/auth/privacy-notice.tsx` | D-01, D-02, D-05, D-10, D-11, D-14, D-16 |

**Punto de alcance a confirmar:** si el footer legal se monta solo en superficies públicas
(`/`, `/register`, `/login`, `/u/[slug]`) o también en el shell privado.

## 6. Reglas transversales

| # | Regla | Etiqueta |
|---|---|---|
| P-01 | Ninguna superficie afirmará cumplimiento jurídico general | `[RECOMENDACIÓN]` |
| P-02 | Ninguna superficie describirá como automatizada una capacidad manual | `[RECOMENDACIÓN]` |
| P-03 | Ninguna superficie se publicará con marcadores de relleno | `[RECOMENDACIÓN]` |
| P-04 | El portfolio no se describirá como «privado» por llevar `noindex` | `[RECOMENDACIÓN]` |
| P-05 | El match no se calificará jurídicamente sin revisión especializada | `[REVISIÓN ESPECIALIZADA]` |

## 7. Fuentes oficiales

- [AEPD — Derecho de información](https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion)
- [AEPD — Ejerce tus derechos](https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos)
- Reglamento (UE) 2016/679 (RGPD)
- Ley 34/2002 (LSSI)

**Este documento no afirma cumplimiento jurídico de ningún tipo.**
