# JobIT Job Radar + Candidate Discovery — Estrategia canónica de producto y arquitectura

**Documento:** `docs/product/jobit-job-radar-candidate-discovery-strategy.md`
**Origen:** OPS-04 — Job Radar Strategy Canonicalization
**Baseline de creación:** `91b0d449751756d715cb589d2d8ed0bf6cb56020`
**Rama:** `docs/ops-04-job-radar-strategy-canonicalization`

```text
ORCHESTRATOR DECISION:
APPROVED_FOR_PLANNING_WITH_CONDITIONS

DOCUMENT TYPE:
PRODUCT AND ARCHITECTURE STRATEGY

IMPLEMENTATION AUTHORIZATION:
NONE
```

Este documento sustituye, como fuente canónica, a la propuesta externa "JobIT Job Radar + Candidate Discovery" v2.0 (30 de julio de 2026), recibida como material de entrada no canónico durante OPS-04. Esa propuesta se ha contrastado contra la auditoría global independiente aceptada y contra el estado real del repositorio; las secciones siguientes conservan lo que resultó consistente y corrigen lo que no.

No es una spec ejecutable. No autoriza implementación, migraciones, uso de APIs reales, secretos, contratación de proveedores, staging, producción, commit, push, PR, merge ni despliegue. Las capacidades descritas deberán dividirse en specs y sprints independientes, cada uno con su propia aprobación.

---

## 1. Propósito

Definir la visión de producto y arquitectura para evolucionar JobIT, desde la plataforma candidate-first existente, hacia:

1. **JobIT Job Radar** — orientado al candidato: descubrir ofertas, guardar búsquedas, ejecutarlas sobre el catálogo local, recibir resultados nuevos, clasificar oportunidades, explicar coincidencias, guardar o descartar, y enlazar siempre a la fuente oficial.
2. **JobIT Recruit / Candidate Discovery** — orientado a empresas verificadas, previsto para una fase posterior e independiente: publicar ofertas nativas, buscar perfiles visibles por decisión propia del candidato, aplicar filtros permitidos, mostrar coincidencias explicables, solicitar contacto, conservando siempre la decisión humana.

## 2. Resumen ejecutivo

JobIT puede aportar valor recurrente al candidato sin depender de un gran volumen de ofertas propias, mediante:

```text
fuentes externas autorizadas
→ ingesta global backend-only
→ validación y normalización
→ catálogo local PostgreSQL
→ búsquedas personales locales
→ match explicable
→ enlace oficial externo
```

Regla central, sin excepciones: **las búsquedas personales del candidato no llaman directamente a proveedores externos.**

Se separan tres pipelines:

```text
PIPELINE A — Catálogo e ingesta global
proveedor autorizado → ingesta backend-only → validación → normalización → persistencia en Job → actualización, expiración y cierre

PIPELINE B — Job Radar del candidato
búsqueda guardada → consulta local en PostgreSQL → filtros → clasificación → match → explicación → resultados nuevos → notificación

PIPELINE C — Candidate Discovery futuro
CandidateVisibility opt-in → empresa verificada → filtros permitidos → consulta local → perfil limitado → explicación → solicitud de contacto → aceptación o rechazo del candidato → auditoría
```

Este diseño reutiliza cada oferta ingerida para muchos candidatos, evita llamadas externas por búsqueda personal, reduce coste y presión de rate limit, mantiene PostgreSQL como única fuente de lectura para búsquedas de candidato, conserva la arquitectura vigente de Jooble y Greenhouse, y permite evaluar fuentes adicionales sin acoplarlas a las búsquedas personales.

La secuencia obligatoria de esta estrategia es:

```text
readiness candidate-first
→ Job Radar local
→ fuentes nuevas autorizadas
→ empresas y ofertas nativas
→ Candidate Discovery
```

No se prioriza la ampliación de proveedores por delante de la readiness candidate-first.

## 3. Contexto actual de JobIT

JobIT ya dispone de: autenticación, perfil candidato, CV tech, skills, experiencia, educación, proyectos, portfolio público, listado y detalle de ofertas, filtros, paginación, Saved Jobs, match explicable determinista, dashboard candidato, PostgreSQL como fuente local, ingesta backend-only, tests unitarios/integración/E2E, y Docker con preparación de staging.

Fuentes activas (estado técnico, ver §8 para el estado de gobernanza):

```text
INTERNAL
JOOBLE
GREENHOUSE
```

El modelo de datos reserva además un valor de enum `ADZUNA` (`apps/api/prisma/schema.prisma`), sin que su presencia autorice un proveedor real ni ninguna integración.

