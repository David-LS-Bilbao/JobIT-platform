# Sprint Agent Brief — Sprint 03 — Jobs

## Nombre del sprint

Sprint 03 — Jobs

## Objetivo

Implementar el módulo M03 (Jobs) del MVP candidate-first de JobIT: permitir que un candidato autenticado explore ofertas laborales tech (provenientes de datos seed en la base de datos), aplique filtros básicos y paginación, y consulte el detalle de una oferta, conforme a la spec funcional [docs/specs/features/jobs.md](../specs/features/jobs.md) y a los ADR aprobados ADR-0005, ADR-0007 y ADR-0008.

Este brief prepara Sprint 03; no lo implementa. La implementación no comienza con código: comienza con el ritual obligatorio Startup + Alignment Report, una revisión SDD de la spec y una planificación TDD con tests mínimos antes de cualquier endpoint. Solo cuando esas fases pasan validación humana se autorizan prompts de implementación, pequeños y secuenciados. La autoridad para iniciar la implementación es del operador humano.

## Rama esperada

- Rama: `feat/sprint-03-jobs`
- Base: `dev` actualizada y sincronizada con `origin/dev` antes de cortar la rama.
- PR destino: `dev`.

Reglas no negociables sobre la rama:

- La rama se crea desde `dev` con la condición previa `dev == origin/dev` y working tree limpio.
- No se trabaja directamente sobre `dev` ni sobre `main`. Cualquier intento activa el kill-switch (ver [docs/agents/kill-switch-rules.md](../agents/kill-switch-rules.md)).
- No se hace force-push ni se reescribe el historial publicado.
- No se reutilizan ramas contaminadas por intentos previos.

## Contexto necesario

- **Estado del proyecto:**
  - Sprint 01 (Auth) completado y mergeado: endpoints `/api/auth/*` y middleware `requireAuth` operativos. Todos los módulos privados posteriores dependen de este middleware.
  - Sprint 02 (Profile/CV) completado y mergeado: `GET/PUT /api/profile/me` y subrecursos (skills, experience, education, projects, links, preferences) con ownership por usuario autenticado.
  - Sprint 02.5 (Hardening) completado y mergeado: ESLint/lint configurado, cobertura de tests `404` autenticados ampliada, TODO obsoleto eliminado.
- **Stack fijado por ADR:** Node.js + TypeScript + Express + Zod (ADR-0005); API REST bajo `/api` con formato de errores JSON normalizado, validación server-side y `userId` siempre desde el token (ADR-0007); PostgreSQL + Prisma (ADR-0008), donde el modelo `Job` está definido conceptualmente pero **no implementado** en `schema.prisma`.
- **Naturaleza del módulo:** Jobs es un módulo de **solo lectura** para el candidato. No existe propietario por oferta: las ofertas son datos compartidos cargados por seed, no recursos privados de un usuario. No hay panel de publicación en el MVP.
- **Candidate-first:** el único rol es `CANDIDATE`. No hay recruiter, empresa ni admin.
- **Deuda del Sprint 02 NO incluida en este sprint** (no se aborda aquí): N-1 `verifyRefreshToken` sin uso; N-3 `tokenHash` sin `@unique`; N-4 múltiples refresh tokens sin limpieza. Estas notas quedan en backlog y no justifican tocar Auth en Sprint 03.

## Documentos obligatorios

El ejecutor debe haber leído antes de iniciar:

- [AGENTS.md](../../AGENTS.md)
- [docs/agents/executor-startup-skill.md](../agents/executor-startup-skill.md)
- [docs/agents/sprint-agent-brief-template.md](../agents/sprint-agent-brief-template.md)
- [docs/agents/codex-claude-skill-invocation.md](../agents/codex-claude-skill-invocation.md)
- [docs/agents/operator-safety-checklist.md](../agents/operator-safety-checklist.md)
- [docs/agents/kill-switch-rules.md](../agents/kill-switch-rules.md)
- [docs/agents/sdd-tdd-ai-audit-workflow.md](../agents/sdd-tdd-ai-audit-workflow.md)
- [docs/agents/tdd-guidelines.md](../agents/tdd-guidelines.md)
- [docs/agents/audit-quality-security-skill.md](../agents/audit-quality-security-skill.md)
- [docs/agents/pr-checklist.md](../agents/pr-checklist.md)
- [docs/specs/features/jobs.md](../specs/features/jobs.md)

Si alguno falta o no es accesible, se activa kill-switch antes de continuar.

## Specs aplicables

