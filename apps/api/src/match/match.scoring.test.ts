import { describe, expect, it } from "vitest";

import { calculateJobMatch, getMatchLevel } from "./match.scoring.js";

/**
 * Tests RED del scoring puro de Match (Sprint 05).
 *
 * Fijan el contrato de la lógica determinista y explicable ANTES de implementarla:
 * `getMatchLevel(score)` y `calculateJobMatch(input)` (sin DB, sin red, sin Prisma).
 * Mientras `./match.scoring` no exista, la suite falla por módulo/exports inexistentes.
 *
 * Pesos: skills 50, modalidad 20, seniority 20, ubicación 10 (suman 100).
 * Niveles: VERY_LOW 0-25, LOW 26-50, GOOD 51-75, VERY_GOOD 76-100.
 * Factores sin datos → match: null y contribuyen 0 (sin renormalizar).
 *
 * Los escenarios usan fracciones de skills exactas para evitar redondeos frágiles.
 */

type FactorName = "skills" | "remote" | "seniority" | "location";

interface Factor {
  name: FactorName;
  match: boolean | null;
  detail: string;
}

interface MatchResult {
  score: number;
  level: "VERY_LOW" | "LOW" | "GOOD" | "VERY_GOOD";
  matchedSkills: string[];
  missingSkills: string[];
  factors: Factor[];
  explanation: string;
}

function factor(result: MatchResult, name: FactorName): Factor {
  const found = result.factors.find((f) => f.name === name);
  if (!found) {
    throw new Error(`factor ${name} not found`);
  }
  return found;
}

describe("getMatchLevel", () => {
  it("maps boundary scores to the correct level", () => {
    expect(getMatchLevel(0)).toBe("VERY_LOW");
    expect(getMatchLevel(25)).toBe("VERY_LOW");
    expect(getMatchLevel(26)).toBe("LOW");
    expect(getMatchLevel(50)).toBe("LOW");
    expect(getMatchLevel(51)).toBe("GOOD");
    expect(getMatchLevel(75)).toBe("GOOD");
    expect(getMatchLevel(76)).toBe("VERY_GOOD");
    expect(getMatchLevel(100)).toBe("VERY_GOOD");
  });
});

describe("calculateJobMatch — determinism", () => {
  const input = {
    candidate: {
      skills: ["typescript", "node.js"],
      preferences: {
        remotePreference: "HYBRID" as const,
        seniority: "MID" as const,
        preferredLocations: ["Bilbao"]
      }
    },
    job: {
      tags: ["typescript", "node.js"],
      remoteType: "HYBRID" as const,
      seniority: "MID" as const,
      location: "Bilbao"
    }
  };

  it("returns the same result for the same input", () => {
    expect(calculateJobMatch(input)).toEqual(calculateJobMatch(input));
  });

  it("returns an integer score and a perfect match at 100", () => {
    const result = calculateJobMatch(input);
    expect(Number.isInteger(result.score)).toBe(true);
    expect(result.score).toBe(100);
    expect(result.level).toBe("VERY_GOOD");
    expect(factor(result, "skills").match).toBe(true);
    expect(factor(result, "remote").match).toBe(true);
    expect(factor(result, "seniority").match).toBe(true);
    expect(factor(result, "location").match).toBe(true);
  });
});