Reglas vigentes que esta estrategia preserva: sin scraping; sin búsqueda live contra proveedores por request de candidato; ingesta manual, programada o controlada, siempre backend-only; PostgreSQL como fuente de lectura para el candidato; `source` visible en cada oferta; enlace oficial externo; secretos fuera del repositorio; fixtures y mocks en tests; upsert idempotente por `(source, externalId)`; cierre antes que borrado físico; Saved Jobs preservados ante cambios de catálogo; sin payload crudo persistido por defecto.

## 4. Decisión de producto

> JobIT es una plataforma candidate-first que ayuda a los profesionales tecnológicos a descubrir, organizar y comprender oportunidades laborales a partir de un catálogo local construido con fuentes autorizadas. En una fase posterior, permitirá a empresas verificadas publicar ofertas y descubrir perfiles de candidatos que hayan activado voluntariamente su visibilidad.

JobIT no será inicialmente: un ATS completo; un portal universal de candidatura; un agregador basado en scraping; una herramienta de rechazo automático; una plataforma de evaluación psicológica; un sistema de decisiones laborales automatizadas; una base abierta de candidatos; ni un servicio de reventa de feeds de empleo.

## 5. Principios rectores

1. **Candidate-first** — la primera utilidad debe beneficiar directamente al candidato.
2. **Catálogo local como fuente de lectura** — las búsquedas del candidato se ejecutan contra PostgreSQL, nunca contra el proveedor.
3. **Ingesta global controlada** — los proveedores se consultan de forma desacoplada, backend-only y conforme a sus límites.
4. **Fuente autorizada** — cada fuente debe superar due diligence legal, técnica, comercial y operativa antes de cualquier integración.
5. **Enlace oficial** — la candidatura y el detalle definitivo permanecen en el origen.
6. **Explicabilidad** — toda recomendación se apoya en datos observables y reglas documentadas.
7. **Decisión humana** — JobIT no decide a quién contratar ni rechaza automáticamente personas.
8. **Consentimiento** — la visibilidad empresarial nunca se activa por defecto.
9. **Minimización** — solo se tratan los datos necesarios.
10. **Modularidad** — fuentes, catálogo, búsquedas, resultados, match, empresas y Candidate Discovery son dominios separados.
11. **Progresión controlada** — cada capacidad requiere spec, tests, gates y aprobación propios; ninguna capacidad de esta estrategia se implementa como consecuencia automática de su aprobación conceptual.

## 6. Arquitectura objetivo

### 6.1 Pipeline A — Catálogo e ingesta global

```text
fuente autorizada → client/provider → validación de payload → normalizer → contrato interno → ingest service → upsert en Job → métricas → cierre/expiración
```

### 6.2 Pipeline B — Job Radar del candidato

```text
búsqueda guardada (concepto: SavedJobSearch) → ejecución manual o programada → query local → filtros → match → explicación → resultado (concepto: JobSearchResult) → interacción del candidato → notificación
```

### 6.3 Pipeline C — Candidate Discovery futuro

```text
visibilidad opt-in (concepto: CandidateVisibility) → empresa verificada → filtros permitidos → consulta local → perfil limitado → explicación → solicitud de contacto → aceptación o rechazo del candidato → auditoría
```

### 6.4 Separación de responsabilidades

- **Providers externos:** autenticación con proveedor, paginación, rate limits, recuperación de datos, validación, normalización, atribución, caducidad, errores remotos.
- **Catálogo JobIT:** persistencia, estado, provenance, deduplicación por fuente, exposición local, Saved Jobs, cierre, métricas.
- **Job Radar:** búsquedas guardadas, preferencias, ejecución local, resultados nuevos, ranking, match, explicación, notificaciones, historial.
- **Candidate Discovery:** visibilidad, empresas, autorización, filtros, perfiles limitados, solicitudes de contacto, auditoría, prevención de abuso.

### 6.5 Reutilización del modelo `Job`

JobIT ya dispone de un modelo multi-fuente (`Job`, con `source`, `externalId`, `sourceUrl`, `ingestedAt`, `status`, `postedAt`, `expiresAt`, y `SavedJob` como relación existente). **No se crea automáticamente una tabla `ExternalJob`.** Una tabla adicional de catálogo externo solo se justificará si, durante una futura spec, el modelo `Job` demuestra una limitación real que no pueda resolverse de forma aditiva. Los modelos nuevos que Job Radar podría requerir a futuro —conceptualmente, `SavedJobSearch`, `JobSearchRun`, `JobSearchResult`, `UserJobInteraction`— no se crean en esta estrategia; su diseño detallado corresponde a la Fase A del roadmap (§15).

