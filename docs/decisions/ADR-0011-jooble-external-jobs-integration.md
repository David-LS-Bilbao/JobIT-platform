# ADR-0011: Integración de ofertas externas vía Jooble

## Estado

Propuesta — pendiente de revisión humana. No habilita implementación hasta su aprobación.

Fecha: 2026-06-22. Sprint: 03.5. Relacionada con [ADR-0008](ADR-0008-database-orm-initial-model.md), [ADR-0007](ADR-0007-api-design.md), la spec [External Jobs — Integración Jooble](../specs/features/external-jobs-jooble.md) y el [brief del sprint](../sprints/sprint-03-5-jooble-brief.md).

## Contexto

El módulo Jobs (M03) está cerrado: modelo `Job`, seed de ofertas, `GET /api/jobs` y `GET /api/jobs/:id` con filtros, paginación y reglas `ACTIVE`/no expirada. Su spec ([jobs.md](../specs/features/jobs.md)) y [ADR-0008](ADR-0008-database-orm-initial-model.md) fijaron explícitamente que el MVP candidate-first se serviría **solo con datos seed/mock, sin APIs de empleo externas ni scraping**.

Esa asunción cumplió su función para validar el módulo, pero el catálogo seed no aporta volumen ni frescura real de ofertas. El valor candidate-first depende de que el candidato encuentre ofertas reales y vigentes. Jooble ofrece una API oficial de agregación de ofertas que permite obtener ese volumen sin construir scrapers ni acuerdos individuales con portales.

## Problema

¿Cómo incorporar ofertas reales al catálogo de Jobs **sin** romper el listado existente, **sin** scraping, **sin** exponer secretos al cliente, **sin** acoplar la experiencia del candidato a la disponibilidad/latencia de un tercero y **sin** abrir scope creep hacia recruiter, ATS, IA o matching avanzado?

La decisión previa ([ADR-0008](ADR-0008-database-orm-initial-model.md)) excluía explícitamente las APIs externas, por lo que se necesita una actualización **controlada y acotada** de esa decisión, registrada como ADR propio.

## Decisión

Se integra **Jooble como única fuente externa de ofertas** para el módulo Jobs, mediante **ingesta server-side normalizada y persistida**, bajo las siguientes decisiones explícitas:

1. **Ingesta desacoplada del request del candidato.** Las ofertas de Jooble se obtienen mediante un proceso de backend controlado, cuyo mecanismo concreto de disparo se decidirá en fase posterior, nunca dentro de una petición del candidato ni desde el frontend.
2. **Persistir/cachear antes de exponer.** Ninguna oferta externa se muestra al candidato hasta estar **normalizada y persistida** en la base de datos. La lectura del candidato sirve siempre desde datos persistidos. *(Decisión explícita.)*
3. **API key solo en backend.** La `JOOBLE_API_KEY` reside exclusivamente en el backend (variable de entorno server-side). Nunca se expone al cliente, no viaja al frontend y no se registra en logs. *(Decisión explícita.)*
4. **Sin scraping.** Solo se consume la API oficial de Jooble. No se hace scraping de Jooble ni de ningún portal. *(Decisión explícita.)*
5. **Trazabilidad de origen.** Cada oferta lleva `source` (`INTERNAL` | `JOOBLE`), `externalId`, `sourceUrl` e `ingestedAt`.
6. **Deduplicación idempotente.** Clave única `(source, externalId)`; la re-ingesta actualiza (upsert), no duplica.
7. **Modelo unificado, no tabla paralela.** Se extiende el modelo `Job` con campos de provenance; las ofertas internas/seed se marcan `source = INTERNAL`. El listado de M03 permanece unificado y sin romperse. Es una **decisión pragmática de MVP** (validada por el operador), **no** un diseño definitivo para todas las futuras integraciones: si entran más fuentes o crece la complejidad, podrá reevaluarse un modelo separado mediante nueva spec/ADR.
8. **Resiliencia.** Un fallo o rate-limit de Jooble se aísla en la ingesta; el listado del candidato sigue sirviendo lo ya persistido.
9. **Alcance acotado.** Solo Jooble; sin recruiter, ATS, monetización, IA avanzada ni matching inteligente.

La implementación se desarrolla por fases (ver [brief](../sprints/sprint-03-5-jooble-brief.md)) y permanece **bloqueada hasta revisión humana** de esta decisión y de la spec.

