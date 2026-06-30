# Sprint 07 — Frontend candidate-first · Agent Brief

> **Rama:** `feat/sprint-07-frontend-candidate` (desde `dev` limpio).
> **Fecha:** 2026-06-29 · **Actualizado** tras SDD Review (Fase 2) y TDD/Quality Planning (Fase 3).
> **Entorno:** clon nativo macOS `/Users/david_mac/JobIT-platform` (autorizado; no OneDrive/Windows).
> **Estado:** brief **operativo**. No implementa frontend, no crea `apps/web`, no instala dependencias, no toca `package.json`/`pnpm-lock.yaml`/`pnpm-workspace.yaml`/backend/Prisma.

Los contratos de este brief están **verificados contra código** en `apps/api/src/**` y **cerrados en SDD Review**. Son la referencia para hacer scaffolding **sin inventar contratos**. Plan de verificación en [sprint-07-frontend-candidate-tdd-plan.md](sprint-07-frontend-candidate-tdd-plan.md).

---

## 1. Objetivo del sprint

Construir la **primera versión frontend real** de JobIT: mínima, conectada al backend existente y orientada al candidato. Cierra el flujo vertical:

```
entrar → registrarse/login → zona privada → dashboard → navegación candidate-first mínima
```

Éxito = un frontend que **autentica de verdad** y **renderiza el dashboard real** (`GET /api/dashboard/me`), con estados loading/error/empty y sesión básica funcional.

---

## 2. Contexto de producto

JobIT es una **plataforma modular de empleo tecnológico**, MVP **candidate-first**.

- **En foco:** auth, perfil/CV, ofertas, guardadas, match básico explicable, dashboard agregado.
- **Fuera de esta fase:** recruiter, ATS, admin, comunidad, monetización. No se construye UI para ellos.

---

## 3. Estado actual

- **`apps/web` NO existe** → frontend **greenfield** (dentro de `apps/` solo `apps/api`).
- **SDD Review (Fase 2):** contratos backend confirmados contra código (este documento los recoge).
- **TDD/Quality Plan (Fase 3):** verificaciones definidas en el TDD plan.
- **Backend:** Express 5 + TypeScript (ESM), corre en **`:4000`** por defecto (`PORT`).
- **Workspace:** pnpm; `pnpm-workspace.yaml` ya cubre `apps/*` (no hay que tocarlo para añadir `apps/web`).

---

## 4. Mapa de endpoints (qué consume el frontend)

Todos los privados exigen `Authorization: Bearer <accessToken>` (middleware `requireAuth`). **El envoltorio NO es uniforme** (ver §10).

| Método | Ruta | Auth | Éxito | Forma respuesta |
|---|---|---|---|---|
| POST | `/api/auth/register` | pública | 201 | **bare** `{ accessToken, user }` + cookie |
| POST | `/api/auth/login` | pública | 200 | **bare** `{ accessToken, user }` + cookie |
| POST | `/api/auth/logout` | cookie | 204 | sin cuerpo |
| GET | `/api/auth/me` | Bearer | 200 | **bare** `{ id, email, role, createdAt }` |
| GET | `/api/dashboard/me` | Bearer | 200 | **bare** `CandidateDashboardDto` |
| GET | `/api/jobs` | Bearer | 200 | **envuelto** `{ data, total, page, limit }` |
| GET | `/api/jobs/:id` | Bearer | 200 | **bare** `JobPublicDto` |
| GET | `/api/saved-jobs` | Bearer | 200 | **envuelto** `{ data }` |
| POST | `/api/saved-jobs/:jobId` | Bearer | 200/201 | **bare** `SavedJobDto` |
| DELETE | `/api/saved-jobs/:jobId` | Bearer | 204 | sin cuerpo |
| GET | `/api/profile/me/matches` | Bearer | 200 | **envuelto** `{ data }` |
| GET | `/api/jobs/:id/match` | Bearer | 200 | **bare** `JobMatchDto` |

