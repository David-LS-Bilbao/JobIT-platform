# Sprint 22 — Plan de auditoría de production readiness y datos reales

## 1. Objetivo

Auditar el estado comprobable de JobIT antes de incorporar usuarios, datos personales, fuentes de empleo reales o un despliegue productivo. El resultado debe separar capacidades ya implementadas, configuración pendiente, activos exclusivos de desarrollo o test, riesgos de seguridad y datos, dependencias legales y carencias operativas.

## 2. Producto y terminología

JobIT es un producto modular **candidate-first** y su evolución se gestiona con criterios de seguridad, estabilidad, privacidad y operación de producción.

La naturaleza del producto no equivale a un despliegue productivo acreditado. La auditoría distinguirá expresamente:

- funcionalidad disponible en el repositorio;
- validación local de development, test y staging;
- preparación condicionada por configuración;
- despliegue productivo autorizado y operativo.

Las referencias a «MVP», «demo» o equivalentes solo se conservarán como contexto histórico o se registrarán como deuda cuando describan el estado actual.

## 3. Nivel de riesgo

**Nivel 2 — Auditoría documental y técnica.**

La ejecución del sprint tiene autonomía controlada porque se limita a inspección de solo lectura, clasificación y documentación. No modifica código, configuración, datos ni infraestructura.

La criticidad de las áreas auditadas es alta: autenticación, datos personales, destrucción accidental de datos, publicación pública, proveedores externos, términos de uso, despliegue, copias de seguridad y recuperación.

Cualquier remediación posterior que afecte a autenticación, autorización, privacidad, Prisma, migraciones, datos reales, fuentes externas, secretos, infraestructura productiva o despliegue deberá clasificarse como **Nivel 3** y ejecutarse en un sprint separado.

## 4. Alcance

- Baseline y documentación viva e histórica.
- Arquitectura modular y contratos entre API y web.
- Auth, sesión, ownership y superficies públicas.
- Perfil, JobIT CV, portfolio y avatar.
- Jobs, Saved Jobs y match explicable.
- Fixtures, mocks, seeds, uploads y datos por entorno.
- Jooble, Greenhouse, Adzuna, InfoJobs y otras fuentes localizadas.
- Development, test, staging y production.
- CI, E2E, Docker, migraciones, backups, restore, rollback, logs, observabilidad y healthchecks.
- Privacidad, ciclo de cuenta, retención, borrado y requisitos operativos.
- Matriz consolidada, priorización y roadmap posterior.

## 5. Fuera de alcance

- Cambios funcionales, de configuración, infraestructura o entorno.
- Ejecución de seeds, ingestas, migraciones, bases de datos o proveedores.
- Uso o inspección de secretos, credenciales, datos personales o contenido real de uploads.
- Despliegues, VPS, DNS, proxy, Docker build o pruebas runtime.
- Modificación de código, specs, arquitectura, decisiones, workflows o documentación distinta de los dos entregables del sprint.
- Commit, push, PR, merge, rebase, reset o gestión de ramas.
- Conclusiones jurídicas definitivas o autorización de proveedores sin revisión especializada.

## 6. Metodología

1. Confirmar ruta, rama, working tree, base y ausencia de repositorios anidados.
2. Inventariar documentación, código, pruebas, plantillas y manifiestos mediante lecturas y búsquedas controladas.
3. No abrir `.env` reales, credenciales, cookies, datos personales ni contenido de uploads.
4. Contrastar cada hipótesis inicial con evidencia contextual y mitigaciones existentes.
5. Separar la integración técnica de un proveedor de su autorización contractual o legal.
6. Clasificar cada hallazgo con una taxonomía uniforme.
7. Derivar prioridades y futuros sprints desde la evidencia, sin imponer una estructura previa.
8. Revisar coherencia, trazabilidad, seguridad y alcance antes del cierre.

## 7. Áreas de auditoría

| Área | Pregunta principal |
| --- | --- |
| Producto y documentación | ¿La documentación viva describe correctamente el producto y su estado de despliegue? |
| Arquitectura | ¿Los módulos y contratos reducen acoplamiento y divergencias? |
| Auth y seguridad | ¿Sesión, cookies, tokens, CORS, ownership y errores son aptos para usuarios reales? |
| Datos personales | ¿Información, derechos, retención, borrado e incidentes están definidos? |
| Perfil y publicación | ¿El candidato controla qué se publica y qué permanece privado? |
| Jobs y proveedores | ¿Las fuentes, trazabilidad, expiración y derechos de uso están controlados? |
| Saved Jobs y match | ¿Se preservan datos del usuario y se explican las recomendaciones? |
| Datos por entorno | ¿Mocks, fixtures, seeds y uploads están aislados? |
| Calidad | ¿CI, tests y E2E cubren los riesgos y gates necesarios? |
| Infraestructura | ¿Staging y production tienen contratos, backups, restore y observabilidad verificables? |

