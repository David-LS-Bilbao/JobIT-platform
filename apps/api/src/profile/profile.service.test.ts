import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";
import {
  calculateCompletionPercentage,
  getOrCreateCandidateProfile
} from "./profile.service.js";

async function createUser(email: string): Promise<string> {
  const user = await prisma.user.create({
    data: { email, passwordHash: "x" }
  });
  return user.id;
}

describe("profile.service — getOrCreateCandidateProfile", () => {
  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("creates an empty CandidateProfile for an existing user when none exists", async () => {
    const userId = await createUser("lazy@example.com");

    const profile = await getOrCreateCandidateProfile(userId);

    expect(profile.id).toBeDefined();
    expect(profile.userId).toBe(userId);
    expect(profile.firstName).toBeNull();
    expect(profile.lastName).toBeNull();

    const count = await prisma.candidateProfile.count({ where: { userId } });
    expect(count).toBe(1);
  });

  it("returns the same CandidateProfile on repeated calls for the same userId", async () => {
    const userId = await createUser("idempotent@example.com");

    const first = await getOrCreateCandidateProfile(userId);
    const second = await getOrCreateCandidateProfile(userId);

    expect(second.id).toBe(first.id);
  });

  it("does not create duplicate profiles for the same userId", async () => {
    const userId = await createUser("noduplicate@example.com");

    await getOrCreateCandidateProfile(userId);
    await getOrCreateCandidateProfile(userId);

    const count = await prisma.candidateProfile.count({ where: { userId } });
    expect(count).toBe(1);
  });

  it("creates separate profiles for different users", async () => {
    const userA = await createUser("user-a@example.com");
    const userB = await createUser("user-b@example.com");

    const profileA = await getOrCreateCandidateProfile(userA);
    const profileB = await getOrCreateCandidateProfile(userB);

    expect(profileA.id).not.toBe(profileB.id);
    expect(profileA.userId).toBe(userA);
    expect(profileB.userId).toBe(userB);
  });
});

describe("profile.service — calculateCompletionPercentage", () => {
  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("returns 0 for an empty profile", async () => {
    const userId = await createUser("empty@example.com");
    await getOrCreateCandidateProfile(userId);

    const profile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: {
        skills: true,
        experiences: true,
        education: true,
        projects: true,
        links: true,
        preferences: true
      }
    });

    expect(calculateCompletionPercentage(profile)).toBe(0);
  });

  it("returns 14 when only basicInfo (firstName + lastName) is filled", async () => {
    const userId = await createUser("basic@example.com");
    await getOrCreateCandidateProfile(userId);
    await prisma.candidateProfile.update({
      where: { userId },
      data: { firstName: "Ada", lastName: "Lovelace" }
    });

    const profile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: {
        skills: true,
        experiences: true,
        education: true,
        projects: true,
        links: true,
        preferences: true
      }
    });

    // Math.round((1 / 7) * 100) = 14
    expect(calculateCompletionPercentage(profile)).toBe(14);
  });

  // TODO (fase 5.4): cuando getOrCreateCandidateProfile devuelva skills,
  // añadir un test que verifique que normalizedName no se expone en el
  // resultado serializado del servicio/endpoint. No aplica al servicio base.
});
