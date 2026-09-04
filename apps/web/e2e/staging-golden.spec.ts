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
 * Golden staging journey (Fase C — bloque 2).
 * Spec: `docs/specs/features/staging-technical-readiness.md`.
 *
 * Recorrido ÚNICO y coherente con UNA SOLA identidad sintética:
 *
 *   registrar → sesión autenticada → recarga/continuidad
 *   → perfil → skill → proyecto → avatar sintético
 *   → publicar portfolio → lectura pública → despublicar
 *   → ofertas → guardar → verificar estado guardado → match
 *   → borrar cuenta
 *   → invalidación de sesión/acceso → portfolio público caído → avatar caído
 *
 * POR QUÉ UNA SOLA IDENTIDAD. La suite local/CI reparte su cobertura entre seis
 * identidades, lo cual está bien contra una base efímera. Contra un staging
 * PERSISTENTE con los límites canónicos (`AUTH_REGISTER_MAX=5/hora`) eso agota
 * el cupo y la suite fallaría por rate limiting en lugar de por un defecto real.
 * Este recorrido consume UN registro, así que admite hasta cinco ejecuciones por
 * hora sin tocar ningún límite. Los límites del producto NO se relajan para
 * hacer pasar un test.
 *
 * CLEANUP. El propio borrado de cuenta es la limpieza: dos ejecuciones seguidas
 * contra la misma base persistente no dejan crecimiento neto de `User`. El
 * `afterEach` solo cubre el caso de fallo a mitad del recorrido, y siempre
 * acotado a la identidad sintética de esa ejecución.
 *
 * MODO: se ejecuta contra el servidor externo indicado por `E2E_BASE_URL`
 * (ensayo local de staging). Sin esa variable ataca el entorno local, igual que
 * el resto de la suite.
 */

const API_BASE = apiBase();

/**
 * PNG 1x1 REAL y decodificable.
 *
 * No basta con los magic bytes: la API los acepta, pero `ProfileAvatar` cae a
 * las iniciales vía `onError` si el navegador no puede decodificar la imagen, y
 * entonces no habría ningún `<img>` que inspeccionar.
 */
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const user = createE2eUser("e2e-golden");

