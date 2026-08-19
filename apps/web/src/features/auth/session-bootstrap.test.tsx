import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "./auth-context";
import type { AuthResponseDto } from "@/types/api";

// La identidad session-scoped no se ejercita aquí: se neutraliza con una promesa
// que nunca resuelve, como en el resto de las suites de auth.
vi.mock("@/features/profile/profile-api", () => ({ getMyProfile: vi.fn(() => new Promise(() => {})) }));

const ensureRefreshed = vi.fn();
const registerAuthBridge = vi.fn();

vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...actual,
    ensureRefreshed: (...args: unknown[]) => ensureRefreshed(...args),
    registerAuthBridge: (...args: unknown[]) => registerAuthBridge(...args)
  };
});

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

const sampleAuth: AuthResponseDto = {
  accessToken: "access-recuperado",
  user: {
    id: "u1",
    email: "candidate@jobit.dev",
    role: "CANDIDATE",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
};

beforeEach(() => {
  ensureRefreshed.mockReset();
  registerAuthBridge.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("bootstrap de sesión", () => {
  it("F24 · bootstrap con refresh válido recupera la sesión", async () => {
    ensureRefreshed.mockResolvedValue({ status: "refreshed", accessToken: sampleAuth.accessToken });
    // El bridge instala la sesión: se simula invocando onRefreshed con el registrado.
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(registerAuthBridge).toHaveBeenCalled());
    const bridge = registerAuthBridge.mock.calls[0][0] as {
      getSessionGeneration: () => number;
      onRefreshed: (auth: AuthResponseDto, generation: number) => void;
    };
    act(() => bridge.onRefreshed(sampleAuth, bridge.getSessionGeneration()));

    await waitFor(() => expect(result.current.sessionStatus).toBe("authenticated"));
    expect(result.current.accessToken).toBe(sampleAuth.accessToken);
    expect(result.current.user?.email).toBe(sampleAuth.user.email);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("F25 · bootstrap con sesión no recuperable termina en anónimo, sin endReason", async () => {
    ensureRefreshed.mockResolvedValue({ status: "session-lost" });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.sessionStatus).toBe("anonymous"));
    expect(result.current.accessToken).toBeNull();
    // No es una expiración: la guarda debe mostrar `required`, nunca `expired`.
    expect(result.current.endReason).toBeNull();
  });

  it("F26 · durante el bootstrap nunca se aparenta estar autenticado", async () => {
    let resolveRefresh!: (v: unknown) => void;
    ensureRefreshed.mockReturnValue(new Promise((r) => (resolveRefresh = r)));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.sessionStatus).toBe("bootstrapping");
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.accessToken).toBeNull();

    await act(async () => {
      resolveRefresh({ status: "session-lost" });
    });
    await waitFor(() => expect(result.current.sessionStatus).toBe("anonymous"));
  });

  it("F27 · tras quedar anónimo no se dispara ningún refresh adicional", async () => {
    ensureRefreshed.mockResolvedValue({ status: "session-lost" });

    const { result, rerender } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.sessionStatus).toBe("anonymous"));
    rerender();
    rerender();

    expect(ensureRefreshed).toHaveBeenCalledTimes(1);
  });

  it("F28 · un fallo transitorio deja `unavailable`, sin limpiar la sesión ni redirigir", async () => {
    ensureRefreshed.mockResolvedValue({ status: "transient" });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.sessionStatus).toBe("unavailable"));
    // NO es una sesión inválida: no se declara expiración ni se fuerza anónimo terminal.
    expect(result.current.endReason).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    // Un solo intento: sin bucle ni temporizador.
    expect(ensureRefreshed).toHaveBeenCalledTimes(1);
  });

  it("F29 · el bootstrap se ejecuta una sola vez aunque el proveedor se remonte en StrictMode", async () => {
    ensureRefreshed.mockResolvedValue({ status: "session-lost" });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.sessionStatus).toBe("anonymous"));

    // React 19 en modo desarrollo puede montar/desmontar/montar; el efecto es idempotente
    // porque el single-flight comparte la promesa y el estado ya no es "bootstrapping".
    expect(ensureRefreshed).toHaveBeenCalledTimes(1);
  });

  it("F30 · un refresh que resuelve tras un logout no reinstala la sesión", async () => {
    let resolveRefresh!: (v: unknown) => void;
    ensureRefreshed.mockReturnValue(new Promise((r) => (resolveRefresh = r)));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(registerAuthBridge).toHaveBeenCalled());
    const bridge = registerAuthBridge.mock.calls[0][0] as {
      getSessionGeneration: () => number;
      onRefreshed: (auth: AuthResponseDto, generation: number) => void;
    };
    // Generación capturada al ARRANCAR el refresh, como hace el cliente API.
    const generationAtStart = bridge.getSessionGeneration();

    // El usuario cierra sesión mientras el refresh sigue en vuelo.
    act(() => result.current.clearSession("logout"));

    // El refresh termina DESPUÉS: la generación capturada ya no es vigente.
    await act(async () => {
      bridge.onRefreshed(sampleAuth, generationAtStart);
      resolveRefresh({ status: "refreshed", accessToken: sampleAuth.accessToken });
    });

    expect(result.current.accessToken).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.endReason).toBe("logout");
  });

  it("F31 · el bridge se registra al montar y se desregistra al desmontar", async () => {
    ensureRefreshed.mockResolvedValue({ status: "session-lost" });

    const { unmount, result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.sessionStatus).toBe("anonymous"));
    expect(registerAuthBridge).toHaveBeenCalledWith(expect.objectContaining({ onRefreshed: expect.any(Function) }));

    unmount();

    expect(registerAuthBridge).toHaveBeenLastCalledWith(null);
  });
});
