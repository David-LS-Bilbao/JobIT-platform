# Arquitectura 00: Vision general

## Vision general

JobIT-platform se plantea como una plataforma fullstack modular de empleo tecnologico. La arquitectura debe permitir evolucionar desde un MVP candidate-first hacia una plataforma mas amplia sin introducir complejidad prematura.

Esta documentacion define la arquitectura prevista. No implementa codigo, configuracion, infraestructura ni carpetas tecnicas.

## MVP candidate-first

La primera version debe priorizar la experiencia del candidato:

- Gestionar perfil profesional.
- Representar CV/perfil tech.
- Organizar skills, experiencia, educacion y proyectos.
- Explorar o guardar ofertas.
- Obtener un match basico explicable.
- Ofrecer un dashboard inicial del candidato.

Recruiters, ATS, comunidad, monetizacion e IA avanzada quedan fuera del MVP inicial.

## Monorepo previsto

El proyecto se documenta como un monorepo futuro para mantener cerca las piezas principales del producto, compartir tipos y separar responsabilidades.

La estructura se creara solo cuando exista una spec tecnica aprobada.

## Separacion futura de capas

Separacion prevista:

- `apps/web`: aplicacion frontend.
- `apps/api`: API backend.
- `packages/database`: schema, cliente y utilidades de base de datos.
- `packages/shared`: tipos, contratos y utilidades compartidas.
- `packages/ui`: componentes reutilizables.
- `docs/`: documentacion de producto, arquitectura, decisiones y agentes.

Estas carpetas son una propuesta arquitectonica. No existen todavia por decision del Pre-Sprint 00B.1.

## Backend modular API-first

El backend se concibe como una API modular, con separacion clara por dominios funcionales. La API debe servir primero a la experiencia web del candidato y dejar espacio para futuras superficies sin acoplar la logica a una unica interfaz.

Principios previstos:

- Modulos por dominio.
- Contratos claros entre frontend y backend.
- Validacion de entrada.
- Separacion entre rutas, casos de uso y persistencia.
- Evolucion incremental segun specs aprobadas.

## Base de datos prevista

La base prevista es PostgreSQL con Prisma como capa de modelado y acceso a datos.

Esta decision es documental. En esta fase no se crea schema, cliente, migraciones ni configuracion de Prisma.

## Deploy futuro

El despliegue futuro se orienta a Docker sobre VPS, con Nginx o Nginx Proxy Manager como capa de entrada.

En esta fase no se crea Docker, `docker-compose.yml`, configuracion de VPS, Nginx, certificados ni workflows de despliegue.

## Seguridad desde el inicio

Aunque no se implemente todavia, la arquitectura debe considerar seguridad desde las primeras specs:

- No introducir secretos en el repositorio.
- Validar datos de entrada.
- Definir autenticacion antes de implementarla.
- Separar permisos y roles cuando existan.
- Revisar riesgos antes de mergear.
- Mantener cambios pequenos y revisables.

## Estado de implementacion

No hay implementacion tecnica en este sprint. La arquitectura queda descrita para guiar specs y tareas futuras.
