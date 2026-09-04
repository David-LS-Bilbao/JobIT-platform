import { expect, test } from "@playwright/test";

import {
  apiBase,
  createE2eUser,
  createProfileMinimum,
  expectDashboard,
  expectPublicPortfolio,
  expectStatusMessage,
  fillProfileMinimum,
  getPortfolioPublicPath,
  goToPrivateSection,
  privateNav,
  registerCandidate
} from "./helpers";

/**
 * Golden E2E — journey 7: ciclo de vida de la cuenta.
 * Spec: `docs/specs/features/account-lifecycle.md`.
 *
 * Cubre el journey completo de extremo a extremo, con datos SINTETICOS:
 *
 *   registrar → perfil → avatar → publicar portfolio → guardar oferta
 *   → exportar → verificar el export → borrar con step-up → sesion limpiada
 *   → token previo rechazado → refresh no recupera → portfolio publico caido
 *   → avatar no disponible
 *
 * Requiere web :3000 y API :4000 vivas con la BD local (ofertas del seed).
 */

/** La API vive fuera del `baseURL` de Playwright, asi que se direcciona aparte. */
const API_BASE = apiBase();

/**
 * PNG 1x1 REAL y decodificable.
 *
 * No basta con los magic bytes: la API los acepta, pero `ProfileAvatar` cae a las
 * iniciales via `onError` si el navegador no puede decodificar la imagen, y
 * entonces no habria ningun `<img>` que inspeccionar.
 */
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

