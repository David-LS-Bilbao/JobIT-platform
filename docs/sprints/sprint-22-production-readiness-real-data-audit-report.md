# Sprint 22 — Auditoría de production readiness y datos reales

## 1. Resumen ejecutivo

**Estado general: no preparado todavía para usuarios o datos reales.** JobIT presenta una base modular sólida, controles correctos de ownership y publicación, auth con buenas primitivas, tests amplios, CI de API/web y una composición de staging validada localmente. Sin embargo, existen tres riesgos P0: ausencia de un contrato legal y de privacidad operativo para candidatos, seed destructivo sin guarda de entorno que puede borrar ofertas y Saved Jobs por cascada, y setup de test capaz de recurrir a `DATABASE_URL` antes de truncar tablas.

Los bloqueos P1 se concentran en ciclo de cuenta y sesión, rate limiting, retención de avatar, separación de datos ficticios, ciclo de vida de ofertas externas, Saved Jobs, calidad/transparencia del match, autorización de proveedores, contrato de producción, restore y observabilidad.

- **Readiness de datos reales:** bloqueada hasta cerrar guardas P0, política de proveedores, ciclo de vida de ofertas, separación por entorno, retención y derechos del candidato.
- **Readiness de despliegue:** la evidencia acredita preparación y validación local de staging, pero no acredita un despliegue productivo real autorizado y operativo.
- **Readiness legal y operativa:** requiere revisión especializada. El repositorio no contiene avisos de privacidad/términos, base jurídica documentada, procedimientos de derechos, retención, respuesta a incidentes ni aprobación contractual de fuentes.

La auditoría registra **45 hallazgos**: 9 `READY`, 8 `READY_WITH_CONFIG` y 28 que requieren aislamiento, corrección, revisión o investigación. Hay 3 P0 y 22 P1; los **25 hallazgos P0/P1** deben resolverse antes de incorporar usuarios o datos reales, conforme a la definición aprobada de esas prioridades.

## 2. Alcance y metodología

Se revisaron documentación, arquitectura, código de API/web, Prisma, tests, fixtures, E2E, workflows y Docker mediante inspección de solo lectura. Las hipótesis iniciales se comprobaron en contexto, incluyendo mitigaciones y entorno afectado. No se abrieron `.env` reales, credenciales, contenido de uploads ni datos personales.

Las integraciones externas se contrastaron, cuando fue posible, con documentación oficial vigente:

- [Jooble REST API](https://help.jooble.org/en/support/solutions/articles/60001448238-rest-api-documentation)
- [Greenhouse Job Board API](https://developers.greenhouse.io/job-board.html)
- [Adzuna API Terms of Service](https://developer.adzuna.com/docs/terms_of_service)
- [InfoJobs API Terms of Use](https://developer.infojobs.net/legal/legal/terms-of-use.xhtml)
- [AEPD: derecho de información](https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion)
- [AEPD: ejercicio de derechos](https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos)
- [AEPD: seguridad de los tratamientos](https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/medidas-de-cumplimiento/seguridad-de-los-tratamientos)

Estas fuentes sustentan la necesidad de revisión, no una conclusión jurídica ni una autorización de uso.

## 3. Estado comprobado del producto

JobIT es un producto modular **candidate-first** gestionado con criterios de producción. El repositorio contiene auth, perfil, CV estructurado, portfolio público opt-in, avatar, catálogo de jobs, Saved Jobs, match explicable, adaptadores manuales para Jooble/Greenhouse, tests y contenedores.

La evidencia histórica afirma validación local completa del stack de staging, API y E2E (`docs/sprints/sprint-20-final-report.md:5-12`). La misma evidencia confirma que no se ejecutó despliegue real en VPS y que la composición conserva valores dummy y decisiones pendientes (`docs/sprints/sprint-20-final-report.md:115-135`).

Por tanto:

- existe funcionalidad real en el repositorio;
- existe staging preparado y validado localmente;
- no existe evidencia suficiente de staging remoto persistente;
- no se acredita todavía un despliegue productivo real autorizado y operativo.

## 4. Respuestas a las diez preguntas del sprint

### 4.1 ¿Qué está preparado para producción?

Están técnicamente bien encaminados: separación modular, hashing de contraseñas y refresh tokens, access JWT corto, errores genéricos de auth, ownership por usuario, portfolio opt-in con DTO público limitado, validación binaria de avatar, Saved Jobs idempotentes, filtrado de ofertas cerradas/expiradas, match determinista y explicable, CI API/web, contenedores no root, healthchecks y migración manual separada del arranque.

Son capacidades `READY` o `READY_WITH_CONFIG`; no constituyen por sí solas autorización para desplegar o tratar datos reales.

### 4.2 ¿Qué necesita configuración o hardening?

HTTPS/origen exacto y secretos reales, refresh operativo, rate limiting, verificación/recuperación de cuenta, política de cookies, almacenamiento persistente de uploads, expiración/cierre de ofertas, scheduler, atribución de proveedores, separación estricta de bases, configuración productiva, backup/restore, observabilidad, alertas e incident response.

### 4.3 ¿Dónde existen mocks, seeds, fixtures o placeholders?

- Fixtures de proveedores: `apps/api/src/jobs/external/__fixtures__/`.
- Mocks de tests API/web: archivos `*.test.ts(x)` y mocks locales.
- Usuarios sintéticos E2E: `apps/web/e2e/helpers/api.ts:16-22`.
- Seed de ofertas `INTERNAL` ficticias: `apps/api/prisma/seed.ts:9-15`.
- Placeholders de staging: `docker-compose.staging.yml:1-9`.
- Copia visible de oferta interna como ejemplo histórico: `apps/web/src/app/jobs/[id]/job-detail-client.tsx:226-240`.

### 4.4 ¿Qué mocks deben mantenerse?

Fixtures deterministas de Jooble/Greenhouse, mocks unitarios, datos E2E sintéticos y efímeros y un dataset de development explícitamente aislado. Protegen tests sin depender de proveedores ni datos personales.

### 4.5 ¿Qué datos ficticios no deben aparecer en producción?

Ofertas `INTERNAL` del seed, dominios `@jobit.local`, credenciales dummy, secretos `change-me`, URLs localhost, mensajes que presentan una oferta como ejemplo histórico del producto y cualquier upload local no gobernado.

### 4.6 ¿Qué fuentes reales deben sustituir a seeds?

Solo fuentes aprobadas técnica y contractualmente. Jooble y Greenhouse tienen adaptadores manuales; Adzuna solo aparece en el enum y InfoJobs no está implementado. Antes de activar cualquiera se requieren autorización, atribución, trazabilidad, expiración, cierre, retención y reglas de republicación. Las ofertas internas reales pueden coexistir con proveedores si se separan del seed de development.

### 4.7 ¿Qué requisitos legales, técnicos y operativos faltan?

Información al interesado, base jurídica, finalidades, retención, ejercicio de derechos, exportación/borrado, transparencia del match, acuerdos/condiciones de proveedores, proceso de incidentes, soporte, operación de backups y restore, observabilidad, runbook de rollback y evidencia de un entorno remoto autorizado.

### 4.8 ¿Qué riesgos existen?

Truncado de una base incorrecta en tests, borrado de jobs/Saved Jobs por seed, publicación o tratamiento sin marco informativo, fuentes sin autorización suficiente, ofertas obsoletas, puntuaciones degradadas por datos incompletos, uploads sin borrado, sesión incompleta, falta de rate limiting, configuración dummy y recuperación no ensayada.

### 4.9 ¿Qué debe separarse por entorno?

Bases y credenciales, seeds, usuarios E2E, uploads, URLs/orígenes, cookies, claves JWT, logging, jobs internos, ejecución de ingestas, proveedores habilitados, cron/scheduler, backups y configuración Docker. Production no debe heredar fallbacks de development/test/staging.

### 4.10 ¿Qué roadmap debe seguirse?

Primero seguridad destructiva y gobierno legal; después auth/ciclo de cuenta y contrato productivo; a continuación proveedores y ciclo de vida de datos; finalmente calidad del match, hardening operativo y actualización documental. El detalle está en la sección 18.

## 5. Mapa de arquitectura modular

| Módulo | API/dominio | Web/superficie | Dependencias críticas |
| --- | --- | --- | --- |
| Auth | `apps/api/src/auth/**` | `apps/web/src/features/auth/**` | JWT, refresh hash, cookie, CORS |
| Perfil/CV | `apps/api/src/profile/**` | `apps/web/src/app/profile/**` | ownership, Prisma |
| Portfolio | `apps/api/src/profile/public-portfolio.service.ts` | `apps/web/src/app/u/[slug]/**` | publicación opt-in, whitelist |
| Avatar | `apps/api/src/profile/avatar-storage.ts` | formulario de perfil | filesystem persistente |
| Jobs | `apps/api/src/jobs/**` | `apps/web/src/app/jobs/**` | fuentes, expiración, DTO |
| Saved Jobs | `apps/api/src/jobs/saved-jobs.service.ts` | catálogo/detalle | usuario y job |
| Match | `apps/api/src/match/**` | explicación en jobs | perfil y calidad del job |
| Infra | Docker/workflows/Prisma | runtime web | secretos, DB, health, backups |

La modularidad es favorable. El principal drift contractual localizado es `ADZUNA`: existe en Prisma, pero no en schemas/labels compartidos (`apps/api/prisma/schema.prisma:180-185`, `apps/api/src/jobs/jobs.schemas.ts:1-6`, `apps/web/src/lib/api.ts:60-63`).

## 6. Auth, sesión y seguridad

El registro normaliza email, evita enumeración explícita, hashea contraseña y refresh token y guarda expiración (`apps/api/src/auth/auth.service.ts:38-64`). Login usa error genérico y verifica hash (`apps/api/src/auth/auth.service.ts:68-95`). La cookie es `HttpOnly`, `SameSite=Lax` y `Secure` en production (`apps/api/src/auth/auth.router.ts:13-19`); el access token expira en 15 minutos (`apps/api/src/auth/jwt.util.ts:3-18`).

Helmet, CORS con origen configurado y errores internos ocultos en production son fortalezas (`apps/api/src/app.ts:22-45`, `apps/api/src/middleware/error-handler.middleware.ts:3-17`). El token de acceso permanece en memoria del navegador, pero no existe ruta de refresh localizada; una recarga pierde la sesión efectiva (`apps/web/src/features/auth/auth-context.tsx:3-14`, `apps/web/src/lib/auth-api.ts:8-22`).

No se localizó rate limiting operativo de auth; la spec histórica lo difiere (`docs/specs/features/auth.md:136-136`). Tampoco se localizaron recuperación de contraseña, verificación de email, exportación ni eliminación de cuenta.

## 7. Perfil, JobIT CV, portfolio y avatar

Las escrituras del perfil comprueban ownership (`apps/api/src/profile/profile.ownership.ts:16-118`). El portfolio requiere publicación explícita, slug único y permite despublicar (`apps/api/src/profile/portfolio.service.ts:32-117`). El DTO público excluye email, identificadores internos, tokens y salario, y respeta flags de visibilidad (`apps/api/src/profile/public-portfolio.service.ts:13-17`, `apps/api/src/profile/public-portfolio.service.ts:65-132`). La página pública añade `noindex,nofollow` (`apps/web/src/app/u/[slug]/page.tsx:5-9`).

El avatar limita MIME/tamaño, comprueba magic bytes, genera nombre aleatorio y protege la ruta (`apps/api/src/profile/avatar-storage.ts:8-79`). No se localizó borrado del avatar anterior al reemplazarlo ni ciclo de borrado de cuenta. Una comprobación controlada encontró un artefacto ignorado bajo uploads; no se abrió ni se inspeccionó su contenido.

## 8. Jobs y fuentes de datos

El listado excluye `CLOSED` y expirados cuando esos campos están poblados (`apps/api/src/jobs/jobs.service.ts:24-49`). Los enlaces externos se limitan a HTTP(S) y usan `noopener` (`apps/web/src/app/jobs/[id]/jobs-format.ts:86-104`, `apps/web/src/app/jobs/[id]/job-detail-client.tsx:226-240`).

Jooble y Greenhouse disponen de ingesta manual, normalización, upsert por fuente e `externalId`, y no exponen una ruta pública de ingesta (`apps/api/src/jobs/external/jooble/jooble.ingest.service.ts:13-20`, `apps/api/src/jobs/external/greenhouse/greenhouse.ingest.service.ts:11-19`). Ninguna implementa expiración/cierre o scheduler; ambas producen registros activos sin `expiresAt` cuando la fuente no lo aporta.

Adzuna está solo en el enum. InfoJobs no está implementado. La disponibilidad técnica o una API key no equivale a derechos de almacenamiento/republicación:

- Jooble exige clave y términos aplicables; falta revisión contractual concreta.
- Greenhouse documenta lectura pública de Job Board GET, pero eso no acredita por sí solo agregación de boards de terceros.
- Adzuna exige atribución y contempla licencia/consentimiento para determinados usos continuados o comerciales.
- InfoJobs limita caching/uso y contempla acuerdos de partner para determinados casos.

## 9. Saved Jobs

Saved Jobs tiene unicidad `userId + jobId`, creación idempotente y borrado con ownership (`apps/api/src/jobs/saved-jobs.service.ts:44-94`). El listado conserva referencias aunque el job esté cerrado o expirado, lo que favorece la memoria del candidato (`apps/api/src/jobs/saved-jobs.service.ts:28-41`).

La relación Prisma usa `onDelete: Cascade` (`apps/api/prisma/schema.prisma:231-238`). Por ello, el `job.deleteMany()` del seed elimina también Saved Jobs asociados. Debe diseñarse una política de archivo/tombstone antes de limpieza, reingesta o sustitución de fuentes.

## 10. Match explicable

El match es determinista, sin red, persistencia ni IA externa (`apps/api/src/match/match.scoring.ts:1-8`, `apps/api/src/match/match.service.ts:15-15`). Devuelve score y explicación y detecta perfiles incompletos (`apps/api/src/match/match.scoring.ts:189-225`).

La normalización se limita a minúsculas y espacios (`apps/api/src/match/match.scoring.ts:52-72`). Skills aportan el 50 % y algunos adaptadores generan arrays vacíos, por lo que la calidad del proveedor puede reducir artificialmente el resultado. Antes de usuarios reales deben definirse calidad mínima, comunicación de límites, no uso para rechazo automatizado y revisión especializada sobre profiling/transparencia.

## 11. Inventario de mocks, fixtures, seeds y datos

| Activo | Localización/evidencia | Entorno | Clasificación | Decisión |
| --- | --- | --- | --- | --- |
| Fixtures Jooble/Greenhouse | `apps/api/src/jobs/external/__fixtures__/`; imports en tests de clientes/normalizador | test | `TEST_ONLY` | Mantener |
| Mocks unitarios web/API | 41 tests API y 27 tests web localizados | test | `TEST_ONLY` | Mantener |
| Usuarios E2E sintéticos | `apps/web/e2e/helpers/api.ts:16-22` | E2E efímero | `TEST_ONLY` | Mantener aislados |
| Ofertas `INTERNAL` ficticias | `apps/api/prisma/seed.ts:9-15` | development/E2E | `DEVELOPMENT_ONLY` | Aislar y guardar |
| Borrado del seed | `apps/api/prisma/seed.ts:232-240` | cualquier DB alcanzable | `SECURITY_REVIEW_REQUIRED` | Reemplazar por seed seguro |
| Placeholders Docker | `docker-compose.staging.yml:1-9` | staging local | `STAGING_ONLY` | Sustituir mediante contrato de entorno |
| Upload local ignorado | comprobación controlada; contenido no abierto | desconocido/local | `UNKNOWN` | Investigar gobernanza, no contenido |
| Datos de proveedores | adaptadores Jooble/Greenhouse | development/staging manual | `READY_WITH_CONFIG` | Activar solo tras aprobación |

## 12. Matriz de entornos

| Capacidad | Development | Test/E2E | Staging | Production |
| --- | --- | --- | --- | --- |
| Base de datos | template documentado | DB dedicada prevista; guarda insuficiente | Postgres Docker local | contrato no acreditado |
| Datos ficticios | seed permitido con riesgo | seed E2E efímero | seed opcional documentado | prohibir |
| Proveedores | ejecución manual | fixtures/mocks | manual y condicionado | no autorizado |
| Uploads | filesystem local | temporal | volumen Docker | almacenamiento/retención pendientes |
| Auth/cookies | HTTP/local | sintético | requiere HTTPS/origen | requiere secretos y dominio reales |
| Migraciones | manual | CI ejecuta migrate deploy | servicio manual | runbook/backup pendiente |
| Backups | no exigidos | no aplica | documentados, no ensayados | no acreditados |
| Observabilidad | consola | artifacts CI/E2E | logs Docker rotados | centralización/alertas pendientes |

## 13. CI, E2E y calidad

`JobIT CI` ejecuta API y web en PR a `dev/main`, push a `dev` y manual: migraciones, typecheck, tests y build para API; lint, typecheck, tests y build para web (`.github/workflows/ci.yml:1-12`, `.github/workflows/ci.yml:19-103`).

E2E crea una base efímera, migra, seed, levanta API/web y conserva artifacts, pero es manual (`.github/workflows/e2e.yml:1-11`, `.github/workflows/e2e.yml:17-71`, `.github/workflows/e2e.yml:120-146`). La protección remota de rama y el estado actual de checks requeridos no se revalidaron porque el sprint prohíbe operaciones Git externas; solo existe evidencia histórica (`docs/sprints/sprint-19-final-report.md:187-204`).

El riesgo crítico está en `apps/api/src/tests/setup.ts:14-26`: acepta `DATABASE_URL_TEST ?? DATABASE_URL` y después trunca tablas. CI mitiga al suministrar una DB de test, pero localmente falta un kill-switch verificable contra bases no dedicadas.

## 14. Docker, staging e infraestructura

Los Dockerfiles producen runners no root y separan build/runtime (`apps/api/Dockerfile:40-71`, `apps/web/Dockerfile:30-47`). La DB no publica puerto, los servicios tienen healthchecks y logs rotados, y migración/seed son servicios manuales (`docker-compose.staging.yml:11-24`, `docker-compose.staging.yml:29-126`).

La composición declara que solo valida staging local, usa dummies y URLs localhost, y no es directamente válida para VPS (`docker-compose.staging.yml:1-9`). El informe de Sprint 20 confirma que no hubo despliegue remoto, restore real ni contrato final de entorno (`docs/sprints/sprint-20-final-report.md:115-135`). No se localizaron compose o templates específicos de production. Backups, restore, rollback y observabilidad son documentación preparatoria, no capacidades operativas acreditadas.

## 15. Privacidad, legal y operación

No se localizaron documentos o superficies de privacidad, términos, derechos, retención, soporte o incidentes. La AEPD exige informar, entre otros elementos, identidad del responsable, finalidades, base jurídica, destinatarios, conservación, derechos y lógica relevante de decisiones automatizadas; también exige medios para ejercer derechos y medidas de seguridad adecuadas al riesgo. La aplicabilidad exacta debe validarla una revisión especializada.

Antes de usuarios reales deben definirse:

- responsable, contacto y registro de tratamientos;
- finalidades y bases jurídicas por dato;
- minimización, retención y borrado;
- acceso, rectificación, oposición, supresión, limitación y portabilidad;
- transparencia y límites del match;
- inventario de cookies/almacenamiento;
- acuerdos, términos y atribución de proveedores;
- proceso de incidentes, soporte y reclamaciones;
- encargados, transferencias y subprocesadores cuando existan.

## 16. Matriz principal de hallazgos

| ID | Módulo | Descripción | Archivo o zona | Evidencia | Entorno | Tipo de dato | Estado | Prioridad | Riesgo | Acción | Tipo de futuro sprint | Sprint recomendado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DOC-01 | Documentación | README y scope vivo aún describen el estado actual con terminología histórica. | README/spec MVP | `README.md:5-5`, `README.md:58-60`, `docs/specs/00-mvp-scope.md:43-47` | todos | documentación | PRODUCTION_GAP | P2 | Confusión estratégica y operativa. | reemplazar | documentación | Documentación viva y terminología |
| ARCH-01 | Arquitectura | Separación modular candidate-first clara. | API/web por dominios | `apps/api/src/app.ts:47-59` | todos | código | READY | P3 | Bajo; mantener límites. | mantener | documentación | Mantenimiento continuo |
| ARCH-02 | Arquitectura | Contrato de fuentes duplicado entre Prisma, API y web. | JobSource | `apps/api/prisma/schema.prisma:180-185`, `apps/api/src/jobs/jobs.schemas.ts:1-6`, `apps/web/src/lib/api.ts:60-63` | todos | metadato | PRODUCTION_GAP | P2 | Drift y respuestas rechazadas. | reemplazar | backend | Contratos compartidos |
| AUTH-01 | Auth | Password y refresh hash, errores genéricos y access corto. | auth | `apps/api/src/auth/auth.service.ts:38-95`, `apps/api/src/auth/jwt.util.ts:3-18` | todos | credencial | READY | P3 | Bajo si secretos son robustos. | mantener | security | Auth hardening |
| AUTH-02 | Seguridad API | Bearer auth, Helmet y ocultación de errores internos. | middleware/app | `apps/api/src/auth/require-auth.middleware.ts:7-25`, `apps/api/src/app.ts:22-32`, `apps/api/src/middleware/error-handler.middleware.ts:3-17` | todos | sesión | READY | P3 | Bajo; revisar en despliegue. | mantener | security | Auth hardening |
| AUTH-03 | Sesión | No se localiza endpoint refresh; token web solo en memoria. | auth API/web | `apps/web/src/features/auth/auth-context.tsx:3-14`, `apps/web/src/lib/auth-api.ts:8-22` | todos | sesión | PRODUCTION_GAP | P1 | Sesión se pierde y refresh queda inoperante. | configurar | backend | Auth y ciclo de cuenta |
| AUTH-04 | Cookies/CORS | Flags correctos dependen de HTTPS, origen y secretos reales. | router/app | `apps/api/src/auth/auth.router.ts:13-19`, `apps/api/src/app.ts:22-32` | staging/production | sesión | READY_WITH_CONFIG | P1 | Exposición o fallo de login por mala configuración. | configurar | security | Auth y ciclo de cuenta |
| AUTH-05 | Auth | Rate limiting diferido y no localizado en runtime. | auth/spec | `docs/specs/features/auth.md:136-136` | público | credencial | SECURITY_REVIEW_REQUIRED | P1 | Fuerza bruta y abuso. | configurar | security | Auth y ciclo de cuenta |
| AUTH-06 | Cuenta | Sin recuperación, verificación, exportación o eliminación localizadas. | auth/profile | búsqueda controlada sin coincidencias | público | dato personal | PRODUCTION_GAP | P1 | Cuenta irrecuperable y derechos no operables. | reemplazar | backend | Auth y ciclo de cuenta |
| PRIV-01 | Privacidad | El registro recoge email y contraseña sin superficie localizada de información, derechos, retención o términos. | registro/documentación | `apps/web/src/features/auth/register-form.tsx:34-132`; búsqueda controlada; [AEPD](https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion) | público | dato personal | LEGAL_REVIEW_REQUIRED | P0 | Readiness legal no acreditada; no incorporar candidatos reales hasta revisión especializada y controles aprobados. | investigar | legal/operational | Gobierno legal de candidatos |
| PRIV-02 | Operación | Sin proceso localizado de soporte, reclamación o incidentes. | docs/runtime | búsqueda controlada sin coincidencias | production | dato personal | PRODUCTION_GAP | P1 | Incidentes y derechos sin canal operativo. | documentar | legal/operational | Gobierno legal de candidatos |
| PORT-01 | Portfolio | Publicación opt-in, whitelist y noindex. | portfolio | `apps/api/src/profile/portfolio.service.ts:70-117`, `apps/api/src/profile/public-portfolio.service.ts:13-17`, `apps/web/src/app/u/[slug]/page.tsx:5-9` | público | perfil | READY | P3 | Exposición controlada. | mantener | frontend | Portfolio hardening |
| PORT-02 | Portfolio | Tras publicar, ubicación y disponibilidad son visibles por defecto. | Prisma/DTO | `apps/api/prisma/schema.prisma:87-102`, `apps/api/src/profile/public-portfolio.service.ts:65-116` | público | dato personal | LEGAL_REVIEW_REQUIRED | P2 | Expectativa de visibilidad insuficientemente explicada. | investigar | legal/operational | Gobierno legal de candidatos |
| AVATAR-01 | Avatar | Tamaño, MIME, magic bytes, nombre y ruta protegidos. | avatar storage | `apps/api/src/profile/avatar-storage.ts:8-79` | todos | archivo personal | READY | P3 | Bajo para formatos permitidos. | mantener | security | Upload hardening |
| AVATAR-02 | Avatar | No se localiza borrado al reemplazar ni al cerrar cuenta. | profile/uploads | `apps/api/src/profile/profile.router.ts:188-246`; búsqueda sin `unlink` runtime | todos | archivo personal | PRODUCTION_GAP | P1 | Retención indefinida y acumulación. | reemplazar | backend | Datos personales y uploads |
| DATA-01 | Tests | Fixtures y mocks de proveedores se importan solo en tests. | fixtures/tests | `apps/api/src/jobs/external/__fixtures__/`, `apps/api/src/jobs/external/jooble/jooble.client.test.ts:24-24` | test | ficticio | TEST_ONLY | P3 | Bajo si no se empaquetan como datos. | mantener | data | Test data governance |
| DATA-02 | E2E | Usuarios sintéticos y stack efímero separados. | E2E/workflow | `apps/web/e2e/helpers/api.ts:16-22`, `.github/workflows/e2e.yml:17-71` | test | ficticio | TEST_ONLY | P3 | Bajo con DB dedicada. | mantener | data | Test data governance |
| DATA-03 | Seed | Ofertas ficticias `INTERNAL` útiles pero sin guarda de entorno. | seed | `apps/api/prisma/seed.ts:9-15`, `apps/api/prisma/seed.ts:232-240` | development/E2E | ficticio | DEVELOPMENT_ONLY | P1 | Fuga de demo a staging/production. | aislar | data | Safety gate de datos |
| DATA-04 | Seed | `job.deleteMany()` puede borrar Saved Jobs por cascada. | seed/schema | `apps/api/prisma/seed.ts:232-240`, `apps/api/prisma/schema.prisma:231-238` | cualquier DB alcanzable | jobs/usuario | SECURITY_REVIEW_REQUIRED | P0 | Pérdida masiva de datos. | reemplazar | data | Safety gate de datos |
| TEST-01 | Tests DB | Setup recurre a `DATABASE_URL` y trunca tablas sin kill-switch fuerte. | test setup | `apps/api/src/tests/setup.ts:14-26`, `apps/api/vitest.config.ts:6-12` | test/local | base de datos | SECURITY_REVIEW_REQUIRED | P0 | Truncado de una DB no dedicada. | reemplazar | security | Safety gate de datos |
| JOBS-01 | Jobs | Catálogo excluye cerradas y expiradas si el dato existe. | jobs service | `apps/api/src/jobs/jobs.service.ts:24-49` | todos | oferta | READY | P3 | Bajo; depende de actualización. | mantener | backend | Ciclo de vida de jobs |
| JOBS-02 | Jobs UI | Fuente y enlace seguro están expuestos; falta contrato de atribución por proveedor. | serializer/web | `apps/api/src/jobs/jobs.serializer.ts:4-28`, `apps/web/src/app/jobs/[id]/jobs-format.ts:86-104` | público | procedencia | READY_WITH_CONFIG | P2 | Atribución incompleta. | configurar | frontend | Proveedores y atribución |
| JOBS-03 | Jobs internos | Copia pública presenta una oferta como ejemplo histórico del producto. | detalle job | `apps/web/src/app/jobs/[id]/job-detail-client.tsx:226-240` | público | ficticio | MOCK_LEAK | P1 | Datos/copias de demo visibles. | reemplazar | frontend | Proveedores y atribución |
| JOBS-04 | Jooble | Adaptador manual, normalización y upsert están implementados. | jooble ingest | `apps/api/src/jobs/external/jooble/jooble.ingest.service.ts:13-143` | development/staging | oferta externa | READY_WITH_CONFIG | P1 | Activación sin config/ciclo de vida. | configurar | data | Fuentes reales y ciclo de vida |
| JOBS-05 | Jooble | Clave técnica no acredita derechos concretos de uso/retención. | proveedor | `apps/api/src/jobs/scripts/ingest-jooble.ts:1-20`; [API oficial](https://jooble.org/api/about) | production | oferta externa | LEGAL_REVIEW_REQUIRED | P1 | Riesgo de uso fuera de términos aplicables no verificados. | investigar | legal/operational | Aprobación de proveedores |
| JOBS-06 | Greenhouse | Adaptador manual y tolerancia a fallo parcial implementados. | greenhouse ingest | `apps/api/src/jobs/external/greenhouse/greenhouse.ingest.service.ts:11-162` | development/staging | oferta externa | READY_WITH_CONFIG | P1 | Calidad y boards requieren control. | configurar | data | Fuentes reales y ciclo de vida |
| JOBS-07 | Greenhouse | GET público no acredita agregación/republicación de boards ajenos. | boards/proveedor | `apps/api/src/jobs/external/greenhouse/greenhouse.companies.ts:1-23`; [API oficial](https://developers.greenhouse.io/job-board.html) | production | oferta externa | LEGAL_REVIEW_REQUIRED | P1 | Falta autorización/atribución verificable. | investigar | legal/operational | Aprobación de proveedores |
| JOBS-08 | Adzuna | Enum Prisma sin schema, label, cliente ni ingesta. | JobSource | `apps/api/prisma/schema.prisma:180-185`, `apps/api/src/jobs/jobs.schemas.ts:1-6` | todos | procedencia | PRODUCTION_GAP | P2 | Contrato inconsistente. | reemplazar | data | Contratos compartidos |
| JOBS-09 | Adzuna | Términos oficiales requieren revisar atribución y licencia/consentimiento. | proveedor | [Términos oficiales](https://developer.adzuna.com/docs/terms_of_service) | production | oferta externa | LEGAL_REVIEW_REQUIRED | P1 | Activación sin autorización acreditada. | investigar | legal/operational | Aprobación de proveedores |
| JOBS-10 | InfoJobs | Sin implementación; términos restringen caching y determinados usos. | proveedor | búsqueda local sin integración; [términos oficiales](https://developer.infojobs.net/legal/legal/terms-of-use.xhtml) | production | oferta externa | LEGAL_REVIEW_REQUIRED | P1 | Producto agregador podría requerir acuerdo. | investigar | legal/operational | Aprobación de proveedores |
| JOBS-11 | Ciclo de vida | No se localizan scheduler, stale/last-seen o cierre de ingestas externas. | external/scripts | `apps/api/src/jobs/external/jooble/jooble.ingest.service.ts:39-95`, `apps/api/src/jobs/external/greenhouse/greenhouse.ingest.service.ts:41-98` | staging/production | oferta externa | PRODUCTION_GAP | P1 | Ofertas cerradas permanecen activas. | reemplazar | data | Fuentes reales y ciclo de vida |
| JOBS-12 | Dedupe | Índice único por fuente funciona; no hay dedupe cross-source. | migración | `apps/api/prisma/migrations/20260619120000_add_job_sources/migration.sql:16-21` | todos | oferta | READY_WITH_CONFIG | P2 | Duplicados entre proveedores. | configurar | data | Fuentes reales y ciclo de vida |
| SAVED-01 | Saved Jobs | Ownership, unicidad, idempotencia y retención de inactivas. | saved service | `apps/api/src/jobs/saved-jobs.service.ts:28-94` | todos | preferencia usuario | READY | P3 | Bajo salvo borrado del job. | mantener | backend | Saved Jobs hardening |
| SAVED-02 | Saved Jobs | Borrar Job elimina la referencia guardada del candidato. | Prisma/seed | `apps/api/prisma/schema.prisma:231-238`, `apps/api/prisma/seed.ts:232-240` | todos | preferencia usuario | PRODUCTION_GAP | P1 | Pérdida silenciosa de historial. | reemplazar | data | Fuentes reales y ciclo de vida |
| MATCH-01 | Match | Score determinista, explicable y sin llamadas externas. | scoring/service | `apps/api/src/match/match.scoring.ts:1-8`, `apps/api/src/match/match.scoring.ts:189-225` | todos | perfil/oferta | READY | P3 | Bajo si se presenta como recomendación. | mantener | backend | Match transparente |
| MATCH-02 | Match | Normalización simple y skills vacías de proveedores degradan score. | scoring/ingestas | `apps/api/src/match/match.scoring.ts:52-72`, `apps/api/src/jobs/external/jooble/jooble.ingest.service.ts:39-59` | público | perfil/oferta | READY_WITH_CONFIG | P1 | Recomendaciones engañosas o sesgadas. | configurar | data | Calidad de match |
| MATCH-03 | Match | Falta marco de transparencia, límites y revisión de profiling. | producto/legal | `apps/api/src/match/match.scoring.ts:189-225`; [AEPD](https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos) | público | perfil | LEGAL_REVIEW_REQUIRED | P1 | Falta información y gobernanza. | investigar | legal/operational | Gobierno legal de candidatos |
| ENV-01 | Entornos | Templates y documentación separan dev/test/staging parcialmente. | env/docs | `apps/api/.env.example:23-25`, `docker-compose.staging.yml:1-9` | dev/test/staging | configuración | READY_WITH_CONFIG | P2 | Fallbacks pueden mezclar entornos. | configurar | infrastructure | Contrato de entornos |
| ENV-02 | Production | Sin compose/template de production ni despliegue acreditado. | infraestructura | `docs/sprints/sprint-20-final-report.md:115-135` | production | configuración | PRODUCTION_GAP | P1 | Entorno no reproducible ni auditable. | documentar | infrastructure | Staging remoto y production |
| CI-01 | CI | Gates API/web cubren lint/typecheck/tests/build según módulo. | workflow | `.github/workflows/ci.yml:19-103` | CI | código | READY | P3 | Bajo; mantener. | mantener | infrastructure | Quality gates |
| CI-02 | CI/E2E | E2E es manual; protección remota actual no se revalidó. | workflows/docs | `.github/workflows/e2e.yml:1-11`, `docs/sprints/sprint-19-final-report.md:187-204` | CI | configuración | UNKNOWN | P2 | Regresiones críticas podrían no bloquear merge. | investigar | infrastructure | Quality gates |
| INFRA-01 | Docker | Runners no root, DB interna, healthchecks y migración manual. | Docker | `apps/api/Dockerfile:40-71`, `docker-compose.staging.yml:11-126` | staging | infraestructura | READY_WITH_CONFIG | P2 | Requiere secretos/dominio reales. | configurar | infrastructure | Staging remoto y production |
| INFRA-02 | Staging | Compose local usa dummies/localhost y no es contrato VPS. | compose/report | `docker-compose.staging.yml:1-9`, `docs/sprints/sprint-20-final-report.md:115-135` | staging | configuración | STAGING_ONLY | P1 | Falsa sensación de deploy readiness. | reemplazar | infrastructure | Staging remoto y production |
| INFRA-03 | Backups | Estrategia documentada, restore real no ensayado. | deploy/report | `docs/specs/features/deploy-staging.md:60-92`, `docs/sprints/sprint-20-final-report.md:115-135` | staging/production | base de datos | PRODUCTION_GAP | P1 | Pérdida irrecuperable. | configurar | infrastructure | Resiliencia operativa |
| INFRA-04 | Observabilidad | Solo logs Docker rotados; sin monitorización/alertas/incidentes acreditados. | compose/spec | `docker-compose.staging.yml:29-126`, `docs/specs/features/deploy-staging.md:50-55` | production | telemetría | PRODUCTION_GAP | P1 | Fallos o abuso no detectados. | configurar | infrastructure | Resiliencia operativa |

## 17. Resumen cuantitativo

### Por estado

| Estado | Número |
| --- | ---: |
| READY | 9 |
| READY_WITH_CONFIG | 8 |
| DEVELOPMENT_ONLY | 1 |
| TEST_ONLY | 2 |
| STAGING_ONLY | 1 |
| MOCK_LEAK | 1 |
| PRODUCTION_GAP | 12 |
| LEGAL_REVIEW_REQUIRED | 7 |
| SECURITY_REVIEW_REQUIRED | 3 |
| UNKNOWN | 1 |
| **Total** | **45** |

### Por prioridad

| Prioridad | Número |
| --- | ---: |
| P0 | 3 |
| P1 | 22 |
| P2 | 9 |
| P3 | 11 |
| **Total** | **45** |

### Por tipo de futuro sprint

| Tipo | Número |
| --- | ---: |
| documentación | 2 |
| frontend | 3 |
| backend | 7 |
| data | 11 |
| security | 6 |
| infrastructure | 8 |
| legal/operational | 8 |
| **Total** | **45** |

Los **25 hallazgos P0/P1** son requisitos previos a usuarios o datos reales:

- Auth, cuenta y privacidad: `AUTH-03`, `AUTH-04`, `AUTH-05`, `AUTH-06`, `PRIV-01`, `PRIV-02` y `AVATAR-02`.
- Seguridad de datos y entornos de test: `DATA-03`, `DATA-04` y `TEST-01`.
- Jobs, proveedores y Saved Jobs: `JOBS-03`, `JOBS-04`, `JOBS-05`, `JOBS-06`, `JOBS-07`, `JOBS-09`, `JOBS-10`, `JOBS-11` y `SAVED-02`.
- Match: `MATCH-02` y `MATCH-03`.
- Despliegue y operación: `ENV-02`, `INFRA-02`, `INFRA-03` e `INFRA-04`.

La corrección adopta la **opción A**. El valor anterior era 23 y el definitivo es 25. `JOBS-04` y `JOBS-06` son capacidades técnicas configurables, pero no son excepciones a la taxonomía: su prioridad P1 expresa que configuración, calidad y ciclo de vida deben estar resueltos antes de ingerir datos reales. No se reclasificó ninguna fila y permanecen 3 P0, 22 P1 y 45 hallazgos totales.

### P0 definitivos y mitigación

| ID | Comportamiento y evidencia | Entorno y consecuencia | Mitigación comprobada y requerida | Futuro sprint |
| --- | --- | --- | --- | --- |
| TEST-01 | `DATABASE_URL_TEST` puede recurrir a `DATABASE_URL` y después se ejecuta un `TRUNCATE ... CASCADE`: `apps/api/src/tests/setup.ts:14-26`. | Test/local; una configuración errónea puede truncar una base no dedicada. | Mitigación parcial: CI inyecta `jobit_test` y el template advierte de la separación (`.github/workflows/ci.yml:24-43`, `apps/api/.env.example:23-25`). Mitigación requerida: eliminar el fallback y fallar cerrado tras validar explícitamente una DB de test. | Safety gate de datos (`security`) |
| DATA-04 | El seed ejecuta `job.deleteMany()` y `SavedJob.job` usa `onDelete: Cascade`: `apps/api/prisma/seed.ts:232-240`, `apps/api/prisma/schema.prisma:231-238`. | Cualquier base alcanzable; puede eliminar jobs y preferencias guardadas. | Mitigación parcial: comentarios lo presentan como seed de development, pero no existe enforcement. Mitigación requerida: guarda estricta de entorno/DB y seed no destructivo, preservando Saved Jobs. | Safety gate de datos (`data`) |
| PRIV-01 | El registro recoge email y contraseña sin información legal localizada en esa superficie: `apps/web/src/features/auth/register-form.tsx:34-132`. | Público/production; bloquea la readiness para incorporar candidatos y datos personales. | Mitigación requerida: mantener deshabilitada la incorporación real hasta documentar finalidades, base jurídica, retención, derechos y responsables, con revisión especializada. No se afirma un incumplimiento jurídico concreto. | Gobierno legal de candidatos (`legal/operational`) |

Ningún P0 reproduce secretos ni datos personales. Los dos P0 técnicos describen comportamientos comprobados y mitigaciones parciales, no ejecuciones realizadas durante la auditoría.

## 18. Roadmap posterior

| Orden | Sprint propuesto | Objetivo | Hallazgos principales | Gate de salida |
| ---: | --- | --- | --- | --- |
| 1 | Safety gate de datos | Eliminar rutas destructivas accidentales. | DATA-03, DATA-04, TEST-01 | Ningún seed/test puede operar sobre DB no dedicada; Saved Jobs no se borran por seed. |
| 2 | Gobierno legal de candidatos | Definir información, derechos, retención, soporte, incidentes y match. | PRIV-01, PRIV-02, PORT-02, MATCH-03 | Revisión especializada aprobada y flujos verificables. |
| 3 | Auth y ciclo de cuenta | Completar refresh, rate limiting, recovery, verificación, export/delete. | AUTH-03 a AUTH-06, AVATAR-02 | Ciclo completo probado y borrado/retención definidos. |
| 4 | Contrato de entornos y staging remoto | Crear configuración segura, ejecutar staging autorizado y restore drill. | ENV-01, ENV-02, INFRA-01 a INFRA-04 | Staging remoto sano, backup restaurado y alertas verificadas. |
| 5 | Aprobación de proveedores | Seleccionar fuentes, consultar de nuevo su documentación oficial vigente y cerrar términos, atribución y trazabilidad. | JOBS-02, JOBS-05, JOBS-07, JOBS-09, JOBS-10 | Cada fuente tiene aprobación documentada y revisada por especialista o queda deshabilitada. |
| 6 | Fuentes reales y ciclo de vida | Scheduler, expiración, cierre, dedupe y preservación de Saved Jobs. | JOBS-04, JOBS-06, JOBS-08, JOBS-11, JOBS-12, SAVED-02 | Ofertas trazables, actuales y archivadas sin pérdida de preferencias. |
| 7 | Calidad de match y experiencia | Mejorar taxonomía/calidad y eliminar fugas de demo. | JOBS-03, MATCH-02 | Scores calibrados con datos aprobados y copy de producción. |
| 8 | Quality gates y documentación viva | Resolver CI remoto/E2E y actualizar terminología. | CI-02, DOC-01, ARCH-02 | Gates observados y documentación coherente con evidencia. |

No debe activarse una fuente real ni incorporarse candidatos reales antes de completar, como mínimo, los sprints 1 y 2 y los gates aplicables de 3 a 5.

## 19. Riesgos e incógnitas

- Vigencia y aplicabilidad contractual exacta para cada proveedor y caso de uso.
- Responsable jurídico, jurisdicción, base jurídica y encargados definitivos.
- Topología, proveedor, dominio, TLS, almacenamiento y backups reales.
- Estado actual de branch protection y checks requeridos en GitHub.
- Contenido y propietario del artefacto ignorado de uploads; no se inspeccionó por seguridad.
- Volumen, frecuencia, cierre y SLA de fuentes de empleo futuras.
- Criterios de calidad, equidad y comunicación del match con datos reales.
- Política de archivo frente a borrado de Jobs y Saved Jobs.

## 20. Fuera de alcance respetado

No se modificó código, configuración, workflows, specs, arquitectura, Prisma, seeds, fixtures, E2E, Docker ni templates. No se ejecutaron instalaciones, bases, migraciones, seeds, ingestas, proveedores, despliegues o acciones sobre infraestructura. No se accedió a secretos, datos personales ni contenido de uploads. No se realizaron operaciones Git externas ni staging de archivos.

## 21. Verificaciones

Verificaciones documentales ejecutadas:

- 45 identificadores, 45 únicos y sin duplicados.
- Recuentos de estados, prioridades y tipos recalculados desde la matriz y coincidentes con la sección 17.
- Extracción automatizada de 3 P0 y 22 P1: 25 requisitos previos, coincidentes con la lista explícita y el resumen ejecutivo.
- 15 secciones numeradas en el plan y 22 en el informe.
- Tablas con número de columnas consistente, newline final y cero whitespace residual.
- Concordancia revisada entre P0/P1, bloqueos y roadmap.
- Búsqueda controlada de patrones de secretos sin coincidencias.
- Revisión de ausencia de datos personales, conclusiones legales no verificadas y lenguaje nuevo que describa JobIT como un MVP actual.
- `git status --short`: exclusivamente los dos documentos nuevos sin stagear.
- `git diff --check`: sin salida.
- `git diff --stat`: sin salida porque Git no incluye archivos untracked en el diff ordinario.
- `git diff --name-only`: sin salida por la misma razón.
- `git diff --no-index --check /dev/null <archivo>` para cada documento: sin errores de whitespace; el código `1` es el esperado al existir diferencias.

No se usó `git add -N` para forzar la aparición de los archivos en `git diff`, porque cualquier `git add` está expresamente prohibido. La comprobación autoritativa de alcance es `git status --short --untracked-files=all`, que contiene exclusivamente:

- `docs/sprints/sprint-22-production-readiness-real-data-audit-plan.md`
- `docs/sprints/sprint-22-production-readiness-real-data-audit-report.md`

Se omiten typecheck, tests, lint, build, E2E y Docker build: los únicos cambios son Markdown, el sprint prohíbe ejecución de datos/runtime y esas suites no aportan validación proporcional al diff documental.

## 22. Estado final y recomendación

**Recomendación: no incorporar todavía usuarios, datos personales ni fuentes reales y no declarar un despliegue productivo.** El siguiente trabajo debe comenzar por el safety gate de datos y el gobierno legal de candidatos. Después deben cerrarse auth/ciclo de cuenta y un staging remoto recuperable y observable antes de habilitar proveedores.

Estado documental: **READY_FOR_REVIEW** tras las verificaciones Git documentales; queda sujeto a revisión humana.