## 7. Etapa previa — Readiness candidate-first

Ninguna fase de fuentes nuevas ni de Job Radar local puede anteponerse a esta etapa. Son las condiciones vigentes de producción y de deuda candidate-first, heredadas del repositorio y de la auditoría global independiente aceptada, sin modificación:

**Production blockers técnicos — exactamente uno:**

```text
B3-BACKUP-01
Backup y restore no probados
PRODUCTION_BLOCKER / P1 / OPEN
```

El blocker de abuso de API (`B3-ABUSE-01`) quedó resuelto: rate limiting integrado en la API. PR #110, merge commit `4102c94e38bc0df8bb73ef05f49357cd8f8b69df`.

El blocker de supply chain de Next.js (`B3-SUPPLY-01`) quedó resuelto: la versión integrada en `dev` es `16.2.12`. Esta estrategia no fija una versión objetivo ni convierte `16.2.12` en un valor permanente; la comprobación de la versión vigente corresponde a cada futura ejecución sobre el repositorio en ese momento.

**Gate legal — separado, no es un production blocker técnico adicional:**

```text
S22-PRIV-01
PARTIALLY_REMEDIATED
LEGAL GATE OPEN
```

**Deuda candidate-first transversal:**

```text
B4-STATE-02
401 y sesión expirada no gestionados transversalmente en mutaciones
CONTROLLED_DEBT / P1 / OPEN
```

No es un production blocker técnico independiente, pero condiciona la calidad de la experiencia de cualquier superficie nueva, incluido Job Radar.

**Ciclo de vida de cuenta:**

```text
S22-AUTH-06 / B4-OPS-02
Account deletion and export
OPEN
LEGAL_AND_ACCOUNT_LIFECYCLE_HANDOFF
```

Las futuras entidades de Job Radar (`SavedJobSearch` y las que se deriven) deberán definir, como parte de su propia spec y no de esta estrategia, al menos: exportación, eliminación, retención, anonimización, revocación y propagación del borrado, alineadas con este mismo ciclo de vida de cuenta.

Ninguna de las condiciones anteriores se combina en una condición técnica adicional equivalente al production blocker técnico vigente.

## 8. Gobernanza de fuentes externas

Cada fuente, existente o candidata, se gobierna de forma individual y con evidencia propia. La implementación técnica de una fuente nunca implica, por sí sola, su aprobación contractual.

### 8.1 CleanJobData

```text
CANDIDATE_FOR_TECHNICAL_DUE_DILIGENCE
EVIDENCE_REVIEW_REQUIRED
NO_SPIKE_AUTHORIZED
```

No existe ninguna referencia previa a CleanJobData en el repositorio ni en su historial. Toda afirmación externa sobre permisos, precios, cuotas, planes gratuitos o condiciones comerciales de este proveedor —incluida cualquier comunicación por email— se clasifica como:

```text
PROVIDER_CLAIM_PENDING_VERIFICATION
```

hasta que exista una revisión de evidencia formal, con entidad legal, jurisdicción, derechos downstream, opt-out y continuidad del servicio verificados. No está autorizado: acceso a playground, trial, spike técnico, uso de credenciales, pruebas reales ni llamadas externas al proveedor. Cualquier due diligence futura se planifica en la Fase E del roadmap (§15), como spec independiente y con su propia aprobación.

### 8.2 Lanbide

```text
CANDIDATE_SOURCE_FOR_DUE_DILIGENCE
```

No existe ninguna referencia previa a Lanbide en el repositorio. Lanbide no es la primera fuente aprobada, no es la primera prioridad confirmada, no tiene spike autorizado, no tiene integración autorizada y no es una fuente productiva. Su due diligence conceptual pertenece a la misma Fase E del roadmap (§15) que CleanJobData, sin orden de prioridad implícito entre ambas y sin comprometer una secuencia de sprints.

### 8.3 Jooble y Greenhouse

Ambos proveedores están técnicamente implementados y en ingesta controlada (`JOOBLE: ACTIVE / CONTROLLED INGESTION`; `GREENHOUSE: IMPLEMENTED / CONTROLLED PROVIDER`, según el snapshot vigente del repositorio). Esta estrategia distingue siempre:

```text
TECHNICALLY_IMPLEMENTED
```

de:

