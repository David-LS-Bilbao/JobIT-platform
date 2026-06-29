import Link from "next/link";

import { AuthFormShell } from "@/features/auth/auth-form-shell";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthFormShell
      title="Crear cuenta"
      subtitle="Crea tu perfil de candidato en JobIT."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-foreground underline">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthFormShell>
  );
}
