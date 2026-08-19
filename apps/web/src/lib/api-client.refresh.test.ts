import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiClientError,
  apiRequest,
  apiUpload,
  isSessionExpiredError,
  registerAuthBridge,
  resetRefreshStateForTests,
  type AuthBridge
} from "./api-client";
import type { AuthResponseDto } from "@/types/api";

const BASE = "http://localhost:4000";
const REFRESH_PATH = "/api/auth/refresh";

const authResponse = (accessToken: string): AuthResponseDto => ({
  accessToken,
  user: {
    id: "u1",
    email: "candidate@jobit.dev",
    role: "CANDIDATE",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
});

type Reply = { status: number; body?: unknown; reject?: boolean };

/** Cola de respuestas de `fetch`, en orden de invocación. */
function queueFetch(replies: Reply[]) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  let i = 0;
  const fetchMock = vi.fn((url: string, init: RequestInit) => {
    calls.push({ url, init });
    const reply = replies[Math.min(i, replies.length - 1)];
    i++;
    if (reply.reject) return Promise.reject(new TypeError("Failed to fetch"));
    const text = reply.body === undefined ? "" : JSON.stringify(reply.body);
    return Promise.resolve({
      status: reply.status,
      ok: reply.status >= 200 && reply.status < 300,
      text: () => Promise.resolve(text)
    } as unknown as Response);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

const refreshCalls = (calls: Array<{ url: string }>): number =>
  calls.filter((c) => c.url.endsWith(REFRESH_PATH)).length;

let bridge: {
  getAccessToken: ReturnType<typeof vi.fn>;
  getSessionGeneration: ReturnType<typeof vi.fn>;
  onRefreshed: ReturnType<typeof vi.fn>;
  onSessionLost: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  resetRefreshStateForTests();
  bridge = {
    getAccessToken: vi.fn(() => "tok-actual"),
    getSessionGeneration: vi.fn(() => 0),
    onRefreshed: vi.fn(),
    onSessionLost: vi.fn()
  };
  registerAuthBridge(bridge as unknown as AuthBridge);
});

afterEach(() => {
  registerAuthBridge(null);
  resetRefreshStateForTests();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("recuperación centralizada de 401 — apiRequest", () => {
  it("F01 · una petición correcta no dispara refresh", async () => {
    const { calls } = queueFetch([{ status: 200, body: { ok: true } }]);

    await apiRequest("/api/dashboard/me", { token: "tok" });

    expect(calls).toHaveLength(1);
    expect(refreshCalls(calls)).toBe(0);
  });

  it("F02 · un 401 dispara exactamente un refresh", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "Authentication required." } } },
      { status: 200, body: authResponse("tok-nuevo") },
      { status: 200, body: { ok: true } }
    ]);

    await apiRequest("/api/dashboard/me", { token: "tok-viejo" });

    expect(refreshCalls(calls)).toBe(1);
  });

  it("F03 · tras un refresh correcto se reintenta la original exactamente una vez", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 200, body: authResponse("tok-nuevo") },
      { status: 200, body: { ok: true } }
    ]);

    const result = await apiRequest<{ ok: boolean }>("/api/dashboard/me", { token: "tok-viejo" });

    expect(result).toEqual({ ok: true });
    expect(calls).toHaveLength(3);
    expect(calls[0].url).toBe(`${BASE}/api/dashboard/me`);
    expect(calls[1].url).toBe(`${BASE}${REFRESH_PATH}`);
    expect(calls[2].url).toBe(`${BASE}/api/dashboard/me`);
  });

  it("F04 · un refresh con 401 termina la sesión y no reintenta", async () => {
    const original = { error: { code: "UNAUTHORIZED", message: "Authentication required." } };
    const { calls } = queueFetch([
      { status: 401, body: original },
      { status: 401, body: original }
    ]);

    const error = await apiRequest("/api/dashboard/me", { token: "tok" }).catch((e: unknown) => e);

    expect(isSessionExpiredError(error)).toBe(true);
    expect(bridge.onSessionLost).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(2); // original + refresh, sin reintento
  });

  it("F05 · la llamada de refresh no se intercepta a sí misma", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } }
    ]);

    await apiRequest("/api/dashboard/me", { token: "tok" }).catch(() => undefined);

    expect(refreshCalls(calls)).toBe(1);
  });

  it("F06 · un segundo 401 tras el reintento no genera bucle", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 200, body: authResponse("tok-nuevo") },
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } }
    ]);

    const error = await apiRequest("/api/dashboard/me", { token: "tok" }).catch((e: unknown) => e);

    expect(isSessionExpiredError(error)).toBe(true);
    expect(calls).toHaveLength(3);
    expect(refreshCalls(calls)).toBe(1);
  });

  it("F07 · N peticiones con 401 comparten un solo refresh", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 200, body: authResponse("tok-nuevo") },
      { status: 200, body: { ok: true } }
    ]);

    await Promise.all([
      apiRequest("/api/a", { token: "t" }),
      apiRequest("/api/b", { token: "t" }),
      apiRequest("/api/c", { token: "t" })
    ]);

    expect(refreshCalls(calls)).toBe(1);
  });

  it("F08 · todos los waiters continúan tras un refresh correcto", async () => {
    let call = 0;
    const fetchMock = vi.fn((url: string) => {
      call++;
      if (url.endsWith(REFRESH_PATH)) {
        return Promise.resolve({
          status: 200,
          ok: true,
          text: () => Promise.resolve(JSON.stringify(authResponse("tok-nuevo")))
        } as unknown as Response);
      }
      const isRetry = call > 4;
      return Promise.resolve({
        status: isRetry ? 200 : 401,
        ok: isRetry,
        text: () =>
          Promise.resolve(
            JSON.stringify(isRetry ? { ok: true } : { error: { code: "UNAUTHORIZED", message: "x" } })
          )
      } as unknown as Response);
    });
    vi.stubGlobal("fetch", fetchMock);

    const results = await Promise.all([
      apiRequest<{ ok: boolean }>("/api/a", { token: "t" }),
      apiRequest<{ ok: boolean }>("/api/b", { token: "t" }),
      apiRequest<{ ok: boolean }>("/api/c", { token: "t" })
    ]);

    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
  });

  it("F09 · tras un refresh 401 todos los waiters fallan igual y se avisa una sola vez", async () => {
    queueFetch([{ status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } }]);

    const errors = await Promise.all([
      apiRequest("/api/a", { token: "t" }).catch((e: unknown) => e),
      apiRequest("/api/b", { token: "t" }).catch((e: unknown) => e),
      apiRequest("/api/c", { token: "t" }).catch((e: unknown) => e)
    ]);

    expect(errors.every((e) => isSessionExpiredError(e))).toBe(true);
    expect(bridge.onSessionLost).toHaveBeenCalledTimes(1);
  });

  it("F10 · un 401 sin token no dispara refresh (protege login/register)", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } }
    ]);

    await apiRequest("/api/auth/login", { method: "POST", body: {} }).catch(() => undefined);

    expect(refreshCalls(calls)).toBe(0);
    expect(bridge.onSessionLost).not.toHaveBeenCalled();
  });

  it("F11 · el single-flight se limpia y permite un ciclo nuevo", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 200, body: authResponse("tok-1") },
      { status: 200, body: { ok: true } }
    ]);
    await apiRequest("/api/a", { token: "t" });
    expect(refreshCalls(calls)).toBe(1);

    const second = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 200, body: authResponse("tok-2") },
      { status: 200, body: { ok: true } }
    ]);
    await apiRequest("/api/b", { token: "t" });

    expect(refreshCalls(second.calls)).toBe(1);
  });

  it("F12 · el refresh viaja con credentials:include", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 200, body: authResponse("tok-nuevo") },
      { status: 200, body: { ok: true } }
    ]);

    await apiRequest("/api/a", { token: "t" });

    const call = calls.find((c) => c.url.endsWith(REFRESH_PATH))!;
    expect(call.init.credentials).toBe("include");
    expect(call.init.method).toBe("POST");
  });

  it("F13 · el refresh no lleva Authorization, ni body, ni query", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 200, body: authResponse("tok-nuevo") },
      { status: 200, body: { ok: true } }
    ]);

    await apiRequest("/api/a", { token: "t" });

    const call = calls.find((c) => c.url.endsWith(REFRESH_PATH))!;
    expect((call.init.headers as Record<string, string>)["Authorization"]).toBeUndefined();
    expect(call.init.body).toBeUndefined();
    expect(call.url).toBe(`${BASE}${REFRESH_PATH}`);
  });

  it("F14 · el reintento usa el token nuevo, no el que pasó la feature", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 200, body: authResponse("tok-fresco") },
      { status: 200, body: { ok: true } }
    ]);
    bridge.getAccessToken.mockReturnValue("tok-fresco");

    await apiRequest("/api/a", { token: "tok-obsoleto" });

    const retry = calls[2];
    expect((retry.init.headers as Record<string, string>)["Authorization"]).toBe("Bearer tok-fresco");
  });

  it("F15 · un 401 en la propia ruta de refresh no anida otro refresh", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } }
    ]);

    await apiRequest(REFRESH_PATH, { method: "POST", token: "t" }).catch(() => undefined);

    expect(calls).toHaveLength(1);
  });

  // ── Distinción terminal / transitorio ───────────────────────────────────────

  it("F16 · un refresh con 5xx es transitorio: ni sesión perdida ni reintento", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 500, body: { error: { code: "INTERNAL_ERROR", message: "Internal server error." } } }
    ]);

    const error = await apiRequest("/api/a", { token: "t" }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiClientError);
    expect((error as ApiClientError).code).toBe("REFRESH_UNAVAILABLE");
    expect((error as ApiClientError).status).toBe(0);
    // Clave: la feature NO debe interpretarlo como sesión caducada.
    expect(isSessionExpiredError(error)).toBe(false);
    expect(bridge.onSessionLost).not.toHaveBeenCalled();
    expect(calls).toHaveLength(2); // sin reintento de la original
  });

  it("F17 · un fallo de red en el refresh es transitorio", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 0, reject: true }
    ]);

    const error = await apiRequest("/api/a", { token: "t" }).catch((e: unknown) => e);

    expect((error as ApiClientError).code).toBe("REFRESH_UNAVAILABLE");
    expect(isSessionExpiredError(error)).toBe(false);
    expect(bridge.onSessionLost).not.toHaveBeenCalled();
    expect(calls).toHaveLength(2);
  });

  it("F18 · bajo desenlace transitorio los waiters fallan igual y nadie pierde la sesión", async () => {
    let call = 0;
    const fetchMock = vi.fn((url: string) => {
      call++;
      if (url.endsWith(REFRESH_PATH)) {
        return Promise.resolve({
          status: 500,
          ok: false,
          text: () =>
            Promise.resolve(JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "x" } }))
        } as unknown as Response);
      }
      return Promise.resolve({
        status: 401,
        ok: false,
        text: () => Promise.resolve(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "x" } }))
      } as unknown as Response);
    });
    vi.stubGlobal("fetch", fetchMock);

    const errors = await Promise.all([
      apiRequest("/api/a", { token: "t" }).catch((e: unknown) => e),
      apiRequest("/api/b", { token: "t" }).catch((e: unknown) => e),
      apiRequest("/api/c", { token: "t" }).catch((e: unknown) => e)
    ]);

    expect(errors.every((e) => (e as ApiClientError).code === "REFRESH_UNAVAILABLE")).toBe(true);
    expect(errors.every((e) => isSessionExpiredError(e) === false)).toBe(true);
    expect(bridge.onSessionLost).not.toHaveBeenCalled();
    // Un solo refresh compartido; ninguna original reintentada.
    expect(fetchMock.mock.calls.filter(([u]) => String(u).endsWith(REFRESH_PATH))).toHaveLength(1);
    expect(call).toBe(4);
  });

  it("F19 · el desenlace transitorio no genera bucle ni reintento automático", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 503, body: { error: { code: "INTERNAL_ERROR", message: "x" } } }
    ]);

    await apiRequest("/api/a", { token: "t" }).catch(() => undefined);

    expect(calls).toHaveLength(2);
    expect(refreshCalls(calls)).toBe(1);
  });
});

