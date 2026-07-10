# Informe final — Sprint 20 Deploy dev/staging readiness

## 1. Resumen ejecutivo

El Sprint 20 completó la **preparación del deploy staging** de JobIT (opción B aprobada):
spec + ADR, Dockerfiles de API y Web, compose de staging, plantillas de entorno seguras,
smoke funcional completo del stack dockerizado y runbook operativo para el VPS. **No se
desplegó nada en el VPS** — ni DNS, ni Nginx Proxy Manager, ni secretos reales fueron
tocados. El stack Docker local quedó **validado end-to-end** (3/3 healthy, migraciones
gated, seed, smoke API 12/12, E2E de navegador 7/7, persistencia real en PostgreSQL).
JobIT queda listo para decidir la fase 20.6 (deploy real) con un procedimiento escrito,
verificado y reversible.

**Sprint 20: PASS.**

## 2. Objetivo inicial

Preparar un deploy dev/staging **seguro, reproducible y reversible** sin ejecutarlo:
definir arquitectura, contenedores, base de datos, variables/secretos, migraciones,
backups y rollback, dejándolo todo verificado en local y documentado en un manual. Alcance
según la **opción B** del Plan Mode: documentación + Docker verificable en local + runbook,
sin tocar VPS.

## 3. Alcance aprobado

Opción B (ADR-0012), por fases: 20.0 spec/ADR → 20.1 Dockerfiles → 20.2 compose → 20.3 env
templates → 20.4 smoke funcional → 20.5 runbook VPS. Deploy real (20.6) explícitamente
fuera, como gate con autorización propia. Decisiones fijadas de entrada: subdominios
same-site bajo `davlos.es`, NPM existente como reverse proxy, Postgres interno sin puerto,
migraciones gated, seed ficticio, `output: "standalone"` autorizado para 20.1.

## 4. Trabajo realizado por fases

