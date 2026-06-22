# Sprint 03.5 — Jooble · Fase 2 TDD Plan (Contrato + Normalizador, sin red)

## Estado

Borrador para revisión humana. **No autoriza implementación**: este documento solo planifica la Fase 2. La escritura de código (config, schemas, normalizador, fixtures, tests) queda **bloqueada hasta aprobación del operador**.

- Rama de trabajo (Fase 2A): `feat/sprint-03-5-jooble-contract` (cortada desde `dev` en `f4c6f62`).
- Documentos base: [spec External Jobs — Jooble](../specs/features/external-jobs-jooble.md), [ADR-0011](../decisions/ADR-0011-jooble-external-jobs-integration.md), [brief del sprint](sprint-03-5-jooble-brief.md).

## Objetivo de Fase 2

Definir el **contrato externo** de Jooble y el **normalizador puro** (payload crudo → DTO interno), con **validación** y **defaults seguros**, cubierto por **tests unitarios con fixtures locales** y **sin red real**. Fase 2 deja listo el "traductor" de datos externos **antes** de tocar la base de datos (Fase 3) o construir el cliente HTTP (Fase 4).

## Alcance exacto (Fase 2 completa)

1. **Config segura de la API key**: `JOOBLE_API_KEY` como **placeholder** en `.env.example` y **validación segura** en `apps/api/src/config/env.ts` (no rompe en dev si falta; nunca se loguea su valor).
2. **Tipos y schema del payload Jooble** (Zod) para validar la forma cruda antes de normalizar.
3. **DTO interno** estable (independiente de Prisma) que represente una oferta externa normalizada.
4. **Normalizador puro**: función sin I/O que mapea payload crudo validado → DTO, aplicando defaults seguros y sanitización.
5. **Fixtures locales** (válidos e inválidos) de payload Jooble.
6. **Tests unitarios** del schema y del normalizador (vitest), 100% offline.

> Fase 2A (esta entrega) cubre **solo** rama + revisión documental + este TDD plan. Los puntos 1-6 se ejecutan en sub-fases posteriores (ver «Pasos pequeños»), cada una con revisión.

## Fuera de alcance (Fase 2)

- **Prisma y migraciones** (los campos de provenance `source`/`externalId`/`sourceUrl`/`ingestedAt` y su constraint son **Fase 3**).
- **Cliente HTTP real** y **cualquier llamada de red** a Jooble (**Fase 4**).
- **Servicio de ingesta / upsert / dedup en DB** (Fase 4).
- Cambios en endpoints `/api/jobs` y `/api/jobs/:id`.
- Cron, n8n, scheduler o automatización de ingesta en producción.
- Frontend, deploy, otras fuentes externas distintas de Jooble.
- Nuevas dependencias (vitest y zod ya están disponibles en `@jobit/api`).

## Rutas propuestas para el módulo Jooble

```
apps/api/src/jobs/external/jooble/
├── jooble.types.ts            # tipos del payload crudo + DTO interno (sin Prisma)
├── jooble.schemas.ts          # validación Zod del payload crudo
├── jooble.normalizer.ts       # función pura: payload validado -> DTO
├── __fixtures__/              # payloads de ejemplo (válidos e inválidos), JSON/TS
│   ├── jooble.valid.json
│   ├── jooble.partial.json
│   └── jooble.invalid.json
└── jooble.normalizer.test.ts  # tests unitarios (offline)
```

Config (fuera del módulo, en sus rutas existentes):
- `.env.example` — placeholder `JOOBLE_API_KEY`.
- `apps/api/src/config/env.ts` — validación segura de `JOOBLE_API_KEY`.

## Contrato oficial de Jooble (payload y request)

El **schema Zod de Fase 2 se basará en estos campos oficiales** de Jooble. El schema es la fuente de verdad y debe **rechazar formas inesperadas**.

### Respuesta oficial (payload a normalizar)

Raíz de la respuesta:

