# Informe final — Sprint 15E Ofertas reales y enlaces externos

## Objetivo inicial

Verificar y, si hacía falta, ajustar el flujo Jobs para que el candidato distinga con
claridad la **procedencia** de cada oferta (seed/mock interna vs. fuente externa),
vea la **fuente** (JobIT/Jooble), y pueda **salir a la oferta original de forma segura**
cuando el backend ya dispone de `sourceUrl`. No integrar APIs nuevas, ni scraping, ni
candidatura interna.

## Alcance entregado

- Auditoría real de datos (DB dev) y del contrato público de Jobs.
- Etiqueta de **fuente** explícita ("Fuente: JobIT/Jooble") en las cards de `/jobs` y en
  el detalle `/jobs/[id]`.
- En el detalle, **CTA externo según procedencia**: Jooble → "Abrir en Jooble"; otras
  fuentes con URL → "Ver oferta original".
- **Aviso honesto** cuando no hay enlace externo usable: para INTERNAL, "Oferta de ejemplo
  para el MVP. No tiene enlace externo de inscripción."; para otras fuentes sin URL,
  copy genérico.
- **Validación de URL segura**: solo `http:`/`https:`; una `sourceUrl` con protocolo
  peligroso (p. ej. `javascript:`) o inválida **no se renderiza** como enlace.
- Sin cambios de backend (el contrato ya era correcto y estaba testeado).

## Auditoría de fuentes

Datos reales en la base de dev (`jobit_dev`, 14 ofertas) consultados vía `psql`:

- **14/14 ofertas son `source = INTERNAL`**, con `sourceUrl = NULL` y `externalId = NULL`.
  Son las ofertas seed/mock (`apps/api/prisma/seed.ts`), marcadas explícitamente como
  INTERNAL. **Ninguna** tiene enlace externo de inscripción.
- **No hay ofertas JOOBLE** ingeridas actualmente (la ingesta Jooble es backend-only y no
  se ha ejecutado en este entorno). Cuando existan, traerán `source = JOOBLE` y `sourceUrl`.
- **LinkedIn NO es una fuente de ofertas** en el sistema: el enum `JobSource` es solo
  `INTERNAL | JOOBLE` (LinkedIn solo existe como tipo de enlace de perfil). No se ha
  inventado una fuente LinkedIn; la UI no la muestra.

Conclusión: hoy el candidato ve ofertas de ejemplo (sin inscripción externa). El flujo de
"salir al origen" queda **listo y probado** para cuando haya ofertas con `sourceUrl` real
(Jooble u otra fuente con URL).

## Contratos backend revisados

Sin cambios en backend. `serializeJob` / `JobPublicDto` ya:

- exponen `source` y `sourceUrl` (procedencia pública);
- **ocultan** `externalId` e `ingestedAt`.

Cubierto por tests de integración existentes (no se tocan):

- `apps/api/src/jobs/jobs-visibility.integration.test.ts`: lista y detalle ocultan
  `externalId`/`ingestedAt` y exponen `source`/`sourceUrl`; INTERNAL→`sourceUrl` null,
  JOOBLE→`sourceUrl` presente; filtro `source=INTERNAL|JOOBLE` y `400` si es inválido.
- `apps/api/src/jobs/jobs-provenance.integration.test.ts`: INTERNAL por defecto con
  provenance nula; JOOBLE con `externalId`/`sourceUrl`/`ingestedAt`.

## Cambios frontend

- `apps/web/src/features/jobs/jobs-format.ts`: nuevos `externalSourceCtaLabel(source)` y
  `isSafeExternalUrl(url)` (solo http/https, parseable).
- `apps/web/src/features/jobs/job-detail-page.tsx`: etiqueta "Fuente: …"; enlace externo
  condicionado a `isSafeExternalUrl(sourceUrl)` con copy por fuente; aviso honesto en su
  ausencia. `target="_blank"` + `rel="noopener noreferrer"` intactos.
- `apps/web/src/features/jobs/job-card.tsx`: la card muestra "Fuente: …" de forma explícita.
- `/saved-jobs` y `/match`: sin cambios de CTA externo. `/match` mantiene "Ver oferta" →
  `/jobs/[id]` (el candidato sale al origen desde el detalle, no desde el match).

