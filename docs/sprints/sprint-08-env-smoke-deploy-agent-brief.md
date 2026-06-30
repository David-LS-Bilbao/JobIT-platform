# Sprint 08 — Entorno, smoke real y deploy dev/staging — Agent brief

> Documento de Fase 0 (solo documental). Fija objetivo, alcance, riesgos, reglas
> de entorno WSL, plan SDD/TDD, criterios de aceptación y próximos pasos del
> Sprint 08. No implementa nada, no provisiona, no despliega.
>
> Rama: `feat/sprint-08-env-smoke-deploy` (creada desde `dev` en el clon nativo
> de WSL). Entorno operativo: ver [operating-environment](../agents/operating-environment.md).

## 1. Objetivo

Cerrar la **deuda del Sprint 07**: el *smoke* real quedó **BLOCKED por entorno/provisión**, no por defecto del frontend ni del backend.

Validar de extremo a extremo el flujo real con stack levantado:

```
backend (Express :4000) + PostgreSQL + frontend (Next.js :3000) + navegador
register → login → dashboard → logout
```

El objetivo es **provisionar un entorno local reproducible** y **ejecutar el smoke real** (o, si no es posible, marcar BLOCKED con la causa exacta), y **planificar** un deploy dev/staging que **solo** se ejecutará con autorización explícita.

## 2. Contexto funcional heredado

Integrados en `dev` (HEAD `2ad435c`):

- **Auth MVP (M01)** — register/login/logout/me, `requireAuth`, JWT + cookie `refresh_token` httpOnly.
- **Candidate Profile/CV (M02)**.
- **Jobs (M03)** + Jooble backend-only + política de visibilidad pública.
- **Saved Jobs (M04)**.
- **Match básico explicable (M05)**.
- **Candidate Dashboard (M06)** — `GET /api/dashboard/me` agregado.
- **Frontend candidate-first (Sprint 07)** — `apps/web` (Next.js + TS + Tailwind, App Router).

El frontend ya implementa el flujo vertical:

```
landing → login/register → sesión en memoria → dashboard privado → logout / re-login ante 401
```

Detalles relevantes (del informe final del Sprint 07):
- URL base del backend desde `NEXT_PUBLIC_API_BASE_URL` (dev `http://localhost:4000`); sin URLs hardcodeadas.
- Frontend `:3000`, backend dev `:4000`; cross-origin en dev → `credentials:"include"`.
- `accessToken` solo en memoria; `refresh_token` httpOnly; **no existe** `POST /api/auth/refresh` (recarga/expiración → re-login).
- Integración testeada con **mocks** (35/35 verdes en web); el **smoke real nunca se ejecutó** (BLOCKED por entorno).

## 3. Estado real del entorno detectado

(Del Startup + Alignment Report de este sprint; sin imprimir secretos ni valores reales.)

- Ruta WSL correcta: `/home/david/projects/JobIT-platform` (clon nativo, verificado con `pwd -P` y `git rev-parse --show-toplevel`).
- `dev` local alineado con `origin/dev` (`2ad435c`).
- Working tree limpio.
- Rama `feat/sprint-08-env-smoke-deploy` **creada desde `dev`** en este sprint.
- Sin repositorio anidado (solo `./.git`).
- **`apps/api/.env.example`: ausente.**
- **`apps/api/.env`: ausente.**
- **`apps/web/.env.local`: ausente.**
- `apps/web/.env.example`: presente (define `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`, sin secretos).
- **`docker-compose.yml` y carpeta `docker/`: ausentes.**
- **`apps/web/node_modules`: ausente** (root y `apps/api` presentes).
- Contenedor `jobit-postgres-test` (`postgres:16-alpine`) activo en `0.0.0.0:5434->5432` (es la **DB de test**).
- Puertos relevantes libres en el momento del report: `:3000`, `:3001`, `:4000`, `:5000`, `:8080` (nota: `:3000` apareció ocupado por Docker durante el Sprint 07; revisar al provisionar).

## 4. Regla obligatoria de entorno WSL

