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

describe("joobleSearchResponseSchema — contrato real Jooble (id numérico)", () => {
  // Contrato real observado en Fase 5C.1 (structure-only): Jooble devuelve `id`
  // como number. El payload validado debe entregar `id` como string al normalizador.
  // Datos SINTÉTICOS (no reales de Jooble).
  const numericIdJob = {
    id: 123456,
    title: "Backend Developer",
    company: "Example Company",
    location: "Madrid",
    snippet: "Example snippet",
    salary: "",
    type: "",
    link: "https://example.com/job/123456",
    updated: "2026-06-26T00:00:00Z",
    source: "Example Source"
  };

  const responseWith = (job: unknown): unknown => ({ totalCount: 1, jobs: [job] });

  it("accepts a job whose id is a number and exposes it as a string", () => {
    const result = joobleSearchResponseSchema.safeParse(responseWith(numericIdJob));

    expect(result.success).toBe(true);
    if (result.success) {
      const first = result.data.jobs[0];
      expect(first?.id).toBe("123456");
      expect(typeof first?.id).toBe("string");
    }
  });

  it("still accepts a job whose id is a string", () => {
    const result = joobleSearchResponseSchema.safeParse(responseWith({ ...numericIdJob, id: "789" }));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.jobs[0]?.id).toBe("789");
    }
  });

  it("rejects a job whose id is null", () => {
    const result = joobleSearchResponseSchema.safeParse(responseWith({ ...numericIdJob, id: null }));

    expect(result.success).toBe(false);
  });

  it("rejects a job with a missing id", () => {
    const { id, ...withoutId } = numericIdJob;
    void id;
    const result = joobleSearchResponseSchema.safeParse(responseWith(withoutId));

    expect(result.success).toBe(false);
  });
});
