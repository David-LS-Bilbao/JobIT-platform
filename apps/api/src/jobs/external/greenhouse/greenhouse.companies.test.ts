import { describe, expect, it } from "vitest";

import { GREENHOUSE_COMPANIES, selectGreenhouseCompanies } from "./greenhouse.companies.js";
import type { GreenhouseCompany } from "./greenhouse.companies.js";

const curatedFixture: GreenhouseCompany[] = [
  { boardToken: "anthropic", company: "Anthropic" },
  { boardToken: "vercel", company: "Vercel" },
  { boardToken: "webflow", company: "Webflow" }
];

describe("GREENHOUSE_COMPANIES", () => {
  it("keeps a small reviewed list sorted alphabetically by company", () => {
    expect(GREENHOUSE_COMPANIES.length).toBeGreaterThanOrEqual(3);
    expect(GREENHOUSE_COMPANIES.length).toBeLessThanOrEqual(5);

    const companies = GREENHOUSE_COMPANIES.map((entry) => entry.company);
    expect(companies).toEqual([...companies].sort((a, b) => a.localeCompare(b)));
  });

  it("uses unique non-placeholder board tokens", () => {
    const tokens = GREENHOUSE_COMPANIES.map((entry) => entry.boardToken);

    expect(new Set(tokens).size).toBe(tokens.length);
    expect(tokens).not.toContain("example");
    expect(tokens).not.toContain("acme");
    expect(tokens).not.toContain("globex");
    expect(tokens.every((token) => token.trim() === token && token.length > 0)).toBe(true);
  });
});

describe("selectGreenhouseCompanies", () => {
  it("returns the full list when no CSV is provided", () => {
    expect(selectGreenhouseCompanies(curatedFixture, undefined)).toEqual(curatedFixture);
    expect(selectGreenhouseCompanies(curatedFixture, "   ")).toEqual(curatedFixture);
  });

  it("returns a subset for valid tokens", () => {
    expect(selectGreenhouseCompanies(curatedFixture, "vercel,webflow")).toEqual([
      { boardToken: "vercel", company: "Vercel" },
      { boardToken: "webflow", company: "Webflow" }
    ]);
  });

  it("trims spaces around CSV tokens", () => {
    expect(selectGreenhouseCompanies(curatedFixture, "  webflow ,  anthropic  ")).toEqual([
      { boardToken: "anthropic", company: "Anthropic" },
      { boardToken: "webflow", company: "Webflow" }
    ]);
  });

  it("returns an empty list when CSV tokens do not match", () => {
    expect(selectGreenhouseCompanies(curatedFixture, "missing,unknown")).toEqual([]);
  });

  it("returns an empty list when the curated list is empty", () => {
    expect(selectGreenhouseCompanies([], undefined)).toEqual([]);
    expect(selectGreenhouseCompanies([], "anthropic")).toEqual([]);
  });
});
