import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Step-up: reverificacion de la contraseña actual para operaciones destructivas
 * o de portabilidad. NO se aplican las reglas de fortaleza del registro: aqui se
 * comprueba una contraseña que ya existe, no se crea una nueva.
 */
export const stepUpSchema = z
  .object({
    password: z.string().min(1)
  })
  .strip();

/**
 * Borrado permanente. Ademas del step-up exige teclear la palabra exacta
 * `DELETE`: una accion irreversible no puede dispararse por un unico clic ni por
 * una peticion malformada.
 */
export const deleteAccountSchema = z
  .object({
    password: z.string().min(1),
    confirmation: z.literal("DELETE")
  })
  .strip();

export type StepUpInput = z.infer<typeof stepUpSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