> **Jobs está tras auth**: no hay exploración pública de ofertas; el flujo siempre pasa por login.

---

## 5. Contrato de Auth (cerrado)

- `POST /api/auth/register` → **201** `{ accessToken, user }` + `Set-Cookie refresh_token`. Password: **min 8, ≥1 mayúscula, ≥1 número**. Email duplicado → **409** `CONFLICT`.
- `POST /api/auth/login` → **200** `{ accessToken, user }` + cookie. Credenciales inválidas → **401** genérico (sin enumeración de usuarios).
- `POST /api/auth/logout` → **204** sin cuerpo; revoca refresh en DB y limpia la cookie.
- `GET /api/auth/me` → Bearer → **200** `{ id, email, role, createdAt }`.
- `user` = `{ id, email, role, createdAt }`.
- **`accessToken`:** JWT `{ sub: userId }`, **expiración 15 minutos**.
- **`refresh_token`:** **httpOnly**, `SameSite=Lax`, `Secure` en producción, **7 días**, hasheado en DB.
- ❌ **No existe `POST /api/auth/refresh`** (ni ninguna ruta que canjee la cookie por un nuevo access token).
- El frontend **NO** lee ni expone `refresh_token` (es httpOnly, opaco, propiedad del backend).
- **Ante 401 o recarga sin token → re-login** (mensaje «Tu sesión ha caducado»).

---

## 6. Sesión en frontend (decisión ratificada)

- ✅ **`accessToken` solo en memoria** (React Context/estado).
- 🚫 **Prohibido `localStorage` y `sessionStorage`** para tokens — regla no negociable de [ADR-0006](../decisions/ADR-0006-auth-strategy.md).
- **No se implementa refresh en Sprint 07.** `POST /api/auth/refresh` queda como **deuda de backend futura, fuera de alcance**.
- Consecuencia asumida: al **recargar** la página o **expirar** el token (15 min) → **re-login**. No se intenta renovación silenciosa (no hay endpoint).

---

## 7. Contrato de Dashboard (cerrado)

`GET /api/dashboard/me` (Bearer) → **bare** `CandidateDashboardDto` (`apps/api/src/dashboard/dashboard.types.ts`):

```ts
CandidateDashboardDto {
  profile: { firstName: string|null; lastName: string|null; headline: string|null;
             completionPercentage: number /* entero 0..100 */ };
  skills: string[];
  savedJobs: { total: number; recent: SavedJobDto[] /* ≤3, savedAt desc */ };
  matches: ProfileJobMatchDto[];
  nextActions: { action: string; label: string }[]; /* sugerencia, no ranking */
}
```

- **Se carga como una unidad**: una sola llamada → **loading/error global** del dashboard (no hay error parcial por bloque).
- **Empty states por sección** derivados de los datos: `profile.*` en `null`, `completionPercentage` bajo, `skills: []`, `savedJobs.total: 0` / `recent: []`, `matches: []`. `nextActions` es determinista (`complete_profile` si completitud <100; `explore_jobs` si no hay guardadas o no hay matches).

---

## 8. `JobPublicDto` (cerrado)

Contrato público de una oferta (`apps/api/src/jobs/jobs.serializer.ts`). **No** expone `externalId` ni `ingestedAt`.

```ts
JobPublicDto {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remoteType: "REMOTE" | "HYBRID" | "ON_SITE" | "UNSPECIFIED";
  description: string;
  requirements: string[];
  seniority: "JUNIOR" | "MID" | "SENIOR" | "ANY";
  contractType: string;            // p. ej. FULL_TIME | PART_TIME | CONTRACT | FREELANCE
  salaryMin: number | null;
  salaryMax: number | null;
  tags: string[];
  status;                          // JobStatus (p. ej. ACTIVE)
  postedAt: Date;                  // serializado como ISO string en JSON
  expiresAt: Date | null;
  source: "INTERNAL" | "JOOBLE";   // atribución de procedencia
  sourceUrl: string | null;
}
```