## Tests añadidos/actualizados

- `apps/web/src/features/jobs/jobs-format.test.ts` (**nuevo**, 5 tests): `isSafeExternalUrl`
  (acepta http/https, rechaza `javascript:`/`data:`/`ftp:`/inválidas/null) y
  `externalSourceCtaLabel` (Jooble vs. genérico).
- `apps/web/src/features/jobs/job-detail-page.test.tsx` (13 → **16**): Jooble muestra
  "Abrir en Jooble" seguro + fuente; INTERNAL sin URL → aviso honesto y sin enlace;
  INTERNAL con URL válida → "Ver oferta original"; `sourceUrl` con `javascript:` **no** se
  renderiza como enlace.
- `apps/web/src/features/jobs/jobs-page.test.tsx` (11 → **12**): las cards muestran la fuente.

## Seguridad de enlaces externos

- Todos los enlaces externos usan `target="_blank"` + `rel="noopener noreferrer"`.
- `isSafeExternalUrl` bloquea protocolos no seguros (`javascript:`, `data:`, `ftp:`…) y
  URLs no parseables → no se pinta enlace (se muestra el aviso honesto). Test explícito
  de que `javascript:` no aparece en el DOM.
- No se renderiza ningún CTA de inscripción engañoso cuando no hay URL usable.

## Documentación actualizada

- `README.md`: el detalle de Jobs indica la fuente y permite abrir la oferta original si
  hay `sourceUrl`; se aclara que el MVP **no gestiona candidaturas internas** (la
  inscripción ocurre en la fuente original).

## Fuera de alcance

- No se tocó `apps/api/**` (funcional) ni tests backend; no se tocó Prisma
  (schema/migrations), `package.json`, `pnpm-lock.yaml`, `.env*`, `docker/**`, `.github/**`,
  Portfolio/QR, auth, recruiter ni monetización.
- Sin dependencias nuevas, sin scraping, sin integración de LinkedIn API, sin candidatura
  interna, sin IA.

## Adición posterior: filtro de ubicación y preparación multi-fuente

Sobre la misma rama se incorporó (a petición de producto) el cambio de eje de búsqueda:

- **Backend** (`jobs.schemas.ts`, `jobs.service.ts` + test): nuevo filtro `location`
  (contains, case-insensitive) en `GET /api/jobs`.
- **Frontend** (`jobs-page.tsx`, `jobs-api.ts`, `types/api.ts` + tests): el selector de
  "Fuente" se sustituyó por un campo de **Ubicación** (enviado con "Buscar"). `source`
  sigue en el contrato del backend pero ya no se expone en la UI.
- **Docs**: `docs/architecture/03-job-sources-and-search.md` (modelo de fuentes, búsqueda
  por ubicación, cómo añadir APIs/RSS, ofertas `INTERNAL` = empresas en JobIT a futuro).

## Verificaciones

Ejecutadas en el clon nativo de WSL (`/home/david/projects/JobIT-platform`), en verde,
con el `next dev` **parado** para el build:

