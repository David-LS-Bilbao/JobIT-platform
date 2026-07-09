# Runbook — Deploy staging JobIT en VPS

Manual operativo (Sprint 20.5) para desplegar el staging de JobIT en el VPS. **Este
documento no ejecuta nada**: convierte lo validado en las fases 20.1–20.4 en un
procedimiento revisable para la futura fase 20.6 (deploy real, con autorización expresa).
Referencias: spec [deploy-staging-readiness](../specs/features/deploy-staging-readiness.md),
[ADR-0012](../decisions/ADR-0012-staging-deploy-architecture.md),
[staging-env](staging-env.md) y el
[resultado del smoke Docker](../sprints/sprint-20-4-docker-smoke-result.md).

## 1. Objetivo

Desplegar el stack staging (PostgreSQL + API + Web) en el VPS existente detrás de Nginx
Proxy Manager (NPM), con HTTPS, cookies funcionales, base de datos aislada, migraciones
gated, backups y rollback definidos — siguiendo pasos ya validados en local siempre que
sea posible.

## 2. Estado actual validado

Todo lo siguiente está mergeado en `dev` y validado en local (Sprint 20.4):

- Imágenes Docker de API y Web construyen y ejecutan (`apps/api/Dockerfile`,
  `apps/web/Dockerfile`, Next standalone).
- `docker-compose.staging.yml`: 3 servicios healthy, red interna, DB sin puerto publicado,
  volúmenes persistentes (DB + uploads), rotación de logs.
- Migraciones gated con el stage `builder` (idempotentes) y seed mock idempotente.
- Flujo candidato completo: smoke API 12/12 y Playwright E2E 7/7 contra el stack
  dockerizado; persistencia verificada en PostgreSQL por red interna.
- Plantilla `.env.staging.example` y guía de secretos (`staging-env.md`).

## 3. Fuera de alcance

- Ejecutar el deploy real (fase 20.6 / sprint futuro con autorización expresa).
- Producción real, CD automático desde GitHub Actions, GitHub Secrets.
- Alta o cambios de DNS (los subdominios se documentan; crearlos es tarea del operador).
- Ingesta real Jooble/Greenhouse en staging (secreto real implicado; decisión posterior).
- Cambios en compose/Dockerfiles/código (cualquier ajuste va por PR, nunca a mano en VPS).
- Monitorización avanzada, CDN, escalado.

## 4. Arquitectura objetivo

```text
Internet ──HTTPS──> Nginx Proxy Manager (VPS, 80/443, Let's Encrypt, Force SSL)
                      ├── jobit-staging.davlos.es      ──> jobit-staging-web:3000
                      └── api-jobit-staging.davlos.es  ──> jobit-staging-api:4000
                                                            │
                                                red interna docker `jobit-staging`
                                                            │
                                                    jobit-staging-db:5432
                                                    (SIN puerto publicado, nunca)
```

- Ambos subdominios bajo `davlos.es` → **same-site**: la cookie `refresh_token`
  (`SameSite=Lax`, `httpOnly`, `secure` con `NODE_ENV=production`) funciona sin tocar
  código. Cambiar a dominios cruzados exige ADR nuevo.
- En el escenario VPS ideal, **ni API ni Web publican puertos al host**: NPM llega por la
  red interna Docker. La alternativa conservadora (publicar solo en `127.0.0.1`) queda
  como decisión pendiente (§19).
- Volúmenes persistentes: `jobit-staging-db-data` y `jobit-staging-api-uploads`.
- Backups de DB y uploads (§14). Migraciones siempre gated con el stage builder (§10).

## 5. Prerrequisitos

- VPS con Docker Engine y Docker Compose v2 instalados y con espacio suficiente
  (imágenes ~1.4 GB + volúmenes + backups; comprobar con `df -h`).
- Nginx Proxy Manager funcionando (ya existe para otros proyectos; 80/443 abiertos).
- DNS: `jobit-staging.davlos.es` y `api-jobit-staging.davlos.es` apuntando al VPS
  (crear los registros es acción del operador, previa a 20.6).
- Acceso SSH al VPS; usuario operativo no-root con permiso de docker (recomendado).
- Repo clonado en el VPS (p. ej. `/srv/jobit-staging/JobIT-platform`, rama `dev` en el
  commit taggeado a desplegar) — ver §8.
- Directorios de trabajo: `/srv/jobit-staging/` (`.env`, `backups/`).
- Estrategia de backups definida ANTES de la primera migración (§14).

## 6. Variables y secretos

Base: `.env.staging.example` (plantilla versionada) y la guía `staging-env.md`.

