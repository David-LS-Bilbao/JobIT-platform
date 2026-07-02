# Spec: JobIT Portfolio V1 (M14)

> Estado: propuesta SDD (Sprint 14C). Documentación previa a implementación. No
> introduce código, Prisma, backend ni frontend. Fuente de verdad de contratos:
> `apps/api/src/**` cuando se implemente.

## Objetivo

Definir **JobIT Portfolio V1** como funcionalidad central del producto: cada
candidato puede **publicar un portfolio profesional generado automáticamente**
desde su JobIT CV, alojado dentro de JobIT, accesible mediante una **URL pública
estable** (`/u/:slug`) y un **código QR**, con una **versión imprimible** tipo CV.

No es una demo: es una salida pública real, controlada por el usuario, con
publicación explícita, despublicación inmediata, privacidad por defecto y tests.

## Usuario afectado

Candidato tech registrado y autenticado en JobIT que ya usa JobIT CV (`/profile`)
y su portfolio imprimible privado (`/profile/portfolio`, Sprint 14A/14B).

## Problema que resuelve

El candidato **no quiere programar ni mantener** un portfolio web propio (como el
portfolio manual de referencia `https://david.davlos.es/`, hecho con un proyecto
independiente). Quiere **compartir una URL profesional** generada desde su perfil
vivo, que se **actualice sola** cuando edita su JobIT CV, sin tocar código.

## Concepto de producto

| Pieza | Qué es | Acceso |
|---|---|---|
| **JobIT CV** | Editor del perfil profesional | Privado (`/profile`) |
| **JobIT Portfolio** | Salida pública compartible del perfil | Público (`/u/:slug`) tras publicar |
| **CV imprimible** | Versión print/PDF del portfolio (navegador) | Botón en portfolio |

El Portfolio es una **proyección en vivo** del `CandidateProfile` filtrada por una
whitelist de campos públicos y por los flags de `PortfolioSettings`. **No es un
snapshot**: al editar el JobIT CV, el portfolio público refleja los cambios sin
republicar (ver "Reglas de negocio").

## Flujo principal

1. El candidato completa su JobIT CV (datos, avatar, skills, experiencia,
   educación, proyectos, enlaces, preferencias).
2. Revisa cómo se verá su portfolio (preview del propio `/profile/portfolio`).
3. Elige/edita su **slug** y **publica** explícitamente.
4. Copia el **enlace público** (`/u/:slug`).
5. Descarga o muestra el **QR** que apunta a ese enlace.
6. Comparte el enlace/QR (LinkedIn, CV, firma, evento).
7. Cualquiera abre `/u/:slug` sin login y puede **imprimir / guardar PDF**.

## Flujo publicar / despublicar

- El portfolio **no está publicado por defecto** (`isPublished = false`).
- **Publicación explícita**: acción del usuario (`POST …/publish`) que valida el
  mínimo publicable (ver Reglas de negocio) y fija `publishedAt`.
- **Despublicación inmediata** (`POST …/unpublish`): `isPublished = false`; la ruta
  pública deja de servir datos **al instante**.
- Con el portfolio no publicado (o slug inexistente), la ruta pública devuelve
  **404 / estado "no disponible"** — nunca datos del perfil.

## Modelo de datos propuesto

Nueva tabla `PortfolioSettings` (1:1 con `User`/`CandidateProfile`). No modifica el
modelo actual de perfil; lo complementa.

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Clave primaria |
| userId | UUID | FK a User (1:1), único |
| slug | string | Único, lowercase, `[a-z0-9-]`, validado y reservado |
| isPublished | boolean | Default `false` |
| publishedAt | datetime | Null hasta la primera publicación |
| showLocation | boolean | Default `true` — muestra ubicación general |
| showAvailability | boolean | Default `true` — muestra estado de disponibilidad |
| showPreferences | boolean | Default `false` — preferencias (subconjunto seguro, sin salario) |
| createdAt | datetime | Automático |
| updatedAt | datetime | Automático |

Decisiones de alcance del modelo:
- **V1 mínimo obligatorio**: `slug`, `isPublished`, `publishedAt`.
- **Flags de visibilidad** (`showLocation`, `showAvailability`, `showPreferences`)
  se incluyen porque son baratos y refuerzan privacidad; `showPreferences` por
  defecto **OFF** (las preferencias son datos sensibles). Enlaces, skills,
  experiencia, educación y proyectos son públicos por defecto (sin flag en V1).
- **No** se guarda HTML renderizado ni snapshot: el portfolio se compone en cada
  petición desde el perfil vivo.

## Slug

Reglas:

