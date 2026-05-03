# ADR-0007: Diseño inicial de API

## Estado

Aceptada.

## Contexto

El backend usa Express (ADR-0005). La autenticación usa JWT access token + refresh token en cookie HttpOnly (ADR-0006). Las specs funcionales de Pre-Sprint 00C definen endpoints conceptuales para los módulos M01-M06.

El MVP es candidate-first, con una única aplicación frontend (Next.js) consumiendo una API backend (Express). No hay clientes móviles, integraciones externas ni API pública en el MVP inicial. Esta condición permite diferir decisiones de versionado y documentación formal hasta que exista una necesidad real.

## Decisión

**REST bajo prefijo `/api`.** Todas las rutas del backend siguen convenciones REST estándar y se sirven bajo el prefijo `/api`.

### Prefijo y versionado

- Prefijo de todas las rutas: `/api`.
- Versionado explícito (`/api/v1`): **diferido**. Se reevaluará antes de exponer APIs públicas, clientes móviles o integraciones externas. En el MVP interno, el prefijo `/api` es suficiente. Cuando se versione, la convención será `/api/v1`.

### Convenciones de rutas

- Colecciones en plural: `/api/jobs`, `/api/saved-jobs`.
- Recurso singular por id en path: `/api/jobs/:id`.
- Recursos del candidato autenticado bajo `/me`: `/api/profile/me`, `/api/profile/me/skills`, `/api/profile/me/matches`.
- Acciones de auth bajo `/api/auth`: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.
- Kebab-case en rutas compuestas: `/api/saved-jobs`.

### Métodos HTTP

| Método | Uso |
|---|---|
| GET | Lectura de recursos o colecciones |
| POST | Creación de recursos o acciones sin idempotencia garantizada |
| PUT | Reemplazo completo o actualización controlada de un recurso, donde las specs ya lo definen |
| PATCH | Actualización parcial de un recurso existente, preferido para futuras actualizaciones nuevas |
| DELETE | Borrado de un recurso o desguardado |

Las specs de Pre-Sprint 00C ya usan `PUT` en los endpoints de perfil (`/profile/me`, `/profile/me/links`, `/profile/me/preferences`). Esta decisión respeta ese uso: `PUT` queda aceptado donde las specs lo definen. `PATCH` es la opción recomendada para cualquier nueva ruta de actualización parcial que se añada. Si en el Sprint 00 técnico se decide homogeneizar, deberá plantearse como un cambio explícito de spec, no como una decisión implícita de implementación.

### Códigos de estado HTTP

| Código | Situación |
|---|---|
| 200 | Éxito con cuerpo de respuesta |
| 201 | Recurso creado correctamente |
| 204 | Éxito sin cuerpo (borrado, logout) |
| 400 | Error de validación o solicitud incorrecta |
| 401 | No autenticado (token ausente, inválido o expirado) |
| 403 | Autenticado pero sin autorización sobre el recurso |
| 404 | Recurso no encontrado |
| 409 | Conflicto (recurso duplicado, ej: email ya registrado, oferta ya guardada) |
| 500 | Error interno del servidor |

El 500 nunca expone detalles internos, stack traces ni mensajes de base de datos al cliente.

### Formato de errores

