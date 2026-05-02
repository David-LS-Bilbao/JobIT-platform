# Spec: Candidate Profile + CV (M02)

## Objetivo

Permitir que el candidato construya y mantenga un perfil profesional estructurado: datos básicos, titular, resumen, ubicación, disponibilidad, skills, experiencia, educación, proyectos, enlaces y preferencias laborales. Este perfil es la base para el match básico y la visibilidad futura del candidato.

## Usuario afectado

Candidato tech autenticado que quiere representar su perfil profesional de forma ordenada y actualizable.

## Flujo principal

1. El candidato inicia sesión (requiere M01 auth).
2. Accede a su perfil o al formulario de perfil inicial (si es primera vez).
3. Completa o actualiza secciones de su perfil progresivamente.
4. Cada sección se guarda de forma independiente o como parte de un formulario unificado (a decidir en implementación).
5. El candidato puede ver su perfil completo en cualquier momento.
6. Los cambios se reflejan en el dashboard y en el match básico.

## Flujos alternativos

- Perfil incompleto: el sistema muestra indicador de progreso y secciones pendientes.
- Validación de campo inválido: error en línea sin perder datos ya introducidos.
- Guardado parcial: el candidato puede guardar una sección aunque otras estén incompletas.
- Error de servidor al guardar: mensaje de error sin perder los datos del formulario.

## Modelo de datos conceptual

### CandidateProfile

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Clave primaria |
| userId | UUID | FK a User (1:1) |
| firstName | string | Requerido |
| lastName | string | Requerido |
| headline | string | Titular profesional, opcional |
| summary | string | Resumen breve, opcional |
| location | string | Ciudad o región, opcional |
| locationRemote | boolean | Disponibilidad para remoto |
| availabilityStatus | enum | `ACTIVE`, `OPEN`, `NOT_LOOKING` |
| avatarUrl | string | URL de foto, opcional |
| createdAt | datetime | Automático |
| updatedAt | datetime | Automático |

### Skill

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Clave primaria |
| profileId | UUID | FK a CandidateProfile |
| name | string | Requerido (ej: "TypeScript") |
| level | enum | `BASIC`, `INTERMEDIATE`, `ADVANCED` — opcional |
| category | string | Opcional (ej: "Frontend", "DevOps") |

### Experience

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Clave primaria |
| profileId | UUID | FK a CandidateProfile |
| company | string | Requerido |
| role | string | Requerido |
| startDate | date | Requerido |
| endDate | date | Null si posición actual |
| current | boolean | True si posición actual |
| description | string | Opcional, resumen de responsabilidades |
| location | string | Opcional |

### Education

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Clave primaria |
| profileId | UUID | FK a CandidateProfile |
| institution | string | Requerido |
| title | string | Requerido |
| field | string | Área de estudio, opcional |
| startDate | date | Opcional |
| endDate | date | Opcional |
| current | boolean | True si en curso |

### Project

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Clave primaria |
| profileId | UUID | FK a CandidateProfile |
| name | string | Requerido |
| description | string | Opcional |
| technologies | string[] | Lista de tecnologías |
| url | string | Enlace al proyecto, opcional |
| repoUrl | string | Enlace al repositorio, opcional |

### Link

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Clave primaria |
| profileId | UUID | FK a CandidateProfile |
| type | enum | `GITHUB`, `LINKEDIN`, `PORTFOLIO`, `OTHER` |
| url | string | Requerido, validado como URL |

### JobPreferences

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Clave primaria |
| profileId | UUID | FK a CandidateProfile (1:1) |
| desiredRoles | string[] | Roles buscados |
| preferredLocations | string[] | Ubicaciones preferidas |
| remotePreference | enum | `REMOTE`, `HYBRID`, `ON_SITE`, `ANY` |
| seniority | enum | `JUNIOR`, `MID`, `SENIOR` — orientativo |
| salaryMin | integer | Opcional, en moneda base |
| salaryMax | integer | Opcional |
| contractTypes | string[] | `FULL_TIME`, `PART_TIME`, `CONTRACT`, `FREELANCE` |

## Endpoints previstos

| Método | Ruta | Descripción |
|---|---|---|
| GET | /profile/me | Obtener perfil del candidato autenticado |
| PUT | /profile/me | Actualizar datos básicos del perfil |
| POST | /profile/me/skills | Añadir skill |
| DELETE | /profile/me/skills/:id | Eliminar skill |
| POST | /profile/me/experience | Añadir experiencia |
| PUT | /profile/me/experience/:id | Actualizar experiencia |
| DELETE | /profile/me/experience/:id | Eliminar experiencia |
| POST | /profile/me/education | Añadir educación |
| PUT | /profile/me/education/:id | Actualizar educación |
| DELETE | /profile/me/education/:id | Eliminar educación |
| POST | /profile/me/projects | Añadir proyecto |
| PUT | /profile/me/projects/:id | Actualizar proyecto |
| DELETE | /profile/me/projects/:id | Eliminar proyecto |
| PUT | /profile/me/links | Actualizar enlaces |
| PUT | /profile/me/preferences | Actualizar preferencias laborales |