- El `.env` real vive en el VPS, fuera del repo: **`/srv/jobit-staging/.env`**
  (permisos `600`, propietario el usuario operativo).
- Generación de secretos (nuevos por entorno, nunca los de dev/test):
  - `JWT_ACCESS_SECRET` → `openssl rand -hex 48`
  - `POSTGRES_PASSWORD` → `openssl rand -base64 32` (actualizarla también dentro de
    `DATABASE_URL`)
- Valores fijos de staging:
  - `CORS_ORIGIN=https://jobit-staging.davlos.es` (exacto, sin barra final)
  - `NEXT_PUBLIC_API_BASE_URL=https://api-jobit-staging.davlos.es` (pública; build-arg)
  - `DATABASE_URL` con hostname interno `jobit-staging-db`, nunca localhost
- Sin GitHub Secrets ni CD desde Actions (requeriría ADR propio).
- Nunca imprimir secretos en terminal, logs ni documentación.

### Compose ↔ env real (pendiente resuelto documentalmente)

`docker-compose.staging.yml` lleva hoy dummies `change_me` hardcodeados (fue diseñado para
validación local). Para el VPS:

- **Opción recomendada para 20.6**: adaptar el compose a interpolación `${VAR}` y arrancar
  con `docker compose --env-file /srv/jobit-staging/.env -f docker-compose.staging.yml up -d`.
  Un solo archivo de verdad, sin duplicación.
- **Alternativa**: mantener el compose local intacto y crear un override de VPS
  (`docker-compose.staging.vps.yml`) que sobrescriba `environment` desde el `.env`.
- En ambos casos: **el cambio se hace por PR en el repo, nunca editando a mano en el VPS**
  (regla de este runbook; el VPS solo hace `git pull` de commits revisados).

## 7. Preparación del VPS

1. Verificar Docker y Compose: `docker --version && docker compose version`.
2. Crear estructura: `sudo mkdir -p /srv/jobit-staging/backups` (propietario: usuario
   operativo).
3. Crear `/srv/jobit-staging/.env` desde la plantilla (copiar contenido de
   `.env.staging.example` y sustituir TODOS los `change_me`); `chmod 600`.
4. Confirmar que NPM está sano y que los DNS resuelven al VPS (`dig +short` de ambos
   subdominios).
5. Comprobar que los puertos internos previstos no colisionan con otros proyectos del VPS
   (los contenedores usan red propia; solo habría colisión si se publican puertos).

## 8. Preparación del código

1. Clonar/actualizar el repo en el VPS: `git clone` inicial o
   `git fetch && git checkout dev && git pull --ff-only` (nunca editar archivos en el VPS).
2. Anotar el SHA a desplegar: `git rev-parse --short HEAD` → se usa como tag de imágenes
   (rollback, §16).
3. Verificar que el working tree del VPS está limpio: `git status --short`.

## 9. Build de imágenes

Build **in situ en el VPS** (recomendado para MVP/staging: evita registry y secretos
adicionales; un registry queda como evolución futura si el proyecto crece — §19).

```bash
SHA=$(git rev-parse --short HEAD)

# API runtime:
docker build -f apps/api/Dockerfile -t jobit-api:staging-$SHA .

# Web (el build-arg PÚBLICO se hornea en la imagen; si cambia, rebuild):
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api-jobit-staging.davlos.es \
  -t jobit-web:staging-$SHA .

# API builder (para migraciones/seed gated):
docker build --target builder -f apps/api/Dockerfile -t jobit-api:builder-$SHA .
```

Nota: el compose referencia `jobit-api:staging-local`/`jobit-web:staging-local`; el mapeo
de tags SHA ↔ tags del compose se cerrará con la decisión compose↔env de 20.6 (retag
`docker tag jobit-api:staging-$SHA jobit-api:staging-local` es el puente simple mientras
tanto).

## 10. Migraciones y seed

**Nunca automáticos; siempre gated y con backup previo.**

```bash
# 1. BACKUP OBLIGATORIO antes de migrar (ver §14 para el comando completo).
# 2. Migrar (misma red interna; DATABASE_URL leída del .env real, sin imprimirla):
docker run --rm --network jobit-staging \
  --env-file /srv/jobit-staging/.env \
  jobit-api:builder-$SHA pnpm --filter @jobit/api exec prisma migrate deploy

# 3. Seed mock inicial (OPCIONAL; idempotente, solo tabla Job; decisión en §19):
docker run --rm --network jobit-staging \
  --env-file /srv/jobit-staging/.env \
  jobit-api:builder-$SHA pnpm --filter @jobit/api exec tsx prisma/seed.ts
```

