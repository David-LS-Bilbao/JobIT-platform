# Sprint 21E — Accessibility & remaining UX debt

Plan de cierre (documental) de la deuda de accesibilidad y UX identificada en la auditoría
del Sprint 21 ([`sprint-21-ux-ui-audit-report.md`](sprint-21-ux-ui-audit-report.md)) y
refinada en la auditoría 21E.0. Frontend-only, candidate-first, sin rediseño.

> **Naturaleza documental.** Este archivo es un **plan de sprint**, no una spec de features.
> Los hallazgos a remediar son hardening de accesibilidad, semántica y copy sobre pantallas
> **ya especificadas** (Auth, Profile/CV, Jobs, Saved Jobs, Match). El único hallazgo con
> comportamiento "de contrato" — SAVED-02 — **ya tiene spec previa** en
> [`../specs/features/saved-jobs.md`](../specs/features/saved-jobs.md) (§ indicador "no
> disponible"). Por tanto no se crea una spec nueva en `docs/specs/**` (decisión del Chat
> Director). Cada fase de implementación posterior aplicará el flujo SDD+TDD del repo
> (tests mínimos antes de implementar).

## 1. Objetivo

Cerrar la deuda de **accesibilidad básica** y la **deuda UX restante** del flujo candidato
que quedó fuera de 21A–21D, con cambios pequeños, revisables y reversibles, sin tocar
backend, contratos, scoring, dependencias ni el diseño global. La prioridad es **semántica
real** (landmarks, jerarquía de headings, agrupación de campos, asociación de errores,
contraste AA), no maquillaje visual.

## 2. Contexto y estado previo

- Sprints 21, 21A, 21B, 21C y 21D **cerrados y mergeados**. `dev` contiene `ec71e19`
  (identidad/navegación responsive + accesibilidad del drawer) y avanzó con merges
  documentales posteriores.
- Rama de trabajo: `feat/sprint-21e-accessibility-remaining-ux-debt`, creada desde `dev`
  actualizado.
- La auditoría 21E.0 clasificó cada hallazgo restante (abierto / parcial / cerrado /
  condicionado) con evidencia de código.
- **Cifras de tests** citadas en este plan (Web 386/27 archivos, API 399/41 archivos)
  pertenecen al **cierre anterior** (CI verde en `dev`); **no** son un resultado ejecutado en
  21E.1 (fase exclusivamente documental).

## 3. Alcance permitido

- **Frontend-only** en `apps/web/**` (presentación, semántica ARIA, copy).
- Landmarks, jerarquía de headings, `fieldset`/`legend`, asociación de errores por
  `aria-describedby`, contraste de textos secundarios, microcopy de guardado, copy de escala
  de Match, e indicador de "no disponible" en Saved Jobs (comportamiento ya especificado).
- Tests RTL nuevos que fijen la semántica; verificación manual de teclado/contraste.

## 4. Fuera de alcance

- Backend, Prisma, DB, DTO, contratos HTTP, scoring, endpoints, frecuencia de peticiones,
  lógica de persistencia.
- Dependencias nuevas (incluido `@axe-core/playwright`).
- Rediseño global, cambio de paleta o tokens nuevos.
- Reimplementar el drawer (cerrado en 21D).
- Deploy, Docker, CI, InfoJobs, Jooble, Greenhouse, ramas safety.
- Persistencia de sesión / ADR-0006.
- Estados simulados o inventados (p. ej. "oferta eliminada").

## 5. Hallazgos abiertos

