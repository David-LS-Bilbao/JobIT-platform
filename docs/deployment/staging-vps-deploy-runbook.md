# Runbook — Deploy staging JobIT en VPS

Manual operativo para desplegar el staging sintético de JobIT en el VPS. Escrito en el
Sprint 20.5 y **reconciliado en la Fase C** con el contrato realmente implementado y
acreditado en un ensayo local aislado. **Este documento no ejecuta nada ni autoriza nada**:
el deploy real sigue requiriendo autorización humana expresa y separada.
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

Todo lo siguiente está en la rama de la Fase C y validado **en local**, mediante un ensayo
aislado con imágenes equivalentes a producción (`docs/deployment/staging-local-rehearsal.md`):

- Imágenes Docker de API y Web construyen y ejecutan (`apps/api/Dockerfile`,
  `apps/web/Dockerfile`, Next standalone).
- `docker-compose.staging.yml` es el **contrato canónico** del entorno: sin puertos de host
  en ningún servicio, interpolación obligatoria de todas las variables, imágenes por tag
  inmutable y healthcheck de la API contra `/ready`.
- Migraciones gated con el stage `builder` y **gate de `prisma migrate status`** antes y
  después del deploy: 9 migraciones aplicadas, estado posterior limpio.
- Seed sintético ejecutable contra una base clasificada `STAGING` bajo
  `JOBIT_DATA_MODE=SYNTHETIC_STAGING`: 14 ofertas marcadas (`created=14`).
- Golden staging journey de identidad única, ejecutado **dos veces** contra la misma base
  persistente con los límites canónicos, sin crecimiento neto de `User`.
- Persistencia acreditada con reinicio real del contenedor de la API: perfil, skill y
  avatar sobreviven; tras el borrado de cuenta el avatar devuelve 404 y el fichero
  desaparece del volumen.
- Plantilla `.env.staging.example` y guía de secretos (`staging-env.md`).

Lo que **no** está validado: la topología real de Nginx Proxy Manager, TLS y el valor
efectivo de `TRUST_PROXY_HOPS` contra ese proxy. Pertenece a la fase de deploy.

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
- **Ningún servicio publica puertos al host** — ni la base, ni la API, ni la Web. Es
  estructural en el compose canónico, no configurable: NPM llega por la red interna
  `jobit-staging`. Publicar solo en `127.0.0.1` queda como plan B de recuperación (§12), no
  como contrato.
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

### Compose ↔ env real (RESUELTO en la Fase C)

`docker-compose.staging.yml` ya **no** lleva dummies. Toda variable obligatoria usa
interpolación fail-closed `${VAR:?...}`, de modo que:

```bash
# Sin --env-file, esto FALLA en lugar de arrancar con valores de relleno:
docker compose -f docker-compose.staging.yml config
```

El arranque real usa un único fichero de verdad, fuera del repo:

```bash
docker compose --env-file /srv/jobit-staging/.env -f docker-compose.staging.yml up -d
```

Nota histórica: hasta la Fase C el compose llevaba valores literales `change_me`, así que
el `--env-file` documentado aquí era **inerte** y un deploy habría arrancado con un secreto
de ejemplo. Ese es el motivo del cambio.

Variables obligatorias (el arranque falla si falta cualquiera): `POSTGRES_DB`,
`POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `CORS_ORIGIN`,
`TRUST_PROXY_HOPS`, `JOBIT_DATA_MODE`, `JOBIT_IMAGE_TAG` y las tres `NEXT_PUBLIC_*` del
contrato de build.

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

## 9. Build de imágenes (paso SEPARADO de la ejecución)

El compose canónico **no declara `build:`**: construir y ejecutar son dos actos distintos.
Así `docker compose up` no puede construir sin supervisión ni recuperar en silencio una
imagen antigua del host.

```bash
SHA=$(git rev-parse --short HEAD)

# API runtime:
docker build -f apps/api/Dockerfile -t jobit-api:$SHA .

# Web: las NEXT_PUBLIC_* se INLINEAN en el build. Pasarlas al contenedor en
# runtime NO cambia el bundle; si no viajan aquí, no viajan nunca.
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api-jobit-staging.davlos.es \
  --build-arg NEXT_PUBLIC_PUBLIC_BASE_URL=https://jobit-staging.davlos.es \
  --build-arg NEXT_PUBLIC_JOBIT_DATA_MODE=SYNTHETIC_STAGING \
  -t jobit-web:$SHA .

