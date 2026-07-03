# Sprint 16 — Job Sources Discovery Matrix

## Objetivo

Evaluar fuentes externas de ofertas de empleo para su posible integración en JobIT bajo la
arquitectura objetivo:

> **fuentes externas → ingesta controlada → base de datos JobIT → búsqueda local → enlace oficial externo**

JobIT **no** busca en APIs externas en vivo en cada búsqueda del candidato: ingiere de forma
controlada a su propia DB (`source=JOOBLE|…`, `sourceUrl`, `ingestedAt`) y sirve la búsqueda
desde `GET /api/jobs`, mostrando la fuente y enlazando a la oferta original. Esta matriz es
**documentación de due diligence**; no implementa código. Las decisiones se basan en
**documentación oficial** de cada fuente (o se marcan `PENDIENTE` cuando no ha podido
verificarse). Jooble ya está integrado (Sprints 03.5 / 15E–15G).

## Principios de decisión

- **No scraping.** Solo APIs/feeds oficiales.
- **No llamadas live por cada búsqueda** de candidato (ingesta controlada → DB local).
- **No guardar secretos** en el repo; API keys por entorno (patrón `JOOBLE_API_KEY` de 15F).
- **No usar fuentes tras login** (contenido autenticado del usuario) sin acuerdo.
- **No integrar LinkedIn / Indeed / Randstad** sin partnership formal.
- **Mostrar siempre la fuente** (atribución) en cards y detalle.
- **Mantener el enlace oficial externo** (`sourceUrl`/apply) hacia la oferta original.
- **No aplicar desde JobIT** en el MVP (la inscripción ocurre en el origen).
- **Expirar ofertas** cuando la fuente lo permita (`expiresAt`).
- **No IA para evaluar personas** en el MVP.

## Matriz de fuentes

Leyenda: ✅ sí · ✗ no · ⚠️ parcial/pendiente. "Doc oficial" = se revisó documentación oficial
de la fuente para esta matriz.

