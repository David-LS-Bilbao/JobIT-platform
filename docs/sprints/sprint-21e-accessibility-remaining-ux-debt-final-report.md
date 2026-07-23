# Informe final

## Sprint o tarea
Sprint 21E — Accessibility & Remaining UX Debt

## Objetivo inicial
Sprint 21E abordó la deuda residual de experiencia de usuario detectada tras el cierre de Sprint 21, sin tocar backend, contratos ni scoring. Las áreas objetivo fueron:

- **accesibilidad** semántica de Auth y Profile (landmarks, asociación de errores, jerarquía de encabezados);
- **semántica** correcta de encabezados internos frente al `h1` único del shell;
- **contraste** AA de textos informativos sobre fondos claros;
- **claridad de guardado** (microcopy de persistencia en Profile);
- **disponibilidad de Saved Jobs** (indicar ofertas cerradas o expiradas);
- **interpretación de Match** (aclarar que la afinidad es orientativa);
- **decisión de Portfolio** sobre el slug legible (PORT-02).

## Estado final
PASS — Sprint funcional y técnicamente completo, listo para cierre Git y PR.

Este informe no afirma que toda la accesibilidad de JobIT esté resuelta: quedan deudas explícitamente diferidas (ver «Deuda pendiente»).

## Alcance
Trabajo realmente realizado, todo en `apps/web` (frontend) y documentación:

- Auth: un único `<main>` en Login y Register; `aria-describedby` estable para errores de campo, conservando `aria-invalid` y el `AuthError` con `role="alert"`.
- Profile: encabezado interno de `h1` a `h2`; `fieldset`/`legend` en las altas de experiencia, formación y proyectos; microcopy de guardado (inmediato y por botón); sin copy redundante en Datos básicos.
- Contraste y headings: doce textos informativos sobre fondos claros corregidos (once a `text-slate-500`, uno a `text-slate-600`); título de oferta y «Oferta no disponible» de `h1` a `h2` en Job Detail, conservando el `h1` del `SiteShell`.
- Saved Jobs: indicador «Oferta no disponible» derivado de `status`/`expiresAt`, con estructura `ul > li > article` y CTA «Ver detalle →» conservado.
- Match: aclaración orientativa una vez en la página de Match y una vez en `JobMatchPanel`, ausente en `MatchCard` y en el estado sin skills.
- Portfolio: auditoría y decisión de diferir PORT-02.
- E2E: actualización del fixture `jobs-saved-match` para preparar una skill por UI.
- Documentación: plan del sprint y este informe final.

## Fuera de alcance
No se tocó ni se aborda en este sprint:

- backend / Express / Prisma / DB;
- DTO y contratos (`apps/web/src/types/api.ts` intacto);
- scoring de Match;
- rediseño visual o dark mode;
- automatización con Axe (`@axe-core/playwright`);
- generación automática de slugs (PORT-02);
- iconos interactivos con `text-slate-400` diferidos;
- landing;
- dependencias (`package.json`, `pnpm-lock.yaml`);
- CI (`.github/`), Docker, `.env*`;
- deploy.

## Trabajo realizado
Organizado por fases:

- **21E.1 — Planificación.** Auditoría y clasificación de hallazgos; creación del plan documental del sprint.
- **21E.2 — Auth.** RED→GREEN de A11Y-02 (landmark `<main>`) y A11Y-05 (`aria-describedby`); validación manual de teclado y asociaciones.
- **21E.3 — Profile.** RED→GREEN de A11Y-04 (Profile `h2`), PROF-02 (`fieldset`/`legend`) y PROF-01 (microcopy de guardado); E2E Profile/Portfolio verde.
- **21E.4 — Contraste y headings.** A11Y-03 (contraste sobre fondos claros) y A11Y-04 (Job Detail `h2`), con ratios AA precalculados.
- **21E.5 — Saved Jobs.** SAVED-02: indicador de disponibilidad con validación runtime real (guardado persistido de ofertas cerradas/expiradas).
- **21E.6 — Match.** MATCH-04: copy orientativo en Match y en `JobMatchPanel`.
- **21E.7 — Portfolio decision.** Auditoría de PORT-02 y clasificación `PORT02_DEFERRED_NO_LOCAL_NAME`.
- **21E.8 — Stabilization.** Baseline final de quality gates, triage del supuesto flaky de JobMatchPanel (no reproducido) y corrección del fixture E2E `jobs-saved-match`.

