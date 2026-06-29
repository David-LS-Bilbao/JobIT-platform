/**
 * Validación de formularios de Auth en cliente (Sprint 07).
 * Solo UX: el backend es la fuente de verdad. La política de contraseña replica
 * la del backend (min 8, ≥1 mayúscula, ≥1 número) para feedback inmediato.
 */
export type FieldErrors = Record<string, string | undefined>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmailRequired(email: string): string | undefined {
  const value = email.trim();
  if (!value) return "Introduce tu email.";
  if (!EMAIL_RE.test(value)) return "Introduce un email válido.";
  return undefined;
}

export function validatePasswordPolicy(password: string): string | undefined {
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "La contraseña debe contener al menos una mayúscula.";
  if (!/[0-9]/.test(password)) return "La contraseña debe contener al menos un número.";
  return undefined;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export function validateLoginForm(values: LoginFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const emailError = validateEmailRequired(values.email);
  if (emailError) errors.email = emailError;
  if (!values.password) errors.password = "Introduce tu contraseña.";
  return errors;
}

export interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

export function validateRegisterForm(values: RegisterFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const emailError = validateEmailRequired(values.email);
  if (emailError) errors.email = emailError;
  const passwordError = validatePasswordPolicy(values.password);
  if (passwordError) errors.password = passwordError;
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }
  return errors;
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some((value) => value !== undefined);
}
