# Informe final — Sprint 21 Candidate UX/UI Audit & Design Direction

## 1. Resumen ejecutivo

El Sprint 21 partió de una **auditoría UX/UI del flujo candidato** (PR #88,
[`sprint-21-ux-ui-audit-report.md`](sprint-21-ux-ui-audit-report.md)) que catalogó los
hallazgos por pantalla y prioridad (P1/P2/P3) con una taxonomía estable (`TAB-`, `NAV-`,
`VIS-`, `FLOW-`, `DASH-`, `RESP-`, `PORT-`, `JOBS-`, `MATCH-`, `SAVED-`). De esa auditoría
se derivaron **cuatro lotes de remediación** (21A–21D), todos **frontend-only**, bajo
disciplina **TDD RED→GREEN**, cambios pequeños y revisables, y verificación local + CI.

Al cierre, los **5 PRs están MERGED en `dev`** con **CI en verde**. La zona candidato queda
alineada en identidad, navegación, responsive y UX de match/jobs, **sin tocar backend,
Prisma, DTO, scoring ni ADR-0006**.

**Sprint 21: PASS.**

## 2. Objetivo inicial

Auditar la experiencia candidato de extremo a extremo y **remediar los hallazgos
accionables de mayor impacto** con cambios de presentación frontend, sin rediseño, sin
tocar contratos backend y sin añadir dependencias. La auditoría fijó además la dirección de
diseño (naming del producto, marca, jerarquía de CTAs y contrato responsive del shell).

## 3. Trabajo realizado por lotes

