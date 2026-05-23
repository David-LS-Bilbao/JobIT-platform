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
    env: {
      DATABASE_URL: process.env["DATABASE_URL_TEST"] ?? "",
      DATABASE_URL_TEST: process.env["DATABASE_URL_TEST"] ?? "",
      NODE_ENV: "test"
    }
  }
});
