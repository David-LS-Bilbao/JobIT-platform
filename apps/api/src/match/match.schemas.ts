import { z } from "zod";

// Misma forma UUID (hex 8-4-4-4-12) que jobs/saved-jobs: forma inválida → 400;
// forma válida pero inexistente → 404 (oferta no disponible) en el servicio.
const UUID_SHAPE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const matchJobParamSchema = z
  .object({
    id: z.string().regex(UUID_SHAPE)
  })
  .strip();

export type MatchJobParam = z.infer<typeof matchJobParamSchema>;

export const profileMatchesQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(10)
  })
  .strip();

export type ProfileMatchesQuery = z.infer<typeof profileMatchesQuerySchema>;
