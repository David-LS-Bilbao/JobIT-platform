# Sprint 21 — Candidate UX/UI Audit & Design Direction

## 1. Resumen ejecutivo

El flujo candidato del MVP de JobIT está **completo, funcional y notablemente fiel a sus
specs**: registro → dashboard → JobIT CV → portfolio (privado, settings y público) → jobs →
detalle → guardadas → match → logout funciona de extremo a extremo con datos reales, y la
auditoría lo recorrió íntegro con un usuario ficticio sin encontrar ningún bloqueo.

- **¿Es funcional?** Sí. Todas las rutas previstas existen, los criterios observables de las
  specs se cumplen en su gran mayoría y los estados de carga, error y vacío están cubiertos de
  forma uniforme (componentes de feedback del Sprint 17D) con retry funcional verificado.
- **¿Está preparado para enseñarse?** Casi. No hay ningún hallazgo P0, pero existen **8 P1
  concretos de demo-readiness** (detallados en la matriz): el más relevante es funcional
  (JOBS-01: la paginación de Jobs no está expuesta en la UI y 36 de 56 ofertas resultan
  inaccesibles) y el resto son de presentación (metadatos en inglés, enum crudo `VERY_LOW`,
  truncados en móvil, tablet a 768 px, meta-copy interna y avatar estático del header).
- **Fortalezas**: el flujo de **Portfolio es el más maduro del producto** (requisitos de
  publicación explícitos, slug editable, QR, visibilidad granular, feedback en cada paso);
  los estados de carga/error son sólidos y accesibles (`role="status"`, `aria-busy`,
  Reintentar); la base de accesibilidad es muy buena para un MVP (0 inputs sin label,
  0 controles sin nombre, foco visible consistente); el copy es honesto ("sin humo",
  match explicable sin apariencia de IA).
- **Principales deudas**: paginación de Jobs sin UI, experiencia de Match con perfil sin
  skills (20 tarjetas al 0/100 con el mismo aviso repetido), calidad de metadatos de las
  ofertas ingeridas (Jooble), doble identidad visual entre landing/auth y aplicación, y un
  conjunto acotado de deudas de accesibilidad (drawer sin gestión de foco/Escape, auth sin
  landmarks, contrastes `slate-400`).
