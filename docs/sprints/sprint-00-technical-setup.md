# Sprint 00: Setup tecnico inicial del monorepo

## Objetivo

Crear la base minima del monorepo TypeScript de JobIT-platform para poder iniciar despues la configuracion tecnica de frontend, backend, base de datos y tests sin mezclarla con funcionalidades del MVP.

Este sprint prepara el repositorio, no implementa producto.

## Alcance

- Crear `package.json` raiz privado con scripts comunes.
- Crear `pnpm-workspace.yaml` para `apps/*` y `packages/*`.
- Crear `tsconfig.base.json` estricto y reutilizable.
- Crear `.gitignore` para Node, Next.js, TypeScript, Prisma futuro, entornos locales y editores.
- Crear `.env.example` con variables placeholder sin secretos reales.
- Crear carpetas base `apps/` y `packages/` con `.gitkeep`.
- Documentar el alcance y verificaciones de este sprint.

## Fuera de alcance

- Crear `apps/api`.
- Crear `apps/web`.
- Instalar dependencias.
- Crear backend Express funcional.
- Crear frontend Next.js funcional.
- Crear Prisma, schema, migraciones o seeds.
- Crear Docker o CI/CD.
- Implementar endpoints, pantallas, autenticacion o features del MVP.
- Introducir secretos reales.

## Fases previstas

1. Base raiz del monorepo: `package.json`, workspaces y configuracion TypeScript base.
2. Preparacion de carpetas: `apps/` y `packages/` sin aplicaciones funcionales.
3. Variables y seguridad local: `.env.example` y `.gitignore`.
4. Documentacion de sprint y verificaciones.
5. Siguiente sprint tecnico: crear `apps/api` y `apps/web` en prompts separados.

## Criterios de aceptacion

- [ ] La rama activa es `feat/sprint-00-technical-setup`.
- [ ] El working tree contiene solo cambios esperados del setup tecnico minimo.
- [ ] Existe `package.json` raiz privado.
- [ ] Existe `pnpm-workspace.yaml`.
- [ ] Existe `tsconfig.base.json`.
- [ ] Existen `apps/` y `packages/`.
- [ ] Existe `.env.example` sin secretos reales.
- [ ] Existe este documento de sprint.
- [ ] No se crean aplicaciones funcionales ni features.
- [ ] No se instalan dependencias.

## Comandos de verificacion

```bash
git branch --show-current
git status --short
find . -maxdepth 3 -type f | sort
git diff --check
git diff --stat
```

## Nota sobre dependencias

No se ejecuta `pnpm install` en este paso. La instalacion de dependencias queda para un prompt posterior, cuando se creen las aplicaciones o paquetes concretos que las necesiten.
