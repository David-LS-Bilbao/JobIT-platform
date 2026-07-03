# Informe final operador — Sprint 16F.1 Greenhouse Curated Companies

## Sprint o tarea

Sprint 16F.1 — Greenhouse curated companies + smoke plan.

## Objetivo inicial

Completar el provider Greenhouse del Sprint 16F con una lista minima y revisada de empresas tech que
usan Greenhouse Job Board publico, tests del selector `ING_GREENHOUSE_TOKENS` y un plan documental
para un smoke real opcional. Sin frontend, sin Prisma, sin secretos, sin scraping y sin llamadas reales
por defecto.

## Estado inicial

- `dev` actualizado contenia el merge de PR #67 / Sprint 16F.
- `GREENHOUSE_COMPANIES` existia vacio por seguridad.
- `selectGreenhouseCompanies` filtraba por CSV opcional.
- `ingest-greenhouse.ts` abortaba si la lista resultante quedaba vacia.
- El provider Greenhouse y el filtro `source=GREENHOUSE` ya estaban implementados.

## Trabajo realizado

- Se anadio una lista pequena de 3 boards publicos de Greenhouse.
- Se reforzo el comentario de curacion en `greenhouse.companies.ts`.
- Se anadieron tests unitarios especificos para la lista y el selector.
- Se ajustaron mensajes/comentarios del script manual para remarcar que el smoke real requiere
  autorizacion explicita.
- Se aclaro el comentario de `ING_GREENHOUSE_TOKENS` en `.env.example`.
- Se creo un smoke plan documental.

## Empresas curadas

Empresas ordenadas alfabeticamente por `company`:

| Company | Board token | Criterio |
| --- | --- | --- |
| Anthropic | `anthropic` | Board publico activo de Greenhouse, empresa tech/AI. |
| Vercel | `vercel` | Board publico activo de Greenhouse, empresa tech/devtools. |
| Webflow | `webflow` | Board publico activo de Greenhouse, empresa tech/SaaS. |

Criterios aplicados:

- maximo 3-5 empresas;
- token exacto derivado del board publico;
- no usar `example`, `acme`, `globex` ni datos ficticios;
- board tokens tratados como publicos, no secretos;
- revisar de nuevo antes de staging/demo.

## Tests añadidos o ajustados

Nuevo archivo:

- `apps/api/src/jobs/external/greenhouse/greenhouse.companies.test.ts`

Cobertura:

- sin CSV devuelve toda la lista;
- CSV con tokens validos devuelve subset;
- CSV con espacios funciona;
- CSV sin coincidencias devuelve `[]`;
- lista vacia devuelve `[]`;
- lista curada pequena, ordenada alfabeticamente y sin placeholders.

## Script de smoke

El script sigue siendo backend-only y manual:

- no se ejecuta automaticamente;
- no expone endpoint;
- aborta antes de llamar a Greenhouse si no hay empresas o si `ING_GREENHOUSE_TOKENS` no coincide;
- documenta que cualquier smoke real requiere autorizacion explicita.

## Archivos modificados

- `apps/api/src/jobs/external/greenhouse/greenhouse.companies.ts`
- `apps/api/src/jobs/external/greenhouse/greenhouse.companies.test.ts`
- `apps/api/src/jobs/scripts/ingest-greenhouse.ts`
- `apps/api/.env.example`
- `docs/sprints/sprint-16f1-greenhouse-smoke-plan.md`
- `docs/sprints/sprint-16f1-greenhouse-curated-companies-final-report.md`

## Tests y verificaciones

Ejecutadas al cierre:

- `git diff --check` — PASS.
- `pnpm --filter @jobit/api typecheck` — PASS.
- `pnpm --filter @jobit/api test` — PASS, 41 archivos y 385 tests.
- `pnpm --filter @jobit/api build` — PASS.
- `git status --short` — revisado.
- `git diff --stat` — revisado.

Notas de entorno:

- `pnpm --filter @jobit/api test` y `build` necesitaron reintento fuera del sandbox por `EROFS`
  al escribir temporales de Vitest y `apps/api/dist`. El reintento validado paso correctamente.

## Decisiones técnicas

- Mantener la lista en codigo versionado porque los board tokens son publicos y no son secretos.
- No mover tokens a `.env`: `ING_GREENHOUSE_TOKENS` solo limita el subset a ingerir.
- No anadir automatismos de ingesta.
- No tocar Prisma: el enum `GREENHOUSE` ya estaba disponible desde Sprint 16F.
- No tocar frontend ni fuentes Jooble/Adzuna.

## Problemas encontrados

No se detectaron problemas de implementacion. La curacion se limita a tres empresas para mantener
revision humana sencilla y bajo impacto en el smoke.

## Pendiente

- Ejecutar un smoke real solo si el operador lo autoriza explicitamente.
- Registrar conteos antes/despues si se ejecuta contra DB dev/staging.
- Revisar ToS/atribucion antes de cualquier uso de staging/demo publico.

## Recomendación para el orquestador

Cerrar Sprint 16F.1 como PASS si las verificaciones quedan en verde y el diff sigue limitado a backend
Greenhouse + documentacion de sprint. No hacer commit/push/PR hasta recibir autorizacion explicita.

## Prompt sugerido para continuar

```text
Sprint 16F.1 smoke autorizado — Greenhouse

Objetivo:
Ejecutar un smoke real y limitado del provider Greenhouse contra DB dev/staging autorizada.

Restricciones:
- No produccion.
- No scraping.
- No secretos.
- No borrar datos.
- Usar solo GREENHOUSE_COMPANIES curadas.
- Usar ING_LIMIT bajo.
- Registrar conteos antes/despues.

Comando sugerido:
ING_GREENHOUSE_TOKENS=vercel ING_LIMIT=3 pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-greenhouse.ts

Alternativa:
Iniciar Sprint 16G staging/demo bootstrap manteniendo la ingesta Greenhouse desactivada por defecto.
```
