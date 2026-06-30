# Informe final operador — Sprint 07 Frontend candidate-first

> **Rama:** `feat/sprint-07-frontend-candidate` · **Fecha:** 2026-06-30 · **Entorno:** clon nativo macOS `/Users/david_mac/JobIT-platform` (autorizado).
> **Auditoría quality/security:** PASS_WITH_NOTES · **Smoke manual real:** BLOCKED por entorno/provisión (no por defecto del frontend).

## Sprint o tarea

Sprint 07 — **Frontend candidate-first**.

## Objetivo inicial

Crear la **primera versión frontend real, mínima y conectada al backend** de JobIT, orientada al candidato: registro/login, zona privada, **dashboard básico consumiendo `GET /api/dashboard/me`** y navegación mínima. Cerrar el flujo vertical:

```
landing → login/register → sesión en memoria → dashboard privado → logout / re-login ante 401
```

El objetivo no era una UI completa, sino un esqueleto funcional candidate-first que autentica de verdad y renderiza datos reales del candidato, sin tocar backend.

## Trabajo realizado

Por fases (SDD → TDD → implementación asistida → verificación → auditoría):

- **Documentación de sprint:** brief operativo con contratos cerrados ([agent-brief](sprint-07-frontend-candidate-agent-brief.md)) y **TDD/Quality Plan** ([tdd-plan](sprint-07-frontend-candidate-tdd-plan.md)).
- **Scaffolding `apps/web`** (workspace `@jobit/web`): Next.js 16 + TypeScript + Tailwind v4 + **App Router** + `src/`, vía `create-next-app` no interactivo; saneado (eliminado `pnpm-workspace.yaml` anidado y plantillas de agente que contradecían las reglas raíz).
- **Tooling de test:** Vitest 4 + React Testing Library + jsdom + `@vitejs/plugin-react` (sin MSW/Playwright en esta fase).
- **Tipos DTO** (`src/types/api.ts`): espejo de los contratos backend cerrados.
- **Cliente API tipado** (`src/lib/api-client.ts`): `fetch` con `credentials:"include"`, Bearer opcional, manejo de 204, parseo bare/envuelto, `ApiClientError`, `isSessionExpiredError`.
- **Auth API** (`auth-api.ts`) y **Dashboard API** (`dashboard-api.ts`).
- **Sesión en memoria** (`AuthProvider`/`useAuth`) + `Providers` raíz.
- **Pantallas:** landing (`/`), **login** (`/login`), **register** (`/register`), **dashboard privado** (`/dashboard`).
- **Lógica de Auth:** validación cliente, loading/disabled, errores genéricos, `setSession` + `router.push("/dashboard")`, **logout**.
- **Dashboard:** guard de ruta, loading/error global, **empty states por sección**, manejo de 401 (re-login).
- **Auditoría quality/security** (PASS_WITH_NOTES) y **smoke manual** (BLOCKED por entorno).
- **5 commits locales revisables** (docs → scaffolding → arquitectura → auth → dashboard).

## Archivos modificados

**Añadidos / tocados en la rama:**
- `docs/sprints/sprint-07-frontend-candidate-agent-brief.md`
- `docs/sprints/sprint-07-frontend-candidate-tdd-plan.md`
- `docs/sprints/sprint-07-frontend-candidate-final-report.md` (este documento)
- `apps/web/**` (toda la app frontend: config, `src/{app,components,features,lib,types,test}`, `public/`, tests)
- `pnpm-lock.yaml` (por las dependencias del scaffolding autorizado)

**NO tocado (confirmado por scope check en los commits):**
- `apps/api/**` (backend) · `prisma/**` · `packages/**` · `docker/**` · `.github/**`
- `package.json` raíz · `pnpm-workspace.yaml`
- `README.md` · `AGENTS.md`
- `docs/specs/**` · `docs/decisions/**` · `docs/agents/**`

## Pantallas implementadas

| Ruta | Tipo | Descripción |
|---|---|---|
| `/` | estática | Landing candidate-first: marca **JobIT**, tagline y accesos a Login, Registro y Dashboard. Sin llamadas a backend. |
| `/login` | client island | Formulario email+password con validación, loading, error genérico; en éxito guarda sesión y redirige a `/dashboard`. Enlace a `/register`. |
| `/register` | client island | Formulario email+password+confirmación con **política de contraseña** (≥8, mayúscula, número) visible; 409 → mensaje amable; en éxito sesión + `/dashboard`. Enlace a `/login`. |
| `/dashboard` | privada (guard) | Consume `GET /api/dashboard/me`; cabecera de bienvenida, progreso de perfil, skills, ofertas guardadas, mejores matches, próximos pasos; loading/error/empty; **logout**. Sin sesión → `/login`. |