## Hallazgos resueltos
Cerrados en 21E:

- **A11Y-02** — landmark `<main>` único en Login y Register.
- **A11Y-03** — contraste AA de textos informativos sobre fondos claros (parcial según alcance aprobado: doce textos; los iconos interactivos y el nivel de skill sobre `slate-100` quedan diferidos, ver «Deuda pendiente»).
- **A11Y-04 (Profile)** — encabezado interno «Tu perfil tech vivo» de `h1` a `h2`.
- **A11Y-04 (Job Detail)** — título de oferta y «Oferta no disponible» de `h1` a `h2`.
- **A11Y-05** — asociación de errores de campo con `aria-describedby`.
- **PROF-01** — microcopy de guardado (inmediato y por botón).
- **PROF-02** — `fieldset`/`legend` en altas de experiencia, formación y proyectos.
- **SAVED-02** — indicador «Oferta no disponible» para ofertas cerradas/expiradas.
- **MATCH-04** — aclaración de que la afinidad es orientativa.

No se declaran cerrados: PORT-01, PORT-02, automatización Axe, contraste de iconos gráficos y landing.

## Decisiones y hallazgos diferidos
**PORT-02 — `PORT02_DEFERRED_NO_LOCAL_NAME`.** Se difiere sin implementación. Motivos verificados:

- El backend ya genera slugs basados en el nombre (`baseSlugFromName` desde `firstName`/`lastName`) al crear la fila de configuración cuando el nombre existe; el `user-<fragmento>` impersonal es un fallback residual solo cuando no hay nombre en ese momento, y no se regenera después.
- El usuario ya puede editar manualmente el slug residual (input existente + `slug?` en el contrato de actualización).
- El nombre profesional **no** está disponible localmente en Portfolio Settings: el `PortfolioSettingsDto` no lo incluye y la página solo carga la configuración de portfolio.
- Resolverlo frontend-side exigiría una nueva petición, ampliar el DTO, leer identidad desde otro árbol de estado (Auth) con riesgo de carrera, o prop drilling. Todas esas vías quedan fuera del alcance frontend-only y de las condiciones de «dato disponible localmente».

## Archivos modificados

| Área | Archivos | Tipo de cambio |
| ---- | -------: | -------------- |
| Auth | 7 | landmark `<main>`, `aria-describedby`, ids de error; tests |
| Profile | 12 | `h2`, `fieldset`/`legend`, microcopy, contraste; tests |
| Dashboard | 1 | contraste `text-slate-500` |
| Jobs | 3 | Job Detail `h2`, contraste; tests |
| Saved Jobs | 2 | indicador de disponibilidad `ul>li>article`; tests |
| Match | 4 | copy MATCH-04 en página y panel; tests |
| E2E | 1 | fixture `jobs-saved-match`: alta de skill por UI |
| Documentación | 2 | plan del sprint + informe final |

Rutas exactas modificadas (código y tests):

