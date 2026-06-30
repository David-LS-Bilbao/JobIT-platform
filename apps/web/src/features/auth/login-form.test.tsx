import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loginCandidate } from "@/features/auth/auth-api";
import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import { ApiClientError } from "@/lib/api-client";
import type { AuthResponseDto } from "@/types/api";

import { LoginForm } from "./login-form";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock("@/features/auth/auth-api", () => ({ loginCandidate: vi.fn() }));

const authResponse: AuthResponseDto = {
  accessToken: "tok-1",
  user: { id: "u1", email: "c@jobit.dev", role: "CANDIDATE", createdAt: "2026-01-01T00:00:00.000Z" }
};

function AuthProbe() {
  const { isAuthenticated } = useAuth();
  return <span data-testid="auth-state">{isAuthenticated ? "authed" : "anon"}</span>;
}

function renderForm() {
  return render(
    <AuthProvider>
      <LoginForm />
      <AuthProbe />
    </AuthProvider>
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("LoginForm", () => {
  it("renderiza email, contraseña y botón de envío", () => {
    renderForm();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeInTheDocument();
  });

  it("muestra error de validación al enviar vacío y no llama a la API", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(loginCandidate).not.toHaveBeenCalled();
    expect(screen.getByText("Introduce tu email.")).toBeInTheDocument();
  });

  it("en éxito llama loginCandidate, guarda la sesión y redirige a /dashboard", async () => {
    vi.mocked(loginCandidate).mockResolvedValueOnce(authResponse);
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("Email"), "c@jobit.dev");
    await user.type(screen.getByLabelText("Contraseña"), "Valid123");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
    expect(loginCandidate).toHaveBeenCalledWith({ email: "c@jobit.dev", password: "Valid123" });
    expect(screen.getByTestId("auth-state")).toHaveTextContent("authed");
  });

  it("muestra error genérico si las credenciales son inválidas (401)", async () => {
    vi.mocked(loginCandidate).mockRejectedValueOnce(new ApiClientError(401, "UNAUTHORIZED", "x"));
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("Email"), "c@jobit.dev");
    await user.type(screen.getByLabelText("Contraseña"), "Valid123");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByText("Email o contraseña incorrectos.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("auth-state")).toHaveTextContent("anon");
  });
});
