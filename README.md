# JobIT-platform

JobIT es una plataforma fullstack modular de empleo tecnologico. Su objetivo es ayudar a profesionales tech a gestionar mejor su busqueda laboral, preparar su perfil y conectar con oportunidades relevantes.

El repositorio ha superado la fase documental inicial y tiene un MVP candidate-first **funcional** (backend en `apps/api` + frontend en `apps/web`), en fase de pulido de UX/UI y preparacion de despliegue. Estan implementados los modulos de Auth, Candidate Profile & CV, Jobs (incluida la integracion backend-only con Jooble y, mas adelante, Greenhouse, y la politica de visibilidad publica de la API), Saved Jobs, Match basico explicable y Candidate Dashboard. Desde el Sprint 07 existe el frontend candidate-first en `apps/web` (Next.js + TypeScript + Tailwind + App Router): partio del slice vertical landing -> login/registro -> dashboard privado y desde entonces se han anadido las UIs de Perfil/CV y Portfolio (incluido portfolio publico `/u/[slug]`), Jobs, Saved Jobs y Match basico explicable. En el Sprint 08 se valido el entorno local real y el smoke HTTP del flujo `register -> login -> dashboard -> logout` (PASS_WITH_NOTES); el smoke visual quedo cubierto despues por el smoke E2E de Playwright (Sprint 18). Sprints posteriores agregaron la arquitectura multi-fuente de ofertas y el proveedor Greenhouse (Sprint 16), la activacion y el endurecimiento del dashboard y el pulido de UI candidato (Sprint 17), la preparacion **verificada en local** del deploy dev/staging con Docker + runbook, sin desplegar en VPS (Sprint 20), y una auditoria UX/UI del flujo candidato con su remediacion por lotes (Sprint 21: identidad, navegacion responsive, paginacion de Jobs, UX de match para perfiles incompletos y accesibilidad del drawer). Desde el Sprint 19 el repositorio cuenta con CI en GitHub Actions (workflow `JobIT CI`) que verifica API y Web en cada PR. La infraestructura de despliegue real (Docker en VPS, DNS, reverse proxy/SSL) sigue pendiente de autorizacion (gate 20.6).

## Vision modular

JobIT se plantea como una plataforma evolutiva con modulos separados por responsabilidad:

- Experiencia de candidatos.
- Gestion de perfil profesional.
- Busqueda y seguimiento de ofertas.
- Preparacion de candidaturas.
- Futuras herramientas para recruiters y empresas.
- Futuras capacidades de analitica e inteligencia asistida.

La primera version se limita a validar el nucleo candidate-first antes de ampliar el alcance.

## Alcance MVP

El MVP inicial sera candidate-first. Debe centrarse en resolver necesidades reales de candidatos tech sin abrir todavia funcionalidades avanzadas.

Alcance previsto del MVP:

- Registro conceptual de candidatos y perfil profesional.
- Gestion basica de informacion laboral, skills y preferencias.
- Exploracion o gestion inicial de oportunidades.
- Seguimiento simple del proceso de candidatura.
- Base funcional preparada para crecer por modulos.

Todo el alcance funcional debera definirse mediante especificaciones antes de implementarse.

## Fuera de alcance MVP

Queda fuera del MVP inicial:

- Frontend, backend, base de datos o infraestructura durante la fase documental inicial.
- Modulo recruiter completo.
- IA avanzada o automatizaciones complejas.
- Monetizacion.
- Comunidad real o red social.
- Aplicacion movil.
- Integraciones externas no imprescindibles.
- Despliegue, Docker o configuracion de produccion (el CI basico de verificacion se anadio despues, en el Sprint 19).

## Stack previsto

El stack definitivo se decidira en sprints tecnicos posteriores. Como orientacion inicial, el proyecto preve:

- Frontend: Next.js + TypeScript + Tailwind.
- Backend: Node.js + TypeScript con Express o Fastify.
- Base de datos: PostgreSQL + Prisma.
- Deploy futuro: Docker + VPS + Nginx o Nginx Proxy Manager.

