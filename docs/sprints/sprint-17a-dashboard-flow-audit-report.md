# Sprint 17A — Dashboard & Candidate Flow Audit

## 1. Resumen ejecutivo

- **El flujo candidato existe completo y funciona conceptualmente**: registro/login → dashboard →
  CV → portfolio → jobs → detalle → guardar → guardadas → match → logout, con guards de sesión
  uniformes, estados loading/error/empty consistentes y enlaces externos seguros.
- **El Dashboard no actúa todavía como centro real del MVP**: su contenido quedó congelado en
  Sprint 07 y hoy es esencialmente decorativo; la navegación real ocurre por la sidebar.
- **Principal bloqueo (P0)**: el Dashboard **contradice el producto real** — marca JobIT Jobs,
  Guardadas y JobIT Match como "Pendiente" (botones deshabilitados y cards sin enlace) cuando esas
  rutas existen y funcionan desde los Sprints 03-05 (backend) y 15C-15E (UI).
- **Bug visible adicional (P1)**: `GREENHOUSE` no existe en los tipos/labels del frontend; con las
  3 ofertas reales ingeridas en dev (Sprint 16F.2), `/jobs` muestra "Fuente: undefined".
- **17B puede ser frontend-only**: `GET /api/dashboard/me` ya entrega `savedJobs.recent`,
  `matches` y `nextActions`, que la UI ignora. Activar el hub no requiere backend.
- **17C debe abordar contrato/spec**: `portfolio`, `cvSections`, `summary` y `nextActions`
  ampliadas requieren ampliar el DTO (aditivo, **sin Prisma ni migración**) y actualizar antes la
  spec `dashboard.md`.
- **17D queda reservado para polish visual** (tokens, iconos, skeletons), nunca antes de la
  activación funcional.

## 2. Objetivo inicial

Auditar el estado real del Dashboard y del flujo candidato completo del MVP JobIT, sin modificar
código, para decidir cómo activar el Dashboard como centro funcional del MVP antes de invertir en
diseño visual. Producir matriz de gaps priorizada y plan de activación por fases (17B/17C/17D).

## 3. Alcance auditado

- Frontend: `/dashboard`, `/profile` (+secciones), `/profile/portfolio` (+settings), `/u/[slug]`,
  `/jobs`, `/jobs/[id]`, `/saved-jobs`, `/match`, `/login`, `/register`, `SiteShell` (navegación
  global), tipos (`types/api.ts`) y helpers (`jobs-format.ts`).
- Backend: `GET /api/dashboard/me` y sus servicios fuente (profile, saved-jobs, match, jobs
  serializer), routers de portfolio privado/público, auth.
- Specs: `dashboard.md`, `candidate-profile-cv.md`, `saved-jobs.md`, `match-basic.md`, `jobs.md`,
  `job-sources-aggregation.md`, `jobit-portfolio-v1.md`.
- Fuera de alcance: implementación, Prisma, migraciones, deploy, fuentes nuevas.

## 4. Material revisado

- `apps/web/src/app/**` (13 páginas), `apps/web/src/features/{auth,dashboard,profile,jobs,
  saved-jobs,match}/**`, `apps/web/src/components/layout/site-shell.tsx`,
  `apps/web/src/types/api.ts`, `apps/web/src/lib/api-client.ts`.
- `apps/api/src/dashboard/**`, `apps/api/src/profile/**` (incl. portfolio y público),
  `apps/api/src/saved-jobs/**`, `apps/api/src/match/**`, `apps/api/src/jobs/**`,
  `apps/api/src/auth/**`, `apps/api/src/app.ts`, `apps/api/prisma/schema.prisma`.
- Tests: `dashboard-page.test.tsx` (8 casos web), `dashboard.integration.test.ts` (15 casos API),
  suites de profile/portfolio/jobs/saved/match.
- Docs: specs listadas en §3 e informes de Sprints 06, 07, 13.x, 14i, 15C-15G, 16-16F2.

## 5. Estado real del Dashboard

- Usa `GET /api/dashboard/me` (`dashboard-api.ts`, Bearer; guard sin token → `/login`; 401 →
  `clearSession()` + redirect; loading y error con `role="alert"`).
- Muestra: hero de bienvenida, progreso del perfil (progressbar ARIA), 4 métricas reales
  (perfil %, skills, guardadas, matches), acciones rápidas, checklist "Tu próximo paso",
  vista previa de JobIT CV y módulos MVP.
