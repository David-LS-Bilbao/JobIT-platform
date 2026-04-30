# Pre-Sprint 00B.1: Arquitectura inicial documental

## Objetivo

Crear la primera documentacion de arquitectura de JobIT-platform antes de implementar codigo, manteniendo el foco en un MVP candidate-first y en decisiones tecnicas reversibles.

## Alcance

Incluye:

- Documentar la vision general de arquitectura.
- Proponer la estructura futura del repositorio sin crearla todavia.
- Definir los modulos funcionales previstos para el MVP.
- Registrar ADRs iniciales sobre arranque desde cero, stack previsto y flujo SDD con agentes IA.
- Mantener coherencia con `README.md`, `AGENTS.md`, `CLAUDE.md` y el product brief.

## Fuera de alcance

No incluye:

- Implementar frontend, backend o base de datos.
- Crear `apps/`, `packages/`, `docker/` o `scripts/`.
- Crear `package.json`, Prisma, Docker, workflows o CI/CD.
- Instalar dependencias.
- Configurar autenticacion real.
- Crear codigo de aplicacion.
- Ampliar el MVP mas alla del enfoque candidate-first.

## Entregables

- `docs/architecture/00-architecture-overview.md`.
- `docs/architecture/01-repository-structure.md`.
- `docs/architecture/02-mvp-modules.md`.
- `docs/decisions/ADR-0001-start-from-scratch.md`.
- `docs/decisions/ADR-0002-initial-stack.md`.
- `docs/decisions/ADR-0003-sdd-and-agent-workflow.md`.
- `docs/sprints/pre-sprint-00B-architecture.md`.

## Criterios de aceptacion

- Los documentos de arquitectura existen y estan en espanol.
- La arquitectura queda descrita, no implementada.
- El MVP queda limitado a candidate-first.
- El stack previsto queda documentado sin crear configuracion tecnica.
- Las ADRs explican decisiones reales y sus consecuencias.
- No se crea codigo ni configuracion ejecutable.
- El working tree muestra solo cambios documentales esperados para este sprint, salvo incidencias preexistentes documentadas.

## Checklist de cierre

- [ ] Rama activa comprobada.
- [ ] `git status --short` revisado antes de modificar.
- [ ] Documentacion base leida.
- [ ] Documentos de arquitectura creados.
- [ ] ADRs iniciales creadas.
- [ ] Sin codigo creado.
- [ ] Sin carpetas tecnicas creadas.
- [ ] Sin dependencias instaladas.
- [ ] Verificaciones finales ejecutadas.
- [ ] Riesgos o dudas documentados.

## Siguiente paso recomendado

Pre-Sprint 00B.2: crear specs funcionales iniciales para el MVP candidate-first, empezando por Auth conceptual, Candidate Profile y CV/Profile Tech, sin implementar codigo hasta aprobar las specs.
