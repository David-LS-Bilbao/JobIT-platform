import { defineConfig, devices } from "@playwright/test";

/**
 * Config E2E smoke del flujo candidato (Sprint 18).
 *
 * - Reutiliza el dev server del operador en :3000 si ya está corriendo
 *   (`reuseExistingServer: true`); si no, lo levanta con `pnpm dev`.
 * - La API debe estar viva en http://localhost:4000 para las rutas que
 *   dependen del backend (p. ej. /u/[slug]); este config NO la arranca.
 * - Solo Chromium y workers: 1 (decisiones del operador, Sprint 18).
 */
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
    baseURL: "http://localhost:3000",
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
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000
  }
});
