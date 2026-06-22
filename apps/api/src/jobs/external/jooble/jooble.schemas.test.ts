import { describe, expect, it } from "vitest";

import { joobleJobSchema, joobleSearchResponseSchema } from "./jooble.schemas.js";

const validJob = {
  id: "-1234567890",
  title: "Backend Engineer",
  company: "Datapeak",
  location: "Madrid",
  snippet: "APIs en Node.js con PostgreSQL.",
  salary: "30000-40000",
  type: "Full-time",
  link: "https://jooble.org/jdp/123",
  updated: "2026-06-20T10:00:00",
  source: "infojobs"
};

describe("joobleJobSchema", () => {
  it("accepts a well-formed Jooble job", () => {
    expect(joobleJobSchema.safeParse(validJob).success).toBe(true);
  });

  it("rejects a job missing a required field (id)", () => {
    const withoutId: Partial<typeof validJob> = { ...validJob };
    delete withoutId.id;

    expect(joobleJobSchema.safeParse(withoutId).success).toBe(false);
  });
});

describe("joobleSearchResponseSchema", () => {
  it("accepts a response with one job", () => {
    const payload = { totalCount: 1, jobs: [validJob] };

    expect(joobleSearchResponseSchema.safeParse(payload).success).toBe(true);
  });

  it("accepts a response with an empty jobs array", () => {
    const payload = { totalCount: 0, jobs: [] };

    expect(joobleSearchResponseSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects a response without jobs", () => {
    const payload = { totalCount: 0 };

    expect(joobleSearchResponseSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects a response where jobs is not an array", () => {
    const payload = { totalCount: 1, jobs: "nope" };

    expect(joobleSearchResponseSchema.safeParse(payload).success).toBe(false);
  });
});
