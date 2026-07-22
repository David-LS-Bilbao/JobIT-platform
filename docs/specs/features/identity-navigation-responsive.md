# Spec: Identity, Navigation & Responsive Alignment — UX frontend (Sprint 21D)

## Metadatos

- **Sprint**: 21D — Identity, Navigation & Responsive Alignment (mini-spec).
- **Tipo**: **frontend-only**. No toca `apps/api/**`, Prisma, DB, contratos HTTP/DTO, scoring ni
  persistencia de sesión (ADR-0006 intacto).
- **Hallazgos que resuelve**: **TAB-01** (+ overflow móvil del shell), **NAV-02**, **VIS-01**,
  **NAV-01**, **FLOW-02**, **DASH-04**, **RESP-03**, **PORT-01**.
  Referencia: [sprint-21-ux-ui-audit-report.md](../../sprints/sprint-21-ux-ui-audit-report.md)
  (§7, §9, §10 P1/P2/P3, §14 roadmap 21D).
- **Dependencias**: Sprints 21A/21B/21C integrados en `dev@6159b93`.
- **Fuera de alcance explícito**: **MATCH-04**, deuda **A11Y-01…05** de 21E, SAVED-02, PROF-01,
  PROF-02, PORT-02 (ver §K).

## 1. Problema

- **TAB-01 + overflow (P1)**: el `SiteShell` cambia sidebar↔drawer en `md` (768 px): a 768 conviven
  sidebar fija (256 px) y controles desktop, con header comprimido; y el header desborda
  horizontalmente también a 390 px (confirmado en 21C en **todas** las rutas privadas, incl.
  `/jobs` de control).
- **NAV-02 (P1)**: el header muestra identidad **estática** "Candidato tech / CT", contradiciendo el
  saludo personalizado.
- **VIS-01 (P2)**: el símbolo "J" usa dos gradientes de marca distintos (app vs landing/auth).
- **NAV-01 (P2)**: "Preparar JobIT CV" aparece 3 veces, casi homónimo del ítem de nav "JobIT CV".
- **FLOW-02 (P2)**: recargar/entrar a una ruta privada sin sesión (ADR-0006) redirige a `/login` **sin
  explicación**; no se distingue de un logout manual ni de una expiración 401.
- **DASH-04 (P2)**: el badge "Siguiente" (absoluto) se superpone al texto en móvil.
- **RESP-03 (P2)**: en Profile móvil, progreso y preview quedan al final de un scroll muy largo.
- **PORT-01 (P3)**: Portfolio Settings no tiene retorno explícito "← Volver al portfolio".

## 2. Objetivo

Alinear identidad, navegación y responsive del shell y de tres pantallas, **solo presentación
frontend**, sin rediseño, sin cambiar backend/DTO/ADR-0006 ni añadir dependencias.

## 3. Fuente de verdad (código actual)

- Shell: [site-shell.tsx](../../../apps/web/src/components/layout/site-shell.tsx) — sidebar
  `md:flex` (281-283), offset `md:ml-64` (322-325), toggle desktop `md:inline-flex` (336), menú móvil
  `md:hidden` (345), drawer `md:hidden` (292), identidad `hidden … sm:flex` (355-360), logout
  `rounded-full … px-3 py-1.5` (361-367), `BrandMark` `from-jobit-brand to-jobit-green` (96-102).
- Sesión: [auth-context.tsx](../../../apps/web/src/features/auth/auth-context.tsx) — `accessToken` +
  `user` (email/role) en memoria; `setSession`/`clearSession`. **No** firstName/headline/avatar.
- Identidad tipada: `getMyProfile(token)` → `CandidateProfileDto` (`firstName`, `lastName`,
  `headline`, `avatarUrl`); `updateMyProfile` devuelve el DTO; `uploadProfileAvatar` devuelve
  `{ avatarUrl }`. Avatar reutilizable: [ProfileAvatar](../../../apps/web/src/features/profile/profile-avatar.tsx)
  (`name`, `avatarUrl`, fallback a `initialsFrom`).
