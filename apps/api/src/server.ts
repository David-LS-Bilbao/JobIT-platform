import { app } from "./app.js";
import { env } from "./config/env.js";

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
