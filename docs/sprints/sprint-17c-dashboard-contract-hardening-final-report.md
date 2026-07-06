# Informe final — Sprint 17C

## Sprint o tarea

Sprint 17C — Dashboard contract hardening + candidate flow hardening. Rama:
`feat/sprint-17c-dashboard-contract-hardening`. Ejecutado spec-first en fases pequeñas (F0–F8)
sobre el plan aprobado por el orquestador.

## Objetivo inicial

Endurecer el contrato real de `GET /api/dashboard/me` y la coherencia del flujo candidato,
de forma **aditiva y sin Prisma**: exponer `summary`, `avatarUrl`, `cvSections` y `portfolio`;
enriquecer `nextActions` con el catálogo aprobado; hacer que el hub consuma datos reales
(preview del CV honesta, checklist real, portfolio con estado); añadir Portfolio a la navegación
privada; y subir el límite de avatar de 2 MB a 5 MB.

## Contexto de partida

- 17A (auditoría) detectó la preview del CV con placeholders fijos y el DTO limitado; 17B activó
  el hub frontend-only con el DTO existente. Las pruebas visuales del operador confirmaron el gap
  (foto y resumen reales no aparecían) y el límite de 2 MB rechazando fotos de móvil.
- Punto de partida git: `dev` == `origin/dev` en `5e326a1` (merge PR #71, Sprint 17B).

## Trabajo realizado

- **F0 — Startup**: `dev` sincronizado y limpio; rama creada; docs y rutas obligatorias confirmadas.
- **F1 — Spec**: `docs/specs/features/dashboard.md` reescrita con el contrato 17C aprobado
  (DTO completo, catálogo `nextActions` con prioridades/cap/determinismo, semántica
  `portfolio: null`, lectura segura sin `getOrCreate`, coherencia flags↔%, avatar 5 MB, naming
  real `completionPercentage`/`nextActions`/`matches`).
- **F2 — Backend contract core**: `DashboardProfileDto` + `summary`/`avatarUrl`;
  `DashboardCvSectionsDto` (alias de `ProfileSectionFlags`, coherencia por construcción);
  `DashboardPortfolioDto`; `findPortfolioStatus` vía `prisma.portfolioSettings.findUnique`
  (nunca `getOrCreatePortfolioSettings`); `getProfileSectionFlags` extraído en profile.service y
  `calculateCompletionPercentage` refactorizado para derivar de los mismos flags;
  `isPortfolioPublishable` exportada desde portfolio.service (misma regla que `publishPortfolio`,
  solo lectura).
- **F3 — nextActions enriquecidas**: catálogo aprobado (`complete_profile`, `add_experience`,
  `add_projects`, `add_links`, `publish_portfolio`, `explore_jobs`, `review_matches`), máx 3,
  orden determinista, una sola acción `add_*` por respuesta, `publish_portfolio` solo si
  publicable y no publicado. Labels existentes conservados para las 2 acciones previas.
- **F4 — Backend tests**: +13 casos de integración (shape ampliado, passthrough summary/avatar,
  cvSections por sección + coherencia con %, portfolio null **sin crear fila** / no publicado /
  publicado con `publicUrlPath`, prioridades/cap/condiciones del catálogo). Sin bugs detectados.
- **F5 — Frontend types + Dashboard UI**: `types/api.ts` espejo del contrato; checklist real
  desde `cvSections` (adiós hardcodes); preview con `summary` real (placeholder honesto si null)
  y foto real reutilizando `ProfileAvatar`; textos honestos de proyectos/enlaces;
  `PortfolioCard` con estado (Sin configurar / Sin publicar / **Publicado** con enlace a
  `/u/<slug>`); `NEXT_ACTION_ROUTES` ampliado al catálogo completo (acciones desconocidas siguen
  toleradas). +8 tests RTL.
- **F6 — Portfolio en navegación privada**: entrada "Portfolio" → `/profile/portfolio` en
  `PRIVATE_NAV` (sidebar y drawer); `isActive` con regla "prefijo más largo gana" (en
  `/profile/portfolio` se activa Portfolio y NO JobIT CV). Mock de `usePathname` parametrizable
  en el test + 3 casos nuevos.
- **F7 — Avatar 5 MB**: `MAX_AVATAR_BYTES` 2→5 MB; mensaje 413 y comment de multer; pre-check y
  copy del front; tests actualizados + **nuevo caso de aceptación con PNG de 3 MB**; spec
  `candidate-profile-cv.md` actualizada (5 referencias). Sin compresión client-side; MIME/magic
  bytes intactos.
- **F8 — Verificación final** (este informe): suites completas api+web, build de ambos, auditoría
  de alcance.

## Archivos modificados

18 archivos, **+981/−179** (sin contar este informe):

**Specs (2)**: `docs/specs/features/dashboard.md` (+176/−87),
`docs/specs/features/candidate-profile-cv.md` (+5/−5).

**API (9)**: `dashboard/dashboard.types.ts` (+31/−3), `dashboard/dashboard.service.ts` (+90/−15),
`dashboard/dashboard.integration.test.ts` (+296), `profile/profile.service.ts` (+27/−10),
`profile/portfolio.service.ts` (+9), `profile/avatar.storage.ts` (±2), `profile/avatar.upload.ts`
(±1, comment), `profile/profile.router.ts` (±1), `profile/profile-avatar.integration.test.ts`
(+14/−2).

**Web (7)**: `types/api.ts` (+24), `features/dashboard/dashboard-content.tsx` (+91/−40),
`features/dashboard/dashboard-page.test.tsx` (+150/−6), `components/layout/site-shell.tsx`
(+21/−1), `components/layout/site-shell.test.tsx` (+31/−4),
`features/profile/profile-content.tsx` (±3), `app/profile/page.test.tsx` (±4).

**Nuevo**: `docs/sprints/sprint-17c-dashboard-contract-hardening-final-report.md` (este informe).

## Contrato Dashboard 17C

`GET /api/dashboard/me` (aditivo; nada renombrado ni eliminado):

- `profile { firstName, lastName, headline, completionPercentage, summary, avatarUrl }`
- `skills` · `savedJobs { total, recent ≤3 }` · `matches ≤3` — sin cambios
- `cvSections { basics, skills, experience, education, projects, links, preferences }`
- `portfolio { isPublished, slug, publicUrlPath } | null` (null = sin configurar)
- `nextActions` — catálogo de 7 acciones, máx 3, determinista

## Backend

- **Lectura segura**: el dashboard nunca crea `PortfolioSettings` (test cuenta filas antes y
  después del GET). La materialización del perfil vacío (`getOrCreateCandidateProfile`) es
  comportamiento preexistente compartido con `/api/profile/me`, documentado en la spec.
- **Coherencia por construcción**: `cvSections` y `completionPercentage` salen de la misma
  función (`getProfileSectionFlags`); el alias de tipos en dashboard.types lo fija a nivel de
  compilador.
- **Publicabilidad real**: `publish_portfolio` usa la misma regla que `POST /publish`
  (`isPortfolioPublishable`, wrapper de solo lectura de `checkPublishable`).
- Cero queries nuevas salvo el `findUnique` de portfolio; jobs embebidos siguen con
  `serializeJob` (sin `externalId`/`ingestedAt`).

## Frontend

- Preview del JobIT CV con **foto y resumen reales** (los dos hallazgos del operador resueltos),
  checklist con flags reales, estados honestos de proyectos/enlaces (sin URLs: fuera del DTO 17C).
- Portfolio visible con estado en el hub y como entrada de la navegación privada, con
  active-state correcto (sin doble activo).
- Copy de avatar "PNG, JPG o WebP · máximo 5 MB" + pre-check alineado con el backend.

## Tests y verificaciones

Todas ejecutadas en el clon WSL, todas en verde (F8):

- `pnpm --filter @jobit/api typecheck` → **OK**
- `pnpm --filter @jobit/api test` → **OK — 41 archivos, 399/399 tests** (385 previos + 14 nuevos:
  13 dashboard + 1 avatar)
- `pnpm --filter @jobit/api build` → **OK**
- `pnpm --filter @jobit/web typecheck` → **OK**
- `pnpm --filter @jobit/web test` → **OK — 20 archivos, 265/265 tests** (254 previos + 11 nuevos:
  8 dashboard + 3 site-shell)
- `pnpm --filter @jobit/web lint` → **OK**
- `pnpm --filter @jobit/web build` → **OK** (protocolo operativo respetado: `next dev` detenido
  antes del build y relanzado después)
- `git diff --check` → **OK**; sin repos anidados; auditoría de alcance sin archivos prohibidos

## Seguridad y datos sensibles

- No se imprimió `.env`, `DATABASE_URL`, JWT secrets, tokens, cookies ni credenciales.
- La API pública sigue sin exponer `externalId`/`ingestedAt` (test extendido a los bloques
  nuevos vía `toEqual` exacto del portfolio: tampoco filtra `publishedAt`/`show*`).
- Validaciones de avatar intactas (allowlist MIME + magic bytes + nombre aleatorio +
  anti path traversal); solo cambió el límite de tamaño.

## Decisiones técnicas

- Alias de tipos (`DashboardCvSectionsDto = ProfileSectionFlags`) en lugar de duplicar la
  interfaz: la coherencia flags↔% queda garantizada por el compilador.
- `findUnique` con `select` mínimo para portfolio; patrón `/u/<slug>` reutilizado.
- Labels existentes conservados en `complete_profile`/`explore_jobs` (cero churn de copy).
- `PortfolioCard` como componente local pequeño: el estado publicado añade un segundo enlace y
  anidarlo en el wrapper-Link de `ModuleCard` sería HTML inválido.
- Regla "prefijo más largo gana" en `isActive`: genérica, resuelve `/profile` vs
  `/profile/portfolio` sin sistema de routing nuevo.
- `data-done` en `ChecklistItem`: atributo mínimo para testear estado sin cambiar el visual.
- Comment de `avatar.upload.ts` ahora referencia `MAX_AVATAR_BYTES` (no volverá a caducar).

## Fuera de alcance respetado

- Sin Prisma ni migraciones. Sin `package.json`/`pnpm-lock.yaml` ni dependencias nuevas.
- Sin `.env*`, `docker/**`, `.github/**`. Sin deploy. Sin cambios de auth/session.
- Sin tocar fuentes externas (Jooble/Greenhouse/Adzuna). Sin rediseño visual global (→ 17D).
- Sin header real con nombre/avatar (decisión explícita del orquestador). Sin compresión
  client-side de imágenes. Sin URLs de links en el DTO.
- Sin commit, push ni PR durante F0–F8. Sin Co-Authored-By.

## Problemas encontrados

- Ninguno bloqueante. Los 13 tests backend nuevos y los 11 web pasaron a la primera contra la
  implementación (sin bugs detectados en F2/F3/F5/F6/F7).

## Pendiente

- Aprobación del operador y **cierre Git** (commit + push + PR a `dev`), pendiente de
  instrucción explícita.
- 17D (visual polish) y hardening menor diferido: retry en errores, feedback de toggles, reset
  de filtros, header real, tokens de color/skeletons.

## Resultado final

**PASS.** Contrato Dashboard 17C completo de extremo a extremo (spec → backend → tests →
frontend → navegación → avatar), aditivo, sin Prisma, con 399+265 tests en verde y builds OK.
El hub muestra datos reales (foto, resumen, checklist, portfolio con estado y sugerencias
accionables) y el flujo candidato queda coherente Dashboard → CV → Portfolio → Jobs →
Guardadas → Match.

## Recomendación para el orquestador

- Revisar este informe y autorizar el **cierre Git** de Sprint 17C (commit único o por fases,
  push y PR a `dev`; sin merge por CLI — revisión humana en GitHub).
- **Siguiente sprint recomendado: Sprint 17D — Candidate UI polish** (Dashboard-CV-Jobs flow
  visual polish): tokens de color, consolidación de iconos, skeletons de carga, retirada de
  placeholders "futuro", refinamiento responsive/print, y el hardening menor diferido (retry,
  feedback de toggles, reset de filtros). **17D es visual/UX: no debe ampliar el contrato
  backend sin una spec previa aprobada.**

## Prompt sugerido para continuar

```
PROMPT PARA CLAUDE — Cierre Git Sprint 17C (Dashboard contract hardening)

Objetivo:
Cerrar en Git el Sprint 17C ya implementado y verificado en la rama
feat/sprint-17c-dashboard-contract-hardening (sin re-implementar nada).

Precondiciones:
- Ruta WSL /home/david/projects/JobIT-platform.
- Rama feat/sprint-17c-dashboard-contract-hardening con los 18 archivos + este informe.
- Verificaciones F8 en verde (api 399/399, web 265/265, builds OK).
- No anadir Co-Authored-By. No tocar codigo.

Tareas:
1. Re-verificacion rapida (typecheck api+web) y auditoria de alcance.
2. Commit unico: feat(dashboard): harden dashboard contract and candidate flow
3. push de la rama y PR a dev (sin merge por CLI; revision humana).
4. Reportar numero de PR.

Despues del merge:
Sprint 17D — Candidate UI polish (solo visual/UX; sin backend sin spec previa).
```
