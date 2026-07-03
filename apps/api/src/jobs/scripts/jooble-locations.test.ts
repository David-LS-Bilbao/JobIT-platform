import { describe, expect, it, vi } from "vitest";

import type { JoobleIngestSummary } from "../external/jooble/jooble.ingest.service.js";
import {
  DEFAULT_ING_KEYWORDS,
  DEFAULT_ING_LIMIT,
  DEFAULT_ING_LOCATION,
  orchestrateIngestion,
  parseLocations,
  resolveKeywords,
  resolveLimit,
  type IngestOneParams
} from "./jooble-locations.js";

const summary = (over: Partial<JoobleIngestSummary> = {}): JoobleIngestSummary => ({
  fetched: 1,
  normalized: 1,
  skipped: 0,
  created: 1,
  updated: 0,
  ...over
});

describe("parseLocations", () => {
  it("parsea CSV con trim y descarta vacías", () => {
    expect(parseLocations({ ING_LOCATIONS: "Bilbao,Madrid, Barcelona" })).toEqual([
      "Bilbao",
      "Madrid",
      "Barcelona"
    ]);
    expect(parseLocations({ ING_LOCATIONS: "Bilbao,, ,Madrid" })).toEqual(["Bilbao", "Madrid"]);
  });

  it("deduplica conservando el orden (insensible a mayúsculas)", () => {
    expect(parseLocations({ ING_LOCATIONS: "Madrid,madrid,MADRID,Bilbao" })).toEqual(["Madrid", "Bilbao"]);
  });

  it("cae a ING_LOCATION si ING_LOCATIONS está vacía o ausente", () => {
    expect(parseLocations({ ING_LOCATION: "Bilbao" })).toEqual(["Bilbao"]);
    expect(parseLocations({ ING_LOCATIONS: "   ", ING_LOCATION: "Madrid" })).toEqual(["Madrid"]);
  });

  it("usa el default cuando no hay ninguna ubicación", () => {
    expect(parseLocations({})).toEqual([DEFAULT_ING_LOCATION]);
    expect(parseLocations({ ING_LOCATIONS: ", ,", ING_LOCATION: "  " })).toEqual([DEFAULT_ING_LOCATION]);
  });
});

describe("resolveKeywords", () => {
  it("usa el default cuando falta o está vacío", () => {
    expect(resolveKeywords({})).toBe(DEFAULT_ING_KEYWORDS);
    expect(resolveKeywords({ ING_KEYWORDS: "   " })).toBe(DEFAULT_ING_KEYWORDS);
  });

  it("usa el valor dado", () => {
    expect(resolveKeywords({ ING_KEYWORDS: "react" })).toBe("react");
  });
});

describe("resolveLimit", () => {
  it("default cuando falta o es inválido", () => {
    expect(resolveLimit({})).toBe(DEFAULT_ING_LIMIT);
    expect(resolveLimit({ ING_LIMIT: "0" })).toBe(DEFAULT_ING_LIMIT);
    expect(resolveLimit({ ING_LIMIT: "-5" })).toBe(DEFAULT_ING_LIMIT);
    expect(resolveLimit({ ING_LIMIT: "abc" })).toBe(DEFAULT_ING_LIMIT);
  });

  it("acota a 50 y respeta valores válidos", () => {
    expect(resolveLimit({ ING_LIMIT: "5" })).toBe(5);
    expect(resolveLimit({ ING_LIMIT: "999" })).toBe(50);
  });
});

describe("orchestrateIngestion", () => {
  it("llama al ingestor una vez por ubicación, en serie, y acumula totales", async () => {
    const order: string[] = [];
    const ingestOne = vi.fn(async ({ location }: IngestOneParams) => {
      order.push(location);
      return summary({ fetched: 2, normalized: 2, created: 1, updated: 1, skipped: 0 });
    });

    const report = await orchestrateIngestion(
      ["Bilbao", "Madrid"],
      { keywords: "developer", resultOnPage: 20 },
      ingestOne
    );

    expect(ingestOne).toHaveBeenCalledTimes(2);
    expect(order).toEqual(["Bilbao", "Madrid"]);
    expect(report.totalLocations).toBe(2);
    expect(report.succeeded).toBe(2);
    expect(report.failed).toBe(0);
    expect(report.fetched).toBe(4);
    expect(report.created).toBe(2);
    expect(report.updated).toBe(2);
  });

  it("continúa si una ubicación falla y registra el error (fallo parcial)", async () => {
    const ingestOne = vi.fn(async ({ location }: IngestOneParams) => {
      if (location === "Madrid") {
        throw new Error("Jooble request failed with status 403");
      }
      return summary();
    });

    const report = await orchestrateIngestion(
      ["Bilbao", "Madrid", "Barcelona"],
      { keywords: "developer", resultOnPage: 20 },
      ingestOne
    );

    expect(ingestOne).toHaveBeenCalledTimes(3);
    expect(report.succeeded).toBe(2);
    expect(report.failed).toBe(1);
    const failed = report.results.find((r) => r.location === "Madrid");
    expect(failed?.ok).toBe(false);
    expect(failed?.error).toContain("403");
    // Las ubicaciones OK siguen sumando.
    expect(report.fetched).toBe(2);
  });

  it("pasa keywords/location/resultOnPage al ingestor", async () => {
    const ingestOne = vi.fn(async (_params: IngestOneParams) => summary());

    await orchestrateIngestion(["Bilbao"], { keywords: "node", resultOnPage: 10 }, ingestOne);

    expect(ingestOne).toHaveBeenCalledWith({ keywords: "node", location: "Bilbao", resultOnPage: 10 });
  });
});