| Campo | Notas |
|---|---|
| `totalCount` | Conteo total de resultados (metadato) |
| `jobs` | Array de ofertas a normalizar |

Cada elemento de `jobs[]`:

| Campo | Notas |
|---|---|
| `id` | Identificador de la oferta en Jooble → base de `externalId` |
| `title` | Título → `title` |
| `company` | Empresa → `company` |
| `location` | Ubicación (string) → `location` (o `null`) y señal para inferir `remoteType` |
| `snippet` | Descripción/resumen (puede traer HTML) → `description` sanitizada |
| `salary` | **String** (p. ej. `"30000-40000 €"`, `""`) → parseo conservador a `salaryMin`/`salaryMax` o `null` |
| `type` | Tipo de contrato/jornada (string) → señal para `contractType` y `remoteType` |
| `link` | URL de la oferta → base de `sourceUrl` (validada como absoluta http(s)) |
| `updated` | Fecha de actualización en Jooble → referencia de **frescura**/`postedAt`; **no** sustituye a `ingestedAt` |
| `source` | Portal de origen dentro de Jooble (string informativo) → metadato/`tags` |

Reglas de mapeo clave:
- **`id` → `externalId`** (parte de la clave de dedup `(source, externalId)`).
- **`link` → `sourceUrl`** (descartar si no es URL absoluta válida).
- **`salary` llega como string** y se parsea de forma **conservadora**: si no es inequívoco, `salaryMin`/`salaryMax` = `null` (nunca inventar cifras).
- **`updated`** se usa como referencia de frescura (y `postedAt` si parseable), pero **`ingestedAt` se genera internamente** (clock inyectable), no se toma del externo.

### Parámetros de request oficiales (solo referencia futura)

> No se implementa cliente ni se realizan llamadas en Fase 2. Se listan para que el cliente de **Fase 4** los use; aquí solo documentan el contrato.

`keywords`, `location`, `radius`, `salary`, `page`, `ResultOnPage`, `SearchMode`, `companysearch`.

## Contrato del DTO interno esperado

El DTO es **autónomo** (no importa tipos de Prisma) para no acoplar Fase 2 a un schema que aún no tiene los campos de provenance. El mapeo DTO → fila `Job` (incluidas las columnas de provenance) se hará en Fase 3/4.

```ts
// Boceto orientativo (NO es código de esta fase; se implementa en Fase 2 con revisión)
export interface NormalizedExternalJob {
  source: "JOOBLE";                 // literal; distingue origen
  externalId: string;               // requerido (id en Jooble); clave de dedup junto a source
  sourceUrl: string;                // requerido; URL absoluta http(s) de la oferta
  title: string;                    // requerido
  company: string;                  // requerido
  location: string | null;          // null si ausente
  remoteType: "REMOTE" | "HYBRID" | "ON_SITE" | "UNSPECIFIED";  // inferido; UNSPECIFIED si no hay evidencia (no se asume ON_SITE). Conversion a enum Prisma en Fase 3
  description: string;              // sanitizada (sin HTML), longitud acotada
  requirements: string[];          // default []
  seniority: "JUNIOR" | "MID" | "SENIOR" | "ANY"; // default ANY
  contractType: string;            // mapeado desde `type` si es claro; si no, "unspecified" (sin inventar)
  salaryMin: number | null;        // parseado de salario; null si no parseable
  salaryMax: number | null;
  tags: string[];                  // default []
  status: "ACTIVE" | "CLOSED";     // default ACTIVE
  postedAt: Date;                  // de "updated" si parseable; si no, ingestedAt
  expiresAt: Date | null;          // null (Jooble no lo provee)
  ingestedAt: Date;                // inyectable (clock) para test determinista
}
```

> El payload oficial de Jooble y sus reglas de mapeo (`id`→`externalId`, `link`→`sourceUrl`, `salary` string→parseo conservador, `updated`→frescura/`postedAt` con `ingestedAt` interno) están definidos arriba en «Contrato oficial de Jooble». El schema Zod de Fase 2 se basa en esos campos oficiales y rechaza formas inesperadas.

