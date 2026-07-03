import { z } from "zod";

/**
 * Validación Zod del payload crudo del Job Board API de Greenhouse (`?content=true`).
 *
 * Conserva la forma observada: `jobs[]` + `meta`. No aplica lógica de negocio (no limpia
 * HTML, no valida `absolute_url`, no infiere modalidad): eso es del normalizer. `id`
 * puede venir como number; se entrega siempre como string. `location`/`content` y
 * `departments`/`offices` pueden faltar (→ null / []). Los objetos ignoran claves extra.
 */
const namedSchema = z.object({ name: z.string() });

export const greenhouseJobSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((value) => String(value)),
  title: z.string(),
  updated_at: z.string(),
  absolute_url: z.string(),
  location: namedSchema.nullable().optional().transform((value) => value ?? null),
  content: z.string().nullable().optional().transform((value) => value ?? null),
  departments: z.array(namedSchema).optional().transform((value) => value ?? []),
  offices: z.array(namedSchema).optional().transform((value) => value ?? [])
});

export const greenhouseBoardResponseSchema = z.object({
  jobs: z.array(greenhouseJobSchema),
  meta: z
    .object({ total: z.number() })
    .nullable()
    .optional()
    .transform((value) => value ?? null)
});

/** Forma validada de una oferta cruda de Greenhouse. */
export type GreenhouseJobInput = z.infer<typeof greenhouseJobSchema>;

/** Forma validada de la respuesta raíz de un board de Greenhouse. */
export type GreenhouseBoardResponseInput = z.infer<typeof greenhouseBoardResponseSchema>;
