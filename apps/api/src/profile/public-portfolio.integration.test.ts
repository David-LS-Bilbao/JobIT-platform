import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";

const PASSWORD = "ValidPass123";
const PUB = (slug: string): string => `/api/public/portfolios/${slug}`;

async function registerUser(email: string): Promise<string> {
  const res = await request(app).post("/api/auth/register").send({ email, password: PASSWORD });
  return res.body.accessToken as string;
}

function authH(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

async function seedRichProfile(token: string): Promise<void> {
  await request(app).put("/api/profile/me").set(authH(token)).send({
    firstName: "Ana",
    lastName: "Pérez",
    headline: "Frontend Developer",
    summary: "Desarrolladora frontend centrada en React.",
    location: "Bilbao",
    locationRemote: true,
    availabilityStatus: "OPEN"
  });
  await request(app).post("/api/profile/me/skills").set(authH(token)).send({ name: "React" });
  await request(app)
    .post("/api/profile/me/experience")
    .set(authH(token))
    .send({ company: "ACME", role: "Frontend Dev", startDate: "2021-01-01T00:00:00.000Z", current: true });
  await request(app)
    .post("/api/profile/me/projects")
    .set(authH(token))
    .send({ name: "design-system", technologies: ["React"] });
  await request(app)
    .put("/api/profile/me/links")
    .set(authH(token))
    .send({ links: [{ type: "GITHUB", url: "https://github.com/ana" }] });
  await request(app).put("/api/profile/me/preferences").set(authH(token)).send({
    desiredRoles: ["Frontend"],
    preferredLocations: ["Bilbao"],
    remotePreference: "REMOTE",
    salaryMin: 35000,
    salaryMax: 50000,
    contractTypes: ["FULL_TIME"]
  });
}

async function publishRich(
  email: string,
  slug: string,
  flags: Record<string, boolean> = {}
): Promise<string> {
  const token = await registerUser(email);
  await seedRichProfile(token);
  await request(app).put("/api/profile/me/portfolio").set(authH(token)).send({ slug, ...flags });
  await request(app).post("/api/profile/me/portfolio/publish").set(authH(token));
  return token;
}

describe("GET /api/public/portfolios/:slug", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });
  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("returns 404 when the slug does not exist", async () => {
    const res = await request(app).get(PUB("no-such-slug"));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 404 (uniform) when the portfolio exists but is not published", async () => {
    const token = await registerUser("hidden@example.com");
    await seedRichProfile(token);
    await request(app).put("/api/profile/me/portfolio").set(authH(token)).send({ slug: "ana-hidden" });
    // sin publish
    const res = await request(app).get(PUB("ana-hidden"));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 404 for an invalid slug", async () => {
    const res = await request(app).get(PUB("ab"));
    expect(res.status).toBe(404);
  });

  it("returns 200 without auth for a published portfolio", async () => {
    await publishRich("pub@example.com", "ana-pub");
    const res = await request(app).get(PUB("ana-pub")); // sin Authorization

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe("ana-pub");
    expect(res.body.publicUrlPath).toBe("/u/ana-pub");
    expect(res.body.profile.name).toBe("Ana Pérez");
    expect(res.body.profile.headline).toBe("Frontend Developer");
    expect(res.body.profile.skills[0].name).toBe("React");
    expect(res.body.profile.experiences).toHaveLength(1);
    expect(res.body.profile.projects[0].name).toBe("design-system");
    expect(res.body.profile.links[0].url).toBe("https://github.com/ana");
  });

  it("respects showLocation", async () => {
    await publishRich("loc-on@example.com", "loc-on");
    const on = await request(app).get(PUB("loc-on"));
    expect(on.body.profile.location).toBe("Bilbao");

    await publishRich("loc-off@example.com", "loc-off", { showLocation: false });
    const off = await request(app).get(PUB("loc-off"));
    expect(off.body.profile.location).toBeNull();
  });

  it("respects showAvailability", async () => {
    await publishRich("av-off@example.com", "av-off", { showAvailability: false });
    const res = await request(app).get(PUB("av-off"));
    expect(res.body.profile.availabilityStatus).toBeNull();
    expect(res.body.profile.locationRemote).toBeNull();
  });

  it("hides preferences by default and never exposes salary when shown", async () => {
    await publishRich("pref-off@example.com", "pref-off");
    const off = await request(app).get(PUB("pref-off"));
    expect(off.body.profile.preferences).toBeNull();

    await publishRich("pref-on@example.com", "pref-on", { showPreferences: true });
    const on = await request(app).get(PUB("pref-on"));
    expect(on.body.profile.preferences).not.toBeNull();
    expect(on.body.profile.preferences.desiredRoles).toContain("Frontend");
    const body = JSON.stringify(on.body);
    expect(body).not.toContain("salaryMin");
    expect(body).not.toContain("35000");
  });

  it("never exposes private fields", async () => {
    await publishRich("leak@example.com", "no-leak", { showPreferences: true });
    const res = await request(app).get(PUB("no-leak"));
    const body = JSON.stringify(res.body);

    expect(body).not.toContain("userId");
    expect(body).not.toContain("leak@example.com");
    expect(body).not.toContain("passwordHash");
    expect(body).not.toContain("savedJobs");
    expect(body).not.toContain("completionPercentage");
    expect(body).not.toContain("salaryMin");
  });
});
