const RULES: ReadonlyArray<{ test: (password: string) => boolean; label: string }> = [
  { test: (password) => password.length >= 8, label: "Al menos 8 caracteres" },
  { test: (password) => /[A-Z]/.test(password), label: "Una mayúscula" },
  { test: (password) => /[0-9]/.test(password), label: "Un número" }
];

/** Lista orientativa de requisitos de contraseña (feedback UX, no validación). */
export function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="mt-2 space-y-1 text-xs text-zinc-500">
      {RULES.map((rule) => {
        const satisfied = rule.test(password);
        return (
          <li key={rule.label} className={satisfied ? "text-green-600 dark:text-green-400" : undefined}>
            <span aria-hidden="true">{satisfied ? "✓" : "•"}</span> {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
