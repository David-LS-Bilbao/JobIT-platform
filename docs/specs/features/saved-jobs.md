# Spec: Saved Jobs (M04)

## Objetivo

Permitir que el candidato guarde ofertas de interés, las consulte en cualquier momento y las elimine cuando lo desee. Los datos guardados pertenecen exclusivamente al candidato autenticado. No puede haber duplicados.

## Usuario afectado

Candidato tech autenticado que quiere marcar ofertas para revisarlas o seguirlas más adelante.

## Flujo principal

### Guardar una oferta

1. El candidato visualiza una oferta (en listado o detalle, M03).
2. Pulsa la acción de guardar.
3. El sistema comprueba que la oferta no está ya guardada por ese candidato.
4. Si no lo está, crea el registro de guardado.
5. La acción se refleja visualmente (botón activo, contador actualizado).

### Consultar ofertas guardadas

1. El candidato accede a su lista de ofertas guardadas.
2. El sistema devuelve las ofertas guardadas del candidato autenticado.
3. El candidato puede ver resumen de cada oferta y acceder a su detalle.

### Quitar una oferta guardada

1. El candidato pulsa la acción de quitar sobre una oferta guardada.
2. El sistema elimina el registro de guardado.
3. La acción se refleja visualmente de forma inmediata.

## Flujos alternativos

- Guardar una oferta ya guardada: el sistema responde sin error pero no duplica (idempotente).
- Lista de guardadas vacía: estado vacío con mensaje orientativo y enlace a explorar ofertas.
- Error al guardar o quitar: mensaje de error sin perder el estado anterior.
- Oferta guardada que ha sido cerrada: se muestra en la lista con indicador de "no disponible".

## Modelo de datos conceptual

### SavedJob

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Clave primaria |
| userId | UUID | FK a User |
| jobId | UUID | FK a Job |
| savedAt | datetime | Automático |

Restricción de unicidad: `(userId, jobId)` — un candidato no puede guardar la misma oferta dos veces.

La relación es entre el usuario y la oferta. No pertenece al perfil del candidato sino al usuario directamente, para mantener la separación de concerns.

## Endpoints previstos

Rutas documentadas **sin** el prefijo global `/api` (convención de specs según ADR-0007). En la implementación el router se monta bajo `/api/saved-jobs`, igual que `/api/jobs`.

| Método | Ruta | Descripción | Éxito |
|---|---|---|---|
| GET | /saved-jobs | Listado de ofertas guardadas del candidato autenticado | 200 |
| POST | /saved-jobs/:jobId | Guardar una oferta (idempotente) | 201 (creado) / 200 (ya guardada) |
| DELETE | /saved-jobs/:jobId | Quitar una oferta guardada | 204 |

**Decisión de contrato (SDD Review Sprint 04):** el identificador de la oferta viaja en el **path** (`:jobId`), no en el body. Se resuelve así la discrepancia entre el briefing inicial y la versión previa de esta spec (que usaba `POST /saved-jobs` con body `{ "jobId": "uuid" }`). Justificación:

- **Coherencia con ADR-0007**, que define explícitamente `/saved-jobs` y `/saved-jobs/:jobId` (kebab-case, colección en plural, DELETE = desguardado).
- **Simetría save/unsave**: `POST` y `DELETE` operan sobre el mismo recurso `/saved-jobs/:jobId`.
- **Reutiliza el patrón de validación de Jobs** (`:id` con forma UUID en path, como `GET /jobs/:id`), sin necesidad de un schema de body adicional.
- **Menor superficie de entrada**: sin body, el cliente solo aporta el `jobId` por ruta; el `userId` nunca entra por el cliente.

`:jobId` se valida como forma UUID en el servidor; un `jobId` con forma inválida devuelve 400, uno con forma válida pero inexistente devuelve 404.

Todas las rutas son **privadas** y exigen `requireAuth`. El `userId` se extrae siempre de `req.auth.userId` (token verificado); **nunca** se acepta desde body, query ni params.

## Contrato heredado de Jobs (serialización pública)

Saved Jobs reutiliza el contrato público de Jobs estabilizado en Sprint 03.6:

- El `Job` embebido en las respuestas se serializa con `serializeJob` / `JobPublicDto` (`apps/api/src/jobs/jobs.serializer.ts`). **No se duplica** la lógica de serialización ni se devuelve la entidad Prisma completa.
- **Nunca** se exponen los campos internos de ingesta `externalId` ni `ingestedAt`.
- **Sí** se exponen `source` y `sourceUrl` (atribución de procedencia; `sourceUrl = null` para ofertas internas), además de `status` y `expiresAt`, que permiten al cliente derivar el indicador de "no disponible".
- Funciona indistintamente con ofertas `source = INTERNAL` y `source = JOOBLE` ya persistidas.
- Saved Jobs **no realiza llamadas a Jooble** ni dispara ingesta: opera solo sobre ofertas ya presentes en la base de datos.

## Formato de respuestas (conceptual)

