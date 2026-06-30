# Sprint 08 — Deploy dev/staging plan

> Documento de planificación (solo documental). **No** ejecuta deploy, **no** crea
> infraestructura, **no** toca código ni `.env` reales. El deploy real requerirá
> autorización explícita posterior y un target definido (dominio/DB/servidor).
> Continúa el [plan de entorno](sprint-08-env-smoke-deploy-plan.md) y el
> [resultado del smoke local](sprint-08-local-smoke-result.md).

## 1. Objetivo

Preparar una estrategia de deploy **dev/staging controlada** para JobIT, **no
producción real**. Puntos clave:

- Este documento **no ejecuta** deploy.
- El deploy requiere **autorización explícita** posterior.
- El **smoke local** ya está en **PASS_WITH_NOTES**.
- El **smoke visual con navegador** queda **pendiente** por falta de navegador/Playwright en el entorno de agente.

## 2. Estado local validado

- Backend `:4000` validado (`GET /health` → 200).
- Frontend `:3000` validado (landing 200, contenido "JobIT").
- PostgreSQL `jobit_dev` validado (contenedor `jobit-postgres-test`, host 5434).
- Migraciones aplicadas (`prisma migrate deploy`, 5 migraciones).
- Seed con 14 ofertas `Job` (vía fallback `tsx`).
- Backend tests: **278/278** PASS.
- Frontend tests: **35/35** PASS.
- Smoke HTTP: register `201` → login `200` → dashboard `200` → logout `204` → post-logout `/api/auth/me` `401`. PASS.
- Smoke UI/navegador: **BLOCKED** por ausencia de navegador/Playwright (no por código).

Sin tokens, cookies, passwords ni secretos en esta evidencia.

## 3. Alcance del deploy dev/staging

- Entorno **dev/staging**, no producción.
- **API** Express (build `dist/server.js`).
- **Web** Next.js (build de producción).
- **PostgreSQL** (instancia/base de staging dedicada).
- **Prisma** `migrate deploy` (no destructivo).
- **Variables de entorno** gestionadas de forma segura, fuera de Git.
- **Reverse proxy** Nginx / Nginx Proxy Manager (según ADR-0002).
- **HTTPS/SSL** obligatorio.
- **Healthchecks** (`GET /health`).
- **Smoke post-deploy** (HTTP del flujo candidato).
- **Rollback básico**.

## 4. Fuera de alcance

- Producción real.
- n8n.
- CI/CD completo.
- Monitorización/observabilidad avanzada.
- Nuevas features.
- Cambios funcionales backend/frontend.
- APIs externas masivas.
- Llamadas reales a Jooble.
- Recruiter / ATS / admin / comunidad.
- Monetización.
- Borrado de bases de datos o volúmenes.

## 5. Arquitectura candidata dev/staging

Arquitectura sencilla sobre VPS con proxy inverso y HTTPS (ADR-0002). Dominio y
servidor concretos **pendientes de confirmar** (no se inventan aquí).

```
                 Internet (HTTPS)
                        │
              ┌─────────▼──────────┐
              │  Nginx / NPM (443) │  reverse proxy + SSL
              └───┬───────────┬────┘
                  │           │
        web.<dominio>     api.<dominio>  (o /api en mismo host)
                  │           │
        ┌─────────▼──┐   ┌────▼───────────┐
        │ Next.js    │   │ Express API    │
        │ (puerto    │   │ (puerto interno│
        │ interno)   │   │ p.ej. 4000)    │
        └────────────┘   └────┬───────────┘
                              │
                       ┌──────▼───────┐
                       │ PostgreSQL    │  (DB staging dedicada)
                       │ (no expuesto  │
                       │  públicamente)│
                       └───────────────┘
```

- Puertos internos (`3000`/`4000`/Postgres) **no** expuestos directamente; solo a través del proxy.
- HTTPS obligatorio en el borde.

## 6. Decisiones pendientes antes de desplegar