| Fuente | Tipo | Cobertura | Credenciales | Doc oficial | Permite ingesta | Mostrar en JobIT | Atribución req. | Frecuencia/límites | Apply/source URL | Campos útiles | Riesgo legal/ToS | Riesgo técnico | Prioridad | Decisión |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Jooble** | API | Global + ES (host regional `es.jooble.org`) | API key (regional) | ✅ (+integrado) | ✅ (ya) | ✅ | ✅ (fuente) | ToS; host regional | ✅ link | title, company, location, salary, link, snippet | Medio | Bajo (integrado) | Ya integrado | Mantener; consolidar scripts duplicados |
| **Adzuna** | API (agregador/publisher) | Global + **ES (`es`)** + Tech | `app_id` + `app_key` (registro) | ✅ overview (ToS aparte ⚠️) | ✅ | ✅ | ✅ (revisar ToS) | Límites free tier | ✅ `redirect_url` | title, company, location, salary, category, redirect | Medio (ToS por confirmar) | Bajo (patrón Jooble) | **Must-have** | **Primera a implementar** tras Jooble |
| **InfoJobs** | API | **ES (líder)** | Registro app + OAuth; ¿aprobación partner? | ⚠️ parcial | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ (link a oferta) | ofertas ES ricas (search/read) | Alto (aprobación/ToS) | Medio | **Bloqueado/PENDIENTE** (alto valor si se aprueba) | Confirmar acceso y términos |
| **Tecnoempleo** | RSS (+ "API/partners") | **ES + Tech** | RSS: ninguna; API partners: acuerdo | ⚠️ parcial (campos/terms) | ✅ (RSS) | ✅ | ✅ | RSS estándar | ⚠️ link | ofertas tech ES (RSS por provincia) | Medio (Normas de uso) | Medio (parsear RSS + campos ⚠️) | Should-have (ES tech) | Verificar campos RSS y programa partners |
| **Remotive** | API | Remoto + Tech + Global | Pública (premium key opcional) | ✅ | ✅ | ⚠️ | ✅ **obligatoria** (link + "Remotive") | 24h delay; uso moderado | ✅ link | title, company, description, category, link | **Alto** (prohíbe re-enviar a agregadores: cita Jooble/LinkedIn/Google) | Bajo | Could-have (verificar ToS) | Revisar compatibilidad con nuestro modelo |
| **Jobicy** | API + RSS | Remoto + Tech + Global | Ninguna | ✅ | ✅ | ⚠️ | ✅ (fuente) | ~1/hora (petición) | ✅ `url` | title, company, description, salary, type, region, seniority, url | Medio (piden no redistribuir a agregadores) | Bajo | Should-have | Fácil; respetar rate y atribución |
| **We Work Remotely** | RSS | Remoto + Tech + Global | Ninguna | ✅ | ✅ | ✅ | ✅ (fuente) | TTL 60 min | ✅ link | title, region, category, type, description, link, `expires_at` | Bajo-Medio | Bajo | Should-have | RSS estándar con expiración |
| **Himalayas** | API | Remoto + Tech + Global | Pública JSON (auth ⚠️) | ✅ parcial (auth/rate ⚠️) | ✅ | ✅ | ✅ ("Originally posted on Himalayas") | ⚠️ | ✅ `applicationLink` | title, company, salary, seniority, employmentType, description, applicationLink | Bajo-Medio | Bajo | Could-have | Verificar auth y rate limits |
| **Careerjet** | API (publisher/afiliado) | Global + **ES (`es_ES`)** | API key (cuenta Publisher, Basic) | ✅ | ✅ | ✅ (vía tracking) | ✅ (enlace de tracking) | ⚠️ | ✅ `url` (jobviewtrack) | title, company, locations, salary, url | Medio (modelo afiliado/tracking) | Bajo-Medio (requiere IP+User-Agent del visitante) | Could-have | Registro publisher; encaje del tracking URL |
| **Greenhouse** | ATS (job board API) | Global + Tech (**por empresa**) | Ninguna (GET público) | ✅ | ✅ (por `board_token`) | ✅ | ✅ (empresa/fuente) | ⚠️ | ✅ `absolute_url` | title, location, content, absolute_url, updated_at | **Bajo** | Bajo (curar lista de empresas) | Should-have (track ATS) | Curar empleadores tech (ES/remoto) |
| **Lever** | ATS (Postings API) | Global + Tech (**por empresa**) | Ninguna (`/v0/postings/{cuenta}`) | ✅ | ✅ (por cuenta) | ✅ | ✅ (empresa/fuente) | ⚠️ | ✅ apply URL | postings JSON/XML; feed pensado para job boards | **Bajo** | Bajo | Should-have (track ATS) | Feed oficial para ingestión por job boards |
| **Ashby** | ATS (Job Posting API) | Global + Tech (**por empresa**) | Pública (por job board) | ✅ | ✅ (`jobPosting.list/info`) | ✅ | ✅ (empresa/fuente) | ⚠️ | ✅ apply | jobPosting.list/info; compensación opcional | **Bajo** | Bajo | Should-have (track ATS) | Careers page pública por organización |
| **Workable** | ATS (Jobs API) | Global + Tech (**por empresa**) | Token `r_jobs` (por cuenta) | ✅ | ✅ (con token) | ✅ | ✅ (empresa/fuente) | ⚠️ | ✅ job + apply + shortlink | jobs (state, timestamps), URLs | Bajo | Medio (token por empleador) | Could-have | Requiere token por cada empresa |
| **LinkedIn** | Partner / No viable | Global | Partnership formal (Talent/Job Postings) | ✅ (portal) | ✗ | ✗ | — | — | — | — | **Muy alto** | Alto | **No MVP / Bloqueado** | Solo con partnership formal |
| **Indeed** | Partner / No viable | Global + ES | Partner (sin API pública de búsqueda) | ✅ (portal) | ✗ | ✗ | — | — | — | — | **Muy alto** | Alto | **No MVP / Bloqueado** | API pública de búsqueda deprecada |
| **Randstad** | Partner / PENDIENTE | Global + ES | Portal dev (búsqueda pública no clara) | ⚠️ PENDIENTE | ✗ | ✗ | — | — | — | — | Alto | Alto | **Bloqueado / PENDIENTE** | Sin API pública de búsqueda documentada |

### Notas por fuente (matices)

- **Jooble**: ya integrado; recordatorio de deuda del Startup Report → hay **dos scripts**
  (`apps/api/src/jobs/scripts/ingest-jooble.ts` y `apps/api/scripts/ingest-jooble.ts`);
  consolidar antes de añadir más fuentes.
- **Adzuna**: la overview confirma `app_id`/`app_key` y búsqueda por país; el detalle de
  atribución/redistribución vive en su **ToS** (no leído aquí) → confirmar antes de construir.
  Soporta España (`/jobs/es/search`) y devuelve `redirect_url`.
