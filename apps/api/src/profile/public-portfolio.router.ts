import { Router, type NextFunction, type Request, type Response } from "express";

import { getPublicPortfolioBySlug } from "./public-portfolio.service.js";

/**
 * Router PÚBLICO del portfolio. Montado en `/api/public` — sin `requireAuth`.
 * 404 uniforme para slug inválido / inexistente / no publicado.
 */
export const publicPortfolioRouter = Router();

publicPortfolioRouter.get(
  "/portfolios/:slug",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await getPublicPortfolioBySlug(req.params["slug"] as string);
      if (!dto) {
        res.status(404).json({ error: { code: "NOT_FOUND", message: "Portfolio no encontrado." } });
        return;
      }
      res.status(200).json(dto);
    } catch (err) {
      next(err);
    }
  }
);
