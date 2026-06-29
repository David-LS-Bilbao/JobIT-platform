import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError, apiRequest, isSessionExpiredError } from "./api-client";

const BASE = "http://localhost:4000";

function mockFetchOnce(init: { status: number; body?: unknown; ok?: boolean }) {
  const ok = init.ok ?? (init.status >= 200 && init.status < 300);
  const text = init.body === undefined ? "" : JSON.stringify(init.body);
  const response = {
    status: init.status,
    ok,
    text: () => Promise.resolve(text)
  } as unknown as Response;
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("apiRequest", () => {
  it("usa NEXT_PUBLIC_API_BASE_URL y credentials:include", async () => {
    const fetchMock = mockFetchOnce({ status: 200, body: { ok: true } });
    await apiRequest("/api/health");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/api/health`);
    expect(options.credentials).toBe("include");
  });

  it("lanza error de configuración si falta NEXT_PUBLIC_API_BASE_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    mockFetchOnce({ status: 200, body: {} });
    await expect(apiRequest("/api/jobs")).rejects.toMatchObject({ code: "CONFIG_ERROR" });
  });

  it("añade Authorization Bearer cuando hay token", async () => {
    const fetchMock = mockFetchOnce({ status: 200, body: {} });
    await apiRequest("/api/auth/me", { token: "tok123" });
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = options.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer tok123");
  });

  it("no añade Authorization cuando no hay token", async () => {
    const fetchMock = mockFetchOnce({ status: 200, body: {} });
    await apiRequest("/api/jobs");
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = options.headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("serializa body JSON y añade Content-Type", async () => {
    const fetchMock = mockFetchOnce({ status: 201, body: {} });
    const payload = { email: "a@b.com", password: "Secret123" };
    await apiRequest("/api/auth/login", { method: "POST", body: payload });
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = options.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(options.body).toBe(JSON.stringify(payload));
  });

  it("devuelve undefined en 204 sin cuerpo", async () => {
    mockFetchOnce({ status: 204 });
    const result = await apiRequest<void>("/api/saved-jobs/abc", { method: "DELETE", token: "t" });
    expect(result).toBeUndefined();
  });

  it("parsea la respuesta OK", async () => {
    mockFetchOnce({ status: 200, body: { id: "u1", email: "a@b.com" } });
    const result = await apiRequest<{ id: string; email: string }>("/api/auth/me", { token: "t" });
    expect(result).toEqual({ id: "u1", email: "a@b.com" });
  });

  it("lanza ApiClientError con el formato { error } del backend", async () => {
    mockFetchOnce({
      status: 409,
      ok: false,
      body: { error: { code: "CONFLICT", message: "No ha sido posible completar el registro" } }
    });
    await expect(apiRequest("/api/auth/register", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 409,
      code: "CONFLICT",
      message: "No ha sido posible completar el registro"
    });
  });

  it("isSessionExpiredError detecta el 401", async () => {
    mockFetchOnce({
      status: 401,
      ok: false,
      body: { error: { code: "UNAUTHORIZED", message: "Authentication required." } }
    });
    let caught: unknown;
    try {
      await apiRequest("/api/dashboard/me", { token: "expired" });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiClientError);
    expect(isSessionExpiredError(caught)).toBe(true);
  });
});