JSON simple, inspirado en `application/problem+json` pero sin imponer el media type en el MVP:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos de entrada no válidos.",
    "details": [
      {
        "field": "email",
        "message": "Formato de email inválido."
      }
    ]
  }
}
```

El campo `details` es opcional y solo se incluye cuando hay errores de validación por campo. El campo `requestId` es una mejora futura para trazabilidad de logs; no es obligatorio en el MVP.

Códigos de error (`code`) orientativos:

| Code | Situación |
|---|---|
| `VALIDATION_ERROR` | Entradas inválidas |
| `UNAUTHORIZED` | Sin token o token inválido |
| `FORBIDDEN` | Token válido pero sin acceso al recurso |
| `NOT_FOUND` | Recurso no encontrado |
| `CONFLICT` | Recurso duplicado o conflicto de estado |
| `INTERNAL_ERROR` | Error interno genérico |

### Validación

- Toda validación crítica ocurre en el servidor. El frontend puede validar por UX, pero nunca es fuente de verdad.
- La validación de entradas se implementa con Zod u equivalente (ADR-0005).
- Los parámetros de query (filtros, paginación) se validan igual que el body.
- El `userId` nunca se acepta del cliente: se extrae siempre del token verificado en el servidor.

### Paginación y filtros

- Paginación por offset: parámetros `page` (entero positivo, default 1) y `limit` (entre 1 y 100, default 20).
- Filtros como parámetros de query. Todos validados en servidor.
- Respuesta de colección incluye metadatos mínimos: `data`, `total`, `page`, `limit`.

Ejemplo orientativo:

```json
{
  "data": [ ... ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### Separación de datos por usuario

- Todas las rutas privadas protegen el acceso mediante middleware de verificación del access token (ADR-0006).
- El `userId` se extrae del token en el servidor, nunca del body ni de la query.
- Un candidato no puede acceder ni modificar recursos de otro candidato. El servidor verifica la pertenencia antes de devolver o modificar datos.

### OpenAPI / Swagger

No se crea en esta fase documental. Se recomienda como mejora prioritaria al inicio de implementación, antes de que haya más de un consumidor de la API. Permite validar contratos, generar clientes y documentar sin esfuerzo manual.

## Consecuencias positivas

- Convenciones REST conocidas y predecibles para el equipo.
- Prefijo `/api` limpio, compatible con el proxy Nginx previsto (ADR-0002 y ADR-0006).
- Formato de error homogéneo facilita el manejo de errores en el frontend y en los tests.
- Diferir el versionado evita overhead en el MVP sin sacrificar la posibilidad de versionar en el futuro.
- Paginación desde el inicio evita problemas de rendimiento al crecer el volumen de ofertas.
- Separación estricta de `userId` por token previene fugas de datos entre candidatos.

## Riesgos

- **Versionado tardío**: si aparece un cliente externo antes de versionar, habrá que hacer un cambio de rutas. El riesgo es bajo en el MVP, pero debe revisarse antes de abrir la API a terceros.
- **Paginación por offset**: eficiente para volúmenes bajos. Si el catálogo de ofertas crece mucho, la paginación por cursor será más eficiente. A reevaluar cuando exista un volumen real de datos.
- **requestId ausente**: sin identificador de petición en los errores, correlacionar logs con incidentes de producción es más difícil. Se recomienda añadirlo en el Sprint 00 técnico junto con una librería de logging estructurado.

## Alternativas consideradas

### tRPC

API type-safe de extremo a extremo entre Next.js y Node.js, sin definir contratos REST explícitos.

| Criterio | REST (elegido) | tRPC |
|---|---|---|
| Curva de aprendizaje | Baja | Media (mayor acoplamiento frontend-backend) |
| Tipo de contrato | Explícito, portable | Implícito, acoplado a TypeScript |
| Clientes externos | Compatibles | No compatible (solo TypeScript) |
| Documentación | OpenAPI posible | Requiere herramientas específicas |
| Testing | Ampliamente documentado | Bien soportado pero menos referencias |
| Encaje con Express | Natural | Requiere adaptador |

Descartado porque REST es más portable y reduce el acoplamiento entre frontend y backend. tRPC limita la compatibilidad con futuros clientes externos o móviles que no sean TypeScript. Puede reevaluarse si el equipo prioriza tipado end-to-end por encima de portabilidad REST y compatibilidad con futuros clientes no TypeScript.

### GraphQL

API flexible orientada a consultas declarativas.

Descartado por sobreingeniería evidente en MVP candidate-first con 6 módulos bien delimitados. Los endpoints REST definidos en las specs son suficientemente simples. GraphQL puede considerarse si en el futuro hay múltiples clientes con necesidades de datos muy distintas.

## Impacto en specs

Las specs de Pre-Sprint 00C definen rutas sin el prefijo `/api`. Al implementar, todas las rutas llevarán el prefijo. Tabla de equivalencias:

| Ruta en spec | Ruta en API |
|---|---|
| `/auth/register` | `/api/auth/register` |
| `/auth/login` | `/api/auth/login` |
| `/auth/logout` | `/api/auth/logout` |
| `/auth/me` | `/api/auth/me` |
| `/profile/me` | `/api/profile/me` |
| `/profile/me/skills` | `/api/profile/me/skills` |
| `/profile/me/experience` | `/api/profile/me/experience` |
| `/profile/me/education` | `/api/profile/me/education` |
| `/profile/me/projects` | `/api/profile/me/projects` |
| `/profile/me/links` | `/api/profile/me/links` |
| `/profile/me/preferences` | `/api/profile/me/preferences` |
| `/profile/me/matches` | `/api/profile/me/matches` |
| `/jobs` | `/api/jobs` |
| `/jobs/:id` | `/api/jobs/:id` |
| `/jobs/:id/match` | `/api/jobs/:id/match` |
| `/saved-jobs` | `/api/saved-jobs` |
| `/saved-jobs/:jobId` | `/api/saved-jobs/:jobId` |
| `/dashboard` | `/api/dashboard` |

Los métodos `PUT` definidos en las specs de perfil quedan aceptados tal como están. Cualquier nueva ruta de actualización que se añada usará `PATCH` por defecto.

## Impacto en futuro Sprint 00 técnico

Al iniciar implementación, el Sprint 00 técnico deberá:

1. Configurar el prefijo `/api` en Express (mediante `app.use('/api', router)` o equivalente).
2. Implementar el middleware centralizado de errores que devuelve el formato JSON definido en este ADR.
3. Implementar la validación de entradas con Zod (ADR-0005) en cada controlador o middleware de ruta.
4. Implementar el helper de respuesta paginada con `data`, `total`, `page` y `limit`.
5. Verificar que el `userId` se extrae del token en el middleware de auth y nunca del body o query.
6. Evaluar si añadir `requestId` en los errores desde el inicio junto con logging estructurado.
7. Planificar la integración de OpenAPI como primer paso de documentación de contrato.

Nada de lo anterior se implementa en esta fase documental.
