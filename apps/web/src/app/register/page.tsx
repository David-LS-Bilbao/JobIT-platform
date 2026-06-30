import Link from "next/link";

import { AuthFormShell } from "@/features/auth/auth-form-shell";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthFormShell
      title="Crea tu perfil tech en JobIT"
      subtitle="Empieza tu CV candidate-first en minutos. Es solo el principio."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-sky-700 hover:underline">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthFormShell>
  );
}