Todas se prerenderizan estáticas en `build`; las pantallas privadas hidratan y resuelven sesión/datos en cliente.

## Integración con backend

Endpoints consumidos (contratos verificados contra `apps/api/src/**` en SDD Review):

- `POST /api/auth/register` → 201 `{ accessToken, user }` + cookie `refresh_token` httpOnly.
- `POST /api/auth/login` → 200 `{ accessToken, user }` + cookie.
- `POST /api/auth/logout` → **204** sin cuerpo.
- `GET /api/auth/me` → `{ id, email, role, createdAt }` (Bearer).
- `GET /api/dashboard/me` → **bare** `CandidateDashboardDto` (Bearer).

Detalles de integración:
- **Bearer accessToken** en cabecera `Authorization` (solo si hay token); **`credentials:"include"`** para la cookie httpOnly.
- URL base desde **`NEXT_PUBLIC_API_BASE_URL`** (dev `http://localhost:4000`); sin URLs hardcodeadas.
- Errores homogéneos **`{ error: { code, message, details? } }`** → `ApiClientError(status, code, message, details)`.
- **401 = sesión expirada** → `clearSession()` + redirección a `/login`.
- **No existe `/api/auth/refresh`**: al recargar/expirar (token 15 min) se hace **re-login**.

> **Aclaración importante:** la integración está **testeada con mocks** (fetch/`auth-api`/`dashboard-api`/`next-navigation` mockeados; 35 tests verdes). El **smoke real contra el backend quedó pendiente/BLOCKED por entorno** (ver Problemas). No se han fabricado resultados de smoke real.

## Tests y verificaciones

- `pnpm --filter @jobit/web typecheck` ✅
- `pnpm --filter @jobit/web test` ✅ **35/35** (7 archivos: api-client 9, auth-context 4, auth-validation 4, login-form 4, register-form 5, dashboard-page 7, landing smoke 2)
- `pnpm --filter @jobit/web build` ✅ (rutas estáticas `/`, `/login`, `/register`, `/dashboard`, `/_not-found`)
- `pnpm --filter @jobit/web lint` ✅
- `git diff --check` ✅
- **Auditoría quality/security:** **PASS_WITH_NOTES**
- **Smoke manual real:** **BLOCKED por entorno/provisión, no por defecto de código** (sin invención de resultados)

## Decisiones técnicas

- **Next.js + TypeScript + Tailwind** (ratificado por ADR-0002), **App Router** (greenfield).
- **Sesión en memoria React** (`accessToken`/`user` en estado); **prohibido `localStorage`/`sessionStorage`** para tokens (ADR-0006).
- **Sin endpoint de refresh** en Sprint 07; re-login tras recarga/expiración (deuda de backend).
- **DTOs frontend como espejo** del contrato backend; **`Date` como `string` ISO** en frontend.
- **Cliente API no asume envoltorio uniforme**: listas envueltas (`{ data }`, jobs con `total/page/limit`) vs respuestas bare (dashboard, auth/me, detalle, resultado de guardar). Cada endpoint se tipa por separado.
- **Dashboard agregado**: una sola llamada → **loading/error global**; **empty states derivados por sección**.
- **Sin MSW/Playwright** en esta fase (alcance mínimo); tests con Vitest + Testing Library.
- **Sin nav auth-aware compleja** todavía (SiteShell con links estáticos).
- Puertos: frontend **:3000**, backend dev **:4000** (cross-origin en dev → `credentials:"include"`).

## Seguridad frontend

- **accessToken solo en memoria**; nunca en storage del navegador.
- **`refresh_token` httpOnly** no accesible desde JS; el cliente no lo lee ni almacena.
- **Sin secretos** en el bundle; **sin `JOOBLE_API_KEY`**; **sin llamadas a Jooble** desde frontend (solo el literal de tipo `JobSource`).
- **Sin logs de token** (`console.*` → ninguno); **sin token en URLs**.
- **Sin `dangerouslySetInnerHTML`**; datos de oferta se renderizan como texto.
- **Errores genéricos en Auth** (sin enumeración de usuarios ni detalles del backend).
- **Logout** limpia la sesión local **aunque el logout del servidor falle**.
- `NEXT_PUBLIC_API_BASE_URL` es solo URL base (no secreto); `.env.example` versionado sin secretos, `.env*` reales ignorados.

