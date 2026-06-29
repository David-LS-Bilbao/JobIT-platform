# Sprint 07 — Frontend candidate-first · TDD/Quality Plan

> **Fase:** 3 — TDD/Quality Planning (documental, pre-implementación).
> **Rama:** `feat/sprint-07-frontend-candidate`.
> **Fecha:** 2026-06-29.
> **Entorno:** clon nativo macOS `/Users/david_mac/JobIT-platform` (autorizado; no OneDrive/Windows).
> **Precedentes:** [agent-brief](sprint-07-frontend-candidate-agent-brief.md) (Fase 0) + SDD Review (Fase 2, contratos cerrados contra código).
> **Esta fase NO** crea `apps/web`, **NO** instala dependencias y **NO** toca `package.json`/`pnpm-lock.yaml`/`pnpm-workspace.yaml`/backend/Prisma.

Alineado con [tdd-guidelines.md](../agents/tdd-guidelines.md), [sdd-tdd-ai-audit-workflow.md](../agents/sdd-tdd-ai-audit-workflow.md), [audit-quality-security-skill.md](../agents/audit-quality-security-skill.md) y [pr-checklist.md](../agents/pr-checklist.md). No inventa tests ni resultados: define el plan de verificación esperado.

---

## 1. Objetivo del plan

Definir **qué se verifica y cómo** para cerrar el Sprint 07 (primera versión frontend candidate-first real, mínima y conectada al backend) **antes** de implementar `apps/web`. Deja fijados: comandos objetivo, estrategia de tests por capa, smoke manual, quality gates y verificaciones de seguridad. Sirve de contrato de calidad para la fase de implementación y para la auditoría previa a PR.

Aplica **TDD pragmático** ([tdd-guidelines.md](../agents/tdd-guidelines.md)): TDD fuerte donde hay impacto en **auth/sesión/datos de usuario y casos de error**; tests mínimos donde el riesgo es bajo. Como el **tooling de tests aún no existe** (greenfield), aquí se **definen** los tests esperados y se documenta que **no se ejecutan** hasta el scaffolding autorizado.

---

## 2. Estado inicial

- **`apps/web` no existe.** Frontend greenfield; dentro de `apps/` solo está `apps/api`.
- **No hay scripts `@jobit/web`** todavía. El paquete frontend no está creado.
- **Los scripts raíz son recursivos por workspaces** (`pnpm -r --if-present <script>`): hoy solo alcanzan a `@jobit/api`; al crear `apps/web` lo incluirán automáticamente.
- **El workspace ya cubre `apps/*`** ([pnpm-workspace.yaml](../../pnpm-workspace.yaml)) → crear `apps/web` **no** requiere modificar la config de workspaces.
- **El scaffolding posterior requerirá autorización explícita** para añadir dependencias (Next.js, React, Tailwind, tooling de test) y, por tanto, **modificará `pnpm-lock.yaml`**.

---

## 3. Alcance verificable del Sprint 07

Lo que este plan se compromete a verificar:

- **Landing simple** (entrada pública).
- **Login** (`POST /api/auth/login`).
- **Register** (`POST /api/auth/register`, con confirmación de contraseña en cliente).
- **Dashboard privado** (`GET /api/dashboard/me`).
- **Navegación mínima** candidate-first.
- **Logout** (`POST /api/auth/logout`).
- **Cliente API tipado** (Bearer + `credentials:"include"` + manejo de errores y 401).
- **Sesión en memoria** (Context/estado; sin `localStorage`/`sessionStorage`).
- **Estados loading / error / empty** en las vistas conectadas.
- **Protección mínima de la ruta dashboard** (guard de cliente; la protección real es del backend).

Fuera de alcance verificable (no se testea aquí): editor de perfil/CV, Jobs UI completa, filtros avanzados, gestión completa de saved jobs, detalle visual avanzado de match, recruiter/ATS/admin/comunidad/monetización, deploy/CI/CD, backend/Prisma/nuevas APIs, Jooble desde frontend.

---

## 4. Contratos backend que deben guiar los tests