| Decisión | Opciones | Recomendación | Quién autoriza | Riesgo si no se decide |
|---|---|---|---|---|
| Dominio/subdominio dev/staging | mismo host con `/api` vs `web.`+`api.` subdominios | Subdominios separados con HTTPS (claridad CORS) | Orquestador/owner | CORS/cookies mal configurados |
| DB staging | contenedor Postgres dedicado vs Postgres gestionado | Postgres gestionado o contenedor **separado** (no `jobit_dev` local, no `jobit_test`) | Owner | Usar DB equivocada / contaminar datos |
| Estrategia web | `next start` (node) vs export estático | `next start` (hay rutas dinámicas/cliente) | Operador | Web no sirve correctamente |
| Estrategia API | `node dist/server.js` directo vs process manager (systemd/pm2) | Process manager para reinicios/logs | Operador | Caídas sin reinicio |
| Reverse proxy | Nginx vs Nginx Proxy Manager | NPM (gestión SSL sencilla) o Nginx | Operador | Sin TLS / enrutado manual frágil |
| SSL | Let's Encrypt vs certificado propio | Let's Encrypt vía proxy | Operador | Sin HTTPS → cookies inseguras |
| Nombres de servicios | — | definir `jobit-api`, `jobit-web`, `jobit-db-staging` | Operador | Operación confusa |
| Backup pre-migración | snapshot DB vs ninguno | snapshot **obligatorio** si hay datos previos | Owner | Pérdida de datos en migración |
| docker-compose en repo | sí (versionado) vs solo docs/manual | A decidir; si se versiona, requiere autorización (afecta infra) | Owner | Infra no reproducible o cambio no autorizado |

## 7. Variables de entorno de deploy

> Placeholders, **sin valores reales**. Los secretos se gestionan **fuera de Git**.

| Variable | App | Obligatoria | Secreta | Ejemplo placeholder | Observaciones |
|---|---|---|---|---|---|
| `DATABASE_URL` | Backend | Sí | **SÍ** | `postgresql://USER:PASSWORD@DB_HOST:5432/jobit_staging?schema=public` | DB staging dedicada |
| `JWT_ACCESS_SECRET` | Backend | Sí | **SÍ** | `__LONG_RANDOM_STAGING_SECRET__` | distinto del de dev/local |
| `PORT` | Backend | No (def 4000) | No | `4000` | puerto interno tras proxy |
| `CORS_ORIGIN` | Backend | Sí (en staging) | No | `https://web.<dominio-staging>` | origen exacto del frontend |
| `NODE_ENV` | Backend | Sí | No | `production` | oculta detalles de error |
| `JOOBLE_API_KEY` | Backend | No | **SÍ** | (vacío en staging si no se usa) | no necesaria para el flujo candidato |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend | Sí | No (público) | `https://api.<dominio-staging>` | URL pública de la API |

Notas: `NODE_ENV=production` en staging hace que el handler de errores **no** exponga detalles internos. `CORS_ORIGIN` debe ser el dominio HTTPS exacto del frontend.

## 8. Base de datos y Prisma en deploy

- DB **staging separada** (p. ej. `jobit_staging`); **no** usar `jobit_test` ni el `jobit_dev` local como staging real.
- **Backup/snapshot** antes de migraciones **si hay datos previos**.
- `prisma generate` (cliente).
- `prisma migrate deploy` (aplica migraciones versionadas; no destructivo).
- `seed` **solo** si staging necesita datos iniciales (ofertas); evaluar caso a caso.
- **Prohibido** `migrate reset`, `db push --force-reset`, drop o borrado de volúmenes.
- **Rollback de migraciones:** si una migración falla tras alterar datos, **restaurar el backup/snapshot**; no intentar resets destructivos.

## 9. Build y arranque backend

Comandos previstos (ajustables al método final de despliegue; ejecutar desde la raíz del repo en el servidor):

