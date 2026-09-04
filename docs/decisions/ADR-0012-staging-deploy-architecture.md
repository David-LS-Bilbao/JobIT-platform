# ADR-0012: Arquitectura de deploy staging (readiness, sin deploy real)

## Estado

Propuesta — pendiente de revisión humana. No habilita el deploy real: solo define la
arquitectura y autoriza las fases de readiness del Sprint 20 (opción B).

Fecha: 2026-07-08. Sprint: 20.0. Relacionada con
[ADR-0002](ADR-0002-initial-stack.md) (stack inicial, que ya preveía Docker + VPS + Nginx),
[ADR-0006](ADR-0006-auth-strategy.md) (sesión en memoria y cookie `refresh_token`), la spec
[Deploy dev/staging readiness](../specs/features/deploy-staging-readiness.md) y el
[informe final del Sprint 19](../sprints/sprint-19-final-report.md).

## Contexto

JobIT tiene backend (`apps/api`), frontend (`apps/web`), PostgreSQL + Prisma, CI con
quality gates en cada PR, branch protection en `dev` y un workflow E2E manual validado en
verde. No existe ningún artefacto de deploy (ni Dockerfiles, ni compose, ni carpeta
`docker/`), y el despliegue dev/staging lleva planificado desde el Sprint 08 sin ejecutarse.

La auditoría del Plan Mode del Sprint 20 confirmó que el código está preparado para
contenedores (health endpoint, graceful shutdown, CORS y cookies parametrizados por
entorno) con dos particularidades que condicionan la arquitectura: los avatares se
almacenan en disco local (único estado del backend) y `NEXT_PUBLIC_API_BASE_URL` se inlinea
en el build de Next (la URL pública de la API debe conocerse al construir la imagen web).

El VPS disponible ya ejecuta Nginx Proxy Manager (NPM) como reverse proxy de otros
proyectos.

## Problema

¿Cómo dejar a JobIT listo para desplegar staging de forma segura, reproducible y reversible
— cookies y CORS funcionando con HTTPS real, base de datos no expuesta, migraciones sin
riesgo, backups y rollback definidos — sin desplegar todavía, sin tocar VPS/DNS/secrets y
sin introducir cambios funcionales?

## Decisión

Se adopta la siguiente arquitectura y protocolo de readiness, con decisiones explícitas:

1. **Alcance opción B.** El Sprint 20 entrega documentación + Dockerfiles +
   `docker-compose.staging.yml` + plantillas env + smoke Docker local + manual de deploy.
   **No hay deploy real en este sprint** (gate explícito en fase 20.6). *(Decisión
   explícita.)*
2. **Subdominios same-site.** Web en `jobit-staging.davlos.es` y API en
   `api-jobit-staging.davlos.es`, ambos bajo el mismo eTLD+1 (`davlos.es`), de modo que la
   cookie `refresh_token` actual (`SameSite=Lax`, `httpOnly`, `secure` en producción)
   funciona **sin tocar código**. *(Decisión explícita.)*