# API builder (tooling de migraciones/seed; la imagen runtime NO trae la CLI de Prisma):
docker build --target builder -f apps/api/Dockerfile -t jobit-api:builder-$SHA .
```

El `.env` real debe declarar `JOBIT_IMAGE_TAG=$SHA`. El compose referencia
`jobit-api:${JOBIT_IMAGE_TAG}` y `jobit-web:${JOBIT_IMAGE_TAG}`: **nunca** `latest` ni un
tag móvil, porque un tag móvil hace indistinguibles «reiniciar» y «desplegar».

## 10. Secuencia de despliegue con gate de migraciones

**Orden obligatorio. La API y la Web NO arrancan antes del gate.** Ese orden es el que
acredita el ensayo local, no una recomendación teórica.

```text
backup → build de imágenes por SHA → SOLO la base → migrate status
       → migrate deploy → migrate status (GATE: cero pendientes) → seed
       → API → /ready 200 → Web
```

```bash
cd /srv/jobit-staging/JobIT-platform
ENVFILE=/srv/jobit-staging/.env
COMPOSE="docker compose --env-file $ENVFILE -f docker-compose.staging.yml"

# 1. BACKUP OBLIGATORIO antes de migrar (§14). Sin dump previo verificado no se migra.

# 2. Solo la base.
$COMPOSE up -d --wait jobit-staging-db

# 3. Estado previo (informativo: en una base nueva habrá pendientes).
docker run --rm --network jobit-staging --env-file "$ENVFILE" \
  jobit-api:builder-$SHA pnpm --filter @jobit/api exec prisma migrate status

# 4. Migrar. Si falla: PARADA DURA. No se arranca ni API ni Web (§16).
docker run --rm --network jobit-staging --env-file "$ENVFILE" \
  jobit-api:builder-$SHA pnpm --filter @jobit/api exec prisma migrate deploy

# 5. GATE: el estado posterior debe estar limpio ("Database schema is up to date").
docker run --rm --network jobit-staging --env-file "$ENVFILE" \
  jobit-api:builder-$SHA pnpm --filter @jobit/api exec prisma migrate status

# 6. Seed sintético (14 ofertas marcadas, idempotente y convergente).
#    Exige JOBIT_DATA_MODE=SYNTHETIC_STAGING: la base clasifica STAGING y sin esa
#    variable el seed se rechaza (y la API ni siquiera arranca).
docker run --rm --network jobit-staging --env-file "$ENVFILE" \
  jobit-api:builder-$SHA pnpm --filter @jobit/api exec tsx prisma/seed.ts

# 7. API, y esperar readiness real (no liveness).
$COMPOSE up -d --wait jobit-staging-api

# 8. Web, solo después de que la API esté ready.
$COMPOSE up -d --wait jobit-staging-web
$COMPOSE ps      # 3/3 healthy
```

La imagen runtime de la API **no** incluye la CLI de Prisma (`prisma` es devDependency y el
stage `runner` instala `--prod`): migrar y sembrar usan el stage `builder` del mismo
Dockerfile, mismo commit y mismo lockfile.

Sin ingesta real Jooble/Greenhouse ni API keys reales en este deploy (decisión posterior
con su propio alcance).

## 11. Verificación de arranque

```bash
# Readiness DB-aware: 200 solo si PostgreSQL responde.
docker exec jobit-staging-api node -e "fetch('http://localhost:4000/ready').then(r=>console.log(r.status))"
$COMPOSE ps    # los tres servicios healthy
```

`GET /health` es **liveness**: responde 200 aunque PostgreSQL esté caído, así que no sirve
como criterio de despliegue. El healthcheck del contenedor de la API apunta a `/ready`
precisamente por eso, y el `depends_on` de la web se apoya en él.

## 12. Nginx Proxy Manager

Solo documentación; la Fase C **no** configura ni toca NPM. Dos proxy hosts:

| Proxy host | Dominio | Destino |
|---|---|---|
| Web | `jobit-staging.davlos.es` | `jobit-staging-web:3000` |
| API | `api-jobit-staging.davlos.es` | `jobit-staging-api:4000` |

**Topología canónica: red Docker compartida.** Ningún servicio publica puertos al host, así
que NPM alcanza los contenedores por hostname interno tras unirse a la red:

```bash
# Fase D, NO ahora:
docker network connect jobit-staging <contenedor-npm>
```

- En ambos proxy hosts: SSL con **Let's Encrypt**, **Force SSL**, HTTP/2 y "Websockets
  support" activado.
- PostgreSQL: **nada que configurar en NPM**. No tiene puerto publicado y no debe tenerlo
  jamás; ninguna regla de proxy debe apuntar a la base.
- `TRUST_PROXY_HOPS=1` corresponde a **un único** salto de NPM. Su valor efectivo contra la
  topología real debe verificarse durante el despliegue: un valor mayor que la realidad
  permite falsificar la IP vía `X-Forwarded-For` y evadir el rate limiting; uno menor agrupa
  a todos los clientes bajo la IP del proxy.
- Alternativa de recuperación (no canónica): publicar API y Web solo en `127.0.0.1` y
  apuntar NPM ahí. Exigiría una PR del compose y se documenta únicamente como plan B.

## 13. Validación HTTPS, CORS y cookies

Tras el arranque y NPM configurados (fase 20.6):

1. `curl -I https://api-jobit-staging.davlos.es/ready` → 200. **`/ready`, no `/health`**:
   este último responde 200 aunque PostgreSQL esté caído.