- **Veredicto**: **no se recomienda un rediseño**. El sistema visual privado ("Nexus
  Professional" sobre tokens `jobit-*`) es coherente y profesional; lo que falta es cerrar
  gaps concretos y alinear variantes, no rehacer pantallas.

## 2. Estado general de UX/UI

| Dimensión | Estado | Nota |
|---|---|---|
| Flujo candidato E2E | ✅ Completo | Verificado con Playwright sobre stack real |
| Fidelidad a specs | ✅ Alta | 2 desviaciones relevantes: JOBS-01 y SAVED-02 |
| Estados carga/error/vacío | ✅ Sólidos | 9/9 escenarios de error correctos; retry recupera |
| Identidad visual | ⚠️ Dos variantes | Landing/auth (oscura, sky/emerald) vs app (clara, teal `jobit-*`) |
| Accesibilidad básica | ✅/⚠️ Buena base | Deudas concretas: drawer, landmarks auth, contraste `slate-400` |
| Responsive móvil (390 px) | ✅/⚠️ Digno | Truncados de títulos y dos solapes puntuales |
| Responsive tablet (768 px) | ⚠️ Punto débil | Sidebar+hamburguesa simultáneos, header comprimido, overflow-x |
| Sensación de producto | ⚠️ Casi | Meta-copy interna ("MVP candidate-first", "Candidato tech / CT") resta acabado |

## 3. Metodología, rutas y capturas revisadas

- **Base auditada**: `dev` integrado con el Sprint 17E (merge `c3dba32`, PR #87), en rama
  documental `chore/sprint-21-ux-ui-audit`. Ningún archivo de código modificado.
- **Datos**: usuario **exclusivamente ficticio** creado por UI para la auditoría (patrón del
  E2E del Sprint 18), con perfil, skills, proyecto y portfolio publicado sintéticos. No se
  usó ningún usuario preexistente ni datos personales reales. Sus identificadores no se
  incluyen en este informe.
- **Capturas**: **32 capturas base** (19 desktop 1440×1000, 13 mobile 390×844, dpr 2) de
  todas las rutas y de los estados vacíos y poblados, más evidencia complementaria de
  tablet (768×1024), `colorScheme: dark`, 9 estados de error y 3 estados de carga.
  **Ninguna captura se añadió al repositorio ni se subió a ningún servicio**: viven en un
  directorio temporal local y se citan aquí por nombre descriptivo (p. ej.
  `desktop/09-match-inicial`, `tablet-dashboard`).
- **Método**: navegación real con Playwright (Chromium del workspace, sin dependencias
  nuevas) respetando la sesión en memoria (ADR-0006: tras login, solo navegación
  client-side); errores provocados por **interceptación de red** (`page.route`) sin apagar
  la API ni alterar datos; carga observada con retardo de red controlado; accesibilidad
  revisada manualmente y con checks DOM propios (landmarks, headings, labels, nombres
  accesibles, live regions, foco, targets).
- **Limitaciones**: axe **no está instalado** y no se instaló — la cobertura WCAG es
  parcial (estructura, nombres, foco y contrastes representativos; no el ruleset AA
  completo). SAVED-02 se verificó por código, no en runtime (habría requerido alterar
  datos). El formato de fechas `mm/dd/yyyy` visto en capturas se **descartó como artefacto**
  del navegador de test en inglés: con entorno `es_ES` el input nativo muestra
  `dd/mm/yyyy`. El botón flotante "N" de algunas capturas es el indicador de desarrollo de
  Next.js (no existe en producción).

Rutas verificadas (todas existen; ninguna inventada): `/`, `/login`, `/register`,
`/dashboard`, `/profile`, `/profile/portfolio`, `/profile/portfolio/settings`, `/jobs`,
`/jobs/[id]`, `/saved-jobs`, `/match`, `/u/[slug]`.

## 4. Auditoría por pantalla

### 4.1 Landing (`/`)

- **Objetivo**: presentar la propuesta candidate-first y llevar a registro.
- **Fortalezas**: propuesta de valor clara y honesta; separación explícita "Disponible en el
  MVP" vs "No disponible"; preview de producto creíble con datos ficticios; CTA principal
  repetido con criterio.
- **Problemas**: identidad propia (oscura, gradientes sky/emerald) distinta de la app
  (VIS-01, P2); el módulo "JobIT Talent" solo existe aquí — dentro de la app se llama
  Dashboard (LAND-01, P3).
- **Evidencia**: capturas `desktop/01-landing`, `mobile/01-landing`;
  [apps/web/src/app/page.tsx](../../apps/web/src/app/page.tsx) (gradiente del logo en línea 118).
- **Recomendación MVP**: mantener la landing oscura como variante aprobada de la identidad
  única; alinear logo/gradiente/tokens y el naming del módulo.

### 4.2 Login y Register (`/login`, `/register`)

- **Fortalezas**: labels correctos, requisitos de contraseña visibles de antemano y
  validados en vivo con ✓; error de credenciales claro y **anunciado en live region**
  ("Email o contraseña incorrectos."); validación de confirmación visible junto al campo;
  alternancia Login↔Register y "← Volver a inicio"; móvil correcto.
- **Problemas**: "Acceso con Google: próximamente." es un anuncio no accionable
  ([auth-form-shell.tsx:84](../../apps/web/src/features/auth/auth-form-shell.tsx), AUTH-01,
  P3); las páginas de auth **no tienen landmarks** (`main` ausente; A11Y-02, P2); el error
  de register no se anuncia en live region (A11Y-05, P3).
- **Evidencia**: capturas `desktop/02-login`, `desktop/03-register`,
  `error-login-invalido`, `error-register-validacion`.
- **Recomendación MVP**: envolver el formulario en `main`, retirar el copy "próximamente" y
  anunciar el error de register como ya hace login.

### 4.3 Dashboard (`/dashboard`)

- **Objetivo** (spec `dashboard.md` 17C): hub con estado real y próximos pasos accionables.
- **Fortalezas**: contrato 17C completo y visible — checklist real por secciones, preview
  del CV con datos reales y placeholders honestos, portfolio con estado (Sin configurar /
  Publicado con enlace), métricas clicables, `nextActions` correctas; skeleton y error con
  retry verificados ("No se ha podido cargar tu panel." + Reintentar).
- **Problemas**: con perfil vacío muestra "3 Matches" y "Tus mejores matches" al 0 % — el
  empty state "Sin matches" previsto en la spec es **inalcanzable** porque el backend
  puntúa todas las ofertas (parte de MATCH-01, P1); CTA "Preparar JobIT CV" ×3 (hero,
  acción rápida y pie del sidebar; NAV-01, P2); header con identidad estática
  "Candidato tech / CT" junto a "Hola, &lt;nombre&gt;" (NAV-02, P1); badge "MVP
  candidate-first" en el header (VIS-09, P1); badge "Siguiente" superpuesto al texto en
  móvil (DASH-04, P2).
- **Evidencia**: capturas `desktop/04-dashboard-inicial`, `desktop/13-dashboard-poblado`,
  `mobile/04-dashboard`; [site-shell.tsx](../../apps/web/src/components/layout/site-shell.tsx)
  (badge en 355-357, identidad en 358-363, CTA del sidebar en 211-217);
  [dashboard-content.tsx](../../apps/web/src/features/dashboard/dashboard-content.tsx)
  (badge absoluto en 616-623).
- **Recomendación MVP**: umbral de presentación para los matches del hub (con MATCH-01),
  deduplicar el CTA, nombre real en el header y retirar el badge interno.

### 4.4 Profile / JobIT CV (`/profile`)

- **Fortalezas**: las 7 secciones de la spec M02 completas; guardado parcial por sección;
  progreso coherente (43 % = 3/7 verificado); feedback "Cambios guardados"; skills con alta
  y borrado al vuelo; placeholders con ejemplos; avatar con subida + URL avanzada y copy
  5 MB (17C); loading/error con retry verificados.
- **Problemas**: **modelos de guardado mixtos sin señalización** — botón global "Guardar
  cambios" para datos básicos, alta instantánea en skills/experiencia/educación/proyectos,
  y botones propios "Guardar enlaces"/"Guardar preferencias" (PROF-01, P2); labels "Fecha
  de inicio/fin" duplicados entre Experiencia y Educación sin `fieldset/legend` (asociación
  label-input correcta; ambigüedad leve para tecnología asistiva — PROF-02, P3); en móvil el
  progreso y la vista previa quedan al final de un scroll muy largo (RESP-03, P2); doble
  `h1` (título del shell + título de contenido; A11Y-04, P3).
- **Evidencia**: capturas `desktop/05-profile-inicial`, `desktop/10-profile-poblado`,
  `mobile/06-profile`;
  [profile-experience-section.tsx](../../apps/web/src/features/profile/profile-experience-section.tsx)
  (labels en 124-181).
- **Recomendación MVP**: microcopy "se guarda al añadir" en las secciones de alta
  instantánea y reordenar el apilado móvil. **No** se recomienda rediseñar la página con
  tabs/acordeones: la longitud por sí sola no es un defecto (decisión del Director) y el
  impacto observable no lo justifica.

### 4.5 Portfolio privado (`/profile/portfolio`)

- **Fortalezas**: preview fiel del CV publicable; acciones claras ("← Volver a editar",
  "Gestionar publicación", "Imprimir / Guardar PDF" con consejo de impresión útil); estado
  vacío honesto que remite al CV.
- **Problemas**: ninguno relevante propio. Doble `h1` compartido con el patrón del shell
  (A11Y-04, P3).
- **Evidencia**: capturas `desktop/06-portfolio-privado-inicial`,
  `desktop/11-portfolio-privado-poblado`, `mobile/07-portfolio-privado`.
- **Recomendación MVP**: mantener como referencia de calidad del producto.

### 4.6 Portfolio settings (`/profile/portfolio/settings`)

- **Fortalezas**: el flujo más redondo del MVP — estado con badge, requisitos de
  publicación explícitos, aviso de privacidad previo a publicar, slug editable con reglas y
  consecuencias, QR con descarga, visibilidad granular (preferencias desactivadas por
  defecto: buena decisión con dato sensible), "Ver preview privada", feedback en cada
  acción; error de carga con retry verificado.
- **Problemas**: sin retorno explícito "← Volver al portfolio" (PORT-01, P3); slug por
  defecto impersonal `user-<hash>` cuando ya se conoce el nombre (PORT-02, P3).
- **Evidencia**: capturas `desktop/07-portfolio-settings-sin-publicar`,
  `desktop/12-portfolio-settings-publicado`, `mobile/08-portfolio-settings`,
  `error-portfolio-settings`.
- **Recomendación MVP**: solo los dos ajustes menores; no tocar nada más.

### 4.7 Portfolio público (`/u/[slug]`)

- **Fortalezas**: limpio, coherente con la preview privada, imprimible, "Generado con
  JobIT"; único `h1` correcto (el nombre); funciona idéntico en móvil.
- **Problemas**: ninguno dentro del alcance MVP (el CTA de adquisición queda expresamente
  fuera por decisión del Director).
- **Evidencia**: capturas `desktop/19-portfolio-publico`, `mobile/13-portfolio-publico`.
- **Recomendación MVP**: no cambiar.

### 4.8 Jobs (`/jobs`)

- **Fortalezas**: filtros según spec (texto, ubicación, modalidad, seniority, contrato);
  cards uniformes con fuente y fecha; no-results verificado en vivo ("No hay ofertas que
  coincidan con tu búsqueda." + "Limpiar filtros" que restaura el listado); loading con
  skeletons y error con retry funcional verificados.
- **Problemas**: **JOBS-01 (P1, funcional)** — la spec exige paginación y la API la
  implementa (límite 20 por defecto), pero la UI **no expone ningún control**: se declaran
  "56 ofertas", se renderizan 20 y el resto es inaccesible salvo filtrado (verificado en
  vivo; [jobs-page.tsx](../../apps/web/src/features/jobs/jobs-page.tsx) fija `page: 1` en
  la línea 91 y nada la cambia). **JOBS-02 (P1)** — metadatos con triple "desconocido" y
  mezcla de idiomas: "Sin especificar · Cualquiera · Unspecified" en la mayoría de cards de
  ofertas ingeridas ([jobs-format.ts:24-38](../../apps/web/src/features/jobs/jobs-format.ts):
  `formatContractType` no mapea `UNSPECIFIED` y lo emite en inglés;
  [job-card.tsx:59-61](../../apps/web/src/features/jobs/job-card.tsx) muestra siempre las
  tres dimensiones). **RESP-01 (P1)** — en 390 px los títulos se truncan a una línea
  perdiendo la información esencial (`truncate` en
  [job-card.tsx:34](../../apps/web/src/features/jobs/job-card.tsx)). Contraste del texto
  informativo `slate-400` insuficiente (A11Y-03, P2).
- **Evidencia**: capturas `desktop/14-jobs-listado`, `mobile/09-jobs-listado`,
  `jobs-no-results`, `error-jobs`, `loading-jobs`; verificación en vivo 20/56.
- **Recomendación MVP**: microsprint propio de paginación (mini-spec) + fixes de formato.

### 4.9 Detalle de oferta (`/jobs/[id]`)

- **Fortalezas**: información completa, "← Volver a ofertas", guardar/quitar con feedback y
  estado del botón, CTA externo explícito ("Abrir en Jooble") con validación de URL segura,
  panel de match integrado con desglose por factores; 404 excelente ("Oferta no
  disponible · Esta oferta no existe o ya no está activa · ← Volver a ofertas",
  verificado por interceptación).
- **Problemas**: **JOBS-03 (P1)** — la explicación muestra el enum crudo: "Afinidad
  VERY_LOW con una puntuación de 0/100" (el texto viene de la API; el mapeo "Muy baja" ya
  existe en [match-format.ts:9](../../apps/web/src/features/match/match-format.ts));
  **JOBS-05 (P2)** — cuando la oferta carece de datos, el desglose dice "La oferta no
  especifica skills" pero la explanation pide "Completa tu perfil": la spec de match
  distingue explícitamente ambos casos y aquí el mensaje culpa al perfil.
- **Evidencia**: capturas `desktop/15-job-detalle`, `desktop/16-job-detalle-guardada`,
  `mobile/10-job-detalle`, `error-detalle-404`.
- **Recomendación MVP**: componer la frase de afinidad en frontend a partir de
  `matchLevel`; ajustar el copy de datos ausentes.

### 4.10 Saved Jobs (`/saved-jobs`)

- **Fortalezas**: vacío con CTA correcto; guardado/quitado reflejado al instante con
  feedback accesible; card consistente con Jobs; error con retry verificado.
- **Problemas**: "1 guardadas" sin concordancia
  ([saved-jobs-page.tsx:111](../../apps/web/src/features/saved-jobs/saved-jobs-page.tsx);
  VIS-04, P3); **SAVED-02 (P2, gap de spec verificado por código)** — la spec exige marcar
  como "no disponible" las guardadas cuya oferta se cierra/expira y la API expone
  `status`/`expiresAt` para derivarlo, pero la UI reutiliza `JobCard`, que **no renderiza
  ninguno de los dos campos**, y ningún test lo cubre. No demostrable en runtime sin alterar
  datos (prohibido en esta auditoría); pendiente de mini-spec + test con fixture, sin tocar
  el seed.
- **Evidencia**: capturas `desktop/08-saved-jobs-vacio`, `desktop/17-saved-jobs-poblado`,
  `mobile/11-saved-jobs`, `error-saved`.
- **Recomendación MVP**: corregir plural (barato) y programar SAVED-02 como deuda con test.

### 4.11 Match (`/match`)

- **Fortalezas**: disclaimer honesto y bien escrito (sin apariencia de IA); scoring
  explicable con "Skills que coinciden / que podrías sumar"; guardar desde match con
  feedback; loading ("Calculando tus matches") y error con retry verificados; coherente con
  dashboard y detalle.
- **Problemas**: **MATCH-01 (P1)** — con perfil sin skills se listan 20 tarjetas al 0/100,
  cada una con el mismo aviso repetido ("El backend ordena esta oferta por una puntuación
  básica; añade skills…"): cumple la letra de la spec ("indicador muy bajo con mensaje
  orientativo") pero la experiencia es ruido sin valor; **MATCH-02 (P2)** — la spec exige
  que los **pesos** (skills 50, modalidad 20, seniority 20, ubicación 10) sean visibles y
  la UI solo nombra los factores; plural "1 ofertas ordenadas por afinidad" fijado incluso
  por test ([match-page.tsx:164](../../apps/web/src/features/match/match-page.tsx) y
  [match-page.test.tsx:128](../../apps/web/src/features/match/match-page.test.tsx);
  VIS-04, P3); expectativa de escala "50/100 = Afinidad Baja" (regla documentada del
  backend; solo copy — MATCH-04, P3).
- **Evidencia**: capturas `desktop/09-match-inicial`, `desktop/18-match-poblado`,
  `mobile/12-match`, `error-match`, `loading-match`.
- **Recomendación MVP**: mini-spec frontend-only — estado guía cuando no hay skills,
  agrupar/colapsar los 0 % y añadir la explicación única de pesos al inicio de la página
  (decisión del Director). **No tocar el algoritmo ni la API** salvo nueva evidencia.

## 5. Auditoría del flujo candidato

Recorrido completo verificado sin puntos muertos: siempre hay retorno o sidebar, cada acción
mutante produce feedback visible y accesible, y el logout limpia la sesión y redirige a
`/login`. Dos fricciones transversales:

- **FLOW-02 (P2)**: recargar una ruta privada devuelve a `/login` **sin ninguna
  explicación** (verificado). Es la decisión documentada de ADR-0006 (sesión solo en
  memoria) funcionando según diseño — no un bug — pero en una demo un F5 parece un cierre de
  sesión espontáneo. Mitigación recomendada **frontend-only** (aviso "Tu sesión ha
  finalizado" al aterrizar en login por pérdida de sesión), sin cambiar persistencia ni
  auth en este roadmap.
- La redundancia del CTA de CV (NAV-01) es la única acción repetida relevante.

Los títulos de página no siempre coinciden con el enlace de origen ("JobIT Jobs" → "Ofertas
tech"); es asumible y está documentado hasta en los helpers E2E.

## 6. Consistencia e identidad visual

Existen **dos sistemas visuales**: landing/auth (fondo `slate-950`, gradientes
sky→emerald) y aplicación + portfolio público (claro, tokens `jobit-*` teal). El propio
logo "J" usa dos gradientes distintos
([page.tsx](../../apps/web/src/app/page.tsx) línea 118 vs
[site-shell.tsx](../../apps/web/src/components/layout/site-shell.tsx) línea 98). Cada
sistema es internamente sólido; el problema es el salto al pasar de register a dashboard.

**Dirección aprobada por el Director**: landing/auth pueden seguir oscuras y la app clara,
pero como **variantes de una única identidad JobIT** — mismos tokens de marca, mismo logo,
mismo gradiente, mismo lenguaje visual (VIS-01, P2). Dentro de la app la consistencia es
buena: los tokens `jobit-*` de 17D/17E se aplican de forma uniforme y no quedan hex de marca
sueltos en las features auditadas.

**Light-only**: el media query `prefers-color-scheme: dark` de
[globals.css:30-35](../../apps/web/src/app/globals.css) cambia el fondo del `body` pero
todas las páginas pintan superficies claras encima — hoy no produce defecto visible
(verificado en landing, login, dashboard y público) pero es un riesgo latente incoherente
con la decisión light-only del MVP: retirarlo (VIS-08, P2).

## 7. Navegación y arquitectura de información

Sidebar/drawer con fuente única y estado activo correcto (regla del prefijo más largo,
17C); jerarquía Dashboard → módulos clara; settings de portfolio correctamente subordinado
al Portfolio (aunque sin miga/retorno explícito); logout siempre visible; enlaces externos
identificados sin ambigüedad. Las deudas: CTA "Preparar JobIT CV" competitivo y casi
homónimo del ítem "JobIT CV" (NAV-01, P2), identidad estática del header (NAV-02, P1) y el
meta-badge "MVP candidate-first" (VIS-09, P1) que resta sensación de producto terminado.

## 8. Accesibilidad básica

Base muy sólida (verificada con checks DOM en 11 páginas): 0 inputs sin label, 0 controles
sin nombre accesible, 0 imágenes sin alternativa, foco visible en el 100 % de los tab stops
muestreados, landmarks correctos en la zona privada, live regions reales en acciones y en
estados de carga/error. Deudas concretas:

- **A11Y-01 (P2)**: el drawer móvil abre con teclado pero el foco no se mueve al dialog y
  **Escape no lo cierra** (sí su botón).
- **A11Y-02 (P2)**: `/login` y `/register` no tienen ningún landmark (`main` ausente).
- **A11Y-03 (P2)**: los textos informativos `text-slate-400` sobre blanco (~2,6:1) no
  alcanzan AA (p. ej. "Fuente: Jooble · fecha" en las cards).
- **A11Y-04 (P3)**: `h1` dobles (profile, portfolio, detalle) y saltos H1→H3.
- **A11Y-05 (P3)**: el error de register no se anuncia en live region (login sí).
- **PROF-02 (P3)**: formularios de alta sin `fieldset/legend` con labels de fecha repetidos.

Este informe **no afirma cobertura WCAG completa**: axe no está instalado y la revisión fue
manual + checks propios sobre muestras representativas.

## 9. Responsive

- **Móvil (390×844)**: adaptación estructural correcta (columna única, drawer con dialog,
  formularios y settings bien apilados, targets ≥40 px). Deudas: títulos de oferta
  truncados a una línea (RESP-01, P1), badge "Siguiente" superpuesto (DASH-04, P2), y
  progreso/preview del CV al final del scroll (RESP-03, P2). Las páginas largas **no** se
  consideran defecto por sí mismas (decisión del Director).
- **Tablet (768×1024)**: el punto débil real — en el límite exacto del breakpoint `md`
  conviven **sidebar fija y botón hamburguesa**, el header se comprime con solapes de
  título/badge y hay **overflow horizontal medido** en Dashboard (TAB-01, P1; evidencia
  `tablet-dashboard`). El resto de páginas no desbordan.
- **Desktop (1440)**: sin problemas de layout.

## 10. Matriz de hallazgos P0/P1/P2/P3

Los IDs absorbidos por fusión de fases figuran entre paréntesis del ID canónico.

### P0 — bloqueos

**Ninguno.**

### P1 — corregir antes de demo pública

| ID | Área | Hallazgo | Impacto | Evidencia | Mini-spec | Sprint |
|---|---|---|---|---|---|---|
| JOBS-01 | /jobs | Paginación sin exponer en UI: 56 declaradas, 20 accesibles | Funcional: contenido inaccesible | Verificación en vivo; `jobs-page.tsx:91` | **Sí** | 21B |
| MATCH-01 (VIS-05, VIS-06, DASH-01) | /match, /dashboard | Perfil sin skills → 20 cards 0/100 con aviso repetido; hub muestra "mejores matches" al 0 % (empty state de spec inalcanzable) | Primera experiencia ruidosa y confusa | `desktop/09-match-inicial`, `desktop/04-dashboard-inicial` | **Sí** (frontend-only) | 21C |
| JOBS-02 (VIS-03) | cards de oferta | "Sin especificar · Cualquiera · Unspecified" (triple desconocido, mezcla de idiomas) | Afecta a casi todas las cards ingeridas | `jobs-format.ts:24-38`, `job-card.tsx:59-61` | No | 21A |
| JOBS-03 (VIS-02) | detalle oferta | Enum crudo "Afinidad VERY_LOW…" visible (texto de API; mapeo existente en FE) | Rompe la ilusión de producto | `match-format.ts:9`; captura `desktop/15-job-detalle` | No | 21A |
| RESP-01 (JOBS-04) | móvil | Títulos de oferta truncados a 1 línea | Se pierde la información principal | `job-card.tsx:34`; `mobile/09-jobs-listado` | No | 21A |
| TAB-01 | tablet 768 px | Sidebar+hamburguesa simultáneos; header comprimido con solapes; overflow-x | Layout roto en el breakpoint exacto | `tablet-dashboard`; overflow medido | No | 21D |
| VIS-09 | header privado | Badge interno "MVP candidate-first" en todas las páginas | Meta-copy de desarrollo en producto | `site-shell.tsx:355-357` | No | 21A |
| NAV-02 (DASH-03) | header privado | Identidad estática "Candidato tech / CT" con nombre real disponible | Contradice el saludo personalizado | `site-shell.tsx:358-363` | No | 21D |

### P2 — importante, no bloqueante

| ID | Área | Hallazgo | Evidencia | Mini-spec | Sprint |
|---|---|---|---|---|---|
| VIS-01 | global | Doble identidad landing/auth ↔ app; logo con 2 gradientes. Dirección aprobada: variantes de una única identidad | `page.tsx:118`, `site-shell.tsx:98` | Sí (dirección visual) | 21D |
| FLOW-02 | sesión | F5 → /login sin explicación (ADR-0006). Mitigación informativa frontend-only; no cambiar auth | `session-reload` (evidencia temporal) | No | 21D |
| NAV-01 (DASH-02) | dashboard/sidebar | CTA "Preparar JobIT CV" ×3, casi homónimo del ítem "JobIT CV" | `site-shell.tsx:211-217` | No | 21D |
| MATCH-02 | /match | Pesos 50/20/20/10 no visibles (la spec los exige); resolver con explicación única al inicio | `match-page.tsx` cabecera | Con 21C | 21C |
| PROF-01 | /profile | Modelos de guardado mixtos sin señalización | capturas profile | No | 21E |
| SAVED-02 | /saved-jobs | Indicador "no disponible" de spec no implementado (gap verificado por código; sin test) | `saved-jobs-page.tsx:114-118` + `job-card.tsx` | **Sí** + test fixture | 21E |
| DASH-04 (RESP-02) | dashboard móvil | Badge "Siguiente" superpuesto al texto | `dashboard-content.tsx:616-623` | No | 21D |
| RESP-03 (PROF-03) | /profile móvil | Progreso/preview al final del scroll | `mobile/06-profile` | No | 21D |
| A11Y-01 | drawer móvil | Foco no entra al dialog; Escape no cierra | verificación teclado | No | 21E |
| A11Y-02 | /login, /register | Sin landmarks (`main` ausente) | checks DOM | No | 21E |
| A11Y-03 | textos pequeños | `slate-400` sobre blanco ≈2,6:1 (falla AA) | `job-card.tsx:79` y similares | No | 21E |
| JOBS-05 | detalle oferta | "Completa tu perfil" cuando el dato ausente es de la oferta | captura detalle + spec match | Con 21C | 21C |
| VIS-08 | globals.css | Media query dark accidental (MVP light-only) | `globals.css:30-35` | No | 21A |

### P3 — polish posterior

| ID | Hallazgo | Sprint |
|---|---|---|
| VIS-04 (SAVED-01, MATCH-03) | Plurales "1 guardadas" / "1 ofertas" (test fija el plural erróneo: `match-page.test.tsx:128`) | 21A |
| AUTH-01 (VIS-07) | "Acceso con Google: próximamente." no accionable (`auth-form-shell.tsx:84`) | 21A |
| PORT-01 (NAV-03) | Sin "← Volver al portfolio" desde settings | 21D |
| PORT-02 | Slug por defecto impersonal; sugerir slug legible | 21E |
| LAND-01 | "JobIT Talent" solo existe en la landing | 21A |
| MATCH-04 | Copy de escala ("50/100 = Baja" sorprende) | 21C |
| PROF-02 | Formularios de alta sin `fieldset/legend` | 21E |
| A11Y-04 | `h1` dobles y saltos de nivel de headings | 21E |
| A11Y-05 | Error de register sin live region | 21E |

**Descartados** (no son hallazgos): formato de fecha del navegador de test, botón "N" de
Next dev, cortes de elementos `fixed` en capturas fullPage, colisión de strict mode del
drawer como fallo a11y, longitud de páginas per se, CTA comercial en portfolio público,
dark mode completo.

## 11. Dirección UX/UI recomendada

1. **Candidate-first sin ruido**: cada pantalla debe responder "¿qué gano yo como
   candidato y qué hago ahora?"; eliminar meta-copy de desarrollo (VIS-09) y datos sin
   valor (triple "desconocido" de JOBS-02).
2. **Una identidad, dos variantes**: app privada clara (como está) y landing/auth oscuras,
   compartiendo tokens, logo y gradiente JobIT (VIS-01).
3. **Estados guía antes que resultados vacíos**: cuando el sistema no puede aportar señal
   (match sin skills), guiar en lugar de listar ceros (MATCH-01).
4. **Claridad de datos y acciones**: un CTA primario por vista; metadatos solo cuando
   informan; explicaciones en lenguaje de usuario, nunca enums.
5. **Accesibilidad y responsive como parte del sistema**, no como parche: landmarks,
   foco, contraste y breakpoints se corrigen dentro de los sprints normales.
6. **No convertir el producto en un dashboard recargado**: la sobriedad actual es una
   fortaleza; el objetivo es pulir, no añadir densidad visual.

## 12. Sistema visual ligero propuesto

Foundations mínimas, sin dependencias nuevas y sin librería de componentes:

- **Color**: los 8 tokens `jobit-*` existentes en
  [globals.css:19-28](../../apps/web/src/app/globals.css) como única fuente para color de
  marca; añadir (cuando toque 21D) los 2-3 tokens que necesite la variante oscura de
  landing/auth para eliminar los sky/emerald sueltos. Ningún hex de marca fuera de tokens.
- **Tipografía y escala**: mantener la actual (system stack + escala Tailwind); regla: un
  `h1` por página (el título de contenido), el título del shell pasa a elemento no-heading.
- **Espaciado y radios**: seguir con la escala Tailwind ya usada (`rounded-lg/xl/2xl`
  según nivel: control < card < panel); documentarlo como convención, no como código nuevo.
- **Sombras**: `shadow-sm` para cards en reposo, `shadow-md` en hover; nada más.
- **Botones**: primario `bg-jobit-brand → hover:bg-jobit-brand-dark`; secundario borde
  `slate-200`; los pills de acción en cards (Guardar/Quitar) mantienen su patrón actual.
- **Cards y badges**: card = borde `slate-200` + fondo blanco; badge informativo =
  `jobit-brand-soft`/`text-jobit-brand`; badge de estado positivo = verde actual. Los
  badges nunca se superponen al contenido (reserva de espacio, DASH-04).
- **Estados de feedback**: `LoadingState`/`ErrorState`/`EmptyState` de
  [feedback.tsx](../../apps/web/src/components/ui/feedback.tsx) como único mecanismo; todo
  error de carga ofrece Reintentar; todo empty ofrece un CTA.
- **Landmarks/headings**: `main` obligatorio en toda página (incluida auth), nav con
  `aria-label`, jerarquía sin saltos.
- **Breakpoints**: móvil <768, tablet 768-1023 (decidir explícitamente si muestra sidebar
  o drawer — hoy muestra ambos), desktop ≥1024.
- **Copy y metadatos**: español consistente (nunca enums ni inglés residual), plurales
  correctos, y regla "si el dato es desconocido, se omite" en metadatos de cards.

## 13. Qué NO cambiar todavía

- El **algoritmo del match** y sus endpoints (solo presentación; MATCH-01/02 son frontend).
- La **arquitectura de auth / ADR-0006** (sesión en memoria): FLOW-02 se mitiga con copy.
- El **backend** en general, salvo necesidad demostrada (única candidata: el texto
  `explanation` si se decide corregirlo en origen en vez de mapearlo en FE).
- El **portfolio público**: funciona bien; sin CTA comercial en el MVP.
- **Dark mode completo**: light-only; solo retirar el media query accidental.
- El **diseño de Profile con tabs/acordeones**: sin evidencia de necesidad.
- **Nuevas features**, design system grande o librerías de componentes.
- **Deploy/infra** (sigue pausado), **APIs externas** y el **seed** de desarrollo.

## 14. Próximos sprints propuestos

### Sprint 21A — Demo Readiness Quick Fixes

- **Objetivo**: eliminar en una sola pasada de bajo riesgo los defectos visibles de copy y
  formato que delatan "producto sin terminar".
- **Hallazgos**: JOBS-02, JOBS-03, RESP-01, VIS-09, VIS-08, VIS-04, AUTH-01, LAND-01.
- **Archivos probables**: `jobs-format.ts`, `job-card.tsx`, `match-card.tsx`,
  `job-match-panel.tsx` (composición de la frase de afinidad), `site-shell.tsx` (badge),
  `globals.css` (media query), `saved-jobs-page.tsx`, `match-page.tsx` (+ sus tests),
  `auth-form-shell.tsx`, `app/page.tsx` (naming del módulo).
- **Tests mínimos**: actualizar los RTL afectados (incluido `match-page.test.tsx:128`, que
  hoy fija el plural erróneo) y añadir casos de plural/`UNSPECIFIED`/nivel legible.
- **Fuera de alcance**: JOBS-01, MATCH-01, backend, dependencias, rediseños.
- **Dependencias**: ninguna; puede empezar ya.

### Sprint 21B — Jobs Pagination UX (mini-spec)

- **Objetivo**: exponer la paginación existente de la API en `/jobs` (JOBS-01).
- **Mini-spec**: decidir patrón (paginación clásica vs "cargar más"), interacción con
  filtros y contador, estados de carga incremental y accesibilidad del control.
- **Archivos probables**: `jobs-page.tsx`, `jobs-api.ts`, tests RTL del listado; opcional
  ampliación del spec E2E de jobs.
- **Tests mínimos**: cambio de página/carga incremental, interacción con filtros y
  no-results, contador coherente.
- **Fuera de alcance**: backend (la API ya pagina), ordenación, nuevos filtros.
- **Dependencias**: ninguna técnica; después de 21A para no pisar `job-card`.

### Sprint 21C — Match Empty/Incomplete Profile UX (mini-spec)

- **Objetivo**: experiencia digna de Match con perfil incompleto, sin tocar algoritmo ni
  API (MATCH-01, MATCH-02, JOBS-05, MATCH-04).
- **Mini-spec**: estado guía cuando `skills.length === 0` (CTA al perfil), presentación de
  resultados 0/100 (agrupar/colapsar, aviso único en vez de ×20), explicación única de
  reglas y **pesos** al inicio de `/match`, umbral de presentación de "Tus mejores matches"
  en el dashboard, y copy de datos ausentes de la oferta.
- **Archivos probables**: `match-page.tsx`, `match-card.tsx`, `dashboard-content.tsx`,
  `job-match-panel.tsx` + tests.
- **Tests mínimos**: estado guía sin skills, agrupación de ceros, pesos visibles, hub sin
  matches presentables.
- **Fuera de alcance**: scoring, endpoints, pesos del algoritmo.
- **Dependencias**: 21A (frase de afinidad ya legible).

### Sprint 21D — Identity, Navigation & Responsive Alignment

- **Objetivo**: una sola identidad JobIT y shell sólido en todos los anchos (VIS-01,
  NAV-01, NAV-02, FLOW-02, TAB-01, DASH-04, RESP-03, PORT-01).
- **Archivos probables**: `globals.css` (tokens de la variante oscura), `app/page.tsx` y
  auth (logo/gradiente unificados), `site-shell.tsx` (header con nombre real, breakpoint
  tablet, CTA del pie), `dashboard-content.tsx`, `profile-page.tsx` (orden móvil),
  `login`/`auth-context` (aviso de sesión finalizada) + tests.
- **Tests mínimos**: header con nombre real, aviso de sesión, shell en 768 px sin doble
  navegación (test de clases/breakpoint), badge sin solape.
- **Fuera de alcance**: dark mode, persistencia de sesión, rediseño de landing.
- **Dependencias**: decisiones visuales de la sección 11; idealmente tras 21A–21C.

### Sprint 21E — Accessibility & Remaining UX Debt

- **Objetivo**: cerrar la deuda a11y y los gaps restantes (A11Y-01…05, PROF-01, PROF-02,
  SAVED-02, PORT-02).
- **Archivos probables**: `site-shell.tsx` (focus management + Escape del drawer),
  layouts de auth (`main`), tokens de texto informativo (contraste), secciones de profile
  (`fieldset/legend`, microcopy de autosave), `job-card.tsx`/`saved-jobs-page.tsx`
  (indicador "no disponible", con mini-spec y fixture de test, sin tocar seed).
- **Tests mínimos**: drawer con teclado, landmarks, live region de register, indicador de
  oferta no disponible con fixture.
- **Fuera de alcance**: axe en CI (requiere autorización de dependencia; puede proponerse
  como ADR aparte).
- **Dependencias**: 21D (toca el mismo shell).

## 15. Recomendación sobre Figma, Canva y Gamma

- **Figma**: sí, pero **solo si el Sprint 21D lo necesita** para wireframes del puente de
  identidad o para documentar tokens/componentes. No antes, y no para re-diseñar pantallas
  que ya funcionan.
- **Canva**: opcional para un moodboard ligero o una presentación ejecutiva de estas
  conclusiones; **no** para diseñar UI del producto.
- **Gamma**: no necesario; este informe Markdown cumple la función documental.
- **No se crea ningún asset todavía** (ninguna herramienta se ha usado en este sprint).

## 16. Prompt sugerido para continuar

Prompt copiable para el siguiente paso:

```text
PROMPT PARA CLAUDE — Sprint 21A · Demo Readiness Quick Fixes

Modo: Execution Mode con SDD. Cambios pequeños, revisables y de bajo riesgo.

Contexto: auditoría Sprint 21 aprobada (docs/sprints/sprint-21-ux-ui-audit-report.md).
Este sprint implementa SOLO los quick fixes de demo-readiness. JOBS-01 (paginación) y
MATCH-01 (match sin skills) tienen microsprints propios (21B y 21C) y NO entran aquí.

Antes de tocar nada:
1. cd /home/david/projects/JobIT-platform && pwd
2. git checkout dev && git pull --ff-only origin dev
3. git checkout -b feat/sprint-21a-demo-readiness-quick-fixes
4. git status --short (limpio) y confirmar rama.

Alcance (hallazgos del informe, sección 10):
- JOBS-02: mapear UNSPECIFIED en formatContractType (jobs-format.ts) y omitir en la línea
  de metadatos de job-card.tsx toda dimensión sin dato real (nada de "Sin especificar ·
  Cualquiera · Unspecified" encadenados).
- JOBS-03: componer la frase de afinidad en frontend con el nivel legible de
  match-format.ts (sin mostrar VERY_LOW/LOW/GOOD/VERY_GOOD crudos); no tocar la API.
- RESP-01: títulos de oferta con line-clamp-2 en vez de truncate (job-card y match-card).
- VIS-09: retirar el badge "MVP candidate-first" del header de site-shell.tsx.
- VIS-08: retirar el media query prefers-color-scheme: dark de globals.css (MVP
  light-only, decisión del Director).
- VIS-04: concordancia singular/plural en "N guardadas" (saved-jobs-page.tsx) y
  "N ofertas ordenadas por afinidad" (match-page.tsx); actualizar el test que fija el
  plural erróneo (match-page.test.tsx).
- AUTH-01: retirar "Acceso con Google: próximamente." (auth-form-shell.tsx).
- LAND-01: en la landing, alinear el naming del módulo "JobIT Talent" con el producto
  real ("Dashboard" / "Tu panel de candidato").

Flujo SDD por hallazgo: revisar el punto correspondiente del informe → ajustar/añadir
tests mínimos RTL primero cuando aplique → implementar → verificar.

Verificaciones obligatorias al cierre:
- pnpm --filter @jobit/web typecheck && pnpm --filter @jobit/web lint
- pnpm --filter @jobit/web test (suite completa en verde; tests nuevos/ajustados incluidos)
- pnpm --filter @jobit/web build (protocolo dev-server: parar next dev antes, relanzar
  con setsid nohup después y comprobar :3000 y :4000/health)
- grep de verificación: cero "Unspecified", cero "MVP candidate-first", cero
  "próximamente", cero prefers-color-scheme en apps/web/src.

Prohibido: apps/api/**, Prisma, package.json, pnpm-lock.yaml, dependencias nuevas,
cambios de arquitectura o de contrato API, JOBS-01, MATCH-01, rediseños, .env*,
docker/**, .github/**. Sin commit, push ni PR (cierre Git solo con autorización
posterior y conforme a docs/agents/git-pr-skill.md).

Salida esperada: resumen por hallazgo (archivos, diff aproximado, tests), verificaciones
ejecutadas con resultados exactos y riesgos. Estado final: SPRINT_21A_READY_FOR_REVIEW.
```

---

*Informe generado en el Sprint 21 (fases 21.0–21.4) sobre `dev` @ `c3dba32` (post-17E).
Evidencia visual en directorio temporal local del operador; no versionada.*