Verificados contra código en Fase 2 (fuente de verdad). Los tests del cliente API y de las vistas deben ceñirse a **estas formas exactas**:

| Endpoint | Auth | Éxito | Forma de respuesta |
|---|---|---|---|
| `POST /api/auth/register` | pública | 201 | **bare** `{ accessToken, user:{ id,email,role,createdAt } }` + cookie `refresh_token` |
| `POST /api/auth/login` | pública | 200 | **bare** `{ accessToken, user }` + cookie |
| `POST /api/auth/logout` | cookie | **204** | sin cuerpo |
| `GET /api/auth/me` | Bearer | 200 | **bare** `{ id,email,role,createdAt }` |
| `GET /api/dashboard/me` | Bearer | 200 | **bare** `CandidateDashboardDto` |
| `GET /api/jobs` | Bearer | 200 | **envuelto** `{ data, total, page, limit }` |
| `GET /api/jobs/:id` | Bearer | 200 | **bare** `JobPublicDto` |
| `GET /api/saved-jobs` | Bearer | 200 | **envuelto** `{ data }` |
| `POST /api/saved-jobs/:jobId` | Bearer | 200/201 | **bare** `SavedJobDto` |
| `DELETE /api/saved-jobs/:jobId` | Bearer | **204** | sin cuerpo |
| `GET /api/profile/me/matches` | Bearer | 200 | **envuelto** `{ data }` |
| `GET /api/jobs/:id/match` | Bearer | 200 | **bare** `JobMatchDto` |

- **`CandidateDashboardDto`** (bare): `{ profile:{ firstName,lastName,headline, completionPercentage:0..100 }, skills:string[], savedJobs:{ total, recent:SavedJobDto[≤3] }, matches:ProfileJobMatchDto[], nextActions:{action,label}[] }`.
- **Errores** (homogéneo, ADR-0007): `{ error: { code, message, details? } }`. Códigos: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `NOT_FOUND` (404), `CONFLICT` (409).
- **Auth concreto:** password de registro **min 8, ≥1 mayúscula, ≥1 número**; email ya registrado → **409**; credenciales inválidas → **401 genérico** (sin enumeración); access token JWT **15 min**; **no existe `/api/auth/refresh`**.
- **`401 → logout/re-login`:** ante 401 en cualquier llamada protegida, el cliente limpia la sesión en memoria y redirige a login («Tu sesión ha caducado»).
- **Disponibilidad de cross-origin en dev:** backend en `:4000`, frontend en `:3000`; `credentials:"include"` obligatorio; `CORS_ORIGIN` por defecto ya admite `http://localhost:3000`.

---

## 5. Estrategia de tests por capa

Prioridad TDD (fuerte→mínima): **cliente API y sesión** (impacto seguridad) > **formularios auth** (validación/errores) > **render de dashboard y estados** (comportamiento) > **navegación** (smoke).

### 5.1 Barreras obligatorias (siempre)
- **Typecheck:** `tsc --noEmit` vía `@jobit/web typecheck`. Barrera dura: el tipado de los contratos (bare vs envuelto) debe compilar.
- **Build Next.js:** `@jobit/web build`. Barrera dura: el proyecto debe construir sin errores.

### 5.2 Tests unitarios — cliente API (TDD fuerte)
- Añade `Authorization: Bearer <token>` **cuando hay token** en memoria; **no** lo añade cuando no lo hay.
- Usa `credentials:"include"` en las llamadas (para la cookie de auth).
- **Parsea correctamente respuestas envueltas** (`{ data }`, `{ data,total,page,limit }`) **y bare** (dashboard, `auth/me`, detalle, resultado de guardar) — cada endpoint con su forma.
- Maneja el envoltorio de **error** `{ error:{ code,message,details? } }` y expone un error tipado.
- Ante **401** devuelve una señal de **sesión expirada** / lanza un error controlado que dispara el re-login (no traga el error).
- Construye la URL desde `NEXT_PUBLIC_API_BASE_URL` (no hardcodea).