- Guardas privadas (8) + handlers 401 (`isSessionExpiredError`): `dashboard-page.tsx`,
  `profile-page.tsx`, `profile-portfolio-page.tsx`, `profile-portfolio-settings-page.tsx`,
  `jobs-page.tsx`, `job-detail-page.tsx`, `saved-jobs-page.tsx`, `match-page.tsx` — todas hacen
  `if(!accessToken) router.push("/login")` (guarda) y `isSessionExpiredError → clearSession()+push("/login")`.
- Login: [login/page.tsx](../../../apps/web/src/app/login/page.tsx) + [AuthFormShell](../../../apps/web/src/features/auth/auth-form-shell.tsx)
  (server components; logo `from-sky-400/500 to-emerald-400/500`).
- Landing: [app/page.tsx](../../../apps/web/src/app/page.tsx) — logo navbar (118) y footer (426)
  `from-sky-* to-emerald-*`.
- Profile: [profile-content.tsx](../../../apps/web/src/features/profile/profile-content.tsx) — grid
  `grid-cols-1 lg:grid-cols-12`, editor `lg:col-span-8` (210) **antes** que rail progreso+preview
  `lg:col-span-4` (394) en el DOM.
- Dashboard: [dashboard-content.tsx](../../../apps/web/src/features/dashboard/dashboard-content.tsx) —
  badge "Siguiente" `absolute right-4 top-4` (617-619); QuickActions (462-467); CTAs "Preparar JobIT
  CV" (422, 463) y del pie de sidebar (site-shell 211-216); blur decorativo `absolute -right-16 … w-64`
  (396-399).
- Tokens: [globals.css](../../../apps/web/src/app/globals.css) — `jobit-brand #006591`,
  `jobit-green #006c49` (19-28); light-only (VIS-08 ya retirado en 21A).

## 4. Contrato responsive del shell (TAB-01 + overflow)

### 4.1 Breakpoints
- **0–1023 px (móvil + tablet)**: **drawer** (menú por botón + overlay), **sin sidebar fija**, **una
  sola navegación** visible.
- **≥1024 px (`lg`, desktop)**: **sidebar fija** + contenido con offset + controles desktop.

Las **cuatro clases coordinadas** pasan de `md` a `lg`:
1. sidebar `<aside>`: `md:flex` → **`lg:flex`**;
2. offset del contenido: `md:ml-64`/`md:ml-0` → **`lg:ml-64`/`lg:ml-0`**;
3. control desktop (toggle sidebar): `md:inline-flex` → **`lg:inline-flex`**;
4. control móvil (abre drawer) y drawer: `md:hidden` → **`lg:hidden`**.

Ajuste coordinado del bloque de identidad del header (`hidden … sm:flex`): pasa a mostrarse desde
**`lg`** (`hidden … lg:flex`) para no comprimir el header en tablet; el logout permanece visible en
todos los anchos.

### 4.2 Header sin overflow
- El bloque de título usa **`min-w-0`** y puede encoger; el `<h1>` largo se **trunca** (`truncate`) o
  envuelve de forma controlada; el subtítulo sigue `hidden … md:block`.
- Las acciones derechas (identidad + logout) usan **`shrink-0`**.
- **No** ocultar el botón de logout; **no** reducir nombres accesibles de ningún control.
- **Criterio medible**: `document.scrollWidth <= document.clientWidth` en las rutas privadas
  auditadas a **390, 768 y 1440 px**.

### 4.3 Dashboard: blur decorativo
- El blur decorativo del hero no puede ampliar `document.scrollWidth`: se garantiza **clipping/overflow
  local** (contenedor con `overflow-hidden` que realmente contenga el nodo), sin recurrir a
  `overflow-x:hidden` global del documento.
- La **medición runtime (21D.2/21D.6)** confirma el nodo culpable exacto a 390/768 antes de cerrar la
  implementación (candidatos: la fila del header y el blur del hero).

