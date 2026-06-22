import { z } from "zod";

/**
 * Validación Zod del payload crudo de Jooble (Fase 2C).
 *
 * Conserva la forma oficial: 10 campos string por oferta y la respuesta raíz
 * con `totalCount` (number) y `jobs` (array). No aplica lógica de negocio: no
 * parsea el salario, no valida la URL de `link` ni infiere modalidad/contrato
 * (eso es del normalizador, Fase 2E). Los campos de texto pueden venir vacíos.
 *
 * Los tipos inferidos corresponden al contrato oficial de `jooble.types.ts`.
 */
export const joobleJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  snippet: z.string(),
  salary: z.string(),
  type: z.string(),
  link: z.string(),
  updated: z.string(),
  source: z.string()
});

export const joobleSearchResponseSchema = z.object({
  totalCount: z.number(),
  jobs: z.array(joobleJobSchema)
});

/** Forma validada de una oferta cruda de Jooble. */
export type JoobleJobInput = z.infer<typeof joobleJobSchema>;

/** Forma validada de la respuesta raíz de Jooble. */
export type JoobleSearchResponseInput = z.infer<typeof joobleSearchResponseSchema>;