Sin ingesta real Jooble/Greenhouse ni API keys reales en este deploy inicial (decisión
posterior con su propio alcance).

## 11. Arranque del stack

```bash
cd /srv/jobit-staging/JobIT-platform
docker compose --env-file /srv/jobit-staging/.env -f docker-compose.staging.yml up -d
docker compose -f docker-compose.staging.yml ps   # esperar 3/3 healthy
```

(El flag `--env-file` aplica con la opción recomendada de §6; con el compose actual de
dummies, el arranque en VPS NO es válido hasta resolver esa decisión en 20.6.)

## 12. Nginx Proxy Manager

Solo documentación; no configurar todavía. Dos proxy hosts en NPM:

| Proxy host | Dominio | Destino (opción red compartida) | Destino (opción localhost) |
|---|---|---|---|
| Web | `jobit-staging.davlos.es` | `jobit-staging-web:3000` | `127.0.0.1:3000` |
| API | `api-jobit-staging.davlos.es` | `jobit-staging-api:4000` | `127.0.0.1:4000` |

- **Opción red compartida** (ideal, sin puertos host): conectar el contenedor de NPM a la
  red `jobit-staging` (`docker network connect jobit-staging <contenedor-npm>`) y apuntar
  a los hostnames internos.
- **Opción localhost**: publicar los puertos de API/Web SOLO en `127.0.0.1` (requeriría
  ajustar `ports:` del compose vía PR) y apuntar NPM a `127.0.0.1:<puerto>`.
- En ambos proxy hosts: SSL con **Let's Encrypt**, **Force SSL** activado, HTTP/2;
  "Websockets support" activado (inofensivo; Next puede usarlo en algunas features).
- PostgreSQL: **nada que configurar en NPM** — no tiene puerto publicado y no debe
  tenerlo jamás; ninguna regla de proxy debe apuntar a la DB.

## 13. Validación HTTPS, CORS y cookies

Tras el arranque y NPM configurados (fase 20.6):

1. `curl -I https://api-jobit-staging.davlos.es/health` → `HTTP/2 200` (o `HTTP/1.1 200`).
2. Abrir `https://jobit-staging.davlos.es` en navegador → landing carga sin mixed content.
3. Registrar un usuario dummy de staging (email tipo `staging-smoke-<fecha>@example.com`,
   password dummy; jamás credenciales reales).
4. Login → dashboard privado visible.
5. En las DevTools del navegador (pestaña Application/Cookies), confirmar que
   `refresh_token` llega con **`Secure`**, **`HttpOnly`** y **`SameSite=Lax`**.
6. Consola de red sin errores CORS en ninguna llamada a la API.
7. Prueba negativa de CORS (opcional):
   `curl -s -o /dev/null -w "%{http_code}" -H "Origin: https://evil.example" -H "Access-Control-Request-Method: GET" -X OPTIONS https://api-jobit-staging.davlos.es/api/jobs`
   → la respuesta no debe incluir `Access-Control-Allow-Origin` para ese origen.
8. Flujo funcional: jobs → detalle → guardar → guardadas → quitar → match (equivalente al
   smoke 12/12 de 20.4, ahora sobre HTTPS real).

## 14. Backups

- **Pre-migración (obligatorio)**:
  ```bash
  docker exec jobit-staging-db pg_dump -U jobit_staging -d jobit_staging -F c \
    > /srv/jobit-staging/backups/jobit_staging_$(date +%Y%m%d_%H%M%S).dump
  ```
- **Programado**: cron diario del mismo comando (p. ej. 04:00) + copia del volumen de
  uploads:
  ```bash
  docker run --rm -v jobit-staging-api-uploads:/uploads:ro -v /srv/jobit-staging/backups:/backup \
    debian:stable-slim tar czf /backup/uploads_$(date +%Y%m%d).tar.gz -C /uploads .
  ```
- **Ubicación**: `/srv/jobit-staging/backups` (fuera de los volúmenes Docker).
- **Retención inicial sugerida**: 7 diarios + 4 semanales (borrado por cron con
  `find -mtime`); revisable en 20.6 (§19).
- **Prueba de restauración**: pendiente — programar una restauración de ensayo a una DB
  temporal tras el primer deploy (no antes; queda anotado como tarea futura).

## 15. Logs y troubleshooting

Comandos base: `docker compose -f docker-compose.staging.yml ps` y
`docker compose -f docker-compose.staging.yml logs -f [servicio]` (rotación ya configurada
en compose; los logs no deben contener tokens/cookies/secretos).