## 5. Identidad real del header (NAV-02)

### 5.1 Fuente y arquitectura
- Fuente: `getMyProfile(token)` → `CandidateProfileDto` (`firstName`, `lastName`, `headline`,
  `avatarUrl`).
- **Snapshot ligero de identidad** en `AuthContext` (o capa session-scoped equivalente):
  `{ firstName, lastName, headline, avatarUrl }` (o null).
- **Una única lectura por sesión autenticada** (no una por página): se dispara cuando hay sesión y el
  snapshot está vacío. **No** bloquea la carga del contenido privado: el header muestra fallbacks
  hasta que resuelva.
- **401** durante esa lectura: termina la sesión con **reason=expired** (§6).
- **Error no-401**: mantiene el fallback y la app continúa (sin romper el shell).

### 5.2 Fallbacks
- Nombre a mostrar: nombre+apellido si existe; si falta, **"Candidato tech"**.
- Iniciales: de nombre y apellido; si faltan, **"CT"**.
- Headline: solo si tiene contenido; si no, se omite (no placeholder).
- **Nunca** mostrar el email.

### 5.3 Avatar
- Usar avatar real cuando exista, mediante `ProfileAvatar` (patrón seguro actual: `resolveProfileImageUrl`
  + `onError` → iniciales). Fallback accesible a iniciales. **No** crear un uploader nuevo.

### 5.4 Sincronización (sin peticiones nuevas)
- Tras cargar Profile (`getMyProfile` en `/profile`) → actualizar el snapshot con el DTO ya recibido.
- Tras **guardar datos básicos** (`updateMyProfile` devuelve `CandidateProfileDto`) o **subir avatar**
  (`uploadProfileAvatar` devuelve `{ avatarUrl }` y `/profile` re-obtiene el perfil) → **actualizar el
  snapshot con la respuesta ya disponible**, sin una petición adicional.
- Objetivo: el header no queda obsoleto hasta el siguiente login.
- **No** cambiar DTO HTTP ni backend.

## 6. Sesión y aviso contextual (FLOW-02)

### 6.1 Razones autorizadas
| reason | Caso | Copy exacto |
|---|---|---|
| `required` | Acceso/recarga de ruta privada **sin** `accessToken` en memoria (reload, deep-link) | **"Inicia sesión para continuar."** |
| `expired` | Respuesta **401** / `isSessionExpiredError` durante sesión activa | **"Tu sesión ha finalizado. Vuelve a iniciar sesión."** |
| (logout) | Logout manual | navega a `/login` **sin** reason → **sin** aviso |

`required` es honesto también para un deep-link privado abierto sin sesión (no afirma que expiró).

### 6.2 Contrato interno
- El contexto/sesión distingue **logout intencional**, **expiración** y **ausencia inicial**: se añade
  un estado transitorio en memoria `endReason: "expired" | "logout" | null`, fijado por
  `clearSession(reason?)`.
- **Blindaje de la carrera** `clearSession()` ↔ guardas privadas: al ejecutarse un logout,
  `clearSession("logout")` fija `endReason="logout"` **antes** de dejar el token en null; la guarda de
  ruta privada, al ver `!accessToken`, **solo** añade `reason=required` cuando `endReason == null`
  (ausencia genuina: reload/deep-link). Una guarda **no** puede convertir un logout manual en
  `reason=required` ni pisar un `reason=expired`.
- **Login exitoso** (`setSession`) limpia cualquier `endReason` previo.
- **Prohibido** `localStorage`/`sessionStorage` para el token o para resolver este flujo; **no** se
  persiste sesión; **no** se cambia ADR-0006.

