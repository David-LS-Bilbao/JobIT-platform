import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiClientError,
  apiRequest,
  REFRESH_PATH,
  registerAuthBridge,
  resetRefreshStateForTests
} from "@/lib/api-client";
import type { AuthResponseDto } from "@/types/api";

import { AuthProvider, useAuth } from "./auth-context";

vi.mock("@/features/profile/profile-api", () => ({ getMyProfile: vi.fn(() => new Promise(() => {})) }));

const BASE = "http://localhost:4000";

const recoveredAuth: AuthResponseDto = {
  accessToken: "tok-nuevo",
  user: {
    id: "user-sintetico",
    email: "candidate@jobit.dev",
    role: "CANDIDATE",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
};

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: () => Promise.resolve(JSON.stringify(body))
  } as unknown as Response;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  resetRefreshStateForTests();
});

afterEach(() => {
  registerAuthBridge(null);
  resetRefreshStateForTests();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("frontera real AuthProvider ↔ coordinador de refresh", () => {
  it("un bootstrap anónimo con refresh 401 nunca marca la sesión como expirada", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (!url.endsWith(REFRESH_PATH)) throw new Error(`Petición inesperada en bootstrap: ${url}`);
      return Promise.resolve(
        jsonResponse(401, { error: { code: "UNAUTHORIZED", message: "Authentication required." } })
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.sessionStatus).toBe("anonymous"));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.accessToken).toBeNull();
    expect(result.current.endReason).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${BASE}${REFRESH_PATH}`);
  });

  it("un logout durante el refresh cancela el retry y no reinstala ni expira la sesión", async () => {
    let refreshCalls = 0;
    let protectedCalls = 0;
    let resolveRecoveryRefresh!: (response: Response) => void;
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith(REFRESH_PATH)) {
        refreshCalls += 1;
        if (refreshCalls === 1) {
          return Promise.resolve(
            jsonResponse(401, { error: { code: "UNAUTHORIZED", message: "Authentication required." } })
          );
        }
        return new Promise<Response>((resolve) => {
          resolveRecoveryRefresh = resolve;
        });
      }
      protectedCalls += 1;
      return Promise.resolve(
        jsonResponse(
          protectedCalls === 1 ? 401 : 200,
          protectedCalls === 1
            ? { error: { code: "UNAUTHORIZED", message: "x" } }
            : { ok: true }
        )
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.sessionStatus).toBe("anonymous"));

    act(() => result.current.setSession({ ...recoveredAuth, accessToken: "tok-viejo" }));
    const pending = apiRequest("/api/protected", { token: "tok-viejo" }).catch((error: unknown) => error);
    await vi.waitFor(() => expect(refreshCalls).toBe(2));

    act(() => result.current.clearSession("logout"));
    resolveRecoveryRefresh(jsonResponse(200, recoveredAuth));

    const error = await pending;
    expect(error).toBeInstanceOf(ApiClientError);
    expect((error as ApiClientError).code).toBe("SESSION_RECOVERY_CANCELLED");
    expect(protectedCalls).toBe(1);
    expect(result.current.accessToken).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.endReason).toBe("logout");
  });
});