2. Abrir `https://jobit-staging.davlos.es` en navegador → landing carga sin mixed content.
3. Registrar una identidad **sintética**: con `JOBIT_DATA_MODE=SYNTHETIC_STAGING` la API
   solo acepta direcciones del dominio reservado, p. ej.
   `staging-smoke-<fecha>@synthetic.jobit.invalid`. Un correo ordinario se rechaza con
   `400 SYNTHETIC_STAGING_EMAIL_REQUIRED`. Jamás credenciales ni datos reales.
4. Login → dashboard privado visible.
5. En las DevTools del navegador (pestaña Application/Cookies), confirmar que
   `refresh_token` llega con **`Secure`**, **`HttpOnly`** y **`SameSite=Lax`**.
6. Consola de red sin errores CORS en ninguna llamada a la API.
7. Prueba negativa de CORS (opcional):
   `curl -s -o /dev/null -w "%{http_code}" -H "Origin: https://evil.example" -H "Access-Control-Request-Method: GET" -X OPTIONS https://api-jobit-staging.davlos.es/api/jobs`
   → la respuesta no debe incluir `Access-Control-Allow-Origin` para ese origen.
8. Comprobar el marcador global de entorno sintético en la interfaz y el prefijo
   `JobIT Synthetic ·` en las ofertas.
9. Flujo funcional: jobs → detalle → guardar → guardadas → quitar → match. Equivale al
   Golden staging journey ya acreditado en el ensayo local, ahora sobre HTTPS real.

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

Cuatro mecanismos DISTINTOS. Confundirlos es el error que este apartado existe para evitar.

| Mecanismo | Qué hace | Cuándo |
|---|---|---|
| `IMAGE_ROLLBACK` | Arrancar el stack con el tag SHA anterior, sin rebuild | Fallo de imagen o de aplicación **sin** cambio de schema por medio |
| `CONFIG_ROLLBACK` | Corregir `/srv/jobit-staging/.env` y recrear | Variable mal puesta. Si es una `NEXT_PUBLIC_*`, exige **rebuild** de la web: se inlinea en el bundle |
| `DATABASE_RESTORE` | `pg_restore` del dump pre-migración | Cuando hay que revertir el schema |
| `FORWARD_FIX` | Desplegar un SHA nuevo que corrige | Preferible cuando la migración es aditiva y compatible |

**Principio, sin excepciones:**

```text
Una imagen anterior puede restaurarse tras un cambio de schema
SOLO si la compatibilidad hacia atrás se ha establecido EXPLÍCITAMENTE.

En caso contrario:
  forward fix
  o
  restaurar la base pre-migración + imagen compatible.
```

### Caso concreto acreditado

La migración `20260819091121_add_refresh_token_rotation_lineage` añade
`RefreshToken.familyId` y lo eleva a `NOT NULL` **sin `DEFAULT`**. El código inmediatamente
anterior insertaba el token sin ese campo:

```text
git show 869522e~1:apps/api/src/auth/auth.service.ts
  → prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } })
```

Consecuencia: una vez aplicada esa migración, **volver a una imagen anterior rompe todo
`register` y `login`** por violación de `NOT NULL`. Ese retroceso exige también restaurar el
dump previo. No es una hipótesis: se deduce del SQL de la migración y del código anterior.