- **Único** entre todos los usuarios (índice único en DB).
- **lowercase**; solo **letras, números y guiones**: `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$` (3–40 chars, sin guiones al inicio/fin ni dobles recomendados).
- **Generado inicialmente** desde `firstName`/`lastName` (p. ej. `ana-perez`),
  con sufijo numérico si colisiona (`ana-perez-2`).
- **Editable** por el usuario (con revalidación de formato, reservados y unicidad).
- **Palabras reservadas** rechazadas (colisión con rutas del producto), lista no
  exhaustiva y ampliable: `admin`, `api`, `app`, `auth`, `login`, `register`,
  `logout`, `dashboard`, `profile`, `settings`, `jobs`, `saved-jobs`, `match`,
  `u`, `public`, `uploads`, `assets`, `static`, `about`, `help`, `terms`,
  `privacy`, `support`, `null`, `undefined`.

## Endpoints backend propuestos

Privados (requieren auth; namespace coherente con `profile`):

| Método | Ruta | Descripción |
|---|---|---|
| GET | /api/profile/me/portfolio | Ajustes del portfolio del usuario (slug, isPublished, flags, URL pública) |
| PUT | /api/profile/me/portfolio | Actualiza slug y flags de visibilidad |
| POST | /api/profile/me/portfolio/publish | Valida mínimo y publica (`isPublished=true`, `publishedAt`) |
| POST | /api/profile/me/portfolio/unpublish | Despublica (`isPublished=false`) |

Público (sin auth):

| Método | Ruta | Descripción |
|---|---|---|
| GET | /api/public/portfolios/:slug | Portfolio público por slug si está publicado; 404 si no |

Notas de convención: los nombres se ajustarán al patrón del backend en la
implementación (routers por feature, `requireAuth` en privados, `{ error: { code,
message } }` en errores). El endpoint público vive bajo `/api/public/**` para
separar claramente la superficie sin auth.

## Rutas frontend propuestas

Privadas:

- `/profile/portfolio` — preview del portfolio + acciones (ya existe en 14A/14B).
- `/profile/portfolio/settings` — gestión: slug, publicar/despublicar, enlace, QR,
  flags de visibilidad. (Alternativa: integrar en `/profile/portfolio` si resulta
  más simple; decisión de implementación al abrir 14E.)

Pública:

- `/u/:slug` — portfolio público, sin login.

Print:

- **V1**: botón "Imprimir / Guardar PDF" dentro de `/u/:slug` (print del
  navegador), reutilizando el patrón de estilos `print:` del Sprint 14A. **No** se
  crea `/u/:slug/print` en V1 salvo que se justifique un layout de impresión
  distinto en un sprint posterior.

## Datos públicos vs privados

Whitelist aplicada **en backend** (no depender del frontend):

| Campo | ¿Público por defecto? | Nota |
|---|---|---|
| Nombre (firstName/lastName o "Candidato tech") | Sí | — |
| Avatar (avatarUrl) | Sí | Resuelto a URL absoluta pintable |
| Headline | Sí | — |
| Resumen (summary) | Sí | — |
| Ubicación (location) | Solo si `showLocation` | Ubicación general, no dirección |
| Disponibilidad (availabilityStatus) | Solo si `showAvailability` | Etiqueta humanizada |
| Skills | Sí | name + level |
| Experiencia | Sí | company, role, fechas, descripción, location |
| Educación | Sí | institution, title, field, fechas |
| Proyectos | Sí | name, description, technologies, url, repoUrl |
| Enlaces | Sí | type + url (`rel="noopener noreferrer"`, `target="_blank"`) |
| Preferencias (subconjunto) | Solo si `showPreferences` | Roles/modalidad/seniority; **nunca** salario |

Nunca públicos (excluidos siempre del endpoint público):

- Salario (`salaryMin`/`salaryMax`), preferencias internas completas.
- `completionPercentage`.
- Email de cuenta, datos de auth/tokens, `passwordHash`.
- `userId` interno (el slug es el identificador público).
- Matches, guardadas, dashboard y cualquier dato de otras features.

### Modelo de respuesta pública (`GET /api/public/portfolios/:slug`)

Ejemplo conceptual (solo campos whitelisted; `null`/omitido según flags):

```json
{
  "slug": "ana-perez",
  "publishedAt": "2026-07-02T00:00:00.000Z",
  "name": "Ana Pérez",
  "avatarUrl": "https://<api>/uploads/avatars/….png",
  "headline": "Frontend Developer",
  "summary": "…",
  "location": "Bilbao",
  "availability": "Abierta a oportunidades",
  "skills": [{ "name": "React", "level": "ADVANCED" }],
  "experiences": [{ "company": "…", "role": "…", "startDate": "…", "endDate": null, "current": true, "description": "…", "location": "…" }],
  "education": [{ "institution": "…", "title": "…", "field": "…", "startDate": "…", "endDate": "…" }],
  "projects": [{ "name": "…", "description": "…", "technologies": ["…"], "url": "…", "repoUrl": "…" }],
  "links": [{ "type": "GITHUB", "url": "https://github.com/…" }],
  "preferences": null
}
```

