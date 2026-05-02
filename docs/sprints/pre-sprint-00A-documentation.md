# Pre-Sprint 00A: Base documental inicial

## Objetivo

Crear la primera base documental profesional de JobIT-platform para alinear vision de producto, alcance inicial, metodologia de trabajo y reglas de uso de agentes IA.

Este pre-sprint no implementa codigo. Su resultado debe ser una base clara para poder planificar sprints posteriores con menor riesgo de scope creep.

## Alcance

Incluye:

- Sustituir el README minimo por un README inicial profesional.
- Crear una guia de agentes IA en `AGENTS.md`.
- Crear el product brief inicial en `docs/product/00-product-brief.md`.
- Crear este documento de pre-sprint en `docs/sprints/pre-sprint-00A-documentation.md`.
- Documentar que el MVP inicial es candidate-first.
- Documentar fuera de alcance tecnico y funcional.

## Fuera de alcance

No se debe crear ni modificar:

- `apps/web`.
- `apps/api`.
- `packages`.
- `docker-compose.yml`.
- Prisma o configuracion de base de datos.
- `package.json`.
- Workflows de GitHub Actions.
- Dependencias.
- Configuracion tecnica inexistente.

Tampoco se debe introducir dentro del MVP:

- IA avanzada.
- Recruiter completo.
- Monetizacion.
- Comunidad real.
- Aplicacion movil.

## Entregables

- `README.md`.
- `AGENTS.md`.
- `docs/product/00-product-brief.md`.
- `docs/sprints/pre-sprint-00A-documentation.md`.

## Criterios de aceptacion

- Los cuatro archivos existen.
- El contenido esta en espanol.
- El README indica que el repositorio esta en fase documental.
- `AGENTS.md` sirve como guia real para Codex, Claude u otros agentes IA.
- El MVP se describe como candidate-first.
- El fuera de alcance queda documentado de forma explicita.
- No se ha creado codigo.
- No se han creado carpetas tecnicas de frontend, backend o paquetes.
- El working tree muestra solo cambios documentales.

## Checklist de cierre

- [ ] Rama activa comprobada.
- [ ] Working tree inicial comprobado.
- [ ] README actualizado.
- [ ] AGENTS.md creado.
- [ ] Product brief creado.
- [ ] Documento de pre-sprint creado.
- [ ] Sin codigo creado.
- [ ] Sin dependencias instaladas.
- [ ] Sin carpetas tecnicas creadas.
- [ ] `git status --short` ejecutado.
- [ ] `find . -maxdepth 3 -type f | sort` ejecutado.

## Siguiente sprint recomendado

Pre-Sprint 00B: definicion de arquitectura inicial y especificaciones funcionales del MVP candidate-first.

Objetivo sugerido:

- Definir decisiones tecnicas de alto nivel.
- Identificar modulos candidatos para el MVP.
- Crear especificaciones antes de implementar.
- Mantener fuera de alcance cualquier codigo hasta que las especificaciones esten aprobadas.

## Nota de evolucion

Durante Pre-Sprint 00B se formaliza el flujo SDD + TDD pragmatico + agentes IA controlados + auditoria quality/security + PR hacia `dev` + Docs as Code.

Esta evolucion no cambia el resultado de Pre-Sprint 00A: la base sigue siendo documental y no autoriza implementar frontend, backend, infraestructura, dependencias ni CI/CD.