describe("recuperación centralizada de 401 — apiUpload", () => {
  const formData = (): FormData => {
    const fd = new FormData();
    fd.append("avatar", new Blob(["binario"], { type: "image/png" }), "avatar.png");
    return fd;
  };

  it("F20 · apiUpload recupera el 401 y reintenta una sola vez con el token nuevo", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 200, body: authResponse("tok-fresco") },
      { status: 200, body: { avatarUrl: "/uploads/a.png" } }
    ]);
    bridge.getAccessToken.mockReturnValue("tok-fresco");

    const result = await apiUpload<{ avatarUrl: string }>("/api/profile/me/avatar", formData(), {
      token: "tok-viejo"
    });

    expect(result).toEqual({ avatarUrl: "/uploads/a.png" });
    expect(calls).toHaveLength(3);
    expect(refreshCalls(calls)).toBe(1);
    const retry = calls[2];
    expect((retry.init.headers as Record<string, string>)["Authorization"]).toBe("Bearer tok-fresco");
  });

  it("F21 · el reintento de apiUpload conserva el FormData y no fija Content-Type", async () => {
    const { calls } = queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 200, body: authResponse("tok-fresco") },
      { status: 200, body: { ok: true } }
    ]);
    const body = formData();

    await apiUpload("/api/profile/me/avatar", body, { token: "t" });

    const original = calls[0];
    const retry = calls[2];
    expect(original.init.body).toBe(body);
    // El navegador debe seguir construyendo multipart/form-data con su boundary.
    expect((original.init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
    expect((retry.init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
    // El MISMO FormData se reutiliza en el reintento.
    expect(retry.init.body).toBe(body);
  });

  it("F22 · apiUpload comparte el single-flight con apiRequest", async () => {
    let call = 0;
    const fetchMock = vi.fn((url: string) => {
      call++;
      if (url.endsWith(REFRESH_PATH)) {
        return Promise.resolve({
          status: 200,
          ok: true,
          text: () => Promise.resolve(JSON.stringify(authResponse("tok-nuevo")))
        } as unknown as Response);
      }
      const isRetry = call > 3;
      return Promise.resolve({
        status: isRetry ? 200 : 401,
        ok: isRetry,
        text: () =>
          Promise.resolve(
            JSON.stringify(isRetry ? { ok: true } : { error: { code: "UNAUTHORIZED", message: "x" } })
          )
      } as unknown as Response);
    });
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all([
      apiRequest("/api/a", { token: "t" }),
      apiUpload("/api/profile/me/avatar", formData(), { token: "t" })
    ]);

    expect(fetchMock.mock.calls.filter(([u]) => String(u).endsWith(REFRESH_PATH))).toHaveLength(1);
  });

  it("F23 · un refresh transitorio en apiUpload no declara la sesión inválida", async () => {
    queueFetch([
      { status: 401, body: { error: { code: "UNAUTHORIZED", message: "x" } } },
      { status: 500, body: { error: { code: "INTERNAL_ERROR", message: "x" } } }
    ]);

    const error = await apiUpload("/api/profile/me/avatar", formData(), { token: "t" }).catch(
      (e: unknown) => e
    );

    expect((error as ApiClientError).code).toBe("REFRESH_UNAVAILABLE");
    expect(isSessionExpiredError(error)).toBe(false);
    expect(bridge.onSessionLost).not.toHaveBeenCalled();
  });
});
