import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyProfile } from "@/features/profile/profile-api";
import { ApiClientError } from "@/lib/api-client";
import { AuthProvider, useAuth } from "./auth-context";
import type { AuthResponseDto, CandidateProfileDto } from "@/types/api";

// Sprint 21D: el AuthContext cargará una identidad ligera del candidato (snapshot).
// Default que no resuelve: los tests base no ejercen la identidad y así el efecto
// no dispara actualizaciones fuera de act; el describe de identidad lo sobreescribe.
vi.mock("@/features/profile/profile-api", () => ({ getMyProfile: vi.fn(() => new Promise(() => {})) }));

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

const sampleAuth: AuthResponseDto = {
  accessToken: "access-123",
  user: {
    id: "u1",
    email: "candidate@jobit.dev",
    role: "CANDIDATE",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
};

describe("AuthProvider / useAuth", () => {
  it("estado inicial: no autenticado", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.accessToken).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("setSession guarda accessToken y user en memoria", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.setSession(sampleAuth));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.accessToken).toBe("access-123");
    expect(result.current.user?.email).toBe("candidate@jobit.dev");
  });

  it("clearSession limpia la sesión", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.setSession(sampleAuth));
    act(() => result.current.clearSession());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.accessToken).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("no escribe en localStorage ni sessionStorage", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.setSession(sampleAuth));
    act(() => result.current.clearSession());
    expect(setItemSpy).not.toHaveBeenCalled();
  });
});

const sampleProfile: CandidateProfileDto = {
  id: "p1",
  userId: "u1",
  firstName: "Ana",
  lastName: "Rivas",
  headline: "Frontend developer",
  summary: null,
  location: null,
  locationRemote: false,
  availabilityStatus: "ACTIVE",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  completionPercentage: 40,
  skills: [],
  experiences: [],
  education: [],
  projects: [],
  links: [],
  preferences: null
};

describe("AuthProvider · identidad y sesión (Sprint 21D RED)", () => {
  beforeEach(() => {
    vi.mocked(getMyProfile).mockReset();
    vi.mocked(getMyProfile).mockResolvedValue(sampleProfile);
  });

  it("C1: carga la identidad una vez al iniciar sesión, sin bloquear token/user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.setSession(sampleAuth));
    await waitFor(() => expect(getMyProfile).toHaveBeenCalledWith("access-123"), { timeout: 1500 });
    await waitFor(
      () =>
        expect(result.current.candidateIdentity).toMatchObject({
          firstName: "Ana",
          lastName: "Rivas",
          headline: "Frontend developer"
        }),
      { timeout: 1500 }
    );
    expect(result.current.identityResolved).toBe(true);
    expect(result.current.accessToken).toBe("access-123");
    expect(result.current.user?.email).toBe("candidate@jobit.dev");
  });

  it("C2: error no-401 mantiene la sesión, identidad null y identityResolved true", async () => {
    vi.mocked(getMyProfile).mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.setSession(sampleAuth));
    await waitFor(() => expect(result.current.identityResolved).toBe(true), { timeout: 1500 });
    expect(result.current.candidateIdentity).toBeNull();
    expect(result.current.accessToken).toBe("access-123");
  });

  it("C3: 401 de identidad termina la sesión con endReason=expired", async () => {
    vi.mocked(getMyProfile).mockRejectedValue(new ApiClientError(401, "UNAUTHORIZED", "x"));
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.setSession(sampleAuth));
    await waitFor(() => expect(result.current.endReason).toBe("expired"), { timeout: 1500 });
    expect(result.current.accessToken).toBeNull();
  });

  it("C4: updateCandidateIdentity actualiza el snapshot sin nueva petición", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.setSession(sampleAuth));
    await waitFor(() => expect(getMyProfile).toHaveBeenCalledTimes(1), { timeout: 1500 });
    expect(result.current.updateCandidateIdentity).toBeTypeOf("function");
    act(() =>
      result.current.updateCandidateIdentity?.({
        firstName: "Bob",
        lastName: "Lee",
        headline: null,
        avatarUrl: null
      })
    );
    expect(result.current.candidateIdentity).toMatchObject({ firstName: "Bob", lastName: "Lee" });
    expect(getMyProfile).toHaveBeenCalledTimes(1);
  });

  it("C5: clearSession('logout') limpia la sesión y fija endReason=logout", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.setSession(sampleAuth));
    act(() => result.current.clearSession("logout"));
    expect(result.current.accessToken).toBeNull();
    expect(result.current.endReason).toBe("logout");
  });

  it("C6: un nuevo login reinicia endReason a null", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.clearSession("expired"));
    act(() => result.current.setSession(sampleAuth));
    expect(result.current.endReason).toBeNull();
  });
});