**ADR-0011 no autoriza cron, n8n ni automatización de ingesta en producción; solo define la estrategia arquitectónica.** Tampoco autoriza fuentes externas distintas de Jooble: cualquier otra requerirá una nueva spec/ADR.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| **Mantener solo seed/mock** (statu quo de ADR-0008) | No aporta volumen ni frescura; limita el valor candidate-first. El seed se conserva como datos `INTERNAL`, pero no basta como única fuente |
| **Scraping de portales** | Frágil, costoso de mantener, jurídicamente arriesgado y contrario a términos de uso. Rechazado de forma explícita |
| **Llamar a Jooble en vivo en cada request del candidato** | Latencia, rate limits, coste y acoplamiento a un tercero; rompe la experiencia ante caídas. Rechazado a favor de ingesta + persistencia |
| **Tabla `ExternalJob` separada** | Válida, pero duplicaría la lógica de listado/detalle y obligaría a unir resultados. Se prefiere extender `Job` con `source` para no romper M03 |
| **Múltiples fuentes desde el inicio** (Infojobs, LinkedIn, Adzuna…) | Scope creep. **ADR-0011 solo autoriza Jooble.** El campo `source` distingue orígenes pero no habilita ninguna fuente adicional: cada nueva fuente exigirá su propia spec/ADR |

## Consecuencias positivas

- El candidato accede a ofertas reales y vigentes manteniendo la experiencia de M03.
- El listado interno/seed sigue funcionando sin regresiones (modelo unificado).
- Trazabilidad y deduplicación garantizan calidad e integridad de los datos.
- La experiencia del candidato no depende de la disponibilidad de Jooble (lectura desde persistencia).
- La arquitectura de `source` distingue `INTERNAL` y `JOOBLE`; cualquier fuente futura requerirá su propia spec/ADR y **no** queda autorizada por ADR-0011.
- Secreto contenido en backend: superficie de exposición mínima.

## Consecuencias negativas

- Mayor complejidad: aparece una capa de ingesta, normalización y deduplicación a mantener.
- Nuevos campos y constraint en `Job` implican migración y cuidado con datos previos.
- Dependencia operativa de un tercero (cambios de API, cuotas, términos de uso).
- Posible desfase entre los datos de Jooble y lo persistido (frescura limitada por la cadencia de ingesta).
- Coste de pruebas: hay que mockear la API externa para no depender de la red en CI.

## Impacto en seguridad

- `JOOBLE_API_KEY` solo en backend; nunca al cliente ni en logs; nunca commiteada (`.env.example` con placeholder en fase posterior).
- Validación y sanitización de datos externos antes de persistir (sin HTML crudo, URLs validadas, longitudes acotadas) para evitar inyección o contenido malicioso.
- Aislamiento de errores de la API externa: no se propagan al candidato.
- Respeto a rate limits y términos de uso de Jooble.
- Sin nuevos datos personales: `Job` no contiene PII de candidatos.

## Impacto en testing

- Tests del normalizador con **fixtures** locales de payload Jooble (válido e inválido).
- Tests de deduplicación idempotente (upsert por `source` + `externalId`).
- **Mock del cliente HTTP**: prohibido depender de la red real en CI.
- No regresión: la suite de listado/detalle de M03 debe seguir verde.
- Test de seguridad: la API key no aparece en respuestas ni en logs.

## Impacto en datos

- Se añaden a `Job` los campos `source`, `externalId`, `sourceUrl`, `ingestedAt` y la constraint única `(source, externalId)`.
- Las ofertas seed existentes se marcan `source = INTERNAL` (compatibilidad hacia atrás; `default INTERNAL`).
- La migración Prisma se realiza en una fase posterior, no en la Fase 1.
- La estrategia de ingesta debe ser reproducible y idempotente en desarrollo, test y producción.

## Relación con ADR-0008

[ADR-0008](ADR-0008-database-orm-initial-model.md) asumió un *"MVP candidate-first… sin APIs de empleo externas"*, con Jobs servidos solo por seed/fixture. **Este ADR actualiza esa asunción de forma controlada y acotada**, exclusivamente en el punto de las fuentes de datos de Jobs (M03):

- **No deroga** ADR-0008 en lo demás: PostgreSQL + Prisma, modelo relacional, ownership por `userId`, match dinámico no persistido, etc. permanecen intactos.
- **Supera** únicamente la cláusula "sin APIs externas" introduciendo **una** fuente (Jooble) bajo condiciones estrictas (persistencia, normalización, trazabilidad, dedup, sin scraping, API key backend).
- El seed de Jobs definido en ADR-0008 se conserva como datos `INTERNAL`, no se elimina.

Queda registrado que la exclusión original era intencionada para el MVP y que su actualización es deliberada, revisada y limitada a Jooble, sin abrir scope hacia recruiter, ATS, IA ni otras integraciones.