describe("calculateJobMatch — skills (weight 50)", () => {
  it("scores full skills when all job tags are covered", () => {
    const result = calculateJobMatch({
      candidate: { skills: ["typescript", "node.js"], preferences: null },
      job: { tags: ["typescript", "node.js"], remoteType: "UNSPECIFIED", seniority: null, location: null }
    });
    // skills 50 + (resto null → 0), sin renormalizar.
    expect(result.score).toBe(50);
    expect(factor(result, "skills").match).toBe(true);
    expect(result.matchedSkills).toEqual(["node.js", "typescript"]);
    expect(result.missingSkills).toEqual([]);
  });

  it("scores partial skills with a clean fraction (2 of 4 → 25)", () => {
    const result = calculateJobMatch({
      candidate: { skills: ["typescript", "node.js"], preferences: null },
      job: { tags: ["typescript", "node.js", "aws", "docker"], remoteType: "UNSPECIFIED", seniority: null, location: null }
    });
    expect(result.score).toBe(25);
    expect(result.matchedSkills).toEqual(["node.js", "typescript"]);
    expect(result.missingSkills).toEqual(["aws", "docker"]);
  });

  it("matches skills case-insensitively", () => {
    const result = calculateJobMatch({
      candidate: { skills: ["TypeScript"], preferences: null },
      job: { tags: ["typescript"], remoteType: "UNSPECIFIED", seniority: null, location: null }
    });
    expect(factor(result, "skills").match).toBe(true);
    expect(result.matchedSkills).toEqual(["typescript"]);
  });

  it("returns matchedSkills and missingSkills sorted alphabetically", () => {
    const result = calculateJobMatch({
      candidate: { skills: ["node.js", "typescript"], preferences: null },
      job: { tags: ["typescript", "node.js", "rust", "aws"], remoteType: "UNSPECIFIED", seniority: null, location: null }
    });
    expect(result.matchedSkills).toEqual(["node.js", "typescript"]);
    expect(result.missingSkills).toEqual(["aws", "rust"]);
  });

  it("marks skills factor null when the candidate has no skills", () => {
    const result = calculateJobMatch({
      candidate: { skills: [], preferences: null },
      job: { tags: ["typescript"], remoteType: "UNSPECIFIED", seniority: null, location: null }
    });
    expect(factor(result, "skills").match).toBeNull();
  });

  it("marks skills factor null when the job has no tags", () => {
    const result = calculateJobMatch({
      candidate: { skills: ["typescript"], preferences: null },
      job: { tags: [], remoteType: "UNSPECIFIED", seniority: null, location: null }
    });
    expect(factor(result, "skills").match).toBeNull();
  });
});

describe("calculateJobMatch — modality (weight 20)", () => {
  const base = (remotePreference: "REMOTE" | "HYBRID" | "ON_SITE" | "ANY", remoteType: "REMOTE" | "HYBRID" | "ON_SITE" | "UNSPECIFIED") => ({
    candidate: { skills: [], preferences: { remotePreference } },
    job: { tags: [], remoteType, seniority: null, location: null }
  });

  it("awards full modality weight when preference is ANY", () => {
    const result = calculateJobMatch(base("ANY", "ON_SITE"));
    expect(result.score).toBe(20);
    expect(factor(result, "remote").match).toBe(true);
  });

  it("awards full modality weight on exact match", () => {
    const result = calculateJobMatch(base("REMOTE", "REMOTE"));
    expect(result.score).toBe(20);
    expect(factor(result, "remote").match).toBe(true);
  });

  it("awards 0 and match false on mismatch", () => {
    const result = calculateJobMatch(base("REMOTE", "ON_SITE"));
    expect(result.score).toBe(0);
    expect(factor(result, "remote").match).toBe(false);
  });

  it("marks modality null when job remoteType is UNSPECIFIED", () => {
    const result = calculateJobMatch(base("REMOTE", "UNSPECIFIED"));
    expect(factor(result, "remote").match).toBeNull();
  });

  it("marks modality null when the preference is absent", () => {
    const result = calculateJobMatch({
      candidate: { skills: [], preferences: {} },
      job: { tags: [], remoteType: "REMOTE", seniority: null, location: null }
    });
    expect(factor(result, "remote").match).toBeNull();
  });
});

describe("calculateJobMatch — seniority (weight 20)", () => {
  it("awards full seniority weight on exact match", () => {
    const result = calculateJobMatch({
      candidate: { skills: [], preferences: { seniority: "MID" } },
      job: { tags: [], remoteType: "UNSPECIFIED", seniority: "MID", location: null }
    });
    expect(result.score).toBe(20);
    expect(factor(result, "seniority").match).toBe(true);
  });

  it("awards 0 and match false on mismatch", () => {
    const result = calculateJobMatch({
      candidate: { skills: [], preferences: { seniority: "MID" } },
      job: { tags: [], remoteType: "UNSPECIFIED", seniority: "SENIOR", location: null }
    });
    expect(result.score).toBe(0);
    expect(factor(result, "seniority").match).toBe(false);
  });

  it("awards full seniority weight when the job seniority is ANY", () => {
    const result = calculateJobMatch({
      candidate: { skills: [], preferences: { seniority: "MID" } },
      job: { tags: [], remoteType: "UNSPECIFIED", seniority: "ANY", location: null }
    });
    expect(result.score).toBe(20);
    expect(factor(result, "seniority").match).toBe(true);
  });

  it("marks seniority null when the preference is absent", () => {
    const result = calculateJobMatch({
      candidate: { skills: [], preferences: {} },
      job: { tags: [], remoteType: "UNSPECIFIED", seniority: "MID", location: null }
    });
    expect(factor(result, "seniority").match).toBeNull();
  });
});

