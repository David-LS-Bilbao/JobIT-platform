import { app } from "./app.js";
import { env } from "./config/env.js";
import {
  assertRuntimeDataModeContract,
  formatStartupGuardFailure
} from "./lib/database-safety.js";

/**
 * Guarda de arranque (Fase C — bloque 1). Se ejecuta ANTES de escuchar en el
 * puerto: reconcilia la clasificación de `DATABASE_URL` con `JOBIT_DATA_MODE`.
 *
 * Vive en el entrypoint del proceso y no en `app.ts` a propósito: `app.ts` lo
 * importan los tests de integración vía supertest, y una guarda de proceso no
 * debe ejecutarse por el hecho de construir la aplicación. La lógica es pura y
 * está cubierta por los tests de `database-safety`; aquí solo queda el punto de
 * llamada y la salida.
 *
 * El mensaje pertenece a un vocabulario cerrado: no imprime `DATABASE_URL`,
 * credenciales, secretos ni detalle de Prisma.
 */
try {
  assertRuntimeDataModeContract(process.env);
} catch (error: unknown) {
  console.error(formatStartupGuardFailure(error));
  process.exit(1);
}

const server = app.listen(env.PORT, () => {
  console.log(`JobIT API listening on port ${env.PORT}`);
});

const shutdown = (signal: NodeJS.Signals): void => {
  console.log(`${signal} received. Closing JobIT API.`);

  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