| ID | Descripción | Evidencia | Clase |
|---|---|---|---|
| **A11Y-02** | Auth (`/login`, `/register`) sin landmark principal (`<main>` ausente) | `features/auth/auth-form-shell.tsx` (usa `div`/`section`, sin `main`) | Frontend-only |
| **A11Y-03** | Textos `text-slate-400` sobre fondo claro (~2,6:1, falla AA) | `job-card.tsx`, `profile-*section.tsx`, `dashboard-content.tsx`, `profile-preview.tsx`, `job-detail-page.tsx`, … | Frontend-only |
| **A11Y-04** | Doble `h1`: título del shell + título de contenido en Profile y Job Detail | `site-shell.tsx:387` + `profile-content.tsx:184` + `job-detail-page.tsx:158` | Frontend-only |
| **PROF-01** | Modelo de guardado mixto sin señalización (alta inmediata vs "Guardar X" vs "Guardar cambios") | `profile-content.tsx`, `profile-{skills,experience,projects,links,preferences}-section.tsx` | Frontend-only (microcopy) |
| **PROF-02** | Altas de experiencia/educación/proyectos sin `fieldset`/`legend`; "Fecha de inicio/fin" repetidos | `profile-experience-section.tsx:153,166`, `profile-education-section.tsx`, `profile-projects-section.tsx` | Frontend-only |
| **MATCH-04** | Escala de afinidad no explicada (p. ej. 50/100 = "Baja" percibido como sobrepromesa) | `match/job-match-panel.tsx:88-96`, `match/match-card.tsx:64-67` | Frontend-only (copy) |

## 6. Hallazgos parcialmente resueltos

- **A11Y-05 — error de Register en live region.**
  - *Resuelto:* el error de formulario (API) se anuncia en **ambos** formularios vía
    `AuthError` con `role="alert"` (`features/auth/auth-error.tsx`, usado por login y
    register).
  - *Gap:* los **errores de campo** (validación) no están asociados al input por
    `aria-describedby` (solo hay `aria-invalid`).
  - *Propuesta limitada:* `id` estable por error de campo + `aria-describedby` en el input;
    conservar `aria-invalid` y el error global `role="alert"`. Sin múltiples live regions
    agresivas.
- **PORT-02 — slug legible.**
  - *Resuelto:* input de slug editable + validación de error.
  - *Gap:* el **default** `user-<hash>` lo genera el backend (no cambiable sin backend).
  - *Estado:* **diferido por defecto** (ver §8/§9). Solo se reconsidera si el nombre del
    candidato ya está disponible en props/estado de Portfolio Settings, sin fetch ni prop
    drilling.

## 7. Hallazgos ya cerrados y que no deben duplicarse

- **A11Y-01 — drawer móvil (foco, Escape, contención de foco).** Cerrado en **Sprint 21D**:
  `site-shell.tsx` implementa `closeMenu` con retorno de foco, handler `Escape`, `drawerRef`
  + contención `Tab`/`Shift+Tab`, foco inicial a "Cerrar menú", `aria-expanded` y
  `aria-controls`. Cubierto por `site-shell.test.tsx` (A1–A8).
  - **No reimplementar** Escape, foco inicial, retorno de foco, contención de Tab,
    `aria-expanded` ni `aria-controls`.
  - Solo **comprobación de no regresión** si una fase posterior toca `SiteShell`
    indirectamente.
- Igualmente cerrados y no duplicables: NAV-01/02, VIS-01/09, TAB-01, FLOW-02, DASH-04,
  RESP-01/03, PORT-01 (21A/21D); JOBS-01 (21B); MATCH-01/02, DASH-01, JOBS-05 (21C).

## 8. Hallazgos condicionados por datos o contrato