- **Solo integra bien `/profile` y `/profile#skills`** (hero, quick actions, próximo paso,
  ModuleCard JobIT CV; el ancla `#skills` existe en `profile-content.tsx:358`).
- **No integra correctamente `/jobs`, `/saved-jobs` ni `/match`**: QuickActions "Explorar
  ofertas" y "Revisar matches" son `<button disabled>` con badge "Pendiente"
  (`dashboard-content.tsx:332-333`) y las ModuleCards de JobIT Jobs, Guardadas y JobIT Match no
  tienen `href` (`dashboard-content.tsx:427-437`), pese a que la sidebar (`PRIVATE_NAV`,
  `site-shell.tsx:120-126`) las enlaza como disponibles → contradicción interna.
- **No muestra Portfolio** en ningún bloque (feature completa desde Sprint 14i, con rutas
  `/profile/portfolio`, `/profile/portfolio/settings` y `/u/[slug]`).
- **Ignora datos ya entregados por la API**: `savedJobs.recent` (≤3 con job serializado),
  detalle de `matches` (score/level/matchedSkills/missingSkills) y `nextActions` (no se
  renderiza; solo aparece en fixtures de test).
- **Checklist/preview con datos hardcodeados**: Experiencia/Proyectos/Enlaces siempre `false`
  (`dashboard-content.tsx:359-365`); la preview del CV fija placeholders de resumen, proyectos y
  enlaces aunque el usuario tenga datos reales (`dashboard-content.tsx:386-413`) — el DTO actual
  no trae esos campos, por lo que la corrección completa es de contrato (17C).
- Tests web: 8 casos; dos aserciones **fijan el comportamiento obsoleto** (esperan los botones
  deshabilitados, `dashboard-page.test.tsx:172-173`).

## 6. Estado real de GET /api/dashboard/me

- Ruta: `GET /api/dashboard/me` (montada en `app.ts:54`; handler `dashboard.router.ts`).
- Auth: `requireAuth`; el `userId` procede siempre del token (query/body ignorados, con test).
- DTO actual (`CandidateDashboardDto`):
  - `profile { firstName, lastName, headline, completionPercentage }`
  - `skills: string[]`
  - `savedJobs { total, recent: SavedJobDto[] (≤3, savedAt desc) }`
  - `matches: ProfileJobMatchDto[] (≤3, score desc, explicables)`
  - `nextActions: { action, label }[]` (solo `complete_profile` y `explore_jobs`)
- Composición read-only: `getOrCreateCandidateProfile` + `calculateCompletionPercentage` +
  `listSavedJobs` + `getTopMatchesForUser(userId, 3)`. Jobs embebidos con `serializeJob` →
  **nunca expone `externalId`/`ingestedAt`** (test explícito). 15 tests de integración en verde
  históricamente.
- **Ya permite activar sin backend**: guardadas recientes, top matches, nextActions y los enlaces
  reales del hub (las rutas destino existen).
- **Falta para 17C** (ampliación aditiva del DTO):
  - `portfolio { isPublished, slug, publicUrlPath } | null`
  - `cvSections` (flags basics/skills/experience/education/projects/links/preferences,
    derivables del perfil ya cargado, reutilizando la lógica de `calculateCompletionPercentage`)
  - `summary` (campo ya existente en `CandidateProfile`)
  - `nextActions` ampliadas (catálogo: publish_portfolio, add_experience, add_projects,
    add_links, review_matches…)
- Aclaraciones de diseño:
  - **No hace falta Prisma ni migración**: todos los datos existen en el modelo actual.
  - **Portfolio debe leerse con `portfolioSettings.findUnique`**, NUNCA con
    `getOrCreatePortfolioSettings` (crearía fila y slug como efecto colateral de una lectura);
    `null` se interpreta como "sin configurar/no publicado".

## 7. Estado del flujo candidato

