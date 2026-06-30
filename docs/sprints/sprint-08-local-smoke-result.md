# Sprint 08 — Local smoke result

> Evidencia del smoke real local ejecutado en el clon nativo de WSL. No contiene
> tokens, cookies ni secretos. Cierra la deuda del Sprint 07 (smoke BLOCKED por
> entorno/provisión).

## 1. Objetivo

Validar de extremo a extremo, con backend + PostgreSQL + frontend funcionando a
la vez, el flujo del candidato:

```
register → login → dashboard → logout
```

## 2. Entorno utilizado

- Ruta nativa: `/home/david/projects/JobIT-platform` (WSL2 Ubuntu).
- Rama: `feat/sprint-08-env-smoke-deploy`.
- DB: `jobit_dev` en el contenedor `jobit-postgres-test` (`postgres:16-alpine`, host `5434`). `jobit_test` no se tocó.
- Backend: Express en `:4000` (build `dist/server.js`, `.env` local con `DATABASE_URL`→`jobit_dev`).
- Frontend: Next.js en `:3000` (`.env.local` con `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`).
- Datos seed: 14 ofertas `Job` en `jobit_dev`.

## 3. Servicios arrancados

- **Backend** `:4000` — arranque controlado, `GET /health` → `200`.
- **Frontend** `:3000` — arranque controlado, `GET /` → `200` (landing con marca "JobIT").
- Ambos detenidos al finalizar; puertos liberados (sin huérfanos).

## 4. Datos de smoke

- Email de smoke: `sprint08.smoke.<timestamp>@jobit.local` (usuario único de prueba).
- Password: dummy local temporal **no incluido** en este documento.
- Token/cookie: **no incluidos** (capturados solo en memoria/jar temporal y descartados).

## 5. Evidencia backend (smoke HTTP real)

| Paso | Endpoint | Resultado | Validación |
|---|---|---|---|
| health | `GET /health` | `200` | servicio arriba |
| register | `POST /api/auth/register` | `201` | `accessToken` presente, `user` presente |
| login | `POST /api/auth/login` | `200` | `accessToken` presente; `Set-Cookie: refresh_token` presente |
| dashboard | `GET /api/dashboard/me` (Bearer) | `200` | claves `profile`, `skills`, `savedJobs`, `matches`, `nextActions` presentes |
| logout | `POST /api/auth/logout` (cookie) | `204` | sin cuerpo |
| post-logout | `GET /api/auth/me` (sin token) | `401` | acceso protegido sin sesión |

Detalles seguros (sin valores sensibles):
- **Cookie `refresh_token`** — atributos observados: `Path=/`, `HttpOnly`, `SameSite=Lax`. **Sin `Secure`** (esperado en dev sobre `http://localhost`).
- **Dashboard** — `completionPercentage = 0` (usuario nuevo), `matches` con **3** elementos (derivados de las 14 ofertas seed), estados vacíos coherentes en perfil/guardadas.
- **Anti-fuga** — el cuerpo del dashboard **no** contiene `externalId`, `ingestedAt`, `passwordHash` ni `tokenHash`.

## 6. Evidencia frontend

- **Landing** (`GET /`): `200`, contenido incluye "JobIT". Servida por Next en `:3000` consumiendo `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`.
- **Flujo navegador (register/login/dashboard/logout vía UI):** **BLOCKED** — este entorno de agente **no dispone de navegador real ni Playwright/DevTools**. No se inventa validación visual.
- El flujo funcional equivalente quedó validado a nivel **HTTP real** contra el backend (sección 5).

## 7. Logs e incidencias

- **Backend:** `JobIT API listening on port 4000`; sin errores. Sin secretos en logs.
- **Frontend:** `GET / 200`; warning no bloqueante de Next sobre inferencia del workspace root (lockfile suelto en `~/projects`), cosmético.
- **CORS/cookies:** la cookie se emite con `SameSite=Lax` y sin `Secure` (correcto para `http://localhost` en dev). El comportamiento **cross-origin en navegador** (`:3000` → `:4000` con `credentials:include`) **no se ejercitó** por ausencia de navegador; el smoke HTTP usó peticiones directas al backend.
- **Errores críticos:** ninguno.

## 8. Resultado final

**PASS_WITH_NOTES**

- Smoke HTTP backend: **PASS** (register → login → dashboard → logout → post-logout 401).
- Frontend servido: **PASS** (landing 200).
- Smoke visual en navegador: **BLOCKED** por ausencia de navegador/Playwright (no por defecto de código).

## 9. Riesgos pendientes

- **Validación visual en navegador** pendiente: requiere un entorno con navegador/Playwright para confirmar el flujo UI completo y el envío de la cookie cross-origin.
- **Cookie cross-origin en producción**: con HTTPS y dominios distintos habrá que revisar `SameSite`/`Secure` (en prod la cookie deberá ser `Secure`, y posiblemente `SameSite=None` si front y API son cross-site).
- **Sin `/api/auth/refresh`**: la sesión depende de re-login al expirar/recargar (deuda de backend conocida).
- **Usuario de smoke** permanece en `jobit_dev` (no se borró, por instrucción); es una DB de dev aislada de test.

## 10. Siguiente paso recomendado

Pasar a **Deploy dev/staging planning** (solo planificación; el deploy real requerirá autorización explícita). Como mejora opcional, ejecutar el smoke visual en un entorno con navegador/Playwright para cerrar la nota de validación UI.
