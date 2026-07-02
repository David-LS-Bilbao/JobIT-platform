import { describe, expect, it } from "vitest";

import { baseSlugFromName, isReservedSlug, isValidSlug, slugify } from "./portfolio.slug.js";

describe("portfolio slug helpers", () => {
  describe("slugify", () => {
    it("lowercases, trims, strips accents and converts spaces to hyphens", () => {
      expect(slugify("  David López Sotelo ")).toBe("david-lopez-sotelo");
    });
    it("collapses repeated hyphens and strips edge hyphens", () => {
      expect(slugify("--a  b--c--")).toBe("a-b-c");
    });
    it("removes non-alphanumeric characters", () => {
      expect(slugify("Ana!!! @Pérez")).toBe("ana-perez");
    });
  });

  describe("isValidSlug", () => {
    it("accepts a canonical slug", () => {
      expect(isValidSlug("david-lopez")).toBe(true);
    });
    it("rejects a slug shorter than the minimum", () => {
      expect(isValidSlug("ab")).toBe(false);
    });
    it("rejects reserved words", () => {
      expect(isValidSlug("admin")).toBe(false);
      expect(isValidSlug("api")).toBe(false);
      expect(isValidSlug("dashboard")).toBe(false);
    });
    it("rejects non-canonical formats", () => {
      expect(isValidSlug("David")).toBe(false);
      expect(isValidSlug("-x-")).toBe(false);
      expect(isValidSlug("a--b")).toBe(false);
    });
  });

  it("isReservedSlug flags reserved words only", () => {
    expect(isReservedSlug("portfolio")).toBe(true);
    expect(isReservedSlug("ana-perez")).toBe(false);
  });

  describe("baseSlugFromName", () => {
    it("derives a slug from first and last name", () => {
      expect(baseSlugFromName("Ana", "Pérez", "uid-123")).toBe("ana-perez");
    });
    it("falls back to a stable userId fragment when there is no usable name", () => {
      expect(baseSlugFromName(null, null, "abcdef1234567890")).toBe("user-abcdef12");
    });
    it("avoids a reserved base derived from the name", () => {
      expect(baseSlugFromName("admin", null, "xy")).toBe("user-xy");
    });
  });
});