| Paso | Ruta | Estado | Problema principal | Prioridad |
|---|---|---|---|---|
| Registro | `/register` | ✅ | — (valida, crea sesión, → `/dashboard`) | — |
| Login | `/login` | ✅ | — (→ `/dashboard`) | — |
| Dashboard | `/dashboard` | ⚠️ | Contenido congelado: niega módulos operativos, ignora recent/matches/nextActions | **P0/P1** |
| Perfil/CV | `/profile` | ✅ | — (read model completo, guardado, estados) | — |
| Skills | `/profile#skills` | ✅ | — (ancla real, CRUD) | — |
| Experiencia | `/profile` (sección) | ✅ | Checklist del hub la marca `false` fija | P1 (17C) |
| Educación | `/profile` (sección) | ✅ | Sin reflejo en hub | P1 (17C) |
| Proyectos | `/profile` (sección) | ✅ | Checklist del hub la marca `false` fija | P1 (17C) |
| Enlaces | `/profile` (sección) | ✅ | Preview del hub los muestra grises fijos | P1 (17C) |
| Portfolio | `/profile/portfolio` | ✅ | Invisible desde Dashboard y sidebar (solo vía `/profile`) | P1 |
| Portfolio settings | `/profile/portfolio/settings` | ✅ | — (slug/flags/publish/unpublish + QR, vuelta clara) | — |
| Portfolio público | `/u/[slug]` | ✅ | — (404 honesto; público) | — |
| Jobs | `/jobs` | ✅ | "Fuente: undefined" para GREENHOUSE; empty con filtros sin CTA reset | P1 / P2 |
| Job detail | `/jobs/[id]` | ✅ | — (404 honesto, volver, enlace externo seguro, aviso honesto sin URL) | — |
| Guardar oferta | card/detalle | ✅ | Fallo silencioso sin feedback | P2 |
| Guardadas | `/saved-jobs` | ✅ | — (empty state ejemplar → `/jobs`) | — |
| Match | `/match` | ✅ | — (explicable, empty ejemplar → `/profile` + `/jobs`) | — |
| Job match detail | panel en `/jobs/[id]` | ✅ | — (autocontenido, CTA `/profile`) | — |
| Logout | header `SiteShell` | ✅ | — | — |

## 8. Matriz de gaps

| Área | Estado actual | Gap | Impacto MVP | Prioridad | Dependencia | Esfuerzo | Acción recomendada | Sprint sugerido |
|---|---|---|---|---|---|---|---|---|
| Dashboard | QuickActions Jobs/Match `disabled` "Pendiente" | Sin `href` a rutas operativas | Hub niega el producto | **P0** | Frontend only · Tests required | S | `href` reales + quitar "Pendiente" | 17B |
| Dashboard | ModuleCards Jobs/Guardadas/Match sin enlace | Ídem | Ídem | **P0** | Frontend only · Tests required | S | `href` reales | 17B |
| Dashboard | `savedJobs.recent` ignorado | Hub sin contenido real | Sin camino a detalle desde hub | P1 | Frontend only | M | Sección guardadas recientes | 17B |
| Dashboard | `matches` solo count | Explicabilidad perdida | Valor desaprovechado | P1 | Frontend only | M | Sección top matches | 17B |
| Dashboard | `nextActions` sin renderizar | Sin guía | Checklist paralelo miente | P1 | Frontend only | S | Render + mapa acción→ruta | 17B |
| Dashboard | Checklist/preview hardcodeados | UI contradice datos reales | Desinforma | P1 | Backend additive · Spec required · No Prisma | M | `cvSections`+`summary` | 17C |
| Dashboard | Métricas no clicables | Fricción | Menor | P2 | Frontend only | S | Deep-links | 17C |
| JobIT CV | Flujo completo y sólido | — | — | — | — | — | — | — |
| Portfolio | Ausente del hub | Feature invisible | Descubrimiento nulo | P1 | Frontend only | S | CTA estático `/profile/portfolio` | 17B |
| Portfolio | Ausente de `PRIVATE_NAV` | Solo vía `/profile` | Descubrimiento débil | P1 | Frontend · Product decision | S | Ítem sidebar | 17C |
| Portfolio | Status/slug fuera del DTO | Hub sin "publicado/URL" | Valor perdido | P1 | Backend additive · Spec · No migration | M | `portfolio` vía `findUnique` | 17C |
| Jobs | GREENHOUSE fuera de tipos/labels | "Fuente: undefined" con datos reales | Viola "fuente siempre visible" | **P1** | Frontend only · Tests required | S | Tipo+labels+CTA+test | 17B |
| Jobs | Empty con filtros sin reset | Fricción | Menor | P2 | Frontend only | S | Botón limpiar filtros | 17C |
| Saved Jobs | Flujo OK; hub solo `total` | Recientes no visibles en hub | (cubierto por Dashboard-recent) | P1 | — | — | — | 17B |
| Match | Flujo OK; hub solo count | Explicabilidad no aprovechada | (cubierto por Dashboard-matches) | P1 | — | — | — | 17B |
| Navigation/AppShell | Sidebar OK (5 rutas); contradice al hub | Mensaje incoherente | Confianza | **P0** | Frontend only | — | Se resuelve con links P0 | 17B |
| Navigation/AppShell | Header "Candidato tech"/"CT" fijos | Identidad genérica | Menor | P2 | Frontend only | M | Nombre/avatar reales | 17C |
| Auth/session | Sesión en memoria (ADR-0006) | Recarga → login | Aceptado por diseño | P2 | Product decision | L | Solo si producto lo pide | Posterior |
| Empty states | Saved/Match ejemplares; hub 0s sin acción | 0 sin invitación | Menor | P1 | Frontend only | S | Empty accionable en secciones nuevas | 17B |
| Error states | Sin retry en ninguna pantalla | Recarga manual | Menor | P2 | Frontend only | S | CTA reintentar | 17C |
| Responsive | Grid + drawer accesible OK | Sin gap funcional | — | P3 | Future polish | — | Skeletons/print | 17D |
| Tests | 2 aserciones fijan `disabled` obsoleto | Test protege el bug | Bloquea activación | **P0** | Tests required | S | Actualizar con links | 17B |
| Tests | Faltan GREENHOUSE + renders del hub | Cobertura de activación | — | P1 | Tests required | M | Añadir en 17B | 17B |
| Specs | `dashboard.md` sin portfolio, naming legacy | Gate SDD para 17C | Bloquea contrato | P1 | Spec required · Product decision | M | Actualizar antes de 17C | 17C (previo) |
| Backend contract | Suficiente para 17B; ampliable sin Prisma | Falta portfolio/cvSections/summary/acciones | — | P1 | Backend additive · No migration | M | Ampliación aditiva | 17C |
| Frontend contract/types | `JobSource` web = INTERNAL\|JOOBLE | Drift al añadir fuentes | Recurrente | P1 | Frontend only · Checklist proceso | S | Fix + checklist "nueva fuente ⇒ types/labels web" | 17B |