- **Obligatoria**: [docs/specs/features/jobs.md](../specs/features/jobs.md).

Reglas sobre la spec:

- Si la spec falta, está incompleta para alguno de los puntos relevantes (modelo `Job`, endpoints `GET /jobs` y `GET /jobs/:id`, filtros, paginación, reglas de negocio de ofertas activas/expiradas, validaciones, errores, tests mínimos) o contradice el sprint, se activa kill-switch antes de implementar.
- Cualquier cambio necesario en la spec se realiza como tarea previa y separada, con su propia revisión humana. No se modifica la spec en el mismo prompt en el que se implementa.

## ADRs aplicables

- [docs/decisions/ADR-0005-backend-framework.md](../decisions/ADR-0005-backend-framework.md) — Express + Zod.
- [docs/decisions/ADR-0007-api-design.md](../decisions/ADR-0007-api-design.md) — REST bajo `/api`, formato de errores JSON normalizado, validación server-side, `userId` del token.
- [docs/decisions/ADR-0008-database-orm-initial-model.md](../decisions/ADR-0008-database-orm-initial-model.md) — PostgreSQL + Prisma; el modelo `Job` está definido conceptualmente y se implementa en este sprint.

Reglas sobre los ADR:

- Cualquier desviación respecto a estos ADR requiere un ADR nuevo aprobado antes de implementarla. No se "ajusta" un ADR de forma implícita en código.
- Decisiones técnicas abiertas (por ejemplo, representación de `remoteType`/`seniority`/`status` como enum Prisma vs string, estrategia de búsqueda por texto, índices) se cierran en el primer prompt operativo que corresponda mediante mini-ADR o nota documental antes de tocar código.

## Skills documentales obligatorias

Cada prompt operativo del sprint debe declarar explícitamente:

```txt
Skill documental aplicada:
Fase:
```

Skills mínimas esperadas, asociadas a la fase:

- [docs/agents/executor-startup-skill.md](../agents/executor-startup-skill.md) — fase Startup.
- [docs/agents/sdd-tdd-ai-audit-workflow.md](../agents/sdd-tdd-ai-audit-workflow.md) — fases SDD Review, TDD Planning, Implementación, Verificación.
- [docs/agents/tdd-guidelines.md](../agents/tdd-guidelines.md) — fase TDD Planning y durante Implementación.
- [docs/agents/audit-quality-security-skill.md](../agents/audit-quality-security-skill.md) — fase Audit.
- [docs/agents/pr-checklist.md](../agents/pr-checklist.md) — fase Informe final / PR.
- [docs/agents/codex-claude-skill-invocation.md](../agents/codex-claude-skill-invocation.md) — contrato de cada prompt operativo.
- [docs/agents/operator-safety-checklist.md](../agents/operator-safety-checklist.md) — validación humana previa y posterior a cada prompt.
- [docs/agents/kill-switch-rules.md](../agents/kill-switch-rules.md) — condiciones de parada inmediata, heredadas y ampliadas aquí.

Un prompt sin declaración explícita de skill y fase se considera deficiente y se rechaza con `BLOCKED`.

## Archivos permitidos

La lista de archivos permitidos **no es global para todo el sprint**. Se autoriza por fases, prompt a prompt, con listas cerradas y rutas concretas. Esto evita scope creep y arrastre de cambios entre fases. No se admiten comodines amplios tipo `apps/**` o `**/*`.

Reglas por fase:

- **Startup + Alignment Report**: solo lectura. Sin archivos modificados. Comandos git de diagnóstico de solo lectura. Salida: informe en chat.
- **SDD Review**: solo lectura. Archivos accesibles: [docs/specs/features/jobs.md](../specs/features/jobs.md), ADR-0005, ADR-0007, ADR-0008. Sin escritura.
- **TDD Planning**: solo lectura más, opcionalmente, propuesta documental de archivos esperados y nombres de tests. No se crea código todavía. Si se guarda un plan, se hace en `docs/sprints/sprint-03-jobs-tdd-plan.md` mediante un prompt aparte autorizado por el operador.
- **Implementación 4.1 — Schema Prisma + seed**:
  - `apps/api/prisma/schema.prisma` (añadir modelo `Job` y enums asociados).
  - `apps/api/prisma/migrations/**` (migración generada para `Job`).
  - `apps/api/prisma/seed.ts` (o el archivo de seed real del proyecto; se confirma su nombre en el prompt) con un mínimo de 10 ofertas tech representativas.
