# Entorno de staging — variables y secretos

Guía de configuración de entorno para el staging de JobIT (Sprint 20.3). Complementa la
spec [deploy-staging-readiness](../specs/features/deploy-staging-readiness.md), el
[ADR-0012](../decisions/ADR-0012-staging-deploy-architecture.md) y
`docker-compose.staging.yml`.

## Propósito de `.env.staging.example`

`.env.staging.example` (raíz del repo) es la **plantilla versionada** de todas las
variables que staging necesita, con placeholders. Sirve como contrato: qué variables
existen, para qué sirven y cómo generar sus valores. **Ningún valor de la plantilla es
real ni utilizable.**

## Dónde viven los valores reales

- En el VPS, **fuera del repo**: `/srv/jobit-staging/.env` (propuesta de la spec; el
  manual de deploy de la fase 20.5 fijará la ruta definitiva y sus permisos).
- Los secretos reales **nunca** van al repo, ni a imágenes Docker, ni a logs, ni a GitHub
  (mientras no exista CD autorizado por ADR propio).
- El `.gitignore` ignora `.env` y `.env.*` (solo las plantillas `*.example` se versionan).
  No copies la plantilla como `.env` dentro del árbol del proyecto.

## Generación de secretos (por entorno, nunca reutilizados)

```bash
# JWT_ACCESS_SECRET (nuevo para staging; jamás el de dev/test):
openssl rand -hex 48

# POSTGRES_PASSWORD (única para staging):
openssl rand -base64 32
```

Si se genera una contraseña de DB nueva, recuerda actualizarla **en los dos sitios**:
`POSTGRES_PASSWORD` y dentro de `DATABASE_URL`.

## Dominios, CORS y cookies (regla same-site)

| Variable | Valor staging | Nota |
|---|---|---|
| `CORS_ORIGIN` | `https://jobit-staging.davlos.es` | Origen público EXACTO de la web (esquema+host, sin barra final); un mismatch rompe el login |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api-jobit-staging.davlos.es` | Pública por diseño; se INLINEA en el build de Next |
| `NEXT_PUBLIC_PUBLIC_BASE_URL` | `https://jobit-staging.davlos.es` | URL pública ABSOLUTA de la web; **obligatoria y `https` en cualquier entorno desplegado**; se INLINEA en el build de Next |
| `TRUST_PROXY_HOPS` | `1` | Un único salto de Nginx Proxy Manager delante de la API. El default del código sigue siendo `0` (local/test/CI, sin proxy) |
| `JOBIT_DATA_MODE` | `SYNTHETIC_STAGING` | Contrato de datos sintéticos. **La API no arranca** si la base clasifica `STAGING` y esta variable falta o es inválida |
| `NEXT_PUBLIC_JOBIT_DATA_MODE` | `SYNTHETIC_STAGING` | Equivalente público; activa el marcador global de entorno. Se INLINEA en el build de Next |
| `JOBIT_IMAGE_TAG` | SHA del commit | Tag inmutable de las imágenes. Nunca `latest` ni un tag móvil |

- Ambos subdominios cuelgan de `davlos.es` (mismo eTLD+1) → **same-site**: la cookie
  `refresh_token` actual (`SameSite=Lax`, `httpOnly`, `secure` en producción) funciona sin
  tocar código.
- **Si algún día se cambia a dominios cruzados** (raíces distintas), deja de ser same-site:
  exigiría `SameSite=None; Secure`, revisión de CSRF y un **ADR nuevo** antes de tocar nada
  (criterio de revisión del ADR-0012).

## Modo de datos sintéticos (Fase C)

`JOBIT_DATA_MODE` es la **única** llave del contrato. No existe ninguna segunda variable
(`JOBIT_SEED_SYNTHETIC_STAGING`, `ALLOW_SEED`, `FORCE_SEED`): una segunda fuente de verdad
podría discrepar de la primera.

Qué gobierna, exactamente:

- **Arranque.** Una base clasificada `STAGING` sin `JOBIT_DATA_MODE=SYNTHETIC_STAGING`
  **aborta** el arranque de la API. La ausencia no degrada a modo normal.
- **Seed.** Es lo único que permite sembrar un destino `STAGING`, incluso con
  `NODE_ENV=production`. Un destino `PRODUCTION` sigue siendo inalcanzable bajo cualquier
  combinación.
