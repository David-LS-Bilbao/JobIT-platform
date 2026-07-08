import { expect, test } from "@playwright/test";

import {
  createE2eUser,
  createProfileMinimum,
  expectDashboard,
  expectPublicPortfolio,
  expectStatusMessage,
  fillProfileMinimum,
  getPortfolioPublicPath,
  goToPrivateSection,
  registerCandidate
} from "./helpers";

/**
 * Journey Profile/CV + Portfolio (Sprint 18.4): registro → rellenar mínimo
 * publicable → publicar → ver portfolio público → despublicar.
 *
 * La visita a `/u/[slug]` es la única excepción autorizada a "sin goto/reload
 * en sesión autenticada": es una ruta pública y parte explícita del objetivo.
 * Se hace en una pestaña nueva del mismo contexto para no tocar la sesión en
 * memoria de la página privada original.
 *
 * Requiere web :3000 y API :4000 vivas con la BD local.
 */
test.describe("profile and portfolio smoke", () => {
  test("el candidato publica su portfolio, lo ve público y lo despublica", async ({ page, context }) => {
    const user = createE2eUser();
    const profileData = createProfileMinimum();

    await registerCandidate(page, user);
    await expectDashboard(page);

    // JobIT CV: mínimo publicable (nombre, apellidos, headline, 1 skill, 1 proyecto).
    await goToPrivateSection(page, "JobIT CV", "Tu perfil tech vivo");
    await fillProfileMinimum(page, profileData);

    // Portfolio (preview privada) → Gestionar publicación (link de contenido, no del sidebar).
    await goToPrivateSection(page, "Portfolio", "Portfolio JobIT CV");
    await page.getByRole("link", { name: "Gestionar publicación" }).click();
    await expect(page.getByRole("heading", { name: "Publicación del portfolio" })).toBeVisible();

    // Publicar.
    await page.getByRole("button", { name: "Publicar portfolio" }).click();
    await expectStatusMessage(page, "Portfolio publicado.");
    await expect(page.getByRole("button", { name: "Despublicar portfolio" })).toBeVisible();

    // Ruta pública leída de la UI (no construida a partir de datos internos).
    const publicPath = await getPortfolioPublicPath(page);

    // Visita pública en una pestaña aparte: no afecta a la sesión en memoria.
    const publicPage = await context.newPage();
    await publicPage.goto(publicPath);
    await expectPublicPortfolio(publicPage, profileData);
    await publicPage.close();

    // De vuelta en la página privada original (sin reload): despublicar.
    await page.getByRole("button", { name: "Despublicar portfolio" }).click();
    await expectStatusMessage(page, "Portfolio despublicado.");
    await expect(page.getByRole("button", { name: "Publicar portfolio" })).toBeVisible();
  });
});
