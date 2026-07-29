# JobIT-platform

JobIT es una plataforma fullstack modular de empleo tecnológico, orientada primero a
candidatos y diseñada con criterios de producción. Permite construir un perfil
profesional, explorar y guardar ofertas, consultar afinidades explicables y presentar
un portfolio público.

El producto candidate-first está implementado en local y cubierto por pruebas. La
preparación de despliegue en staging está documentada y verificada localmente, pero no
hay un despliegue real en VPS acreditado. Tampoco debe interpretarse la documentación
legal existente como una declaración de cumplimiento: las decisiones especializadas
del tramo legal pendiente siguen bloqueando la publicación de superficies legales.

## Estado actual

La última entrega integrada en `dev` es el **Sprint 25 — Landing Public Surface
Hardening**. La landing pública incluye navegación responsive, preview con datos
sintéticos, contraste AA, skip link, reduced motion, objetivos táctiles y metadatos
sociales sin inventar dominio, canonical ni imágenes.

Hitos recientes:

- **Sprint 23:** guardas de seguridad para bases de datos de test y seed interno
  idempotente, sin borrado global de ofertas.
- **Sprint 24:** inventario de datos, política de superficies públicas y gate de
  decisiones legales en documentos públicos sanitizados. El tramo de revisión legal
  especializada continúa pendiente.
- **Sprint 25:** hardening de la landing pública y su cobertura Vitest/Playwright.

Los informes de sprint son registros históricos. Para conocer el estado vigente deben
contrastarse con el código, las specs activas y esta documentación de arquitectura.

## Capacidades implementadas

- **Auth:** registro, login, logout y consulta de usuario autenticado.
- **Candidate Profile & CV:** perfil, skills, experiencia, educación, proyectos,
  enlaces y preferencias.
- **Portfolio:** edición, configuración y superficie pública `/u/[slug]`.
- **Jobs:** listado, filtros, paginación y detalle de ofertas persistidas.
- **Fuentes externas:** ingesta backend-only, manual y controlada desde Jooble y
  Greenhouse; las lecturas del candidato se sirven desde PostgreSQL.
- **Saved Jobs:** guardado idempotente, listado y eliminación con ownership.
- **Match explicable:** puntuación determinista basada en reglas visibles; no usa
  LLM, embeddings ni modelos opacos.
- **Candidate Dashboard:** resumen agregado de perfil, skills, guardados, matches y
  próximos pasos.
- **Landing pública:** presentación candidate-first accesible y responsive.

No están implementados el módulo recruiter completo, un ATS propio, candidaturas
internas, monetización, comunidad, aplicación móvil ni IA avanzada.

## Stack

| Capa | Tecnología |
|---|---|
| Web | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| API | Node.js 20, Express 5, TypeScript, Zod |
| Datos | PostgreSQL, Prisma 6 |
| Tests | Vitest, Testing Library, Supertest, Playwright |
| Calidad | ESLint, typecheck TypeScript, build por workspace |
| CI | GitHub Actions, workflow `JobIT CI` con jobs API y Web |
| Staging preparado | Docker y Docker Compose; despliegue real pendiente |

El repositorio usa `pnpm@10.0.0`.

## Estructura del repositorio

```text
.
├── apps
│   ├── api          # API Express, Prisma, módulos de dominio e ingestas
│   └── web          # Aplicación Next.js candidate-first
├── docs
│   ├── agents       # Modelo operativo, skills, checklists y plantillas
│   ├── architecture # Arquitectura y estructura vigentes
│   ├── decisions    # ADRs históricos
│   ├── deployment   # Preparación y runbook de staging
│   ├── development  # Entorno local
│   ├── legal        # Documentos públicos; privados locales fuera de Git
│   ├── product      # Brief de producto vigente
│   ├── specs        # Contratos funcionales y técnicos
│   └── sprints      # Planes e informes históricos
├── packages         # Reserva de monorepo; sin paquetes compartidos activos
├── docker-compose.staging.yml
├── pnpm-workspace.yaml
└── package.json
```

Más detalle:

- [Visión de arquitectura](docs/architecture/00-architecture-overview.md)
- [Estructura del repositorio](docs/architecture/01-repository-structure.md)
- [Módulos candidate-first](docs/architecture/02-mvp-modules.md)
- [Fuentes de ofertas y búsqueda](docs/architecture/03-job-sources-and-search.md)

