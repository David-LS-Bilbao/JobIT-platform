import { z } from "zod";

// PUT /api/profile/me/portfolio. El slug se normaliza y valida en el servicio
// (slugify + reservados + unicidad); aquí solo se exige que sea un string no vacío.
export const updatePortfolioSchema = z
  .object({
    slug: z.string().trim().min(1).optional(),
    showLocation: z.boolean().optional(),
    showAvailability: z.boolean().optional(),
    showPreferences: z.boolean().optional()
  })
  .strip();

export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
