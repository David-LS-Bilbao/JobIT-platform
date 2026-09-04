import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccountPage } from "@/features/auth/account-page";
import { deleteMyAccount, exportMyAccount } from "@/features/auth/account-api";
import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import { ApiClientError } from "@/lib/api-client";
import type { UserDto } from "@/types/api";

/**
 * `/profile/account` — ciclo de vida de la cuenta.
 * Spec: `docs/specs/features/account-lifecycle.md`.
 */

const { pushMock, routerMock } = vi.hoisted(() => {
  const push = vi.fn();
  return { pushMock: push, routerMock: { push } };
});

vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...actual,
    ensureRefreshed: vi.fn(async () => ({ status: "session-lost" as const })),
    registerAuthBridge: vi.fn()
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/profile/account"
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));
vi.mock("@/features/auth/account-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/auth/account-api")>()),
  exportMyAccount: vi.fn(),
  deleteMyAccount: vi.fn()
}));
vi.mock("@/features/auth/auth-api", () => ({ logoutCandidate: vi.fn() }));
vi.mock("@/features/auth/auth-identity", () => ({
  loadCandidateIdentity: vi.fn(() => new Promise(() => {}))
}));

const sessionUser: UserDto = {
  id: "u1",
  email: "ana@jobit.dev",
  role: "CANDIDATE",
  createdAt: "2026-01-01T00:00:00.000Z"
};

const exportDocument = {
  version: "1",
  exportedAt: "2026-09-03T10:00:00.000Z",
  account: { id: "u1", email: "ana@jobit.dev", role: "CANDIDATE", createdAt: "2026-01-01T00:00:00.000Z" },
  profile: null,
  portfolio: null,
  savedJobs: []
};

function SeedSessionButton() {
  const { setSession } = useAuth();
  return (
    <button type="button" onClick={() => setSession({ accessToken: "tok-account", user: sessionUser })}>
      seed-session
    </button>
  );
}

function renderWithSession() {
  const utils = render(
    <AuthProvider>
      <SeedSessionButton />
    </AuthProvider>
  );
  fireEvent.click(screen.getByText("seed-session"));
  utils.rerender(
    <AuthProvider>
      <AccountPage />
    </AuthProvider>
  );
  return utils;
}

beforeEach(() => {
  // `downloadJson` usa object URLs, que jsdom no implementa.
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:x") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("AccountPage (/profile/account)", () => {
  it("es privada: sin sesión redirige al login", async () => {
    render(
      <AuthProvider>
        <AccountPage />
      </AuthProvider>
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    expect(String(pushMock.mock.calls[0]?.[0])).toContain("/login");
  });

  it("muestra los dos bloques: mis datos y zona de peligro", () => {
    renderWithSession();
    expect(screen.getByRole("heading", { name: /mis datos/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /zona de peligro/i })).toBeInTheDocument();
    expect(screen.getByText(/permanente e irreversible/i)).toBeInTheDocument();
  });

  it("exporta los datos con la contraseña y prepara la descarga", async () => {
    vi.mocked(exportMyAccount).mockResolvedValue(exportDocument);
    renderWithSession();

    await userEvent.type(screen.getByLabelText(/confirma tu contraseña/i, { selector: "#export-password" }), "ValidPass123");
    await userEvent.click(screen.getByRole("button", { name: /exportar mis datos/i }));

    await waitFor(() => expect(exportMyAccount).toHaveBeenCalledWith("tok-account", "ValidPass123"));
    expect(await screen.findByText(/descarga preparada/i)).toBeInTheDocument();
  });

  it("muestra un error genérico cuando la contraseña de exportación no es válida", async () => {
    vi.mocked(exportMyAccount).mockRejectedValue(new ApiClientError(401, "UNAUTHORIZED", "Authentication required."));
    renderWithSession();

    await userEvent.type(screen.getByLabelText(/confirma tu contraseña/i, { selector: "#export-password" }), "Wrong");
    await userEvent.click(screen.getByRole("button", { name: /exportar mis datos/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/no hemos podido verificar tu contraseña/i);
  });

  // El borrado es irreversible: no puede dispararse sin la palabra exacta.
  it("mantiene deshabilitado el borrado hasta escribir DELETE exactamente", async () => {
    renderWithSession();
    const button = screen.getByRole("button", { name: /borrar mi cuenta/i });
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/confirma tu contraseña/i, { selector: "#delete-password" }), "ValidPass123");
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/escribe delete/i), "delete");
    expect(button).toBeDisabled();

    await userEvent.clear(screen.getByLabelText(/escribe delete/i));
    await userEvent.type(screen.getByLabelText(/escribe delete/i), "DELETE");
    expect(button).toBeEnabled();
  });

  it("borra la cuenta, limpia la sesión y sale del área privada", async () => {
    vi.mocked(deleteMyAccount).mockResolvedValue(undefined);
    renderWithSession();

    await userEvent.type(screen.getByLabelText(/confirma tu contraseña/i, { selector: "#delete-password" }), "ValidPass123");
    await userEvent.type(screen.getByLabelText(/escribe delete/i), "DELETE");
    await userEvent.click(screen.getByRole("button", { name: /borrar mi cuenta/i }));

    await waitFor(() => expect(deleteMyAccount).toHaveBeenCalledWith("tok-account", "ValidPass123"));
    // `clearSession("logout")` + `redirectToLogin(router)` sin motivo => "/login"
    // exacto. El arranque anonimo del provider empuja "/login?reason=required",
    // asi que la ruta sin query identifica inequivocamente al flujo de borrado.
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("no cierra la sesión si el borrado falla", async () => {
    vi.mocked(deleteMyAccount).mockRejectedValue(new ApiClientError(401, "UNAUTHORIZED", "Authentication required."));
    renderWithSession();

    await userEvent.type(screen.getByLabelText(/confirma tu contraseña/i, { selector: "#delete-password" }), "Wrong");
    await userEvent.type(screen.getByLabelText(/escribe delete/i), "DELETE");
    await userEvent.click(screen.getByRole("button", { name: /borrar mi cuenta/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/no hemos podido verificar tu contraseña/i);
    // No se ha ejecutado la salida del flujo de borrado ("/login" exacto); el
    // boton vuelve a estar disponible para reintentar.
    expect(pushMock).not.toHaveBeenCalledWith("/login");
    expect(screen.getByRole("button", { name: /borrar mi cuenta/i })).toBeEnabled();
  });
});
