import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, ".env.test") });

export default defineConfig({
  test: {
    globalSetup: ["./src/tests/setup.ts"],
    include: ["src/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    // Estabilización de la suite de integración real (PostgreSQL + bcryptjs + cientos
    // de peticiones HTTP secuenciales en un solo proceso). Cada fichero pasa al 100%
    // en aislamiento; en la suite completa, bajo carga, aparecían fallos NO
    // deterministas y ajenos a la lógica: timeouts del default de 5000 ms y
    // desconexiones transitorias ("socket hang up") por el servidor efímero que
    // supertest levanta por petición y el bloqueo del event loop durante bcryptjs.
    // - `testTimeout`/`hookTimeout`: margen para los tests/hooks más pesados.
    // - `retry`: reintenta un test fallido hasta 2 veces. NO oculta bugs de lógica
    //   (un fallo real falla los 3 intentos); solo tolera el ruido transitorio de
    //   infra. No cambia comportamiento del producto ni contratos ni asserts.
    testTimeout: 30000,
    hookTimeout: 30000,
    retry: 2,
    env: {
      DATABASE_URL: process.env["DATABASE_URL_TEST"] ?? "",
      DATABASE_URL_TEST: process.env["DATABASE_URL_TEST"] ?? "",
      NODE_ENV: "test"
    }
  }
});