- `apps/web/src/app/login/page.test.tsx`
- `apps/web/src/app/register/page.test.tsx`
- `apps/web/src/features/auth/auth-form-shell.tsx`
- `apps/web/src/features/auth/login-form.tsx`
- `apps/web/src/features/auth/login-form.test.tsx`
- `apps/web/src/features/auth/register-form.tsx`
- `apps/web/src/features/auth/register-form.test.tsx`
- `apps/web/src/features/dashboard/dashboard-content.tsx`
- `apps/web/src/features/jobs/job-card.tsx`
- `apps/web/src/features/jobs/job-detail-page.tsx`
- `apps/web/src/features/jobs/job-detail-page.test.tsx`
- `apps/web/src/features/match/job-match-panel.tsx`
- `apps/web/src/features/match/job-match-panel.test.tsx`
- `apps/web/src/features/match/match-page.tsx`
- `apps/web/src/features/match/match-page.test.tsx`
- `apps/web/src/features/profile/profile-content.tsx`
- `apps/web/src/features/profile/profile-content.test.tsx`
- `apps/web/src/features/profile/profile-education-section.tsx`
- `apps/web/src/features/profile/profile-experience-section.tsx`
- `apps/web/src/features/profile/profile-links-section.tsx`
- `apps/web/src/features/profile/profile-preferences-section.tsx`
- `apps/web/src/features/profile/profile-preview.tsx`
- `apps/web/src/features/profile/profile-print-cv.tsx`
- `apps/web/src/features/profile/profile-projects-section.tsx`
- `apps/web/src/features/profile/profile-skills-section.tsx`
- `apps/web/src/features/profile/public-portfolio-cv.tsx`
- `apps/web/src/features/profile/public-portfolio-page.tsx`
- `apps/web/src/features/saved-jobs/saved-jobs-page.tsx`
- `apps/web/src/features/saved-jobs/saved-jobs-page.test.tsx`
- `apps/web/e2e/jobs-saved-match.spec.ts`

Documentos del sprint:

- `docs/sprints/sprint-21e-accessibility-remaining-ux-debt-plan.md` (plan)
- `docs/sprints/sprint-21e-accessibility-remaining-ux-debt-final-report.md` (informe final)

## Tests y verificaciones
Cada fase se desarrolló con disciplina RED→GREEN (RTL) y validación dirigida. Resultados finales (fase 21E.8-C):

- **Suite web completa:** 27 archivos, 402/402 tests passed (estable en dos pasadas previas; sin reaparición del supuesto flaky).
- **JobMatchPanel (dirigido):** estable en aislamiento (4/4, 4/4) y en suite Match combinada (36/36).
- **Baseline Portfolio (21E.7, dirigido):** 29/29 passed.
- **E2E completo:** 7/7 passed (`auth-dashboard`, `jobs-saved-match`, `profile-portfolio`, `public-smoke` ×4), sin retries.
- **E2E dirigido `jobs-saved-match`:** RED reproducido antes del fix; GREEN estable en dos pasadas independientes tras añadir la skill por UI.

Cobertura por área: Auth, Profile, Job Detail, Saved Jobs, Match y E2E, todos verdes.

## Validaciones manuales
Evidencias reales registradas durante las fases:

- **Login/Register:** un único landmark `<main>`, errores anunciados por `aria-describedby`, navegación por teclado correcta.
- **Profile 1440/390:** jerarquía de encabezados y grupos con `fieldset`/`legend`; microcopy visible; sin regresión responsive.
- **Job Detail:** títulos internos como `h2`; contraste AA.
- **Contraste:** clases aplicadas verificadas contra ratios WCAG precalculados (`text-slate-500`/`text-slate-600` sobre los fondos efectivos).
- **Saved Jobs:** ofertas cerradas y expiradas muestran el indicador; activas/futuras no; guardado persistido real comprobado en runtime.
- **Match con y sin skills:** copy orientativo presente en resultados y en el panel; ausente en el estado guía sin skills.
- **Portfolio:** baseline público y de settings verde; sin implementación (decisión diferida).

## Quality gates finales

| Gate | Resultado |
| ------------- | --------: |
| Typecheck web | PASS |
| Lint web | PASS (0 warnings) |
| Build web | PASS (13 rutas; solo warning preexistente de lockfiles) |
| Tests web | PASS (402/402) |
| E2E | PASS (7/7) |
| Diff check | Limpio |

## Decisiones técnicas
- **No modificar `JobCard` para SAVED-02:** el indicador vive en el wrapper `li` de Saved Jobs (`ul > li > article`), sin tocar el componente compartido.
- **No repetir MATCH-04 en `MatchCard`:** la aclaración aparece una vez por vista (página y panel), no por tarjeta.
- **No añadir live regions a información persistente:** el copy y los indicadores son estáticos; no requieren `aria-live`.
- **No usar reemplazo global de `text-slate-400`:** se corrigieron solo los textos dentro del alcance aprobado, preservando usos deliberados (panel oscuro de Auth, iconos diferidos).
- **Preservar el único `h1` del shell:** los encabezados internos pasan a `h2`; el `h1` lo aporta `SiteShell`.
- **No ampliar Portfolio por falta de datos locales:** PORT-02 se difiere en vez de introducir acoplamiento Auth↔Profile o una nueva petición.

