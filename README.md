# JobIT-platform

JobIT es una plataforma fullstack modular de empleo tecnologico. Su objetivo es ayudar a profesionales tech a gestionar mejor su busqueda laboral, preparar su perfil y conectar con oportunidades relevantes.

El repositorio ha superado la fase documental inicial y tiene en marcha la implementacion del backend MVP candidate-first (API en `apps/api`). Ya estan implementados los modulos de Auth, Candidate Profile & CV, Jobs (incluida la integracion backend-only con Jooble y la politica de visibilidad publica de la API), Saved Jobs, Match basico explicable y Candidate Dashboard. En el Sprint 07 se ha anadido una primera version del frontend candidate-first en `apps/web` (Next.js + TypeScript + Tailwind). La infraestructura de despliegue (Docker, CI/CD) sigue pendiente.

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
- CI/CD, despliegue, Docker o configuracion de produccion.

## Stack previsto

El stack definitivo se decidira en sprints tecnicos posteriores. Como orientacion inicial, el proyecto preve:

- Frontend: Next.js + TypeScript + Tailwind.
- Backend: Node.js + TypeScript con Express o Fastify.
- Base de datos: PostgreSQL + Prisma.
- Deploy futuro: Docker + VPS + Nginx o Nginx Proxy Manager.

Parte de este stack ya esta implementado: el backend en `apps/api` (Express + Prisma) y, desde el Sprint 07, el frontend en `apps/web` (Next.js + TypeScript + Tailwind + App Router). El stack de despliegue (Docker + VPS + Nginx) sigue pendiente de sprints posteriores.

## Estado actual del repositorio

Estado: backend MVP candidate-first en desarrollo activo sobre la base documental y de specs ya creada. El backend vive en `apps/api` (Node.js + TypeScript + Express + Zod, PostgreSQL + Prisma).

Modulos backend implementados:

- **Auth (M01)**: registro, login, logout y ruta privada del usuario autenticado, con middleware `requireAuth`.
- **Candidate Profile & CV (M02)**: perfil del candidato y subrecursos (skills, experience, education, projects, links, preferences) bajo `/api/profile/me`, con ownership por usuario autenticado.
- **Jobs (M03)**: exploracion de ofertas tech, con filtros y paginacion. Incluye la integracion backend-only con Jooble (ingesta manual/controlada de ofertas externas, sin red en tests) y la politica de visibilidad publica de la API (DTO publico via `serializeJob` / `JobPublicDto`, que oculta `externalId`/`ingestedAt` y expone `source`/`sourceUrl`).
- **Saved Jobs (M04)**: guardado, listado y borrado de ofertas por candidato autenticado, con ownership estricto e idempotencia.
- **Match basico explicable (M05)**: afinidad entre el perfil/CV del candidato autenticado y las ofertas, calculada en tiempo de peticion. Heuristico, determinista y explicable (reglas visibles con desglose por factores); **no usa IA/ML/embeddings/LLM**. El job embebido usa `serializeJob` / `JobPublicDto` (sin `externalId`/`ingestedAt`).
- **Candidate Dashboard (M06)**: vista agregada de solo lectura del candidato autenticado bajo `/api/dashboard/me`. Compone servicios ya existentes de Profile/CV (perfil + completitud), Saved Jobs (ultimas guardadas) y Match (mejores afinidades), reutilizando indirectamente `serializeJob` / `JobPublicDto`. Backend-first, determinista, **sin persistencia nueva, sin IA avanzada y sin llamadas externas**.

Endpoints de Jobs disponibles (rutas privadas, requieren sesion):

- `GET /api/jobs` — listado de ofertas activas con filtros (`q`, `remote`, `seniority`, `contractType`, `source`, `tags`) y paginacion (`page`, `limit`).
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

### Frontend candidate-first (Sprint 07)

El frontend vive en `apps/web` como workspace `@jobit/web` (Next.js + TypeScript + Tailwind + App Router). Es una primera version minima candidate-first que consume el backend real.

Pantallas implementadas:

- `/` — landing candidate-first (marca JobIT y accesos a login, registro y dashboard).
- `/login` — inicio de sesion contra `POST /api/auth/login`.
- `/register` — registro contra `POST /api/auth/register`, con confirmacion de contrasena y politica minima en cliente.
- `/dashboard` — ruta privada que consume `GET /api/dashboard/me` y muestra perfil/completitud, skills, ofertas guardadas, mejores matches y proximos pasos, con estados de carga/error/vacio y boton de logout.

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

Verificaciones del Sprint 07: `typecheck`, `test` (35/35), `build` y `lint` en verde; auditoria quality/security PASS_WITH_NOTES. El smoke manual contra el backend real queda **pendiente** de provisionar el entorno local (`apps/web/.env.local`, backend con base de datos migrada y puerto `:3000` libre).

Pendiente del frontend: smoke real en entorno provisionado, UI completa de Jobs / Saved Jobs / Perfil-CV, navegacion segun sesion, posible `POST /api/auth/refresh` (backend) y despliegue dev/staging.

Pendiente global: infraestructura de despliegue (Docker, CI/CD). Cada nuevo modulo se implementa con su spec previa y el flujo SDD + TDD + AI Audit.

## Estructura documental inicial

```text
.
├── AGENTS.md
├── CLAUDE.md
├── README.md
└── docs
    ├── agents
    │   ├── README.md
    │   ├── concepts.md
    │   ├── workflow.md
    │   ├── sdd-tdd-ai-audit-workflow.md
    │   ├── tdd-guidelines.md
    │   ├── audit-quality-security-skill.md
    │   ├── pr-checklist.md
    │   ├── checklists
    │   ├── claude
    │   ├── codex
    │   ├── prompts
    │   ├── skills
    │   └── templates
    ├── architecture
    │   ├── 00-architecture-overview.md
    │   ├── 01-repository-structure.md
    │   └── 02-mvp-modules.md
    ├── decisions
    │   ├── ADR-0001-start-from-scratch.md
    │   ├── ADR-0002-initial-stack.md
    │   ├── ADR-0003-sdd-and-agent-workflow.md
    │   └── ADR-0004-sdd-tdd-ai-audit-workflow.md
    ├── product
    │   └── 00-product-brief.md
    ├── specs
    │   ├── 00-mvp-scope.md
    │   ├── spec-template.md
    │   └── features
    │       ├── auth.md
    │       ├── candidate-profile-cv.md
    │       ├── jobs.md
    │       ├── saved-jobs.md
    │       ├── match-basic.md
    │       └── dashboard.md
    └── sprints
        ├── pre-sprint-00A-documentation.md
        ├── pre-sprint-00B-architecture.md
        └── pre-sprint-00C-functional-specs.md
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

El siguiente paso recomendado es revisar las specs funcionales del MVP con el equipo de producto y tecnico, cerrar las decisiones de stack (ADRs pendientes) y abrir el primer sprint de implementacion.