Parte de este stack ya esta implementado: el backend en `apps/api` (Express + Prisma) y, desde el Sprint 07, el frontend en `apps/web` (Next.js + TypeScript + Tailwind + App Router). El stack de despliegue (Docker + VPS + Nginx) sigue pendiente de sprints posteriores.

## Estado actual del repositorio

Estado: MVP candidate-first funcional (backend + frontend) sobre la base documental y de specs ya creada, en fase de pulido de UX/UI y preparacion de despliegue. El backend vive en `apps/api` (Node.js + TypeScript + Express + Zod, PostgreSQL + Prisma) y el frontend en `apps/web` (Next.js + TypeScript + Tailwind + App Router). Ultimo sprint cerrado: **Sprint 21 (Candidate UX/UI Audit & remediacion)** — ver [`docs/sprints/sprint-21-final-report.md`](docs/sprints/sprint-21-final-report.md).

Modulos backend implementados:

- **Auth (M01)**: registro, login, logout y ruta privada del usuario autenticado, con middleware `requireAuth`.
- **Candidate Profile & CV (M02)**: perfil del candidato y subrecursos (skills, experience, education, projects, links, preferences) bajo `/api/profile/me`, con ownership por usuario autenticado.
- **Jobs (M03)**: exploracion de ofertas tech, con filtros y paginacion. Incluye la integracion backend-only con Jooble (ingesta manual/controlada de ofertas externas, sin red en tests) y la politica de visibilidad publica de la API (DTO publico via `serializeJob` / `JobPublicDto`, que oculta `externalId`/`ingestedAt` y expone `source`/`sourceUrl`).
- **Saved Jobs (M04)**: guardado, listado y borrado de ofertas por candidato autenticado, con ownership estricto e idempotencia.
- **Match basico explicable (M05)**: afinidad entre el perfil/CV del candidato autenticado y las ofertas, calculada en tiempo de peticion. Heuristico, determinista y explicable (reglas visibles con desglose por factores); **no usa IA/ML/embeddings/LLM**. El job embebido usa `serializeJob` / `JobPublicDto` (sin `externalId`/`ingestedAt`).
- **Candidate Dashboard (M06)**: vista agregada de solo lectura del candidato autenticado bajo `/api/dashboard/me`. Compone servicios ya existentes de Profile/CV (perfil + completitud), Saved Jobs (ultimas guardadas) y Match (mejores afinidades), reutilizando indirectamente `serializeJob` / `JobPublicDto`. Backend-first, determinista, **sin persistencia nueva, sin IA avanzada y sin llamadas externas**.

Endpoints de Jobs disponibles (rutas privadas, requieren sesion):

- `GET /api/jobs` — listado de ofertas activas con filtros (`q`, `location`, `remote`, `seniority`, `contractType`, `source`, `tags`) y paginacion (`page`, `limit`). `location` filtra por ubicacion (contains, case-insensitive) y es el eje principal de busqueda, alineado con las fuentes externas (Jooble y futuras APIs/RSS).
- `GET /api/jobs/:id` — detalle de una oferta activa; devuelve `404` si no existe, esta cerrada o ha expirado.

Endpoints de Saved Jobs disponibles (rutas privadas, requieren sesion):

- `GET /api/saved-jobs` — listado de ofertas guardadas del candidato autenticado, ordenadas por fecha de guardado; el job embebido usa el contrato publico de Jobs.
- `POST /api/saved-jobs/:jobId` — guarda una oferta; idempotente (`201` si la crea, `200` si ya estaba guardada).
- `DELETE /api/saved-jobs/:jobId` — quita una oferta guardada propia (`204`); devuelve `404` si no estaba guardada por el usuario.

Endpoints de Match disponibles (rutas privadas, requieren sesion):

- `GET /api/jobs/:id/match` — calcula la afinidad del candidato autenticado con una oferta; devuelve `score` (0-100), `level`, `matchedSkills`, `missingSkills`, `factors` y `explanation`. `400` si el id no tiene forma de UUID; `404` si la oferta no esta disponible.
- `GET /api/profile/me/matches` — mejores ofertas para el candidato autenticado, ordenadas por `score` descendente; `limit` opcional (default 10, maximo 50); cada item incluye la oferta via `JobPublicDto`. No expone `externalId` ni `ingestedAt`.