Todas las rutas son privadas. Requieren sesión activa de auth.

## Pantallas previstas

- **Perfil completo**: vista de solo lectura del perfil del candidato.
- **Edición de datos básicos**: formulario con nombre, titular, resumen, ubicación, disponibilidad.
- **Gestión de skills**: listado editable con añadir/eliminar.
- **Gestión de experiencia**: listado con formulario de añadir y editar entrada.
- **Gestión de educación**: listado con formulario de añadir y editar entrada.
- **Gestión de proyectos**: listado con formulario de añadir y editar entrada.
- **Gestión de enlaces**: formulario simple de URLs por tipo.
- **Preferencias laborales**: formulario de preferencias de búsqueda.
- **Indicador de completitud**: porcentaje o progreso visible que anime a completar el perfil.
- **Estados vacío/carga/error** en cada sección.

## Reglas de negocio

- Cada candidato tiene exactamente un perfil (1:1 con User).
- El perfil se crea automáticamente al registrar el candidato (vacío).
- Los campos opcionales no bloquean el guardado.
- Un candidato solo puede ver y editar su propio perfil.
- Las experiencias actuales tienen `current: true` y `endDate: null`.
- No puede haber dos experiencias actuales con fechas solapadas sin validación.
- Las skills sin nivel son válidas; el nivel es opcional.
- Los enlaces se validan como URLs con formato correcto.
- Las preferencias de salario son opcionales y privadas (no visibles para otros en el MVP).

## Validaciones

| Campo | Regla |
|---|---|
| firstName, lastName | Requeridos, mínimo 2 caracteres |
| headline | Máximo 120 caracteres |
| summary | Máximo 1000 caracteres |
| skill.name | Requerido, no duplicado en el mismo perfil |
| experience.startDate | Requerida, anterior o igual a endDate |
| experience.endDate | Posterior a startDate si no es posición actual |
| Link.url | Formato URL válido |
| salaryMin | Positivo si se introduce |
| salaryMax | Mayor o igual a salaryMin si se introduce |

## Errores

| Situación | Mensaje orientativo |
|---|---|
| Campo requerido vacío | "Este campo es obligatorio" |
| Skill duplicada | "Ya has añadido esa skill" |
| Fecha de inicio posterior a fin | "La fecha de inicio debe ser anterior a la de fin" |
| URL inválida | "Introduce una URL válida" |
| Error de servidor | "No se han podido guardar los cambios. Inténtalo de nuevo" |

## Criterios de aceptación

- [ ] El candidato puede ver su perfil vacío tras registrarse.
- [ ] El candidato puede actualizar datos básicos y guardarse correctamente.
- [ ] El candidato puede añadir, editar y eliminar skills, experiencias, educación y proyectos.
- [ ] El candidato puede añadir preferencias laborales.
- [ ] El perfil muestra indicador de completitud.
- [ ] Un candidato no puede acceder ni editar el perfil de otro candidato.
- [ ] Los campos requeridos son validados en el servidor.
- [ ] Los errores se muestran sin perder datos del formulario.

## Tests mínimos

- Crear perfil vacío al registrar usuario → perfil existe con userId correcto.
- Actualizar datos básicos con datos válidos → cambios guardados.
- Actualizar datos básicos con campo requerido vacío → error de validación.
- Añadir skill → skill aparece en el perfil.
- Añadir skill duplicada → error sin duplicar.
- Eliminar skill → skill desaparece del perfil.
- Añadir experiencia con fechas incoherentes → error de validación.
- Añadir experiencia actual → `current: true`, `endDate: null`.
- Acceder a perfil de otro candidato → error de autorización (403).
- URL de enlace inválida → error de validación.

## Fuera de alcance

- Perfil público visible para recruiters o empresas.
- Exportación del perfil a PDF.
- Importación desde LinkedIn o CV externo.
- Validación de skills con insignias o evidencias.
- Foto de perfil con subida de archivo (solo URL externa en MVP).
- Historial de cambios del perfil.
- Modo borrador o versiones del perfil.

## Auditoría requerida

- [ ] Quality/security documental.
- [ ] Tests y verificaciones locales.
- [ ] Revisión humana.
