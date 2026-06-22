import { z } from "zod";

const REMOTE_TYPES = ["REMOTE", "HYBRID", "ON_SITE"] as const;
const SENIORITIES = ["JUNIOR", "MID", "SENIOR"] as const;
const CONTRACT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE"] as const;

/**
 * Normaliza el parámetro `tags`: admite query repetido (`?tags=a&tags=b`,
 * que Express entrega como array) y fallback CSV (`?tags=a,b`). Devuelve un
 * array de strings no vacíos o `undefined` si no hay tags válidos.
 */
const tagsSchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }
  const raw = Array.isArray(value) ? value : [value];
  const normalized = raw
    .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
  return normalized.length > 0 ? normalized : undefined;
}, z.array(z.string()).optional());

export const listJobsQuerySchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    remote: z.enum(REMOTE_TYPES).optional(),
    seniority: z.enum(SENIORITIES).optional(),
    contractType: z.enum(CONTRACT_TYPES).optional(),
    tags: tagsSchema,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
  .strip();

export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
