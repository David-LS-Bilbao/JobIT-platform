# Arquitectura 01: Estructura futura del repositorio

## Proposito

Este documento propone una estructura futura para JobIT-platform. La estructura no se crea todavia y no implica implementacion.

## Estructura prevista

```text
.
├── apps
│   ├── web
│   └── api
├── packages
│   ├── database
│   ├── shared
│   └── ui
├── docs
│   ├── agents
│   ├── architecture
│   ├── decisions
│   ├── product
│   └── sprints
├── docker
└── scripts
```

## Responsabilidades previstas

### `apps/web`

Aplicacion frontend del producto. Stack previsto: Next.js, TypeScript y Tailwind.

No se crea en este sprint.

### `apps/api`

API backend modular. Stack previsto: Node.js y TypeScript con Express o Fastify.

No se crea en este sprint.

### `packages/database`

Capa futura de base de datos, Prisma, modelos y utilidades de persistencia.

No se crea en este sprint.

### `packages/shared`

Tipos, contratos y utilidades compartidas entre web, API y otros paquetes.

No se crea en este sprint.

### `packages/ui`

Componentes UI reutilizables cuando el frontend lo necesite.

No se crea en este sprint.

### `docs/`

Documentacion de producto, arquitectura, sprints, decisiones y agentes IA. Esta es la unica zona activa en la fase documental.

### `docker/`

Configuracion futura de contenedores y despliegue local o servidor.

No se crea en este sprint.

### `scripts/`

Scripts operativos futuros para tareas repetibles.

No se crea en este sprint.

## Regla de activacion

Cada carpeta tecnica debe crearse solo cuando exista una spec o ADR que justifique su necesidad, alcance, verificaciones y criterios de aceptacion.
