import { expect, test } from "@playwright/test";

import { createE2eUser, expectDashboard, privateNav, registerCandidate } from "./helpers";

/**
 * Journey auth + dashboard (Sprint 18.2). Usuario único por ejecución,
 * creado solo por UI. El registro real inicia sesión y redirige a /dashboard,
 * así que no hace falta login separado en este journey.
 * Requiere web :3000 y API :4000 vivas (BD local).
 */
test.describe("auth dashboard smoke", () => {
  test("el candidato se registra y ve el dashboard privado", async ({ page }) => {
    const user = createE2eUser();

    await registerCandidate(page, user);

    await expectDashboard(page);

    const nav = privateNav(page);
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "JobIT CV" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Portfolio" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "JobIT Jobs" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Guardadas" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "JobIT Match" })).toBeVisible();
  });
});