- **GET /saved-jobs** → `200` con colección de guardados del usuario autenticado, ordenados por `savedAt` descendente. Cada elemento incluye los metadatos del guardado (al menos `savedAt`) y la oferta serializada vía `JobPublicDto`. Lista vacía → `200` con colección vacía.
- **POST /saved-jobs/:jobId** → `201` si crea el guardado; `200` si la oferta ya estaba guardada (idempotente, sin duplicar). Devuelve el guardado resultante con la oferta serializada.
- **DELETE /saved-jobs/:jobId** → `204` sin cuerpo cuando elimina un guardado propio.

## Ownership y aislamiento entre usuarios

- `GET /saved-jobs` devuelve **exclusivamente** los guardados del usuario autenticado. No existe ningún parámetro para solicitar los de otro usuario: el acceso cruzado es **estructuralmente imposible**, no un caso de 403.
- `DELETE /saved-jobs/:jobId` actúa sobre el par `(req.auth.userId, jobId)`. Intentar quitar una oferta que el usuario no tiene guardada (aunque otro usuario sí la tenga) no encuentra registro propio y devuelve `404` — nunca afecta al guardado de otro usuario.

## Pantallas previstas

- **Lista de guardadas**: listado de ofertas guardadas con resumen (título, empresa, modalidad, fecha de guardado). Enlace al detalle de cada oferta.
- **Acción guardar/quitar** en listado y detalle de oferta (M03): botón o icono con estado activo/inactivo.
- **Estado vacío**: sin ofertas guardadas, con CTA para explorar jobs.
- **Estado de carga**: indicador mientras se obtienen los datos.
- **Estado de error**: mensaje con opción de reintentar.
- **Indicador de no disponible**: cuando una oferta guardada ha sido cerrada.

## Reglas de negocio

- Un candidato solo puede ver sus propias ofertas guardadas.
- No puede haber dos registros `(userId, jobId)` iguales.
- Guardar una oferta ya guardada debe ser idempotente: no falla, no duplica.
- Quitar una oferta que no estaba guardada devuelve 404.
- Las ofertas cerradas o expiradas que estaban guardadas se mantienen en la lista pero se marcan como no disponibles.
- El orden por defecto es por fecha de guardado descendente.

## Validaciones

| Campo | Regla |
|---|---|
| jobId (path) | Forma UUID válida en servidor; debe corresponder a una oferta existente |

## Errores

| Situación | Código | Mensaje orientativo |
|---|---|---|
| jobId con forma inválida | 400 | "Identificador de oferta no válido" |
| Guardar oferta inexistente (forma válida) | 404 | "Oferta no encontrada" |
| Quitar oferta no guardada por el usuario | 404 | "No tienes esta oferta guardada" |
| Sin sesión | 401 | Redirección al login |
| Error de servidor | 500 | "No se ha podido completar la acción. Inténtalo de nuevo" |

Guardar una oferta ya guardada **no** es error: es idempotente (`200`, sin duplicar). El código `409` que ADR-0007 cita como ejemplo genérico de "oferta ya guardada" **no aplica** a este recurso, porque la spec lo define explícitamente como idempotente.

## Criterios de aceptación

- [ ] El candidato puede guardar una oferta desde el listado o el detalle.
- [ ] El candidato no puede guardar la misma oferta dos veces.
- [ ] El candidato puede consultar su lista de ofertas guardadas.
- [ ] La lista pertenece exclusivamente al candidato autenticado.
- [ ] El candidato puede quitar una oferta guardada.
- [ ] Las ofertas cerradas guardadas se mantienen con indicador de no disponible.
- [ ] Un candidato no puede ver las ofertas guardadas de otro candidato.

## Tests mínimos

- Guardar oferta activa → registro creado con userId y jobId correctos (`201`).
- Guardar oferta ya guardada → sin error, sin duplicado (`200`, idempotente).
- Guardar oferta inexistente (forma UUID válida) → `404`.
- Guardar con jobId de forma inválida → `400`.
- Listar guardadas → devuelve solo las del candidato autenticado, ordenadas por `savedAt` desc.
- Aislamiento: si el usuario A guarda una oferta, el listado del usuario B no la incluye (cada listado se acota a su propio `userId`; no hay parámetro para pedir el de otro).
- Quitar oferta guardada propia → registro eliminado (`204`).
- Quitar oferta no guardada por el usuario → `404` (aunque otro usuario la tenga guardada, no afecta a su registro).
- Unicidad `(userId, jobId)` → no se pueden crear dos registros iguales.
- Sin sesión en cualquier endpoint → `401`.
- Respuestas con `Job` embebido → usan `JobPublicDto`; no exponen `externalId` ni `ingestedAt`; exponen `source`/`sourceUrl`.
- Funciona con ofertas `INTERNAL` y `JOOBLE` persistidas.

## Fuera de alcance

- Notas o etiquetas en ofertas guardadas.
- Compartir lista de guardadas.
- Ordenación personalizada por el candidato.
- Alertas de cambios en ofertas guardadas.
- Seguimiento de candidatura (aplicación formal a la oferta).
- Estados de candidatura (aplicado, entrevista, rechazado, etc.).

## Auditoría requerida

- [ ] Quality/security documental.
- [ ] Tests y verificaciones locales.
- [ ] Revisión humana.
