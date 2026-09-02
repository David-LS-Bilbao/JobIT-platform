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
  test("un 401 protegido refresca una vez y reintenta con el token recién emitido", async ({ page }) => {
    const user = createE2eUser();
    let oldToken = "";

    await page.route("**/api/auth/register", async (route) => {
      const response = await route.fetch();
      const payload = (await response.json()) as { accessToken?: unknown };
      if (typeof payload.accessToken !== "string") {
        throw new Error("El registro E2E no devolvió un access token sintético válido.");
      }
      oldToken = payload.accessToken;
      await route.fulfill({ response });
    });

    await registerCandidate(page, user);
    await expectDashboard(page);
    expect(oldToken).not.toBe("");

    let refreshCalls = 0;
    let newToken = "";
    const dashboardAuthorizations: string[] = [];

    await page.route("**/api/auth/refresh", async (route) => {
      refreshCalls += 1;
      const response = await route.fetch();
      const payload = (await response.json()) as { accessToken?: unknown };
      if (typeof payload.accessToken !== "string") {
        throw new Error("El refresh E2E no devolvió un access token sintético válido.");
      }
      newToken = payload.accessToken;
      await route.fulfill({ response });
    });
    await page.route("**/api/dashboard/me", async (route) => {
      const authorization = route.request().headers()["authorization"] ?? "";
      dashboardAuthorizations.push(authorization);
      if (authorization === `Bearer ${oldToken}`) {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Authentication required." } })
        });
        return;
      }
      const response = await route.fetch();
      await route.fulfill({ response });
    });

    await goToPrivateSection(page, "JobIT CV", "Tu perfil tech vivo");
    await goToPrivateSection(page, "Dashboard", "Dashboard");
    await expectDashboard(page);

    expect(refreshCalls).toBe(1);
    expect(newToken).not.toBe("");
    expect(newToken !== oldToken).toBe(true);
    const authorizationKinds = dashboardAuthorizations.map((authorization) => {
      if (authorization === `Bearer ${oldToken}`) return "old";
      if (authorization === `Bearer ${newToken}`) return "new";
      return "unexpected";
    });
    const firstNewAuthorization = authorizationKinds.indexOf("new");
    expect(authorizationKinds[0]).toBe("old");
    expect(firstNewAuthorization).toBeGreaterThan(0);
    expect(authorizationKinds).not.toContain("unexpected");
    expect(authorizationKinds.slice(firstNewAuthorization).every((kind) => kind === "new")).toBe(true);
    expect(new URL(page.url()).pathname).toBe("/dashboard");
    expect(page.url()).not.toContain("reason=expired");
  });

  test("un acceso privado sin cookie termina en required y nunca en expired", async ({ page }) => {
    const navigations: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) navigations.push(frame.url());
    });
    await page.route("**/api/auth/refresh", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Authentication required." } })
      });
    });

    await page.goto("/dashboard");
    await page.waitForURL("**/login?reason=required");

    expect(new URL(page.url()).searchParams.get("reason")).toBe("required");
    expect(navigations.some((url) => url.includes("reason=expired"))).toBe(false);
    await expect(page.getByText("Inicia sesión para continuar.", { exact: true })).toBeVisible();
  });

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
