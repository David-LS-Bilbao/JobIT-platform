# Sprint 00: Setup tecnico inicial del monorepo

## Objetivo

Crear la base tecnica inicial del monorepo TypeScript de JobIT-platform y dejar un backend API minimo verificable, sin implementar funcionalidades del MVP.

Este sprint prepara el repositorio para desarrollo posterior: estructura raiz, workspace pnpm, configuracion TypeScript, API Express minima, endpoint tecnico de salud y smoke test. No implementa producto ni reglas funcionales de negocio.

## Alcance

- Crear `package.json` raiz privado con scripts comunes.
- Crear `pnpm-workspace.yaml` para `apps/*` y `packages/*`.
- Crear `tsconfig.base.json` estricto y reutilizable.
- Crear `.gitignore` para Node, Next.js, TypeScript, Prisma futuro, entornos locales y editores.
- Crear `.env.example` con variables placeholder sin secretos reales.
- Crear estructura base de `apps/` y `packages/`.
- Crear `apps/api` como skeleton tecnico de backend.
- Configurar Express minimo con TypeScript.
- Crear middleware tecnico base para errores y rutas no encontradas.
- Crear endpoint tecnico `GET /health`.
- Crear smoke test tecnico de `GET /health` con Vitest y Supertest.
- Instalar dependencias minimas de backend y testing.
- Crear `pnpm-lock.yaml` asociado a las dependencias instaladas.
- Documentar el alcance y verificaciones de este sprint.

## Fuera de alcance

- Crear `apps/web`.
- Crear frontend Next.js funcional.
- Crear Prisma, schema, migraciones o seeds.
- Crear autenticacion real.
- Crear endpoints funcionales del MVP.
- Implementar profile, jobs, saved jobs, match o dashboard.
- Crear Docker o CI/CD.
- Crear configuracion de deploy o produccion.
- Introducir secretos reales.

## Fases realizadas

1. Setup raiz: `package.json`, workspaces pnpm, TypeScript base, `.gitignore` y `.env.example`.
2. Backend API skeleton: `apps/api`, Express minimo, configuracion de entorno y middlewares tecnicos.
3. Smoke test tecnico: endpoint `GET /health` cubierto con Vitest y Supertest.
4. Actualizacion documental: documento de sprint alineado con el alcance real implementado.

## Criterios de aceptacion

- [ ] La rama activa es `feat/sprint-00-technical-setup`.
- [ ] El working tree contiene solo cambios esperados del setup tecnico inicial.
- [ ] Existe `package.json` raiz privado.
- [ ] Existe `pnpm-workspace.yaml`.
- [ ] Existe `tsconfig.base.json`.
- [ ] Existen `apps/` y `packages/`.
- [ ] Existe `.env.example` sin secretos reales.
- [ ] Existe `apps/api` como skeleton tecnico.
- [ ] Express esta configurado de forma minima.
- [ ] Existen middlewares tecnicos base para errores y rutas no encontradas.
- [ ] Existe el endpoint tecnico `GET /health`.
- [ ] Existe smoke test tecnico para `GET /health`.
- [ ] Las dependencias minimas estan registradas en `package.json` y `pnpm-lock.yaml`.
- [ ] Existe este documento de sprint.
- [ ] No se crea `apps/web`.
- [ ] No se crea Prisma ni base de datos.
- [ ] No se implementan features del MVP.
- [ ] No se crean Docker, CI/CD ni deploy.

## Comandos de verificacion

```bash
pnpm --filter @jobit/api typecheck
pnpm --filter @jobit/api test
pnpm --filter @jobit/api build
pnpm --filter @jobit/api clean
pnpm typecheck
pnpm test
pnpm build
git diff --check
git status --short
```

## Nota sobre dependencias

Las dependencias incluidas en este sprint son las minimas necesarias para levantar y verificar el skeleton tecnico de `apps/api`. Cualquier dependencia futura debera justificarse por una spec, ADR o tarea tecnica aprobada.
