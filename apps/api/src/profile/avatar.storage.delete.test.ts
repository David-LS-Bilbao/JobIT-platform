import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  AVATAR_DIR,
  AVATAR_URL_PREFIX,
  deleteAvatarImage,
  resolveAvatarFilePath
} from "./avatar.storage.js";

/**
 * Borrado fisico de avatares.
 * Spec: `docs/specs/features/account-lifecycle.md` §"Avatar cleanup".
 */
describe("resolveAvatarFilePath", () => {
  it("resolves a legitimate internal avatar URL inside AVATAR_DIR", () => {
    const resolved = resolveAvatarFilePath(`${AVATAR_URL_PREFIX}user_abc.png`);
    expect(resolved).toBe(join(AVATAR_DIR, "user_abc.png"));
  });

  it("rejects null, empty and non-avatar URLs", () => {
    expect(resolveAvatarFilePath(null)).toBeNull();
    expect(resolveAvatarFilePath(undefined)).toBeNull();
    expect(resolveAvatarFilePath("")).toBeNull();
    // URL externa: valida como avatarUrl del perfil, pero nunca toca disco.
    expect(resolveAvatarFilePath("https://cdn.example.com/a.png")).toBeNull();
    expect(resolveAvatarFilePath("/uploads/other/a.png")).toBeNull();
  });

  it("rejects path traversal and nested segments", () => {
    expect(resolveAvatarFilePath(`${AVATAR_URL_PREFIX}../../../etc/passwd`)).toBeNull();
    expect(resolveAvatarFilePath(`${AVATAR_URL_PREFIX}..`)).toBeNull();
    expect(resolveAvatarFilePath(`${AVATAR_URL_PREFIX}.`)).toBeNull();
    expect(resolveAvatarFilePath(`${AVATAR_URL_PREFIX}nested/a.png`)).toBeNull();
    expect(resolveAvatarFilePath(`${AVATAR_URL_PREFIX}`)).toBeNull();
  });
});

describe("deleteAvatarImage", () => {
  it("deletes an existing file and reports it", async () => {
    await mkdir(AVATAR_DIR, { recursive: true });
    const filename = `unit_${Date.now()}_${Math.random().toString(16).slice(2)}.png`;
    await writeFile(join(AVATAR_DIR, filename), Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    await expect(deleteAvatarImage(`${AVATAR_URL_PREFIX}${filename}`)).resolves.toBe(true);
  });

  // Idempotencia: el ciclo de vida de la cuenta no puede romperse porque la
  // limpieza ya hubiera ocurrido.
  it("is idempotent for an already missing file", async () => {
    await expect(deleteAvatarImage(`${AVATAR_URL_PREFIX}definitely-absent.png`)).resolves.toBe(false);
  });

  it("never touches disk for a URL it does not own", async () => {
    await expect(deleteAvatarImage("https://cdn.example.com/a.png")).resolves.toBe(false);
    await expect(deleteAvatarImage(`${AVATAR_URL_PREFIX}../../package.json`)).resolves.toBe(false);
  });
});
