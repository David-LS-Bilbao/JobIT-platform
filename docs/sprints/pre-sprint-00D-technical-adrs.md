# Pre-Sprint 00D: ADRs técnicas previas a implementación

## Objetivo

Documentar las decisiones técnicas arquitectónicas necesarias antes de escribir código: framework de backend, estrategia de autenticación, diseño de API y modelo inicial de base de datos con ORM. Estas decisiones cierran la fase documental y dejan el repositorio listo para iniciar implementación.

## Contexto

JobIT-platform tiene ya:

- Gobernanza documental de agentes (Pre-Sprints 00A y 00B).
- Specs funcionales del MVP candidate-first (Pre-Sprint 00C):
  - Auth (M01), Candidate Profile + CV (M02), Jobs (M03), Saved Jobs (M04), Match básico (M05), Dashboard (M06).
- ADR-0002 con el stack inicial previsto documentalmente: Next.js + TypeScript, Node.js + Express/Fastify, PostgreSQL + Prisma, Docker + VPS + Nginx.

Los ADRs de este sprint concretan las decisiones pendientes de ADR-0002 y añaden las no cubiertas (auth strategy, API design, modelo inicial DB). Deben ser coherentes con las specs funcionales ya existentes.

## Alcance

Crear exactamente cuatro ADRs técnicos en `docs/decisions/`:

| ADR | Nombre previsto | Tema |
|---|---|---|
| ADR-0005 | backend-framework | Decisión de framework backend: Express vs Fastify, estructura de proyecto, TypeScript config |
| ADR-0006 | auth-strategy | Estrategia de autenticación: JWT vs sesiones, almacenamiento, ciclo de vida de tokens |
| ADR-0007 | api-design | Diseño de API: REST, convenciones de rutas, versionado, formato de respuestas y errores |
| ADR-0008 | database-orm-initial-model | Base de datos y ORM: confirmación de PostgreSQL + Prisma, convenciones de schema, estrategia de migraciones |

Crear también el documento de sprint `docs/sprints/pre-sprint-00D-technical-adrs.md` (este archivo).

## Fuera de alcance

- Implementación de código (apps/, packages/, package.json).
- Configuración real de Prisma, schema.prisma o migraciones.
- Docker, CI/CD o infraestructura de despliegue.
- Configuración de framework (express.ts, fastify.ts, etc.).
- Frontend.
- Tests o verificaciones técnicas.
- Endpoints reales.
- Panel recruiter, empresa, IA avanzada, n8n, comunidad o monetización.
- ADR de infraestructura/despliegue (queda para un sprint posterior).
- Configuración ejecutable de agentes (.claude/skills/, hooks, settings).

## ADRs previstas con numeración

### ADR-0005: Backend framework

Debe cerrar la elección pendiente en ADR-0002 entre Express y Fastify. Debe incluir:

- Motivos de elección sobre la alternativa.
- Estructura de proyecto prevista (monorepo o no, carpetas principales).
- Decisión sobre TypeScript config (tsconfig, paths, strict mode).
- Consecuencias y riesgos.

### ADR-0006: Auth strategy

Debe completar la spec funcional de auth (M01) con la decisión técnica de implementación. Debe incluir:

- Elección entre JWT (stateless) y sesiones (stateful).
- Mecanismo de almacenamiento: localStorage, httpOnly cookie, Redis u otro.
- Ciclo de vida: expiración, refresh, revocación.
- Librería prevista (ej: jsonwebtoken, passport, lucia, iron-session).
- Cómo encaja con las rutas privadas definidas en auth.md.
- Consecuencias de seguridad y riesgos.

### ADR-0007: API design

Debe cerrar las convenciones de API usadas en todas las specs funcionales. Debe incluir:

- Elección REST (confirmación o alternativa tRPC si se evalúa).
- Convenciones de rutas (plural, kebab-case, versionado o no en MVP).
- Formato de respuesta estándar (envoltorio o respuesta plana).
- Formato de errores estándar (código, mensaje, detalles).
- Estrategia de paginación (cursor vs offset).
- Cómo se propaga la autenticación (header Authorization, cookie).
- Consecuencias y riesgos.

### ADR-0008: Database / ORM / initial model

Debe confirmar PostgreSQL + Prisma de ADR-0002 y añadir lo no cubierto. Debe incluir:

- Confirmación o ajuste de la elección PostgreSQL + Prisma.
- Convenciones de schema Prisma (nombres de modelos, campos, relaciones).
- Estrategia de migraciones (desarrollo vs producción).
- Entidades iniciales del MVP derivadas de las specs funcionales: User, CandidateProfile, Skill, Experience, Education, Project, Link, JobPreferences, Job, SavedJob.
- Campos obligatorios vs opcionales según specs.
- Estrategia de seed de datos para ofertas (M03 depende de datos mock).
- Consecuencias y riesgos.

## Metodología de trabajo

Antes de redactar cada ADR:

1. Confirmar rama activa y `git status --short`.
2. Leer el ADR previo relacionado si existe (especialmente ADR-0002 para ADR-0005 y ADR-0008).
3. Leer la spec funcional relacionada (auth.md para ADR-0006, todas las specs para ADR-0007 y ADR-0008).
4. Redactar el ADR siguiendo la estructura estándar del repositorio: Estado, Contexto, Decisión, Consecuencias, Riesgos.
5. Verificar coherencia con specs existentes antes de cerrar.

Cada ADR es un archivo independiente. Se pueden crear en paralelo o secuencialmente. El orden recomendado es: ADR-0005 → ADR-0006 → ADR-0007 → ADR-0008, ya que cada uno aporta contexto al siguiente.

## Criterios de aceptación

- [x] `docs/decisions/ADR-0005-backend-framework.md` existe con decisión clara sobre Express vs Fastify.
- [x] `docs/decisions/ADR-0006-auth-strategy.md` existe con decisión sobre JWT vs sesiones y librería prevista.
- [x] `docs/decisions/ADR-0007-api-design.md` existe con convenciones de rutas, respuestas y errores.
- [x] `docs/decisions/ADR-0008-database-orm-initial-model.md` existe con confirmación de PostgreSQL + Prisma, convenciones y entidades iniciales.
- [x] Cada ADR es coherente con las specs funcionales de Pre-Sprint 00C.
- [x] No se crea código, configuración técnica ni dependencias.
- [x] La auditoría quality/security devuelve PASS o PASS_WITH_NOTES.

## Verificaciones de cierre del sprint

```bash
git status --short
find docs/decisions docs/sprints -maxdepth 2 -type f | sort
git diff --stat
git diff --check
```

## Estado inicial

| Elemento | Estado |
|---|---|
| Rama de trabajo | `docs/pre-sprint-00d-technical-adrs` creada desde `dev` actualizado |
| Working tree | Limpio |
| ADRs existentes | ADR-0001 a ADR-0004 |
| Siguiente número disponible | ADR-0005 |
| ADRs pendientes de crear | ADR-0005, ADR-0006, ADR-0007, ADR-0008 |
| Specs funcionales base | Pre-Sprint 00C mergeado en `dev` |

## Próximos pasos

1. Redactar ADR-0005 (backend framework) leyendo ADR-0002 como referencia.
2. Redactar ADR-0006 (auth strategy) leyendo `docs/specs/features/auth.md`.
3. Redactar ADR-0007 (API design) leyendo todas las specs funcionales.
4. Redactar ADR-0008 (database/ORM) leyendo ADR-0002 y specs de datos.
5. Verificar coherencia cruzada entre los cuatro ADRs.
6. Aplicar auditoría quality/security.
7. Abrir PR `docs/pre-sprint-00d-technical-adrs` → `dev`.