## 9. Gaps funcionales

1. **(P0)** Hub sin enlaces a `/jobs`, `/saved-jobs`, `/match` (QuickActions + ModuleCards) pese a
   rutas operativas — contradice el producto y a la propia sidebar.
2. **(P1)** `savedJobs.recent`, detalle de `matches` y `nextActions` entregados por la API y no
   renderizados: el hub no muestra contenido real más allá de 4 conteos.
3. **(P1)** Portfolio (14i) invisible desde el hub (y desde la sidebar).
4. **(P1)** "Fuente: undefined" en `/jobs` para ofertas GREENHOUSE reales (tipos/labels front).
5. **(P1, contrato)** Checklist y preview del CV con valores inventados; requieren
   `cvSections`/`summary` en el DTO (17C).

## 10. Gaps UX/UI

- Métricas del hub no clicables (P2). Empty de `/jobs` con filtros sin CTA de reset (P2).
- Toggles de guardado silenciosos ante error (P2). Errores sin botón de reintento (P2).
- Header con "Candidato tech" y avatar "CT" fijos (P2).
- Colores hex repetidos sin tokens; iconos duplicados SiteShell/Dashboard; sin skeletons;
  "Ajustes (futuro)" / "Ayuda (futuro)" como placeholders no accionables (P3, 17D).

## 11. Gaps backend/frontend contract

- **Backend**: DTO sin `portfolio` (leer con `findUnique`, no `getOrCreate`), sin `cvSections`,
  sin `summary`, `nextActions` limitadas a 2 acciones. Ampliación **aditiva, sin Prisma**.
  Nota de escala (no bloqueante): `listSavedJobs` trae todas las filas para contar y
  `getTopMatchesForUser` puntúa todas las ofertas activas.
- **Frontend**: `JobSource` en `types/api.ts:62` y `JOB_SOURCE_LABELS`/`externalSourceCtaLabel`
  en `jobs-format.ts` no incluyen `GREENHOUSE` (ni ADZUNA futuro). Riesgo de drift recurrente:
  añadir al proceso de "nueva fuente" el paso "actualizar types/labels web".
- **Spec**: `dashboard.md` conceptualmente alineada (ya pedía recent/matches/next steps — la UI
  actual la incumple) pero desfasada en naming (`completeness`/`nextSteps`/`topMatches`) y sin
  portfolio. Actualizarla es gate de 17C, no de 17B.

## 12. Riesgos

