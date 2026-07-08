import { expect, test } from "@playwright/test";

/**
 * Smoke E2E público (Sprint 18.1). Sin sesión, sin usuario, sin tocar BD.
 * Spec: docs/specs/features/candidate-e2e-smoke.md.
 *
 * Requiere la API viva en :4000 para el caso /u/[slug] (la página consulta
 * el portfolio público por fetch y muestra 404 honesto si no existe).
 */
test.describe("public smoke", () => {
  test("la landing pública carga y ofrece acceso", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Iniciar sesión" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Crear cuenta" }).first()).toBeVisible();
  });

  test("la página de login muestra el formulario", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
  });

  test("la página de registro muestra el formulario", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("button", { name: "Crear cuenta" })).toBeVisible();
  });

  test("un portfolio público inexistente muestra estado no disponible", async ({ page }) => {
    await page.goto("/u/e2e-portfolio-inexistente");
    await expect(page.getByRole("heading", { name: "Portfolio no disponible" })).toBeVisible();
  });
});