## Fixtures necesarios

- **`jooble.valid.json`**: oferta completa y bien formada (todos los campos presentes y válidos).
- **`jooble.partial.json`**: oferta válida pero con opcionales ausentes (sin `salary`, sin `type`, sin `location`) → ejercita defaults.
- **`jooble.invalid.json`**: casos que deben descartarse (sin `id`, sin `link`, sin `title` o sin `company`; `link` no absoluta).
- Sin secretos ni API keys en ningún fixture. Datos ficticios.

## Casos de test del normalizador

| # | Caso | Resultado esperado |
|---|---|---|
| T1 | Payload válido completo | DTO con todos los campos mapeados correctamente |
| T2 | Opcionales ausentes (partial) | Defaults seguros aplicados (remoteType, seniority, contractType, tags, requirements, status, postedAt) |
| T3 | Falta campo de identidad (`id`/`link`/`title`/`company`) | Registro **descartado** (no produce DTO), sin lanzar para el resto |
| T4 | `link` no absoluta o inválida | Descartado / inválido (no se persiste una URL no válida) |
| T5 | Inferencia de `remoteType` desde `location`/`type`/`snippet` | Mapea a REMOTE/HYBRID/ON_SITE; sin evidencia → `UNSPECIFIED` (no `ON_SITE`) |
| T6 | Parseo de `salary` (string) | `salaryMin`/`salaryMax` numéricos o `null` si no parseable |
| T7 | `snippet` con HTML | `description` sin HTML, longitud acotada (anti-XSS futura) |
| T8 | Mapeo de `seniority`/`contractType` desconocidos | `ANY` / `"unspecified"` (sin valores inventados) |
| T9 | Clave de dedup | `(source, externalId)` derivada de forma estable |
| T10 | Determinismo | Mismo input → mismo output; `ingestedAt` inyectado (clock fijo) |
| T11 | Pureza | El normalizador no realiza I/O, no lee `process.env`, no toca red |

Estrategia TDD: escribir T1–T11 en **RED** sobre fixtures, luego implementar el normalizador hasta **GREEN**, refactor mínimo.

## Política de defaults seguros

| Campo | Default cuando falta/indeterminado | Nota |
|---|---|---|
| remoteType | Inferir REMOTE/HYBRID/ON_SITE de `location`/`type`/`snippet`; sin evidencia → `UNSPECIFIED` | **No** se asume `ON_SITE` (engañoso). Conversión final a enum Prisma en **Fase 3** |
| seniority | `ANY` | Coherente con enum existente |
| contractType | Mapear desde `type` si es claro; si no → `"unspecified"` | No se inventa valor; es `String` en DB (ADR-0008), no rompe el filtro de query |
| requirements / tags | `[]` | Arrays vacíos seguros |
| status | `ACTIVE` | Oferta vigente al ingerirse |
| postedAt | `updated` si parseable; si no, `ingestedAt` | Nunca futuro arbitrario |
| expiresAt | `null` | Jooble no lo provee |
| salaryMin/Max | `null` | Si `salary` no parseable |
| location | `null` | Si ausente/ vacío |

## Validaciones de seguridad

- **Sanitización** de `snippet`/`description`: eliminar HTML crudo y acotar longitudes (prevención de stored XSS en fases con UI).
- **URL**: `sourceUrl` validada como absoluta `http(s)`; descartar si no.
- **Identidad mínima**: descartar registros sin `externalId`, `sourceUrl`, `title` o `company`.
- **API key**: `JOOBLE_API_KEY` solo en `env.ts` (backend); **nunca** se loguea ni aparece en el DTO/fixtures; validación que **no rompe** en dev si falta (solo se exige cuando se active el cliente real en Fase 4).
- **Sin secretos** en el repo ni en fixtures.