| Lote | PR | Título | Tamaño | Merge | Fecha |
|---|---|---|---|---|---|
| Auditoría | [#88](https://github.com/David-LS-Bilbao/JobIT-platform/pull/88) | Sprint 21 UX/UI audit & design direction | — | `5708180` | — |
| **21A** | [#89](https://github.com/David-LS-Bilbao/JobIT-platform/pull/89) | `fix(web): polish candidate demo readiness` | +278/−56, 23f | `b2f9347` | 2026-07-15 |
| **21B** | [#90](https://github.com/David-LS-Bilbao/JobIT-platform/pull/90) | `feat(web): add jobs pagination controls` | +372/−4, 2f | `fd96891` | 2026-07-16 |
| **21C** | [#91](https://github.com/David-LS-Bilbao/JobIT-platform/pull/91) | `feat(web): improve match UX for incomplete profiles` | +774/−31, 8f | `6159b93` | 2026-07-20 |
| **21D** | [#92](https://github.com/David-LS-Bilbao/JobIT-platform/pull/92) | `feat(web): improve identity and responsive navigation` | +1389/−166, 39f | `5001910` | 2026-07-22 |
| **21D (doc)** | [#93](https://github.com/David-LS-Bilbao/JobIT-platform/pull/93) | `docs(web): clarify drawer focus containment` | +3/−2, 1f | `ec71e19` | 2026-07-22 |

### 21A — Demo readiness (PR #89)
Correcciones de pulido para dejar el flujo candidato presentable en demo: retirada de
meta-copy/badges internos no accionables (p. ej. VIS-09 "MVP candidate-first"), limpieza de
naming del producto y ajustes menores transversales (23 archivos). Lote de *quick wins*
P1/P2 de bajo riesgo.

### 21B — Paginación de Jobs (PR #90)
Resuelve **JOBS-01 (P1 funcional)**: la API paginaba pero la UI no exponía controles,
dejando **36 de 56 ofertas inaccesibles**. Se añadieron los controles de paginación en
`/jobs` (cambio quirúrgico, 2 archivos), recuperando el acceso a todo el catálogo.

### 21C — Match para perfiles incompletos (PR #91)
UX honesta cuando el candidato aún no tiene skills, con su mini-spec
[`match-incomplete-profile-ux.md`](../specs/features/match-incomplete-profile-ux.md):

- **MATCH-01** — estado guía en `/match` cuando el perfil no tiene skills (en vez de
  puntuar todo el catálogo).
- **DASH-01** — el Dashboard muestra Matches = 0 sin skills.
- **MATCH-02** — pesos fijos visibles: *Skills 50% · Seniority 20% · Modalidad 20% ·
  Ubicación 10%*.
- **JOBS-05** — copy para ofertas sin skills: *"La oferta no especifica skills; este factor
  no puede evaluarse."*
- **MATCH-04** explícitamente fuera de alcance.

### 21D — Identidad, navegación y responsive (PRs #92 + #93)
El lote más grande (39 archivos), con mini-spec
[`identity-navigation-responsive.md`](../specs/features/identity-navigation-responsive.md).
Resuelve 8 hallazgos + hardening de accesibilidad del drawer:

- **TAB-01 + overflow** — breakpoint del shell `md → lg` (sidebar/offset/toggle/drawer
  coordinados) y header anti-overflow (`min-w-0`/`truncate`/`shrink-0`); `scrollWidth ≤
  clientWidth` a 390/768/1440.
- **NAV-02** — identidad **real** del header vía snapshot session-scoped
  (`loadCandidateIdentity`), con fallback "Candidato tech / CT", **nunca email**, y
  **sincronización sin petición extra** tras editar Profile/avatar (reutiliza la respuesta
  de `updateMyProfile`).
- **VIS-01** — `BrandMark` compartido con gradiente canónico `jobit-brand → jobit-green`
  (elimina `sky→emerald` del logo en shell/landing/auth; los acentos ilustrativos no-logo
  se preservan).
- **NAV-01** — deduplicación del CTA "Preparar JobIT CV" (1 hero; retirados el QuickAction
  y el pie de sidebar duplicados).
- **FLOW-02** — aviso contextual en `/login` (`?reason=required|expired`) con helper
  `redirectToLogin`/`redirectOnMissingSession` centralizado en las **8 guardas privadas**;
  blindaje de la carrera logout↔guarda por `endReason` (ADR-0006 intacto).
- **DASH-04** — badge "Siguiente" integrado en flujo (sin superposición a 390 px).
- **RESP-03** — orden responsive de Profile (progreso+preview antes del editor en móvil;
  rail derecha en desktop) vía `order-*`, un único árbol DOM.
- **PORT-01** — enlace nativo "← Volver al portfolio" en Portfolio Settings.
- **A11y del drawer** — `aria-expanded`/`aria-controls`, gestión de foco (enfoque inicial,
  retorno tras Escape/botón/overlay) y **contención local Tab/Shift+Tab** para honrar
  `aria-modal` (mini-spec §10); avatar del header decorativo, iniciales no duplicadas.
- **PR #93** — corrección documental del comentario del drawer (solo comentario), separada
  del código funcional.

## 4. Validaciones ejecutadas (cierre 21D)

- **typecheck** (`@jobit/web`): exit 0.
- **tests**: **27 archivos, 386/386** (Web, Vitest + RTL) — API **41 archivos, 399/399** en CI.
- **lint**: exit 0, sin warnings nuevos.
- **build**: exit 0, **13/13 páginas**; `/login` prerenderizada estática
  (`useSearchParams` bajo `<Suspense>`, sin CSR bailout).
- **`git diff --check`**: limpio.
- **Auditoría Playwright autenticada** (navegador real, login por UI, navegación
  client-side ADR-0006, PostgreSQL/API/Web reales): **9/9 combinaciones** (Dashboard,
  SiteShell, Profile, Portfolio Settings × 390/768/1440) **sin overflow horizontal, 0
  errores de consola, 0 excepciones, 0 respuestas HTTP inesperadas**. Verificados en
  runtime: drawer (aria + foco + contención Tab/Shift+Tab + Escape/overlay), sincronización
  de identidad del header (1 `PUT`, 0 GET extra), logout → `/login` sin `reason`.
- **CI verde** en todos los merges; última en `dev` (`ec71e19`): API + Web `success`.

## 5. Decisiones técnicas relevantes

- **Snapshot de identidad session-scoped** (`auth-identity.ts` + `AuthContext`): una única
  lectura por sesión, desacoplada de `getMyProfile` de las páginas para no colisionar en
  tests; sincronización desde la respuesta ya disponible (sin petición extra).
- **FLOW-02 con `?reason=`** y `SessionNotice` cliente bajo `<Suspense>`: evita el *CSR
  bailout* del build estático manteniendo `/login` prerenderizada.
- **Helper de redirección centralizado** en las 8 guardas privadas + blindaje de la carrera
  logout/guarda por `endReason` (una guarda no convierte un logout en `reason=required`).
- **Drawer `aria-modal` honesto**: al declararlo (mini-spec §10) se implementó contención
  local de foco Tab/Shift+Tab, sin gestor modal general ni dependencias.
- **Breakpoint del shell `md → lg`**: unifica en una sola navegación por ancho
  (drawer <1024 px, sidebar ≥1024 px).

## 6. Fuera de alcance / deuda diferida (no bloqueante)

Registrado para sprints posteriores (mayoritariamente **21E**):

- **A11Y-01…05** — auditoría WCAG completa (solo se preservó/completó lo tocado).
- **PROF-01/02, PORT-02, SAVED-02, MATCH-04** — pendientes de priorización.
- Sin dark mode, sin persistencia de sesión, **ADR-0006 intacto**; sin backend/Prisma/DTO.

## 7. Incidencia de proceso

Durante el cierre de 21D, la **PR #92 se mergeó en su head funcional (`f8c3ef6`) antes** de
que aterrizara el commit documental `b56b651`, que quedó varado en la rama feature. Se
encauzó con una **PR de seguimiento (#93, solo comentario, +3/−2)**, con su propia CI verde,
mergeada por el flujo normal. Resultado: `dev` contiene **todo** el Sprint 21 (feature +
documentación). Ningún merge se realizó fuera de las PRs autorizadas.

## 8. Fuera de alcance respetado

- ✅ Frontend-only: sin cambios en `apps/api/**`, Prisma, DB, `types/api.ts`, contratos HTTP
  ni scoring.
- ✅ ADR-0006 intacto (sesión en memoria; sin `localStorage`/`sessionStorage`).
- ✅ Sin dependencias nuevas, sin manifests/lockfiles tocados.
- ✅ Sin rediseño; mini-specs como fuente de verdad; commits sin Co-Authored-By.
- ✅ Merges por UI/CLI de GitHub hacia `dev`.

## 9. Estado final del sprint

**Sprint 21: PASS.** Auditoría + cuatro lotes de remediación completados, verificados y
**mergeados en `dev` con CI en verde** (PRs #88–#93). `dev` @ `ec71e19` contiene todo el
trabajo. La zona candidato queda con navegación responsive coherente (drawer accesible
<1024 px, sidebar ≥1024 px), identidad real y sincronizada, marca unificada, avisos de
sesión honestos, catálogo de Jobs completo (paginación) y UX de match que no sobre-promete
con perfiles incompletos.

## 10. Recomendación para el orquestador

1. **Cerrar Sprint 21 como PASS** (este informe lo documenta).
2. **Sprint 21E — Accesibilidad y deuda UX**: abordar A11Y-01…05 (WCAG) y los hallazgos
   diferidos (PROF-01/02, PORT-02, SAVED-02, MATCH-04) con el mismo flujo SDD + TDD.
3. **Deploy real (gate 20.6)**: cuando se autorice, ejecutar el runbook ya verificado
   (`docs/deployment/staging-vps-deploy-runbook.md`). La infraestructura local autenticada
   (contenedor `jobit-postgres-test` en `5434` + API + Web) quedó verificada y reutilizable
   para futuras auditorías visuales.
