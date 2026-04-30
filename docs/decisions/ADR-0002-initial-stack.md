# ADR-0002: Stack inicial previsto

## Estado

Aprobada documentalmente.

## Contexto

JobIT-platform necesitara una base fullstack moderna, modular y mantenible para construir el MVP candidate-first y evolucionar hacia modulos futuros.

En el Pre-Sprint 00B.1 no se implementa el stack. Solo se documenta la decision inicial para orientar specs tecnicas posteriores.

## Decision

El stack inicial previsto es:

- Frontend: Next.js + TypeScript + Tailwind.
- Backend: Node.js + TypeScript con Express o Fastify.
- Base de datos: PostgreSQL + Prisma.
- Deploy futuro: Docker + VPS + Nginx o Nginx Proxy Manager.

## Consecuencias

Positivas:

- TypeScript permite compartir tipos y mejorar consistencia.
- Next.js ofrece una base solida para la aplicacion web.
- Node.js facilita mantener backend y frontend en el mismo ecosistema.
- PostgreSQL aporta una base relacional robusta.
- Prisma puede simplificar modelado y acceso a datos.
- Docker, VPS y Nginx permiten un despliegue futuro controlado.

Costes:

- Requiere definir convenciones de monorepo antes de implementar.
- Express o Fastify deben decidirse en una spec tecnica posterior.
- Prisma introduce una capa que debe gestionarse con migraciones cuidadosas.
- El despliegue en VPS exige disciplina operativa y seguridad.

## Estado de implementacion

El stack esta decidido documentalmente, pero no implementado.

No existen `apps/`, `packages/`, `package.json`, Prisma, Docker, workflows ni configuracion de despliegue en esta fase.