## Verificación: sin red real

- El normalizador recibe un **objeto ya deserializado** (no hace `fetch`/HTTP). El schema Zod valida esa estructura en memoria.
- Los tests cargan **fixtures locales** (JSON/TS); no se importa ningún cliente HTTP en este módulo.
- No se usa `process.env` en el normalizador (pureza). La config de `env.ts` se prueba aparte y no dispara red.
- CI ejecuta 100% offline.

## Verificación: sin Prisma

- El DTO es un **tipo TypeScript autónomo**; **no** importa `@prisma/client` ni escribe en DB.
- **No** se modifica `schema.prisma` ni se generan migraciones en Fase 2.
- El mapeo DTO → fila `Job` (con columnas de provenance y constraint de dedup) se realiza en **Fase 3**.

## Criterios de aceptación de Fase 2

- [ ] `JOOBLE_API_KEY` como placeholder en `.env.example` + validación segura en `env.ts` (sin romper dev; sin loguear).
- [ ] `jooble.types.ts`, `jooble.schemas.ts`, `jooble.normalizer.ts` creados bajo `apps/api/src/jobs/external/jooble/`.
- [ ] Fixtures válidos e inválidos en `__fixtures__/`, sin secretos.
- [ ] `jooble.normalizer.test.ts` con T1–T11 en **verde**, offline.
- [ ] El normalizador es **puro** (sin red, sin `process.env`, sin Prisma).
- [ ] **Sin** cambios en `schema.prisma`, migraciones, `package.json`/lockfiles ni endpoints.
- [ ] Suite M03 existente **sigue verde** (no regresión).
- [ ] `typecheck` y `build` en verde.

## Pasos pequeños (sub-fases de Fase 2, cada una con revisión)

1. **2A — Plan (esta entrega):** rama + revisión documental + este TDD plan. *Sin código.*
2. **2B — Config:** placeholder `JOOBLE_API_KEY` en `.env.example` + validación segura en `env.ts`. Verificación: arranque/dev no rompe; valor no se loguea.
3. **2C — Contrato:** `jooble.types.ts` (crudo + DTO) y `jooble.schemas.ts` (Zod). Tests: schema acepta válido, rechaza inválido.
4. **2D — Fixtures:** `__fixtures__/` válido, parcial e inválido.
5. **2E — Normalizador (RED→GREEN):** `jooble.normalizer.ts` + `jooble.normalizer.test.ts` (T1–T11).
6. **2F — Auditoría + cierre:** quality/security, no regresión M03, informe. PR a `dev` **requiere autorización**.

## Decisiones pendientes que condicionan Fase 2

Resueltas por el operador (reflejadas arriba):
- **`remoteType` indeterminado** → `UNSPECIFIED` en el DTO; **no** se asume `ON_SITE`.
- **`contractType` no claro** → `"unspecified"` en el DTO; mapeo desde `type` solo cuando es inequívoco.
- **Payload Jooble** → fijado a los campos oficiales (`totalCount`, `jobs[]` con `id`, `title`, `company`, `location`, `snippet`, `salary`, `type`, `link`, `updated`, `source`); el schema Zod se basa en ellos.

Siguen pendientes (a cerrar en **Fase 3**, no bloquean Fase 2):
- **Conversión de `remoteType: UNSPECIFIED` al enum Prisma `RemoteType`** (hoy REMOTE/HYBRID/ON_SITE, no-null): decidir si se añade valor al enum, se hace la columna nullable o se mapea a un placeholder. **Decisión de Fase 3.**
- **`source` como enum Prisma vs `String`** (el DTO ya usa el literal `"JOOBLE"`).

## Auditoría requerida (Fase 2)

- [ ] Quality/security del módulo y de la config de la API key.
- [ ] Tests unitarios offline en verde y no regresión de M03.
- [ ] Revisión humana antes de avanzar a Fase 3 (Prisma/provenance).