## Puesta en marcha local

Trabaja desde el clon nativo de WSL:

```text
/home/david/projects/JobIT-platform
```

No compartas `node_modules` con un checkout de Windows/OneDrive. Antes de instalar o
ejecutar tooling consulta
[el entorno operativo](docs/agents/operating-environment.md) y
[la guía local](docs/development/local-env.md).

Preparación mínima:

```bash
pnpm install --frozen-lockfile
cp apps/api/.env.example apps/api/.env
pnpm --filter @jobit/api exec prisma generate
pnpm --filter @jobit/api exec prisma migrate deploy
```

Completa `apps/api/.env` solo con valores locales y no publiques su contenido. Usa
una base de desarrollo y otra base exclusiva para tests.

Arranque, en dos terminales:

```bash
pnpm --filter @jobit/api dev
pnpm --filter @jobit/web dev
```

Valores locales habituales:

- API: `http://localhost:4000`
- Web: `http://localhost:3000`
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`
- `CORS_ORIGIN` debe coincidir con el origen real del frontend.

Consulta [apps/web/README.md](apps/web/README.md) para rutas y verificaciones del
frontend.

## Calidad y pruebas

Comandos equivalentes a los gates principales:

```bash
pnpm --filter @jobit/api exec prisma generate
pnpm --filter @jobit/api typecheck
pnpm --filter @jobit/api test
pnpm --filter @jobit/api build

pnpm --filter @jobit/web lint
pnpm --filter @jobit/web typecheck
pnpm --filter @jobit/web test
pnpm --filter @jobit/web build
```

El smoke E2E se ejecuta localmente contra el stack preparado:

```bash
pnpm --filter @jobit/web test:e2e
```

Los conteos cambian con cada entrega; el workflow `JobIT CI` y la ejecución local
son la fuente de verdad. Las PR hacia `dev` deben superar los jobs independientes
`API (typecheck + test + build)` y `Web (lint + typecheck + test + build)`.

## Seguridad y límites operativos

- Los `.env` reales y secretos nunca se versionan ni se copian a logs o PR.
- `DATABASE_URL_TEST` es obligatoria para los tests de API y debe apuntar a una base
  dedicada que el runner pueda migrar y truncar.
- El seed interno valida el destino antes de conectar, opera solo sobre su namespace
  `jobit-seed-*` y conserva ofertas externas o internas ajenas a ese namespace.
- Jooble requiere una API key solo en backend; Greenhouse usa su Job Board API
  pública y una lista curada versionada.
- No hay scraping ni consultas a proveedores durante las requests del candidato.
- El access token del frontend vive en memoria; el refresh token se gestiona en una
  cookie HttpOnly. No existe todavía un endpoint de refresh de sesión.
- Las superficies legales públicas siguen sujetas al gate documentado en
  [Sprint 24](docs/sprints/sprint-24-legal-decision-gate-report.md).
- Docker y el runbook de staging están preparados, pero DNS, proxy/SSL, secretos de
  entorno y despliegue real requieren autorización y verificación separadas.

## Flujo de trabajo

JobIT usa el contrato SDD + TDD + AI Audit:

```text
dev actualizado
  -> rama corta
  -> spec
  -> tests mínimos
  -> implementación
  -> verificación local
  -> auditoría quality/security
  -> documentación
  -> revisión humana
  -> commit/push autorizados
  -> PR hacia dev
```

No se trabaja directamente en `main` ni en `dev`. El modelo operativo canónico es
[docs/agents/jobit-operating-model-v2.md](docs/agents/jobit-operating-model-v2.md).

## Documentación principal

- [Product brief](docs/product/00-product-brief.md)
- [Entorno local](docs/development/local-env.md)
- [Specs de funcionalidades](docs/specs/features/)
- [ADRs](docs/decisions/)
- [Preparación de staging](docs/deployment/staging-env.md)
- [Runbook de staging](docs/deployment/staging-vps-deploy-runbook.md)
- [Informes de sprint](docs/sprints/)

Los nombres históricos que incluyen `mvp` se mantienen para preservar enlaces y
trazabilidad; no describen a JobIT como prototipo ni autorizan ampliar alcance.