1. **P0 sin resolver = MVP incoherente** ante cualquier usuario o demo (mitigación: 17B pequeño).
2. **Drift de fuentes front/back** recurrente (GREENHOUSE hoy, ADZUNA mañana si sale del HOLD).
3. **Ampliar DTO sin spec actualizada** rompería el flujo SDD (spec primero en 17C).
4. **`getOrCreate` de portfolio en lecturas** crearía filas involuntarias (usar `findUnique`).
5. **Test backend de shape** puede fijar claves exactas: actualizar junto al contrato en 17C.
6. **Mezclar activación con rediseño visual** diluiría 17B: separación estricta 17B/17D.

## 13. Must-have antes de diseño visual

### Must-have funcional
- Activar links P0 a `/jobs`, `/saved-jobs`, `/match` (QuickActions + ModuleCards).
- Renderizar `savedJobs.recent` (con enlaces a `/jobs/[id]` y `/saved-jobs`).
- Renderizar top `matches` (score/level, enlaces a `/jobs/[id]` y `/match`).
- Renderizar `nextActions` (mapa acción→ruta en la UI).
- Añadir CTA a Portfolio (`/profile/portfolio`).
- Corregir `GREENHOUSE` en frontend (tipo + labels + CTA de fuente).

### Must-have contrato/spec
- Actualizar `docs/specs/features/dashboard.md` **antes** de 17C (portfolio, cvSections,
  catálogo de nextActions, naming real del contrato).
- Añadir `portfolio`, `cvSections`, `summary` y `nextActions` ampliadas al contrato del
  Dashboard (aditivo). **Sin Prisma ni migración.**

### Must-have tests
- Actualizar los tests que esperan botones `disabled` (dashboard-page.test.tsx:172-173).
- Añadir tests de render para recent/matches/nextActions/CTA portfolio.
- Añadir test para `GREENHOUSE` (labels + card con esa fuente).
- (17C) Tests backend: portfolio null/no-publicado/publicado (sin crear fila), flags por sección,
  summary, nextActions ampliadas.

### No hacer todavía
- Rediseño visual (17D). Migraciones Prisma (innecesarias). Nuevas fuentes (ADZUNA en HOLD).
- Deploy. Persistencia de sesión (ADR-0006 vigente). Renombrados innecesarios del DTO.

## 14. Plan de activación propuesto

| Sprint | Objetivo | Incluye | Excluye | Dependencias | Criterio de éxito |
|---|---|---|---|---|---|
| **17B — Dashboard activation** | Hub funcional conectado al producto real, frontend-only | Links P0; render recent/matches/nextActions; CTA Portfolio; fix GREENHOUSE (types+labels+CTA); tests web actualizados/añadidos | Backend; Prisma; migraciones; rediseño visual; spec extensa | Ninguna (DTO y spec vigentes lo cubren) | Desde `/dashboard` se navega a los 6 destinos; hub muestra contenido real; sin "Pendiente" falso; sin "Fuente: undefined"; suite web verde |
| **17C — Candidate flow hardening** | Contrato ampliado + coherencia con datos reales | Spec dashboard actualizada (gate previo); DTO +portfolio/cvSections/summary/nextActions ampliadas; checklist/preview reales; Portfolio en sidebar; header real; retry/feedback/reset filtros; métricas clicables; tests backend | Rediseño visual; nuevas fuentes; migraciones | 17B mergeado; spec aprobada antes del código | DTO ampliado con tests; checklist refleja datos reales; portfolio visible con estado; sin regresiones |
| **17D — UI polish** | Refinamiento visual sobre base funcional | Tokens de color; iconos consolidados; skeletons; limpieza visual; responsive/print polish | Cambios funcionales grandes; contrato backend | 17B+17C mergeados | Sin cambios de comportamiento; visual coherente |

## 15. Criterios de aceptación

Para dar por activado el Dashboard (cierre de 17B):
- [ ] Desde `/dashboard` se puede navegar a `/profile`, `/jobs`, `/saved-jobs`, `/match` y
      `/profile/portfolio` desde el contenido (no solo la sidebar).
- [ ] El hub muestra ≥1 guardada reciente y ≥1 match con score cuando existen datos.
- [ ] `nextActions` visibles y enlazadas a su ruta.
- [ ] Ninguna mención "Pendiente" para módulos operativos.
- [ ] Ninguna "Fuente: undefined" (GREENHOUSE etiquetado).
- [ ] Tests web actualizados y en verde; typecheck/lint/build web en verde.
- [ ] Cero cambios en backend, Prisma, package.json o pnpm-lock.yaml.

## 16. Tests y verificaciones

Sprint 17A es una auditoría documental/técnica de solo lectura; **no se han ejecutado tests**
salvo inspección estática de código y specs. Estado:

