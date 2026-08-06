# Informe técnico de remediación — B3-SUPPLY-01

**Fecha:** 2026-08-06<br>
**Tipo:** Remediación técnica de supply chain<br>
**Rama de trabajo:** `fix/b3-supply-01-nextjs-security-hardening`<br>
**Baseline:** `fbe6092e3dc1094e4741e24da74a9a7a8b61bba3`

---

## Tarea

Candidate-First Supply Chain Hardening — `B3-SUPPLY-01`.

Remediación técnica indivisible del production blocker `B3-SUPPLY-01` («Dependencia Next.js pendiente de actualización segura», `PRODUCTION_BLOCKER / P1 / OPEN`), registrado en `docs/product/current-project-state.md` §5 y en `docs/product/jobit-job-radar-candidate-discovery-strategy.md` §7.

## Objetivo

Salir del rango vulnerable oficial de Next.js mediante una actualización controlada y mínima, sin alterar comportamiento, sin ampliar alcance y sin actualizaciones ajenas:

```text
next:                16.2.9 → 16.2.12
eslint-config-next:  16.2.9 → 16.2.12
react:                19.2.4 (sin cambio)
react-dom:            19.2.4 (sin cambio)
```

## Baseline

```text
Repositorio:  git@github.com:David-LS-Bilbao/JobIT-platform.git
Ruta:          /home/david/projects/JobIT-platform
Rama base:     dev
Baseline:      fbe6092e3dc1094e4741e24da74a9a7a8b61bba3
```

`HEAD`, `dev` y `origin/dev` coincidían exactamente con el baseline al iniciar. Working tree limpio, staging vacío, sin commits locales divergentes y sin repositorios anidados.

## Nivel de riesgo

Nivel 3 (dependencia crítica / seguridad), conforme a `docs/agents/jobit-operating-model-v2.md` §5. Ejecución por gates técnicos con verificación completa y autorización Git separada.

## Advisory oficial

### July 2026 Security Release — nueve advisories oficiales

