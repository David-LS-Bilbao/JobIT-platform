# JobIT Web

Frontend candidate-first de JobIT. Es una aplicación Next.js con App Router,
TypeScript, React y Tailwind CSS que consume la API de `apps/api`.

## Requisitos

- Node.js 20.
- `pnpm@10.0.0`.
- Dependencias instaladas desde la raíz del monorepo.
- API local disponible y configurada.

Consulta antes [la guía de entorno local](../../docs/development/local-env.md).

## Configuración

El cliente necesita una URL pública de API:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

Puede definirse en `apps/web/.env.local`, que debe permanecer fuera de Git. Para las
URLs absolutas y QR del portfolio público se usa `NEXT_PUBLIC_PUBLIC_BASE_URL` cuando
el entorno lo requiera. No inventes un dominio de producción si todavía no está
aprobado.

El backend debe permitir mediante `CORS_ORIGIN` el origen exacto donde corre el web.
Si Next.js cambia del puerto `3000` al `3001`, ajusta CORS y reinicia la API.

## Desarrollo

Desde la raíz del repositorio:

```bash
pnpm --filter @jobit/web dev
```

La dirección habitual es `http://localhost:3000`. Para fijar otro puerto:

```bash
pnpm --filter @jobit/web exec next dev -p 3001
```

## Rutas implementadas

| Ruta | Acceso | Propósito |
|---|---|---|
| `/` | Público | Landing candidate-first accesible y responsive |
| `/login` | Público | Inicio de sesión |
| `/register` | Público | Registro de candidato |
| `/dashboard` | Privado | Resumen del candidato |
| `/profile` | Privado | Edición de perfil y CV |
| `/profile/portfolio` | Privado | Edición del portfolio |
| `/profile/portfolio/settings` | Privado | Publicación y configuración |
| `/u/[slug]` | Público | Portfolio publicado |
| `/jobs` | Privado | Búsqueda y filtros de ofertas |
| `/jobs/[id]` | Privado | Detalle, guardado y match explicable |
| `/saved-jobs` | Privado | Ofertas guardadas |
| `/match` | Privado | Mejores afinidades explicadas |

Las páginas privadas usan el contexto de autenticación. El access token se mantiene
solo en memoria y las peticiones se envían con `credentials: "include"`. Un `401`
limpia la sesión cliente y conduce de nuevo al login. Actualmente no existe un
endpoint de refresh de sesión.

## Verificaciones

```bash
pnpm --filter @jobit/web lint
pnpm --filter @jobit/web typecheck
pnpm --filter @jobit/web test
pnpm --filter @jobit/web build
```

Tests E2E contra el stack local preparado:

```bash
pnpm --filter @jobit/web test:e2e
```

Para ejecutar solo el hardening de la landing:

```bash
pnpm --filter @jobit/web exec vitest run src/app/page.test.tsx
pnpm --filter @jobit/web exec playwright test \
  e2e/landing-public-surface.spec.ts --project=chromium
```

Playwright necesita navegadores instalados y servicios locales compatibles con su
configuración. No instales dependencias ni navegadores como efecto lateral de una
revisión.

## Límites actuales

- No hay candidaturas internas: cuando una oferta externa tiene una URL válida, la
  inscripción ocurre en el origen.
- El match es heurístico, determinista y explicable; no usa IA avanzada.
- La landing y el preview usan contenido sintético sin marcas de terceros.
- No hay rutas legales públicas autorizadas mientras siga abierto el gate de Sprint
  24.
- La configuración de deploy real no se deduce del boilerplate de Next.js; consulta
  la documentación de staging del repositorio.

## Referencias

- [README principal](../../README.md)
- [Arquitectura](../../docs/architecture/00-architecture-overview.md)
- [Fuentes de ofertas](../../docs/architecture/03-job-sources-and-search.md)
- [Spec de la landing](../../docs/specs/features/landing-public-surface.md)
