import { describe, expect, it } from "vitest";

import { normalizeGreenhouseJob, GreenhouseNormalizationError } from "./greenhouse.normalizer.js";
import type { GreenhouseJobPayload } from "./greenhouse.types.js";

/**
 * Tests del normalizer de Greenhouse (función pura, sin red/Prisma/env).
 * `company` se inyecta (el payload de Greenhouse no la trae).
 */

const INGESTED_AT = new Date("2026-07-03T10:00:00Z");
const COMPANY = "Acme Inc.";

const rawJob = (overrides: Partial<GreenhouseJobPayload> = {}): GreenhouseJobPayload => ({
  id: "4001001",
  title: "Senior Backend Engineer",
  updated_at: "2026-06-20T09:30:00-04:00",
  absolute_url: "https://boards.greenhouse.io/example/jobs/4001001",
  location: { name: "Remote - Spain" },
  content: "&lt;p&gt;We build APIs. 100% remote.&lt;/p&gt;",
  departments: [{ name: "Engineering" }],
  offices: [{ name: "Remote" }],
  ...overrides
});

describe("normalizeGreenhouseJob", () => {
  it("maps a valid job and injects the curated company", () => {
    const dto = normalizeGreenhouseJob(rawJob(), { company: COMPANY, ingestedAt: INGESTED_AT });

    expect(dto.source).toBe("GREENHOUSE");
    expect(dto.externalId).toBe("4001001");
    expect(dto.sourceUrl).toBe("https://boards.greenhouse.io/example/jobs/4001001");
    expect(dto.title).toBe("Senior Backend Engineer");
    expect(dto.company).toBe(COMPANY);
    expect(dto.location).toBe("Remote - Spain");
    expect(dto.salaryMin).toBeNull();
    expect(dto.salaryMax).toBeNull();
    expect(dto.contractType).toBe("unspecified");
    expect(dto.tags).toEqual(expect.arrayContaining(["Engineering", "Remote"]));
  });

  it("decodes HTML entities and strips tags from content", () => {
    const dto = normalizeGreenhouseJob(
      rawJob({
        content: "&lt;div&gt;&lt;strong&gt;Node.js&lt;/strong&gt; &amp; PostgreSQL&lt;/div&gt;"
      }),
      { company: COMPANY, ingestedAt: INGESTED_AT }
    );

    expect(dto.description).toBe("Node.js & PostgreSQL");
    expect(dto.description).not.toContain("<");
    expect(dto.description).not.toContain("&lt;");
    expect(dto.description).not.toContain("strong");
  });

  it("infers REMOTE from location/description hints", () => {
    const dto = normalizeGreenhouseJob(rawJob(), { company: COMPANY, ingestedAt: INGESTED_AT });
    expect(dto.remoteType).toBe("REMOTE");
  });

  it("defaults remoteType to UNSPECIFIED without hints", () => {
    const dto = normalizeGreenhouseJob(
      rawJob({ location: { name: "Berlin" }, content: "&lt;p&gt;Great team&lt;/p&gt;" }),
      { company: COMPANY, ingestedAt: INGESTED_AT }
    );
    expect(dto.remoteType).toBe("UNSPECIFIED");
  });

  it("returns null location when missing", () => {
    const dto = normalizeGreenhouseJob(rawJob({ location: null }), {
      company: COMPANY,
      ingestedAt: INGESTED_AT
    });
    expect(dto.location).toBeNull();
  });

  it("falls back to ingestedAt on an invalid updated_at", () => {
    const dto = normalizeGreenhouseJob(rawJob({ updated_at: "not-a-date" }), {
      company: COMPANY,
      ingestedAt: INGESTED_AT
    });
    expect(dto.postedAt.getTime()).toBe(INGESTED_AT.getTime());
  });

  it("throws when id is missing", () => {
    expect(() =>
      normalizeGreenhouseJob(rawJob({ id: "" }), { company: COMPANY, ingestedAt: INGESTED_AT })
    ).toThrow(GreenhouseNormalizationError);
  });

  it("throws when title is missing", () => {
    expect(() =>
      normalizeGreenhouseJob(rawJob({ title: "  " }), { company: COMPANY, ingestedAt: INGESTED_AT })
    ).toThrow(GreenhouseNormalizationError);
  });

  it("throws when absolute_url is empty or not http(s)", () => {
    expect(() =>
      normalizeGreenhouseJob(rawJob({ absolute_url: "" }), {
        company: COMPANY,
        ingestedAt: INGESTED_AT
      })
    ).toThrow(GreenhouseNormalizationError);
    expect(() =>
      normalizeGreenhouseJob(rawJob({ absolute_url: "/relative/path" }), {
        company: COMPANY,
        ingestedAt: INGESTED_AT
      })
    ).toThrow(GreenhouseNormalizationError);
  });

  it("throws when the curated company is empty", () => {
    expect(() =>
      normalizeGreenhouseJob(rawJob(), { company: "  ", ingestedAt: INGESTED_AT })
    ).toThrow(GreenhouseNormalizationError);
  });

  it("deduplicates tags from departments and offices", () => {
    const dto = normalizeGreenhouseJob(
      rawJob({
        departments: [{ name: "Engineering" }, { name: "Engineering" }],
        offices: [{ name: "Remote" }]
      }),
      { company: COMPANY, ingestedAt: INGESTED_AT }
    );
    expect(dto.tags).toEqual(["Engineering", "Remote"]);
  });
});
