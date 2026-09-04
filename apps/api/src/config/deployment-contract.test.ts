import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { classifyDatabaseName } from "../lib/database-safety.js";
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

/**
 * Elimina las lineas de comentario de un YAML/env.
 *
 * Las invariantes de configuracion se afirman sobre la configuracion EFECTIVA.
 * Un comentario que nombra `change_me` o un volumen protegido esta explicando
 * precisamente por que no deben aparecer; tratarlo como una violacion obligaria
 * a borrar la explicacion, que es justo lo que hace util al fichero.
 */
function withoutComments(contents: string): string {
  return contents
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n");
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

  /**
   * ENMIENDA DE LA FASE C. Antes, este bloque exigia `TRUST_PROXY_HOPS: 0`
   * literal en `docker-compose.staging.yml`, porque ese fichero era el compose
   * del SMOKE LOCAL. Desde la fase C ese fichero es el CONTRATO CANONICO de
   * staging, donde el valor correcto es 1 y llega por interpolacion desde el
   * `.env` real. El 0 literal se conserva —y se sigue exigiendo— en el compose
   * del ENSAYO, que es donde de verdad no hay proxy delante.
   */
  it("el compose canonico toma el valor por interpolacion obligatoria, sin literal", () => {
    const compose = readRepoFile("docker-compose.staging.yml");
    expect(compose).toMatch(/TRUST_PROXY_HOPS:\s*\$\{TRUST_PROXY_HOPS:\?/);
    expect(compose).not.toMatch(/TRUST_PROXY_HOPS:\s*[01]\s*$/m);
  });

  it("el compose del ensayo declara 0: ahi no hay reverse proxy", () => {
    const compose = readRepoFile("docker-compose.staging.rehearsal.yml");
    expect(compose).toMatch(/TRUST_PROXY_HOPS:\s*0/);
  });

  it("las plantillas nunca declaran `true`, que permitiria falsificar la IP", () => {
    for (const file of [
      "apps/api/.env.example",
      ".env.staging.example",
      "docker-compose.staging.yml",
      "docker-compose.staging.rehearsal.yml"
    ]) {
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

/**
 * Fase C — contrato del compose CANONICO de staging sintetico.
 *
 * Estos tests fijan invariantes de seguridad y de despliegue, no formato: que la
 * base nunca se exponga, que no queden secretos de ejemplo utilizables, que un
 * arranque sin `.env` falle en vez de improvisar valores, y que las imagenes
 * sean inmutables. Todo eso solo puede regresar en silencio si nadie lo prueba.
 */
describe("docker-compose.staging.yml — contrato canonico de staging", () => {
  const compose = (): string => readRepoFile("docker-compose.staging.yml");

  const REQUIRED_INTERPOLATED = [
    "POSTGRES_PASSWORD",
    "DATABASE_URL",
    "JWT_ACCESS_SECRET",
    "CORS_ORIGIN",
    "TRUST_PROXY_HOPS",
    "JOBIT_DATA_MODE",
    "NEXT_PUBLIC_API_BASE_URL",
    "NEXT_PUBLIC_PUBLIC_BASE_URL",
    "NEXT_PUBLIC_JOBIT_DATA_MODE",
    "JOBIT_IMAGE_TAG"
  ] as const;

  it("exige TODAS las variables obligatorias con interpolacion fail-closed", () => {
    const contents = compose();
    for (const name of REQUIRED_INTERPOLATED) {
      expect(contents).toMatch(new RegExp(`\\$\\{${name}:\\?`));
    }
  });

  // El riesgo numero 1 de ADR-0012: un descuido de firewall convierte un puerto
  // publicado en una DB publica. Aqui no puede haber NINGUN puerto de host.
  it("no publica ningun puerto al host en ningun servicio", () => {
    const contents = compose();
    expect(contents).not.toMatch(/^\s*ports:\s*$/m);
    expect(contents).not.toMatch(/^\s*-\s*"?\d+:\d+"?\s*$/m);
  });

  it("no contiene secretos de ejemplo utilizables", () => {
    const contents = withoutComments(compose());
    expect(contents).not.toMatch(/change[_-]?me/i);
    expect(contents).not.toMatch(/jobit_staging_password/);
  });

  // Un tag movil hace indistinguibles «reiniciar» y «desplegar», y permite que
  // `up -d` recupere una imagen antigua del host sin que nadie lo note.
  it("referencia las imagenes por un tag inmutable, nunca latest ni staging-local", () => {
    const contents = compose();
    expect(contents).toMatch(/image:\s*jobit-api:\$\{JOBIT_IMAGE_TAG:\?/);
    expect(contents).toMatch(/image:\s*jobit-web:\$\{JOBIT_IMAGE_TAG:\?/);
    expect(contents).not.toMatch(/jobit-(api|web):latest/);
    expect(contents).not.toMatch(/jobit-(api|web):staging-local/);
  });

  // Sin `build:`, `docker compose up` no puede construir ni reutilizar en
  // silencio: el build es un paso explicito y auditable del runbook.
  it("no declara build: el build es un paso explicito y separado", () => {
    expect(compose()).not.toMatch(/^\s*build:/m);
  });

  it("declara la red estable a la que NPM se unira en la fase D", () => {
    expect(compose()).toMatch(/name:\s*jobit-staging\s*$/m);
  });

  it("el healthcheck de la API usa /ready, no /health", () => {
    const contents = compose();
    expect(contents).toMatch(/localhost:4000\/ready/);
    expect(contents).not.toMatch(/localhost:4000\/health/);
  });
});

describe("docker-compose.staging.rehearsal.yml — aislamiento del ensayo", () => {
  const rehearsal = (): string => readRepoFile("docker-compose.staging.rehearsal.yml");

  it("exige JSR_RUN_ID y deriva de el el nombre del proyecto", () => {
    expect(rehearsal()).toMatch(/name:\s*jobit-staging-rehearsal-\$\{JSR_RUN_ID:\?/);
  });

  // Si el ensayo reutilizara el proyecto o los volumenes reales, un `down -v`
  // destruiria el staging de verdad.
  it("no nombra NINGUN recurso protegido del staging real", () => {
    const contents = withoutComments(rehearsal());
    for (const protectedName of [
      "jobit-staging-db-data",
      "jobit-staging-api-uploads",
      "jobit-postgres-test"
    ]) {
      expect(contents).not.toContain(protectedName);
    }
  });

  it("no declara ningun volumen external: `down -v` solo puede tocar los suyos", () => {
    expect(rehearsal()).not.toMatch(/external:\s*true/);
  });

  it("la base del ensayo no publica puerto y su nombre clasifica STAGING", () => {
    const contents = withoutComments(rehearsal());
    expect(contents).toMatch(/JSR_DB_NAME:\?/);
    expect(readRepoFile("scripts/operations/staging/run-local-rehearsal.sh")).toMatch(
      /JSR_DB_NAME="jobit_rehearsal_staging"/
    );
    // Solo API y Web publican, y siempre en loopback.
    const published = contents.match(/^\s*-\s*"127\.0\.0\.1:/gm) ?? [];
    expect(published).toHaveLength(2);
    expect(contents).not.toMatch(/^\s*-\s*"?0\.0\.0\.0:/m);
  });

  it("las imagenes del ensayo van etiquetadas por RUN_ID", () => {
    const contents = withoutComments(rehearsal());
    expect(contents).toMatch(/image:\s*jobit-api:rehearsal-\$\{JSR_RUN_ID\}/);
    expect(contents).toMatch(/image:\s*jobit-web:rehearsal-\$\{JSR_RUN_ID\}/);
    expect(contents).not.toMatch(/staging-local|:latest/);
  });
});

describe("JOBIT_DATA_MODE — contrato de despliegue", () => {
  it("la plantilla de staging declara el modo sintetico", () => {
    expect(readEnvValue(readRepoFile(".env.staging.example"), "JOBIT_DATA_MODE")).toBe(
      "SYNTHETIC_STAGING"
    );
  });

  it("la plantilla de staging declara tambien el equivalente publico", () => {
    expect(
      readEnvValue(readRepoFile(".env.staging.example"), "NEXT_PUBLIC_JOBIT_DATA_MODE")
    ).toBe("SYNTHETIC_STAGING");
  });

  // Se inlinea en el build de Next: si no llega como build-arg, no llega nunca y
  // el entorno no queda identificado visiblemente como sintetico.
  it("el Dockerfile de la web lo recibe como ARG y lo expone como ENV", () => {
    const dockerfile = readRepoFile("apps/web/Dockerfile");
    expect(dockerfile).toMatch(/ARG NEXT_PUBLIC_JOBIT_DATA_MODE/);
    expect(dockerfile).toMatch(
      /ENV NEXT_PUBLIC_JOBIT_DATA_MODE=\$NEXT_PUBLIC_JOBIT_DATA_MODE/
    );
  });

  // La guarda de arranque solo exige el modo cuando la base clasifica STAGING:
  // si el nombre de la plantilla dejara de clasificar asi, la guarda quedaria
  // inactiva en el entorno para el que se diseno, en silencio.
  it("el nombre de base de la plantilla de staging clasifica STAGING", () => {
    const url = readEnvValue(readRepoFile(".env.staging.example"), "DATABASE_URL");
    expect(url).not.toBeNull();
    const databaseName = new URL(url ?? "").pathname.replace(/^\//, "");
    expect(classifyDatabaseName(databaseName)).toBe("STAGING");
  });

  it("no existe ninguna segunda llave de seed en las plantillas ni en el compose", () => {
    for (const file of [
      ".env.staging.example",
      "docker-compose.staging.yml",
      "docker-compose.staging.rehearsal.yml"
    ]) {
      const contents = readRepoFile(file);
      expect(contents).not.toMatch(/JOBIT_SEED_SYNTHETIC_STAGING/);
      expect(contents).not.toMatch(/ALLOW_SEED/);
      expect(contents).not.toMatch(/FORCE_SEED/);
      expect(contents).not.toMatch(/HIGHER_E2E_RATE_LIMITS/);
    }
  });

  // Los limites canonicos no se relajan para acomodar tests: el Golden staging
  // se diseno para caber en ellos.
  it("la plantilla de staging no declara ningun limite de rate elevado", () => {
    const contents = readRepoFile(".env.staging.example");
    for (const name of [
      "RATE_LIMIT_MAX",
      "AUTH_LOGIN_MAX",
      "AUTH_REGISTER_MAX",
      "PUBLIC_READ_MAX"
    ]) {
      expect(readEnvValue(contents, name)).toBeNull();
    }
  });
});