### 5.3 Tests de componentes (TDD pragmático)
- **Login form:** valida campos mínimos (email con formato, password requerido); muestra error genérico sin filtrar si el email existe.
- **Register form:** valida **confirmación de contraseña en cliente** y los requisitos mínimos (8/may/núm) como UX; el backend sigue siendo la fuente de verdad.
- **Dashboard:** renderiza `profile`, `skills`, `savedJobs`, `matches` y `nextActions` a partir del DTO.
- **Dashboard empty states:** perfil incompleto (`completionPercentage<100`), `skills:[]`, `savedJobs.total:0`, `matches:[]`, `nextActions` derivadas.
- **Dashboard error de sesión caducada:** ante 401 muestra el estado de error/redirección a login.

### 5.4 Integración / smoke (si la base lo permite)
- Flujo **landing → login → dashboard** con API **mockeada** (p. ej. MSW) o contra backend local — la decisión concreta se fija al implementar.
- Login/register mockeado: éxito guarda token en memoria y navega; error muestra mensaje.

### 5.5 E2E / Playwright
- **Solo si ya está preparado o se autoriza después.** No se asume en el cierre mínimo del sprint; queda como mejora.

> **Tooling propuesto (a autorizar en scaffolding, no se instala aquí):** Vitest + React Testing Library + jsdom/happy-dom para unit/componentes; MSW opcional para mock de API; Playwright opcional para E2E. La elección final se confirma al pedir autorización de dependencias.

---

## 6. Smoke manual obligatorio

Checklist a ejecutar manualmente tras implementar (con backend y frontend levantados):

1. Levantar **backend** en su puerto esperado (`:4000`) con su `.env` local.
2. Levantar **frontend** en **`:3000`**.
3. **Registrarse** con email válido y password válida (8/may/núm) → queda autenticado.
4. Entrar al **dashboard** privado.
5. Ver **datos** y/o **empty states** según el estado de la cuenta.
6. **Logout** → vuelve a zona pública y se limpia la sesión.
7. Intentar **dashboard sin sesión** → redirección a **login**.
8. Probar **credenciales inválidas** → error genérico (sin revelar si el email existe).
9. Comprobar en DevTools que **no hay token en `localStorage` ni `sessionStorage`**.
10. Comprobar que **no se muestran secretos** ni el valor de `refresh_token` (cookie httpOnly, no accesible por JS) en UI, logs ni network visible al usuario.
11. Recargar la página estando logueado → confirmar el comportamiento esperado de **re-login** (deuda conocida: sin `/api/auth/refresh`).

---

## 7. Comandos de verificación esperados al cierre técnico

Comandos **objetivo** del frontend (válidos **solo tras** crear `apps/web` con scaffolding autorizado):

```bash
pnpm --filter @jobit/web typecheck
pnpm --filter @jobit/web build
pnpm --filter @jobit/web test
git diff --check
git status --short
```

Solo **si se tocara backend o código compartido** (no previsto en este sprint):

```bash
pnpm --filter @jobit/api test
pnpm --filter @jobit/api typecheck
pnpm --filter @jobit/api build
```

> ⚠️ **Hoy `@jobit/web` no existe**: los tres primeros comandos **fallarían** (filtro sin destino). Solo serán válidos tras el scaffolding. Mientras tanto, la verificación de esta fase documental es de Git + revisión documental (patrón [pr-checklist.md](../agents/pr-checklist.md): «No aplica: el repositorio aún no tiene tooling de tests de frontend»).

---

## 8. Quality gates

> Vocabulario: la **auditoría quality/security** usa `PASS` / `PASS_WITH_NOTES` / `FAIL` ([audit-quality-security-skill.md](../agents/audit-quality-security-skill.md)). Un **hard-stop operativo** (kill-switch) se reporta como **BLOCKED** y equivale a **`FAIL`** de auditoría: no se abre PR.