Fuente primaria: [July 2026 Security Release — nextjs.org](https://nextjs.org/blog/july-2026-security-release) y los advisories individuales de [`vercel/next.js`](https://github.com/vercel/next.js/security/advisories). Consultado el 2026-08-06.

La versión instalada (`16.2.9`) caía dentro del rango vulnerable de los nueve. La primera versión corregida de la rama Active LTS 16.2 es **`16.2.11`** (publicada el 21 de julio de 2026); la rama Maintenance LTS 15.5 se corrigió en `15.5.21`.

| # | GHSA | CVE | Severidad | Rango vulnerable (`next`) | Corregido en | Aplicabilidad observada en JobIT |
|---|---|---|---|---|---|---|
| 1 | [GHSA-m99w-x7hq-7vfj](https://github.com/vercel/next.js/security/advisories/GHSA-m99w-x7hq-7vfj) | CVE-2026-64641 | Alta | `>=13.0.0 <15.5.21`; `>=16.0.0 <16.2.11` | 16.2.11 | En rango. Precondición (App Router con ≥1 Server Action) **no presente**: 0 coincidencias de `'use server'` en `apps/web/src` |
| 2 | [GHSA-6gpp-xcg3-4w24](https://github.com/vercel/next.js/security/advisories/GHSA-6gpp-xcg3-4w24) | CVE-2026-64642 | Alta (CVSS 8.3) | `16.0.0 – 16.2.10` | 16.2.11 | En rango. Turbopack **sí** está en uso (bundler por defecto en Next.js 16; el build lo confirma). La no explotabilidad actual se sostiene **solo** en las otras dos precondiciones: `next.config.ts` no declara `i18n` y no existe `middleware.ts`/`middleware.tsx` |
| 3 | [GHSA-955p-x3mx-jcvp](https://github.com/vercel/next.js/security/advisories/GHSA-955p-x3mx-jcvp) | CVE-2026-64643 | Moderada | `>=13.0.0 <15.5.21`; `>=16.0.0 <16.2.11` | 16.2.11 | En rango. Precondición (Server Actions / `use cache`) **no presente** |
| 4 | [GHSA-q8wf-6r8g-63ch](https://github.com/advisories/GHSA-q8wf-6r8g-63ch) | CVE-2026-64644 | Moderada (CVSS 6.3) | `>=15.5.0 <15.5.21`; `>=16.0.0 <16.2.11` | 16.2.11 | En rango. Precondición (`images.remotePatterns` con optimización remota) **no presente**: `next.config.ts` no configura `images` |
| 5 | [GHSA-p9j2-gv94-2wf4](https://github.com/vercel/next.js/security/advisories/GHSA-p9j2-gv94-2wf4) | CVE-2026-64645 | Alta (CVSS 8.3) | `>=16.0.0 <16.2.11` | 16.2.11 | En rango. Precondición (`rewrites()`/`redirects()` con hostname derivado del request) **no presente**: ninguna de las dos claves existe en `next.config.ts` |
| 6 | [GHSA-4c39-4ccg-62r3](https://github.com/advisories/GHSA-4c39-4ccg-62r3) | CVE-2026-64646 | Moderada | rama 16.2.x previa a 16.2.11 | 16.2.11 | En rango. Precondición (Server Action + runtime Edge) **no presente**: 0 coincidencias de `export const runtime` |
| 7 | [GHSA-4633-3j49-mh5q](https://github.com/vercel/next.js/security/advisories/GHSA-4633-3j49-mh5q) | CVE-2026-64647 | Moderada | rama 16.2.x previa a 16.2.11 | 16.2.11 | En rango. Precondición (cuerpo con UTF-8 inválido y charset distinto de UTF-8 en `fetch` servidor) **no presente** |
| 8 | [GHSA-68g3-v927-f742](https://github.com/vercel/next.js/security/advisories/GHSA-68g3-v927-f742) | CVE-2026-64648 | Moderada | rama 16.2.x previa a 16.2.11 | 16.2.11 | En rango. Precondición (patrón `fetch(new Request(init), otroInit)`) **no presente**: 0 coincidencias de `new Request(` en `apps/web/src` |
| 9 | [GHSA-89xv-2m56-2m9x](https://github.com/vercel/next.js/security/advisories/GHSA-89xv-2m56-2m9x) | CVE-2026-64649 | Alta | `>=14.1.1 <15.5.21`; `>=16.0.0 <16.2.11` | 16.2.11 | En rango. Precondición (Server Action en servidor custom con control de cabeceras de Host) **no presente**; además la salida `standalone` fija el host desde 14.2+ |

### Advisory previo ya cubierto

[Next.js May 2026 security release](https://vercel.com/changelog/next-js-may-2026-security-release) (13 advisories, incluida CVE-2026-44578, SSRF por upgrade de WebSocket): corregidos en `16.2.5`. **NO_APLICA** — la versión instalada `16.2.9` ya los incorporaba.

### Lado React — no aplicable

[Critical Security Vulnerability in React Server Components — react.dev](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) / [GHSA-fv66-9v8q-g76r](https://github.com/advisories/GHSA-fv66-9v8q-g76r), CVE-2025-55182 (CVSS 10.0, RCE por deserialización). Rango afectado: `react`/`react-dom` `19.0`, `19.1.0`, `19.1.1`, `19.2.0`. Primera versión corregida: `19.0.1` / `19.1.2` / `19.2.1`.

`react` y `react-dom` estaban y siguen en **`19.2.4`**, por encima de la versión corregida. **NO_APLICA**: no requiere acción y no se modifican.

### Revalidación previa a la ejecución

Consultado el 2026-08-06, antes de editar ningún archivo:

- la vista general de advisories de `vercel/next.js` no registra publicaciones posteriores al 21 de julio de 2026;
- ningún advisory apunta a `16.2.12`;
- `next@16.2.12` en el registro npm: disponible, sin campo `deprecated`, `engines.node: ">=20.9.0"`, `peerDependencies` de `react`/`react-dom` idénticas a las de `16.2.9`;
- `eslint-config-next@16.2.12`: disponible, sin campo `deprecated`, peers `eslint >=9.0.0` y `typescript >=3.3.1`, ambos satisfechos.

## Aplicabilidad a JobIT

Los nueve advisories **aplicaban por rango de versión** del paquete `next` instalado (`16.2.9`, declarada y resuelta). Esa es la condición que sostiene el blocker.

De sus precondiciones adicionales de característica, todas resultaron ausentes en el código real salvo Turbopack, que sí está en uso por ser el bundler por defecto de Next.js 16 y no estar desactivado con `--webpack`. Para CVE-2026-64642, la baja explotabilidad actual se apoya exclusivamente en la ausencia de configuración `i18n` y de middleware/proxy aplicable, no en la ausencia de Turbopack.

La actualización procede igualmente: `B3-SUPPLY-01` está formulado como dependencia pendiente de actualización segura, no condicionado a la explotabilidad demostrada de un CVE concreto. Cerrar el rango vulnerable evita además depender de que esas características sigan sin usarse en el futuro.

## Versiones anteriores

| Paquete | Declarada | Resuelta |
|---|---|---|
| `next` | 16.2.9 | 16.2.9 |
| `eslint-config-next` | 16.2.9 | 16.2.9 |
| `react` | 19.2.4 | 19.2.4 |
| `react-dom` | 19.2.4 | 19.2.4 |

## Versión seleccionada

| Paquete | Declarada | Resuelta | Instalada en disco |
|---|---|---|---|
| `next` | 16.2.12 | 16.2.12 | 16.2.12 |
| `eslint-config-next` | 16.2.12 | 16.2.12 | 16.2.12 |
| `react` | 19.2.4 (sin cambio) | 19.2.4 | 19.2.4 |
| `react-dom` | 19.2.4 (sin cambio) | 19.2.4 | 19.2.4 |

## Justificación de versión

- **`16.2.11` es la primera versión corregida** oficialmente para los nueve advisories de julio de 2026 (publicada el 21 de julio de 2026).
- **`16.2.12` hereda esas correcciones** (publicada el 25 de julio de 2026). No aporta ninguna corrección de seguridad adicional propia: según sus notas de release oficiales, su contenido son los backports de documentación de julio y de compatibilidad con TypeScript 7.
- **`16.2.12` no se seleccionó por mayor rodaje.** Ambas versiones se publicaron con cuatro días de diferencia y la elección no se basa en tiempo de exposición. Se selecciona por ser el patch estable posterior y acotado dentro de la misma línea `16.2.x` ya en uso, cuyo contenido adicional documentado no toca comportamiento de runtime relevante para JobIT (el repositorio usa TypeScript `^5`, no TS7).
- **Mínima:** permanece en la misma línea minor que la versión previa; es el menor salto de superficie de cambio que incorpora el parche completo.
- **No se adopta `16.3.0`** (minor más reciente, `dist-tag latest`, publicada el 3 de agosto de 2026). No aporta ventaja de seguridad sobre `16.2.12` y mezclaría la remediación con una actualización de framework de alcance minor, cuya superficie de cambio no está auditada y excede una remediación de supply chain acotada e indivisible.
- **Sin impacto en Node ni en React:** `engines.node >=20.9.0` no cambia (CI usa `node-version: 20`; Docker usa `node:20-slim`) y el rango peer de React es idéntico, ya satisfecho por `19.2.4`.

## Dependencias modificadas

| Paquete | Antes | Después | Causa |
|---|---|---|---|
| `next` | 16.2.9 | 16.2.12 | Paquete vulnerable objeto del blocker |
| `eslint-config-next` | 16.2.9 | 16.2.12 | Dependencia compañera de tooling |

`eslint-config-next` **no es el paquete vulnerable**: ninguno de los nueve advisories lo nombra como afectado. Se actualiza para mantener alineado el tooling oficial de lint con la versión del framework en uso y conservar la convención de versionado idéntico ya empleada por el repositorio (ambos paquetes se publican en npm con el mismo número y en la misma fecha). No se afirma que exista una garantía oficial de compatibilidad exclusiva entre versiones exactas.

`react` y `react-dom` permanecen en **`19.2.4`**, sin cambio: ya son compatibles con el rango peer de `16.2.12` y ya están por encima de la versión corregida del CVE-2025-55182.

## Archivos modificados

```text
apps/web/package.json
pnpm-lock.yaml
docs/sprints/b3-supply-01-nextjs-security-hardening-final-report.md
```

Exactamente tres rutas, las únicas autorizadas. Ningún archivo de código, configuración, test, CI, Docker, backend, Prisma o snapshot global fue tocado.

## Estrategia de lockfile

1. Verificado `pnpm --version` == `10.0.0` (coincidente con `packageManager: pnpm@10.0.0` y `lockfileVersion: '9.0'`) antes de instalar.
2. Editados únicamente los dos literales de versión en `apps/web/package.json`.
3. Regeneración con `pnpm install` acotado. No se usó `pnpm update`, `--latest`, `pnpm add`, actualización recursiva ni otra versión de pnpm.
4. Auditoría del diff resultante.

### Resultado de la auditoría

- **Identidades de paquete totales:** 712 antes y 712 después. No se añadió ni eliminó ningún paquete.
- **Único importer modificado:** `apps/web`. Los bloques del importer raíz y de `apps/api` no cambian.
- **Únicos `specifier:` modificados:** dos (`16.2.9` → `16.2.12`), correspondientes a `next` y `eslint-config-next`.
- **Identidades `name@version` cambiadas: exactamente 12**, todas `16.2.9` → `16.2.12` y todas atribuibles causalmente a los dos paquetes objetivo:

```text
next
@next/env
@next/eslint-plugin-next
@next/swc-darwin-arm64      @next/swc-darwin-x64
@next/swc-linux-arm64-gnu   @next/swc-linux-arm64-musl
@next/swc-linux-x64-gnu     @next/swc-linux-x64-musl
@next/swc-win32-arm64-msvc  @next/swc-win32-x64-msvc
eslint-config-next
```

`@next/env` y los ocho binarios `@next/swc-*` son dependencias y `optionalDependencies` del propio `next`. `@next/eslint-plugin-next` es dependencia directa de `eslint-config-next`.

- **Tres paquetes aparecen en el diff sin cambiar de versión.** `eslint-plugin-import` (2.32.0), `eslint-import-resolver-typescript` (3.10.1) y `eslint-module-utils` (2.13.0) conservan exactamente su versión antes y después; lo único que cambia es su clave de resolución de peers en la sección `snapshots`, que pasa a llevar el contexto de peers completo. La causa es verificable en el propio lockfile: los dos primeros figuran como dependencias directas del bloque resuelto de `eslint-config-next@16.2.12`, y el tercero es dependencia de ellos. No es una actualización de dependencia ajena.

- **Sin versiones vulnerables residuales.** `grep -nE 'next@16\.2\.(9|10)([^0-9]|$)'` y su equivalente para `eslint-config-next` devuelven vacío.
- **Sin prereleases inesperadas** (`-canary`, `-preview`, `-rc`) en `next`, `eslint-config-next`, `react` ni `react-dom`.
- **Sin cambios** en paquetes de `apps/api`, Prisma o Express.

## Baseline previo

Todos los gates se ejecutaron sobre `next@16.2.9`, antes de editar ningún archivo, con `pnpm 10.0.0`.

| Gate | Exit code | Resultado |
|---|---|---|
| `pnpm --filter @jobit/web typecheck` | 0 | PASS |
| `pnpm --filter @jobit/web test` | 0 | PASS — 27 archivos, 404 tests |
| `pnpm --filter @jobit/web lint` | 0 | PASS, sin warnings |
| `pnpm --filter @jobit/web build` | 0 | PASS — 13 rutas, Turbopack |
| `pnpm --filter @jobit/web test:e2e` | 0 | PASS — 12/12 |
| `git diff --check` | 0 | PASS |
| `git status --short` | — | limpio |

Un primer intento de E2E se ejecutó sin PostgreSQL ni API disponibles y falló en 4 de 12 tests. Ese resultado se clasificó como `INCOMPLETE_E2E_TEST_HARNESS` —no como regresión de producto— y quedó resuelto al levantar el harness completo descrito abajo, con el que la suite pasa 12/12 sobre la versión sin modificar.

### Harness E2E utilizado

Reproducción local de los pasos ya definidos en `.github/workflows/e2e.yml`, sin modificar ningún archivo del repositorio y usando exclusivamente las variables de entorno dummy que el propio workflow versiona:

1. PostgreSQL 16 efímero en contenedor (`--rm`, sin volumen persistente, base `jobit_e2e`), equivalente al `services.postgres` del workflow;
2. `prisma generate`;
3. `prisma migrate deploy` (migraciones existentes, sin crear ni modificar ninguna);
4. `tsx prisma/seed.ts` (seed existente; 14 ofertas creadas);
5. `apps/api` compilado y arrancado en `:4000` con `NODE_ENV=production`;
6. healthcheck `GET /health` → `{"status":"ok","service":"jobit-api"}`;
7. web compilado y servido en `:3000`, reutilizado por Playwright vía `reuseExistingServer`;
8. `playwright test`.

La base de datos fue exclusivamente local, efímera y clasificada como E2E por la propia guarda `assertSeedableDatabaseUrl`. No se usaron datos reales, ni bases de desarrollo persistente, staging o producción, ni proveedores externos, ni se creó o modificó ningún `.env`.

## Tests y verificaciones posteriores

Ejecutados sobre `next@16.2.12`, con el mismo harness:

| Gate | Exit code | Resultado | Comparación con baseline |
|---|---|---|---|
| `pnpm --filter @jobit/web typecheck` | 0 | PASS | idéntico |
| `pnpm --filter @jobit/web test` | 0 | PASS — 27 archivos, 404 tests | idéntico |
| `pnpm --filter @jobit/web lint` | 0 | PASS, sin warnings | idéntico |
| `pnpm --filter @jobit/web build` | 0 | PASS — 13 rutas, mismo reparto estático/dinámico | idéntico |
| `pnpm --filter @jobit/web test:e2e` | 0 | PASS — 12/12 | idéntico |
| `pnpm install --frozen-lockfile` | 0 | PASS — «Already up to date» | reproducible |
| `git diff --check` | 0 | PASS | — |

Ningún test, configuración o código de aplicación fue modificado para conseguir estos resultados.

Los gates de calidad de `@jobit/api` (`prisma generate`, `typecheck`, `test`, `build`) se clasifican como **NO_NECESARIOS**: `next`, `react`, `react-dom` y `eslint-config-next` solo se declaran en `apps/web`, `apps/api` no los consume y el lockfile no registra ningún cambio en su importer. Arrancar la API para el E2E no convierte el backend en alcance técnico de esta remediación. La verificación del monorepo completo corresponde al CI del PR.

## Revisión de seguridad

```text
next declarado:                16.2.12
next resuelto:                 16.2.12
eslint-config-next declarado:  16.2.12
eslint-config-next resuelto:   16.2.12
react declarado/resuelto:      19.2.4
react-dom declarado/resuelto:  19.2.4
```

- La versión resuelta queda **fuera del rango vulnerable** de los nueve advisories de julio de 2026 (todos corregidos en `16.2.11`; `16.2.12` los hereda).
- No queda ningún advisory oficial aplicable identificado a fecha de esta ejecución.
- Sin versiones vulnerables residuales ni prereleases inesperadas en el lockfile.
- Sin secretos ni datos reales en el diff. No se creó ni modificó ningún `.env`; las variables usadas para el E2E son las dummy que el workflow ya versiona y se pasaron como variables de proceso.
- Sin llamadas a proveedores externos de empleo durante los tests.

## Diff

```text
apps/web/package.json |   4 +-
pnpm-lock.yaml        | 158 +++++++++++++++++++++++++-------------------------
docs/sprints/b3-supply-01-nextjs-security-hardening-final-report.md | (nuevo)
```

`apps/web/package.json` contiene exactamente dos reemplazos, sin cambios de formato, orden, scripts ni de ninguna otra dependencia:

```diff
-    "next": "16.2.9",
+    "next": "16.2.12",
-    "eslint-config-next": "16.2.9",
+    "eslint-config-next": "16.2.12",
```

## Riesgos

| Riesgo | Estado tras la ejecución |
|---|---|
| Versión propuesta aún afectada por algún advisory | Descartado: sin advisories posteriores al 21 de julio de 2026 y ninguno aplicable a `16.2.12` |
| Incompatibilidad Next–React–React DOM | Descartado: rango peer idéntico; typecheck, build y E2E en verde |
| Incompatibilidad con `eslint-config-next` | Descartado: lint en verde con la nueva versión |
| Requisito nuevo de Node o pnpm | Descartado: `engines.node >=20.9.0` sin cambio; pnpm `10.0.0` sin cambio |
| Cambios en App Router, routing o metadata | Descartado: mismo reparto de 13 rutas; E2E de metadata y navegación en verde |
| Actualización accidental de paquetes ajenos | Descartado: 712 → 712 identidades; 12 cambios, todos de las familias `next`/`eslint-config-next`/`@next/*` |
| Cambios transitivos masivos | Descartado: sin altas ni bajas de paquetes; tres entradas con cambio de clave de peers y versión intacta |
| Pérdida de reproducibilidad | Descartado: `--frozen-lockfile` en verde |
| Necesidad de tocar CI o Docker | Descartado: ningún cambio necesario |
| Baseline con fallos preexistentes | Resuelto: el fallo inicial era de harness incompleto, no de producto; baseline completo en verde antes de editar |

Deuda observada y **fuera de alcance**, sin corregir: el build emite un warning de raíz de workspace inferida por la presencia de un `pnpm-lock.yaml` ajeno en el directorio padre (`/home/david/projects/`), externo al repositorio; y `next start` advierte que no es el modo previsto para `output: "standalone"`. Ambas condiciones son preexistentes al baseline, no fueron introducidas por esta actualización y su corrección exigiría tocar archivos prohibidos.

## Rollback

```bash
git checkout fbe6092e3dc1094e4741e24da74a9a7a8b61bba3 -- apps/web/package.json pnpm-lock.yaml
pnpm install --frozen-lockfile
pnpm --filter @jobit/web typecheck
pnpm --filter @jobit/web test
pnpm --filter @jobit/web lint
pnpm --filter @jobit/web build
git status --short
```

El informe puede eliminarse por separado si se descarta la remediación completa. Condiciones que obligarían a ejecutar rollback: aparición de un advisory que invalide `16.2.12`, retirada o deprecación de la versión, o cualquier gate en rojo atribuible al cambio.

## Fuera de alcance respetado

No se tocó ni se propuso tocar: `B3-ABUSE-01`, rate limiting, `B3-BACKUP-01`, backup/restore, `S22-PRIV-01`, privacidad, ciclo de vida de cuenta, gestión transversal de 401, autenticación, autorización, backend, Prisma, schema, migraciones, base de datos, endpoints, contratos HTTP, DTO, UI, diseño, Job Radar, Recruit, Candidate Discovery, proveedores externos, integraciones, refactors generales, rendimiento, actualización masiva de dependencias, migración de framework, gestor de paquetes, monorepo, Node, CI, Docker, staging, producción, despliegue, secretos ni datos personales.

`docs/product/current-project-state.md` **no se modifica**: la actualización del snapshot global corresponde a una decisión posterior del Orquestador.

## Estado Git

```text
Rama:            fix/b3-supply-01-nextjs-security-hardening
HEAD:            fbe6092e3dc1094e4741e24da74a9a7a8b61bba3
Working tree:    3 archivos modificados/creados (los tres autorizados)
Staging:          vacío
Commits propios: 0
Push / PR / Merge / Deploy: ninguno
```

## Estado

```text
IMPLEMENTATION_STATUS:
READY_FOR_REVIEW

B3-SUPPLY-01:
PENDING_COMMIT_PR_CI_AND_MERGE
```