### Lo que NO existe

- **No existe `prisma migrate down`** en este proyecto: cero ficheros `down.sql`, y Prisma
  no los genera aquí. Nunca se documente como mecanismo disponible.
- **No se afirma atomicidad** de `migrate deploy` por migración: no está acreditada en este
  repositorio y no debe suponerse.

### Ante un fallo de migración

```text
PARADA DURA
→ API y Web NO arrancan
→ inspeccionar el estado real del schema (`prisma migrate status`)
→ NUNCA reparación automática, `db push` ni reset
→ forward fix cuando sea seguro, o restore del dump previo + imagen compatible
```

Tras cualquier rollback: verificar `/ready` 200, login de un usuario sintético y logs
limpios.

## 17. Checklist pre-deploy

- [ ] Secrets reales solo en `/srv/jobit-staging/.env` (chmod 600); `git grep` limpio.
- [ ] DNS de ambos subdominios resolviendo al VPS.
- [ ] NPM sano, con 80/443 operativos.
- [ ] Directorio de backups creado y cron preparado; dump manual de prueba hecho.
- [ ] Imagen web construida con las TRES `NEXT_PUBLIC_*` como build-args (API, URL pública
      y modo de datos). Si falta el modo, staging no queda identificado como sintético.
- [ ] `JOBIT_IMAGE_TAG` fijado al SHA a desplegar; sin `latest` ni tags móviles.
- [ ] `JOBIT_DATA_MODE=SYNTHETIC_STAGING` en el `.env` real. Sin ella la API **no arranca**
      contra una base clasificada `STAGING`.
- [ ] `CORS_ORIGIN` exacto al origen público de la web.
- [ ] `DATABASE_URL` con hostname interno; ningún servicio con `ports:`.
- [ ] `docker compose --env-file … config` en verde (y sin `--env-file`, falla).
- [ ] Ensayo local (`run-local-rehearsal.sh`) en verde sobre el commit a desplegar.

## 18. Checklist post-deploy

- [ ] `GET /ready` de la API → 200 por HTTPS (y `/health` → 200).
- [ ] Landing web carga por HTTPS sin mixed content.
- [ ] Register + login con identidad sintética funcionan; un dominio ordinario se rechaza.
- [ ] Marcador global de entorno sintético visible en la web.
- [ ] Dashboard privado con datos.
- [ ] Jobs: listado y detalle.
- [ ] Saved jobs: guardar y quitar.
- [ ] Match básico visible.
- [ ] Cookie `refresh_token` con Secure/HttpOnly/SameSite=Lax (DevTools).
- [ ] Logs de los 3 servicios sin secretos ni errores recurrentes.
- [ ] Backup post-deploy creado y visible en `/srv/jobit-staging/backups`.

## 19. Decisiones pendientes

Cerradas en la Fase C:

| Decisión | Estado |
|---|---|
| Compose ↔ env real | **CERRADA**: interpolación `${VAR:?}` fail-closed en el compose canónico (§6) |
| NPM ↔ stack | **CERRADA**: red Docker compartida, cero puertos de host (§12) |
| Tags de imagen | **CERRADA**: `JOBIT_IMAGE_TAG` = SHA inmutable, sin `latest` (§9) |
| Seed inicial en staging | **CERRADA**: seed sintético de 14 ofertas marcadas bajo `JOBIT_DATA_MODE=SYNTHETIC_STAGING` |

Siguen abiertas:

1. **Build de imágenes**: in situ en el VPS (recomendado ahora) frente a registry (futuro).
2. **Retención final de backups**: confirmar 7 diarios + 4 semanales o ajustar.
3. **Almacenamiento de backups fuera del host** y cifrado cuando dejen de ser sintéticos.
4. **Momento del deploy real**: fecha, autorización expresa y quién lo ejecuta.
5. **Verificación runtime de `TRUST_PROXY_HOPS`** contra la topología NPM real.

## 20. Estado final esperado

Al completar este runbook en la fase 20.6: stack staging accesible en
`https://jobit-staging.davlos.es` (web) y `https://api-jobit-staging.davlos.es` (API),
con los checklists §17 y §18 completos, backups activos y rollback probado
documentalmente. Estado objetivo: `STAGING_DEPLOYED_AND_VALIDATED`.