- **Registro.** Solo se admiten direcciones del dominio reservado
  `synthetic.jobit.invalid` (RFC 2606: no resoluble). Un correo ordinario se rechaza con
  `400 SYNTHETIC_STAGING_EMAIL_REQUIRED`.
- **Interfaz.** `NEXT_PUBLIC_JOBIT_DATA_MODE` activa el marcador global. Al inlinearse en
  el build, **debe viajar como build-arg**: ponerla solo en el entorno del contenedor no
  cambia el bundle y el marcador no aparecería.

Alcance real de la protección, sin exagerarlo: bloquea el registro ordinario con un correo
real y deja el entorno y los datos visiblemente marcados. **No impide** que alguien
introduzca deliberadamente un nombre, una biografía o un avatar reales una vez registrado.

## Contrato del compose canónico

`docker-compose.staging.yml` usa interpolación fail-closed `${VAR:?...}` en todas las
variables obligatorias:

```bash
docker compose -f docker-compose.staging.yml config                       # FALLA sin env
docker compose --env-file /srv/jobit-staging/.env -f docker-compose.staging.yml config   # OK
```

Hasta la Fase C el compose llevaba valores literales `change_me`, de modo que el
`--env-file` era **inerte** y un despliegue habría arrancado con secretos de ejemplo.

Ningún servicio publica puertos al host —tampoco la API ni la Web—: NPM se une a la red
`jobit-staging` y los alcanza por hostname interno.

## Reglas de red y build

- `DATABASE_URL` apunta al **hostname interno de Docker** (`jobit-staging-db`), nunca a
  `localhost` en el VPS: la API y la DB conviven en la red interna `jobit-staging`.
- PostgreSQL **no publica puerto al host** en ningún entorno (decisión estructural,
  ADR-0012): la exposición accidental de la DB no es posible por configuración.
- `NEXT_PUBLIC_API_BASE_URL` se hornea en la imagen web durante `next build`: **cambiarla
  exige rebuild de la imagen** (`--build-arg`), no basta reiniciar el contenedor.
- `NEXT_PUBLIC_PUBLIC_BASE_URL` se hornea igual y con la misma consecuencia. Construye el
  enlace compartible y el QR del portfolio público (`AUDIT03-URL-SCHEME-01`). Si falta o no
  es `https`, la aplicación **no ofrece enlace ni QR** en lugar de degradarlo a `http`: es
  un fallo visible y deliberado, no un enlace silenciosamente inseguro.

## Checklist de revisión antes de un deploy real

- [ ] `git grep` no encuentra ningún secreto real en el repo (solo placeholders).
- [ ] El `.env` real existe solo en el VPS (`/srv/jobit-staging/.env`), fuera del repo.
- [ ] `POSTGRES_PASSWORD` fuerte y única (generada con `openssl rand -base64 32`).
- [ ] `JWT_ACCESS_SECRET` fuerte y nuevo (generado con `openssl rand -hex 48`).
- [ ] `CORS_ORIGIN` coincide EXACTAMENTE con el origen público de la web.
- [ ] `NEXT_PUBLIC_API_BASE_URL` apunta a la URL pública real de la API y la imagen web se
      reconstruyó con ese build-arg.
- [ ] `NEXT_PUBLIC_PUBLIC_BASE_URL` apunta a la URL pública real de la web, es `https` y la
      imagen web se reconstruyó con ese build-arg.
- [ ] `JOBIT_DATA_MODE=SYNTHETIC_STAGING` y `NEXT_PUBLIC_JOBIT_DATA_MODE=SYNTHETIC_STAGING`.
- [ ] La imagen web se construyó con las TRES `NEXT_PUBLIC_*` como build-args.
- [ ] `JOBIT_IMAGE_TAG` fijado al SHA a desplegar.
- [ ] `docker compose --env-file … config` en verde; sin `--env-file`, falla.
- [ ] `TRUST_PROXY_HOPS` vale `1` y coincide con el número REAL de proxies delante de la API.
      Un valor mayor que la topología real permite falsificar la IP del cliente vía
      `X-Forwarded-For` y evadir el rate limiting; uno menor agrupa a todos los clientes bajo
      la IP del proxy. Verificar contra la topología NPM real durante el despliegue.
- [ ] `DATABASE_URL` usa el hostname interno de Docker y las credenciales reales.
- [ ] Backups definidos y probados (DB + volumen de uploads) antes de la primera migración.
