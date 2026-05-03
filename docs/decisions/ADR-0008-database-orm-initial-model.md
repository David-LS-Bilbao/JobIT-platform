# ADR-0008: Database/ORM y modelo inicial conceptual

## Estado

Aceptada.

## Contexto

ADR-0002 decidió orientativamente PostgreSQL + Prisma como base de datos y ORM. ADR-0006 definió que el refresh token se persiste en DB hasheado para permitir logout real y revocación. Las specs funcionales de Pre-Sprint 00C definen los modelos conceptuales de los módulos M01-M06, con entidades claras: User, CandidateProfile y sus subentidades, Job, SavedJob y un match calculado dinámicamente.

El MVP es candidate-first con carga inicial baja y sin APIs de empleo externas. Las ofertas se sirven desde datos seed o fixture cargados directamente en la base de datos.

## Decisión

**PostgreSQL como base de datos relacional principal y Prisma como ORM y herramienta de migraciones.**

### PostgreSQL

Base de datos relacional robusta, con soporte nativo para UUID, arrays, JSON, constraints de unicidad compuestas y transacciones. Alineada con el deploy futuro en VPS con Docker (ADR-0002).

### Prisma

ORM con schema declarativo, generación de tipos TypeScript, migraciones versionadas y cliente type-safe. Encaja con el stack Node.js + TypeScript del proyecto (ADR-0005) y facilita el testing con bases de datos de test aisladas.

### Modelo conceptual inicial

El modelo define las entidades del MVP y sus relaciones principales. No es un schema Prisma real: no fija tipos de columna exactos, enums, índices ni detalles de implementación. Todo ello se cerrará en el Sprint 00 técnico.

#### User

Entidad central de autenticación. Un usuario es siempre un candidato en el MVP.

| Campo | Notas |
|---|---|
| id | UUID, clave primaria |
| email | Único, normalizado a minúsculas |
| passwordHash | Hash de contraseña (bcrypt o argon2, a decidir en Sprint 00) |
| role | Enum: `CANDIDATE` por defecto. Prepara futuros roles sin implementarlos |
| createdAt | Automático |
| updatedAt | Automático |

#### RefreshToken

Persiste el refresh token hasheado por usuario para permitir logout real y revocación (ADR-0006). Un usuario puede tener varios refresh tokens activos (sesiones múltiples futuras).

| Campo | Notas |
|---|---|
| id | UUID, clave primaria |
| userId | FK a User |
| tokenHash | Hash del refresh token. Nunca el token en texto plano |
| expiresAt | Datetime de expiración |
| revokedAt | Nullable. Datetime de revocación explícita |
| createdAt | Automático |

#### CandidateProfile

Perfil profesional del candidato. Relación 1:1 con User. Se crea automáticamente al registrar el usuario.

| Campo | Notas |
|---|---|
| id | UUID, clave primaria |
| userId | FK a User, único (1:1) |
| firstName | Requerido |
| lastName | Requerido |
| headline | Titular profesional, opcional |
| summary | Resumen breve, opcional |
| location | Ciudad o región, opcional |
| locationRemote | Boolean, disponibilidad remoto |
| availabilityStatus | Enum: `ACTIVE`, `OPEN`, `NOT_LOOKING` |
| avatarUrl | URL externa, opcional |
| createdAt | Automático |
| updatedAt | Automático |

#### Skill

Skill técnica o blanda del candidato. N:1 con CandidateProfile.

| Campo | Notas |
|---|---|
| id | UUID, clave primaria |
| profileId | FK a CandidateProfile |
| name | Requerido |
| level | Enum opcional: `BASIC`, `INTERMEDIATE`, `ADVANCED` |
| category | Opcional (ej: "Frontend", "DevOps") |

Constraint: no duplicar el mismo nombre de skill en el mismo perfil.

#### Experience

Experiencia laboral del candidato. N:1 con CandidateProfile.

| Campo | Notas |
|---|---|
| id | UUID, clave primaria |
| profileId | FK a CandidateProfile |
| company | Requerido |
| role | Requerido |
| startDate | Requerido |
| endDate | Nullable si posición actual |
| current | Boolean |
| description | Opcional |
| location | Opcional |

#### Education

Formación académica. N:1 con CandidateProfile.

| Campo | Notas |
|---|---|
| id | UUID, clave primaria |
| profileId | FK a CandidateProfile |
| institution | Requerido |
| title | Requerido |
| field | Opcional |
| startDate | Opcional |
| endDate | Nullable si en curso |
| current | Boolean |

#### Project

Proyectos destacados. N:1 con CandidateProfile.

| Campo | Notas |
|---|---|
| id | UUID, clave primaria |
| profileId | FK a CandidateProfile |
| name | Requerido |
| description | Opcional |
| technologies | Array de strings |
| url | Opcional |
| repoUrl | Opcional |

#### Link

Enlaces de presencia online. N:1 con CandidateProfile.

| Campo | Notas |
|---|---|
| id | UUID, clave primaria |
| profileId | FK a CandidateProfile |
| type | Enum: `GITHUB`, `LINKEDIN`, `PORTFOLIO`, `OTHER` |
| url | Requerido, validado como URL |

