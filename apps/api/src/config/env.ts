import dotenv from "dotenv";

dotenv.config();

const parsePort = (value: string | undefined): number => {
  const port = Number(value ?? 4000);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer.");
  }

  return port;
};

// Opcional: normaliza string vacío o con espacios a undefined.
const optionalString = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parsePort(process.env.PORT),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  // Opcional y solo backend: si falta no rompe dev/test. Se exigirá en Fase 4
  // al activar el cliente real de Jooble. Nunca loguear ni exponer su valor.
  JOOBLE_API_KEY: optionalString(process.env.JOOBLE_API_KEY)
};
