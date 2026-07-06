import { readdir, rm } from "node:fs/promises";

import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";
import { AVATAR_DIR } from "./avatar.storage.js";

const PASSWORD = "ValidPass123";

// Buffers mínimos con magic bytes válidos (el endpoint no decodifica la imagen,
// solo comprueba la firma). >= 12 bytes para pasar el sniff.
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const WEBP = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from("WEBP"),
  Buffer.from([0, 0, 0, 0])
]);
const NOT_AN_IMAGE = Buffer.from("this is plain text, definitely not an image file at all");

async function registerUser(email: string): Promise<string> {
  const res = await request(app).post("/api/auth/register").send({ email, password: PASSWORD });
  return res.body.accessToken as string;
}

async function cleanupUploads(): Promise<void> {
  // Elimina los ficheros generados por los tests, conservando la carpeta (.gitkeep).
  let entries: string[] = [];
  try {
    entries = await readdir(AVATAR_DIR);
  } catch {
    return;
  }
  await Promise.all(
    entries
      .filter((name) => name !== ".gitkeep")
      .map((name) => rm(`${AVATAR_DIR}/${name}`, { force: true }))
  );
}

describe("POST /api/profile/me/avatar", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
    await cleanupUploads();
  });

  afterAll(async () => {
    await cleanupUploads();
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).post("/api/profile/me/avatar").attach("avatar", PNG, {
      filename: "a.png",
      contentType: "image/png"
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 when no file is provided", async () => {
    const token = await registerUser("nofile@example.com");
    const res = await request(app)
      .post("/api/profile/me/avatar")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NO_FILE");
  });

  it("rejects an unsupported content type", async () => {
    const token = await registerUser("badtype@example.com");
    const res = await request(app)
      .post("/api/profile/me/avatar")
      .set("Authorization", `Bearer ${token}`)
      .attach("avatar", NOT_AN_IMAGE, { filename: "a.gif", contentType: "image/gif" });
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("rejects a file whose bytes do not match its declared image type", async () => {
    const token = await registerUser("forged@example.com");
    const res = await request(app)
      .post("/api/profile/me/avatar")
      .set("Authorization", `Bearer ${token}`)
      .attach("avatar", NOT_AN_IMAGE, { filename: "a.png", contentType: "image/png" });
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("rejects a file larger than 5 MB", async () => {
    const token = await registerUser("toolarge@example.com");
    const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
    const res = await request(app)
      .post("/api/profile/me/avatar")
      .set("Authorization", `Bearer ${token}`)
      .attach("avatar", big, { filename: "big.png", contentType: "image/png" });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("FILE_TOO_LARGE");
  });

  it("accepts a file between 2 MB and 5 MB (17C: former limit raised)", async () => {
    const token = await registerUser("midsize@example.com");
    // 3 MB: por encima del límite antiguo (2 MB) y por debajo del nuevo (5 MB).
    const mid = Buffer.concat([PNG, Buffer.alloc(3 * 1024 * 1024)]);
    const res = await request(app)
      .post("/api/profile/me/avatar")
      .set("Authorization", `Bearer ${token}`)
      .attach("avatar", mid, { filename: "mid.png", contentType: "image/png" });
    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toMatch(/^\/uploads\/avatars\/.+\.png$/);
  });

  it.each([
    ["png", PNG, "image/png"],
    ["jpeg", JPEG, "image/jpeg"],
    ["webp", WEBP, "image/webp"]
  ])("accepts a valid %s and updates the profile avatarUrl", async (_label, buffer, contentType) => {
    const token = await registerUser(`ok-${_label}@example.com`);
    const res = await request(app)
      .post("/api/profile/me/avatar")
      .set("Authorization", `Bearer ${token}`)
      .attach("avatar", buffer, { filename: `a.${_label}`, contentType });

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toMatch(/^\/uploads\/avatars\/.+\.(png|jpg|webp)$/);

    const me = await request(app).get("/api/profile/me").set("Authorization", `Bearer ${token}`);
    expect(me.body.avatarUrl).toBe(res.body.avatarUrl);
  });

  it("does not leak internal absolute paths in the response", async () => {
    const token = await registerUser("noleak@example.com");
    const res = await request(app)
      .post("/api/profile/me/avatar")
      .set("Authorization", `Bearer ${token}`)
      .attach("avatar", PNG, { filename: "a.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain(AVATAR_DIR);
    expect(body).not.toContain("/Users/");
    expect(body).not.toMatch(/\/(home|var|tmp|Users)\//);
  });
});