## Seguridad y privacidad
- Sin secretos impresos ni versionados (`.env`, tokens, cookies, cabeceras Authorization).
- Solo cuentas y datos ficticios en E2E y validaciones runtime.
- Sin datos personales en este informe.
- Sin SQL de escritura; accesos de verificación en solo lectura.
- Scripts y artefactos temporales retirados; artefactos de Playwright (git-ignored) limpiados.
- Sin cambios de backend, DTO ni contratos.

## Problemas encontrados
1. **Supuesto flaky de `JobMatchPanel` (caso B).** Observado una única vez en una suite completa anterior; **no reproducido** en el baseline final (dos pasadas completas + aislamiento + suite combinada). Clasificación final: estable/verde (`MATCH_TEST_STABLE_GREEN`); no se modificó el test.
2. **E2E `jobs-saved-match` desactualizado.** Causa: el fixture asumía resultados de Match sin skills, incompatible con el estado guía introducido en Sprint 21C. Corrección: añadir una skill por UI (input «Nombre de la skill» + botón «Añadir skill»), con evidencia de persistencia mediante el botón «Eliminar React» del chip. Resultado: E2E completo 7/7.
3. **Warning de múltiples lockfiles en build.** Preexistente (inferencia de workspace root por `pnpm-lock.yaml` raíz vs `pnpm-workspace.yaml`), no bloqueante y no atribuible a 21E.

## Deuda pendiente
Explícitamente diferida (no resuelta en 21E):

- ocho iconos interactivos que conservan `text-slate-400`;
- nivel de skill con `text-slate-500` sobre `slate-100`, ratio aproximado `4,34:1`;
- landing (cuatro usos de `text-slate-400`);
- PORT-01 — retorno desde Portfolio público;
- PORT-02 — propuesta automática de slug basada en el nombre;
- automatización con Axe.

Recomendación: agrupar el contraste de iconos, el nivel de skill y la landing en una futura fase de contraste, sin abrir un roadmap nuevo aquí.

## Estado Git
- **Rama:** `feat/sprint-21e-accessibility-remaining-ux-debt`.
- **HEAD:** `7b81c47` (sin commits nuevos).
- **Working tree:** cambios sin commit (30 archivos de código/tests/E2E + plan actualizado + informe final sin rastrear).
- **Staging:** vacío.
- Sin push, sin PR, sin `Co-Authored-By` ni referencias de autoría IA.

## Pendiente
- Revisión del informe por el Chat Operador/Director.
- Definir estrategia de commit (commit único o por bloque).
- Push de la rama.
- PR hacia `dev`.
- CI verde (`JobIT CI`, jobs `api` y `web`).
- Revisión y merge (con autorización).

## Recomendación para el orquestador
Sprint 21E está completo y estable. Se recomienda cerrar el sprint y abrir PR hacia `dev` sin ampliar alcance: las deudas restantes están explícitamente diferidas y no bloquean el cierre.

## Prompt sugerido para continuar

```txt
Sprint 21E.9 — Git closure, push and PR

- Revisar el diff final acumulado de la rama feat/sprint-21e-accessibility-remaining-ux-debt.
- Staging controlado de código, E2E y documentación (sin artefactos ni archivos fuera de alcance).
- Crear un commit descriptivo en español, sin Co-Authored-By ni referencias de autoría IA.
- Push de la rama al remoto.
- Abrir PR hacia dev con resumen del sprint y checklist de quality gates.
- Verificar CI (JobIT CI, jobs api y web) en verde.
- No mergear sin autorización explícita.
```

SPRINT_21E_8C_FINAL_REPORT_READY_FOR_REVIEW