- **SAVED-02 — indicador de "no disponible" en Saved Jobs.**
  - **Ya especificado** en [`../specs/features/saved-jobs.md`](../specs/features/saved-jobs.md):
    "Oferta guardada que ha sido cerrada: se muestra en la lista con indicador de 'no
    disponible'"; "se exponen … `status` y `expiresAt`, que permiten al cliente derivar el
    indicador"; "las ofertas cerradas o expiradas … se mantienen en la lista pero se marcan
    como no disponibles" (criterio de aceptación incluido).
  - **Contrato ya disponible:** `JobPublicDto.status` (`"ACTIVE" | "CLOSED"`) y `expiresAt`
    en `SavedJobDto.job` (`apps/web/src/types/api.ts`). El frontend puede derivar
    cerrada (`status === "CLOSED"`) o expirada (`expiresAt` pasado) **sin backend**.
  - **Condición única (runtime, solo lectura):** confirmar que `GET /api/saved-jobs`
    **devuelve** filas cerradas/expiradas (como manda la spec §"se mantienen en la lista").
    Si **no** las devuelve: **documentar la limitación**, **no** tocar backend, **no**
    modificar DTO, **no** simular estados. El estado "eliminada" no es distinguible (ausente
    de la lista) y **no** debe inventarse.
- **PORT-02 (parte del default):** cambiar el slug por defecto legible es **backend**; fuera
  de 21E. El frontend solo podría **sugerir** en el input si dispone del nombre en cliente
  sin fetch/DTO nuevo.

## 9. Decisiones aprobadas por el Chat Director

1. **Headings (A11Y-04):** mantener el `h1` del `SiteShell`; los títulos internos duplicados
   de Profile y Job Detail pasan a `h2`. **No** modificar el `h1` del shell.
2. **Saved Jobs (SAVED-02):** verificación **runtime de solo lectura** autorizada
   (posterior); si `/api/saved-jobs` no devuelve cerradas/expiradas → documentar limitación,
   sin tocar backend/DTO ni simular estados.
3. **Portfolio slug (PORT-02):** **diferido por defecto**; solo reconsiderar si el nombre ya
   está en estado/props de Portfolio Settings (sin nuevo fetch, sin modificar DTO/backend,
   sin prop drilling amplio, sin duplicar estado).
4. **Documentación:** un plan ligero de sprint (este archivo); **no** crear spec en
   `docs/specs/**`.
5. **Axe:** **no** instalar `@axe-core/playwright`; adopción diferida fuera de 21E.
6. **Contraste (A11Y-03):** limitado a `text-slate-400` sobre fondos claros, solo donde el
   contraste sea insuficiente, cambiando a `text-slate-500`/`text-slate-600`. Sin tokens
   nuevos, sin cambiar la paleta global, sin rediseñar componentes.
7. **Drawer (A11Y-01):** cerrado en 21D; no reimplementar (solo no-regresión si se toca el
   shell).
8. **Register errors (A11Y-05):** `id` estable por error de campo + `aria-describedby` en el
   input; conservar `aria-invalid` y el error global `role="alert"`; sin live regions
   agresivas múltiples.
9. **Profile saving (PROF-01):** solo microcopy, señalización de cuándo se guarda y feedback
   visual consistente; **no** tocar endpoints, frecuencia, persistencia, modelo de datos ni
   DTO. (Coherente con `candidate-profile-cv.md`: el guardado parcial por sección es
   comportamiento **ya especificado**.)

## 10. Plan por fases

Cada fase es pequeña, revisable y con parada para revisión humana. La numeración interna
puede afinarse, **sin ampliar el alcance**.

### 21E.2 — Auth accessibility
- **Objetivo:** landmark principal en Auth (A11Y-02) + asociación de errores de campo
  (A11Y-05 residual).
- **Archivos previsibles:** `features/auth/auth-form-shell.tsx`, `features/auth/login-form.tsx`,
  `features/auth/register-form.tsx` (y posible `auth-validation`/`auth-error` solo lectura).
- **Tareas:** envolver el contenido de formulario en `<main>` (un único landmark principal);
  añadir `id` estable a cada error de campo y `aria-describedby` en el input; conservar
  `aria-invalid` y el error global `role="alert"`.
- **Fuera de alcance:** rediseño del split-screen, OAuth, copy de negocio.

### 21E.3 — Profile semantics and save feedback
- **Objetivo:** jerarquía de headings de Profile (A11Y-04, parte Profile), agrupación de
  campos (PROF-02) y señalización del modelo de guardado (PROF-01).
