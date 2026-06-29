import { ButtonLink } from "@/components/ui/button-link";

// Landing simple candidate-first (Sprint 07). Estática: sin llamadas a backend
// ni formularios reales. Los enlaces son accesos; las pantallas llegan después.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-5xl font-bold tracking-tight">JobIT</h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Tu perfil tech, tus oportunidades y tus próximos pasos en un solo lugar.
        </p>
      </div>

      <nav aria-label="Accesos principales" className="flex flex-wrap items-center justify-center gap-3">
        <ButtonLink href="/login" variant="primary">
          Iniciar sesión
        </ButtonLink>
        <ButtonLink href="/register">Crear cuenta</ButtonLink>
        <ButtonLink href="/dashboard">Dashboard</ButtonLink>
      </nav>

      <p className="text-xs text-zinc-500">
        Próximamente: autenticación, panel del candidato y navegación conectada al backend.
      </p>
    </main>
  );
}