Endpoint de Dashboard disponible (ruta privada, requiere sesion):

- `GET /api/dashboard/me` — vista agregada del candidato autenticado. Devuelve `profile` (`firstName`, `lastName`, `headline`, `completionPercentage`), `skills`, `savedJobs` (`total` + `recent` limitado a 3 por fecha de guardado), `matches` (top 3 explicables) y `nextActions` deterministas (`complete_profile`, `explore_jobs`). El `userId` se obtiene solo del token; los jobs embebidos usan el contrato publico de Jobs (sin `externalId`/`ingestedAt`).

### Frontend candidate-first (desde Sprint 07)

El frontend vive en `apps/web` como workspace `@jobit/web` (Next.js + TypeScript + Tailwind + App Router). Nacio en el Sprint 07 como una primera version minima candidate-first que consume el backend real y ha ido madurando en sprints posteriores (Portfolio v1, activacion y pulido del dashboard, paginacion de Jobs, y la remediacion UX/UI del Sprint 21: identidad real y sincronizada del header, navegacion responsive con drawer accesible, avisos de sesion, deduplicacion de CTAs y orden responsive del perfil).

Pantallas implementadas:

- `/` — landing candidate-first (marca JobIT y accesos a login, registro y dashboard).
- `/login` — inicio de sesion contra `POST /api/auth/login`.
- `/register` — registro contra `POST /api/auth/register`, con confirmacion de contrasena y politica minima en cliente.
- `/dashboard` — ruta privada que consume `GET /api/dashboard/me` y muestra perfil/completitud, skills, ofertas guardadas, mejores matches y proximos pasos, con estados de carga/error/vacio y boton de logout.
- `/profile` (y `/profile/portfolio`, `/profile/portfolio/settings`) mas el portfolio publico `/u/[slug]` — JobIT CV editable y portfolio (Sprints 13-14).
- `/jobs` y `/jobs/[id]` — exploracion y detalle de ofertas con filtros y guardar/quitar (Sprint 15A-B). El detalle muestra ademas un panel de match basico y explicable (`GET /api/jobs/:id/match`: score, nivel, explicacion, factores y skills), cuyo fallo no rompe el detalle (Sprint 15D). **Sin IA avanzada.** Cada oferta indica su **fuente** (JobIT/Jooble); si tiene `sourceUrl`, el candidato puede abrir la oferta original de forma segura (`target="_blank"` + `rel="noopener noreferrer"`, solo `http`/`https`) para inscribirse en el origen. Las ofertas de ejemplo (seed internas, sin URL) se marcan como tales y no muestran enlace de inscripcion. El MVP **no gestiona candidaturas internas**: la inscripcion ocurre siempre en la fuente original (Sprint 15E). La busqueda de `/jobs` se organiza por **ubicacion** (el antiguo selector de "Fuente" se sustituyo por un campo de ubicacion): con varias fuentes activas el candidato busca por sus parametros y el sistema devuelve ofertas de todas las fuentes disponibles. Las ofertas `JOOBLE` se ingieren con el modulo backend-only de Jooble; las `INTERNAL` seran, mas adelante, ofertas publicadas por empresas en la propia web de JobIT. Arquitectura de fuentes y extensibilidad (APIs/RSS): [`docs/architecture/03-job-sources-and-search.md`](docs/architecture/03-job-sources-and-search.md).
- `/saved-jobs` — ofertas guardadas del candidato.
- `/match` — JobIT Match basico y explicable (Sprint 15C): mejores ofertas del candidato ordenadas por una puntuacion basada en reglas visibles (skills, modalidad, seniority y ubicacion), con nivel de afinidad, skills coincidentes/faltantes, enlace al detalle y guardar/quitar. Consume `GET /api/profile/me/matches`; **no usa IA avanzada ni modelos opacos**.

Sesion y seguridad:

- El `accessToken` se guarda solo en memoria de React (no se usa `localStorage` ni `sessionStorage`).
- El cliente API tipado usa `fetch` con `credentials: "include"` y cabecera `Authorization: Bearer` solo cuando hay token; la URL base se lee de `NEXT_PUBLIC_API_BASE_URL`.
- No existe `POST /api/auth/refresh`: al recargar la pagina o expirar el token, la sesion se pierde y el candidato vuelve a iniciar sesion. Un `401` se trata como sesion expirada (limpia la sesion y redirige a `/login`).
- Logout: llama a `POST /api/auth/logout` y limpia la sesion local aunque la llamada al servidor falle.

Ejecucion local del frontend (backend dev esperado en `:4000`, frontend en `:3000`):

```bash
# Configuracion local no versionada
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:4000" > apps/web/.env.local
pnpm --filter @jobit/web dev
pnpm --filter @jobit/web typecheck
pnpm --filter @jobit/web test
pnpm --filter @jobit/web build
pnpm --filter @jobit/web lint
```

### Entorno local y smoke (Sprint 08)

El Sprint 08 valido el entorno local real (backend + PostgreSQL + frontend) en el clon nativo de WSL y dejo el deploy dev/staging **planificado, no ejecutado**.

- Entorno operativo obligatorio: clon nativo de WSL `/home/david/projects/JobIT-platform` (ver `docs/agents/operating-environment.md`). No usar la carpeta de OneDrive/Windows para tooling.
- Base de datos local de dev/smoke: `jobit_dev` en el contenedor `jobit-postgres-test` (host `5434`), separada de la base de test `jobit_test`.
- Plantilla de entorno del backend: `apps/api/.env.example` (placeholders, sin secretos). Los `.env` reales (`apps/api/.env`, `apps/web/.env.local`) son locales e ignorados por Git.
- Variables (sin valores reales): backend `DATABASE_URL`, `DATABASE_URL_TEST`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT` (4000), `CORS_ORIGIN`, `NODE_ENV`, `JOOBLE_API_KEY` (opcional/vacia), `JOOBLE_API_BASE_URL` (opcional; default `https://jooble.org/api`, regional p. ej. `https://es.jooble.org/api` para keys regionales); frontend `NEXT_PUBLIC_API_BASE_URL` (`http://localhost:4000`). La ingesta Jooble es backend-only y controlada; JobIT busca en su DB local, no consulta Jooble en vivo. Detalle en [`docs/development/local-env.md`](docs/development/local-env.md) y [`docs/architecture/03-job-sources-and-search.md`](docs/architecture/03-job-sources-and-search.md).
- Guia detallada de entorno local (arranque API/Web, `DATABASE_URL_TEST` y smoke con curl): [`docs/development/local-env.md`](docs/development/local-env.md). Importante: `CORS_ORIGIN` debe coincidir con el puerto REAL del frontend; si el 3000 esta ocupado y el web corre en `:3001`, usa `CORS_ORIGIN=http://localhost:3001` (si no, el login falla por CORS).

Resultado del smoke local (PASS_WITH_NOTES):

- Smoke HTTP backend real: PASS — `register 201 -> login 200 -> GET /api/dashboard/me 200 -> logout 204 -> GET /api/auth/me sin token 401`. Ademas `GET /health` 200 y landing `/` 200.
- Smoke visual en navegador: pendiente/BLOCKED por ausencia de navegador/Playwright en el entorno de agente (no es defecto de codigo).
- Verificaciones: backend `278/278`, frontend `35/35`, typecheck/build/lint en verde.

Pendiente: deploy dev/staging (requiere target y autorizacion); dominio/subdominio, DB staging y reverse proxy/SSL por decidir; ajuste de cookie cross-site/HTTPS para staging. Detalle en `docs/sprints/sprint-08-*`. El smoke visual con navegador quedo cubierto por el smoke E2E de Playwright del Sprint 18 (`docs/specs/features/candidate-e2e-smoke.md`).

Verificaciones del Sprint 07: `typecheck`, `test` (35/35), `build` y `lint` en verde; auditoria quality/security PASS_WITH_NOTES. El smoke manual contra el backend real queda **pendiente** de provisionar el entorno local (`apps/web/.env.local`, backend con base de datos migrada y puerto `:3000` libre).

Pendiente del frontend: smoke real en entorno provisionado, UI completa de Jobs / Saved Jobs / Perfil-CV, navegacion segun sesion, posible `POST /api/auth/refresh` (backend) y despliegue dev/staging.

