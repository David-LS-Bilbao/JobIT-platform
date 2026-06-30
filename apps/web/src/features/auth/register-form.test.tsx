import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { registerCandidate } from "@/features/auth/auth-api";
import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import { ApiClientError } from "@/lib/api-client";
import type { AuthResponseDto } from "@/types/api";

import { RegisterForm } from "./register-form";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock("@/features/auth/auth-api", () => ({ registerCandidate: vi.fn() }));

const authResponse: AuthResponseDto = {
  accessToken: "tok-2",
  user: { id: "u2", email: "new@jobit.dev", role: "CANDIDATE", createdAt: "2026-01-01T00:00:00.000Z" }
};

function AuthProbe() {
  const { isAuthenticated } = useAuth();
  return <span data-testid="auth-state">{isAuthenticated ? "authed" : "anon"}</span>;
}

function renderForm() {
  return render(
    <AuthProvider>
      <RegisterForm />
      <AuthProbe />
    </AuthProvider>
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("RegisterForm", () => {
  it("renderiza email, contraseña y confirmación", () => {
    renderForm();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar contraseña")).toBeInTheDocument();
  });

  it("valida que las contraseñas coincidan y no llama a la API", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("Email"), "new@jobit.dev");
    await user.type(screen.getByLabelText("Contraseña"), "Valid123");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Different1");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(registerCandidate).not.toHaveBeenCalled();
    expect(screen.getByText("Las contraseñas no coinciden.")).toBeInTheDocument();
  });

  it("valida la política mínima de contraseña y no llama a la API", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("Email"), "new@jobit.dev");
    await user.type(screen.getByLabelText("Contraseña"), "weak");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "weak");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(registerCandidate).not.toHaveBeenCalled();
    expect(screen.getByText("La contraseña debe tener al menos 8 caracteres.")).toBeInTheDocument();
  });

  it("en éxito llama registerCandidate, guarda la sesión y redirige a /dashboard", async () => {
    vi.mocked(registerCandidate).mockResolvedValueOnce(authResponse);
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("Email"), "new@jobit.dev");
    await user.type(screen.getByLabelText("Contraseña"), "Valid123");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Valid123");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
    expect(registerCandidate).toHaveBeenCalledWith({ email: "new@jobit.dev", password: "Valid123" });
    expect(screen.getByTestId("auth-state")).toHaveTextContent("authed");
  });

  it("muestra un mensaje amable si el email ya existe (409)", async () => {
    vi.mocked(registerCandidate).mockRejectedValueOnce(new ApiClientError(409, "CONFLICT", "x"));
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("Email"), "new@jobit.dev");
    await user.type(screen.getByLabelText("Contraseña"), "Valid123");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Valid123");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(
      await screen.findByText("No se ha podido completar el registro con ese email.")
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