### 6.3 Centralización
- Se introduce un **helper compartido** `redirectToLogin(router, reason?)` (o método de contexto) que
  las guardas y los handlers 401 usan, evitando 8 implementaciones divergentes:
  - Guarda (`!accessToken` al montar): `redirectToLogin(router, endReason == null ? "required" : undefined)`.
  - Handler 401: `clearSession("expired")` + `redirectToLogin(router, "expired")`.
  - Logout (site-shell): `clearSession("logout")` + `redirectToLogin(router)` (sin reason).
- **Migran**: las 8 páginas privadas (guarda + handler 401) y el logout del `SiteShell`.

### 6.4 Login (App Router, build estático)
- El aviso se renderiza en `/login` **solo** para `required`/`expired`; reason ausente/desconocido →
  **sin** aviso.
- Se lee `useSearchParams()` en un **componente cliente pequeño** (p. ej. `SessionNotice`) envuelto en
  **`<Suspense>`** para no provocar el *CSR bailout* del build estático (Next App Router). El resto de
  `/login` puede seguir siendo server component.
- El aviso es **accesible** (`role="status"`/`aria-live` para `required`; para `expired` puede usarse
  `role="status"` — no bloquea el formulario) y **conserva** los errores propios del formulario de
  login.
- (`/register` no requiere aviso; se documenta que el patrón podría reutilizarse si se decidiera.)

## 7. Navegación — CTA (NAV-01)

- **CTA primario de Dashboard**: **"Preparar JobIT CV"** del hero (se conserva).
- **Retirar** el **QuickAction duplicado** hacia `/profile` ("Preparar JobIT CV", dashboard-content
  463).
- **Retirar** el **CTA permanente del pie del sidebar** ("Preparar JobIT CV", site-shell 211-216).
- **Conservar** el ítem de navegación **"JobIT CV"** (acceso al CV desde el menú) y **"Mejorar tu
  JobIT CV"** en "Tu próximo paso" (acción contextual).
- Regla: una vista **no** presenta tres CTAs equivalentes al mismo destino; se distingue navegación
  permanente (ítem "JobIT CV") de siguiente acción contextual (hero / "Tu próximo paso").
- **Composición de QuickActions tras el cambio**: quedan **3** acciones ("Añadir skills",
  "Explorar ofertas", "Revisar matches") en un grid **`grid-cols-3`** (sustituye `md:grid-cols-4`)
  para no dejar hueco ni grid roto. El pie del sidebar queda sin CTA (solo `border-t` retirado o
  vacío), sin afectar la navegación.

## 8. Identidad visual — logo (VIS-01)

- Landing/Auth **oscuras** y app **clara** siguen siendo **variantes de una sola identidad**; **no** se
  convierte la landing a tema claro ni se rediseñan Auth/landing.
- Se unifica el símbolo "J" mediante un **`BrandMark` compartido** (o fuente única equivalente) con
  gradiente **canónico `jobit-brand → jobit-green`**; solo se adaptan **superficie/tamaño/color de
  texto** según contexto (p. ej. "J" en blanco sobre el gradiente).
- Se elimina la divergencia **`sky→emerald` del logo** en: landing navbar (118) y footer (426), y
  `AuthFormShell` (40, 71). **No** se tocan necesariamente otros acentos informativos de la landing
  (p. ej. el avatar ficticio de la preview del producto), que son ilustrativos, no el logo.
- Se **reutilizan** los tokens existentes; **sin** tokens dark nuevos salvo necesidad técnica
  demostrada; **sin** Figma/Canva.
- **Accesibilidad del logo**: la "J" es decorativa (`aria-hidden`); dentro de un enlace a `/`, el
  nombre accesible del enlace lo aporta el texto "JobIT" adyacente.

## 9. Responsive por pantalla

### 9.1 DASH-04 (badge "Siguiente")
- El badge se integra **en el flujo** o con **espacio reservado** (p. ej. padding del contenido), con
  **cero superposición a 390 px**; desktop intacto; sin posicionamiento absoluto que invada el copy.

### 9.2 RESP-03 (orden Profile móvil)
- En **móvil**, la rail de **progreso + preview** aparece **antes** del editor; en **desktop**, sigue
  como rail derecha (`lg:col-span-4`, sticky).
