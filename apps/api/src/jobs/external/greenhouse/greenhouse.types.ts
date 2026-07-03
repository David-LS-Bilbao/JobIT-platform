/**
 * Contrato TypeScript de la integración Greenhouse (Job Board API pública).
 *
 * - Tipos del payload crudo del board (forma tras validación zod: `id` ya string).
 * - DTO interno autónomo (`NormalizedExternalJob`) que NO importa Prisma.
 *
 * El Job Board API es público (sin auth) y por empresa (`board_token`). El payload del
 * job NO incluye la empresa: `company` se inyecta desde la lista curada
 * (`greenhouse.companies.ts`). El mapeo a la fila `Job` lo hace el ingest service.
 */

/** Origen interno de la oferta. En este provider siempre Greenhouse. */
export type GreenhouseSource = "GREENHOUSE";

/**
 * Modalidad remota del DTO. `UNSPECIFIED` cuando no hay evidencia para inferirla (no se
 * asume `ON_SITE`). Greenhouse no expone un campo remoto explícito.
 */
export type RemoteTypeDto = "REMOTE" | "HYBRID" | "ON_SITE" | "UNSPECIFIED";

/** Nodo con `name` (ubicación, departamento u oficina). */
export interface GreenhouseNamed {
  name: string;
}

/**
 * Oferta cruda del Job Board API tras validación zod (`?content=true`).
 * `id` se entrega siempre como string; `location`/`content` pueden faltar (→ null);
 * `departments`/`offices` por defecto vacíos.
 */
export interface GreenhouseJobPayload {
  id: string;
  title: string;
  updated_at: string;
  absolute_url: string;
  location: GreenhouseNamed | null;
  content: string | null;
  departments: GreenhouseNamed[];
  offices: GreenhouseNamed[];
}

/** Respuesta raíz del listado de un board. */
export interface GreenhouseBoardResponsePayload {
  jobs: GreenhouseJobPayload[];
  meta: { total: number } | null;
}

/**
 * DTO interno de una oferta externa normalizada. Autónomo (no importa Prisma).
 * `company` proviene de la lista curada (no del payload). Greenhouse no da salario
 * → `salaryMin`/`salaryMax` siempre null.
 */
export interface NormalizedExternalJob {
  source: GreenhouseSource;
  externalId: string;
  sourceUrl: string;
  ingestedAt: Date;
  title: string;
  company: string;
  location: string | null;
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
  remoteType: RemoteTypeDto;
  contractType: string;
  postedAt: Date;
  tags: string[];
}
