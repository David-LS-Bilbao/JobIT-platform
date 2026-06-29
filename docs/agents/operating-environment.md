# Entorno operativo JobIT

## Decisión

El entorno principal de desarrollo y verificación de JobIT es el **clon nativo de WSL2 (Ubuntu)**, en filesystem Linux nativo:

```txt
/home/david/projects/JobIT-platform
```

Todas las instalaciones, tests, build y generación de Prisma deben ejecutarse desde esta ruta.

> **Excepción macOS (autorizada).** Además del clon WSL, puede usarse un **clon nativo de macOS independiente** (p. ej. `/Users/david_mac/JobIT-platform`) **solo cuando el usuario lo autoriza explícitamente**. No es un sustituto general: WSL sigue siendo el entorno recomendado/mandatado para evitar conflictos de OneDrive/Windows. **Nunca** usar rutas OneDrive/Windows compartidas, y no presentar macOS como entorno por defecto si no está provisionado (base de datos, `.env`).

## Motivo

No debe usarse el checkout de Windows/OneDrive para ejecutar `pnpm install`, tests, build ni Prisma. Compartir el mismo `node_modules` entre Windows/Git Bash y WSL sobre la carpeta de OneDrive provoca conflictos con dependencias nativas: los bindings compilados son específicos del sistema operativo y un `install` desde un entorno deja el otro inservible.

Caso detectado (post-merge del Sprint 06):

- Vitest/Rolldown falló al arrancar por un binding nativo faltante/incompatible.
- Error relacionado con `@rolldown/binding-linux-x64-gnu`.
- El problema **no era de código**: la suite ya había pasado 278/278 previamente.
- Se resolvió al usar un clon nativo de WSL fuera de OneDrive; tras migrar, `dev` quedó verificado (suite 278/278, typecheck y build en verde).

## Rutas

Ruta recomendada (ejecución de tooling):

```txt
/home/david/projects/JobIT-platform
```

Rutas a evitar para ejecutar herramientas:

```txt
/mnt/c/Users/David/OneDrive/...
C:\Users\David\OneDrive\...
```

La carpeta de Windows/OneDrive puede conservarse como referencia o copia antigua, pero **no** debe usarse para ejecutar `pnpm install`, tests, build ni Prisma.

## Comandos habituales

```bash
cd /home/david/projects/JobIT-platform
git checkout dev
git pull --ff-only origin dev
pnpm install --frozen-lockfile
pnpm --filter @jobit/api exec prisma generate
pnpm --filter @jobit/api test
pnpm --filter @jobit/api typecheck
pnpm --filter @jobit/api build
git status --short
```

`prisma generate` puede ser necesario tras instalar dependencias en un clon nuevo, porque el proyecto no tiene un hook `postinstall` que lo ejecute automáticamente. Si `@prisma/client` no expone sus tipos (errores `TS2305` sobre miembros no exportados), ejecuta `prisma generate` y vuelve a verificar.

## Variables locales

- `apps/api/.env.test` es un fichero **local**.
- Está **ignorado por Git** (`.gitignore`: `.env.*`) y **no debe versionarse**.
- **No** debe mostrarse ni copiarse a un chat o log (contiene la cadena de conexión de la DB de test).
- Se usa para los tests de integración (provee `DATABASE_URL_TEST` / `DATABASE_URL`).
- Si falta, los tests fallan en `globalSetup` (`prisma migrate deploy` sin URL de base de datos).

No se documentan valores reales de variables.

## Reglas para agentes

- No ejecutar `pnpm install` en `/mnt/c/.../OneDrive`.
- No compartir `node_modules` entre Windows y WSL.
- No copiar `node_modules` entre entornos.
- No usar `npm install`.
- No generar `package-lock.json`.
- No modificar lockfiles salvo en una tarea explícitamente autorizada.
- Ejecutar las verificaciones siempre desde el clon nativo de WSL.
- Ante un fallo de binding nativo (p. ej. Rolldown/Vitest), revisar primero el entorno antes de tocar código.

## Checklist de verificación

```bash
pwd
uname -a
node -v
pnpm -v
git status --short
pnpm --filter @jobit/api test
pnpm --filter @jobit/api typecheck
pnpm --filter @jobit/api build
```