- **Archivos previsibles:** `features/profile/profile-content.tsx` (`h1`→`h2` del título de
  contenido), `features/profile/profile-{experience,education,projects}-section.tsx`
  (`fieldset`+`legend` en las altas; microcopy de guardado), y microcopy en
  `profile-{skills,links,preferences}-section.tsx` si aporta claridad.
- **Fuera de alcance:** `site-shell.tsx` (no tocar el `h1` del shell); lógica de guardado,
  endpoints, DTO.

### 21E.4 — Contrast and heading hierarchy
- **Objetivo:** contraste AA de textos secundarios (A11Y-03) + `h1`→`h2` en Job Detail
  (A11Y-04, parte Job Detail).
- **Archivos previsibles:** los que usan `text-slate-400` sobre fondo claro (job-card,
  secciones de perfil, dashboard, preview, job-detail…) y `features/jobs/job-detail-page.tsx`.
- **Tareas:** `slate-400`→`slate-500`/`600` **solo** sobre fondo claro y donde el contraste
  sea insuficiente; degradar el `h1` de contenido de Job Detail a `h2`.
- **Fuera de alcance:** textos sobre fondo oscuro (auth panel), tokens nuevos, paleta global,
  rediseño.

### 21E.5 — Saved Jobs availability verification
- **Objetivo:** indicador "no disponible" para guardadas cerradas/expiradas (SAVED-02),
  **condicionado** a verificación runtime de solo lectura.
- **Precondición:** confirmar que `GET /api/saved-jobs` devuelve filas cerradas/expiradas. Si
  **no** → documentar la limitación y **parar** (sin backend/DTO/simulación).
- **Archivos previsibles (si procede):** `features/saved-jobs/saved-jobs-page.tsx` y/o
  `features/jobs/job-card.tsx` (render condicional por `status`/`expiresAt`).
- **Fuera de alcance:** backend, DTO, estado "eliminada", estados simulados.

### 21E.6 — Match score clarity
- **Objetivo:** aclarar que la afinidad no es una nota ni una garantía (MATCH-04), copy
  breve coherente con el match explicable.
- **Archivos previsibles:** `features/match/job-match-panel.tsx`, `features/match/match-card.tsx`
  (y posible constante de labels).
- **Fuera de alcance:** scoring, thresholds, `level` del backend, IA.

### 21E.7 — Portfolio decision (PORT-02)
- **Objetivo:** **cerrar como diferido**, salvo que el nombre esté disponible en
  props/estado de Portfolio Settings sin fetch ni prop drilling.
- **Archivos previsibles:** ninguno si se difiere; `features/profile/profile-portfolio-settings.tsx`
  solo si se cumple la condición.
- **Fuera de alcance:** backend (default del slug), DTO, fetch nuevo.

### 21E.8 — Verification and final report
- **Objetivo:** verificaciones finales + informe de cierre del sprint.
- **Tareas:** typecheck, test, lint, build, `git diff --check`, `git status --short`;
  validación manual de teclado/contraste; no-regresión del drawer si se tocó el shell;
  informe final `docs/sprints/sprint-21e-*-final-report.md`.

## 11. Criterios de aceptación

Al completar 21E (en fases posteriores):

- **Auth** tendrá un **único landmark principal** identificable (`main`).
- Los **errores de campo** estarán asociados al input mediante `aria-describedby`, con
  `aria-invalid` conservado.
- Se **conservará el error global anunciado** (`role="alert"`).
- **Profile y Job Detail** tendrán jerarquía coherente **sin duplicar el `h1` del shell**
  (títulos de contenido en `h2`).
- Los grupos de campos relacionados usarán **`fieldset` y `legend`** donde sea semánticamente
  correcto (altas de experiencia/educación/proyectos).