```text
CONTRACTUALLY_REVIEWED
APPROVED_FOR_STAGING
APPROVED_FOR_PRODUCTION
```

La existencia de código, tests o documentación técnica para Jooble y Greenhouse no implica ni debe inferir ninguno de los tres estados contractuales anteriores. Ninguno de los dos proveedores tiene, dentro de este documento, una revisión contractual confirmada; su gobernanza contractual queda pendiente de una revisión específica fuera del alcance de OPS-04.

### 8.4 InfoJobs

```text
BACKLOG_BLOCKED_BY_PARTNER_AND_TOS
```

Estado heredado sin cambios de `docs/sprints/sprint-26a-infojobs-provider-final-report.md` (`SPRINT_26A: CLOSED_DOCUMENTATION_ONLY`, `SPRINT_26B: NOT_AUTHORIZED`). Esta estrategia no reabre InfoJobs, no autoriza nueva investigación, contacto, integración ni spike.

## 9. JobIT Job Radar

### 9.1 Definición

Job Radar permite al candidato crear búsquedas persistentes que se ejecutan sobre el catálogo local de ofertas, sin llamar a proveedores externos durante la ejecución.

### 9.2 Flujo principal

```text
candidato crea búsqueda
→ JobIT valida
→ guarda la búsqueda (concepto: SavedJobSearch)
→ la ejecución consulta PostgreSQL
→ selecciona ofertas activas nuevas o actualizadas
→ aplica filtros
→ calcula match
→ genera explicación
→ registra el resultado (concepto: JobSearchResult)
→ muestra novedades
→ notifica si corresponde
```

### 9.3 Ejecución incremental

Cada ejecución debe considerar la última ejecución registrada, la fecha de publicación/ingesta de cada oferta, y los resultados ya existentes, para evitar reprocesar todo el catálogo sin necesidad.

### 9.4 Estados de resultado

```text
NEW · VIEWED · SAVED · DISMISSED · APPLIED_EXTERNALLY · EXPIRED · REMOVED
```

### 9.5 Match y explicabilidad

Reutiliza reglas deterministas ya existentes en el producto. No usa atributos sensibles, fotografía ni inferencia de personalidad; no presenta probabilidad de contratación; no rechaza candidatos; no oculta sus reglas; permite corregir el perfil; muestra limitaciones. Aviso obligatorio para el candidato: *"JobIT muestra un resumen y una coincidencia orientativa. La oferta original prevalece y debe consultarse para confirmar requisitos, vigencia y condiciones."*

### 9.6 Inteligencia artificial

Queda fuera de la primera versión de Job Radar. Cualquier uso futuro (extracción de skills, resumen, expansión de consultas, detección de duplicados) no podrá decidir, rechazar, inferir atributos sensibles, evaluar personalidad, predecir rendimiento ni ejecutar acciones irreversibles; deberá ser estructurado, validado, con evidencia, fallback determinista y posibilidad de desactivación.

## 10. Candidate Discovery (epic futura, independiente)

No forma parte de la primera implementación de Job Radar. No existe una base abierta de candidatos: existe un conjunto de perfiles cuyos titulares han activado voluntariamente la visibilidad empresarial, con modos propuestos (`PRIVATE`, `LINK_ONLY`, `VERIFIED_COMPANIES`, `OPEN_TO_OPPORTUNITIES`, `PAUSED`), datos ocultos por defecto (contacto, documentos, fecha de nacimiento, historial de búsqueda, datos sensibles), filtros permitidos limitados a criterios profesionales, y filtros explícitamente prohibidos sobre categorías protegidas (raza, religión, salud, orientación sexual, afiliación, embarazo, situación familiar, biometría, inferencias psicológicas). Requiere, antes de cualquier implementación: empresa verificada, aislamiento multiempresa, threat model, revisión de privacidad, posible EIPD/DPIA, rate limiting, auditoría, prohibición de exportación masiva, opt-in explícito, y borrado propagado.

## 11. Ofertas nativas (epic futura, independiente)

Requiere empresas, membresía, verificación, aceptación de términos, CRUD de ofertas, moderación, diferenciación visual frente a ofertas ingeridas, ownership y caducidad. No se implementa junto a Job Radar.

## 12. Seguridad, observabilidad, retención y testing — principios

**Seguridad:** secretos backend-only; timeouts y rate limiting en providers; validación de URLs y protección SSRF; ownership y cuotas en Job Radar; verificación empresarial y no-exportación en Candidate Discovery; el texto de una oferta se trata siempre como dato no confiable, nunca como instrucción para IA.

