import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { resolveRateLimitConfig } from "./rate-limit.config.js";

/**
 * Contrato de despliegue versionado.
 *
 * `AUDIT05-DEPLOY-PROXY-RATELIMIT-01` no era un defecto de codigo: el cableado de
 * `TRUST_PROXY_HOPS` ya existia y estaba probado. Lo que faltaba era que el valor
 * correcto para staging estuviera VERSIONADO en la plantilla de entorno, de modo
 * que no dependa de que alguien lo recuerde al desplegar.
 *
 * Estos tests leen las plantillas reales del repositorio: si alguien las cambia,
 * el contrato falla aqui en lugar de fallar en produccion.
 */

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

/** Lee `CLAVE=valor` de una plantilla de entorno, ignorando comentarios y comillas. */
function readEnvValue(contents: string, key: string): string | null {
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    if (trimmed.slice(0, separator).trim() !== key) continue;
    return trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return null;
}

describe("TRUST_PROXY_HOPS — contrato de despliegue", () => {
  // El default seguro NO se toca: subirlo a 1 globalmente haria que cualquier
  // entorno sin proxy aceptase `X-Forwarded-For` del cliente.
  it("mantiene el default del codigo en 0 cuando no hay variable", () => {
    expect(resolveRateLimitConfig({ NODE_ENV: "production" }).trustProxyHops).toBe(0);
  });

  it("la plantilla de la API declara 0: local, test y CI no tienen proxy delante", () => {
    expect(readEnvValue(readRepoFile("apps/api/.env.example"), "TRUST_PROXY_HOPS")).toBe("0");
  });

  // Staging va detras de UN salto de Nginx Proxy Manager. El valor tiene que
  // viajar versionado en la plantilla, no en la memoria de quien despliega.
  it("la plantilla de staging declara 1: un unico salto de NPM", () => {
    expect(readEnvValue(readRepoFile(".env.staging.example"), "TRUST_PROXY_HOPS")).toBe("1");
  });

  it("el valor de staging es aceptado por el parser de configuracion", () => {
    const staged = readEnvValue(readRepoFile(".env.staging.example"), "TRUST_PROXY_HOPS");
    const config = resolveRateLimitConfig({
      NODE_ENV: "production",
      TRUST_PROXY_HOPS: staged ?? ""
    });
    expect(config.trustProxyHops).toBe(1);
  });

  it("el compose del smoke local declara 0: ahi no hay reverse proxy", () => {
    const compose = readRepoFile("docker-compose.staging.yml");
    expect(compose).toMatch(/TRUST_PROXY_HOPS:\s*0/);
  });

  it("las plantillas nunca declaran `true`, que permitiria falsificar la IP", () => {
    for (const file of ["apps/api/.env.example", ".env.staging.example", "docker-compose.staging.yml"]) {
      expect(readRepoFile(file)).not.toMatch(/TRUST_PROXY_HOPS\s*[:=]\s*true/i);
    }
  });
});

describe("NEXT_PUBLIC_PUBLIC_BASE_URL — contrato de despliegue", () => {
  // `AUDIT03-URL-SCHEME-01`: sin esta variable, un entorno desplegado no puede
  // ofrecer enlace ni QR del portfolio publico.
  it("la plantilla de staging la declara con https", () => {
    const value = readEnvValue(readRepoFile(".env.staging.example"), "NEXT_PUBLIC_PUBLIC_BASE_URL");
    expect(value).not.toBeNull();
    expect(value).toMatch(/^https:\/\//);
  });

  // Se inlinea en el build de Next: si no llega como build-arg, no llega nunca.
  it("el Dockerfile de la web la recibe como ARG y la expone como ENV", () => {
    const dockerfile = readRepoFile("apps/web/Dockerfile");
    expect(dockerfile).toMatch(/ARG NEXT_PUBLIC_PUBLIC_BASE_URL/);
    expect(dockerfile).toMatch(/ENV NEXT_PUBLIC_PUBLIC_BASE_URL=\$NEXT_PUBLIC_PUBLIC_BASE_URL/);
  });

  it("el compose la pasa como build-arg a la imagen web", () => {
    const compose = readRepoFile("docker-compose.staging.yml");
    expect(compose).toMatch(/NEXT_PUBLIC_PUBLIC_BASE_URL:/);
  });
});