- **Remotive**: su documentación pide **atribución explícita** y **prohíbe reenviar sus ofertas
  a terceros agregadores** (nombra Jooble, LinkedIn Jobs, Google Jobs). Nuestro modelo (DB
  propia + mostrar con atribución + enlace) es **borderline**; requiere lectura fina del ToS
  antes de decidir. Por eso Could-have, no Should-have.
- **Jobicy**: RSS (`/feed/job_feed`) y API v2 (`/api/v2/remote-jobs`), sin auth; piden **no
  redistribuir a agregadores** y **~1 consulta/hora**. Encaja con ingesta controlada + atribución.
- **InfoJobs / Tecnoempleo**: máximo valor para el mercado **España**, pero con incógnitas:
  InfoJobs (¿aprobación de app/partner y términos de visualización?) y Tecnoempleo (estructura
  de campos del RSS y su programa "API/partners"). Marcados `PENDIENTE` hasta verificar.
- **Greenhouse / Lever / Ashby / Workable (ATS)**: **no son búsqueda agregada**, sino el job
  board **de una empresa** (público en Greenhouse/Lever/Ashby; con token en Workable). Modelo
  legalmente el más limpio (pensado para que job boards ingieran ofertas) a cambio de **curar
  una lista de empleadores** tech (muchas startups ES/remote usan estos ATS).

## Ranking inicial recomendado

**Must-have inmediato**
- **Adzuna** — agregador con cobertura España + global + tech, modelo publisher (diseñado para
  mostrar y enlazar), `redirect_url`, credenciales tipo key (encaja con el patrón 15F).

**Should-have próximo**
- **Jobicy** (API+RSS remoto/tech, sin auth).
- **We Work Remotely** (RSS remoto/tech, público, con expiración).
- **Track ATS público**: **Greenhouse**, **Lever**, **Ashby** (curar empleadores tech ES/remoto).
- **Tecnoempleo** (RSS tech ES) — tras verificar campos y términos.

**Could-have posterior**
- **Himalayas** (remoto/tech, verificar auth/rate).
- **Careerjet** (publisher API + tracking, global/ES).
- **Workable** (ATS con token por empresa).
- **Remotive** (remoto/tech, solo si el ToS de no-redistribución resulta compatible).

**No MVP**
- Aplicar desde JobIT (candidatura interna). Búsqueda live por request. IA para evaluar personas.

**Bloqueado por credenciales/partner/legal**
- **InfoJobs** (alto valor ES; requiere confirmar acceso/aprobación y términos).
- **Randstad** (sin API pública de búsqueda documentada → PENDIENTE).
- **LinkedIn** (partnership formal).
- **Indeed** (partner; sin API pública de búsqueda).

## Primera fuente recomendada para implementar

**Adzuna** (tras Jooble). Justificación por criterios:

1. **Valor para candidatos tech**: agregador amplio con oferta tech y salarios; complementa a
   Jooble aportando otra cobertura.
2. **Viabilidad legal/ToS**: modelo **publisher** explícito (su API existe para que terceros
   consulten y **muestren resultados enlazando** a la oferta) — alineado con "mostrar fuente +
   enlace externo". (Acción previa: confirmar cláusulas de atribución/redistribución en su ToS.)
3. **Facilidad técnica**: HTTP query API con clave, respuesta JSON → **casi idéntico al cliente
   Jooble** ya existente; reutiliza normalizer/ingest/provider-config.
4. **Cobertura España/remoto**: soporta España (`/jobs/es/search`) y permite filtrar por
   categoría/keywords (tech) y remoto.
5. **Compatibilidad con ingesta controlada**: se ingiere por consultas (keywords/location),
   como el comando multi-ubicación de 15G; no requiere búsqueda live.
6. **Apply/source URL**: cada resultado trae `redirect_url` hacia la oferta original.

**Alternativas si se priorizara riesgo legal mínimo o cero credenciales**:
- **Track ATS** (Greenhouse/Lever/Ashby): el más limpio legalmente (feeds pensados para job
  boards), a cambio de curar empleadores.
- **Jobicy / We Work Remotely**: los más fáciles técnicamente (sin credenciales) para
  remoto/tech, respetando atribución y rate.

## Riesgos transversales

- **Redistribución de contenido**: varias fuentes limitan reenviar sus ofertas a otros
  agregadores (Remotive, Jobicy). Definir política: JobIT como destino final con atribución +
  enlace, nunca re-sindicando a terceros.