| Síntoma | Causa típica | Acción |
|---|---|---|
| Login falla desde la web, API responde | CORS mismatch | `CORS_ORIGIN` debe ser EXACTO al origen público de la web |
| Cookie no se guarda | Acceso por HTTP (no HTTPS) | La cookie lleva `Secure`; usar siempre HTTPS vía NPM |
| Web llama a URL equivocada | `NEXT_PUBLIC_API_BASE_URL` incorrecta horneada | Rebuild de la imagen web con el build-arg correcto |
| API crashea al conectar a DB | `DATABASE_URL` con localhost o credenciales mal | Usar hostname interno `jobit-staging-db` y el `.env` real |
| Errores de tabla inexistente | Migraciones pendientes | Ejecutar §10 (con backup previo) |
| API crashea al cargar Prisma | Engine/OpenSSL (visto en 20.1) | Ya mitigado en el Dockerfile (OpenSSL en base); no usar imágenes ajenas |
| Avatares no se guardan | Permisos del volumen de uploads | El volumen debe ser escribible por el usuario `node` del contenedor |
| NPM devuelve 502 | NPM no está en la red `jobit-staging` (o puerto no publicado) | `docker network connect` o revisar la opción localhost (§12) |
| El stack no arranca | Puertos ocupados por otro proyecto del VPS | Revisar `ports:` publicados; preferir la opción sin puertos host |

## 16. Rollback

1. Las imágenes van taggeadas por SHA (§9): volver atrás = arrancar el stack con los tags
   del SHA anterior (retag/compose), **sin rebuild**.
2. Si el despliegue incluyó migración y hay que revertirla: **restaurar el dump
   pre-migración** (`pg_restore` sobre la DB de staging) y arrancar con el tag anterior.
3. **Nunca rollback "ciego" de la DB**: sin dump previo verificado no se revierte una
   migración (por eso el backup de §10 es obligatorio, no opcional).
4. Verificar tras el rollback: health 200, login de un usuario dummy, logs limpios.

## 17. Checklist pre-deploy

- [ ] Secrets reales solo en `/srv/jobit-staging/.env` (chmod 600); `git grep` limpio.
- [ ] DNS de ambos subdominios resolviendo al VPS.
- [ ] NPM sano, con 80/443 operativos.
- [ ] Directorio de backups creado y cron preparado; dump manual de prueba hecho.
- [ ] Imagen web construida con el build-arg público correcto (URL API de staging).
- [ ] `CORS_ORIGIN` exacto al origen público de la web.
- [ ] `DATABASE_URL` con hostname interno; Postgres sin `ports:`.
- [ ] Decisiones de §19 resueltas (compose↔env, NPM↔red, seed).
- [ ] Smoke local (20.4) re-ejecutado en verde sobre el commit a desplegar.

## 18. Checklist post-deploy

- [ ] `GET /health` de la API → 200 por HTTPS.
- [ ] Landing web carga por HTTPS sin mixed content.
- [ ] Register + login de usuario dummy funcionan.
- [ ] Dashboard privado con datos.
- [ ] Jobs: listado y detalle.
- [ ] Saved jobs: guardar y quitar.
- [ ] Match básico visible.
- [ ] Cookie `refresh_token` con Secure/HttpOnly/SameSite=Lax (DevTools).
- [ ] Logs de los 3 servicios sin secretos ni errores recurrentes.
- [ ] Backup post-deploy creado y visible en `/srv/jobit-staging/backups`.

## 19. Decisiones pendientes antes de 20.6

1. **Compose ↔ env real**: ¿interpolación `${VAR}` en el compose (recomendada) u override
   VPS? Cualquiera de las dos exige PR autorizada antes del deploy.
2. **NPM ↔ stack**: ¿conectar NPM a la red `jobit-staging` (sin puertos host, ideal) o
   publicar API/Web solo en `127.0.0.1` (requiere PR del compose)?
3. **Build de imágenes**: in situ en VPS (recomendado ahora) vs registry (futuro).
4. **Retención final de backups**: confirmar 7 diarios + 4 semanales o ajustar.
5. **Seed inicial en VPS**: ¿ejecutar el seed mock en staging real o dejar la DB vacía?
6. **Momento del deploy real**: fecha/sprint y quién lo ejecuta (fase 20.6 con
   autorización expresa del Director).

## 20. Estado final esperado

Al completar este runbook en la fase 20.6: stack staging accesible en
`https://jobit-staging.davlos.es` (web) y `https://api-jobit-staging.davlos.es` (API),
con los checklists §17 y §18 completos, backups activos y rollback probado
documentalmente. Estado objetivo: `STAGING_DEPLOYED_AND_VALIDATED`.
