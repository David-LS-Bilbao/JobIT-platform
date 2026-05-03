import dotenv from "dotenv";

dotenv.config();

const parsePort = (value: string | undefined): number => {
  const port = Number(value ?? 4000);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer.");
  }

  return port;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parsePort(process.env.PORT),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000"
};
