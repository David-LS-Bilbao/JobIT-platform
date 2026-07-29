# Sprint 25 — Landing Public Surface Hardening · Informe final

## 1. Resultado

La landing pública se ha endurecido dentro del alcance aprobado:

- copy público sin terminología de fase;
- capacidades actuales y roadmap diferenciados;
- navegación, anclas y headings coherentes;
- preview semántica con datos ficticios;
- composición responsive validada entre 320 y 1440 px;
- contraste AA, foco visible, skip link, reduced motion y targets;
- metadata específica de la landing;
- tests unitarios y Playwright localizado.

Estado de entrega: `READY_FOR_REVIEW`.

## 2. Baseline y rama

Baseline revalidado antes de crear la rama:

```text
HEAD       = 3697113009e62c00bbb7b4c99c576348804d6c80
dev        = 3697113009e62c00bbb7b4c99c576348804d6c80
origin/dev = 3697113009e62c00bbb7b4c99c576348804d6c80
```

Rama creada:

```text
feat/sprint-25-landing-public-surface-hardening
```

La rama se creó desde un working tree limpio, con staging vacío, sin archivos untracked y sin
repositorios Git anidados. No se repitió fetch, pull, rebase ni reset.

## 3. Operating Model

- Nivel 2 — frontend público, responsive y accesibilidad.
- Execution Mode continuo dentro del contrato `PLAN_APPROVED`.
- Flujo ejecutado: spec → tests RED → implementación GREEN → E2E → gates → auditoría → informe.
- No se solicitaron ampliaciones de alcance.
- Las acciones Git posteriores permanecen separadas y no autorizadas.

## 4. Archivos

Creado:

```text
docs/specs/features/landing-public-surface.md
apps/web/e2e/landing-public-surface.spec.ts
docs/sprints/sprint-25-landing-public-surface-hardening-final-report.md
```

Modificado:

```text
apps/web/src/app/page.tsx
apps/web/src/app/page.test.tsx
```

No se modificó ningún archivo fuera de la lista cerrada.

## 5. Spec canónica

La fuente de verdad se creó en la ruta contractual:

```text
docs/specs/features/landing-public-surface.md
```

Incluye problema, objetivo, alcance, fuera de alcance, copy, navegación, preview ficticia,
responsive, accesibilidad, metadata, criterios de aceptación, TDD, archivos y auditoría.

No se creó `landing-public-surface-hardening.md`.

## 6. Trazabilidad L-01–L-13

- **L-01 — Superficie legal incompleta**: preservado como fuera de alcance. No se añadió contenido
  legal ni se inició Sprint 24B.
- **L-02 — Terminología “MVP”**: retirada de la salida productiva.
- **L-03 — Anclas incoherentes**: corregidas mediante Producto, Capacidades, Cómo funciona y
  Roadmap.
- **L-04 — Preview no identificada**: convertida en `<figure>` con `<figcaption>`, datos sintéticos
  y sin dominio.
- **L-05 — Ausencia de spec**: cerrada con la spec canónica.
- **L-06 — Metadata incompleta**: title, description, Open Graph y Twitter específicos.
- **L-07 — Logo a sección**: header y footer enlazan a `/`.
- **L-08 — H1 móvil**: escala y composición corregidas.
  - **L-08a**: CTAs apilados bajo `sm`.
  - **L-08b**: preview limitada a su contenedor.
- **L-09 — Contraste**: labels, tecnología, score y copyright corregidos y medidos.
- **L-10 — Reduced motion**: escala, desplazamiento, elevación animada y transición de movimiento
  neutralizados bajo `reduce`.
- **L-11 — Navegación móvil**: header compacto sin drawer; secciones disponibles en footer.
- **L-12 — Skip link**: primer control enfocable y destino `main` funcional.
- **L-13 — Targets**: enlaces visibles medidos con mínimo de 44 px de alto.

## 7. Evidencia TDD

### RED

Tras crear la spec y sustituir el contrato unitario, sin modificar todavía `page.tsx`:

```text
Test Files  1 failed
Tests       11 failed (11)
```

Los fallos correspondían a H1, terminología, headings, anclas, logo, navegación móvil, preview,
skip link, claims y metadata. No apareció un fallo baseline ajeno.

### GREEN

Tras la implementación:

```text
Test Files  1 passed
Tests       11 passed (11)
```

## 8. Copy, navegación y logo

Se aplicó literalmente el copy aprobado. La navegación final es:

| Texto | Destino |
|---|---|
| Producto | `#producto` |
| Capacidades | `#capacidades` |
| Cómo funciona | `#funcionamiento` |
| Roadmap | `#roadmap` |

El CTA secundario usa `Ver capacidades` → `#capacidades`.

En móvil se muestran marca, `Acceder` y `Crear cuenta`. En desktop se muestra `Iniciar sesión` y la
navegación de secciones. No se introdujo drawer ni estado.