- `pnpm --filter @jobit/web typecheck` → **NOT_RUN**
- `pnpm --filter @jobit/web test` → **NOT_RUN**
- `pnpm --filter @jobit/web lint` → **NOT_RUN**
- `pnpm --filter @jobit/web build` → **NOT_RUN**
- `pnpm --filter @jobit/api typecheck` → **NOT_RUN**
- `pnpm --filter @jobit/api test` → **NOT_RUN**
- `pnpm --filter @jobit/api build` → **NOT_RUN**

Justificación: no hay cambios de código que verificar; las verificaciones completas corresponden
a la implementación de 17B/17C. Referencia histórica: las suites estaban en verde al cierre de
Sprint 16F.2 (41 archivos / 385 tests API).

## 17. Archivos modificados

- **Único archivo**: `docs/sprints/sprint-17a-dashboard-flow-audit-report.md` (este informe).
- Sin código. Sin Prisma/migraciones. Sin `package.json`/`pnpm-lock.yaml`. Sin `.env`.
- Nota de higiene previa (Fase 1B, misma rama): se eliminó un `package-lock.json` accidental
  no versionado (lockfile npm vacío en monorepo pnpm); no forma parte del diff.

## 18. Problemas encontrados

- `package-lock.json` npm accidental en la raíz (detectado en Fase 1, eliminado en Fase 1B).
- Falso BLOCKED puntual por la limitación conocida de `$(...)` en comandos anidados WSL durante
  la Fase 1B; resuelto ejecutando los scripts desde `/tmp` (sin impacto en el repo).
- Naming documental: el informe de Sprint 06 existe como
  `sprint-06-candidate-dashboard-final-report.md` (una referencia esperaba
  `sprint-06-dashboard-final-report.md`). No bloqueante.
- Serie documental 14a-14h sin informes individuales (solo `sprint-14i`). No bloqueante.

## 19. Recomendación para el orquestador

- **Sprint 17A: PASS.** Auditoría completa (6 fases) sin tocar código: Dashboard desfasado
  diagnosticado con evidencia, contrato revisado, flujo E2E validado, matriz de gaps priorizada
  y plan de activación 17B/17C/17D definido.
- Revisar este informe y, si procede, **autorizar el cierre Git documental** (commit + push + PR
  de este único documento a `dev`).
- Ejecutar después **Sprint 17B — Dashboard activation** (frontend-only, sin dependencias): es el
  mínimo cambio con máximo impacto para que el MVP sea coherente.
- Mantener el orden SDD para 17C: actualizar `dashboard.md` antes de ampliar el contrato.

## 20. Prompt sugerido para continuar

```
PROMPT PARA CLAUDE — Sprint 17B · Dashboard activation (frontend-only)

Objetivo:
Activar el Dashboard como centro funcional del MVP conectándolo con las pantallas
candidate-first ya operativas, SOLO frontend, sin tocar backend ni Prisma y sin
rediseño visual.

Rama:
feat/sprint-17b-dashboard-activation (desde dev actualizado).

Tareas:
1. Links P0: QuickActions "Explorar ofertas" -> /jobs y "Revisar matches" -> /match;
   ModuleCards JobIT Jobs -> /jobs, Guardadas -> /saved-jobs, JobIT Match -> /match
   (retirar el estado "Pendiente" obsoleto de esos modulos).
2. Renderizar savedJobs.recent (<=3) con enlaces a /jobs/[id] y a /saved-jobs.
3. Renderizar top matches (score/level) con enlaces a /jobs/[id] y a /match.
4. Renderizar nextActions con mapa accion->ruta (complete_profile -> /profile,
   explore_jobs -> /jobs).
5. CTA a Portfolio -> /profile/portfolio.
6. Fix GREENHOUSE: anadir a JobSource en apps/web/src/types/api.ts, a
   JOB_SOURCE_LABELS y a externalSourceCtaLabel en jobs-format.ts (+ tests).
7. Tests web: actualizar las 2 aserciones toBeDisabled obsoletas; anadir tests de
   render de recent/matches/nextActions/CTA portfolio y del label GREENHOUSE.
8. Verificaciones: pnpm --filter @jobit/web typecheck / test / lint / build.

Restricciones:
No backend. No Prisma. No migraciones. No rediseno visual. No nuevas dependencias.
No tocar apps/api/**. No Co-Authored-By. No commit/push/PR sin autorizacion.

Criterios de aceptacion:
Los del informe sprint-17a-dashboard-flow-audit-report.md §15.
```
