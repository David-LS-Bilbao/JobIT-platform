import Link from "next/link";

import { AuthFormShell } from "@/features/auth/auth-form-shell";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <AuthFormShell
      title="Iniciar sesión"
      subtitle="Accede a tu panel de candidato."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-foreground underline">
            Crear cuenta
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthFormShell>
  );
}
