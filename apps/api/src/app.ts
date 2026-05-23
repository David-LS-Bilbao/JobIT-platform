import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { authRouter } from "./auth/auth.router.js";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { healthRouter } from "./routes/health.routes.js";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json());

app.use(healthRouter);
app.use("/api/auth", authRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);