#### JobPreferences

Preferencias laborales del candidato. 1:1 con CandidateProfile.

| Campo | Notas |
|---|---|
| id | UUID, clave primaria |
| profileId | FK a CandidateProfile, único (1:1) |
| desiredRoles | Array de strings |
| preferredLocations | Array de strings |
| remotePreference | Enum: `REMOTE`, `HYBRID`, `ON_SITE`, `ANY` |
| seniority | Enum: `JUNIOR`, `MID`, `SENIOR` |
| salaryMin | Opcional, entero |
| salaryMax | Opcional, entero |
| contractTypes | Array de strings |

#### Job

Oferta laboral. Recurso público/seed. No tiene propietario de candidato. Se carga mediante seed o fixture.

| Campo | Notas |
|---|---|
| id | UUID, clave primaria |
| title | Requerido |
| company | Requerido |
| location | Ciudad o región |
| remoteType | Enum: `REMOTE`, `HYBRID`, `ON_SITE` |
| description | Descripción completa |
| requirements | Array de strings |
| seniority | Enum: `JUNIOR`, `MID`, `SENIOR`, `ANY` |
| contractType | String |
| salaryMin | Opcional |
| salaryMax | Opcional |
| tags | Array de strings |
| status | Enum: `ACTIVE`, `CLOSED` |
| postedAt | Datetime |
| expiresAt | Nullable |

No hay propietario de oferta en el MVP. No existe panel de publicación. Las ofertas se insertan mediante seed o script de fixture.

#### SavedJob

Relación entre User y Job. Sin entidad propia más allá del vínculo.

| Campo | Notas |
|---|---|
| id | UUID, clave primaria |
| userId | FK a User |
| jobId | FK a Job |
| savedAt | Datetime, automático |

Constraint única: `(userId, jobId)`. Un candidato no puede guardar la misma oferta dos veces.

#### MatchResult

**No se persiste en el MVP.** El match básico (M05) se calcula dinámicamente en cada petición a partir del perfil del candidato y los datos de la oferta. No hay historial de match, no hay tabla `MatchResult` en el MVP.

Se podrá evaluar la persistencia de `MatchResult` en fases posteriores si existe alguna de estas necesidades:

- Histórico de afinidad para analytics o feedback al candidato.
- Caché de resultados para mejorar rendimiento con volumen alto.
- Debugging o auditoría del cálculo.
- Base para sistemas de recomendación futuros.

Hasta que no exista una de esas necesidades reales, el match es stateless: se calcula y se devuelve en la respuesta, sin persistir.

### Constraints básicas

| Constraint | Descripción |
|---|---|
| `User.email` | Único en la tabla |
| `CandidateProfile.userId` | Único (1:1 con User) |
| `JobPreferences.profileId` | Único (1:1 con CandidateProfile) |
| `SavedJob.(userId, jobId)` | Único compuesto (sin duplicados) |
| `Skill.(profileId, name)` | Único compuesto (sin skills duplicadas por perfil) |

### Ownership y separación por usuario

- Todos los datos privados del candidato (CandidateProfile, Skill, Experience, Education, Project, Link, JobPreferences, SavedJob) están vinculados a un `userId`.
- El servidor verifica siempre que el `userId` del token coincide con el `userId` del recurso antes de devolver o modificar datos.
- El `userId` nunca se acepta del body ni de la query: se extrae del token verificado (ADR-0006, ADR-0007).
- Job es un recurso público sin propietario. Cualquier candidato autenticado puede leer Jobs.

### Seeds y datos mock de Jobs

El módulo de Jobs (M03) requiere datos reales para funcionar desde el primer sprint de implementación. En ausencia de APIs externas o panel de publicación, el Sprint 00 técnico creará un seed o fixture con un conjunto inicial de ofertas tech representativas (10-20 orientativamente). El seed debe ser reproducible y ejecutable con un comando Prisma o script equivalente.

No se diseñan ni crean esos datos en esta fase documental.

## Consecuencias positivas

- PostgreSQL ofrece constraints compuestas, transacciones y tipos avanzados (arrays, JSON) que el modelo del MVP necesita.
- Prisma genera tipos TypeScript desde el schema, eliminando divergencias entre modelo y código.
- Las migraciones versionadas de Prisma permiten evolucionar el schema con trazabilidad y control.
- El modelo conceptual cubre todos los módulos M01-M06 sin entidades especulativas.
- No persistir MatchResult reduce la complejidad inicial sin sacrificar la funcionalidad del match básico.
- La constraint única en SavedJob y Skill evita duplicados sin lógica extra en el servidor.

## Riesgos