- **Implementación 4.2 — Servicio Jobs**:
  - `apps/api/src/jobs/jobs.service.ts`.
  - `apps/api/src/jobs/jobs.schemas.ts` (esquemas Zod de query params).
  - `apps/api/src/jobs/*.test.ts` (tests unitarios del servicio si aplican).
- **Implementación 4.3 — `GET /api/jobs` con filtros y paginación**:
  - `apps/api/src/jobs/jobs.router.ts`.
  - Punto de montaje del router en la app (`apps/api/src/app.ts`), solo si el prompt lo autoriza explícitamente.
  - `apps/api/src/jobs/jobs-list.integration.test.ts`.
- **Implementación 4.4 — `GET /api/jobs/:id`**:
  - `apps/api/src/jobs/jobs.router.ts` (ampliación).
  - `apps/api/src/jobs/jobs-detail.integration.test.ts`.
- **Verificaciones**: sin nuevos archivos de código. Pueden generarse logs/transcripts de tests, no añadidos al repo.
- **Audit**: sin escritura sobre código. Informe en chat o, si el operador lo autoriza, en archivo documental aparte.
- **Informe final**: sin escritura sobre código. Si el operador lo autoriza, se guarda como `docs/sprints/sprint-03-jobs-final-report.md`.

Los nombres concretos de archivos de servicio/router/test se confirman en el prompt de cada fase; cualquier ruta no listada en el prompt en curso queda fuera de alcance.

## Archivos prohibidos

Salvo autorización explícita y documentada en un prompt operativo:

- Rama `main`.
- Rama `dev`.
- `.claude/` y cualquier contenido suyo.
- `JobIT-platform/` como subcarpeta del repo (señal de repo anidado, condición de kill-switch).
- `package.json` y cualquier `package.json` de paquetes hijos (incluido `apps/api/package.json`) sin autorización explícita.
- Lockfiles: `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, sin autorización explícita.
- `docker-compose.yml` y cualquier compose adicional.
- Scripts de deploy y configuración de despliegue.
- Configuración de CI/CD (`.github/workflows/**`, similares).
- [AGENTS.md](../../AGENTS.md), [CLAUDE.md](../../CLAUDE.md), `docs/context/current-state.md`.
- Código de Auth (`apps/api/src/auth/**`) salvo lectura del middleware `requireAuth` para reutilizarlo.
- Código de Profile (`apps/api/src/profile/**`).
- Frontend (`apps/web/**`).
- `.env` y cualquier archivo de secretos.
- Cualquier archivo no listado en el prompt operativo en curso.

Cualquier intento de tocar uno de estos sin autorización activa el kill-switch.

## Fuera de alcance

Sprint 03 Jobs no incluye, ni siquiera de forma parcial:

- `POST /api/saved-jobs` y la gestión de ofertas guardadas (módulo M04, sprint posterior).
- Match básico candidato-oferta (módulo M05).
- Dashboard (módulo M06).
- Frontend (Next.js, `apps/web`): pantallas de listado, filtros, detalle, estados vacío/carga/error.
- Integración con APIs externas de empleo (Adzuna, Arbeitnow, Remotive, Infojobs, LinkedIn, etc.) y scrapers.
- Panel de publicación, edición o borrado de ofertas (no hay recruiter/empresa en el MVP).
- Módulo recruiter o ATS.
- Ordenación por relevancia con IA y alertas de nuevas ofertas.
- Aplicación directa a una oferta desde la plataforma.
- Deploy a VPS o cualquier entorno; Docker; CI/CD.
- Resolución de la deuda del Sprint 02 (N-1, N-3, N-4) y cualquier cambio en Auth o Profile.

Si una de estas áreas parece necesaria para que Jobs funcione, se trata como dependencia bloqueante, no como ampliación del sprint.

## Secuencia de prompts

La ejecución sigue esta secuencia ordenada. Cada paso es un prompt operativo independiente, conforme a [docs/agents/codex-claude-skill-invocation.md](../agents/codex-claude-skill-invocation.md). Ninguno se inicia si el anterior no terminó con decisión `PASS` o `PASS_WITH_NOTES` aceptada por el operador. La regla por defecto es "un prompt = una fase".

1. **Startup + Alignment Report**.
   - Debe hacer: ritual completo de [docs/agents/executor-startup-skill.md](../agents/executor-startup-skill.md): verificación de repo, top-level, rama (esperada `feat/sprint-03-jobs`), working tree, ausencia de repo anidado, lectura de documentos base, listado de specs y ADR aplicables, archivos permitidos del primer prompt (solo lectura) y decisión `PASS / PASS_WITH_NOTES / BLOCKED`.
   - No debe hacer: modificar archivos, ejecutar build/tests/lint, instalar dependencias, crear ramas distintas de la esperada.
2. **SDD Review**.
   - Debe hacer: revisar [docs/specs/features/jobs.md](../specs/features/jobs.md) contra ADR-0005, ADR-0007 y ADR-0008. Confirmar cobertura de modelo `Job`, endpoints, filtros, paginación, reglas de negocio (solo `ACTIVE`, expiradas tratadas como cerradas), validaciones, errores y tests mínimos. Identificar decisiones abiertas.
   - No debe hacer: modificar la spec ni los ADR, escribir código, ampliar alcance.
3. **TDD Planning**.
   - Debe hacer: traducir los tests mínimos de la spec a un plan concreto por endpoint; enumerar fixtures/seed de test, helpers de auth reutilizables y archivos de test esperados sin crearlos; documentar decisiones abiertas en mini-ADR o nota.
   - No debe hacer: instalar dependencias, crear archivos de código/tests, modificar `schema.prisma`.
4. **Implementación 4.1 — Schema Prisma + seed**: modelo `Job` y enums en `schema.prisma`, migración aplicada contra `jobit_test` y `dev`, seed con ≥10 ofertas tech representativas.
5. **Implementación 4.2 — Servicio Jobs**: lógica de listado (filtros combinables, paginación, exclusión de cerradas/expiradas) y de detalle, con esquemas Zod de query params y tests unitarios si aportan claridad.
6. **Implementación 4.3 — `GET /api/jobs`**: router con filtros (`q`, `location`, `remote`, `seniority`, `contractType`, `tags`) y paginación (`page`, `limit`), protegido con `requireAuth`, montado en la app, con tests de integración.
7. **Implementación 4.4 — `GET /api/jobs/:id`**: detalle de oferta activa o `404`, protegido con `requireAuth`, con tests de integración.
8. **Verificaciones**: ejecutar el bloque de verificaciones obligatorias (typecheck, test, build, lint). Documentar salida. Los fallos vuelven a la fase de Implementación correspondiente, no se corrigen en el mismo prompt.
9. **Audit**: aplicar [docs/agents/audit-quality-security-skill.md](../agents/audit-quality-security-skill.md) sobre el conjunto del sprint. Emitir `PASS / PASS_WITH_NOTES / FAIL`. En `FAIL`, kill-switch y vuelta a Implementación.
10. **Informe final**: emitir el informe en el formato definido, listo para alimentar la PR. No cerrar la PR ni mergear (decisión humana).

## Criterios de aceptación

Sprint 03 Jobs se considera válido cuando se cumplen todas estas condiciones observables:

- Existe un Alignment Report aceptado al inicio y se realizó la SDD Review sobre [docs/specs/features/jobs.md](../specs/features/jobs.md).
- El modelo `Job` (con sus enums) está en `apps/api/prisma/schema.prisma` con migración aplicada.
- Existe seed con un mínimo de 10 ofertas tech representativas, cargable en `jobit_test` y en `dev`.
- `GET /api/jobs` devuelve ofertas **activas** paginadas y filtrables por `q`, `location`, `remote`, `seniority`, `contractType` y `tags`, con filtros combinables.
- `GET /api/jobs/:id` devuelve el detalle de una oferta activa o `404` (mensaje "Oferta no disponible") cuando no existe, está cerrada o ha expirado.
- Las ofertas con `status: CLOSED` o `expiresAt < now` no aparecen en el listado ni son accesibles por detalle como activas.
- Todos los endpoints están protegidos con `requireAuth`; sin sesión devuelven `401`.
- Validaciones server-side conforme a la spec: `page` entero ≥ 1; `limit` entre 1 y 100; `q` máx. 200 caracteres; `:id` UUID válido. Parámetros inválidos devuelven error de validación con el formato de ADR-0007.
- No se acepta `userId` ni ningún identificador de usuario desde body/query/params para filtrar o resolver ofertas.
- Tests de integración por endpoint en verde, cubriendo al menos los tests mínimos de la spec.
- `typecheck` y `build` limpios; `lint` sin errores nuevos.
- Auditoría final `PASS` o `PASS_WITH_NOTES` documentada.
- El informe final se entrega en el formato definido y la PR hacia `dev` cumple [docs/agents/pr-checklist.md](../agents/pr-checklist.md).

El sprint **no** es válido si: se trabaja en rama incorrecta (`main`, `dev` u otra); se tocan archivos fuera de los listados por prompt; se exponen datos de candidatos en respuestas de Jobs; se aceptan identificadores de usuario del cliente; se crean endpoints de publicación de ofertas; o la auditoría no devuelve `PASS`/`PASS_WITH_NOTES`.

## Verificaciones obligatorias

Bloque base, aplicable en todas las fases:

```bash
git branch --show-current
git status --short
git diff --check
```

Bloque adicional, para fases con código implementado (a ejecutar en Verificaciones y antes de la PR), con la DB de test disponible en `localhost:5434`:

```bash
pnpm --filter @jobit/api typecheck
pnpm --filter @jobit/api test
pnpm --filter @jobit/api build
pnpm --filter @jobit/api lint
```

Reglas sobre los comandos:

- Los comandos usan el gestor real del repositorio (pnpm) y los scripts declarados en `apps/api/package.json`. Si un script no existe, se justifica en el informe en lugar de inventarlo.
- Si una verificación no aplica en una fase (por ejemplo, no hay tests en Startup), se indica explícitamente; no se omite en silencio.
- La suite de integración requiere `DATABASE_URL_TEST` apuntando a la DB de test (`postgresql://jobit:...@localhost:5434/jobit_test?schema=public`).

## Condiciones de kill-switch

Se heredan todas las condiciones de [docs/agents/kill-switch-rules.md](../agents/kill-switch-rules.md). Para Sprint 03 Jobs se añaden, específicas:

- Exponer datos de un candidato (perfil, email, identificadores de usuario) en cualquier respuesta de `/api/jobs` o `/api/jobs/:id`. Jobs no tiene propietario por oferta y no debe filtrar información personal.
- Aceptar `userId` (o cualquier identificador de usuario) desde body, query o params para filtrar, ordenar o resolver ofertas.
- Crear endpoints de publicación, edición o borrado de ofertas (`POST/PUT/PATCH/DELETE /api/jobs`), fuera de alcance del MVP.
- Integrar APIs externas de empleo o scrapers sin un ADR aprobado y sin términos de uso claros.
- Modificar `apps/api/prisma/schema.prisma` o crear migraciones sin un prompt específico que lo autorice (fase 4.1) y sin reflejar el modelo en spec/ADR cuando proceda.
- Mezclar Jobs con módulos fuera de alcance (Saved Jobs M04, Match M05, Dashboard M06, Profile, Auth) en el mismo prompt o commit.
- Crear endpoints o rutas sin sus tests mínimos previstos en el plan TDD.
- Devolver ofertas `CLOSED` o expiradas como si estuvieran activas (fuga de reglas de negocio).
- Omitir `requireAuth` en cualquier ruta de Jobs.

Ante cualquiera de estas condiciones, el ejecutor activa kill-switch, emite informe `BLOCKED`, no modifica más archivos y espera decisión del operador.

## Formato de informe final

El informe de cierre del sprint sigue exactamente esta estructura:

```md
# Informe final

## Sprint o tarea
## Objetivo inicial
## Trabajo realizado
## Archivos modificados
## Tests y verificaciones
## Decisiones técnicas
## Problemas encontrados
## Pendiente
## Recomendación para el orquestador
## Prompt sugerido para continuar
```

Reglas sobre el informe:

- Cada sección se rellena con contenido real, sin marcadores.
- `Archivos modificados`: lista exacta de rutas afectadas en todo el sprint, agrupadas por fase si ayuda.
- `Tests y verificaciones`: comandos ejecutados, resultados (pasados/fallados/omitidos con justificación) y cobertura de los tests mínimos de la spec.
- `Decisiones técnicas`: decisiones cerradas durante el sprint que no estaban fijadas en spec/ADR (representación de enums, estrategia de búsqueda por texto, índices, forma del seed).
- `Problemas encontrados`: incidencias reales, kill-switches activados, correcciones aplicadas.
- `Pendiente`: deuda técnica aceptada, mejoras diferidas, riesgos abiertos (incluida la deuda heredada del Sprint 02 N-1/N-3/N-4).
- `Recomendación para el orquestador`: siguiente paso natural (abrir PR, corregir, planear M04 Saved Jobs).
- `Prompt sugerido para continuar`: propuesta concreta del próximo prompt operativo, conforme al contrato de [docs/agents/codex-claude-skill-invocation.md](../agents/codex-claude-skill-invocation.md).

Este informe es la entrada natural a la descripción de la PR y a la actualización documental que exige [docs/agents/sdd-tdd-ai-audit-workflow.md](../agents/sdd-tdd-ai-audit-workflow.md).