- Trabajar **solo** desde `/home/david/projects/JobIT-platform`.
- **No** usar `/mnt/c/Users/David/OneDrive/...` ni `C:\Users\David\OneDrive\...` para ningún tooling.
- Desde Windows, invocar siempre con la ruta forzada:
  `wsl --cd /home/david/projects/JobIT-platform -- bash -lc '<comandos>'`.
- Dentro de WSL, **verificar SIEMPRE** `pwd -P` y **abortar** si no devuelve exactamente `/home/david/projects/JobIT-platform`.
- **No** ejecutar `pnpm install`, tests, build ni Prisma en la carpeta de OneDrive.
- Nota de método: evitar paso de comandos con `$()`/backticks anidados a través de Git Bash/PowerShell→`wsl` (el escaping ha producido lecturas erróneas de rama/ruta). Preferir comandos directos o un script en `/tmp` ejecutado con `bash`.
- Excepción macOS (autorizada en `operating-environment.md`): clon nativo de macOS solo con autorización explícita; **nunca** rutas OneDrive/Windows.

## 5. Riesgos iniciales

| Riesgo | Severidad | Impacto | Mitigación |
|---|---|---|---|
| El cwd de WSL cae por defecto en OneDrive | Alta | Tooling/tests/deploy podrían correr sobre el checkout prohibido; resultados no fiables | Usar `wsl --cd` a la ruta nativa; verificar `pwd -P`; abortar si no coincide |
| Falta `apps/api/.env.example` | Alta | No hay plantilla de variables del backend; difícil reproducir entorno | Crear plantilla en fase posenterior (Environment Readiness), sin secretos reales |
| Falta `apps/api/.env` | Alta | El backend dev (`tsx watch`, cwd `apps/api`) no carga `DATABASE_URL`/JWT secrets → no arranca smoke | Provisionar `.env` local (no versionado) en fase de readiness; documentar variables requeridas |
| Falta `apps/web/.env.local` | Alta | Sin `NEXT_PUBLIC_API_BASE_URL` el cliente lanza `CONFIG_ERROR` | Copiar `apps/web/.env.example` → `.env.local` en readiness |
| Falta `docker-compose.yml` / `docker/` | Alta | No hay orquestación reproducible de postgres+api+web para el smoke | Decidir en readiness: compose dedicado vs arranque manual documentado |
| `apps/web/node_modules` ausente | Media | El frontend no se puede build/dev sin instalar | `pnpm install` (workspace) desde la ruta nativa |
| DB disponible solo como contenedor de test (5434) | Media | Usar la DB de test para el smoke puede contaminar datos de test | Definir DB dev/smoke dedicada o aislamiento; no reutilizar a ciegas |
| Confusión entre smoke local, staging y producción | Media | Riesgo de ejecutar acciones de deploy fuera de alcance | Separar fases; deploy solo con autorización explícita; nunca tocar producción |
| Exposición accidental de secretos | Alta | Fuga de credenciales en logs/commits/chat | No imprimir `.env`; `.env.example` sin valores reales; `.env*` ignorados por Git |
| `:3000` potencialmente ocupado (Docker) | Media | El frontend no levanta o colisiona | Liberar puerto o ajustar puerto/`CORS_ORIGIN` en readiness |
| No existe `/api/auth/refresh` | Baja | Recarga/expiración → re-login; afecta UX del smoke, no el flujo objetivo | Documentar como deuda; el smoke objetivo no depende de refresh |

## 6. Alcance del sprint

- Diagnóstico del entorno WSL (hecho en Startup; se consolida).
- Configuración local **segura** (plantillas y `.env` locales, sin secretos versionados).
- **Smoke real local** del flujo `register → login → dashboard → logout`.
- Documentación del procedimiento de arranque y del smoke.
- **Plan** de deploy dev/staging (sin ejecutar por defecto).
- Deploy **solo** si hay autorización explícita.
- Verificación post-deploy **si aplica**.
- Checklist de **rollback**.
- Informe final al orquestador.

## 7. Fuera de alcance

