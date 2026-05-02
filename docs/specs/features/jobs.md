# Spec: Jobs (M03)

## Objetivo

Permitir que el candidato explore ofertas laborales tech disponibles, aplique filtros básicos y consulte el detalle de una oferta. En el MVP, las ofertas provienen de datos seed o mock cargados en la base de datos. No se integran APIs externas ni scrapers.

## Usuario afectado

Candidato tech autenticado que busca explorar oportunidades laborales relevantes para su perfil.

## Flujo principal

1. El candidato accede a la sección de Jobs.
2. El sistema carga y muestra el listado de ofertas disponibles (desde datos seed/mock).
3. El candidato puede filtrar por criterios básicos.
4. El candidato puede hacer clic en una oferta para ver su detalle.
5. Desde el detalle, puede guardarla (enlaza con M04 Saved Jobs) o volver al listado.

## Flujos alternativos

- Sin ofertas disponibles: estado vacío con mensaje orientativo.
- Error al cargar: mensaje de error con opción de reintentar.
- Sin resultados tras filtrar: mensaje que invita a ampliar filtros.
- Filtros aplicados: el candidato puede limpiar filtros y volver al listado completo.

## Modelo de datos conceptual

### Job

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Clave primaria |
| title | string | Requerido |
| company | string | Requerido |
| location | string | Ciudad o región |
| remoteType | enum | `REMOTE`, `HYBRID`, `ON_SITE` |
| description | string | Descripción completa de la oferta |
| requirements | string[] | Lista de requisitos o skills esperadas |
| seniority | enum | `JUNIOR`, `MID`, `SENIOR`, `ANY` |
| contractType | string | `FULL_TIME`, `PART_TIME`, `CONTRACT`, `FREELANCE` |
| salaryMin | integer | Opcional |
| salaryMax | integer | Opcional |
| tags | string[] | Tags tecnológicos (ej: ["TypeScript", "Node.js"]) |
| status | enum | `ACTIVE`, `CLOSED` |
| postedAt | datetime | Fecha de publicación |
| expiresAt | datetime | Opcional, fecha de cierre |

Las ofertas se cargan mediante seed o fixture en la base de datos. No hay un panel de publicación de ofertas en el MVP.

## Endpoints previstos

| Método | Ruta | Descripción |
|---|---|---|
| GET | /jobs | Listado de ofertas activas con filtros y paginación |
| GET | /jobs/:id | Detalle de una oferta |

Parámetros de query para `/jobs`:

| Parámetro | Tipo | Descripción |
|---|---|---|
| q | string | Búsqueda por texto libre en título o descripción |
| location | string | Filtro por ciudad o región |
| remote | enum | `REMOTE`, `HYBRID`, `ON_SITE` |
| seniority | enum | `JUNIOR`, `MID`, `SENIOR` |
| contractType | string | Tipo de contrato |
| tags | string[] | Filtro por tags tecnológicos |
| page | integer | Página, por defecto 1 |
| limit | integer | Resultados por página, por defecto 20 |

Las rutas son privadas. Requieren sesión activa.

## Pantallas previstas

- **Listado de jobs**: cards o filas con título, empresa, ubicación, modalidad remota, seniority y tags. Filtros accesibles.
- **Panel de filtros**: filtros por texto, ubicación, modalidad, seniority, tipo de contrato y tags.
- **Detalle de oferta**: toda la información de la oferta con botón de guardar.
- **Estado vacío**: sin ofertas disponibles o sin resultados para los filtros.
- **Estado de carga**: indicador mientras se obtienen datos.
- **Estado de error**: mensaje de error con opción de reintentar.

## Reglas de negocio

- Solo se muestran ofertas con `status: ACTIVE`.
- Las ofertas expiradas (`expiresAt < now`) se tratan como cerradas aunque el status no se haya actualizado.
- La búsqueda por texto libre aplica sobre título y descripción como mínimo.
- Los filtros son combinables entre sí.
- La paginación es obligatoria para evitar cargar todos los registros.
- El candidato no puede crear, editar ni eliminar ofertas.
- Los datos provienen de seed/mock en la DB. No hay integración externa en el MVP.

## Validaciones

| Parámetro | Regla |
|---|---|
| page | Entero positivo, mínimo 1 |
| limit | Entre 1 y 100 |
| q | Máximo 200 caracteres |
| jobs/:id | UUID válido, oferta existente y activa |

## Errores

| Situación | Mensaje orientativo |
|---|---|
| Oferta no encontrada | 404 con mensaje "Oferta no disponible" |
| Error de servidor al listar | "No se han podido cargar las ofertas. Inténtalo de nuevo" |
| Parámetros de query inválidos | Error de validación con campo afectado |

## Criterios de aceptación

- [ ] El candidato autenticado puede ver el listado de ofertas activas.
- [ ] El candidato puede filtrar por texto, ubicación, modalidad y seniority.
- [ ] El candidato puede ver el detalle de una oferta.
- [ ] Las ofertas cerradas o expiradas no aparecen en el listado.
- [ ] El listado devuelve resultados paginados.
- [ ] El estado vacío se muestra cuando no hay resultados.
- [ ] El estado de error se muestra con opción de reintentar.

## Tests mínimos

- Listar jobs → devuelve solo ofertas activas.
- Listar jobs con filtro de modalidad remota → solo devuelve REMOTE.
- Listar jobs con búsqueda de texto → filtra por título o descripción.
- Listar jobs con página inválida → error de validación.
- Ver detalle de job activo → devuelve datos completos.
- Ver detalle de job inexistente → 404.
- Ver detalle de job cerrado → 404 o error indicando no disponible.
- Sin sesión activa → redirección al login.

## Fuera de alcance

- Publicación de ofertas por parte de recruiters o empresas.
- Scraping de ofertas de portales externos.
- Integración con APIs de empleo (Infojobs, LinkedIn, etc.).
- Ordenación por relevancia con IA.
- Alertas de nuevas ofertas.
- Aplicación directa a una oferta desde la plataforma.
- Panel de ofertas guardadas (eso es M04 Saved Jobs).

## Auditoría requerida

- [ ] Quality/security documental.
- [ ] Tests y verificaciones locales.
- [ ] Revisión humana.
