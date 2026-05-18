import type { ErrorRequestHandler } from "express";

export const errorHandlerMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : "Unexpected error.";
  const responseMessage =
    process.env.NODE_ENV === "production" ? "Internal server error." : message;

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: responseMessage
    }
  });
};
