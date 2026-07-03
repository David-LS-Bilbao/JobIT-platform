# Sprint 16 — Product Rules & Candidate Sources Ranking

## Objetivo

Fijar las **reglas de producto** para mostrar ofertas de fuentes externas en JobIT y cerrar
un **ranking candidate-first** de fuentes candidatas, a partir de la matriz de due diligence
(`sprint-16-job-sources-discovery-matrix.md`) y la revisión arquitectónica
(`sprint-16-job-sources-architecture-review.md`) ya creadas. JobIT debe seguir siendo
candidate-first, seguro y compatible con el patrón de ingesta controlada:

> fuentes externas → ingesta controlada → base de datos JobIT → búsqueda local → enlace oficial externo

## Principios candidate-first

- JobIT ayuda al candidato a **descubrir** oportunidades tech; no decide por él.
- JobIT **no oculta el origen** de ninguna oferta.
- JobIT **no simula** que una oferta externa es propia de JobIT.
- JobIT **no aplica en nombre del usuario** en el MVP (la inscripción ocurre en el origen).
- JobIT **no evalúa personas con IA** en el MVP (Match es reglas visibles, no scoring de personas).
- JobIT prioriza **claridad, confianza, trazabilidad** y **enlace oficial** por encima de volumen de ofertas.

## Reglas de visualización de ofertas externas

1. **Mostrar siempre la fuente** visible en card y detalle (ya implementado: "Fuente: …").
2. **CTA externo obligatorio y honesto**: "Ver oferta oficial" (genérico) o "Abrir en <Fuente>"
   (si hay copy específico, como Jooble); "Aplicar en la web oficial" cuando la fuente distinga apply.
3. `sourceUrl` **debe** abrir el origen oficial de la oferta (validado http/https; nunca protocolos inseguros).
4. Si en el futuro existe `applyUrl`, se usa **solo** como enlace externo de aplicación — nunca
   sustituye a mostrar `sourceUrl` como referencia del origen si ambos existen.
5. **No ocultar redirecciones** obligatorias del proveedor (p. ej. tracking URLs de Careerjet):
   se muestran tal cual, sin enmascarar el destino real al usuario.
6. **No eliminar atribución requerida** por la fuente (p. ej. "Originally posted on Himalayas",
   mención obligatoria de Remotive).
