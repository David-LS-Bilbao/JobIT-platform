import { z } from "zod";

// Misma forma UUID (hex 8-4-4-4-12) que jobs.schemas.ts: un id con forma válida
// pero inexistente debe resolverse como 404, reservando el 400 para identificadores
// que ni siquiera tienen forma de UUID.
const UUID_SHAPE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const savedJobIdParamSchema = z
  .object({
    jobId: z.string().regex(UUID_SHAPE)
  })
  .strip();

export type SavedJobIdParam = z.infer<typeof savedJobIdParamSchema>;