---

## 9. Jobs / Saved Jobs / Match (cerrados)

**Jobs**
- `GET /api/jobs` (Bearer) → **`{ data: JobPublicDto[], total, page, limit }`**. Query params reales: `q`, `remote`, `seniority`, `contractType`, `source`, `tags`, `page` (≥1, def 1), `limit` (1..100, def 20). Orden **`postedAt desc, id asc`**. Solo **ACTIVE y vigentes**.
- `GET /api/jobs/:id` (Bearer) → **bare** `JobPublicDto`. **404** «Oferta no disponible» si no existe/cerrada/expirada.

**Saved Jobs**
- `GET /api/saved-jobs` (Bearer) → **`{ data: SavedJobDto[] }`**. `SavedJobDto = { savedAt, job: JobPublicDto }`. Orden **`savedAt desc`** (conserva cerradas/expiradas; el cliente marca disponibilidad por `status`/`expiresAt`).
- `POST /api/saved-jobs/:jobId` (Bearer) → **201** (creada) o **200** (idempotente) → **bare** `SavedJobDto`. **404** si la oferta no existe.
- `DELETE /api/saved-jobs/:jobId` (Bearer) → **204** sin cuerpo. **404** si el usuario no la tenía guardada.

**Match**
- `GET /api/profile/me/matches` (Bearer) → **`{ data: ProfileJobMatchDto[] }`**. `limit` (1..50, def 10). Orden **`score desc`**.
  `ProfileJobMatchDto = { job: JobPublicDto, score, level, matchedSkills: string[], missingSkills: string[] }`.
- `GET /api/jobs/:id/match` (Bearer) → **bare** `JobMatchDto = { jobId, score, level, matchedSkills, missingSkills, factors, explanation }`.
- **`score`** entero **0..100**. **`MatchLevel`**: `VERY_LOW` (≤25), `LOW` (≤50), `GOOD` (≤75), `VERY_GOOD` (>75).
- **Pesos** del scoring (suman 100, deterministas, sin IA): **skills 50, remote 20, seniority 20, location 10**.

---

## 10. Respuestas API: bare vs `{ data }` + errores

- **No asumir un wrapper uniforme.** El cliente tipado debe modelar **cada endpoint por separado**:
  - **Envuelto `{ data, ... }`:** `GET /api/jobs` (con `total/page/limit`), `GET /api/saved-jobs` (`{ data }`), `GET /api/profile/me/matches` (`{ data }`).
  - **Bare:** `GET /api/dashboard/me`, `GET /api/auth/me`, `GET /api/jobs/:id`, `GET /api/jobs/:id/match`, resultado de `POST /api/saved-jobs/:jobId`, y `register`/`login` (`{ accessToken, user }`).
- **Errores (homogéneo, ADR-0007):** `{ error: { code, message, details? } }`. Códigos: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `NOT_FOUND` (404), `CONFLICT` (409).

---

## 11. Arquitectura frontend propuesta (sin implementar)

- **Stack:** **Next.js + TypeScript + Tailwind** (ratificado por [ADR-0002](../decisions/ADR-0002-initial-stack.md)). **App Router** (greenfield).
- **Puertos:** frontend **`:3000`**, backend dev **`:4000`**. En dev es **cross-origin** → `fetch(..., { credentials: "include" })` (la cookie httpOnly de logout/refresh-futuro viaja; la auth real usa **Bearer**). `CORS_ORIGIN` por defecto admite `http://localhost:3000`.
- **Config de API:** **`NEXT_PUBLIC_API_BASE_URL`** (dev: `http://localhost:4000`), **sin secretos**. **No hardcodear URLs** en el cliente. `JOOBLE_API_KEY` y cualquier secreto: **jamás** en frontend.
- **Estructura mínima:**

  ```
  apps/web/src/app          # rutas y layouts (App Router)
  apps/web/src/components    # componentes UI reutilizables
  apps/web/src/lib           # cliente API tipado, helpers, sesión
  apps/web/src/features      # lógica por dominio (auth, dashboard)
  apps/web/src/types         # espejo de contratos backend
  ```