```bash
pnpm install --frozen-lockfile
pnpm --filter @jobit/api build
pnpm --filter @jobit/api exec prisma generate
pnpm --filter @jobit/api exec prisma migrate deploy
# arranque (cwd apps/api para que dotenv cargue el .env de staging, o variables inyectadas por el entorno):
node apps/api/dist/server.js   # o vía process manager (systemd/pm2)
# healthcheck:
curl -fsS http://localhost:4000/health
```

## 10. Build y arranque frontend

```bash
pnpm install --frozen-lockfile
pnpm --filter @jobit/web build
# NEXT_PUBLIC_API_BASE_URL debe apuntar al backend staging EN build-time
pnpm --filter @jobit/web start   # puerto interno recomendado :3000 tras proxy
# validacion:
curl -I https://web.<dominio-staging>/
```

Nota: `NEXT_PUBLIC_*` se inyecta en **build-time**; el build de web debe hacerse con `NEXT_PUBLIC_API_BASE_URL` ya apuntando a la API de staging.

## 11. Reverse proxy, HTTPS, CORS y cookies

- **Frontend** público (`web.<dominio>`), **API** pública en subdominio (`api.<dominio>`) o subruta `/api`.
- `CORS_ORIGIN` = origen HTTPS exacto del frontend; `credentials: true` (ya en `app.ts`).
- **HTTPS obligatorio** en el borde (proxy termina TLS).
- Cookie `refresh_token`:
  - `HttpOnly`: sí.
  - `SameSite`: **`None`** si web y API son cross-site (subdominios distintos) — y entonces **`Secure` obligatorio**. Si comparten site, `Lax` puede bastar.
  - `Secure`: **sí** en HTTPS.
- **Riesgo cross-site:** con `web.` y `api.` en sitios distintos, la cookie solo viaja con `SameSite=None; Secure`. Validar en post-deploy.
- **Validación post-deploy de `Set-Cookie`** sin imprimir el valor (solo atributos), como en el smoke local.

> Nota: el código backend actual fija atributos de cookie (en local se observó `HttpOnly; SameSite=Lax; Path=/`, sin `Secure`). Para staging cross-site/HTTPS puede requerir ajuste de `SameSite=None; Secure` — **cambio de código fuera del alcance de esta fase**; documentarlo como decisión/posible deuda.

## 12. Checklist pre-deploy

- [ ] Rama correcta (no `main`/`dev` directamente sin autorización).
- [ ] Working tree limpio o cambios documentales revisados.
- [ ] Secretos preparados **fuera del repo** (gestor de secretos / variables del servidor).
- [ ] Backup/snapshot de DB si hay datos previos.
- [ ] Puertos internos definidos y no expuestos directamente.
- [ ] Dominio/DNS preparado.
- [ ] Nginx/NPM preparado (+ SSL).
- [ ] `build`/`test` locales en verde (ya: api 278/278, web 35/35).
- [ ] Smoke local PASS_WITH_NOTES conocido.
- [ ] **Autorización explícita** recibida + target definido.

## 13. Checklist de ejecución deploy (sin ejecutar)

1. Preparar servidor (paquetes, node, pnpm, Docker si aplica).
2. Clonar/actualizar repo en el servidor.
3. `pnpm install --frozen-lockfile`.
4. Crear variables de entorno **fuera de Git** (api y web).
5. Preparar DB staging (dedicada).
6. `prisma generate` + `prisma migrate deploy` (+ seed si procede).
7. `build` API.
8. `build` web (con `NEXT_PUBLIC_API_BASE_URL` de staging).
9. Arrancar servicios (process manager).
10. Configurar reverse proxy.
11. Configurar SSL (HTTPS).
12. Validar `GET /health` → 200.
13. Validar frontend (landing HTTPS).
14. Smoke post-deploy (flujo candidato).

## 14. Checklist post-deploy

- [ ] Frontend accesible por HTTPS.
- [ ] Backend `GET /health` → 200.
- [ ] register → login → dashboard → logout (HTTP).
- [ ] post-logout `GET /api/auth/me` sin token → 401.
- [ ] Logs sin errores críticos.
- [ ] Cookies seguras en HTTPS (`HttpOnly`, `Secure`, `SameSite` correcto).
- [ ] CORS correcto (origen exacto).
- [ ] Sin secretos expuestos (logs/respuestas).
- [ ] Jooble **no** llamado.