Los logos de header y footer usan `Link` de Next.js, renderizan enlaces a `/` con nombre accesible
`JobIT` y conservan `BrandMark` con gradiente `jobit-brand → jobit-green`.

## 9. Preview ficticia

La preview:

- es un `<figure>`;
- muestra `Ejemplo ilustrativo · datos ficticios`;
- usa `Alex Ejemplo`, `Empresa Ejemplo` y `proyecto-ejemplo`;
- sustituye el dominio por `Vista ilustrativa de JobIT`;
- etiqueta el score como `Afinidad ilustrativa: 82/100`;
- no contiene datos reales, marcas de terceros ni una sesión autenticada;
- no contiene `jobit.app` ni otro dominio inventado.

## 10. Responsive y siete viewports

Playwright redimensiona una única navegación y valida `scrollWidth`, rectángulos críticos, H1,
header, footer, preview, CTAs, solapamientos y targets.

| Viewport | H1 | CTAs | Preview | Overflow | Solapamientos | Foco |
|---|---|---|---|---|---|---|
| 320×844 | PASS | PASS | PASS | PASS | PASS | PASS |
| 360×800 | PASS | PASS | PASS | PASS | PASS | PASS |
| 390×844 | PASS | PASS | PASS | PASS | PASS | PASS |
| 430×932 | PASS | PASS | PASS | PASS | PASS | PASS |
| 768×1024 | PASS | PASS | PASS | PASS | PASS | PASS |
| 1280×900 | PASS | PASS | PASS | PASS | PASS | PASS |
| 1440×1000 | PASS | PASS | PASS | PASS | PASS | PASS |

Además:

- `word-break: normal`;
- `overflow-wrap: normal`;
- los rectángulos críticos quedan dentro del viewport;
- ningún enlace visible incumple el mínimo contractual.

## 11. Revisión visual

Se revisaron capturas temporales full-page a 320×844 y 1440×1000.

Resultado:

- jerarquía visual conservada;
- header móvil compacto;
- H1 completamente visible;
- CTAs sin recorte;
- preview legible y contenida;
- cards y roadmap sin solapamientos;
- footer legible;
- composición desktop equilibrada.

Las capturas se almacenaron solo en `/tmp` y no forman parte del repositorio. El indicador “N”
observado corresponde al overlay del servidor de desarrollo de Next y no aparece en producción.

## 12. Contraste

Método:

1. lectura de `color` y `background-color` computados en Chromium;
2. resolución de colores CSS modernos mediante Canvas 2D/GetImageData;
3. luminancia relativa sRGB y fórmula WCAG `(L1 + 0.05) / (L2 + 0.05)`;
4. umbral aplicado: 4,5:1 para texto normal.

| Elemento | Primer plano computado | Fondo computado | Ratio | Umbral | Estado |
|---|---|---|---:|---:|---|
| Vista ilustrativa | `lab(35.5623 -1.74978 -15.4316)` | `rgb(255, 255, 255)` | 7,58:1 | 4,5:1 | PASS |
| Proyecto | `lab(35.5623 -1.74978 -15.4316)` | `rgb(255, 255, 255)` | 7,58:1 | 4,5:1 | PASS |
| Tecnología actual | `lab(84.7652 -1.94535 -7.93337)` | `lab(1.76974 1.32743 -9.28855)` | 13,56:1 | 4,5:1 | PASS |
| Afinidad ilustrativa | `rgb(255, 255, 255)` | `lab(44.4871 -41.0396 11.0361)` | 5,36:1 | 4,5:1 | PASS |
| Copyright | `lab(35.5623 -1.74978 -15.4316)` | `rgb(255, 255, 255)` | 7,58:1 | 4,5:1 | PASS |

Los tests no reutilizan conversiones incompatibles con `lab()` u `oklab()`.

## 13. Teclado, foco y skip link

Playwright verificó:

- `Saltar al contenido principal` es el primer control tras pulsar Tab;
- se vuelve visible y muestra ring computado;
- Enter navega a `#contenido-principal`;
- el foco termina en el único `<main id="contenido-principal" tabIndex={-1}>`;
- los controles tienen estilos `focus-visible` explícitos;
- el foco permanece dentro del viewport en la matriz responsive.

## 14. Objetivos táctiles

Se midió el `boundingClientRect` real de todos los enlaces visibles, excluyendo el skip link cuando
está oculto.

Resultado:

- ningún target visible baja de 24 px;
- todos los enlaces afectados alcanzan al menos 44 px de alto;
- no hay targets solapados en el header;
- CTAs móviles ocupan el ancho disponible.

## 15. Reduced motion

Con `no-preference`:

- CTA conserva escala en hover;
- cards conservan desplazamiento y elevación.

Con `reduce`:

- `scale` computado del CTA queda en `1`;
- `translate` computado de la card queda en `0px`;
- `transition-property` computado queda en `none`;
- la sombra permanece en geometría `shadow-sm`, sin elevación grande animada.

No se añadió una regla global.

## 16. Metadata

La landing exporta desde `page.tsx`:

```text
title: JobIT | Perfil tech vivo y match explicable
description: Construye tu perfil tech, reúne tu experiencia y proyectos, explora ofertas y entiende tu afinidad mediante reglas visibles.
openGraph.type: website
openGraph.locale: es_ES
twitter.card: summary
```

Open Graph y Twitter reutilizan title y description. No se añadió canonical, `metadataBase`, URL,
dominio ni asset social.

## 17. Búsquedas de seguridad de copy

La búsqueda sobre `apps/web/src/app/page.tsx` no devuelve coincidencias para:

```text
MVP
jobit.app
IA avanzada
contratación automática
evaluamos candidatos
garantizamos empleo
mejor candidato
precisión garantizada
```

Las coincidencias en tests y spec se clasificaron como aserciones negativas o criterios de
aceptación. No son contenido productivo.

No se encontraron nombres anteriores, empresas anteriores, ubicación anterior, secretos, tokens ni
datos reales en la superficie productiva.

## 18. Quality gates

Resultados:

```text
Unitario localizado:  11/11 PASS
Playwright localizado: 5/5 PASS
Suite web:             27 archivos, 404/404 PASS
Typecheck:             PASS
Lint:                  PASS
Build:                 PASS
git diff --check:      PASS
```

El primer intento de build dentro del sandbox falló porque Turbopack intentó enlazar un puerto
local (`Operation not permitted`). Repetido fuera del sandbox con el mismo código:

```text
Compiled successfully
TypeScript PASS
13/13 páginas estáticas generadas
/ prerenderizada como contenido estático
```

El warning preexistente sobre inferencia del workspace root y múltiples lockfiles no se corrigió
porque modificar configuración o lockfiles estaba fuera de alcance.

No se ejecutó la suite API.

## 19. Auditoría quality/security/accessibility

### Quality

- Spec, tests e implementación son coherentes.
- No se extrajeron componentes sin necesidad.
- No se introdujo estado ni duplicación arquitectónica.
- El cambio permanece localizado.

### Security y privacidad

- Sin backend, requests, credenciales, secretos ni datos reales.
- Sin dominios o URLs inventados.
- Sin dependencias, assets remotos ni scripts externos.
- Sin claims de contratación, garantías o evaluación automática de personas.

### Accessibility

- Landmarks y jerarquía semántica correctos.
- Un solo H1 y un solo main.
- Figure y figcaption.
- Navegación por teclado y skip link.
- Foco visible.
- Contraste AA.
- Reduced motion.
- Targets táctiles.
- Responsive sin recortes ni overflow.

Resultado de auditoría: `PASS`.

## Correcciones tras revisión

La revisión previa al commit detectó y permitió corregir dos hallazgos `MEDIUM` localizados:

- `S25-REV-01`: la denominación profesional inconsistente de la spec se sustituyó por
  `Frontend Engineer · Empresa Ejemplo` para alinearla con la implementación y mantener el ejemplo
  sintético sin marcas de terceros.
- `S25-REV-02`: el test unitario de metadata ahora comprueba las descripciones exactas de Open
  Graph y Twitter, además de la ausencia de `metadataBase`, `alternates`, URL e imágenes sociales.
  El test Playwright verifica las etiquetas públicas esperadas y la ausencia de canonical, URL e
  imágenes sociales.

Archivos modificados durante la corrección:

```text
docs/specs/features/landing-public-surface.md
apps/web/src/app/page.test.tsx
apps/web/e2e/landing-public-surface.spec.ts
docs/sprints/sprint-25-landing-public-surface-hardening-final-report.md
```

Evidencia localizada posterior a la corrección:

```text
Vitest localizado:     11/11 PASS
Playwright localizado: 5/5 PASS
git diff --check:      PASS
```

`apps/web/src/app/page.tsx` no se modificó durante la corrección; su hash SHA-256 se mantuvo en
`f1348cf2219bb8da4dee6a9987f0977a0f7bcad2ba1e004edcd2085b1a362c65`.

## 20. Restricciones y acciones no realizadas

- No se abrió `.env`.
- No se instalaron dependencias.
- No se modificaron archivos prohibidos.
- No se añadió contenido legal.
- No se inició Sprint 24B.
- No se realizó commit.
- No se realizó push.
- No se abrió PR.
- No se realizó merge.
- No se realizó deploy.
- No se añadieron trailers, coautorías ni menciones de IA.

## 21. Estado Git de entrega

El working tree contiene exclusivamente los cinco archivos autorizados y permanece sin staging.

Siguiente gate humano recomendado: revisión del diff y autorización explícita separada para commit.

**READY_FOR_REVIEW**
