import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { authRouter } from "./auth/auth.router.js";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { jobsRouter } from "./jobs/jobs.router.js";
import { savedJobsRouter } from "./saved-jobs/saved-jobs.router.js";
import { matchRouter } from "./match/match.router.js";
import { profileRouter } from "./profile/profile.router.js";
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
app.use(cookieParser());

app.use(healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/saved-jobs", savedJobsRouter);
// Match expone rutas en dos namespaces (/api/jobs/:id/match y /api/profile/me/matches);
// se monta en /api con rutas completas para no tocar los routers de Jobs ni Profile.
app.use("/api", matchRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);