## 8. Clasificación

### Estado

`READY`, `READY_WITH_CONFIG`, `DEVELOPMENT_ONLY`, `TEST_ONLY`, `STAGING_ONLY`, `MOCK_LEAK`, `PRODUCTION_GAP`, `LEGAL_REVIEW_REQUIRED`, `SECURITY_REVIEW_REQUIRED`, `UNKNOWN`.

### Prioridad

- `P0`: riesgo crítico o bloqueo de producción.
- `P1`: resolver antes de usuarios o datos reales.
- `P2`: hardening importante.
- `P3`: mejora posterior o capacidad que debe mantenerse.

### Acción

`mantener`, `aislar`, `reemplazar`, `eliminar`, `configurar`, `documentar`, `investigar`, `diferir`.

### Tipo de futuro sprint

`documentación`, `frontend`, `backend`, `data`, `security`, `infrastructure`, `legal/operational`.

## 9. Estructura de evidencias

Cada hallazgo incluirá:

- identificador único;
- módulo;
- descripción;
- archivo o zona;
- evidencia en formato `ruta:línea-inicial-línea-final` cuando sea posible;
- entorno;
- tipo de dato;
- estado;
- prioridad;
- riesgo;
- acción;
- tipo de futuro sprint;
- sprint recomendado.

Las comprobaciones no textuales registrarán el comando seguro y un resumen que no revele secretos. Las conclusiones externas usarán únicamente fuentes oficiales autorizadas y se marcarán como revisión pendiente cuando no permitan una conclusión suficiente.

## 10. Fases internas

1. Baseline y mapa documental.
2. Inventario de datos y fuentes.
3. Auth, privacidad y superficies públicas.
4. Entornos, CI e infraestructura.
5. Matriz de production readiness.
6. Priorización y roadmap.
7. Verificación e informe final.

Las fases se ejecutan de forma continua y autónoma. Solo un gate de parada puede interrumpirlas.

## 11. Archivos permitidos

- `docs/sprints/sprint-22-production-readiness-real-data-audit-plan.md`
- `docs/sprints/sprint-22-production-readiness-real-data-audit-report.md`

Todo cambio necesario fuera de estos archivos se convertirá en hallazgo o futuro sprint.

## 12. Gates de parada

La ejecución se detendrá si:

- la ruta, rama o base no son las aprobadas;
- el working tree inicial no está limpio;
- aparecen repositorios anidados o cambios ajenos;
- se detecta un secreto o dato personal;
- una acción requiere ampliar el alcance;
- resulta necesaria una operación destructiva, de datos, infraestructura o Git externo.

## 13. Verificaciones

- Trazabilidad y contexto de todas las evidencias.
- Identificadores únicos y recuentos coherentes.
- Coherencia entre estados, prioridades y roadmap.
- Markdown, tablas y enlaces.
- Ausencia de secretos, datos personales y conclusiones legales no verificadas.
- Ausencia de lenguaje nuevo que presente JobIT como un MVP actual.
- `git status --short`.
- `git diff --check`.
- `git diff --stat`.
- `git diff --name-only`.

No se ejecutarán typecheck, tests, lint, build, E2E ni Docker build porque el cambio está limitado a documentación y la auditoría prohíbe operaciones runtime o de datos.

## 14. Entregables

1. Este plan versionado.
2. Informe principal con respuestas del sprint, inventario, matrices, hallazgos, resumen cuantitativo y roadmap.
3. Informe final de ejecución para revisión humana.

## 15. Criterios de cierre

- Los dos documentos son los únicos archivos modificados.
- Las diez preguntas del sprint están respondidas.
- Todas las áreas obligatorias tienen evidencia o una incógnita explícita.
- Las hipótesis iniciales están confirmadas, refutadas o clasificadas como `UNKNOWN`.
- Los riesgos P0/P1 y los bloqueos para usuarios o datos reales están identificados.
- La preparación de staging no se confunde con un despliegue productivo acreditado.
- La revisión legal externa permanece expresamente pendiente.
- El working tree queda sin stagear y listo para revisión humana.
