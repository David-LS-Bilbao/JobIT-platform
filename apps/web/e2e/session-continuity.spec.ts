import { expect, test } from "@playwright/test";

import {
  createE2eUser,
  expectDashboard,
  goToPrivateSection,
  privateNav,
  registerCandidate
} from "./helpers";

/**
 * Continuidad de sesión ante recarga real (ADR-0014).
 *
 * Antes de esta unidad el access token vivía solo en memoria y una recarga
 * expulsaba al candidato a /login aunque la cookie `refresh_token` siguiera
 * siendo válida. Este journey verifica el comportamiento nuevo de extremo a
 * extremo: tras un `page.reload()` REAL, la app recupera la sesión mediante
 * `POST /api/auth/refresh` y el contenido privado sigue disponible.
 *
 * Requiere web :3000 y API :4000 vivas (BD local), como el resto del smoke.
 */
test.describe("continuidad de sesión", () => {
  test("el candidato recarga una ruta privada y conserva la sesión", async ({ page }) => {
    const user = createE2eUser();

    await registerCandidate(page, user);
    await expectDashboard(page);

    // Navegación client-side hasta una sección privada distinta del dashboard.
    await goToPrivateSection(page, "JobIT CV", "Tu perfil tech vivo");

    // Recarga REAL: el estado en memoria se pierde y solo queda la cookie httpOnly.
    await page.reload();

    // La sesión se recupera: ni redirección a /login ni pérdida de contenido.
    await expect(page.getByRole("heading", { name: "Tu perfil tech vivo" })).toBeVisible();
    expect(new URL(page.url()).pathname).not.toBe("/login");
    await expect(privateNav(page).getByRole("link", { name: "Dashboard" })).toBeVisible();

    // Y la navegación privada sigue operativa tras la recarga.
    await goToPrivateSection(page, "Dashboard", "Dashboard");
    await expectDashboard(page);
  });
});
