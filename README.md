# JobIT-platform

JobIT es una plataforma fullstack modular de empleo tecnologico. Su objetivo es ayudar a profesionales tech a gestionar mejor su busqueda laboral, preparar su perfil y conectar con oportunidades relevantes.

El repositorio se encuentra en fase documental inicial. En esta etapa no se implementa frontend, backend, base de datos, Docker, autenticacion, CI/CD ni ninguna configuracion tecnica.

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

Nada de este stack esta implementado todavia en el repositorio. Su adopcion requiere especificaciones tecnicas aprobadas en sprints posteriores.

## Estado actual del repositorio

Estado: fase documental inicial.

El objetivo actual es crear una base clara para alinear producto, alcance, metodologia, calidad, seguridad y trabajo con agentes IA antes de escribir codigo.

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
    │   └── spec-template.md
    └── sprints
        ├── pre-sprint-00A-documentation.md
        └── pre-sprint-00B-architecture.md
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

El siguiente paso recomendado es completar Pre-Sprint 00B con la gobernanza de flujo, arquitectura inicial y primeras specs funcionales del MVP candidate-first, sin implementar todavia codigo hasta que el alcance este aprobado.
