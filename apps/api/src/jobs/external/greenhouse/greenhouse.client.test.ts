import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import {
  fetchGreenhouseBoardJobs,
  GreenhouseConfigError,
  GreenhouseHttpError,
  GreenhouseTimeoutError,
  GreenhouseResponseError
} from "./greenhouse.client.js";

/**
 * Tests del cliente HTTP del Job Board API público de Greenhouse.
 *
 * Fijan el contrato de `fetchGreenhouseBoardJobs(boardToken, deps)` sin red real:
 * `fetchFn` siempre se inyecta. El endpoint es público (sin API key).
 */

const loadFixture = (name: string): unknown =>
  JSON.parse(readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8"));

const VALID_RESPONSE = loadFixture("greenhouse-board.valid.json");
const EMPTY_RESPONSE = loadFixture("greenhouse-board.empty.json");

const BASE_URL = "https://boards.example.test/v1/boards";
const BOARD = "acme";

function mockResponse(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  const { ok = true, status = 200 } = init;
  return {
    ok,
    status,
    json: async () => body
  } as unknown as Response;
}

describe("fetchGreenhouseBoardJobs", () => {
  // a) Board token ausente
  it("rejects with GreenhouseConfigError when the board token is missing and does not call fetch", async () => {
    const fetchFn = vi.fn();

    await expect(
      fetchGreenhouseBoardJobs("   ", { fetchFn })
    ).rejects.toBeInstanceOf(GreenhouseConfigError);

    expect(fetchFn).not.toHaveBeenCalled();
  });

  // b) Request válido con content=true
  it("performs a GET to base/{board}/jobs?content=true and returns the parsed response", async () => {
    const fetchFn = vi.fn(async (_url: string, _init: RequestInit) => mockResponse(VALID_RESPONSE));

    const result = await fetchGreenhouseBoardJobs(BOARD, { fetchFn, baseUrl: BASE_URL });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe(`${BASE_URL}/${BOARD}/jobs?content=true`);
    expect(init.method).toBe("GET");
    expect(result.jobs).toHaveLength(2);
    expect(result.jobs[0]?.id).toBe("4001001");
  });

  // c) Respuesta vacía válida
  it("returns an empty jobs array without error", async () => {
    const fetchFn = vi.fn(async () => mockResponse(EMPTY_RESPONSE));

    const result = await fetchGreenhouseBoardJobs(BOARD, { fetchFn, baseUrl: BASE_URL });

    expect(result.jobs).toHaveLength(0);
  });

  // d) HTTP 404 (board inexistente)
  it("rejects with GreenhouseHttpError including the status on 404", async () => {
    const fetchFn = vi.fn(async () => mockResponse({}, { ok: false, status: 404 }));

    let error: unknown;
    try {
      await fetchGreenhouseBoardJobs(BOARD, { fetchFn, baseUrl: BASE_URL });
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(GreenhouseHttpError);
    expect((error as GreenhouseHttpError).status).toBe(404);
  });

  // e) HTTP 429 (rate limit)
  it("rejects with GreenhouseHttpError on 429 rate limit", async () => {
    const fetchFn = vi.fn(async () => mockResponse({}, { ok: false, status: 429 }));

    let error: unknown;
    try {
      await fetchGreenhouseBoardJobs(BOARD, { fetchFn, baseUrl: BASE_URL });
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(GreenhouseHttpError);
    expect((error as GreenhouseHttpError).status).toBe(429);
  });

  // f) Timeout / AbortError
  it("rejects with GreenhouseTimeoutError when the request is aborted", async () => {
    const fetchFn = vi.fn(async () => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      throw abortError;
    });

    await expect(
      fetchGreenhouseBoardJobs(BOARD, { fetchFn, baseUrl: BASE_URL, timeoutMs: 10 })
    ).rejects.toBeInstanceOf(GreenhouseTimeoutError);
  });

  // g) Payload inválido
  it("rejects with GreenhouseResponseError when the payload does not match the schema", async () => {
    const fetchFn = vi.fn(async () => mockResponse({ jobs: "bad" }));

    await expect(
      fetchGreenhouseBoardJobs(BOARD, { fetchFn, baseUrl: BASE_URL })
    ).rejects.toBeInstanceOf(GreenhouseResponseError);
  });

  // h) Base URL pública por defecto
  it("uses the default public base URL when none is provided", async () => {
    const fetchFn = vi.fn(async (_url: string, _init: RequestInit) => mockResponse(VALID_RESPONSE));

    await fetchGreenhouseBoardJobs(BOARD, { fetchFn });

    const [url] = fetchFn.mock.calls[0]!;
    expect(url).toBe(`https://boards-api.greenhouse.io/v1/boards/${BOARD}/jobs?content=true`);
  });

  // i) Base URL con barra final, sin doble slash
  it("normalizes a base URL with a trailing slash without a double slash", async () => {
    const fetchFn = vi.fn(async (_url: string, _init: RequestInit) => mockResponse(VALID_RESPONSE));

    await fetchGreenhouseBoardJobs(BOARD, {
      fetchFn,
      baseUrl: "https://boards.example.test/v1/boards/"
    });

    const [url] = fetchFn.mock.calls[0]!;
    expect(url).toBe(`https://boards.example.test/v1/boards/${BOARD}/jobs?content=true`);
  });
});