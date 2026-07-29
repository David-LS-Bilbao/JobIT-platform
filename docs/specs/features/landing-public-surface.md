# Spec: Landing Public Surface — Sprint 25

## Metadatos

- **Sprint**: 25 — Landing Public Surface Hardening.
- **Nivel de riesgo**: Nivel 2 — frontend público, responsive y accesibilidad.
- **Tipo**: frontend-only y documentación.
- **Baseline aprobado**: `dev@3697113009e62c00bbb7b4c99c576348804d6c80`.
- **Rama prevista**: `feat/sprint-25-landing-public-surface-hardening`.
- **Superficie productiva**: `apps/web/src/app/page.tsx`.

## 1. Problema

La landing pública comunica capacidades reales de JobIT, pero conserva terminología de fase,
anclas incoherentes y una preview que puede confundirse con una sesión real. La composición se
recorta en viewports móviles estrechos y tiene deuda localizada de contraste, foco, movimiento,
navegación por teclado, objetivos táctiles y metadatos.

El endurecimiento debe mantener la identidad visual existente y ser honesto sobre lo disponible y
el roadmap. No supone un rediseño ni autoriza cambios de producto, backend, autenticación o ámbito
legal.

## 2. Trazabilidad de hallazgos

La taxonomía aprobada se conserva sin renumeración:

- **L-01 — Superficie legal incompleta**: Sprint 25 no la cierra. No se añaden avisos, enlaces ni
  contenido legal; Sprint 24B permanece fuera de alcance.
- **L-02 — Terminología pública “MVP”**: se elimina de la salida productiva actual.
- **L-03 — Anclas incoherentes**: texto, `href`, `id` y heading pasan a compartir significado.
- **L-04 — Preview no identificada**: se convierte en ejemplo semántico con datos ficticios y sin
  dominio no acreditado.
- **L-05 — Ausencia de spec**: este documento establece la fuente canónica.
- **L-06 — Metadatos incompletos**: la landing declara metadata específica y local.
- **L-07 — Logo a sección interna**: el enlace de marca apunta a `/`.
- **L-08 — H1 móvil recortado**: se corrige entre 320 px y desktop.
  - **L-08a**: los CTAs se recortan en los anchos menores.
  - **L-08b**: la preview excede el viewport aunque el documento oculte el overflow.
- **L-09 — Contraste**: se corrigen labels claros sobre blanco, la etiqueta tecnológica sobre fondo
  oscuro, el score y el copyright.
- **L-10 — Reduced motion**: la preferencia reduce elimina desplazamiento, escala y elevación
  animada sin aplicar una regla global destructiva.
- **L-11 — Navegación móvil**: se adopta un header compacto sin drawer; las secciones permanecen
  disponibles en el footer.
- **L-12 — Skip link**: se añade un primer control enfocable hacia el contenido principal.
- **L-13 — Objetivos táctiles**: los enlaces afectados alcanzan 44 × 44 px cuando es razonable y
  nunca quedan por debajo de 24 × 24 px sin una excepción válida.

## 3. Objetivo

Endurecer la landing como superficie pública candidate-first:

1. describir capacidades disponibles y roadmap sin términos de fase;
2. asegurar navegación semántica y accesible;
3. identificar como ficticia cualquier representación de producto;
4. garantizar una composición íntegra en los siete viewports;
5. cumplir contraste AA, foco visible, reduced motion y objetivos táctiles;
6. publicar metadatos específicos sin inventar dominio ni assets.

## 4. Alcance

- Copy aprobado del hero, capacidades, funcionamiento, roadmap y CTA final.
- Navegación principal y footer coherentes.
- Logo enlazado a `/`.
- Preview `<figure>` con `<figcaption>` visible y datos sintéticos.
- Responsive localizado de `page.tsx`.
- Skip link, foco visible, contraste, reduced motion y targets.
- Metadata de Next.js exportada desde `page.tsx`.
- Tests unitarios y Playwright localizado.
- Informe final del sprint.

## 5. Fuera de alcance