- Nuevas features de frontend.
- UI completa de Jobs.
- UI completa de Saved Jobs.
- UI completa de Profile/CV.
- Endpoint `/api/auth/refresh` (salvo decisión explícita).
- Cambios funcionales de backend.
- Cambios funcionales de Prisma.
- Nuevas APIs externas.
- Llamadas reales a Jooble.
- n8n.
- CI/CD completo.
- Producción real.
- Monetización.
- Recruiter / ATS / admin / comunidad.

## 8. Plan SDD/TDD del Sprint 08

1. **Startup + Alignment Report** — completado (READY_FOR_PHASE_0).
2. **Fase 0 — Brief documental** — este documento.
3. **Environment Readiness Plan** — plan de provisión local (env, DB, puertos, comandos), sin ejecutar smoke.
4. **Local backend readiness** — `apps/api/.env` local + Prisma generate/migrate/seed si procede + arranque `:4000`.
5. **Local frontend readiness** — `apps/web/.env.local` + `pnpm install` + build/dev `:3000`.
6. **Smoke real local** — ejecutar `register → login → dashboard → logout` con evidencia; o BLOCKED con causa exacta.
7. **Deploy dev/staging planning** — estrategia, requisitos y checklist (sin ejecutar).
8. **Deploy execution** — solo si autorizado explícitamente.
9. **Post-deploy checks** — si aplica.
10. **Auditoría quality/security** — PASS o PASS_WITH_NOTES.
11. **Informe final** — al orquestador.
12. **Prompt final** — actualización documental global (estado real tras smoke/deploy).

## 9. Criterios de aceptación

- Ruta WSL correcta verificada (`/home/david/projects/JobIT-platform`).
- `dev` actualizado antes de crear la rama del sprint.
- No se toca `main` ni `dev` directamente tras crear la rama.
- No se exponen secretos en ningún momento.
- Smoke real **resuelto con evidencia concreta** o **BLOCKED con causa exacta** (sin inventar resultados).
- Deploy **solo** con autorización explícita; si no se autoriza, queda planificado.
- Checklist de rollback presente.
- Tests/build/typecheck relevantes pasan, o se documenta por qué no aplican.
- Auditoría quality/security **PASS** o **PASS_WITH_NOTES**.
- Informe final para el orquestador entregado.

## 10. Kill-switch

Detener y marcar **BLOCKED** si:

- La ruta no es exactamente `/home/david/projects/JobIT-platform`.
- Se usa OneDrive/Windows para tooling.
- La rama activa es incorrecta.
- Se trabaja en `main`/`dev` tras crear la rama del sprint.
- Aparece un repositorio anidado.
- El working tree está sucio sin explicación.
- Se imprimen secretos.
- Se modifica un `.env.example` con valores reales.
- Se hardcodean credenciales.
- Se hacen cambios funcionales de backend no autorizados.
- Se hacen cambios de Prisma no autorizados.
- Se añaden dependencias no autorizadas.
- Se ejecuta deploy sin autorización.
- Se borran volúmenes o la DB sin backup/autorización.
- Se hace commit/push/merge sin autorización.

## 11. Próxima fase propuesta

**Environment Readiness Plan** (planificar, **no** ejecutar smoke todavía). Debe preparar un plan para:

- `apps/api/.env.example` (plantilla sin secretos): variables requeridas por el backend.
- `apps/api/.env` local (no versionado): `DATABASE_URL`, JWT secrets, `CORS_ORIGIN`, etc.
- `apps/web/.env.local`: `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`.
- DB dev/smoke: decidir contenedor/uso (sin contaminar la DB de test 5434) y su `DATABASE_URL`.
- Prisma `generate`/`migrate`/`seed` si procede (sin migraciones destructivas).
- Puertos backend (`:4000`) y frontend (`:3000`), y resolución del posible conflicto en `:3000`.
- CORS/cookies (cross-origin dev, `credentials:"include"`, `refresh_token` httpOnly).
- Comandos de arranque reproducibles (desde la ruta nativa de WSL).
- Estrategia de no exponer secretos (gestión de `.env`, `.gitignore`, logs).

> El plan de readiness es documental/preparatorio; la ejecución (instalar, provisionar, migrar, arrancar y smoke) se hará en las fases 4–6 con sus propios prompts y verificaciones.
