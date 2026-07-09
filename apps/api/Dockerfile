# Dockerfile de @jobit/api (Sprint 20.1 — ADR-0012).
# Contexto de build: la RAÍZ del monorepo (necesario para el workspace pnpm):
#   docker build -f apps/api/Dockerfile -t jobit-api .
# La imagen NO ejecuta migraciones ni seed en el arranque: son pasos manuales
# del protocolo de deploy (spec deploy-staging-readiness, migraciones gated).
# Sin secretos: DATABASE_URL, JWT_ACCESS_SECRET, CORS_ORIGIN llegan por entorno.

FROM node:20-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# OpenSSL en base (builder Y runner): los engines de Prisma lo necesitan, y
# `prisma generate` debe detectar la MISMA versión de libssl que el runtime
# (si no, copia un engine para otra libssl y la API crashea al cargarlo).
RUN corepack enable \
    && apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# --- Build: instala el workspace, genera el cliente Prisma y compila a dist/ ---
FROM base AS builder
WORKDIR /repo

# Solo manifests primero para cachear la capa de instalación.
# tsconfig.base.json: los tsconfig de los workspaces lo extienden.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
# El lockfile cubre todo el workspace: pnpm exige también el manifest de web.
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

# Cliente Prisma antes de compilar (tsc necesita sus tipos).
COPY apps/api/prisma apps/api/prisma
RUN pnpm --filter @jobit/api exec prisma generate

COPY apps/api apps/api
RUN pnpm --filter @jobit/api build

# Aparta el cliente generado (vive en node_modules/.prisma del store real de
# pnpm, cuya ruta contiene un hash): se re-inyectará en el stage de producción.
RUN cp -r "$(cd apps/api && node -p "require('node:path').resolve(require.resolve('@prisma/client/package.json'), '../../..', '.prisma')")" /opt/prisma-client

# --- Dependencias de producción únicamente (sin typescript/vitest) ---
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --prod --filter @jobit/api

COPY apps/api/prisma apps/api/prisma
COPY --from=builder /repo/apps/api/dist apps/api/dist

# Re-inyecta el cliente Prisma generado en la ruta real del store del runner
# (mismo hash que en el builder: mismas versiones del lockfile). Sin esto,
# @prisma/client queda con el stub del postinstall y falla en runtime.
# (El proceso corre como `node` pero solo LEE node_modules: no se hace
# chown recursivo de /repo — duplicaría todas las capas de la imagen.)
COPY --from=builder /opt/prisma-client /opt/prisma-client
RUN TARGET="$(cd apps/api && node -p "require('node:path').resolve(require.resolve('@prisma/client/package.json'), '../../..', '.prisma')")" && \
    rm -rf "$TARGET" && cp -r /opt/prisma-client "$TARGET" && rm -rf /opt/prisma-client

# Único estado en disco de la API (avatares). En compose DEBE montarse como
# volumen persistente sobre /repo/apps/api/uploads (spec: uploads/backups).
RUN mkdir -p /repo/apps/api/uploads && chown node:node /repo/apps/api/uploads

USER node
WORKDIR /repo/apps/api
EXPOSE 4000

# Healthcheck de la app: GET /health (cablearlo en compose, fase 20.2).
CMD ["node", "dist/server.js"]
