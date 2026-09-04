import { defineConfig, devices } from "@playwright/test";

/**
 * Config E2E del flujo candidato (Sprint 18; modo externo añadido en la Fase C).
 *
 * DOS MODOS, decididos por una sola variable para que no puedan contradecirse:
 *
 * - `E2E_BASE_URL` AUSENTE → modo local/CI, idéntico al de siempre: baseURL
 *   `http://localhost:3000`, y si no hay dev server corriendo, Playwright lo
 *   levanta con `pnpm dev` (`reuseExistingServer: true`).
 * - `E2E_BASE_URL` PRESENTE → modo externo: se ataca ese servidor y NO se
 *   arranca ningún servidor propio. Es lo que usa el ensayo local de staging
 *   contra las imágenes equivalentes a producción.
 *
 * Una sola variable gobierna base y arranque: no existe el estado incoherente
 * «base externa pero además levanta `pnpm dev`», que es justo lo que ocurriría
 * con una segunda bandera independiente.
 *
 * La API vive fuera del `baseURL`; su base la resuelve `e2e/helpers.ts`
 * (`E2E_API_BASE_URL` → `NEXT_PUBLIC_API_BASE_URL` → `http://localhost:4000`).
 *
 * Solo Chromium y workers: 1 (decisiones del operador, Sprint 18).
 */

const LOCAL_BASE_URL = "http://localhost:3000";
const externalBaseUrl = process.env["E2E_BASE_URL"];

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: externalBaseUrl ?? LOCAL_BASE_URL,
    trace: "retain-on-failure",
    screenshot: "off",
    video: "off"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  // Solo en modo local: contra un servidor externo, arrancar `pnpm dev` sería a
  // la vez inútil y peligroso (competiría por el puerto 3000 del operador).
  ...(externalBaseUrl
    ? {}
    : {
        webServer: {
          command: "pnpm dev",
          url: LOCAL_BASE_URL,
          reuseExistingServer: true,
          timeout: 120_000
        }
      })
});