**Observabilidad:** ejecuciones, latencia, errores, cuotas y descartes de providers; búsquedas activas, ejecuciones, resultados y notificaciones de Job Radar; logs con `correlationId` y sin secretos, tokens ni datos sensibles.

**Retención:** ofertas cerradas antes que borradas, Saved Jobs preservados; búsquedas guardadas mientras la cuenta esté activa o hasta su eliminación; plazos de Candidate Discovery a definir antes de su implementación.

**Testing (categorías, no casos de test):** providers (autenticación simulada, paginación, errores, normalización, deduplicación); Job Radar (CRUD, ownership, ejecución, incrementalidad, resultados, cuotas); frontend (estados, accesibilidad, errores); E2E del flujo candidato; seguridad (IDOR, SSRF, XSS, rate limiting, borrado). Ninguna de estas categorías se traduce en un caso de test concreto dentro de esta estrategia.

## 13. Roadmap condicionado

Sin numeración de sprint. Se retiran como numeración oficial: `Sprint 27A`–`27G`, `Job Radar A`–`F`, `Recruit A`–`E`. Solo pueden usarse etapas, fases, epics o workstreams conceptuales, sin reservar numeración ni presentar la secuencia como roadmap ya autorizado.

```text
Etapa previa — Readiness candidate-first
  backup y restore; gate legal; sesión; ciclo de vida de cuenta.

Fase A — Specs de Job Radar (conceptual, no creadas en esta estrategia)
  SavedJobSearch; ejecuciones; resultados; interacción; ownership; retención; seguridad; UI.

Fase B — Job Radar local
  catálogo local; ejecución manual; incrementalidad; match; explicación; resultados.

Fase C — UX candidate-first
  UI; accesibilidad; sesión; errores; E2E.

Fase D — Scheduling y operación
  worker; locking; cuotas; observabilidad; notificaciones; retención.

Fase E — Due diligence de fuentes
  matriz; términos; calidad; costes; retirada; atribución. Incluye CleanJobData y Lanbide, sin orden de prioridad implícito.

Fase F — Fuente nueva
  solo mediante gates separados y secuenciales:
  SOURCE_DUE_DILIGENCE_ACCEPTED → SPIKE_APPROVED → INTEGRATION_APPROVED → STAGING_APPROVED → PRODUCTION_APPROVED

Fase G — Empresas y ofertas nativas
  epic independiente.

Fase H — Candidate Discovery
  epic independiente y posterior.
```

## 14. Estados de implementación

```text
JOB_RADAR_IMPLEMENTATION:
HOLD

RECRUIT_IMPLEMENTATION:
HOLD

CANDIDATE_DISCOVERY_IMPLEMENTATION:
HOLD
```

La aprobación de esta estrategia como documento de planificación no abre implementación en ninguno de los tres.

## 15. Decisiones pendientes

Estas decisiones quedan explícitamente para un futuro turno de gobernanza, no para esta estrategia:

1. Aprobación de las specs conceptuales de la Fase A.
2. Orden relativo entre la due diligence de CleanJobData y de Lanbide dentro de la Fase E.
3. Política de notificaciones de Job Radar.
4. Límites de número de búsquedas guardadas por candidato.
5. Política de retención detallada de `JobSearchRun`/`JobSearchResult`.
6. Responsables de la revisión contractual de Jooble y Greenhouse (§8.3).
7. Threat model y revisión de privacidad previos a Candidate Discovery (§10).

## 16. Regla para agentes

Ningún agente debe convertir esta estrategia en una implementación completa dentro de un único sprint. Antes de implementar cualquier bloque de esta estrategia: inspección, spec propia, plan propio, análisis de riesgo, lista de archivos, criterios de aceptación, tests, aprobación explícita, Execution Mode propio, revisión humana, gate Git independiente, y autorización de producción separada. Ante cualquier bloqueo, el formato de reporte es:

```text
BLOCKED
Causa:
Impacto:
Evidencia:
Decisión necesaria:
Opciones:
```

## 17. Conclusión

La evolución recomendada es: fuentes autorizadas → catálogo global local → búsquedas guardadas → clasificación y match → explicaciones → recurrencia del candidato → empresas verificadas → ofertas nativas → visibilidad voluntaria → Candidate Discovery. Cinco límites se mantienen sin excepción: las fuentes deben estar autorizadas mediante due diligence propia; las búsquedas personales se ejecutan siempre sobre el catálogo local; la oferta original prevalece; el candidato controla sus datos y su visibilidad; JobIT recomienda y explica, pero no decide por las personas.