- El **modelo de guardado** quedará aclarado **sin modificar la persistencia**.
- El **contraste** se corregirá **únicamente sobre fondos claros** (`slate-400`→`500/600`).
- **Saved Jobs** mostrará el indicador de "no disponible" si el runtime confirma el caso; en
  caso contrario **no simulará estados** y se documentará la limitación.
- **Match** aclarará que la afinidad **no es una nota ni una garantía**.
- El **drawer no será reimplementado**.
- **No** se instalará `@axe-core/playwright`.
- **PORT-02** podrá cerrarse como **diferido**.

## 12. Estrategia de tests

> No se ejecuta ninguna suite en 21E.1 (fase documental). Las cifras del cierre anterior
> (Web 386/27, API 399/41) son históricas, no un resultado de esta fase.

### RTL (React Testing Library)
- Landmark principal de Auth (`getByRole("main")`, un único `main`).
- Asociación de errores de campo (`toHaveAccessibleDescription` / `aria-describedby`).
- Jerarquía de headings (un único `h1`; títulos de contenido en `h2`).
- `fieldset`/`legend` (`getByRole("group", { name })`).
- Microcopy/feedback de guardado.
- Badge de Saved Jobs con fixtures `status: "CLOSED"` / `expiresAt` pasado **si el runtime
  confirma el caso**; oferta activa → sin badge.
- Copy de escala de Match.

### Manual
- Navegación por teclado y **foco visible**.
- Orden lógico de tabulación (incl. Auth con `main`).
- Contraste (ratio ≥ AA en los nodos `slate-400`→`500/600`).
- Lectura de jerarquía de headings.
- Estados de error (campo + global).

### Verificaciones finales del sprint (fase 21E.8)
```bash
pnpm --filter @jobit/web typecheck
pnpm --filter @jobit/web test
pnpm --filter @jobit/web lint
pnpm --filter @jobit/web build
git diff --check
git status --short
```

### No duplicar
- `site-shell.test.tsx` (A1–A8, drawer) y los tests de 21C/21D.

### No regresión E2E — Playwright Sprint 18
Las specs de `apps/web/e2e/**` (`public-smoke`, `auth-dashboard`, `jobs-saved-match`,
`profile-portfolio`) validan por **rol/texto accesible** (headings, botones, `expectStatusMessage`).
Los cambios de 21E (h1→h2, `fieldset`/`legend`, microcopy de guardado, badge de Saved Jobs)
**no deben romper** esos selectores: conservar los labels (`getByLabel("Nombre"…)`), los
nombres de botón (`"Añadir skill/proyecto"`, `"Guardar cambios"`) y el texto de feedback
(`"Cambios guardados"`). El E2E es **manual/no bloqueante** (no corre en CI); si una fase
toca esas superficies, ejecutarlo localmente como no-regresión.

## 13. Validación manual de accesibilidad

- Recorrido por teclado de Auth, Profile (altas), Saved Jobs, Match y Job Detail: foco
  visible, orden lógico, sin trampas.
- Lector de pantalla (revisión puntual): landmark `main` en Auth, headings coherentes,
  `fieldset`/`legend` anunciados, errores de campo asociados.
- Contraste: comprobar ratio de los textos secundarios corregidos sobre fondo claro.
- Sin herramientas automáticas de accesibilidad en 21E (Axe diferido).

## 14. Riesgos y kill-switch

### Riesgos
- **Regresión de 21D:** tocar `site-shell.tsx` (p. ej. por A11Y-04) puede afectar A1–A8; el
  cambio de headings debe recaer en los `h1` **de contenido**, no en el del shell.
- **Scope creep:** A11Y-03 toca muchos archivos; acotar estrictamente a `slate-400` sobre
  fondo claro.
- **Cambio de contrato por Saved Jobs:** tentación de tocar backend/DTO → **prohibido**; el
  dato ya existe (spec + contrato).
