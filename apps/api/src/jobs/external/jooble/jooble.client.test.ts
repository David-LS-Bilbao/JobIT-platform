import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import {
  searchJoobleJobs,
  JoobleConfigError,
  JoobleHttpError,
  JoobleTimeoutError,
  JoobleResponseError
} from "./jooble.client.js";

/**
 * Tests RED del cliente HTTP de Jooble (Fase 4B-RED).
 *
 * Fijan el contrato de `searchJoobleJobs(params, deps)` antes de implementar
 * `jooble.client.ts`. Sin red real: `fetchFn` siempre se inyecta. Sin uso de
 * `JOOBLE_API_KEY` real ni de `process.env`: la key se pasa por `deps`.
 *
 * Fallan mientras `./jooble.client.js` no exista (módulo inexistente).
 */

const loadFixture = (name: string): unknown =>
  JSON.parse(readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8"));

const VALID_RESPONSE = loadFixture("jooble.valid.json");

const BASE_URL = "https://example.test/api";
const API_KEY = "super-secret-key";

/** Construye un Response-like mínimo para el `fetchFn` inyectado. */
function mockResponse(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  const { ok = true, status = 200 } = init;
  return {
    ok,
    status,
    json: async () => body
  } as unknown as Response;
}

describe("searchJoobleJobs", () => {
  // a) API key ausente
  it("rejects with JoobleConfigError when the API key is missing and does not call fetch", async () => {
    const fetchFn = vi.fn();

    await expect(
      searchJoobleJobs({ keywords: "node" }, { apiKey: "   ", fetchFn })
    ).rejects.toBeInstanceOf(JoobleConfigError);

    expect(fetchFn).not.toHaveBeenCalled();
  });

  // b) Request válido
  it("performs a POST to base/{apiKey} with JSON params and returns the parsed response", async () => {
    const fetchFn = vi.fn(async (_url: string, _init: RequestInit) =>
      mockResponse(VALID_RESPONSE)
    );

    const result = await searchJoobleJobs(
      { keywords: "node", location: "Bilbao", page: 1 },
      { apiKey: API_KEY, fetchFn, baseUrl: BASE_URL }
    );

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe(`${BASE_URL}/${API_KEY}`);
    expect(init.method).toBe("POST");
    expect(JSON.stringify(init.headers)).toContain("application/json");

    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.keywords).toBe("node");
    expect(sentBody.location).toBe("Bilbao");
    expect(sentBody.page).toBe(1);

    expect(result.totalCount).toBe(2);
    expect(result.jobs).toHaveLength(2);
    expect(result.jobs[0].id).toBe("-1000000001");
  });

  // c) No exponer la API key en errores
  it("does not leak the API key in error messages", async () => {
    const fetchFn = vi.fn(async () => mockResponse({}, { ok: false, status: 500 }));

    const error = await searchJoobleJobs(
      { keywords: "node" },
      { apiKey: API_KEY, fetchFn, baseUrl: BASE_URL }
    ).catch((err: Error) => err);

    expect(error).toBeInstanceOf(JoobleHttpError);
    expect(error.message).not.toContain(API_KEY);
  });

  // d) HTTP no-2xx
  it("rejects with JoobleHttpError including the status on non-2xx responses", async () => {
    const fetchFn = vi.fn(async () => mockResponse({}, { ok: false, status: 500 }));

    const error = await searchJoobleJobs(
      { keywords: "node" },
      { apiKey: API_KEY, fetchFn, baseUrl: BASE_URL }
    ).catch((err: JoobleHttpError) => err);

    expect(error).toBeInstanceOf(JoobleHttpError);
    expect((error as JoobleHttpError).status).toBe(500);
    expect(error.message).not.toContain(API_KEY);
  });

  // e) Timeout / AbortError
  it("rejects with JoobleTimeoutError when the request is aborted", async () => {
    const fetchFn = vi.fn(async () => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      throw abortError;
    });

    await expect(
      searchJoobleJobs(
        { keywords: "node" },
        { apiKey: API_KEY, fetchFn, baseUrl: BASE_URL, timeoutMs: 10 }
      )
    ).rejects.toBeInstanceOf(JoobleTimeoutError);
  });

  // f) Payload inválido
  it("rejects with JoobleResponseError when the payload does not match the schema", async () => {
    const fetchFn = vi.fn(async () => mockResponse({ totalCount: "nope", jobs: "bad" }));

    await expect(
      searchJoobleJobs(
        { keywords: "node" },
        { apiKey: API_KEY, fetchFn, baseUrl: BASE_URL }
      )
    ).rejects.toBeInstanceOf(JoobleResponseError);
  });
});