- **Detalles finos de schema**: los tipos exactos de columna, enums de Prisma, índices y configuración de relaciones se cerrarán en Sprint 00 técnico. Pueden aparecer ajustes respecto al modelo conceptual definido aquí.
- **Migración de seeds en entornos**: los seeds de Jobs deben ser reproducibles en desarrollo, test y producción. Hay que establecer una estrategia clara (seed separado de migraciones, datos de prueba aislados).
- **Escalabilidad del modelo de perfil**: el modelo actual pone todas las subentidades del perfil como tablas independientes. Con muchos candidatos, las queries que agregan perfil completo pueden ser costosas. A reevaluar si hay problemas reales de rendimiento.
- **Match dinámico con volumen alto**: si el catálogo de Jobs crece mucho, calcular el match para todos en `/profile/me/matches` puede ser lento. Considerar límite de jobs evaluados o persistencia parcial de resultados cuando el volumen lo justifique.
- **JobPreferences como 1:1**: el modelo actual crea una tabla separada para preferencias. Podría simplificarse a columnas en CandidateProfile. A decidir en Sprint 00 según preferencias del equipo y facilidad de migraciones.

## Alternativas consideradas

### MongoDB + Mongoose

Base de datos documental. Flexible para modelos evolutivos, pero sin constraints relacionales nativas.

| Criterio | PostgreSQL + Prisma (elegido) | MongoDB + Mongoose |
|---|---|---|
| Relaciones y constraints | Nativas y verificadas por la DB | Responsabilidad del ORM/aplicación |
| Unicidad compuesta | Constraint de DB | Índice único, menos garantías |
| Tipado TypeScript | Prisma genera tipos | Mongoose + tipos manuales o Typegoose |
| Migraciones | Versionadas con Prisma | No nativas, requiere herramientas externas |
| Encaje con datos relacionales | Alto | Bajo (perfil + subentidades son relacionales) |
| Deploy en VPS | Sencillo con Docker | Sencillo con Docker |

Descartado porque el modelo del MVP es claramente relacional: User → Profile → Skill/Experience/Education/Project, SavedJob como relación N:M entre User y Job. MongoDB añadiría complejidad sin ventajas reales para este modelo.

### SQL manual sin ORM (pg / postgres.js)

Queries SQL directas sin abstracción de ORM.

Descartado por el coste de mantenimiento sin tipado generado. Prisma aporta tipado, migraciones y DX suficientes para el MVP sin añadir complejidad. Se puede reevaluar si Prisma resulta un cuello de botella real en consultas complejas.

### TypeORM

ORM alternativo a Prisma, orientado a decoradores y clases.

Descartado porque Prisma tiene mejor integración con el ecosistema TypeScript moderno, schema declarativo más legible y documentación más activa. TypeORM ha tenido problemas de mantenimiento en el pasado. Sin ventaja clara sobre Prisma para el MVP.

### Drizzle ORM

ORM ligero y type-safe, más cercano a SQL que Prisma.

Descartado para el MVP por ser más reciente y con ecosistema menos maduro que Prisma para el caso de uso del proyecto. Puede reevaluarse si el equipo prefiere control más fino sobre las queries.

### Persistir MatchResult desde el inicio

Crear una tabla `MatchResult` que almacene el score y el desglose por factor para cada par (candidato, oferta).

Descartado porque el match básico del MVP es determinista y calculable en tiempo real. Persistir añade complejidad de sincronización (¿cuándo invalidar el resultado si cambia el perfil o la oferta?), storage extra y lógica de limpieza. No hay ninguna necesidad documentada de histórico, analytics ni caché en el MVP inicial.

## Impacto en specs

- **Auth (M01)**: `User` y `RefreshToken` cubren los requisitos de auth: email único, hash de contraseña, logout real por revocación del refresh token.
- **Candidate Profile + CV (M02)**: `CandidateProfile`, `Skill`, `Experience`, `Education`, `Project`, `Link` y `JobPreferences` cubren todos los campos definidos en la spec.
- **Jobs (M03)**: `Job` con `status`, `tags`, filtros y paginación. Seeds como fuente de datos inicial.
- **Saved Jobs (M04)**: `SavedJob` con constraint única `(userId, jobId)`. Ownership por `userId`.
- **Match básico (M05)**: sin tabla propia. Se calcula dinámicamente con los datos de `CandidateProfile` (skills, preferencias, seniority) y `Job` (tags, remoteType, seniority).
- **Dashboard (M06)**: agrega datos de `CandidateProfile`, `SavedJob` y match calculado. Sin modelo propio.

## Impacto en futuro Sprint 00 técnico

Al iniciar implementación, el Sprint 00 técnico deberá:

1. Instalar Prisma y configurar el cliente (`prisma init`, datasource PostgreSQL).
2. Escribir el schema Prisma inicial con las entidades del modelo conceptual: tipos exactos, enums, índices y relaciones.
3. Ejecutar la primera migración (`prisma migrate dev`).
4. Crear el seed inicial de Jobs (10-20 ofertas tech representativas).
5. Configurar las variables de entorno de conexión a PostgreSQL para desarrollo, test y producción.
6. Decidir la estrategia de seeds: separada de migraciones, ejecutable con `prisma db seed`.
7. Evaluar si `JobPreferences` se mantiene como tabla independiente o se integra en `CandidateProfile`.
8. Revisar si la constraint única `Skill.(profileId, name)` debe ser case-insensitive.

Nada de lo anterior se implementa en esta fase documental.
