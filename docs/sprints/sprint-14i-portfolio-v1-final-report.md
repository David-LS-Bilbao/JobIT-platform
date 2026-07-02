# Informe cierre — JobIT Portfolio V1

## Estado

- **JobIT Portfolio V1: funcionalmente completada.**
- Fecha: 2026-07-02.
- Rama/PR de este informe: `docs/sprint-14i-portfolio-v1-final-report` → PR de docs contra `dev`.
- Integración: los sprints del módulo (14C–14H) están **mergeados en `dev`** (PRs #48–#54).

## Objetivo del módulo

- **JobIT CV** es el **editor privado** del perfil profesional del candidato (`/profile`): datos, avatar, skills, experiencia, educación, proyectos, enlaces, preferencias, preview y completitud.
- **JobIT Portfolio** es la **salida pública compartible** generada automáticamente desde el JobIT CV: una web de portfolio/CV en `/u/[slug]`, sin que el candidato tenga que programar ni mantener nada.
- **QR** y **print (guardar PDF con el navegador)** forman parte del flujo de **compartición**: enlace estable + QR para compartir, y versión imprimible tipo CV para enviar a empresas.

Es una funcionalidad real de producto, no una demo: publicación explícita, privacidad por defecto, control del candidato y tests.

## Alcance entregado

- Perfil editable previo (JobIT CV) ya disponible: datos profesionales, skills, experiencia, educación, proyectos, enlaces, preferencias, preview/completitud.
- **Avatar**: subida desde dispositivo (almacenamiento local MVP) + URL externa como opción avanzada; fallback a iniciales.
- **Settings de portfolio** privados (`/profile/portfolio/settings`): estado, slug, flags de visibilidad, publicar/despublicar, copiar enlace, QR.
- **Slug**: generado desde nombre, editable, normalizado, con palabras reservadas y unicidad.
- **Publicar / despublicar** con mínimo publicable y estado inmediato.
- **URL pública** estable `/u/[slug]` (sin login).
- **Endpoint público** `GET /api/public/portfolios/:slug` con **whitelist server-side**.
- **QR** generado localmente (sin servicios externos ni dependencias), apuntando a la URL pública absoluta, con descarga SVG.
- **Print / guardar PDF** vía `window.print()` con estilos de impresión.
- **noindex** por defecto en la ruta pública (privacidad V1).
- **Dev env hardening**: plantilla `apps/api/.env.example` corregida + guía de entorno local.

## Sprints y PRs incluidos

| Sprint | PR | Objetivo | Estado |
|---|---|---|---|
| 14C | #48 | `docs(spec): add JobIT Portfolio V1` — especificación SDD | Mergeada en `dev` |
| 14D | #49 | `feat(api): add portfolio settings backend` — modelo `PortfolioSettings`, migración, slug, endpoints privados, mínimo publicable | Mergeada en `dev` |
| 14E | #50 | `feat(web): add portfolio settings ui` — `/profile/portfolio/settings` | Mergeada en `dev` |
| 14F | #51 | `feat: add public portfolio route` — endpoint público whitelisted + `/u/[slug]` | Mergeada en `dev` |
| 14G | #52 | `feat(web): add portfolio qr` — QR local | Mergeada en `dev` |
| 14G.1 | #53 | `chore(api): document local env setup` — plantilla `.env` + guía CORS/DB | Mergeada en `dev` |
| 14H | #54 | `feat(web): polish public portfolio` — pulido/print/responsive/noindex | Mergeada en `dev` |
| 14I | (este) | `docs: JobIT Portfolio V1 final report` | En preparación |

## Flujo end-to-end

1. El candidato **inicia sesión**.
2. Completa su **JobIT CV** (`/profile`): datos, skills, experiencia, educación, proyectos, enlaces, preferencias.
3. **Sube su avatar** (o pega una URL de imagen).
4. Entra en **`/profile/portfolio/settings`**.
5. Revisa/edita su **slug** y los **flags** de visibilidad (ubicación, disponibilidad, preferencias).
6. **Publica** el portfolio (requiere el mínimo publicable).
7. **Copia el enlace** `/u/[slug]`.
8. **Escanea o descarga el QR** (apunta al enlace público).
9. Cualquiera **abre el portfolio público** en `/u/[slug]` **sin login**.
10. Desde el portfolio público, **imprime / guarda como PDF** con el navegador (la barra y la atribución se ocultan en la impresión).
11. **Despublica** cuando quiera: el enlace deja de mostrar datos al instante (404).

## Rutas y endpoints

Privados (requieren auth):

- `GET /api/profile/me/portfolio` — ajustes (se crean si no existen).
- `PUT /api/profile/me/portfolio` — actualiza slug y flags (no publica).
- `POST /api/profile/me/portfolio/publish` — publica si cumple el mínimo.
- `POST /api/profile/me/portfolio/unpublish` — despublica.

Público (sin auth):

- `GET /api/public/portfolios/:slug` — read model público por whitelist; 404 uniforme si no procede.

Frontend:

- `/profile/portfolio` — preview privada del portfolio/CV.
- `/profile/portfolio/settings` — gestión de publicación + QR.
- `/u/[slug]` — portfolio público (sin login).

## Seguridad y privacidad

- **No publicado por defecto** (`isPublished = false`).
- **Publicación explícita** por el candidato; **despublicación inmediata**.
- **404 uniforme** para slug **inexistente**, **no publicado** o **inválido** (no revela si un slug existe pero está despublicado).
- **Whitelist server-side**: la respuesta pública se construye en el backend; el frontend no es la barrera.
- La respuesta pública **nunca** incluye `userId`, email, `passwordHash`, tokens, **salario**, matches, guardadas ni `completionPercentage`.
- **Flags** de visibilidad: `showLocation`, `showAvailability`, `showPreferences` (preferencias **OFF** por defecto).
- **Salario nunca público** en V1, aunque `showPreferences=true`.
- **noindex** por defecto en `/u/[slug]` (metadata robots), por privacidad y control del candidato.

## Print/PDF

- V1 usa **`window.print()`** del navegador (guardar como PDF desde el diálogo de impresión).
- **No hay PDF server-side** ni dependencias de PDF.
- En impresión se **oculta el chrome público** (barra superior, botón de imprimir, atribución) con `print:hidden`; el CV se imprime limpio (fondo blanco, sobrio, `break-inside-avoid`).
- Decisión razonable para V1: cero infraestructura extra, resultado profesional y control total del usuario.

## QR

- **Generado localmente** en el cliente (encoder propio, modo byte, nivel M).
- **Sin servicios externos** de QR (ni APIs ni imágenes remotas) y **sin nuevas dependencias**.
- Apunta a la **URL pública absoluta** (`buildPublicPortfolioUrl` sobre `publicUrlPath`, con base configurable).
- **Descargable** como SVG; solo activo si el portfolio está publicado.
- **Limitación actual**: capado en versión 6 (~106 bytes ≈ URL de hasta ~106 caracteres), suficiente para base + `/u/` + slug (≤60); URLs más largas muestran un aviso en lugar de un QR roto.

## Configuración local/dev

- Plantilla **`apps/api/.env.example`** con placeholders seguros: incluye `CORS_ORIGIN=http://localhost:3001`, `DATABASE_URL`, `DATABASE_URL_TEST` y secretos JWT.
- **`CORS_ORIGIN` debe coincidir con el puerto real del frontend**: si el 3000 está ocupado (Docker) y el web corre en `:3001`, hay que usar `http://localhost:3001` (si no, el login falla por CORS).
- **`DATABASE_URL_TEST`**: base independiente (`jobit_test`) para los tests; nunca apuntar a `jobit_dev`.
- Guía detallada: **`docs/development/local-env.md`** (arranque API/Web, smoke de health y CORS con `curl`, uso de la base de test).

## Tests y verificaciones

Cada sprint se cerró con sus verificaciones (`typecheck`, `test`, `lint`, `build`, `git diff --check`) y auditoría quality/security; verificado en cada PR con los checks correspondientes. Cobertura destacada:

- **Backend**: settings de portfolio (GET/PUT/publish/unpublish), slug (formato, reservados, unicidad, generación), mínimo publicable, endpoint público (200/404, flags, **privacidad**: sin `userId`/email/salario/etc.). Suite backend en verde (referencia: 329/329 al cerrar 14F).
- **Frontend**: settings (publicar/despublicar, slug, errores accionables, copiar enlace), QR (generación local, gating, sin servicios externos), ruta pública `/u/[slug]` (sin token, sin datos privados, print, enlaces seguros, `noindex`, secciones vacías). Suite frontend en verde (referencia: 193/193 al cerrar 14H).
- La corrección del QR se validó **decodificando** su salida con un decoder independiente (fuera del repo) para varias URLs realistas.

## Fuera de alcance V1

- PDF server-side.
- Indexación configurable (toggle de `noindex`).
- GitHub helper / import de repos.
- Dominios personalizados.
- Analíticas / métricas de visitas.
- Panel recruiter avanzado.
- Monetización (planes, pricing, "Pro").
- IA (generación/scoring de textos).
- Temas visuales / plantillas múltiples.
- Histórico de slugs (cambiar el slug rompe enlaces previos).
- Almacenamiento en la nube (CDN/S3/Cloudinary) para avatares.

## Deuda técnica

- **`NEXT_PUBLIC_PUBLIC_BASE_URL` en producción**: necesario para que las URLs absolutas y el QR apunten al dominio público real (en dev se usa `window.location.origin`).
- **Servir `/uploads` desde host público**: los avatares se guardan en el FS de la API (MVP); en prod requieren un host accesible y persistente.
- **QR capado en versión 6** / URLs largas: ampliar a v7+ (info de versión) o validar el límite con escaneo real.
- **noindex global** hasta un toggle futuro "permitir indexación".
- **Tests flaky preexistentes** en `dashboard`/`match`/`jobs` (ordenación no determinista): han fallado-y-recuperado en varias ejecuciones; conviene un sprint de estabilización.
- **Deploy/staging**: sigue pendiente (Docker/CI-CD, dominio, DB staging, cookies cross-site/HTTPS).
- **Limpieza Tailwind v4**: quedan aliases `bg-gradient-to-br` en varios ficheros (funcionan, pero el IDE sugiere `bg-linear-to-br`); posible commit de limpieza global.
- **`apps/api/.env` local**: recordar crearlo desde `.env.example` para que reiniciar el backend no rompa CORS/BD.

## Recomendación siguiente

Tres caminos posibles:

1. **Jobs UI** (producto): completar la interfaz de Jobs / Saved Jobs / Match en `apps/web`, que sigue pendiente y es el siguiente slice de valor para el candidato.
2. **Estabilización de tests flaky** (calidad): aislar/determinizar los tests de `dashboard`/`match`/`jobs` para que la suite backend sea 100% fiable antes de crecer.
3. **GitHub helper** (Portfolio+): fase posterior de la spec — detectar el enlace de GitHub y facilitar añadir proyectos / import asistido (sin OAuth).

Recomendación clara según prioridad:

- **Para producto**: **Jobs UI** (mayor valor entregable para el candidato).
- **Para calidad**: **estabilización de tests flaky** (reduce riesgo antes de nuevas features).
- **Para Portfolio+**: **GitHub helper** (evoluciona el módulo ya entregado).

Sugerencia de orden: **estabilización de tests → Jobs UI → GitHub helper**, resolviendo antes la deuda de entorno (`apps/api/.env`) y de producción (`NEXT_PUBLIC_PUBLIC_BASE_URL`, `/uploads`) cuando se aborde el deploy.
