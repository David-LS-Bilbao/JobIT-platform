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

| Método | Ruta | Descripción |
|---|---|---|
| GET | /saved-jobs | Listado de ofertas guardadas del candidato autenticado |
| POST | /saved-jobs | Guardar una oferta |
| DELETE | /saved-jobs/:jobId | Quitar una oferta guardada |

Body de POST `/saved-jobs`:

```json
{ "jobId": "uuid" }
```

Todas las rutas son privadas. Requieren sesión activa.

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
| jobId | UUID válido, oferta existente |

## Errores

| Situación | Código | Mensaje orientativo |
|---|---|---|
| jobId inválido o inexistente | 404 | "Oferta no encontrada" |
| Quitar oferta no guardada | 404 | "No tienes esta oferta guardada" |
| Sin sesión | 401 | Redirección al login |
| Error de servidor | 500 | "No se ha podido completar la acción. Inténtalo de nuevo" |

## Criterios de aceptación

- [ ] El candidato puede guardar una oferta desde el listado o el detalle.
- [ ] El candidato no puede guardar la misma oferta dos veces.
- [ ] El candidato puede consultar su lista de ofertas guardadas.
- [ ] La lista pertenece exclusivamente al candidato autenticado.
- [ ] El candidato puede quitar una oferta guardada.
- [ ] Las ofertas cerradas guardadas se mantienen con indicador de no disponible.
- [ ] Un candidato no puede ver las ofertas guardadas de otro candidato.

## Tests mínimos

- Guardar oferta activa → registro creado con userId y jobId correctos.
- Guardar oferta ya guardada → sin error, sin duplicado.
- Listar guardadas → devuelve solo las del candidato autenticado.
- Listar guardadas de otro candidato → error de autorización (403).
- Quitar oferta guardada → registro eliminado.
- Quitar oferta no guardada → 404.
- Unicidad `(userId, jobId)` → no se pueden crear dos registros iguales.
- Sin sesión en cualquier endpoint → 401.

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