**BLOCKED / FAIL (hard-stop, corregir antes de continuar):**
- Se toca **backend / Prisma** sin autorización.
- Se usa **`localStorage` o `sessionStorage`** para el `accessToken` (viola [ADR-0006](../decisions/ADR-0006-auth-strategy.md)).
- Se **hardcodean secretos** o se exponen en el bundle (`NEXT_PUBLIC_*` con secretos).
- Se **inventan endpoints** o DTOs no verificados.
- Se **llama a Jooble desde el frontend** (viola [ADR-0011](../decisions/ADR-0011-jooble-external-jobs-integration.md)).
- Se instalan dependencias o se modifica el lockfile **sin autorización explícita**.

**PASS:**
- `@jobit/web typecheck` + `build` + `test` en verde según scripts reales, smoke manual completo, sin hallazgos de seguridad, sin cambios fuera de alcance.

**PASS_WITH_NOTES:**
- `typecheck` + `build` pasan y el smoke manual está cubierto, pero **falta tooling de tests** (o cobertura parcial) y la deuda queda **documentada** como riesgo/seguimiento. Admisible para abrir PR según [pr-checklist.md](../agents/pr-checklist.md).

---

## 9. Seguridad frontend a verificar

- **Tokens:** `accessToken` **solo en memoria** (Context/estado). **Nunca** en `localStorage`/`sessionStorage`.
- **Cookies:** `refresh_token` es **httpOnly** → no accesible por JS; el cliente **no** intenta leerlo ni almacenarlo.
- **Logs/URLs:** **ningún token** en logs ni en URLs/query string.
- **CORS:** `credentials:"include"` **solo** hacia el backend esperado (`NEXT_PUBLIC_API_BASE_URL`); origen permitido explícito en backend.
- **XSS:** **no** `dangerouslySetInnerHTML` con datos de ofertas (`description`/`requirements`/`tags`); renderizar como texto. Enlaces externos (`sourceUrl`) con `rel="noopener noreferrer"` y validación de esquema.
- **Secretos:** `NEXT_PUBLIC_API_BASE_URL` **sin secretos** (solo URL base); `JOOBLE_API_KEY` y cualquier secreto **jamás** en el frontend.

---

## 10. Riesgos y deuda técnica

- **Sin `/api/auth/refresh`** → al recargar la página o expirar el access token (15 min) el usuario hace **re-login**. La persistencia/renovación silenciosa exige un **cambio de backend** (deuda explícita, **fuera de alcance** de Sprint 07).
- **Frontend greenfield** → el scaffolding **tocará `pnpm-lock.yaml`** y añadirá dependencias (requiere autorización).
- **Los tests dependen de dependencias a autorizar** (Vitest/RTL/MSW/Playwright): hasta entonces, los comandos `@jobit/web` no son ejecutables.
- **Dashboard agregado** (un solo endpoint) → **no** permite error parcial por bloque como insinúa la spec; el MVP usa loading/error/empty **global** del dashboard (desviación documentada).
- **Respuestas bare vs envueltas** → el cliente tipado debe modelar **cada endpoint por separado**; asumir un wrapper común sería un bug.
- **Cross-origin dev `:3000→:4000`** con cookies/credenciales → validar CORS y `credentials:"include"` al arrancar.

---

## 11. Criterios de aceptación del plan

- [x] Plan **alineado con specs/ADR** (M01-M06, ADR-0002/0006/0007/0011) y con la guía TDD pragmática.
- [x] **No contradice [ADR-0006](../decisions/ADR-0006-auth-strategy.md)**: sesión en memoria.
- [x] **No propone `sessionStorage`/`localStorage`** para tokens (los marca como hard-stop).
- [x] **No requiere backend nuevo** ni endpoints nuevos (el refresh queda como deuda futura, no como tarea del sprint).
- [x] **No instala dependencias** ni modifica lockfile/manifiestos en esta fase.
- [x] Deja **comandos objetivo** claros (`@jobit/web typecheck/build/test`) y su condición de validez (post-scaffolding).
- [x] Deja **smoke manual** claro y verificable.
- [x] Define **quality gates** (PASS / PASS_WITH_NOTES / BLOCKED≙FAIL) y verificaciones de seguridad.
