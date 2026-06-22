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

export const createSkillSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre de la skill es obligatorio"),
    level: z.enum(["BASIC", "INTERMEDIATE", "ADVANCED"]).optional(),
    category: z.string().trim().optional()
  })
  .strip();

export type CreateSkillInput = z.infer<typeof createSkillSchema>;

const dateString = z
  .string()
  .trim()
  .min(1, "La fecha es obligatoria")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Fecha inválida");

function startNotAfterEnd(data: {
  current?: boolean | undefined;
  startDate?: string | undefined;
  endDate?: string | null | undefined;
}): boolean {
  if (data.current === true) {
    return true;
  }
  if (!data.startDate || !data.endDate) {
    return true;
  }
  return Date.parse(data.startDate) <= Date.parse(data.endDate);
}

export const createExperienceSchema = z
  .object({
    company: z.string().trim().min(1, "La empresa es obligatoria"),
    role: z.string().trim().min(1, "El puesto es obligatorio"),
    startDate: dateString,
    endDate: dateString.nullish(),
    current: z.boolean().optional(),
    description: z.string().trim().optional(),
    location: z.string().trim().optional()
  })
  .strip()
  .refine(startNotAfterEnd, {
    message: "startDate no puede ser posterior a endDate",
    path: ["endDate"]
  });

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;

export const updateExperienceSchema = z
  .object({
    company: z.string().trim().min(1, "La empresa es obligatoria").optional(),
    role: z.string().trim().min(1, "El puesto es obligatorio").optional(),
    startDate: dateString.optional(),
    endDate: dateString.nullish(),
    current: z.boolean().optional(),
    description: z.string().trim().optional(),
    location: z.string().trim().optional()
  })
  .strip()
  .refine(startNotAfterEnd, {
    message: "startDate no puede ser posterior a endDate",
    path: ["endDate"]
  });

export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;

export const createEducationSchema = z
  .object({
    institution: z.string().trim().min(1, "La institución es obligatoria"),
    title: z.string().trim().min(1, "El título es obligatorio"),
    field: z.string().trim().optional(),
    startDate: dateString,
    endDate: dateString.nullish(),
    current: z.boolean().optional()
  })
  .strip()
  .refine(startNotAfterEnd, {
    message: "startDate no puede ser posterior a endDate",
    path: ["endDate"]
  });

export type CreateEducationInput = z.infer<typeof createEducationSchema>;

export const updateEducationSchema = z
  .object({
    institution: z.string().trim().min(1, "La institución es obligatoria").optional(),
    title: z.string().trim().min(1, "El título es obligatorio").optional(),
    field: z.string().trim().optional(),
    startDate: dateString.optional(),
    endDate: dateString.nullish(),
    current: z.boolean().optional()
  })
  .strip()
  .refine(startNotAfterEnd, {
    message: "startDate no puede ser posterior a endDate",
    path: ["endDate"]
  });

export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;