- `pnpm --filter @jobit/web typecheck` → OK.
- `pnpm --filter @jobit/web test` → 20 archivos, **248 tests OK** (job-detail 16, jobs-page 14, jobs-format 5).
- `pnpm --filter @jobit/web lint` → OK.
- `pnpm --filter @jobit/web build` → OK (13 páginas; `/jobs`, `/jobs/[id]`, `/match`).
- `pnpm --filter @jobit/api typecheck` → OK (tras `prisma generate`: el cliente estaba
  desactualizado por el modelo `portfolioSettings` del PR #57; regenerar no toca schema ni DB).
- `pnpm --filter @jobit/api test` → **330 tests OK** (incluye el test del filtro `location`).
- `pnpm --filter @jobit/api build` → OK.
- `git diff --check` limpio; `git status --short` solo cambios de esta rama (`.env` ignorado).

## Smoke Jooble Bilbao

Verificación del caso "no aparecen ofertas Jooble en Bilbao":

- **JobIT busca en la DB local, no en Jooble en tiempo real.** `GET /api/jobs` filtra las
  ofertas ya ingeridas, no lanza búsquedas live a Jooble.
- La primera ingesta usó `location="España"` y devolvió un lote **sin Bilbao** (Madrid 7+1,
  Barcelona 3+1, Córdoba, Salamanca, Valladolid, Murcia, Tenerife, Girona, Lugo, Burgos).
  Auditoría en DB: **0 ofertas JOOBLE con Bilbao/Bizkaia/Vizcaya**.
- API sobre esos datos (filtro correcto): `source=JOOBLE`=20; `location=Bilbao`=3 (**todas
  INTERNAL** seed); `source=JOOBLE&location=Bilbao`=**0**; `location=Madrid`=11 (8 JOOBLE +
  3 INTERNAL). `externalId`/`ingestedAt` **nunca** se exponen (`fuga_interna=false` en todos).
- **Conclusión: comportamiento EXPECTED**, no bug. El filtro `location` y la normalización
  funcionan; faltaba **ingesta específica de Bilbao**.
- **Prueba de ingesta Bilbao** (script temporal, no commiteado, key por env, host regional
  `es.jooble.org`): `fetched 20 / created 20 / skipped 0`. Resultado: location "Bilbao,
  Vizcaya" ×20; ahora `source=JOOBLE&location=Bilbao`=**20** y `location=Bilbao`=23.
  Nota: `location=Bizkaia`=0 porque Jooble usa el nombre en español ("Vizcaya"); es un
  **sinónimo** a considerar (Vizcaya/Bizkaia), no un fallo del filtro.
- Los datos ingeridos son **locales de dev**: se pierden al reseedear (`prisma db seed`
  vacía la tabla `Job`) y **no forman parte del commit**. La solución de producto **no es
  scraping ni llamadas live improvisadas**.

## Riesgos/deuda técnica

- **Ingesta Jooble manual**: no hay disparador (script/cron/endpoint); hoy se ingiere con un
  script puntual. Con varias fuentes convendrá una orquestación controlada por
  región/ubicación. Decisión de producto/infra.
- **Base URL regional de Jooble (deuda propuesta)**: el cliente usa `https://jooble.org/api`
  por defecto y algunas keys son regionales (la de dev responde en `https://es.jooble.org/api`;
  el host global da `403`). Recomendado: `JOOBLE_API_BASE_URL` configurable por entorno
  (default el actual) + test del cliente. **No se hace en esta rama** (deuda documentada).
- **Sinónimos de ubicación**: Jooble usa nombres en español ("Vizcaya", no "Bizkaia"); buscar
  por el nombre en euskera no encuentra resultados. Futuro: normalización/mapa de sinónimos.
- Con solo seed (sin ingesta), el candidato ve ofertas de ejemplo; el CTA externo real
  requiere ofertas con `sourceUrl` (Jooble ingerido).

## Recomendación para el chat director

- **Sprint 15E: COMPLETADO.** La UI muestra la procedencia con honestidad y sale a la
  oferta original de forma segura cuando hay `sourceUrl`. El contrato `source`/`sourceUrl`
  ya era correcto y testeado (la parte de source-links no tocó backend). La adición del
  **filtro `location`** sí sumó una cláusula mínima y testeada en el backend.
- Checks locales: web typecheck/test (**248**)/lint/build y api typecheck/test (**330**)/build en verde.
- El caso "Jooble Bilbao" es **EXPECTED** (deuda de ingesta), no bug; ver `## Smoke Jooble Bilbao`.
- **Cierre Git sugerido** (a confirmar por el orquestador, sin commitear aún): 2 commits —
  `feat(web): show job sources and safe external links` y `feat(jobs): add location filter`—
  más los docs (informe + arquitectura) en el commit que corresponda o un `docs(sprint)`.

## Prompt sugerido para continuar

> Sprint 15F — Poblar ofertas reales para la demo (opcional, requiere autorización).
> Objetivo: ejecutar la ingesta Jooble backend-only con `JOOBLE_API_KEY` en el entorno
> local (o sembrar ofertas con `sourceUrl` de ejemplo realista) para validar visualmente
> el CTA "Abrir en Jooble" y la distinción seed vs. externa. No cambiar la lógica de
> ingesta ni el contrato. Documentar el smoke con evidencias. Rama
> `chore/sprint-15f-jooble-ingest-smoke`. No commit/push/PR sin cierre explícito.
