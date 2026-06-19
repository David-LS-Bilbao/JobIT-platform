import { z } from "zod";

export const updateBasicInfoSchema = z
  .object({
    firstName: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
    lastName: z.string().trim().min(2, "El apellido debe tener al menos 2 caracteres"),
    headline: z.string().trim().max(120).optional(),
    summary: z.string().trim().max(1000).optional(),
    location: z.string().trim().optional(),
    locationRemote: z.boolean().optional(),
    availabilityStatus: z.enum(["ACTIVE", "OPEN", "NOT_LOOKING"]).optional(),
    avatarUrl: z.string().url().optional()
  })
  .strip();

export type UpdateBasicInfoInput = z.infer<typeof updateBasicInfoSchema>;
