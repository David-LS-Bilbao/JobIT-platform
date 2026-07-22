"use client";

/**
 * Aviso contextual de sesión en /login (FLOW-02, Sprint 21D). Lee `?reason=` y
 * muestra un mensaje accesible solo para motivos conocidos (required/expired);
 * cualquier otro valor o su ausencia → sin aviso. Cliente + `useSearchParams`
 * (debe montarse bajo `<Suspense>` para no romper el build estático).
 */
import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  required: "Inicia sesión para continuar.",
  expired: "Tu sesión ha finalizado. Vuelve a iniciar sesión."
};

export function SessionNotice() {
  const params = useSearchParams();
  const message = MESSAGES[params?.get("reason") ?? ""];
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-6 rounded-lg border border-jobit-brand-border bg-jobit-brand-soft px-4 py-3 text-sm font-medium text-jobit-brand-dark"
    >
      {message}
    </div>
  );
}
