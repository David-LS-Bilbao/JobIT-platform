/**
 * Contrato TypeScript de la integración Jooble (Fase 2C).
 *
 * - Tipos del payload crudo de Jooble (forma oficial de la respuesta).
 * - DTO interno autónomo (`NormalizedExternalJob`) que NO importa Prisma.
 *
 * Sin lógica de negocio: el normalizador (Fase 2E) consumirá estos tipos.
 */

/** Origen interno de la oferta. En este sprint solo se autoriza Jooble. */
export type JobSource = "JOOBLE";

/**
 * Modalidad remota del DTO. `UNSPECIFIED` cuando no hay evidencia para inferirla
 * (no se asume `ON_SITE`). La conversión al enum Prisma `RemoteType` es de Fase 3.
 */
export type RemoteTypeDto = "REMOTE" | "HYBRID" | "ON_SITE" | "UNSPECIFIED";

/** Oferta cruda tal y como llega en `jobs[]` de la respuesta de Jooble. */
export interface JoobleJobPayload {
  id: string;
  title: string;
  company: string;
  location: string;
  snippet: string;
  salary: string;
  type: string;
  link: string;
  updated: string;
  source: string;
}

/** Respuesta raíz de la búsqueda de Jooble. */
export interface JoobleSearchResponsePayload {
  totalCount: number;
  jobs: JoobleJobPayload[];
}

/**
 * DTO interno de una oferta externa normalizada. Autónomo (no importa Prisma).
 * El mapeo a la fila `Job` (con columnas de provenance) se hará en Fase 3/4.
 *
 * `source` es el origen interno (literal `"JOOBLE"`); `rawSource` conserva el
 * campo `source` original de Jooble (portal de procedencia).
 */
export interface NormalizedExternalJob {
  source: JobSource;
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
  rawSource: string;
}