3. **Nginx Proxy Manager como reverse proxy.** Se reutiliza el NPM existente del VPS como
   único punto expuesto (80/443, TLS con Let's Encrypt). No se crea proxy nuevo ni se toca
   el actual en este sprint.
4. **PostgreSQL interno sin puerto host.** `postgres:16` en la red interna Docker
   `jobit-staging`, con volumen persistente y credenciales exclusivas; **sin `ports:` hacia
   el host** — la no-exposición de la DB es estructural, no configurable. *(Decisión
   explícita.)*
5. **Uploads con volumen persistente.** El directorio `uploads/` de la API (avatares) se
   monta en un volumen dedicado incluido en los backups.
6. **Migraciones gated con backup previo.** `prisma migrate deploy` como paso manual y
   explícito del protocolo de deploy, nunca automático en el arranque del contenedor, y
   siempre precedido de `pg_dump`. *(Decisión explícita.)*
7. **Seed ficticio inicial.** Staging se puebla con el seed versionado (ofertas mock,
   idempotente); la ingesta real Jooble/Greenhouse queda fuera y requeriría decisión
   propia (secret real implicado).
8. **Rollback por tags.** Imágenes taggeadas por SHA de commit; rollback = tag anterior +
   restauración del dump pre-migración si aplica.
9. **Secrets fuera del repo.** Solo plantillas con placeholders versionadas; los `.env`
   reales viven en el VPS (propuesta: bajo `/srv/jobit-staging/`), jamás en el repo,
   imágenes o logs. *(Decisión explícita.)*

## Alternativas consideradas

- **Solo documentación (opción A).** Menor esfuerzo, pero nada verificable: los errores de
  Docker/env se descubrirían durante el deploy real, el peor momento. Descartada en favor
  de B.
- **Deploy real en Sprint 20 (opción C).** Prematuro: exigiría DNS, secrets y cambios en el
  VPS sin haber validado el stack dockerizado en local. Descartada; queda como fase 20.6 /
  sprint futuro con autorización expresa.
- **Dominios cruzados (dominios raíz distintos) en lugar de same-site.** Obligaría a
  `SameSite=None; Secure`, más superficie CSRF y cambios de código en la API. Descartada:
  los subdominios de `davlos.es` mantienen el diseño actual intacto.
- **Postgres con puerto publicado al host.** Facilitaría inspección remota, pero convierte
  un descuido de firewall en una DB pública. Descartada: acceso solo por red interna (o
  túnel SSH puntual documentado en el manual).
- **Migraciones automáticas al boot del contenedor.** Cómodo pero peligroso: cada restart
  podría migrar sin backup ni supervisión, y un crash-loop podría reintentar migraciones a
  medias. Descartada en favor del paso manual gated.

## Consecuencias positivas

- El deploy real se convierte en "ejecutar un manual verificado", no en un experimento.
- Cookies/CORS/HTTPS quedan resueltos por diseño (same-site) sin tocar `apps/*/src/**`.
- La DB no puede quedar expuesta por accidente; los secretos no pueden filtrarse desde el
  repo porque nunca están en él.
- Todo el trabajo es verificable en local y compatible con los quality gates del Sprint 19
  (cada fase pasa por PR con CI en verde).

## Trade-offs

- Staging requiere disciplina manual (migraciones, backups, deploy por protocolo) en lugar
  de automatización CD — aceptado deliberadamente hasta que haya historial.
- La imagen web hornea `NEXT_PUBLIC_API_BASE_URL`: cambiar de dominio implica rebuild (no
  solo restart).
- Mantener paridad de versiones (postgres:16, Node 20) entre local, CI y staging añade un
  punto de mantenimiento — asumido por el valor de reproducibilidad.

## Riesgos

Los riesgos operativos y sus mitigaciones están tabulados en la spec (cookies, CORS, DB
expuesta, secrets, migraciones, avatares, build-arg incorrecto, VPS compartido, logs
sensibles, deriva a deploy prematuro). Riesgo residual principal: el smoke local no puede
reproducir al 100% el comportamiento de NPM/TLS del VPS; se mitiga dejando la validación
HTTPS real como primer paso del deploy real (20.6), con rollback preparado.

## Relación con Sprint 19 / CI / E2E

- Todas las PRs de las fases 20.x pasan por los required checks de `JobIT CI` (branch
  protection del Sprint 19E).
- El workflow `JobIT E2E (manual)` es el precedente directo del stack efímero: ya demostró
  en Actions que API + web (`next start`) + postgres:16 + seed levantan y pasan 7/7 tests;
  los Dockerfiles reutilizan esas mismas decisiones (build de producción, healthchecks,
  variables dummy scopeadas).
- El smoke 20.4 puede reutilizar el E2E de Playwright apuntando al stack dockerizado local.

## Reconciliación de la Fase C (2026-09-04)

`C — STAGING TECHNICAL READINESS` **implementa y precisa** este ADR; no lo sustituye ni lo
revoca. Ninguna decisión original cae: subdominios same-site, NPM como único punto expuesto,
DB sin puerto, uploads en volumen, migraciones gated con backup previo, tags por SHA y
secretos fuera del repo siguen vigentes.

Lo que la Fase C **cierra o precisa**:

| Punto | Estado tras la Fase C |
|---|---|
| **Topología NPM** | **CERRADA**: red Docker compartida `jobit-staging`. En la fase D, NPM se une con `docker network connect jobit-staging <contenedor-npm>`. La alternativa `127.0.0.1` queda como plan B de recuperación, no como contrato |
| **Puertos de host** | **AMPLIADA**: la decisión 4 solo obligaba a PostgreSQL. Ahora **ningún** servicio publica puertos —tampoco API ni Web—: es estructural en el compose canónico |
| **Compose ↔ env** | **CERRADA**: interpolación fail-closed `${VAR:?}`. El compose ya no contiene dummies, así que `--env-file` deja de ser inerte |
| **Tags de imagen** | **PRECISADA**: `JOBIT_IMAGE_TAG` obligatorio y sin default. Sin `latest` ni tags móviles; el compose canónico no declara `build:`, de modo que construir y ejecutar son actos separados |
| **Modo de datos sintéticos** | **NUEVO**: `JOBIT_DATA_MODE=SYNTHETIC_STAGING` como llave única. Una base clasificada `STAGING` no arranca sin ella; el seed la exige; el registro queda limitado al dominio reservado `synthetic.jobit.invalid` |
| **Seed ficticio (decisión 7)** | **PRECISADA**: sigue siendo el seed versionado, ahora con las 14 ofertas marcadas (`JobIT Synthetic ·` y `[SYNTHETIC TEST DATA]`) y bajo la excepción controlada de la guarda de destino |
| **Healthchecks** | **CORREGIDA**: la spec original usaba `GET /health` como gate de arranque. `/health` es liveness y responde 200 con PostgreSQL caído; el healthcheck de la API pasa a `/ready`, DB-aware |
| **Migraciones (decisión 6)** | **REFORZADA**: además del paso manual con backup previo, se añade `prisma migrate status` como gate antes y después, y API/Web no arrancan hasta que ese gate está limpio |
| **`trust proxy`** | **RESUELTA**: la nota técnica anticipaba un cambio de código futuro. Ya existe (`TRUST_PROXY_HOPS`, default 0, staging 1). Pendiente solo su validación runtime contra NPM |
| **Ensayo aislado** | **NUEVO**: `docker-compose.staging.rehearsal.yml` + `scripts/operations/staging/`, incapaz de tocar los recursos reales `jobit-staging-*` |

El riesgo residual que este ADR declaraba —«el smoke local no puede reproducir al 100% el
comportamiento de NPM/TLS del VPS»— **sigue vigente y no se levanta**. El ensayo local
acredita todo lo demás; NPM, TLS y el valor efectivo de `TRUST_PROXY_HOPS` pertenecen a la
validación runtime de la fase D.

```text
STAGING_DEPLOY:
NOT_AUTHORIZED_BY_THIS_ADR_UPDATE

PUBLIC_STAGING:
NOT_AUTHORIZED

REAL_CANDIDATE_DATA:
NOT_AUTHORIZED

PRODUCTION:
NOT_AUTHORIZED
```

Esta reconciliación documenta arquitectura acreditada en local. No autoriza desplegar.

## Criterios para revisar la decisión

- Si cambian los dominios y dejan de ser same-site → nuevo ADR (cookies/CSRF).
- Si se autoriza CD automático desde GitHub Actions → nuevo ADR (gestión de secrets).
- Si los uploads superan lo razonable para un volumen local → ADR de almacenamiento de
  objetos.
- Si aparece necesidad de multi-entorno adicional (producción real) → ADR propio de
  producción con endurecimiento específico.
- Si el VPS deja de usar Nginx Proxy Manager o cambia de proveedor → revisar componentes
  de proxy y backups.