No incluye `id` interno de subrecursos si no aporta valor público; no incluye
`userId`, email, salario ni completitud.

## Seguridad y privacidad

- **Publicación explícita** y **despublicación** controladas por el dueño.
- **Whitelist server-side** de campos públicos; el frontend nunca es la barrera.
- El endpoint público **no** expone `userId`, email, tokens ni datos de otras
  features.
- **404** uniforme para slug inexistente **o** no publicado (no distinguir ambos
  casos evita filtrar existencia).
- Los endpoints privados aíslan por usuario (`userId` del token); acceso a
  portfolio ajeno vía API privada → **403**.
- **No indexación** de perfiles no publicados; en `/u/:slug` no publicado, además
  de 404, `noindex`. (SEO/`robots` de perfiles publicados se decide en polish.)
- **Anti-enumeración**: los slugs son elegidos por el usuario (no secuenciales),
  lo que reduce el rastreo; se contempla rate-limiting básico del endpoint público
  como mejora (no bloqueante en V1).
- **Validación de slug en backend** (formato + reservados + unicidad), no solo en
  cliente.

## QR

- El QR apunta a la **URL pública absoluta** del portfolio (`<base>/u/:slug`).
- La **base URL** es **configurable** (p. ej. `NEXT_PUBLIC_PUBLIC_BASE_URL`), nunca
  hardcodeada.
- **No** se usan **servicios externos de QR** (ni APIs ni imágenes remotas): el QR
  se genera **localmente** (render client-side a `canvas`/SVG y export a
  data-URI). La elección de generador (mini-lib self-contained vs implementación
  propia) se decide al abrir 14G, sin añadir dependencias pesadas ni llamadas
  externas.
- La UI permite **copiar el enlace** y **descargar el QR** (PNG/SVG) si es viable
  en V1.

## Versión imprimible

- **V1**: print del **navegador** (sin PDF server-side).
- Ocultar navegación/botones/acciones en impresión (`print:hidden`), como en 14A.
- Mantener un CV profesional y sobrio (reutiliza el layout de `profile-print-cv`).
- **No** PDF server-side en V1 salvo decisión posterior explícita.

## GitHub helper (fase posterior)

Fuera de V1, definido como fase futura (14I):

- Detectar el enlace de GitHub del perfil y **abrir GitHub** para facilitar copiar
  proyectos.
- **Facilitar añadir proyectos** manualmente (prellenado asistido).
- **Import público asistido** de repos (solo datos públicos, con confirmación del
  usuario).
- **OAuth de GitHub queda fuera de V1** (y probablemente de la fase 1 del helper).

## Reglas de negocio

- El portfolio es una **proyección en vivo**: cambios en el JobIT CV se reflejan en
  `/u/:slug` sin republicar (no hay snapshot en V1).
- **No se puede publicar sin un perfil mínimo.** **Decisión V1 (recomendada):
  mínimo obligatorio** —
  - `firstName` (o nombre visible) presente,
  - `headline` presente,
  - al menos **1 skill**,
  - al menos **1 proyecto _o_ 1 experiencia**.
  - Alternativa considerada (publicar incompleto con aviso) → **descartada** para
    V1: un portfolio público vacío perjudica la percepción profesional. En su
    lugar, la UI muestra un **checklist de requisitos** y `publish` responde error
    accionable si falta algo.
- Despublicar es siempre posible y toma efecto inmediato.
- El slug es estable mientras el usuario no lo cambie; cambiarlo rompe enlaces
  previos (se avisa en la UI).

## Validaciones

- **slug**: formato (`^[a-z0-9-]{3,40}$` con reglas de guiones), no reservado,
  único.
- **flags** (`showLocation`, `showAvailability`, `showPreferences`): booleanos.
- **URL pública**: construida desde base configurable + slug validado.
- **Estados publish/unpublish**: `publish` exige mínimo publicable; `unpublish`
  siempre permitido; idempotencia razonable (publicar ya publicado → estado
  actual, no error duro).

## Errores

| Código | Situación |
|---|---|
| 400 | Slug inválido (formato/reservado) o payload inválido |
| 401 | Acceso a endpoint privado sin sesión |
| 403 | Intento de gestionar el portfolio de otro usuario (API privada) |
| 404 | Portfolio público no publicado o inexistente (uniforme) |
| 409 | Slug ya ocupado por otro usuario |
| 422 | (Opcional) Publicar sin cumplir el mínimo publicable |

