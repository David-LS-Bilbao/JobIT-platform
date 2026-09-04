# Dockerfile de @jobit/web (Sprint 20.1 — ADR-0012).
# Contexto de build: la RAÍZ del monorepo:
#   docker build -f apps/web/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_BASE_URL=https://api-jobit-staging.davlos.es \
#     --build-arg NEXT_PUBLIC_PUBLIC_BASE_URL=https://jobit-staging.davlos.es \
#     --build-arg NEXT_PUBLIC_JOBIT_DATA_MODE=SYNTHETIC_STAGING \
#     -t jobit-web .
# NEXT_PUBLIC_API_BASE_URL se INLINEA en el build de Next: cambiar de API
# implica reconstruir la imagen, no solo reiniciarla (documentado en la spec).
# Sin secretos: la variable es pública por diseño.

FROM node:20-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# --- Build: instala el workspace y compila Next en modo standalone ---
FROM base AS builder
WORKDIR /repo

# tsconfig.base.json: los tsconfig de los workspaces lo extienden.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# URL publica de la web (AUDIT03-URL-SCHEME-01). Tambien se inlinea en el build:
# sin ella, un entorno desplegado no ofrece enlace ni QR del portfolio publico,
# en lugar de emitir un enlace `http` derivado del origen del navegador.
ARG NEXT_PUBLIC_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_PUBLIC_BASE_URL=$NEXT_PUBLIC_PUBLIC_BASE_URL

# Modo de datos (Fase C). Activa el marcador global de entorno sintetico.
# TAMBIEN se inlinea: Next sustituye `process.env.NEXT_PUBLIC_*` durante el build,
# asi que pasarla al contenedor en runtime NO cambia el bundle y el marcador no
# aparecería. Tiene que viajar como build-arg o no viaja.
ARG NEXT_PUBLIC_JOBIT_DATA_MODE
ENV NEXT_PUBLIC_JOBIT_DATA_MODE=$NEXT_PUBLIC_JOBIT_DATA_MODE

COPY apps/web apps/web
RUN pnpm --filter @jobit/web build

# --- Runtime mínimo: solo el output standalone de Next ---
FROM node:20-slim AS runner
ENV NODE_ENV=production
ENV PORT=3000
# El server standalone escucha en HOSTNAME; en contenedor debe ser 0.0.0.0.
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# El standalone replica la estructura del monorepo: el server queda en
# /app/apps/web/server.js con su node_modules mínimo autocontenido.
COPY --from=builder --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=node:node /repo/apps/web/public ./apps/web/public

USER node
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