- **Scaffolding (requiere autorización explícita posterior):** crear `apps/web/**`, **modificar `pnpm-lock.yaml`** e instalar dependencias (Next.js, React, Tailwind, tooling de test). `pnpm-workspace.yaml` **ya cubre `apps/*`** → no tocar salvo necesidad real justificada. `package.json` raíz: solo si hiciera falta.

---

## 12. Alcance funcional / Fuera de alcance

**Incluido:** landing simple · login · register (con confirmación de contraseña en cliente) · dashboard privado (`GET /api/dashboard/me`) · navegación mínima · logout · cliente API tipado (Bearer + `credentials:"include"` + manejo 401) · sesión en memoria · estados loading/error/empty · protección mínima de la ruta dashboard.

**Fuera de alcance:** editor perfil/CV · CRUD skills/experience/education/projects · Jobs UI completa · filtros avanzados · gestión completa de saved jobs · detalle visual avanzado de match (`factors`/`explanation`) · recruiter/ATS/admin/comunidad/monetización · deploy/CI/CD · backend/Prisma/nuevas APIs · IA avanzada · Jooble desde frontend (backend-only).

---

## 13. Riesgos y deuda técnica

- **Sin `/api/auth/refresh`** → re-login tras recarga/expiración (15 min). Persistencia/renovación = **deuda de backend**, fuera de alcance.
- **Greenfield** → el scaffolding tocará `pnpm-lock.yaml` y añadirá dependencias (autorización requerida); el tooling de tests aún no existe.
- **Dashboard agregado** (un endpoint) → loading/error **global**, sin error parcial por bloque.
- **Respuestas bare vs `{ data }`** → cliente tipado por endpoint; asumir wrapper común sería un bug.
- **Cross-origin dev `:3000→:4000`** con cookies/credenciales → validar CORS + `credentials:"include"` al arrancar.
- `docs/agents/operating-environment.md` aún no refleja macOS como clon nativo autorizado (riesgo documental pendiente; no se modifica aquí).

---

## 14. Plan de fases siguiente

1. ~~SDD Review frontend~~ ✅ hecho (contratos cerrados).
2. ~~TDD/Quality Planning~~ ✅ hecho ([tdd-plan](sprint-07-frontend-candidate-tdd-plan.md)).
3. **Autorización explícita de scaffolding** (`apps/web`, dependencias, `pnpm-lock.yaml`) ← **siguiente**.
4. Arquitectura frontend mínima (estructura, layouts, rutas).
5. Cliente API/Auth (Bearer, `credentials:"include"`, manejo 401, sesión en memoria).
6. Pantallas mínimas (landing, login/register, dashboard).
7. Protección de la ruta dashboard.
8. Pulido UX (loading/error/empty, accesibilidad básica).
9. Verificaciones (`@jobit/web` typecheck/build/test) + smoke manual.
10. Auditoría quality/security.
11. Informe final del sprint.

---

## 15. Definition of Done

- Trabajo en la rama `feat/sprint-07-frontend-candidate`.
- **Sin tocar** backend/Prisma; sin endpoints nuevos; sin cambios en `apps/api/**`.
- **Sin secretos** (no se versiona ni expone `refresh_token`, tokens ni `.env`).
- **`accessToken` solo en memoria** (sin `localStorage`/`sessionStorage`).
- **Sin endpoints/DTOs inventados**: solo lo verificado en §4–§10.
- `build` / `typecheck` / `test` en verde según los **scripts reales** del workspace (`@jobit/web`).
- El dashboard consume `GET /api/dashboard/me` con datos reales (loading/error/empty cubiertos).
- Informe final del sprint completo y trazable.
