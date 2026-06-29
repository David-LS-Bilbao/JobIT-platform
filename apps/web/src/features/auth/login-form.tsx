"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { loginCandidate } from "@/features/auth/auth-api";
import { AuthError } from "@/features/auth/auth-error";
import { useAuth } from "@/features/auth/auth-context";
import { validateLoginForm, hasFieldErrors, type FieldErrors } from "@/features/auth/auth-validation";
import { ApiClientError } from "@/lib/api-client";

const inputClasses =
  "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20";

export function LoginForm() {
  const router = useRouter();
  const { setSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validateLoginForm({ email, password });
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) return;

    setLoading(true);
    try {
      const response = await loginCandidate({ email: email.trim(), password });
      setSession(response);
      router.push("/dashboard");
    } catch (error) {
      const status = error instanceof ApiClientError ? error.status : 0;
      setFormError(
        status === 401
          ? "Email o contraseña incorrectos."
          : "No se ha podido iniciar sesión. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AuthError message={formError} />

      <div className="space-y-1">
        <label htmlFor="login-email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          aria-invalid={fieldErrors.email ? true : undefined}
          className={inputClasses}
        />
        {fieldErrors.email ? <p className="text-xs text-red-600">{fieldErrors.email}</p> : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="login-password" className="block text-sm font-medium">
          Contraseña
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={loading}
          aria-invalid={fieldErrors.password ? true : undefined}
          className={inputClasses}
        />
        {fieldErrors.password ? <p className="text-xs text-red-600">{fieldErrors.password}</p> : null}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Entrando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
