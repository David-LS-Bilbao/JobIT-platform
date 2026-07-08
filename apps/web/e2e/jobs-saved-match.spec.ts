import { expect, test } from "@playwright/test";

import { createE2eUser, expectDashboard, goToPrivateSection, registerCandidate } from "./helpers";

/**
 * Journey Jobs + Guardadas + Match (Sprint 18.3), en una sola sesión
 * autenticada (la sesión vive en memoria: navegación solo client-side).
 *
 * Determinismo: no se asume ninguna oferta concreta — se captura el título de
 * la primera card visible tras buscar y se usa para los asserts posteriores.
 * Match no filtra por score mínimo (puntúa todas las ofertas disponibles),
 * así que hay resultados sin necesidad de preparar skills en el perfil.
 * Requiere web :3000 y API :4000 vivas con la BD local (ofertas del seed).
 */
test.describe("jobs, saved jobs and match smoke", () => {
  test("el candidato guarda una oferta, la quita y guarda desde match", async ({ page }) => {
    const user = createE2eUser();

    await registerCandidate(page, user);
    await expectDashboard(page);

    // Jobs: listado + búsqueda estable.
    await goToPrivateSection(page, "JobIT Jobs", "Ofertas tech");
    await page.getByLabel("Buscar ofertas").fill("Developer");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();

    // Primera card del resultado: capturar su título para el resto del journey.
    const firstJobLink = page
      .getByRole("heading", { level: 3 })
      .first()
      .getByRole("link");
    await expect(firstJobLink).toBeVisible();
    const jobTitle = ((await firstJobLink.textContent()) ?? "").trim();
    expect(jobTitle.length).toBeGreaterThan(0);

    // Detalle de la oferta (link client-side de la card).
    await page.getByRole("link", { name: jobTitle, exact: true }).first().click();
    await expect(page.getByRole("heading", { name: jobTitle, exact: true })).toBeVisible();

    // Guardar desde el detalle: feedback accesible + botón en estado "quitar".
    await page.getByRole("button", { name: "Guardar oferta" }).click();
    await expect(page.getByText("Oferta guardada.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Quitar de guardadas" })).toBeVisible();

    // Guardadas: la oferta aparece; quitarla deja el empty state (usuario nuevo).
    await goToPrivateSection(page, "Guardadas", "Ofertas guardadas");
    await expect(page.getByRole("link", { name: jobTitle, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Quitar", exact: true }).click();
    await expect(page.getByText("Oferta quitada de guardadas.", { exact: true })).toBeVisible();
    await expect(page.getByText("Aún no has guardado ninguna oferta.")).toBeVisible();

    // Match: hay resultados (score sobre todas las ofertas) y se puede guardar.
    await goToPrivateSection(page, "JobIT Match", "JobIT Match");
    await expect(page.getByText(/ofertas ordenadas por afinidad/)).toBeVisible();
    const firstSaveButton = page.getByRole("button", { name: "Guardar", exact: true }).first();
    await expect(firstSaveButton).toBeVisible();
    await firstSaveButton.click();
    await expect(page.getByText("Oferta guardada.", { exact: true })).toBeVisible();
  });
});