Convención de cuerpo de error: `{ error: { code, message } }` (coherente con el
backend actual). El mínimo publicable puede expresarse como `400`/`422` con un
`code` específico (p. ej. `PORTFOLIO_INCOMPLETE`) — se fija al implementar 14D.

## Criterios de aceptación V1

- [ ] El usuario puede **publicar** su portfolio.
- [ ] El usuario puede **despublicar** su portfolio.
- [ ] El usuario obtiene una **URL pública** estable (`/u/:slug`).
- [ ] El usuario obtiene un **QR** que apunta a esa URL (generado localmente).
- [ ] La ruta pública **funciona sin login**.
- [ ] La ruta pública **no muestra datos privados** (whitelist verificada).
- [ ] El portfolio **se actualiza** cuando cambia el JobIT CV (proyección en vivo).
- [ ] El portfolio se puede **imprimir / guardar como PDF** (navegador).
- [ ] Portfolio no publicado / slug inexistente → **404**.
- [ ] **Tests** backend y frontend verdes.

## Tests mínimos

Backend:

- publish / unpublish (transición de estado y `publishedAt`).
- slug único (colisión → 409) y slug inválido/reservado (400).
- público **publicado** → 200 con campos whitelisted.
- público **no publicado / inexistente** → 404 (uniforme).
- **privacidad de campos**: la respuesta pública no contiene email, salario,
  `userId`, completitud, tokens ni datos de otras features.
- aislamiento por usuario en endpoints privados (403 ajeno).

Frontend:

- settings muestra la **URL pública** y el estado (publicado/no).
- **publicar / despublicar** desde la UI.
- **copiar enlace**.
- **QR visible** (y descargable si aplica).
- `/u/:slug` **renderiza** el portfolio público.
- **botón de imprimir** presente y funcional (llama a `window.print`).
- `/u/:slug` **no** muestra datos privados (sin salario/preferencias completas si
  `showPreferences` OFF; sin email/completitud).

## Fuera de alcance V1

- Dominios personalizados.
- Analíticas / métricas de visitas.
- Vista/panel avanzado para recruiters.
- Monetización (planes, pricing, "Pro").
- Plantillas múltiples / temas.
- IA (generación de textos, "mejoras" automáticas, scoring).
- OAuth de GitHub e import automático **privado** de repos.
- PDF server-side.
- Formularios de contacto / comentarios públicos.

## Plan de implementación por sprints pequeños

| Sprint | Alcance | Entregable |
|---|---|---|
| **14D** | Backend `PortfolioSettings` | Migración Prisma, schema, servicio, endpoints privados (GET/PUT/publish/unpublish), validación de slug + reservados, tests |
| **14E** | Frontend settings + publish | `/profile/portfolio/settings` (o integrado), slug editable, publicar/despublicar, copiar enlace, tests |
| **14F** | Ruta pública | `GET /api/public/portfolios/:slug` (whitelist), `/u/:slug` sin login, 404 no publicado, tests de privacidad |
| **14G** | QR | Generación local del QR desde base URL configurable, copiar/descargar, tests |
| **14H** | Polish / print público | Estilos print en `/u/:slug`, `noindex` no publicados, pulido responsive, tests |
| **14I** | GitHub helper fase 1 | Detección de enlace GitHub + añadir proyectos asistido (sin OAuth), tests |

Cada sprint sigue el flujo SDD/TDD del repo: spec → tests → implementación →
verificaciones → auditoría quality/security → PR pequeña contra `dev`.

## Decisiones de producto (resumen)

- **Publicación explícita** con `isPublished=false` por defecto; despublicación
  inmediata.
- **Mínimo publicable obligatorio** (nombre + headline + ≥1 skill + ≥1
  proyecto/experiencia) en vez de publicar incompleto con aviso.
- **Proyección en vivo** (sin snapshot): el portfolio refleja el CV al instante.
- **Whitelist server-side**; **404 uniforme**; **preferencias OFF** por defecto;
  **salario nunca público**.
- **Print del navegador** (sin PDF server-side); **QR local** (sin servicios
  externos); **base URL configurable**.
- Endpoints privados bajo `/api/profile/me/portfolio`; público bajo
  `/api/public/portfolios/:slug`; ruta pública `/u/:slug`.

## Auditoría requerida

- [ ] Quality/security documental (privacidad, whitelist, sin secretos).
- [ ] Revisión de que no se promete IA, monetización ni "demo".
- [ ] Revisión humana del alcance V1 y del plan por sprints.