test.describe("account lifecycle smoke", () => {
  test("el candidato exporta sus datos y borra su cuenta de forma permanente", async ({
    page,
    context,
    request
  }) => {
    const user = createE2eUser();
    const profileData = createProfileMinimum();

    // Se captura el access token emitido en el registro: al final del journey se
    // comprueba que un token YA emitido deja de autorizar tras el borrado.
    let issuedAccessToken = "";
    await page.route("**/api/auth/register", async (route) => {
      const response = await route.fetch();
      const payload = (await response.json()) as { accessToken?: unknown };
      if (typeof payload.accessToken !== "string") {
        throw new Error("El registro E2E no devolvio un access token sintetico valido.");
      }
      issuedAccessToken = payload.accessToken;
      await route.fulfill({ response });
    });

    // ── 1. Registro ────────────────────────────────────────────────────────
    await registerCandidate(page, user);
    expect(issuedAccessToken).not.toBe("");
    await expectDashboard(page);

    // ── 2. Perfil minimo publicable ────────────────────────────────────────
    await goToPrivateSection(page, "JobIT CV", "Tu perfil tech vivo");
    await fillProfileMinimum(page, profileData);

    // ── 3. Avatar: subida real desde el formulario de perfil ───────────────
    await page.setInputFiles("#pf-avatar-file", {
      name: "e2e-avatar.png",
      mimeType: "image/png",
      buffer: PNG_BYTES
    });
    // La imagen persistida se sirve desde /uploads/avatars/<archivo>.
    const avatarImage = page.locator('img[src*="/uploads/avatars/"]').first();
    await expect(avatarImage).toBeVisible();
    const avatarSrc = (await avatarImage.getAttribute("src")) ?? "";
    expect(avatarSrc).toContain("/uploads/avatars/");

    // ── 4. Publicar el portfolio ───────────────────────────────────────────
    await goToPrivateSection(page, "Portfolio", "Portfolio JobIT CV");
    await page.getByRole("link", { name: "Gestionar publicación" }).click();
    await expect(page.getByRole("heading", { name: "Publicación del portfolio" })).toBeVisible();
    await page.getByRole("button", { name: "Publicar portfolio" }).click();
    await expectStatusMessage(page, "Portfolio publicado.");
    const publicPath = await getPortfolioPublicPath(page);

    // El portfolio publico responde ANTES del borrado: la comprobacion posterior
    // solo tiene valor si aqui existe de verdad.
    const publicPage = await context.newPage();
    await publicPage.goto(publicPath);
    await expectPublicPortfolio(publicPage, profileData);
    await publicPage.close();

    // ── 5. Guardar una oferta ──────────────────────────────────────────────
    await goToPrivateSection(page, "JobIT Jobs", "Ofertas tech");
    const firstJobLink = page.getByRole("heading", { level: 3 }).first().getByRole("link");
    await expect(firstJobLink).toBeVisible();
    const jobTitle = ((await firstJobLink.textContent()) ?? "").trim();
    await page.getByRole("link", { name: jobTitle, exact: true }).first().click();
    await page.getByRole("button", { name: "Guardar oferta" }).click();
    await expect(page.getByText("Oferta guardada.", { exact: true })).toBeVisible();

    // ── 6. Exportar los datos (step-up con contraseña) ─────────────────────
    await goToPrivateSection(page, "Cuenta", "Cuenta");
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#export-password").fill(user.password);
    await page.getByRole("button", { name: "Exportar mis datos" }).click();
    const download = await downloadPromise;

    // ── 7. Verificar el contenido del export ───────────────────────────────
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const raw = Buffer.concat(chunks).toString("utf8");
    const exported = JSON.parse(raw) as Record<string, unknown>;

    expect(exported["version"]).toBe("1");
    expect((exported["account"] as { email: string }).email).toBe(user.email);
    expect((exported["profile"] as { firstName: string }).firstName).toBe(profileData.firstName);
    expect((exported["savedJobs"] as unknown[]).length).toBeGreaterThan(0);
    // Allowlist: ningun material de credenciales sale del sistema.
    for (const forbidden of ["passwordHash", "tokenHash", "familyId", "accessToken", "refresh_token"]) {
      expect(raw).not.toContain(forbidden);
    }

    // ── 8. Borrado permanente con step-up y confirmacion exacta ────────────
    const deleteButton = page.getByRole("button", { name: "Borrar mi cuenta permanentemente" });
    await expect(deleteButton).toBeDisabled();
    await page.locator("#delete-password").fill(user.password);
    await page.locator("#delete-confirmation").fill("DELETE");
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    // ── 9. La sesion del frontend desaparece ───────────────────────────────
    await page.waitForURL("**/login**");
    await expect(privateNav(page)).toHaveCount(0);

    // ── 10. El access token YA emitido deja de autorizar ───────────────────
    // Su firma sigue siendo criptograficamente valida; lo que ha desaparecido es
    // el usuario. Es el mecanismo de invalidacion inmediata de la spec.
    const withOldToken = await request.get(`${API_BASE}/api/profile/me`, {
      headers: { Authorization: `Bearer ${issuedAccessToken}` }
    });
    expect(withOldToken.status()).toBe(401);

    // ── 11. La sesion no se puede recuperar por refresh ────────────────────
    // La cookie httpOnly sigue en el contexto del navegador, pero ya no resucita
    // nada porque el usuario no existe.
    const refreshResponse = await page.request.post(`${API_BASE}/api/auth/refresh`);
    expect(refreshResponse.status()).toBe(401);

    // Y las credenciales tampoco sirven para volver a entrar.
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Contraseña", { exact: true }).fill(user.password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    // Texto exacto del banner: `getByRole("alert")` tambien capturaria el
    // route-announcer de Next y violaria el modo estricto.
    await expect(page.getByText("Email o contraseña incorrectos.", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    // ── 12. El portfolio publico deja de estar disponible ──────────────────
    const slug = publicPath.replace("/u/", "");
    const goneResponse = await request.get(`${API_BASE}/api/public/portfolios/${slug}`);
    expect(goneResponse.status()).toBe(404);

    // ── 13. El avatar ya no se sirve ───────────────────────────────────────
    // `avatarSrc` es absoluto: el frontend prefija las rutas /uploads con la
    // base de la API.
    const avatarResponse = await request.get(avatarSrc);
    expect(avatarResponse.status()).toBe(404);
  });
});
