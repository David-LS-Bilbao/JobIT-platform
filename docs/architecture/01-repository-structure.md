# Arquitectura 01: Estructura del repositorio

## Propósito

Este documento refleja el árbol implementado y la responsabilidad de sus zonas
principales. No es una propuesta de carpetas futuras.

## Estructura actual

```text
.
├── .github
│   └── workflows        # CI versionado
├── apps
│   ├── api
│   │   ├── prisma       # Schema, migraciones y entrypoint de seed
│   │   └── src          # API y módulos de dominio
│   └── web
│       ├── e2e          # Playwright
│       ├── public       # Assets estáticos
│       └── src          # App Router, componentes y cliente
├── docs
│   ├── agents
│   ├── architecture
│   ├── decisions
│   ├── deployment
│   ├── development
│   ├── legal
│   ├── product
│   ├── specs
│   └── sprints
├── packages             # Reserva vacía del workspace
├── docker-compose.staging.yml
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

Consulta el árbol real cuando necesites un inventario exhaustivo: specs e informes
crecen con cada sprint.

## `apps/web`

Aplicación Next.js candidate-first. Contiene:

- rutas públicas y privadas bajo `src/app`;
- componentes y estilos;
- contexto de autenticación;
- cliente y contratos HTTP;
- tests Vitest/Testing Library;
- specs Playwright bajo `e2e`.

Su configuración pública se limita a variables `NEXT_PUBLIC_*`. No debe contener
secretos de API, credenciales de base de datos ni lógica de ingesta.

## `apps/api`

API Express modular. Contiene:

- `src/auth`;
- `src/profile`;
- `src/jobs`;
- `src/saved-jobs`;
- `src/match`;
- `src/dashboard`;
- middleware, configuración y utilidades de tests;
- providers externos y scripts de ingesta dentro de `src/jobs`.

`apps/api/prisma` es la fuente del schema y las migraciones. El seed es un entrypoint
fino sobre el servicio protegido del dataset interno.

## `packages`

La carpeta existe como reserva del monorepo y solo contiene `.gitkeep`. No hay
actualmente paquetes `database`, `shared` ni `ui`. No deben documentarse como capas
activas ni crearse sin una necesidad y spec aprobadas.

## `docs`

- `agents`: contrato operativo, skills, checklists y prompts neutrales.
- `architecture`: estado estructural vigente.
- `decisions`: ADRs históricos; no se reescriben para simular decisiones actuales.
- `deployment`: preparación y runbook de staging.
- `development`: configuración y operación local.
- `legal`: documentos públicos versionados y documentos privados locales ignorados.
- `product`: brief vivo.
- `specs`: contratos previos a implementación.
- `sprints`: planes e informes históricos.

Los informes de sprint no reemplazan la documentación viva. Si una descripción
histórica difiere del código integrado, se actualizan README, producto o arquitectura
sin alterar el registro histórico.

## Infraestructura raíz

- `.github/workflows/ci.yml`: gates API y Web.
- `apps/api/Dockerfile` y `apps/web/Dockerfile`: imágenes preparadas para staging.
- `docker-compose.staging.yml`: composición localmente verificada; no acredita un
  despliegue real.
- `package.json`: scripts recursivos del workspace y versión de pnpm.
- `pnpm-lock.yaml`: resolución bloqueada de dependencias.

No existe una carpeta `docker/` o `scripts/` global activa. Los scripts específicos
viven junto al dominio que operan.

## Reglas de evolución

- Crear carpetas solo cuando una spec o decisión aprobada justifique la
  responsabilidad.
- Evitar capas compartidas prematuras.
- Mantener código de producto en `apps/` y documentación operativa en `docs/`.
- Separar cambios de código, documentación e infraestructura cuando el alcance lo
  permita.
- No añadir secretos, dumps, datos reales ni artefactos generados.
- Conservar los nombres históricos necesarios para enlaces y trazabilidad.
