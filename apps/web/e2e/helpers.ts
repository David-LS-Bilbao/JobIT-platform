import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Helpers E2E del flujo candidato (Sprint 18.2).
 *
 * Restricción de diseño (ADR-0006): la sesión vive solo en memoria React.
 * Tras autenticarse, navegar SOLO por clicks/enlaces client-side; nada de
 * `page.goto()` a rutas privadas ni reloads durante el journey.
 */

export type E2eUser = {
  email: string;
  password: string;
};

/** Usuario único por ejecución. Password local de test (min 8, mayúscula, número). */
export function createE2eUser(): E2eUser {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    email: `e2e+${suffix}@jobit.local`,
    password: "JobitE2e123!"
  };
}

/**
 * Registro por UI. El registro real inicia sesión (setSession) y redirige a
 * /dashboard, así que al volver de aquí ya hay sesión autenticada.
 */
export async function registerCandidate(page: Page, user: E2eUser): Promise<void> {
  await page.goto("/register");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(user.password);
  await page.getByLabel("Confirmar contraseña").fill(user.password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.waitForURL("**/dashboard");
}

/** Login por UI con un usuario ya registrado. Redirige a /dashboard. */
export async function loginCandidate(page: Page, user: E2eUser): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL("**/dashboard");
}

/** Sidebar privado (nav con aria-label estable), para no colisionar con enlaces del contenido. */
export function privateNav(page: Page): Locator {
  return page.getByRole("navigation", { name: "Navegación privada" });
}

/** El Dashboard saluda con "Hola, <nombre|candidato tech>". */
export async function expectDashboard(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: /^Hola,/ })).toBeVisible();
}

/**
 * Navega a una sección privada por el sidebar (click client-side, sin goto)
 * y espera su título de página (h1 del SiteShell), que puede diferir del
 * nombre del enlace (p. ej. "JobIT Jobs" → "Ofertas tech").
 */
export async function goToPrivateSection(
  page: Page,
  linkName: string,
  headingTitle: string
): Promise<void> {
  await privateNav(page).getByRole("link", { name: linkName }).click();
  await expect(page.getByRole("heading", { name: headingTitle })).toBeVisible();
}

/** Mínimo publicable del portfolio (Sprint 18.4): nombre + headline + 1 skill + 1 proyecto. */
export type ProfileMinimum = {
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  skill: string;
  projectName: string;
  technologies: string;
};

export function createProfileMinimum(): ProfileMinimum {
  const suffix = Date.now();
  return {
    firstName: "E2E",
    lastName: "Portfolio",
    headline: "Full Stack Developer E2E",
    summary: "Perfil de prueba E2E para validar el portfolio público de JobIT.",
    skill: "TypeScript",
    projectName: `Proyecto E2E ${suffix}`,
    technologies: "TypeScript, React"
  };
}

/**
 * Rellena JobIT CV con el mínimo publicable y guarda. Debe llamarse ya en
 * `/profile` (tras `goToPrivateSection(page, "JobIT CV", "Tu perfil tech vivo")`).
 * Skill y proyecto se guardan al vuelo (POST propio); nombre/apellidos/headline
 * se guardan al pulsar "Guardar cambios".
 */
export async function fillProfileMinimum(page: Page, data: ProfileMinimum): Promise<void> {
  await page.getByLabel("Nombre", { exact: true }).fill(data.firstName);
  await page.getByLabel("Apellidos", { exact: true }).fill(data.lastName);
  await page.getByLabel("Rol actual / deseado").fill(data.headline);
  await page.getByLabel("Resumen profesional").fill(data.summary);

  // El preview en vivo de la columna derecha repite el texto de skill/proyecto
  // con otro estilo (ambiguo por texto); una alta correcta limpia su input, así
  // que ese vaciado es la señal fiable y no ambigua de que se guardó.
  const skillInput = page.getByLabel("Nombre de la skill");
  await skillInput.fill(data.skill);
  await page.getByRole("button", { name: "Añadir skill" }).click();
  await expect(skillInput).toHaveValue("");

  const projectNameInput = page.getByLabel("Nombre del proyecto");
  await projectNameInput.fill(data.projectName);
  await page.getByLabel("Tecnologías (separadas por comas)").fill(data.technologies);
  await page.getByRole("button", { name: "Añadir proyecto" }).click();
  await expect(projectNameInput).toHaveValue("");

  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expectStatusMessage(page, "Cambios guardados");
}

/** Feedback accesible (`role="status"`/texto visible) tras una acción. */
export async function expectStatusMessage(page: Page, text: string): Promise<void> {
  await expect(page.getByText(text, { exact: true })).toBeVisible();
}

/**
 * Lee la ruta pública mostrada en Portfolio settings ("Ruta pública: /u/slug")
 * y devuelve el path relativo (p. ej. "/u/e2e-portfolio-123"). Solo lectura de
 * UI: no construye la URL a partir de datos internos.
 */
export async function getPortfolioPublicPath(page: Page): Promise<string> {
  const text = (await page.getByText(/^Ruta pública:/).textContent()) ?? "";
  const match = text.match(/\/u\/[^\s]+/);
  if (!match) throw new Error(`No se ha podido leer la ruta pública del portfolio en: "${text}"`);
  return match[0];
}

/** Verifica el portfolio público (nueva page, sin tocar la sesión autenticada original). */
export async function expectPublicPortfolio(
  page: Page,
  data: Pick<ProfileMinimum, "firstName" | "lastName" | "headline">
): Promise<void> {
  await expect(
    page.getByRole("heading", { name: `${data.firstName} ${data.lastName}`, exact: true })
  ).toBeVisible();
  await expect(page.getByText(data.headline, { exact: true })).toBeVisible();
}