- **Dependencias nuevas:** Axe diferido; no instalar.
- **Rediseño global:** no; solo semántica/copy/contraste puntual.
- **Duplicación de tests:** no re-testear el drawer.
- **Regresión E2E (Sprint 18):** las specs Playwright de `apps/web/e2e/**` seleccionan por
  rol/texto accesible (labels, nombres de botón, headings, `"Cambios guardados"`); los
  cambios de headings/`fieldset`/microcopy/badge deben preservar esos selectores. E2E
  manual/no bloqueante: ejecutarlo localmente como no-regresión si se tocan esas pantallas.
- **Accesibilidad solo visual sin semántica real:** priorizar `main`/`h2`/`fieldset`/
  `aria-describedby` junto al contraste.
- **Matiz de proceso (AGENTS.md §"spec antes de feature"):** la deuda es hardening de
  pantallas ya especificadas; SAVED-02 ya tiene spec (`saved-jobs.md`). Si alguna fase
  introdujera comportamiento nuevo no cubierto por spec previa, se detendrá para re-evaluar
  si requiere spec antes de implementar.

### Kill-switch
Condiciones que obligan a detenerse con `BLOCKED`:
- Ruta distinta de `/home/david/projects/JobIT-platform` o entorno Windows/OneDrive/`/mnt/c`.
- Working tree sucio no explicado; repositorio Git anidado.
- `dev` no contiene `ec71e19`; `git pull --ff-only` falla.
- Necesidad de tocar backend, Prisma, DB, DTO, contratos o scoring.
- Añadir dependencia; modificar `package.json`/`pnpm-lock.yaml`/CI/Docker.
- Riesgo de imprimir secretos.
- Cambios fuera del alcance de cada fase.

## 15. Dependencias diferidas

- **`@axe-core/playwright`:** diferido fuera de 21E; su adopción requeriría una decisión/ADR
  propia y una fase específica (tras estabilizar la semántica), por su cobertura parcial de
  WCAG y su coste de mantenimiento.
- **PORT-02 (default de slug legible):** diferido; requiere backend.
- **SAVED-02 (si el backend no devuelve cerradas/expiradas):** el indicador quedaría diferido
  hasta que exista el dato; se documentaría la limitación sin tocar backend en 21E.

## 16. Criterio de cierre del sprint

Sprint 21E se considerará cerrado cuando:

- Las fases 21E.2–21E.7 estén implementadas (o documentadas como diferidas/no aplicables por
  datos) con sus tests RTL y validación manual.
- Se cumplan los criterios de aceptación (§11) sin tocar backend/contratos/scoring ni añadir
  dependencias.
- Verificaciones finales en verde (typecheck, test, lint, build, `git diff --check`).
- Sin regresión del drawer ni de otros cierres de 21A–21D.
- Exista informe final del sprint y las PR correspondientes hacia `dev` con CI verde.

## Estado final

Cierre técnico y documental de Sprint 21E (fase 21E.8):

- **21E.2 Auth accessibility** — cerrado.
- **21E.3 Profile semantics + save feedback** — cerrado.
- **21E.4 Contrast + Job Detail headings** — cerrado.
- **21E.5 Saved Jobs availability** — cerrado.
- **21E.6 Match score clarity** — cerrado.
- **21E.7 Portfolio decision (PORT-02)** — diferido: `PORT02_DEFERRED_NO_LOCAL_NAME` (sin
  implementación; el nombre profesional no está disponible localmente en Portfolio Settings).
- **21E.8 Stabilization** — cerrado: suite web estable, flaky de JobMatchPanel no reproducido,
  E2E `jobs-saved-match` actualizado para preparar una skill por UI, E2E completo 7/7.

Quality gates finales en verde (typecheck, lint, build, 402/402 tests web, E2E 7/7,
`git diff --check` limpio). Detalle completo en el
[informe final](sprint-21e-accessibility-remaining-ux-debt-final-report.md). Sprint listo para
revisión y cierre Git (commit/push/PR hacia `dev`).