- **Descripciones completas vs. snippets**: Jooble da snippet; otras dan HTML completo. Decidir
  qué se almacena/muestra y si se recorta por ToS.
- **Atribución visible**: mostrar siempre la fuente (ya soportado por `source`/`sourceUrl`).
- **Rate limits**: respetar por fuente (Jobicy ~1/h, Adzuna free tier, etc.); ingesta en serie
  y programada, no live.
- **Ofertas expiradas**: usar `expiresAt` (WWR trae `expires_at`); política de caducidad/limpieza.
- **Duplicados entre fuentes**: la misma oferta puede venir de varias fuentes; definir dedupe
  (por `sourceUrl`/empresa+título+fecha) — hoy la unicidad es `(source, externalId)`.
- **Normalización** de `remoteType`/`seniority`/`contractType`/`salary` por fuente (formatos
  heterogéneos) y de **ubicación** (sinónimos Vizcaya/Bizkaia — deuda ya documentada en 15G).
- **Migración Prisma** para ampliar `enum JobSource` (hoy `INTERNAL | JOOBLE`) con cada fuente
  nueva: cambio versionado, con spec y aprobación.
- **`applyUrl` separado de `sourceUrl`**: algunas fuentes distinguen "ver oferta" (listing) de
  "inscribirse" (apply). Evaluar añadir `applyUrl` al modelo (hoy solo `sourceUrl`).
- **Duplicidad de scripts Jooble** (`src/jobs/scripts/` vs `apps/api/scripts/`): consolidar.
- **No scraping**: descartar cualquier fuente que solo sea viable por scraping.

## Decisiones explícitas No MVP

- **LinkedIn**: **No MVP / bloqueado** sin partnership formal (Talent/Job Postings APIs son de partner).
- **Indeed**: **No MVP / bloqueado** sin partner; no hay API pública simple de búsqueda de ofertas.
- **Randstad**: **Bloqueado / PENDIENTE** — sin API pública de búsqueda claramente documentada.
- **Aplicar desde JobIT** (candidatura interna): **fuera de MVP**; la inscripción ocurre en el origen.
- **Scraping**: **prohibido** en cualquier fuente.
- **Búsqueda live por request** contra APIs externas: **fuera de alcance** (siempre ingesta → DB local).

## Documentación oficial consultada

- Jooble API — https://jooble.org/api/about (y nuestra integración: `docs/specs/features/external-jobs-jooble.md`, `docs/specs/features/jooble-ingestion.md`, ADR-0011).
- Adzuna — https://developer.adzuna.com/overview
- InfoJobs Developer — https://developer.infojobs.net/
- Tecnoempleo RSS — https://www.tecnoempleo.com/ofertas-empleo-rss.php
- Remotive — https://remotive.com/remote-jobs/api
- Jobicy — https://jobicy.com/jobs-rss-feed · https://jobicy.com/api/v2/remote-jobs
- We Work Remotely — https://weworkremotely.com/remote-jobs.rss
- Himalayas — https://himalayas.app/jobs/api
- Careerjet — https://www.careerjet.com/partners/api/
- Greenhouse Job Board API — https://developers.greenhouse.io/job-board.html
- Lever — https://hire.lever.co/developer/documentation · feed XML: https://help.lever.co/hc/en-us/articles/20087377566109-Using-Lever-s-XML-job-posting-feed
- Ashby — https://developers.ashbyhq.com/docs/public-job-posting-api
- Workable — https://workable.readme.io/reference/jobs
- LinkedIn — https://learn.microsoft.com/en-us/linkedin/talent/job-postings/api/overview (No MVP)
- Indeed — https://docs.indeed.com/ (No MVP)
- Randstad — https://developer.randstad.com/ (PENDIENTE)

## Estado de verificación / PENDIENTE

- **Verificadas** con documentación oficial: Jooble, Adzuna (overview), Remotive, Jobicy,
  We Work Remotely, Himalayas, Careerjet, Greenhouse, Lever, Ashby, Workable.
- **PENDIENTE** (documentación insuficiente en esta pasada, no inventar): Adzuna (ToS de
  atribución/redistribución), InfoJobs (aprobación de app/partner y términos de visualización),
  Tecnoempleo (estructura de campos RSS y programa API/partners), Himalayas (auth/rate limits),
  Randstad (existencia de API pública de búsqueda).
- No se han hecho **llamadas con API keys reales** ni scraping; solo lectura de documentación oficial.