## 15. Rollback básico

- Detener servicios nuevos.
- Volver al release/commit anterior.
- Restaurar variables de entorno previas si cambiaron.
- Restaurar backup/snapshot de DB si hubo migraciones con datos.
- Revertir configuración del proxy si aplica.
- Conservar logs para diagnóstico.
- **No** borrar volúmenes sin autorización.

## 16. Riesgos de deploy

| Riesgo | Severidad | Impacto | Mitigación | Kill-switch asociado |
|---|---|---|---|---|
| Secretos en repo/logs | Alta | Fuga de credenciales | Secretos fuera de Git; no imprimir | Secreto impreso/versionado → BLOCKED |
| CORS incorrecto | Alta | Frontend no consume API | `CORS_ORIGIN` exacto HTTPS | — |
| Cookie no enviada (SameSite/Secure) | Alta | Sesión rota cross-site | `SameSite=None; Secure` en HTTPS | — |
| Migración sin backup | Alta | Pérdida de datos | Snapshot previo obligatorio | Migración sin backup con datos → BLOCKED |
| DB equivocada | Alta | Corrupción/contaminación | DB staging dedicada; nunca test/dev local | Apuntar a DB no identificada → BLOCKED |
| Exponer puertos internos | Media | Superficie de ataque | Solo a través del proxy | Abrir puertos sin proxy → BLOCKED |
| Confundir staging con producción | Alta | Impacto en prod | Nombres/targets explícitos | Tocar producción → BLOCKED |
| Llamadas reales a Jooble | Media | Coste/efectos externos | `JOOBLE_API_KEY` vacío en staging | Llamar a Jooble → BLOCKED |
| Deploy sin autorización | Alta | Acción no aprobada | Exigir autorización + target | Sin autorización → BLOCKED |
| Trabajar desde OneDrive | Alta | Entorno corrupto | Solo ruta nativa WSL/servidor | Ruta OneDrive → BLOCKED |
| Falta smoke visual navegador | Media | UI no validada en vivo | Ejecutar smoke visual en entorno con navegador | — |

## 17. Kill-switch deploy

Detener y marcar **BLOCKED** si:

- No hay autorización explícita.
- Ruta incorrecta (no la ruta nativa del servidor/WSL).
- Rama incorrecta.
- Se imprimen secretos.
- Se versiona un `.env`.
- La DB destino no está identificada.
- No hay backup y existen datos previos.
- Se intenta `drop`/`reset`.
- Se toca producción real.
- Se intenta llamar a Jooble.
- Se intenta deploy desde `main`/`dev` sin autorización.
- Se modifican `package.json`/lockfiles sin autorización.
- Se abren puertos internos sin proxy/justificación.

## 18. Recomendación del operador

- **No ejecutar deploy todavía** hasta validar y aprobar este plan y definir target (dominio/DB/servidor).
- **Opcional pero recomendado:** cerrar el **smoke visual con navegador/Playwright** antes del deploy si el orquestador lo considera necesario (cierra la nota de UI).
- Preparar un **prompt posterior pequeño** para *deploy execution* **solo** cuando haya dominio/DB/servidor definidos y **autorización explícita**.
- Antes del deploy, considerar la **auditoría quality/security** del Sprint 08 para cerrar la rama de forma limpia (commit/PR de los documentos y `apps/api/.env.example`).

## 19. Siguiente paso propuesto

- **Opción A (recomendada):** Auditoría quality/security local del Sprint 08 (revisión del diff documental + `apps/api/.env.example`, sin secretos) antes de cerrar la rama / PR.
- **Opción B:** Deploy dev/staging execution **solo** si el orquestador autoriza y define target (dominio/DB/servidor).
- **Opción C:** Smoke visual con navegador/Playwright en un entorno adecuado, para cerrar la nota de validación UI.
