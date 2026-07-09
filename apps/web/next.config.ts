import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autocontenido para la imagen Docker de staging (Sprint 20.1, ADR-0012).
  output: "standalone"
};

export default nextConfig;
