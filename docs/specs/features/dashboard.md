# Spec: Dashboard candidato (M06 · revisión Sprint 17C)

## Estado

- Base M06 implementada en Sprints 06 (backend) y 07 (frontend); hub activado con datos reales y
  enlaces en Sprint 17B (PR #71).
- **Esta revisión (Sprint 17C — aprobada por el orquestador) fija el contrato ampliado** de
  `GET /api/dashboard/me` y las reglas del hub. Es **aditiva**: no renombra campos existentes,
  no requiere cambios de Prisma ni migraciones.
- Sustituye el vocabulario provisional de la versión M06 original: el contrato real usa
  `completionPercentage` (no `completeness`), `nextActions` (no `nextSteps`) y `matches`
  (no `topMatches`); el antiguo `missingFields` queda cubierto por `cvSections`.

## Objetivo

Dar al candidato una vista de entrada que refleje su **estado real** (perfil/CV, guardadas,
matches y portfolio) y le proponga **próximos pasos accionables**, actuando como hub de
navegación del MVP. El dashboard no añade funcionalidad nueva: agrega y presenta información de
los módulos M01–M05 y del Portfolio V1.

## Usuario afectado

Candidato tech autenticado. Solo ve sus propios datos (el `userId` procede siempre del token).

## Flujo principal

1. El candidato inicia sesión (M01) y llega a `/dashboard` (o navega desde el menú privado).
2. El frontend llama a `GET /api/dashboard/me` con el token.
3. El backend compone la respuesta desde los servicios existentes (Profile/CV, Saved Jobs,
   Match, Portfolio) **sin crear datos por lectura** (ver Reglas de negocio).
4. El hub muestra: cabecera con progreso, métricas, checklist real del CV, vista previa del
   JobIT CV (con foto y resumen reales), guardadas recientes, mejores matches, estado del
   portfolio y sugerencias (`nextActions`).
5. El candidato navega a cualquier módulo desde el contenido del hub o la navegación privada.

## Flujos alternativos

- **Primera vez / perfil vacío**: placeholders honestos + checklist a cero + sugerencia
  `complete_profile`.
- **Sin guardadas**: empty state accionable hacia `/jobs`.
- **Sin matches**: empty state accionable hacia `/profile` (añadir skills).
- **Portfolio sin configurar** (`portfolio: null`) o **no publicado**: CTA hacia
  `/profile/portfolio`; nunca se muestra URL pública inexistente.
- **Sesión caducada**: limpieza de sesión y redirección a `/login`.
- **Error de carga**: estado de error global del hub (el error por bloque queda diferido,
  fuera de 17C).

## Modelo de datos / DTO

El dashboard no tiene modelo propio; agrega datos existentes. Contrato de respuesta
(`CandidateDashboardDto`, naming real del código):

```ts
{
  profile: {
    firstName: string | null,
    lastName: string | null,
    headline: string | null,
    completionPercentage: number,      // entero 0..100
    summary: string | null,            // NUEVO 17C
    avatarUrl: string | null           // NUEVO 17C (URL pública o ruta /uploads/...)
  },
  skills: string[],                    // normalizedName, como hasta ahora
  savedJobs: {
    total: number,
    recent: SavedJobDto[]              // ≤3, savedAt desc — compatible, sin cambios
  },
  matches: ProfileJobMatchDto[],       // ≤3, score desc, explicables — compatible, sin cambios
  cvSections: {                        // NUEVO 17C — flags reales del CV
    basics: boolean,                   // nombre y apellidos
    skills: boolean,
    experience: boolean,
    education: boolean,
    projects: boolean,
    links: boolean,
    preferences: boolean               // preferencias "con contenido" (regla existente)
  },
  portfolio: {                         // NUEVO 17C — null = sin configurar
    isPublished: boolean,
    slug: string,
    publicUrlPath: string              // relativo, p. ej. "/u/ana-perez"
  } | null,
  nextActions: { action: string, label: string }[]   // catálogo ampliado, máx 3
}
```

Los jobs embebidos (`recent` y `matches`) siguen usando el contrato público (`serializeJob`):
**nunca** exponen `externalId` ni `ingestedAt`.

## Endpoint

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/dashboard/me` | Privada (`requireAuth`) | Datos agregados del candidato autenticado |

- El `userId` se resuelve **solo** del token; cualquier `userId` en query/body se ignora.
- Respuesta: el DTO anterior. Errores: 401 sin sesión o token inválido.

## nextActions — catálogo aprobado (Sprint 17C)

| Prioridad | `action` | Condición (backend, determinista) | Ruta destino (frontend) |
|---|---|---|---|
| 1 | `complete_profile` | `!cvSections.basics \|\| !cvSections.skills` | `/profile` |
| 2 | `add_experience` | primera sección faltante, orden `experience > projects > links` | `/profile` |
| 2 | `add_projects` | ídem (solo una acción `add_*` por respuesta) | `/profile` |
| 2 | `add_links` | ídem | `/profile` |
| 3 | `publish_portfolio` | perfil **publicable** (regla real existente: nombre + headline + ≥1 skill + ≥1 proyecto o experiencia) **y** (`portfolio` es `null` o `!isPublished`) | `/profile/portfolio` |
| 4 | `explore_jobs` | `savedJobs.total === 0` | `/jobs` |
| 5 | `review_matches` | `matches.length > 0 && savedJobs.total > 0` | `/match` |

Reglas del catálogo:

- **Máximo 3 acciones** por respuesta, en el orden de prioridad de la tabla.
- **Determinista**: el mismo estado produce siempre las mismas acciones en el mismo orden.
- Son sugerencias orientativas de navegación; no bloquean ni penalizan.
- El **mapeo `action` → ruta vive en el frontend**; el backend solo envía `action` + `label`.
- **Una acción desconocida no debe romper el frontend**: se muestra su `label` sin enlace
  (comportamiento ya implementado en 17B).

## Pantallas afectadas

- **`/dashboard` (hub)**: checklist "Tu próximo paso" alimentado por `cvSections` (sin valores
  fijos); vista previa del JobIT CV con `summary` y `avatarUrl` reales (placeholder/iniciales si
  null) y estados reales de proyectos/enlaces; bloque Portfolio con estado — publicado → enlace a
  la URL pública (`publicUrlPath`), no configurado/no publicado → CTA a `/profile/portfolio`;
  "Sugerencias" con las rutas nuevas del catálogo.
- **Navegación privada (`SiteShell`)**: se añade la entrada **Portfolio** (`/profile/portfolio`).
- **`/profile`**: copy del límite de subida de avatar actualizado a **5 MB**.
- No se crean pantallas nuevas.

## Reglas de negocio

- El dashboard muestra exclusivamente datos del candidato autenticado.
- **`GET /api/dashboard/me` no crea datos por lectura**:
  - **Prohibido** usar `getOrCreatePortfolioSettings` en el dashboard; los ajustes de portfolio
    se consultan con lectura segura (`findUnique` por `userId`); si no existen → `portfolio:
    null` ("sin configurar"), sin efectos colaterales.
  - Nota de compatibilidad: la materialización del `CandidateProfile` vacío en primera lectura
    (`getOrCreateCandidateProfile`) es comportamiento **preexistente** compartido con
    `GET /api/profile/me` (Sprint 06) y se mantiene; no forma parte de esta regla.
- **`cvSections` y `completionPercentage` derivan de reglas comunes/coherentes**: las mismas 7
  condiciones existentes del cálculo de completitud (nombre+apellidos, skills, experiencia,
  educación, proyectos, enlaces, preferencias con contenido); el porcentaje es
  `secciones completas / 7`. No se duplican criterios divergentes.
- `nextActions`: máximo 3, catálogo cerrado en backend (tabla anterior), determinista.
- `publish_portfolio` solo aparece si el perfil cumple el **mínimo publicable real** (la misma
  regla que usa `POST /publish`) y el portfolio no está publicado.
- `summary` y `avatarUrl` son opcionales: `null` cuando no existen; el frontend muestra
  placeholder/iniciales.
- Límite de subida de avatar: **5 MB** (antes 2 MB). Solo constante, copy y tests; **sin
  compresión client-side**. Tipos permitidos sin cambios (PNG/JPG/WebP) y validación por magic
  bytes sin cambios.
- Las guardadas recientes son las últimas 3 por `savedAt` desc; los matches, los 3 de mayor
  score entre ofertas activas (reglas existentes, sin cambios).
- Un fallo del hub no debe dejar enlaces rotos: las rutas del catálogo existen todas en la app.

## Validaciones

- No hay entradas de usuario en el dashboard (solo GET autenticado); las validaciones son las de
  los módulos de origen.
- `publicUrlPath` y `avatarUrl` proceden de módulos que ya validan/normalizan sus valores
  (slug seguro; avatar con allowlist de MIME + magic bytes).

## Errores

| Situación | Comportamiento |
|---|---|
| Sin sesión / token inválido | 401; el frontend limpia sesión y redirige a `/login` |
| Error al cargar el dashboard | Estado de error global del hub (error por bloque: diferido) |
| `action` desconocida en `nextActions` | El frontend la muestra sin enlace; no rompe la UI |
| Portfolio inexistente | `portfolio: null`; el hub muestra CTA, nunca URL pública inventada |

## Criterios de aceptación

- [ ] `GET /api/dashboard/me` devuelve el DTO ampliado: `profile.summary`, `profile.avatarUrl`,
      `cvSections`, `portfolio`, `nextActions` enriquecidas; `savedJobs`/`matches` intactos.
- [ ] La lectura del dashboard **no crea** `PortfolioSettings` (verificado por test).
- [ ] `cvSections` es coherente con `completionPercentage` (mismas reglas).
- [ ] `nextActions` devuelve ≤3 acciones, deterministas, con las prioridades del catálogo.
- [ ] `publish_portfolio` solo aparece si el perfil es publicable y el portfolio no está
      publicado.
- [ ] El hub muestra checklist real, `summary` y foto reales (con fallbacks) y el portfolio con
      su estado (enlace público si publicado; CTA si no).
- [ ] Portfolio aparece en la navegación privada.
- [ ] El avatar acepta archivos de hasta 5 MB (413 por encima), con copy actualizado.
- [ ] Una `action` desconocida no rompe el frontend.
- [ ] La API pública sigue sin exponer `externalId`/`ingestedAt` en los jobs embebidos.

## Tests mínimos

**Backend (integración, ampliando los 15 existentes):**
- Shape ampliado (claves nuevas presentes).
- `portfolio: null` para usuario sin ajustes **y** verificación de que el GET no crea la fila.
- Portfolio no publicado y publicado (con `slug` y `publicUrlPath` correctos).
- Un caso por flag de `cvSections` + coherencia con `completionPercentage`.
- `summary`/`avatarUrl` presentes y `null` cuando no existen.
- `nextActions`: prioridad, cap 3, determinismo, una sola `add_*`, `publish_portfolio`
  condicionado a publicable+no publicado.
- Sin exposición de campos internos en los bloques nuevos.

**Frontend (RTL):**
- Checklist refleja `cvSections` (mezcla de true/false).
- Preview muestra `summary` real y placeholder si `null`; avatar renderizado con `avatarUrl` y
  fallback a iniciales.
- Portfolio publicado (enlace a `publicUrlPath`) vs sin configurar (CTA).
- Rutas nuevas del mapa de acciones; acción desconocida sin enlace.
- Navegación privada incluye Portfolio.

**Avatar:**
- > 5 MB → 413; archivo entre 2 y 5 MB → aceptado; copy "5 MB" en la UI.

## Fuera de alcance

- Header de `SiteShell` con nombre/avatar reales (decisión del orquestador: fuera de 17C).
- Rediseño visual global, tokens, skeletons, iconografía (→ 17D).
- Retry en errores, feedback de toggles, reset de filtros (hardening posterior).
- Error por bloque en el hub (se mantiene error global en MVP).
- URLs de los enlaces del CV en el DTO (solo flag `cvSections.links` en 17C).
- Compresión/redimensionado client-side de imágenes.
- Cambios de Prisma, migraciones, nuevas fuentes, notificaciones, actividad de recruiter,
  estadísticas de vistas, candidaturas internas, personalización del layout.

## Auditoría requerida

- [ ] Quality/security documental.
- [ ] Tests y verificaciones locales (api y web).
- [ ] Revisión humana.
