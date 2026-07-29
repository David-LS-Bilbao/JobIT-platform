# Arquitectura 02: Módulos candidate-first

> El nombre del archivo se conserva por compatibilidad histórica. Este documento
> describe módulos implementados y límites actuales; no presenta JobIT como
> prototipo, demo o “MVP” vigente.

## Enfoque

La arquitectura funcional prioriza al candidato y divide responsabilidades por
dominio. Cada módulo activo dispone de spec, tests y una superficie API o web
delimitada.

## Módulos activos

### Auth

Registro, login, logout y consulta del usuario autenticado. Usa access token en
memoria del frontend y refresh token en cookie HttpOnly. Protege rutas mediante
middleware de autenticación.

Límite: no existe todavía endpoint de refresh; tras una recarga o expiración se
requiere un nuevo login.

### Candidate Profile & CV

Perfil profesional con:

- datos principales y preferencias;
- skills;
- experiencia;
- educación;
- proyectos;
- enlaces.

Las operaciones privadas derivan el usuario del token y aplican ownership.

### Portfolio

Edición, configuración de publicación y lectura pública por slug. Las URLs públicas
dependen de una base URL configurada por entorno; no debe inventarse un dominio.

### Jobs

Listado paginado, búsqueda y filtros, detalle de ofertas activas y contrato público
sanitizado. Las fuentes activas son:

- dataset `INTERNAL` controlado;
- Jooble;
- Greenhouse.

`ADZUNA` está reservado en el modelo, pero no es un proveedor activo.

### Saved Jobs

Guardado idempotente, listado y eliminación de ofertas del candidato autenticado.
Aplica ownership y reutiliza el DTO público de oferta.

### Match básico explicable

Calcula afinidad por skills, modalidad, seniority y ubicación. Devuelve puntuación,
nivel, coincidencias, carencias, factores y explicación.

Es heurístico y determinista. No usa LLM, embeddings, machine learning ni decisiones
automatizadas sobre personas.

### Candidate Dashboard

Agrega:

- completitud y datos básicos del perfil;
- skills;
- ofertas guardadas recientes;
- mejores matches;
- próximos pasos deterministas.

Es una vista de solo lectura que compone servicios existentes y no añade persistencia.

### Landing pública

Presenta la propuesta candidate-first y enlaza a navegación pública relevante. Está
endurecida para:

- responsive de 320 a 1440 px;
- navegación móvil;
- objetivos táctiles;
- contraste AA;
- skip link;
- reduced motion;
- preview sintético;
- metadatos aprobados sin canonical, dominio ni assets sociales inventados.

## Capacidades transversales

### API pública de ofertas

`JobPublicDto` expone procedencia y URL segura, y oculta identificadores y tiempos
internos de ingesta. Dashboard, guardados y match reutilizan el mismo límite.

### Ingesta externa

Jooble y Greenhouse siguen `client -> normalizer -> ingest service -> DB`. Los
scripts son manuales, backend-only e idempotentes. No hay endpoints de ingesta,
scheduler ni scraping.

### Seguridad de datos de desarrollo y test

Los tests requieren una base dedicada. El seed interno valida el destino y limita
sus escrituras al namespace controlado `jobit-seed-*`, sin borrar ofertas externas ni
datos internos fuera de ese conjunto.

### Calidad

Los módulos usan specs previas, Vitest, pruebas de integración y, donde aplica,
Playwright. El CI ejecuta typecheck, tests y build de API, además de lint, typecheck,
tests y build del web.

## Fuera de alcance actual

- JobIT Recruit completo.
- Panel empresarial.
- ATS y candidaturas internas.
- IA avanzada o scoring opaco.
- Comunidad y monetización.
- Aplicación móvil.
- Automatización periódica de ingestas.
- Superficies legales públicas sin aprobación especializada.
- Despliegue productivo no acreditado.

## Regla de alcance

Todo módulo nuevo o ampliación material requiere:

1. spec aprobada;
2. criterios de aceptación y tests mínimos;
3. implementación en una rama corta desde `dev`;
4. verificación local;
5. auditoría de calidad y seguridad;
6. documentación viva actualizada;
7. revisión humana y gates Git separados.