test.describe("golden staging journey", () => {
  // Red de seguridad SOLO para un fallo a mitad del recorrido: si la cuenta
  // sigue viva, se borra. Acotado a esta identidad sintética; nunca un borrado
  // amplio ni un reset de la base.
  test.afterEach(async ({ request }) => {
    const login = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: user.email, password: user.password },
      failOnStatusCode: false
    });
    if (!login.ok()) return;

    const { accessToken } = (await login.json()) as { accessToken?: string };
    if (typeof accessToken !== "string") return;

    await request.delete(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { password: user.password, confirmation: "DELETE" },
      failOnStatusCode: false
    });
  });

  test("recorrido completo del candidato sintetico con una unica identidad", async ({
    page,
    context,
    request
  }) => {
    test.setTimeout(180_000);

    const profileData = createProfileMinimum();

    // Se captura el access token emitido en el registro: al final se comprueba
    // que un token YA emitido deja de autorizar tras el borrado.
    let issuedAccessToken = "";
    await page.route("**/api/auth/register", async (route) => {
      const response = await route.fetch();
      const payload = (await response.json()) as { accessToken?: unknown };
      if (typeof payload.accessToken === "string") {
        issuedAccessToken = payload.accessToken;
      }
      await route.fulfill({ response });
    });

    // ── 1. Registro con identidad sintetica ────────────────────────────────
    await registerCandidate(page, user);
    expect(issuedAccessToken).not.toBe("");
    await expectDashboard(page);

    // ── 2. Continuidad de sesion ante recarga REAL ─────────────────────────
    // El token vive solo en memoria; tras la recarga solo queda la cookie
    // httpOnly, que debe bastar para recuperar la sesion (ADR-0014).
    await goToPrivateSection(page, "JobIT CV", "Tu perfil tech vivo");
    await page.reload();
    await expect(page.getByRole("heading", { name: "Tu perfil tech vivo" })).toBeVisible();
    expect(new URL(page.url()).pathname).not.toBe("/login");
    await expect(privateNav(page).getByRole("link", { name: "Dashboard" })).toBeVisible();

    // ── 3. Perfil: nombre, headline, skill y proyecto ───────────────────────
    await fillProfileMinimum(page, profileData);

    // ── 4. Avatar sintetico ────────────────────────────────────────────────
    await page.setInputFiles("#pf-avatar-file", {
      name: "staging-golden-avatar.png",
      mimeType: "image/png",
      buffer: PNG_BYTES
    });
    const avatarImage = page.locator('img[src*="/uploads/avatars/"]').first();
    await expect(avatarImage).toBeVisible();
    const avatarSrc = (await avatarImage.getAttribute("src")) ?? "";
    expect(avatarSrc).toContain("/uploads/avatars/");

    // ── 5. Publicar el portfolio ───────────────────────────────────────────
    await goToPrivateSection(page, "Portfolio", "Portfolio JobIT CV");
    await page.getByRole("link", { name: "Gestionar publicación" }).click();
    await expect(page.getByRole("heading", { name: "Publicación del portfolio" })).toBeVisible();
    await page.getByRole("button", { name: "Publicar portfolio" }).click();
    await expectStatusMessage(page, "Portfolio publicado.");
    await expect(page.getByRole("button", { name: "Despublicar portfolio" })).toBeVisible();
    const publicPath = await getPortfolioPublicPath(page);
    const slug = publicPath.replace("/u/", "");

    // ── 6. Lectura publica ─────────────────────────────────────────────────
    // Pestaña aparte: no toca la sesion en memoria de la pagina privada.
    const publicPage = await context.newPage();
    await publicPage.goto(publicPath);
    await expectPublicPortfolio(publicPage, profileData);
    await publicPage.close();

    // ── 7. Despublicar y comprobar que deja de servirse ────────────────────
    await page.getByRole("button", { name: "Despublicar portfolio" }).click();
    await expectStatusMessage(page, "Portfolio despublicado.");
    await expect(page.getByRole("button", { name: "Publicar portfolio" })).toBeVisible();

    const unpublished = await request.get(`${API_BASE}/api/public/portfolios/${slug}`);
    expect(unpublished.status()).toBe(404);

    // Se vuelve a publicar: el borrado de cuenta debe tumbar un portfolio VIVO,
    // que es el caso que de verdad importa comprobar al final.
    await page.getByRole("button", { name: "Publicar portfolio" }).click();
    await expectStatusMessage(page, "Portfolio publicado.");

    // ── 8. Ofertas sinteticas ──────────────────────────────────────────────
    await goToPrivateSection(page, "JobIT Jobs", "Ofertas tech");
    const firstJobLink = page.getByRole("heading", { level: 3 }).first().getByRole("link");
    await expect(firstJobLink).toBeVisible();
    const jobTitle = ((await firstJobLink.textContent()) ?? "").trim();
    expect(jobTitle.length).toBeGreaterThan(0);

    // Las 14 ofertas del seed estan marcadas como sinteticas: la marca de
    // empresa tiene que ser visible tambien en el listado.
    await expect(page.getByText(/JobIT Synthetic ·/).first()).toBeVisible();

    // ── 9. Guardar la oferta y verificar el estado guardado ────────────────
    await page.getByRole("link", { name: jobTitle, exact: true }).first().click();
    await expect(page.getByRole("heading", { name: jobTitle, exact: true })).toBeVisible();
    // La descripcion del detalle lleva el marcador sintetico.
    await expect(page.getByText(/\[SYNTHETIC TEST DATA\]/).first()).toBeVisible();

    await page.getByRole("button", { name: "Guardar oferta" }).click();
    await expect(page.getByText("Oferta guardada.", { exact: true })).toBeVisible();

    await goToPrivateSection(page, "Guardadas", "Ofertas guardadas");
    await expect(page.getByRole("link", { name: jobTitle, exact: true })).toBeVisible();

    // ── 10. Match ──────────────────────────────────────────────────────────
    // El perfil ya tiene una skill de `fillProfileMinimum`, que es lo que match
    // necesita para calcular y ordenar afinidades.
    await goToPrivateSection(page, "JobIT Match", "JobIT Match");
    await expect(page.getByText(/ofertas ordenadas por afinidad/)).toBeVisible();

    // ── 11. Borrado permanente con step-up y confirmacion exacta ───────────
    await goToPrivateSection(page, "Cuenta", "Cuenta");
    const deleteButton = page.getByRole("button", { name: "Borrar mi cuenta permanentemente" });
    await expect(deleteButton).toBeDisabled();
    await page.locator("#delete-password").fill(user.password);
    await page.locator("#delete-confirmation").fill("DELETE");
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    // ── 12. La sesion del frontend desaparece ──────────────────────────────
    await page.waitForURL("**/login**");
    await expect(privateNav(page)).toHaveCount(0);

    // ── 13. Invalidacion de acceso y de sesion ─────────────────────────────
    // El token sigue siendo criptograficamente valido; lo que ha desaparecido
    // es el usuario.
    const withOldToken = await request.get(`${API_BASE}/api/profile/me`, {
      headers: { Authorization: `Bearer ${issuedAccessToken}` }
    });
    expect(withOldToken.status()).toBe(401);

    const refreshResponse = await page.request.post(`${API_BASE}/api/auth/refresh`);
    expect(refreshResponse.status()).toBe(401);

    const relogin = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: user.email, password: user.password },
      failOnStatusCode: false
    });
    expect(relogin.status()).toBe(401);

    // ── 14. El portfolio publico deja de estar disponible ──────────────────
    const goneResponse = await request.get(`${API_BASE}/api/public/portfolios/${slug}`);
    expect(goneResponse.status()).toBe(404);

    // ── 15. El avatar ya no se sirve ───────────────────────────────────────
    const avatarResponse = await request.get(avatarSrc);
    expect(avatarResponse.status()).toBe(404);
  });
});