7. **No presentar seed/INTERNAL como oferta real externa**: el aviso honesto actual ("Oferta de
   ejemplo para el MVP…") se mantiene mientras `INTERNAL` sea solo seed.
8. **Distinguir siempre** INTERNAL/seed/demo de ofertas de fuentes reales — nunca mezclarlas sin marca.
9. Mostrar **fecha de publicación** cuando esté disponible (`postedAt`).
10. Mostrar **ubicación/remoto** con normalización prudente (sin inventar datos; sinónimos como
    deuda documentada, no bloqueante).
11. **No mostrar campos que la fuente no permite** redistribuir (p. ej. descripción completa si
    el ToS solo autoriza snippet).

## Reglas de contenido

- Si una fuente **permite descripción completa** (ToS lo confirma), se puede guardar y mostrar completa.
- Si una fuente **limita redistribución** (Remotive, Jobicy piden no reenviar a agregadores),
  usar **snippet/resumen** permitido, nunca el contenido íntegro sin verificar.
- **Ante duda de ToS**: mostrar el **mínimo viable** (título, empresa, ubicación, fuente) y
  enlazar al origen para el resto — nunca "rellenar huecos" inventando o copiando de más.
- **No almacenar contenido prohibido** por la fuente (datos personales de terceros, contenido
  tras login, etc.).
- **No almacenar raw payload** por defecto, salvo decisión explícita futura y documentada
  (coste, tamaño, riesgo de ToS/privacidad) — coherente con la review arquitectónica.
- **No modificar de forma engañosa** título, empresa o fuente al normalizar (el normalizer
  limpia HTML/espacios, no reescribe contenido).
- **Normalizar sin cambiar el sentido**: inferencias (p. ej. `remoteType` por keywords) deben
  ser conservadoras; ante ambigüedad, usar el valor "sin especificar" en vez de asumir.

## Reglas de ingesta

- **No búsqueda live** contra APIs externas por cada búsqueda del candidato; JobIT consulta
  siempre su propia DB (`GET /api/jobs`).
- Ingesta **manual/programada/controlada**, backend-only, sin endpoint público de ingesta.
- **Rate limits por fuente**: respetar el límite documentado de cada proveedor (p. ej. Jobicy
  ~1/hora); ingesta en serie, no en paralelo.
- **No llamadas con API keys reales sin autorización** explícita del operador humano.
- **Secretos solo en entorno** (`.env` local, gitignored); **nunca en el repo** ni en commits.
- **Upsert idempotente** por `(source, externalId)` — patrón ya vigente, a generalizar a toda fuente nueva.
- **Marcar `CLOSED` antes que borrar** físicamente una oferta que desaparece de la fuente.
- **No romper `SavedJob`** si una oferta expira o se cierra: la relación debe sobrevivir (nunca
  cascada de borrado sobre ofertas guardadas por el candidato).
- `expiresAt` se puebla **si la fuente lo proporciona**; si no, queda `null` (no se inventa).
- **Cierre por ausencia** (una oferta deja de aparecer en ingestas sucesivas) es **fase posterior**,
  con cuidado y criterio explícito (N ausencias consecutivas), no en el MVP inicial de cada fuente.
- **Logs sin secretos**: nunca imprimir la API key ni URLs que la contengan (patrón ya validado en 15F/15G).

## Reglas legales/ToS

- **No scraping**, bajo ninguna circunstancia.
- Solo **API/RSS/ATS oficiales** como fuente de ingesta.
- **No fuentes detrás de login** de usuario sin acuerdo explícito con el proveedor.
- **No LinkedIn** sin partnership formal (Talent/Job Postings API es de partner).
- **No Indeed** sin partner formal (no hay API pública simple de búsqueda).
- **No Randstad** sin documentación pública clara de API de búsqueda o acuerdo — hoy PENDIENTE.
- **Cumplir atribución visible** exigida por cada fuente.
- **Cumplir restricciones de redistribución** (p. ej. "no reenviar a otros agregadores").
- **Revisar el ToS fino** de cada fuente **antes** de implementar su ingesta (la matriz de Fase 2
  marca varias como PENDIENTE precisamente por esto: Adzuna ToS, InfoJobs aprobación, Tecnoempleo campos).
- **Documentar la URL oficial revisada** por fuente en la spec de esa integración (como ya hace
  `docs/specs/features/external-jobs-jooble.md`).

## Reglas de UX

- El candidato **debe saber dónde acabará** al pulsar el CTA externo (copy claro: "oferta oficial",
  nombre de la fuente si aplica).
- El **botón externo debe ser visualmente claro** y diferenciado de las acciones internas (guardar, match).
- **No crear formularios de aplicación internos** en el MVP — ninguna candidatura se gestiona dentro de JobIT.
- **No pedir datos extra** al candidato para "aplicar" (eso ocurre en el origen, con sus propias reglas).
- **Evitar fusión agresiva** de ofertas duplicadas entre fuentes.
- Si hay duplicados (misma oferta en dos fuentes), **priorizar transparencia** (mostrar ambas o
  marcarlas) **sobre dedupe destructivo** que pueda perder el enlace correcto de alguna fuente.
- **Saved Jobs debe permanecer estable** aunque cambie la fuente de una oferta guardada (no se
  reescribe `source`/`sourceUrl` de una oferta ya guardada salvo re-ingesta legítima de la misma `externalId`).

## Ranking final recomendado

### Must-have inmediato
- **Jooble** — ya integrada (Sprints 03.5, 15E–15G).
- **Adzuna** — primera fuente nueva recomendada, **condicionado** a confirmar el ToS fino
  (atribución/redistribución) antes de implementar.

### Should-have próximo
- **Jobicy** (API+RSS, sin credenciales, atribución + rate ~1/h documentados).
- **We Work Remotely** (RSS público, con `expires_at`).
- **Track ATS curado** (Greenhouse / Lever / Ashby): modelo legalmente más limpio (feeds pensados
  para job boards), a cambio de curar una lista de empleadores tech.
- **Tecnoempleo** — si se valida acceso/uso permitido (campos RSS y su programa "API/partners" hoy PENDIENTE).

### Could-have posterior
- **Himalayas** (verificar auth/rate limits, hoy PENDIENTE en detalle).
- **Careerjet** (API publisher, modelo de tracking URL, registro requerido).
- **Workable** (ATS con token por empresa; más fricción que Greenhouse/Lever/Ashby).
- **Remotive** — con cautela: su ToS restringe explícitamente reenviar ofertas a agregadores
  (cita Jooble/LinkedIn/Google); requiere lectura fina antes de decidir si nuestro modelo encaja.

### No MVP
- **Aplicar desde JobIT** (candidatura interna).
- **Búsqueda live** contra APIs externas por cada búsqueda de candidato.
- **IA para evaluar candidatos/personas**.
- **Dedupe cross-source agresivo** (fusión automática de ofertas de distintas fuentes).
- **Recruiter/ATS completo** (gestión de candidaturas, pipelines, etc.).

### Bloqueado por credenciales/partner/legal
- **LinkedIn** — sin partnership formal.
- **Indeed** — sin partner formal.
- **Randstad** — sin API pública de búsqueda documentada (PENDIENTE).
- **InfoJobs** — alto valor para España, pero bloqueado hasta confirmar aprobación de
  app/partner y términos de visualización (hoy PENDIENTE en la matriz).

## Primera fuente nueva recomendada

**Principal: Adzuna** (condicionado a ToS).

- **Motivo producto**: agregador amplio con cobertura España + global + categoría tech;
  complementa a Jooble en volumen y variedad sin introducir un modelo de UX distinto (ya es
  "mostrar + enlazar", igual que Jooble).
- **Motivo técnico**: API HTTP con `app_id`/`app_key`, respuesta JSON, `redirect_url` por oferta
  — mapea casi 1:1 al cliente/normalizer/ingest de Jooble ya existentes; menor riesgo de
  implementación y de romper el patrón.
- **Motivo legal/ToS**: modelo *publisher* explícito (pensado para que terceros consulten y
  muestren resultados enlazando al origen), lo que encaja con nuestras reglas de visualización;
  pendiente confirmar el detalle de atribución/redistribución en su ToS completo.
- **Riesgos**: ToS fino no leído aún (solo overview); posible necesidad de `salaryCurrency` si
  se activa fuera de España; rate limits del free tier no confirmados.
- **Precondiciones antes de implementar**:
  1. Leer el ToS completo de Adzuna (no solo el overview) y confirmar reglas de atribución/redistribución.
  2. Completar housekeeping Jooble (16A) para no arrastrar el patrón de script duplicado a la nueva fuente.
  3. Migración mínima de `enum JobSource` (+ unique `(source, externalId)` general) con spec aprobada.
  4. Decidir si `salaryCurrency` es necesario para el alcance inicial (si se limita a España, puede diferirse).
- **Criterio para abortar**: si el ToS de Adzuna prohíbe explícitamente el modelo de "mostrar +
  enlazar" que usamos, o exige condiciones incompatibles con "no aplicar desde JobIT" /
  "atribución visible", se descarta Adzuna como primera fuente y se pasa a la alternativa.

**Alternativa legalmente limpia: track ATS curado (Greenhouse / Lever / Ashby).**
- Riesgo legal **bajo** (feeds públicos pensados explícitamente para job boards); sin necesidad
  de leer un ToS de agregador; coste = curar manualmente una lista inicial de empleadores tech
  (ES/remoto) que usen estos ATS.

**Alternativa remota simple: Jobicy o We Work Remotely.**
- Sin credenciales, patrón de ingesta casi idéntico a Jooble; Jobicy exige revisar su límite de
  ~1 consulta/hora y su restricción de no redistribuir a agregadores antes de decidir el alcance
  de contenido a mostrar (snippet vs. completo).

## Decisiones explícitas

- **No scraping**, en ninguna fuente, bajo ninguna circunstancia.
- **No LinkedIn / Indeed / Randstad** en el MVP sin acuerdo formal.
- **No aplicar desde JobIT** — la inscripción ocurre siempre en el origen.
- **No búsqueda live** por cada búsqueda de usuario — siempre ingesta controlada → DB local.
- **No guardar raw payload** por defecto.
- **No dedupe agresivo** entre fuentes — transparencia primero.
- **No tocar Prisma** sin spec y migración aprobada explícitamente.
- `sourceUrl` sigue siendo el **CTA del MVP**; `applyUrl` se difiere salvo que una fuente concreta
  lo exija de forma clara (p. ej. al integrar un ATS con apply separado).

## Preguntas abiertas

- ¿Priorizamos **España** o **remoto global** como siguiente foco después de Jooble?
- ¿Tenemos capacidad/tiempo para gestionar el proceso de credenciales de **InfoJobs** y/o **Adzuna**
  (registro, aprobación, lectura de ToS) en este ciclo?
- ¿JobIT debe tener un **track ATS curado** con una lista mantenida de empresas tech concretas
  (Greenhouse/Lever/Ashby), o se pospone a un sprint dedicado a esa curación?
- ¿Cuánto **contenido externo** queremos almacenar y mostrar frente a enviar rápido al origen
  (snippet mínimo + enlace vs. descripción más completa donde el ToS lo permita)?
- ¿Qué fuentes son **aceptables para staging/demo** sin riesgo legal ni de rate limit (candidatas
  claras: Jobicy, We Work Remotely, un ATS curado con pocas empresas)?
