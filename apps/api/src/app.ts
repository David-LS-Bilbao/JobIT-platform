import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { rateLimitConfig } from "./config/rate-limit.config.js";
import { authRouter } from "./auth/auth.router.js";
import { dashboardRouter } from "./dashboard/dashboard.router.js";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { requestIdMiddleware } from "./middlewares/request-id.middleware.js";
import {
  generalRateLimiter,
  loginRateLimiter,
  publicReadRateLimiter,
  registerRateLimiter
} from "./middlewares/rate-limit.middleware.js";
import { jobsRouter } from "./jobs/jobs.router.js";
import { savedJobsRouter } from "./saved-jobs/saved-jobs.router.js";
import { matchRouter } from "./match/match.router.js";
import { profileRouter } from "./profile/profile.router.js";
import { portfolioRouter } from "./profile/portfolio.router.js";
import { publicPortfolioRouter } from "./profile/public-portfolio.router.js";
import { UPLOADS_ROOT } from "./profile/avatar.storage.js";
import { healthRouter } from "./routes/health.routes.js";
import { readyRouter } from "./routes/ready.routes.js";

export const app = express();

app.disable("x-powered-by");

// Número de saltos de proxy de confianza (B3-ABUSE-01, spec api-rate-limiting).
// Debe fijarse ANTES de que cualquier limitador lea `req.ip`. Nunca `true`: eso
// haría que Express tomase el extremo izquierdo de `X-Forwarded-For`, que el
// cliente controla, permitiendo falsificar la IP y evadir el límite.
// 0 en local/test/CI (sin proxy); 1 en staging/producción tras Nginx Proxy Manager.
app.set("trust proxy", rateLimitConfig.trustProxyHops);

// Identificador de correlacion ANTES de cualquier router y de los limitadores:
// toda traza de error debe poder unirse con su respuesta, incluidos los 429 y
// los fallos que ocurren dentro de un limitador (AUDIT05-OPS-PROD-ERROR-LOG-01).
app.use(requestIdMiddleware);

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check ANTES de los limitadores: `GET /health` queda exento por montaje,
// no por lista de exclusión. Es la sonda de liveness de NPM, Docker y CI.
app.use(healthRouter);

// Readiness DB-aware, exenta por el mismo mecanismo de montaje. Responde a una
// pregunta distinta de `/health`: no si el proceso vive, sino si puede servir
// (ver `routes/ready.routes.ts`). El cableado del healthcheck de Docker contra
// esta ruta pertenece al bloque de infraestructura, todavía no autorizado.
app.use(readyRouter);

// Almacenamiento local MVP de avatares: servido estáticamente. `Cross-Origin-Resource-Policy: cross-origin`
// permite que el frontend (otro origen) pinte la imagen pese al CORP same-origin por defecto de helmet.
app.use(
  "/uploads",
  generalRateLimiter,
  express.static(UPLOADS_ROOT, {
    index: false,
    dotfiles: "ignore",
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    }
  })
);

// Limitadores reforzados antes del general: sobre rutas más específicas, de modo
// que agotar el cupo reforzado corta aunque quede cupo general. Estas superficies
// consumen ambos limitadores.
app.use("/api/auth/register", registerRateLimiter);
app.use("/api/auth/login", loginRateLimiter);
app.use("/api/public/portfolios", publicReadRateLimiter);

// Limitador general de la API. No se monta sobre toda la app para preservar la
// exención de `GET /health`.
app.use("/api", generalRateLimiter);

app.use("/api/auth", authRouter);
// Rutas de gestión del portfolio (más específicas): antes del router de profile.
app.use("/api/profile/me/portfolio", portfolioRouter);
app.use("/api/profile", profileRouter);
// Portfolio público (sin auth): read model por whitelist.
app.use("/api/public", publicPortfolioRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/saved-jobs", savedJobsRouter);
// Match expone rutas en dos namespaces (/api/jobs/:id/match y /api/profile/me/matches);
// se monta en /api con rutas completas para no tocar los routers de Jobs ni Profile.
app.use("/api", matchRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);