describe("calculateJobMatch — location (weight 10)", () => {
  it("marks location not-applicable (null) for REMOTE jobs", () => {
    const result = calculateJobMatch({
      candidate: { skills: [], preferences: { preferredLocations: ["Bilbao"] } },
      job: { tags: [], remoteType: "REMOTE", seniority: null, location: "Bilbao" }
    });
    const loc = factor(result, "location");
    expect(loc.match).toBeNull();
    expect(loc.detail).toMatch(/aplica/i);
  });

  it("awards full location weight on case-insensitive match", () => {
    const result = calculateJobMatch({
      candidate: { skills: [], preferences: { preferredLocations: ["Bilbao"] } },
      job: { tags: [], remoteType: "ON_SITE", seniority: null, location: "bilbao" }
    });
    expect(result.score).toBe(10);
    expect(factor(result, "location").match).toBe(true);
  });

  it("awards 0 and match false on location mismatch", () => {
    const result = calculateJobMatch({
      candidate: { skills: [], preferences: { preferredLocations: ["Madrid"] } },
      job: { tags: [], remoteType: "ON_SITE", seniority: null, location: "Bilbao" }
    });
    expect(result.score).toBe(0);
    expect(factor(result, "location").match).toBe(false);
  });

  it("marks location null when location data is absent", () => {
    const result = calculateJobMatch({
      candidate: { skills: [], preferences: {} },
      job: { tags: [], remoteType: "ON_SITE", seniority: null, location: null }
    });
    expect(factor(result, "location").match).toBeNull();
  });
});

describe("calculateJobMatch — incomplete profile", () => {
  it("does not throw, returns a low score and flags completing the profile", () => {
    const result = calculateJobMatch({
      candidate: { skills: [], preferences: null },
      job: { tags: ["typescript"], remoteType: "REMOTE", seniority: "MID", location: "Bilbao" }
    });
    expect(result.score).toBe(0);
    expect(result.level).toBe("VERY_LOW");
    expect(factor(result, "skills").match).toBeNull();
    expect(factor(result, "remote").match).toBeNull();
    expect(factor(result, "seniority").match).toBeNull();
    expect(result.explanation).toMatch(/perfil/i);
  });
});

describe("calculateJobMatch — bounds and no renormalization", () => {
  it("clamps the minimum score to 0 when nothing applies", () => {
    const result = calculateJobMatch({
      candidate: { skills: [], preferences: null },
      job: { tags: [], remoteType: "UNSPECIFIED", seniority: null, location: null }
    });
    expect(result.score).toBe(0);
    expect(result.level).toBe("VERY_LOW");
  });

  it("does not renormalize: full skills with all other factors null stays at 50", () => {
    const result = calculateJobMatch({
      candidate: { skills: ["typescript", "node.js"], preferences: null },
      job: { tags: ["typescript", "node.js"], remoteType: "UNSPECIFIED", seniority: null, location: null }
    });
    expect(result.score).toBe(50);
    expect(result.level).toBe("LOW");
  });

  it("reaches the maximum score of 100 when every factor matches", () => {
    const result = calculateJobMatch({
      candidate: {
        skills: ["typescript", "node.js"],
        preferences: { remotePreference: "HYBRID", seniority: "MID", preferredLocations: ["Bilbao"] }
      },
      job: { tags: ["typescript", "node.js"], remoteType: "HYBRID", seniority: "MID", location: "Bilbao" }
    });
    expect(result.score).toBe(100);
    expect(result.level).toBe("VERY_GOOD");
  });
});