- Completar L-01 o cualquier trabajo de Sprint 24B.
- Avisos, políticas, consentimiento, cookies o nuevas rutas legales.
- Backend, API, Prisma, base de datos, auth, perfil, portfolio, jobs o match.
- Drawer, navegación modal, estado cliente o arquitectura nueva.
- Rediseño general, extracción de componentes o design system nuevo.
- Canonical, `metadataBase`, URL, dominio o imagen social.
- Dependencias, configuración, CI/CD, infraestructura o despliegue.

## 6. Copy público aprobado

### Hero

- Badge: `Plataforma candidate-first`.
- Badge: `Match explicable`.
- H1: `Tu perfil tech vivo para explorar oportunidades en JobIT`.
- Descripción: `Construye tu perfil y CV, reúne skills y proyectos, explora ofertas y entiende tu
  afinidad con reglas visibles.`
- CTA primario: `Crear mi perfil` → `/register`.
- CTA secundario: `Ver capacidades` → `#capacidades`.
- Etiqueta: `Tecnología actual`.

### Capacidades

- H2: `Capacidades actuales`.
- Descripción: `Herramientas disponibles hoy para organizar tu perfil y explorar oportunidades.`
- Badge de módulo: `Disponible ahora`.
- Se mantienen los nombres actuales: Dashboard, JobIT CV, JobIT Jobs y JobIT Match.

### Funcionamiento

- H2: `Cómo funciona`.
- Destino: `#funcionamiento`.

### Disponible y roadmap

- H2: `Disponible ahora y en el roadmap`.
- Descripción: `Qué puedes usar hoy y qué forma parte de la evolución prevista del producto.`
- Bloque actual: `Capacidades disponibles ahora`.
- Badge futuro: `En el roadmap`.
- Bloque futuro: `Líneas previstas de evolución`.
- Roadmap:
  - Herramientas para recruiters y empresas.
  - Radar de mercado ampliado.
  - Comunidad profesional.
  - Administración y monetización.
  - Experiencia móvil dedicada.
- Disclaimer: `Estas capacidades no están disponibles actualmente y su alcance puede evolucionar.`

### CTA final

- H2: `Empieza por tu perfil tech`.
- Descripción: `Crea tu cuenta y reúne tu experiencia, skills y proyectos en JobIT.`
- Copyright conservado: `© 2026 JobIT`.

## 7. Navegación

| Texto | `href` | Destino y contenido asociado |
|---|---|---|
| Producto | `#producto` | Hero y propuesta de valor |
| Capacidades | `#capacidades` | H2 `Capacidades actuales` |
| Cómo funciona | `#funcionamiento` | H2 `Cómo funciona` |
| Roadmap | `#roadmap` | H2 `Disponible ahora y en el roadmap` |

Los destinos compensan el header sticky mediante scroll margin. El footer repite exactamente este
mapa. El logo usa `<a href="/" aria-label="JobIT">`.

Por debajo de `md` se eliminan los enlaces secundarios del header para evitar altura sticky,
overflow y una interacción nueva. Se conservan marca, acceso y registro; `Acceder` es la etiqueta
móvil y `Iniciar sesión` la etiqueta desktop. Las secciones siguen disponibles en el footer.

## 8. Preview ilustrativa

La representación usa:

```text
Alex Ejemplo
Desarrollo frontend · Ubicación flexible
proyecto-ejemplo
Frontend · Empresa Ejemplo
Frontend Engineer · Empresa Ejemplo
Vista ilustrativa de JobIT
Afinidad ilustrativa: 82/100
Ejemplo ilustrativo · datos ficticios
```

Se implementa como `<figure>` con `<figcaption>` visible. No contiene datos reales, marcas de
terceros, dominios, una sesión autenticada ni afirmaciones sobre una persona real.

## 9. Responsive

Viewports obligatorios:

```text
320×844
360×800
390×844
430×932
768×1024
1280×900
1440×1000
```

Contrato:

- H1 aproximado `text-4xl sm:text-5xl lg:text-6xl`.
- Columnas y contenedores flex/grid críticos con `min-w-0`.
- Preview limitada a su contenedor.
- CTAs apilados y de ancho completo por debajo de `sm`.
- El hero no oculta una composición rota mediante overflow.
- H1, CTAs, preview, header, footer y foco permanecen dentro del viewport.
- No hay palabras partidas, solapamiento ni overflow horizontal.
- La comprobación usa `boundingClientRect`, no solo `scrollWidth`.

## 10. Accesibilidad

### Contraste

- Texto pequeño sobre blanco: mínimo 4,5:1.
- `Tecnología actual` sobre fondo oscuro: mínimo 4,5:1.
- Score blanco: mínimo 4,5:1.
- Texto grande: mínimo 3:1 cuando corresponda.
- La medición final usa colores computados compatibles con `lab()`/`oklab()` y documenta primer
  plano, fondo, ratio, umbral y método.

### Foco y teclado

- Todos los enlaces afectados tienen un estilo `focus-visible` explícito.
- El primer control enfocable es `Saltar al contenido principal`.
- El destino es `<main id="contenido-principal" tabIndex={-1}>`.
- Activar el skip link desplaza y enfoca el contenido de forma verificable.

### Reduced motion

- `no-preference` conserva transform y elevación actuales.
- `reduce` elimina escala, desplazamiento, elevación animada y sus transiciones.
- Las transiciones de color no problemáticas pueden mantenerse.

### Objetivos táctiles

- Objetivo de diseño: 44 × 44 px cuando sea razonable.
- Mínimo: 24 × 24 px o excepción WCAG 2.2 válida.
- Se mide la caja real de login, registro, navegación, footer y CTAs.

## 11. Metadatos

La landing exporta:

```text
title: JobIT | Perfil tech vivo y match explicable
description: Construye tu perfil tech, reúne tu experiencia y proyectos, explora ofertas y entiende
             tu afinidad mediante reglas visibles.
openGraph.type: website
openGraph.locale: es_ES
twitter.card: summary
```

Open Graph y Twitter reutilizan el title y description exactos. No se declara canonical,
`metadataBase`, URL, dominio ni imagen.

## 12. Criterios de aceptación

- [ ] Existe esta spec canónica y conserva L-01–L-13.
- [ ] La salida productiva no contiene `MVP`, `jobit.app`, `IA avanzada` ni claims prohibidos.
- [ ] Hay un solo `main`, un solo H1 y landmarks coherentes.
- [ ] Navegación, IDs y headings cumplen el mapa aprobado.
- [ ] El logo enlaza a `/` y mantiene el `BrandMark` canónico.
- [ ] La preview es una figura visible e inequívocamente ficticia.
- [ ] Los siete viewports cumplen el contrato responsive.
- [ ] Contraste, teclado, foco, skip link, reduced motion y targets pasan sus mediciones.
- [ ] La metadata coincide exactamente con el contrato.
- [ ] Tests unitarios y Playwright localizado pasan.
- [ ] Typecheck, suite web, lint y build pasan.
- [ ] Solo se modifican los cinco archivos autorizados.

## 13. Estrategia TDD

1. Crear esta spec.
2. Sustituir expectativas antiguas por el contrato unitario y obtener RED.
3. Implementar el cambio mínimo en `page.tsx` hasta GREEN.
4. Añadir Playwright parametrizado para los siete viewports.
5. Corregir con mediciones reales.
6. Ejecutar gates completos y auditoría.
7. Crear el informe final sin realizar commit.

## 14. Archivos autorizados

```text
docs/specs/features/landing-public-surface.md
apps/web/src/app/page.tsx
apps/web/src/app/page.test.tsx
apps/web/e2e/landing-public-surface.spec.ts
docs/sprints/sprint-25-landing-public-surface-hardening-final-report.md
```

## 15. Auditoría requerida

- Correspondencia spec → tests → implementación.
- Quality, security y accessibility.
- Ausencia de datos reales, secretos, marcas de terceros y dominio inventado.
- Evidencia de los siete viewports y ratios de contraste.
- Estado Git y alcance cerrado.
- Sin commit, push, PR, merge ni deploy.