Pendiente global: infraestructura de despliegue (Docker, VPS). El CI basico de verificacion existe desde el Sprint 19 (ver la seccion de integracion continua). Cada nuevo modulo se implementa con su spec previa y el flujo SDD + TDD + AI Audit.

### Integracion continua (Sprint 19)

El workflow `JobIT CI` (`.github/workflows/ci.yml`) se ejecuta en cada PR hacia `dev`/`main`, en cada push a `dev` y bajo demanda (`workflow_dispatch`), con dos jobs separados e independientes:

- **api**: PostgreSQL 16 como service efimero (la suite de integracion migra la base sola via `globalSetup`), `prisma generate` explicito, typecheck, tests (399 en 41 archivos) y build.
- **web**: lint, typecheck, tests RTL con APIs mockeadas (386 en 27 archivos) y build de Next.

> Conteos de tests al cierre del Sprint 21 (CI verde en `dev`). Iran creciendo con cada sprint; el CI es la fuente de verdad.

El CI fija Node 20, resuelve pnpm desde el campo `packageManager` e instala con `--frozen-lockfile`. No usa secrets: solo variables dummy (`DATABASE_URL_TEST` del service efimero y `NEXT_PUBLIC_API_BASE_URL`, que es publica). Las ramas y PRs deben pasar ambos jobs antes del merge hacia `dev`.

Comandos locales equivalentes (los mismos que ejecuta el CI):

```bash
pnpm install --frozen-lockfile
pnpm --filter @jobit/api exec prisma generate
pnpm --filter @jobit/api typecheck && pnpm --filter @jobit/api test && pnpm --filter @jobit/api build
pnpm --filter @jobit/web lint && pnpm --filter @jobit/web typecheck && pnpm --filter @jobit/web test && pnpm --filter @jobit/web build
```

El smoke E2E de Playwright (Sprint 18) NO corre en CI: sigue siendo ejecucion local/manual (`pnpm --filter @jobit/web test:e2e` contra el stack local seedeado) y queda documentado como fase posterior con workflow manual. El Sprint 19 no anade deploy. Detalle: spec `docs/specs/features/ci-quality-gates.md` y plan `docs/sprints/sprint-19-ci-quality-gates-plan.md`.

## Estructura documental

Estructura actual (orientativa; las carpetas `decisions/`, `specs/features/` y `sprints/`
crecen con cada sprint — consulta el arbol real del repo para el listado completo):

```text
.
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── apps
│   ├── api            # Backend Express + Prisma (Node.js + TypeScript + Zod)
│   └── web            # Frontend Next.js (App Router) + TypeScript + Tailwind
├── docker-compose.staging.yml
└── docs
    ├── agents         # Guias, workflow SDD+TDD+AI Audit, skills, plantillas y checklists
    ├── architecture   # 00-overview, 01-repository-structure, 02-mvp-modules, 03-job-sources-and-search
    ├── decisions      # ADR-0001 … ADR-0012 (stack, auth, API, DB/ORM, Jooble, deploy staging…)
    ├── deployment     # staging-env, runbook de deploy en VPS (preparado, no ejecutado)
    ├── development    # local-env (arranque API/Web, DB de dev/test, smoke con curl)
    ├── product        # 00-product-brief
    ├── specs
    │   ├── 00-mvp-scope.md
    │   ├── spec-template.md
    │   └── features   # auth, candidate-profile-cv, jobs, saved-jobs, match-basic, dashboard,
    │                  # external-jobs-jooble, job-sources-aggregation, jobs-api-visibility,
    │                  # jobit-portfolio-v1, candidate-e2e-smoke, ci-quality-gates,
    │                  # deploy-staging-readiness, match-incomplete-profile-ux,
    │                  # identity-navigation-responsive, …
    └── sprints        # pre-sprint-00A…00D + briefs/planes/reports de los Sprints 00–21
                       # (registros historicos por sprint; el ultimo es sprint-21-final-report.md)
```

## Flujo oficial de ramas

JobIT usa ramas cortas y revisables. No se trabaja directamente sobre `main` ni `dev`.