## Problemas encontrados

- **`apps/web` greenfield**: todo el frontend se creó desde cero.
- **Smoke real BLOCKED por entorno** (no por código):
  - **`apps/api/.env` ausente** → el script dev (`tsx watch`, cwd `apps/api`) no carga `DATABASE_URL`/JWT secrets (existe un root `./.env`, pero el cwd del script no lo lee).
  - **`apps/web/.env.local` ausente** → sin `NEXT_PUBLIC_API_BASE_URL` el cliente lanzaría `CONFIG_ERROR`.
  - **Puerto `:3000` ocupado** por un proceso Docker.
  - **Agente sin navegador/DevTools** para las comprobaciones de UI/storage/cookies en vivo.
- **Sin `/api/auth/refresh`** → recarga = re-login (deuda de backend).
- **Next 16 usa Turbopack por defecto** en `build` (no rompe nada).
- **Restos cosméticos de plantilla** (`public/*.svg`, `README.md` de Next) sin uso.
- **`docs/agents/operating-environment.md` no refleja** aún el clon macOS autorizado.
- *(Durante la implementación, React 19.2/Next 16 obligaron a evitar `setState` síncrono en efectos y a mocks estables de `useRouter` en tests; resuelto.)*

## Pendiente / backlog

- **Ejecutar el smoke real** en un entorno provisionado (o en el clon WSL con DB/entorno listos).
- **Crear/configurar `apps/web/.env.local`** con `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`.
- **Backend local operativo**: `apps/api/.env` con `DATABASE_URL`/JWT secrets + Postgres migrado, o flujo equivalente.
- **Liberar `:3000`** o ajustar puerto/`CORS_ORIGIN`.
- **Futuro `POST /api/auth/refresh`** (backend) para persistencia de sesión y renovación silenciosa.
- **Nav auth-aware** (mostrar Login/Registro vs Dashboard/Logout según sesión).
- **Limpiar assets de plantilla** sobrantes.
- **UI futura** de Jobs, Saved Jobs y Profile/CV (fuera de alcance de Sprint 07).
- **Deploy dev/staging** en sprint posterior.
- **Actualizar documentación global/README** tras merge o antes de PR (estado real del frontend).

## Estado actual del proyecto

- **Backend MVP candidate-first completo** hasta Sprint 06 (Auth, Profile/CV, Jobs, Jooble backend-only, Saved Jobs, Match básico, Dashboard agregado).
- **Frontend candidate-first MVP inicial implementado** en Sprint 07 (landing, auth, dashboard privado, sesión en memoria, cliente API tipado), con checks automáticos en verde y auditoría **PASS_WITH_NOTES**.
- **Pendientes:** smoke real de entorno y deploy dev/staging.
- **Rama local** `feat/sprint-07-frontend-candidate` con **5 commits** listos; **sin push/PR/merge** todavía.

## Recomendación para el orquestador

- **Revisar** este informe, los 5 commits y la auditoría (PASS_WITH_NOTES).
- **Ejecutar el smoke real** en entorno provisionado, **o** marcarlo explícitamente **pendiente** en la PR.
- **Abrir PR hacia `dev`** si se acepta `PASS_WITH_NOTES`, usando la plantilla de [pr-checklist.md](../agents/pr-checklist.md) y registrando la deuda (refresh endpoint, smoke pendiente).
- **No ampliar el scope** (editor CV / Jobs UI) antes de cerrar esta PR.
- **Planificar** un sprint posterior de **deploy** o del **endpoint `/api/auth/refresh`** según prioridad.

## Prompt sugerido para continuar

> **Fase siguiente — Actualización global documental (solo lectura de código, escritura de docs):**
> Revisar `README.md`, `docs/specs/**` relevantes y `docs/sprints/**`; **documentar el estado real del frontend** del Sprint 07 (Auth, Dashboard y navegación mínima candidate-first) en la documentación global y el README. Mantener listados los **pendientes no implementados** (smoke real, refresh endpoint, nav auth-aware, UI de Jobs/Saved/Profile, deploy). **No documentar endpoints inexistentes** (no inventar `/api/auth/refresh`). **No tocar** backend, Prisma, `package.json` ni lockfiles. Trabajar en una rama `docs/*` desde `dev`, en cambios pequeños y revisables, y ejecutar `git diff --check` antes de commitear.
>
> *(El Chat Operador entregará después el prompt completo y obligatorio.)*
