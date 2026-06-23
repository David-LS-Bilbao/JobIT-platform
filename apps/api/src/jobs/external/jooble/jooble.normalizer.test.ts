import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { joobleSearchResponseSchema } from "./jooble.schemas.js";
import type { JoobleJobPayload } from "./jooble.types.js";
// Importa una función todavía inexistente: este test debe fallar en RED
// hasta que se implemente `jooble.normalizer.ts` en la fase GREEN.
import { normalizeJoobleJob } from "./jooble.normalizer.js";

const readFixture = (name: string): unknown =>
  JSON.parse(readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8"));

const validResponse = joobleSearchResponseSchema.parse(readFixture("jooble.valid.json"));
const partialResponse = joobleSearchResponseSchema.parse(readFixture("jooble.partial.json"));

const [remoteJob, hybridJob] = validResponse.jobs; // Remote + Hybrid
const [partialJob] = partialResponse.jobs; // strings vacíos en location/salary/type/source

if (!remoteJob || !hybridJob || !partialJob) {
  throw new Error("Fixtures de Jooble incompletos para los tests del normalizador");
}

// Fecha de ingesta controlada para tests deterministas (clock inyectable).
const INGESTED_AT = new Date("2026-06-22T00:00:00.000Z");

describe("normalizeJoobleJob", () => {
  it("maps a valid Jooble job into a NormalizedExternalJob", () => {
    const dto = normalizeJoobleJob(remoteJob, { ingestedAt: INGESTED_AT });

    expect(dto.externalId).toBe(remoteJob.id); // id -> externalId
    expect(dto.sourceUrl).toBe(remoteJob.link); // link -> sourceUrl
    expect(dto.source).toBe("JOOBLE"); // origen interno del DTO
    expect(dto.rawSource).toBe(remoteJob.source); // conserva el source original
    expect(dto.title).toBe(remoteJob.title);
    expect(dto.company).toBe(remoteJob.company);
  });

  it("uses the injected ingestedAt", () => {
    const dto = normalizeJoobleJob(remoteJob, { ingestedAt: INGESTED_AT });

    expect(dto.ingestedAt).toBe(INGESTED_AT);
  });

  it("uses `updated` as postedAt when it is a valid date", () => {
    const dto = normalizeJoobleJob(remoteJob, { ingestedAt: INGESTED_AT });

    expect(dto.postedAt).toBeInstanceOf(Date);
    expect(dto.postedAt.getTime()).toBe(new Date(remoteJob.updated).getTime());
  });

  it("parses a range salary string into salaryMin and salaryMax", () => {
    const dto = normalizeJoobleJob(remoteJob, { ingestedAt: INGESTED_AT });

    expect(dto.salaryMin).toBe(45000);
    expect(dto.salaryMax).toBe(60000);
  });

  it("infers REMOTE when there is remote evidence", () => {
    const dto = normalizeJoobleJob(remoteJob, { ingestedAt: INGESTED_AT });

    expect(dto.remoteType).toBe("REMOTE");
  });

  it("infers HYBRID when there is hybrid evidence", () => {
    const dto = normalizeJoobleJob(hybridJob, { ingestedAt: INGESTED_AT });

    expect(dto.remoteType).toBe("HYBRID");
  });

  describe("partial payload (safe defaults)", () => {
    it("maps an empty location to null", () => {
      const dto = normalizeJoobleJob(partialJob, { ingestedAt: INGESTED_AT });

      expect(dto.location).toBeNull();
    });

    it("maps an empty salary to null min/max", () => {
      const dto = normalizeJoobleJob(partialJob, { ingestedAt: INGESTED_AT });

      expect(dto.salaryMin).toBeNull();
      expect(dto.salaryMax).toBeNull();
    });

    it("maps an empty type to contractType 'unspecified'", () => {
      const dto = normalizeJoobleJob(partialJob, { ingestedAt: INGESTED_AT });

      expect(dto.contractType).toBe("unspecified");
    });

    it("defaults remoteType to UNSPECIFIED without clear evidence", () => {
      const dto = normalizeJoobleJob(partialJob, { ingestedAt: INGESTED_AT });

      expect(dto.remoteType).toBe("UNSPECIFIED");
    });
  });

  it("strips raw HTML from the description", () => {
    const htmlJob: JoobleJobPayload = {
      ...remoteJob,
      snippet: "<p>Backend con <strong>Node.js</strong> y PostgreSQL</p>"
    };

    const dto = normalizeJoobleJob(htmlJob, { ingestedAt: INGESTED_AT });

    expect(dto.description).not.toContain("<p>");
    expect(dto.description).not.toContain("<strong>");
    expect(dto.description).toContain("Node.js");
  });

  it("fails in a controlled way when id is empty", () => {
    const withoutId: JoobleJobPayload = { ...remoteJob, id: "" };

    expect(() => normalizeJoobleJob(withoutId, { ingestedAt: INGESTED_AT })).toThrow();
  });

  it("fails in a controlled way when link is not an absolute URL", () => {
    const relativeLink: JoobleJobPayload = { ...remoteJob, link: "/relative/path" };

    expect(() => normalizeJoobleJob(relativeLink, { ingestedAt: INGESTED_AT })).toThrow();
  });
});
