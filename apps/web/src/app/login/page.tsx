import Link from "next/link";

import { AuthFormShell } from "@/features/auth/auth-form-shell";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <AuthFormShell
      title="Inicia sesión en JobIT"
      subtitle="Accede a tu dashboard, perfil tech, guardados y matches."
      footer={
        <>
          ¿Aún no tienes cuenta?{" "}
          <Link href="/register" className="font-semibold text-sky-700 hover:underline">
            Crear cuenta
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthFormShell>
  );
}
