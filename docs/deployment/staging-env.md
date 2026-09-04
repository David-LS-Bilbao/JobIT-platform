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

- Ambos subdominios cuelgan de `davlos.es` (mismo eTLD+1) → **same-site**: la cookie
  `refresh_token` actual (`SameSite=Lax`, `httpOnly`, `secure` en producción) funciona sin
  tocar código.
- **Si algún día se cambia a dominios cruzados** (raíces distintas), deja de ser same-site:
  exigiría `SameSite=None; Secure`, revisión de CSRF y un **ADR nuevo** antes de tocar nada
  (criterio de revisión del ADR-0012).

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
- [ ] `TRUST_PROXY_HOPS` vale `1` y coincide con el número REAL de proxies delante de la API.
      Un valor mayor que la topología real permite falsificar la IP del cliente vía
      `X-Forwarded-For` y evadir el rate limiting; uno menor agrupa a todos los clientes bajo
      la IP del proxy. Verificar contra la topología NPM real durante el despliegue.
- [ ] `DATABASE_URL` usa el hostname interno de Docker y las credenciales reales.
- [ ] Backups definidos y probados (DB + volumen de uploads) antes de la primera migración.