- Se usa **orden responsive** (`order-*` por breakpoint) sobre los dos hijos del grid; **no** se
  duplica contenido; **no** tabs/acordeones/rediseño.
- Se comprueba que mover la rail **no** crea un bloque desproporcionado antes del formulario (mantener
  la rail razonablemente compacta en móvil; el hero ya muestra un progreso resumido arriba).

### 9.3 PORT-01 (retorno Portfolio Settings)
- Enlace explícito **"← Volver al portfolio"** con destino exacto **`/profile/portfolio`**, reutilizando
  el patrón de retorno existente ("← Volver a …"). El sidebar sigue marcando **Portfolio** (regla de
  prefijo más largo, ya cubierta). **Sin** breadcrumb global.

## 10. Accesibilidad preservada (sin absorber 21E)

- El drawer conserva `role="dialog"`/`aria-modal`/`aria-label` actuales.
- Identidad/avatar con nombre alternativo correcto (`alt`/iniciales).
- Avisos de sesión anunciables (`role="status"`/`aria-live`).
- Todo link/botón mantiene nombre accesible; foco visible existente intacto.
- La jerarquía de headings no empeora; los cambios de orden visual (RESP-03) no contradicen gravemente
  el orden DOM.
- El logout es siempre alcanzable.
- **No** se implementan A11Y-01/02/03/04/05 (deuda de 21E).

## 11. Criterios de aceptación verificables

**Shell 390 px**
- [ ] `scrollWidth <= clientWidth` en las rutas privadas auditadas; header sin overflow; logout visible.

**Tablet 768 px**
- [ ] Drawer (una sola nav); **no** coexisten sidebar fija y hamburguesa; header sin solapes ni overflow.

**Desktop 1440 px**
- [ ] Sidebar fija + offset + toggle desktop; sin overflow.

**Navegación drawer/sidebar**
- [ ] `<lg` usa drawer; `≥lg` usa sidebar; una sola navegación por ancho.

**Identidad real y fallbacks**
- [ ] Con perfil: nombre e iniciales reales + avatar real; con datos ausentes: "Candidato tech"/"CT",
      headline omitido; nunca email.

**Actualización del header tras guardar Profile**
- [ ] Tras `updateMyProfile`/subida de avatar, el header refleja el nuevo nombre/avatar sin nueva
      petición ni esperar al próximo login.

**Error no-401 de identidad**
- [ ] Si la lectura de identidad falla (no-401), el header muestra fallbacks y la app continúa.

**401 de identidad**
- [ ] Un 401 en la lectura de identidad termina la sesión con `reason=expired` y redirige a `/login`.

**required / expired / logout**
- [ ] `/login?reason=required` → "Inicia sesión para continuar."; `?reason=expired` → "Tu sesión ha
      finalizado. Vuelve a iniciar sesión."; logout → `/login` sin aviso; reason ausente/desconocido →
      sin aviso.
- [ ] Un logout manual **no** produce `reason=required` (carrera blindada).

**CTA deduplicados**
- [ ] Dashboard: un único "Preparar JobIT CV" (hero); sin QuickAction ni CTA de sidebar duplicados;
      ítem de nav "JobIT CV" presente; QuickActions sin hueco.

**Logo único**
- [ ] `BrandMark` con gradiente `jobit-brand→jobit-green` en shell, landing (navbar/footer) y auth;
      sin `sky→emerald` en el logo; contenido de landing/auth intacto.

**Badge Dashboard**
- [ ] Badge "Siguiente" sin superposición a 390 px; desktop intacto.

**Orden Profile**
- [ ] Móvil: progreso+preview antes del editor; desktop: rail derecha; sin duplicar contenido.

**Retorno Portfolio**
- [ ] Settings muestra "← Volver al portfolio" → `/profile/portfolio`; sidebar marca Portfolio.