- `main`: rama estable. Solo recibe cambios validados desde `dev`.
- `dev`: rama de integracion. Todas las PR deben apuntar aqui salvo decision explicita.
- `docs/*`: documentacion, decisiones, specs y guias.
- `feat/*`: nuevas funcionalidades con spec previa.
- `fix/*`: correcciones acotadas.
- `chore/*`: mantenimiento, ajustes internos o tareas no funcionales.

Reglas operativas:

- Crear cada rama desde `dev` actualizado.
- Confirmar rama activa y `git status --short` antes de modificar.
- Mantener cambios pequenos, revisables y reversibles.
- Separar cambios documentales de cambios de codigo cuando el alcance lo permita.
- Abrir PR hacia `dev` solo tras verificaciones y auditoria.

Rama usada para formalizar este flujo:

```text
docs/pre-sprint-00b-workflow-governance
```

## Flujo oficial SDD + TDD + AI Audit + PR

JobIT sigue una metodologia SDD, Specification-Driven Development, combinada con TDD pragmatico, agentes IA controlados, auditoria documental/tecnica de calidad y seguridad, Pull Requests y Docs as Code.

Flujo base:

1. Crear rama desde `dev`.
2. Crear o actualizar una spec en `docs/specs/`.
3. Definir tests minimos antes de implementar.
4. Implementar con TDD pragmatico y asistencia controlada de IA.
5. Ejecutar verificaciones locales.
6. Pasar auditoria de calidad y seguridad.
7. Corregir cualquier fallo detectado.
8. Actualizar la documentacion dentro de la misma rama.
9. Abrir PR hacia `dev`.

Reglas de bloqueo:

- No se implementa una feature sin spec previa en `docs/specs/`.
- No se abre PR si la auditoria quality/security devuelve `FAIL`.
- No se abre PR si faltan verificaciones locales razonables para el alcance.
- La documentacion afectada debe actualizarse en la misma rama antes de la PR.
- La IA es copiloto, no piloto automatico: una persona revisa y valida el resultado.

Documentos de referencia:

- [Flujo SDD + TDD + AI Audit](docs/agents/sdd-tdd-ai-audit-workflow.md).
- [Guia de TDD pragmatico](docs/agents/tdd-guidelines.md).
- [Auditoria quality/security](docs/agents/audit-quality-security-skill.md).
- [Checklist de PR](docs/agents/pr-checklist.md).
- [Plantilla de spec](docs/specs/spec-template.md).
- [ADR-0004 metodologico](docs/decisions/ADR-0004-sdd-tdd-ai-audit-workflow.md).

## Uso de agentes IA

Los agentes IA pueden ayudar a documentar, analizar, proponer, implementar tareas controladas y revisar cambios. Deben respetar siempre el alcance aprobado, trabajar con prompts pequenos, aplicar prompt chaining cuando el trabajo sea largo, mantener cambios reversibles y entregar un resumen final.

Las reglas operativas para agentes estan en [AGENTS.md](AGENTS.md).

## Siguiente paso

El nucleo candidate-first del MVP esta implementado y verificado (backend + frontend, CI en verde). Los siguientes pasos recomendados son:

- **Deploy dev/staging real (gate 20.6)**: ejecutar el runbook ya escrito y verificado en local (Docker + VPS + DNS + reverse proxy/SSL), con autorizacion expresa y ventana de rollback. Ver [`docs/deployment/staging-vps-deploy-runbook.md`](docs/deployment/staging-vps-deploy-runbook.md) y [`docs/sprints/sprint-20-final-report.md`](docs/sprints/sprint-20-final-report.md).
- **Deuda de accesibilidad y UX (Sprint 21E y posteriores)**: A11Y-01…05 (auditoria WCAG completa) y hallazgos diferidos (PROF-01/02, PORT-02, SAVED-02, MATCH-04). Ver [`docs/sprints/sprint-21-final-report.md`](docs/sprints/sprint-21-final-report.md).

Cada nuevo modulo o mejora sigue el flujo SDD + TDD + AI Audit + PR descrito arriba: spec previa, tests minimos, verificaciones locales, auditoria y PR hacia `dev`.
