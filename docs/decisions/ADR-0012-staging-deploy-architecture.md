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

## Criterios para revisar la decisión

- Si cambian los dominios y dejan de ser same-site → nuevo ADR (cookies/CSRF).
- Si se autoriza CD automático desde GitHub Actions → nuevo ADR (gestión de secrets).
- Si los uploads superan lo razonable para un volumen local → ADR de almacenamiento de
  objetos.
- Si aparece necesidad de multi-entorno adicional (producción real) → ADR propio de
  producción con endurecimiento específico.
- Si el VPS deja de usar Nginx Proxy Manager o cambia de proveedor → revisar componentes
  de proxy y backups.
