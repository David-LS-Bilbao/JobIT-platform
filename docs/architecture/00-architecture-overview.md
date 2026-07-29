# Arquitectura 00: Visión general

## Propósito

Este documento describe la arquitectura implementada de JobIT y sus límites
operativos actuales. JobIT es un monorepo fullstack candidate-first con dos
aplicaciones activas: frontend Next.js y API Express.

## Vista de alto nivel

```text
Navegador
  |
  | HTTPS/HTTP + JSON, Bearer access token y cookie de refresh
  v
apps/web (Next.js, React, App Router)
  |
  | NEXT_PUBLIC_API_BASE_URL
  v
apps/api (Express, Zod, módulos de dominio)
  |
  | Prisma
  v
PostgreSQL

Proveedores externos
  -> scripts backend-only de ingesta manual
  -> normalización y upsert
  -> PostgreSQL
  -> API pública sanitizada
```

Las requests del candidato no consultan Jooble ni Greenhouse en vivo. Trabajan con
ofertas ya persistidas.

## Aplicación web

`apps/web` usa Next.js 16, React 19, TypeScript, Tailwind CSS 4 y App Router.

Responsabilidades:

- superficies públicas de landing, auth y portfolio;
- rutas privadas de dashboard, perfil, jobs, guardados y match;
- estados de carga, error y vacío;
- navegación responsive y accesibilidad;
- cliente HTTP tipado contra la API;
- gestión del access token exclusivamente en memoria.

El web no conoce secretos de proveedores ni accede directamente a PostgreSQL.

## API

`apps/api` usa Node.js 20, Express 5, TypeScript, Zod, Prisma y PostgreSQL.

Módulos montados:

- health;
- auth;
- profile y portfolio;
- portfolio público;
- dashboard;
- jobs;
- saved jobs;
- match.

La API valida entradas, aplica autenticación y ownership donde corresponde, separa
routers, servicios y persistencia, y usa un DTO público de oferta para ocultar
`externalId` e `ingestedAt`.

## Datos

Prisma mantiene el modelo y las migraciones de PostgreSQL dentro de `apps/api/prisma`.
Las pruebas de integración requieren `DATABASE_URL_TEST` y rechazan destinos que no
se clasifiquen como base dedicada de test.

El seed interno:

- valida el destino antes de crear el cliente;
- usa identificadores estáticos `jobit-seed-*`;
- hace upsert idempotente;
- actualiza solo campos permitidos de su namespace;
- no ejecuta un borrado global;
- preserva ofertas externas y ofertas internas ajenas al dataset.

## Autenticación y sesión

- Registro y login emiten un access token para el cliente.
- El access token se conserva en memoria del frontend.
- El refresh token se persiste en backend y se entrega mediante cookie HttpOnly.
- Las requests autenticadas usan `Authorization: Bearer` y
  `credentials: "include"`.
- Logout revoca la sesión y el cliente limpia su estado aunque la llamada falle.
- No existe todavía `POST /api/auth/refresh`; una recarga o expiración obliga a
  iniciar sesión de nuevo.

Cookies, CORS y URLs públicas deben revisarse con valores reales antes de cualquier
despliegue.

## Ofertas multi-fuente

La arquitectura externa sigue el patrón:

```text
client -> normalizer -> ingest service -> PostgreSQL -> JobPublicDto
```

- `INTERNAL`: dataset local controlado.
- `JOOBLE`: proveedor activo, con API key backend-only.
- `GREENHOUSE`: proveedor activo sobre Job Board API pública y empresas curadas.
- `ADZUNA`: reservado en el enum; sin integración activa.

Las ingestas son scripts manuales, idempotentes y no exponen endpoints de
administración. No hay scheduler ni scraping.

## Calidad

Vitest cubre unidades e integración; Supertest prueba la API; Testing Library prueba
el frontend; Playwright cubre flujos E2E localizados. GitHub Actions ejecuta dos jobs
independientes:

- `API (typecheck + test + build)`;
- `Web (lint + typecheck + test + build)`.

El E2E completo sigue siendo una verificación local/manual y no sustituye los gates
del CI.

## Despliegue

Existen Dockerfiles, `docker-compose.staging.yml`, documentación de entorno y un
runbook de VPS. Esa preparación se verificó localmente, pero no acredita:

- servidor provisionado;
- DNS;
- reverse proxy ni certificados;
- secretos de staging;
- observabilidad;
- backups;
- despliegue real.

Toda acción de infraestructura requiere autorización separada.

## Seguridad, privacidad y legal

- No se versionan secretos ni `.env` reales.
- Helmet, CORS explícito, validación y ownership forman parte de la API.
- Las ofertas públicas ocultan campos internos de ingesta.
- La landing usa preview y copy sintéticos.
- Los documentos legales privados permanecen locales, ignorados y fuera de tracking.
- La documentación pública de Sprint 24 no equivale a asesoramiento ni certificación
  de cumplimiento.
- No deben publicarse rutas o textos legales hasta resolver el gate especializado.

## Límites arquitectónicos

No existen actualmente:

- paquetes compartidos activos en `packages/`;
- servicio recruiter o empresarial;
- ATS o candidatura interna;
- IA avanzada;
- ingesta programada;
- refresh completo de sesión;
- deploy productivo acreditado.

Una nueva capa, integración o superficie requiere spec y, cuando cambie una decisión
estructural, ADR.

## Referencias

- [Estructura del repositorio](01-repository-structure.md)
- [Módulos candidate-first](02-mvp-modules.md)
- [Fuentes de ofertas](03-job-sources-and-search.md)
- [Entorno local](../development/local-env.md)
- [ADRs](../decisions/)
- [Modelo operativo](../agents/jobit-operating-model-v2.md)