| Fase | PR | Contenido | Resultado |
|---|---|---|---|
| 20.0 | [#80](https://github.com/David-LS-Bilbao/JobIT-platform/pull/80) | Spec `deploy-staging-readiness` + ADR-0012 | Arquitectura y protocolo aprobados |
| 20.1 | [#81](https://github.com/David-LS-Bilbao/JobIT-platform/pull/81) | Dockerfiles API/Web + `.dockerignore` + Next standalone | Imágenes construyen y ejecutan (API `/health` 200, Web `/` 200) |
| 20.2 | [#82](https://github.com/David-LS-Bilbao/JobIT-platform/pull/82) | `docker-compose.staging.yml` | Stack 3/3 healthy; migraciones gated 8/8; seed; register 201 contra DB dockerizada |
| 20.3 | [#83](https://github.com/David-LS-Bilbao/JobIT-platform/pull/83) | `.env.staging.example` + guía + ajuste `.gitignore` | Plantillas seguras versionadas, `.env` reales siguen ignorados |
| 20.4 | [#84](https://github.com/David-LS-Bilbao/JobIT-platform/pull/84) | Smoke funcional completo + informe | API 12/12, E2E 7/7, persistencia verificada |
| 20.5 | [#85](https://github.com/David-LS-Bilbao/JobIT-platform/pull/85) | Runbook VPS (20 secciones) | Procedimiento completo revisable para 20.6 |

Incidencias resueltas durante el sprint (documentadas en sus PRs): `tsconfig.base.json`
ausente del contexto Docker; `pnpm deploy` inviable en pnpm 10 sin settings de workspace
(sustituido por install `--prod --filter` + re-inyección del cliente Prisma); mismatch de
engine OpenSSL entre generate y runtime (OpenSSL movido al stage base); `PORT` global que
habría desviado a `next start` (scoping por step, patrón heredado del Sprint 19B).

## 5. Archivos incorporados o modificados

- **Specs/ADR**: `docs/specs/features/deploy-staging-readiness.md`,
  `docs/decisions/ADR-0012-staging-deploy-architecture.md`.
- **Docker**: `apps/api/Dockerfile`, `apps/web/Dockerfile`, `.dockerignore`,
  `apps/web/next.config.ts` (única línea: `output: "standalone"`).
- **Compose**: `docker-compose.staging.yml`.
- **Env**: `.env.staging.example`, ajuste mínimo de `.gitignore` (+2: `!.env.*.example`).
- **Docs deployment**: `docs/deployment/staging-env.md`,
  `docs/deployment/staging-vps-deploy-runbook.md`.
- **Sprint reports**: `docs/sprints/sprint-20-4-docker-smoke-result.md` y este informe.

## 6. Validaciones ejecutadas

- Docker build API ✅ y Web ✅ (runtime verificado: `/health` 200, `/` 200).
- `docker compose config`/`build`/`up -d` ✅; **DB/API/Web healthy** (3/3).
- Migraciones gated con stage builder ✅ (8/8; idempotentes en re-ejecución).
- Seed ✅ (14 ofertas mock, idempotente).
- **Smoke API 12/12**: register 201 → login 200 (token recibido) → dashboard 200 → jobs →
  detalle 200 → guardar 201 → guardadas 200 → match 200 → matches 200 → quitar 204 →
  logout 204 → privado sin token 401.
- **Web E2E 7/7** (Playwright, navegador real contra el stack dockerizado, sin modificar
  ningún archivo gracias a `reuseExistingServer`).
- **Persistencia PostgreSQL verificada** por red interna (usuarios y ofertas escritos de
  verdad; el puerto de la DB nunca se publicó).
- **CI verde en las 6 PRs** del sprint (`JobIT CI`, required checks de la protección de
  `dev` del Sprint 19E).

## 7. Decisiones técnicas

- Base `node:20-slim` (no Alpine) con **OpenSSL en el stage base**: `prisma generate` y el
  runtime deben ver la misma libssl o el engine crashea al cargarse.
- Runner de la API con dependencias solo de producción y cliente Prisma re-inyectado por
  ruta resuelta (en pnpm 10, `pnpm deploy` exige settings de workspace fuera del alcance).
- **Next standalone** (`output: "standalone"`): runtime `node server.js` sin pnpm; validado
  que `next start` sigue funcionando (el workflow E2E manual no se rompe).
- **`NEXT_PUBLIC_API_BASE_URL` es build-time**: cambiarla exige rebuild de la imagen web.
- PostgreSQL **sin puerto publicado** (estructural); uploads (avatares) en **volumen
  persistente** incluido en backups.
- **Migraciones gated** con el stage `builder` del propio Dockerfile (nunca al arranque);
  seed ficticio idempotente.
- Runbook con **build in situ en VPS** recomendado (registry como evolución futura).
- **Sin CD ni GitHub Secrets** todavía (requeriría ADR propio).

## 8. Seguridad y secretos

- **Cero secretos reales en el repo**: solo placeholders `change_me` (grep de patrones de
  tokens ejecutado en cada fase y en cada PR).
- `.env.staging.example` como contrato versionado; los `.env` reales vivirán **fuera del
  repo** en el VPS (`/srv/jobit-staging/.env`, chmod 600).
- `.gitignore` sigue ignorando todos los `.env` reales (verificado en ambos sentidos).
- `CORS_ORIGIN` exacto por entorno; subdominios **same-site bajo `davlos.es`** → la cookie
  `refresh_token` (`Secure`/`HttpOnly`/`SameSite=Lax`) funciona sin tocar código.
- Postgres solo en red interna; los comandos documentados de migración usan `--env-file`
  para no imprimir jamás la `DATABASE_URL`; regla de logs sin tokens/cookies/secretos.

## 9. Resultado del smoke Docker

Detalle completo en
[sprint-20-4-docker-smoke-result.md](sprint-20-4-docker-smoke-result.md): el stack local
de staging soporta el **flujo candidato real de extremo a extremo** — no solo arranca.
Healthchecks verdes, migraciones idempotentes, seed, 12/12 pasos de API en los códigos
esperados (incluido el contrato de seguridad 401), 7/7 tests E2E de navegador y
persistencia confirmada dentro del PostgreSQL dockerizado. Limpieza sin `-v` (volúmenes
dummy conservados) y dev servers locales restaurados.

## 10. Estado del deploy real

**No ejecutado. Pendiente de autorización expresa** (gate 20.6 del ADR-0012). La fase 20.6
debe empezar resolviendo las decisiones previas documentadas en el runbook (§19):

1. Compose interpolado con `${VAR}` (recomendado) u override específico de VPS.
2. NPM conectado a la red Docker (ideal, sin puertos host) o puertos solo en `127.0.0.1`.
3. Build in situ en VPS (recomendado ahora) o registry.
4. Retención final de backups (propuesta: 7 diarios + 4 semanales).
5. Seed inicial en el staging real: sí/no.
6. Momento del deploy y quién lo ejecuta.

## 11. Riesgos pendientes

- El smoke local no reproduce NPM/TLS/dominios reales: la validación HTTPS/cookies con
  `Secure` efectivo solo puede hacerse en el VPS (primer paso del deploy real, con
  rollback preparado).
- El compose actual lleva dummies hardcodeados: **no es válido para VPS** hasta la
  microfase de interpolación (20.6A).
- Imagen API funcional pero pesada (~980 MB): optimización futura si molesta.
- Prueba de restauración de backups pendiente de programar tras el primer deploy.
- Warning cosmético `next start` + standalone: anotado por si Next lo endurece.

## 12. Decisiones antes de 20.6

Las 6 de la sección 10, con recomendación ya formulada en el runbook para las tres
primeras (interpolación `${VAR}`, NPM por red Docker, build in situ). Ninguna requiere
código nuevo: son elecciones de operación + una PR de compose.

## 13. Fuera de alcance respetado

- ✅ Sin deploy real, sin VPS/DNS/Nginx tocados.
- ✅ Sin secretos reales creados ni impresos; sin GitHub Secrets ni CD.
- ✅ Sin cambios funcionales (`apps/*/src/**` intacto todo el sprint; única config:
  `output: "standalone"`, autorizada).
- ✅ Sin cambios en `package.json`/`pnpm-lock.yaml`/Prisma/seed/workflows/branch protection.
- ✅ Sin ingesta real Jooble/Greenhouse.
- ✅ Merges siempre por UI de GitHub; commits sin Co-Authored-By.

## 14. Estado final del sprint

**Sprint 20: PASS.** Los seis entregables de la opción B completados, validados y
mergeados en `dev` con CI en verde (PRs #80–#85). El deploy real queda como decisión
explícita pendiente, con todo el camino preparado para que sea "ejecutar un manual", no un
experimento.

## 15. Recomendación para el orquestador

1. **Cerrar Sprint 20 como PASS** (este informe lo documenta).
2. **No saltar directamente al deploy real**: primero una microfase **20.6A** que adapte
   `docker-compose.staging.yml` a interpolación `${VAR}` con `--env-file`, re-valide el
   smoke local y deje el compose válido para VPS — es una PR pequeña y de riesgo bajo.
3. Después, **20.6B — deploy staging real controlado**: ejecutar el runbook en el VPS
   (DNS + NPM + `.env` real + build in situ + migración con backup + checklists §17/§18),
   con autorización expresa y ventana de rollback.

## 16. Prompt sugerido para continuar

Primer prompt propuesto: **"Sprint 20.6A — Compose VPS env interpolation"**, con este
alcance:

- Editar `docker-compose.staging.yml` para consumir variables con interpolación `${VAR}`
  (con defaults dummy seguros para el uso local, p. ej.
  `${POSTGRES_PASSWORD:-jobit_staging_password_change_me}`).
- Mantener el smoke local funcionando (compose sin `--env-file` debe seguir levantando el
  stack local con dummies).
- Validar `docker compose --env-file .env.staging.example -f docker-compose.staging.yml
  config` (la plantilla actúa como env de prueba, sin valores reales).
- Preservar la DB sin `ports:` y el resto de la topología intacta.
- Documentar en comentario del compose (o en el runbook si se autoriza) la decisión
  NPM ↔ red Docker.
- Sin tocar VPS/DNS/Nginx/secrets; sin deploy; PR propia hacia `dev` antes de cualquier
  paso de deploy real.
