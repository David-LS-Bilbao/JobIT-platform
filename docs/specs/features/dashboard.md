# Spec: Dashboard candidato (M06)

## Objetivo

Dar al candidato una vista de entrada clara que resuma el estado de su perfil, muestre su actividad reciente (ofertas guardadas, matches) y le proponga próximos pasos útiles. El dashboard no añade funcionalidad nueva: consolida y presenta información de los módulos M01-M05.

## Usuario afectado

Candidato tech autenticado que quiere tener una visión rápida de su actividad y de los siguientes pasos en su búsqueda de empleo.

## Flujo principal

1. El candidato inicia sesión (M01).
2. Es redirigido al dashboard o accede desde la navegación principal.
3. El sistema carga los datos del candidato: perfil, ofertas guardadas y matches básicos.
4. El dashboard presenta el resumen organizado en secciones.
5. El candidato puede navegar a cualquier sección desde el dashboard.

## Flujos alternativos

- Primera vez: el candidato acaba de registrarse, el dashboard muestra estado inicial con indicaciones claras para completar el perfil y explorar ofertas.
- Perfil incompleto: se prioriza el bloque de progreso de perfil con CTA claros.
- Sin guardadas: bloque de guardadas en estado vacío con enlace a Jobs.
- Sin matches: bloque de matches en estado vacío con enlace a completar perfil o explorar.
- Error en algún bloque: ese bloque muestra error de forma independiente sin romper el resto.

## Modelo de datos conceptual

El dashboard no tiene modelo de datos propio. Agrega datos de:

- `CandidateProfile` (M02): completitud del perfil.
- `SavedJob` (M04): últimas ofertas guardadas.
- Match básico (M05): mejores ofertas calculadas por afinidad.

El servidor puede exponer un endpoint agregado o el cliente puede componer la vista desde endpoints existentes. A decidir en implementación.

## Endpoints previstos

Opción A (endpoint agregado):

| Método | Ruta | Descripción |
|---|---|---|
| GET | /dashboard | Datos agregados del dashboard del candidato autenticado |

Respuesta orientativa:

```json
{
  "profile": {
    "completeness": 65,
    "missingFields": ["summary", "projects"]
  },
  "savedJobs": {
    "total": 4,
    "recent": [ /* últimas 3 ofertas guardadas */ ]
  },
  "topMatches": [ /* mejores 3 ofertas con score */ ],
  "nextSteps": [
    { "action": "complete_profile", "label": "Completa tu resumen profesional" },
    { "action": "explore_jobs", "label": "Explora ofertas disponibles" }
  ]
}
```

Opción B (composición desde cliente con endpoints existentes de M02, M04, M05). Se decidirá en implementación.

Todas las rutas son privadas. Requieren sesión activa.

## Pantallas previstas

- **Cabecera de bienvenida**: nombre del candidato, titular o placeholder si está vacío.
- **Progreso del perfil**: barra o porcentaje de completitud, con indicación de secciones pendientes y CTA.
- **Ofertas guardadas recientes**: lista compacta de las últimas guardadas con enlace a la lista completa y al detalle.
- **Matches recomendados**: lista compacta de mejores ofertas según match básico, con score y enlace al detalle.
- **Próximos pasos**: lista de acciones sugeridas según el estado del candidato.
- **Estado de carga**: indicador por bloque o global.
- **Estado de error**: error por bloque sin afectar a los demás.
- **Estado inicial (primer acceso)**: mensaje de bienvenida con pasos claros para empezar.

## Reglas de negocio

- El dashboard muestra exclusivamente datos del candidato autenticado.
- La completitud del perfil se calcula como porcentaje de campos relevantes completados sobre el total posible.
- Las ofertas guardadas recientes son las últimas 3 por fecha de guardado descendente.
- Los matches recomendados son los 3 con mayor score del listado de ofertas activas.
- Los próximos pasos son sugerencias orientativas. No bloquean ni penalizan al candidato.
- Un error en un bloque no debe impedir mostrar el resto del dashboard.
- El dashboard no tiene funcionalidad propia: actúa como agregador de navegación.

## Validaciones

No hay entradas de usuario en el dashboard. Las validaciones son las de los módulos que proveen datos.

## Errores

| Situación | Comportamiento |
|---|---|
| Error al cargar datos de perfil | Bloque de perfil muestra error; resto del dashboard sigue |
| Error al cargar guardadas | Bloque de guardadas muestra error; resto sigue |
| Error al calcular matches | Bloque de matches muestra error; resto sigue |
| Sin sesión | Redirección al login |

## Criterios de aceptación

- [ ] El candidato autenticado ve su dashboard al acceder.
- [ ] El dashboard muestra el porcentaje de completitud del perfil.
- [ ] El dashboard muestra las últimas ofertas guardadas.
- [ ] El dashboard muestra las mejores ofertas por match básico.
- [ ] El dashboard muestra próximos pasos orientativos según el estado del candidato.
- [ ] Un candidato no puede ver el dashboard de otro candidato.
- [ ] Un error en un bloque no rompe el resto del dashboard.
- [ ] El estado inicial (sin datos) se muestra con indicaciones claras.

## Tests mínimos

- Candidato recién registrado → dashboard muestra estado inicial con CTA.
- Perfil al 65% completado → bloque de perfil muestra 65% y secciones pendientes.
- Candidato con 4 guardadas → bloque muestra las últimas 3.
- Candidato con matches calculados → bloque muestra los 3 mejores.
- Error en endpoint de guardadas → ese bloque muestra error; perfil y matches siguen visibles.
- Sin sesión → redirección al login.
- Dashboard de otro candidato → error de autorización (401 o 403).

## Fuera de alcance

- Notificaciones o alertas en tiempo real.
- Actividad de recruiter o empresa.
- Estadísticas de vistas de perfil.
- Historial de candidaturas o procesos de selección.
- Panel de administración.
- Widget de mensajes o chat.
- Personalización del layout por el candidato.

## Auditoría requerida

- [ ] Quality/security documental.
- [ ] Tests y verificaciones locales.
- [ ] Revisión humana.