**Build de Login con search params**
- [ ] `pnpm --filter @jobit/web build` en verde (sin *CSR bailout*): `useSearchParams` bajo `<Suspense>`.

**No regresión de rutas privadas**
- [ ] Las 8 rutas privadas siguen redirigiendo a `/login` sin sesión y cargando con sesión.

## 12. Tests mínimos (TDD, archivos reales)

- **`site-shell.test.tsx`**: clases contractuales de breakpoint `lg` (sidebar/offset/toggle/drawer),
  identidad real + fallbacks ("Candidato tech"/"CT", sin email), ausencia del CTA de pie de sidebar,
  logout → `/login` sin reason.
- **`auth-context.test.tsx`** (+ helper de identidad): carga de snapshot, error no-401 → fallback, 401
  → `endReason=expired`, actualización del snapshot desde DTO, y estados de `endReason`
  (logout/expired/null) y su limpieza al `setSession`.
- **login/register tests**: aviso para `required`/`expired`; `desconocido`/ausente → sin aviso;
  errores del formulario conservados; render con `useSearchParams` bajo Suspense.
- **tests de guarda/helper central**: redirección correcta por caso y **carrera de logout** (logout no
  genera `reason=required`).
- **`dashboard-page.test.tsx`**: un único CTA "Preparar JobIT CV" (ajustar el `toHaveLength(3)` actual),
  badge sin patrón absoluto que solape, QuickActions sin hueco.
- **landing page tests**: `BrandMark`/gradiente unificado sin cambiar contenido de la landing.
- **profile tests**: orden responsive (rail antes del editor en móvil) y actualización de identidad
  tras guardar.
- **Portfolio Settings tests**: enlace de retorno a `/profile/portfolio`.
- **medición Playwright (21D.6)**: 390/768/1440 — `scrollWidth<=clientWidth`, drawer vs sidebar,
  header sin overflow, avisos de sesión.

Regla: sin snapshots como cobertura principal; sin fijar clases irrelevantes; para breakpoints se
permiten asserts **solo** de las clases contractuales `lg`/`md` estrictamente necesarias.

## K. Fuera de alcance

- A11Y-01/02/03/04/05 (deuda 21E, solo preservación).
- PROF-01, PROF-02, SAVED-02, PORT-02, **MATCH-04**.
- Dark mode; persistencia de auth; cambios de ADR-0006.
- Backend, Prisma, DB y DTO HTTP.
- Dependencias nuevas.
- Rediseño completo; Match/Jobs/scoring/paginación.
- CTA comercial en portfolio público.
- Figma/Canva.
- Commit, push, PR y merge.

## L. Riesgos

- **Amplitud de las guardas** (8 páginas + handlers 401): migración inconsistente → mitigar con el
  helper compartido (§6.3).
- **Carrera logout/guardas**: una guarda podría convertir un logout en `reason=required` → blindaje por
  `endReason` (§6.2).
- **`useSearchParams` y build estático**: *CSR bailout* → obligar `<Suspense>` (§6.4).
- **Identidad obsoleta tras editar Profile**: mitigar sincronizando el snapshot con la respuesta ya
  disponible (§5.4).
- **Petición adicional session-scoped**: una lectura por sesión (justificada); no per-página; no
  bloqueante.
- **Breakpoint global del shell**: pasar `md→lg` afecta a todas las rutas privadas → verificación
  visual 390/768/1440 (21D.6).
- **Orden visual vs DOM** (RESP-03): el reorden no debe contradecir gravemente el orden de lectura.
- **Falsa atribución del overflow al hero**: confirmar el nodo exacto con medición runtime (§4.3).
- **Regresiones en 8 rutas privadas**: cubrir con tests de guarda/helper y verificación E2E.

## Auditoría requerida

- [ ] Quality/security documental.
- [ ] Tests y verificaciones locales (`@jobit/web`: typecheck, lint, test, build) en implementación.
- [ ] Revisión visual 390/768/1440.
- [ ] Revisión humana.
