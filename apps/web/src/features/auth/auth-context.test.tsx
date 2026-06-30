import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "./auth-context";
import type { AuthResponseDto } from "@/types/api";

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
