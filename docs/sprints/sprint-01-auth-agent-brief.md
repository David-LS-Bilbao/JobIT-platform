# Sprint Agent Brief — Sprint 01 Auth

## Nombre del sprint

Sprint 01 — Auth

## Objetivo

Implementar la autenticación segura del MVP candidate-first de JobIT (registro, login, logout, ruta privada `/api/auth/me`) conforme a la spec funcional [docs/specs/features/auth.md](../specs/features/auth.md) y a los ADRs aprobados ADR-0005, ADR-0006, ADR-0007 y ADR-0008.

La implementación no comienza con código. Comienza con un ritual obligatorio: Startup + Alignment Report, revisión SDD de la spec, planificación TDD con tests mínimos antes de cualquier endpoint. Solo cuando esas tres fases han pasado validación humana se autorizan prompts de implementación, pequeños y secuenciados.

Este brief prepara Sprint 01. No implementa Sprint 01. La autoridad para empezar la implementación es del operador humano, mediante un prompt operativo posterior que aplique las skills documentales declaradas aquí.

## Rama esperada

- Rama: `feat/sprint-01-auth`
- Base: `dev` actualizada y sincronizada con `origin/dev` antes de cortar la rama.
- PR destino: `dev`.

Reglas no negociables sobre la rama:

- La rama se crea desde `dev` con la condición previa `dev == origin/dev` y working tree limpio.
- No se trabaja directamente sobre `dev` ni sobre `main`. Cualquier intento activa el kill-switch (ver [docs/agents/kill-switch-rules.md](../agents/kill-switch-rules.md)).
- No se hace force-push. No se reescribe el historial publicado.
- Si la rama anterior con un intento fallido de Sprint 01 sigue presente, se descarta o se aísla antes de cortar la nueva rama. No se reutilizan ramas contaminadas.

## Contexto necesario

- El intento inicial de Sprint 01 Auth falló por falta de alineación: aparición de una carpeta anidada `JobIT-platform/`, aplicación incompleta de SDD y arranque de implementación sin protocolo claro.
- El Pre-Sprint 00E ha definido el protocolo de arranque, el contrato de prompts, la checklist del operador y las reglas de kill-switch que cubren exactamente esos fallos.
- El stack del MVP está fijado por ADRs: Node.js + TypeScript + Express + Zod (ADR-0005), JWT híbrido con refresh token en cookie HttpOnly (ADR-0006), API REST bajo `/api` con formato de errores normalizado (ADR-0007), PostgreSQL + Prisma con modelos `User` y `RefreshToken` (ADR-0008).
- El módulo M01 (Auth) es la primera implementación real del proyecto. El resto de módulos privados (M02-M06) dependerá del middleware de auth introducido aquí. Errores en este sprint contaminan todo lo posterior.
- El sprint es candidate-first: el único rol de usuario es `CANDIDATE`. No hay recruiter, ni empresa, ni admin.

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
- [docs/specs/features/auth.md](../specs/features/auth.md)

Si alguno falta o no es accesible, se activa kill-switch antes de continuar.

## Specs aplicables

- **Obligatoria**: [docs/specs/features/auth.md](../specs/features/auth.md).

Reglas sobre la spec:

- Si la spec falta, está incompleta para alguno de los puntos relevantes (registro, login, logout, ruta privada, modelo `User`, errores genéricos, hashing de contraseñas) o contradice el sprint, se activa kill-switch antes de implementar.
- Cualquier cambio que se considere necesario en la spec se realiza como tarea previa y separada, con su propia revisión humana. No se modifica la spec en el mismo prompt en el que se implementa.

## ADRs aplicables

- [docs/decisions/ADR-0005-backend-framework.md](../decisions/ADR-0005-backend-framework.md) — Express + Zod.
- [docs/decisions/ADR-0006-auth-strategy.md](../decisions/ADR-0006-auth-strategy.md) — JWT híbrido access + refresh en cookie HttpOnly, refresh hasheado en DB, bcrypt o argon2 para contraseñas.
- [docs/decisions/ADR-0007-api-design.md](../decisions/ADR-0007-api-design.md) — REST bajo `/api`, formato de errores JSON normalizado, validación server-side, `userId` del token.
- [docs/decisions/ADR-0008-database-orm-initial-model.md](../decisions/ADR-0008-database-orm-initial-model.md) — PostgreSQL + Prisma, modelos `User` y `RefreshToken`.

Reglas sobre los ADRs:

- Cualquier desviación respecto a estos ADRs requiere un ADR nuevo aprobado antes de implementarla. No se "ajusta" un ADR de forma implícita en código.
- Decisiones aún abiertas (bcrypt vs argon2, librería JWT concreta, SameSite, topología de dominios, versión exacta de Express, etc.) deben cerrarse en el primer prompt operativo del sprint mediante un mini-ADR o nota documental antes de tocar código.

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

La lista de archivos permitidos **no es global para todo el sprint**. Se autoriza por fases, prompt a prompt, con listas cerradas y rutas concretas. Esto es deliberado: evita scope creep y arrastre de cambios entre fases.

Reglas por fase:

- **Startup + Alignment Report**: solo lectura. Sin archivos modificados. El agente puede ejecutar comandos git de diagnóstico de solo lectura. Salida: informe en chat, no en filesystem.
- **SDD Review**: solo lectura. Archivos accesibles: [docs/specs/features/auth.md](../specs/features/auth.md), ADR-0005, ADR-0006, ADR-0007, ADR-0008. Sin escritura.
- **TDD Planning**: solo lectura más, opcionalmente, propuesta documental de archivos esperados y nombres de tests. No se crean archivos de código todavía. Si se decide guardar un plan, se hace en `docs/sprints/sprint-01-auth-plan.md` mediante un prompt aparte autorizado por el operador.
- **Implementación**: cada prompt declara su propia lista cerrada de archivos permitidos, pequeña, sin comodines amplios. Ejemplos orientativos de áreas que pueden tocarse (no exhaustivo y siempre por prompt):
  - `apps/api/src/auth/**` para rutas, controladores, servicios y middlewares de auth.
  - `apps/api/src/lib/**` para utilidades de hash, tokens y validación si aplican.
  - `apps/api/prisma/schema.prisma` y migraciones generadas, solo si el prompt lo autoriza explícitamente.
  - `apps/api/test/**` para tests del módulo de auth.
- **Verificaciones**: sin nuevos archivos de código. Pueden generarse logs/transcripts de tests, no añadidos al repo.
- **Audit**: sin escritura sobre código. Puede emitirse un informe de auditoría como texto en chat o, si el operador lo autoriza, en un archivo documental aparte.
- **Informe final**: sin escritura sobre código. Si el operador lo autoriza, se guarda como `docs/sprints/sprint-01-auth-final-report.md` o equivalente.

No se admiten comodines amplios tipo `apps/**` o `**/*` para todo el sprint. Los archivos concretos se autorizan en el prompt que toque cada fase.

## Archivos prohibidos

Salvo autorización explícita y documentada en un prompt operativo:

- Rama `main`.
- Rama `dev`.
- `.claude/` y cualquier contenido suyo.
- `JobIT-platform/` como subcarpeta del repo (señal de repo anidado, condición de kill-switch).
- `package.json` y cualquier `package.json` de paquetes hijos sin autorización explícita.
- Lockfiles: `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, sin autorización explícita.
- `docker-compose.yml` y cualquier compose adicional.
- Scripts de deploy y configuración de despliegue.
- Configuración de CI/CD (`.github/workflows/**`, GitLab CI, similares).
- [AGENTS.md](../../AGENTS.md), [CLAUDE.md](../../CLAUDE.md), `docs/context/current-state.md`.
- Cualquier archivo no listado en el prompt operativo en curso.

Cualquier intento de tocar uno de estos sin autorización activa el kill-switch.

## Fuera de alcance

Sprint 01 Auth no incluye, ni siquiera de forma parcial:

- Funcionalidad recruiter o ATS.
- Monetización.
- Integraciones n8n.
- IA avanzada.
- Matching avanzado.
- Roles complejos de empresa, recruiter o admin.
- OAuth / social login (Google, GitHub, LinkedIn) salvo que estén explícitamente en la spec aprobada actualmente; la spec actual los excluye.
- Recuperación avanzada de contraseña por email si no está en la spec actual (la spec actual la excluye).
- Emails transaccionales reales si no están en la spec actual.
- Cambios de arquitectura no respaldados por un ADR aprobado.
- Deploy a VPS o cualquier entorno.
- Sprint 02 (Candidate Profile + CV) y módulos posteriores.

Si una de estas áreas parece necesaria para que Auth funcione, se trata como dependencia bloqueante, no como ampliación del sprint.

## Secuencia de prompts

La ejecución del sprint sigue esta secuencia ordenada. Cada paso es un prompt operativo independiente, conforme a [docs/agents/codex-claude-skill-invocation.md](../agents/codex-claude-skill-invocation.md). Ninguno se inicia si el anterior no terminó con decisión `PASS` o `PASS_WITH_NOTES` aceptada por el operador.

1. **Startup + Alignment Report**.
   - Debe hacer: ritual completo de [docs/agents/executor-startup-skill.md](../agents/executor-startup-skill.md), incluyendo verificación de repo, top-level, rama (esperada `feat/sprint-01-auth`), working tree, ausencia de repo anidado, lectura de documentos base, listado de specs y ADRs aplicables, listado de archivos permitidos para el primer prompt (solo lectura) y decisión final `PASS / PASS_WITH_NOTES / BLOCKED`.
   - No debe hacer: modificar archivos, ejecutar build/tests/lint, instalar dependencias, crear ramas distintas de la esperada.

2. **SDD Review**.
   - Debe hacer: revisar [docs/specs/features/auth.md](../specs/features/auth.md) contra los ADR-0005 a ADR-0008. Confirmar que la spec cubre objetivo, alcance, fuera de alcance, modelo conceptual `User`, endpoints `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, errores genéricos, hashing, validaciones, criterios de aceptación y tests mínimos. Identificar carencias o decisiones abiertas (por ejemplo, bcrypt vs argon2, política de cookies, requisitos finos de contraseña).
   - No debe hacer: modificar la spec, modificar ADRs, escribir código, ampliar el alcance.

3. **TDD Planning**.
   - Debe hacer: traducir los tests mínimos de la spec a un plan concreto de tests para implementación. Identificar dependencias técnicas (jest/vitest, supertest, base de datos de test, fixtures), enumerar tests por endpoint y nombrar archivos de test esperados sin crearlos. Documentar decisiones abiertas pendientes de cierre en mini-ADR o nota.
   - No debe hacer: instalar dependencias, crear archivos de código de tests, modificar schema Prisma.

4. **Implementación por fases pequeñas**. Se sugiere descomposición por capas, una capa por prompt:
   - 4.1 Configuración base de Express + Zod + Prisma cliente para Auth, sin endpoints todavía. Lista cerrada de archivos.
   - 4.2 Modelo `User` y `RefreshToken` en `schema.prisma`, migración inicial, seed mínimo si aplica.
   - 4.3 Servicio de hashing de contraseñas y utilidades JWT (access + refresh) con tests unitarios.
   - 4.4 Endpoints `/api/auth/register` y `/api/auth/login` con validación Zod, tests de integración mínimos.
   - 4.5 Middleware de verificación de access token y endpoint `/api/auth/me`.
   - 4.6 Endpoint `/api/auth/logout` con revocación del refresh token y tests asociados.
   - Debe hacer: respetar lista cerrada de archivos por prompt, validar en servidor, no aceptar `userId` del cliente, cumplir formato de errores de ADR-0007.
   - No debe hacer: mezclar fases, tocar archivos no listados, instalar dependencias sin autorización, introducir OAuth o recuperación de contraseña.

5. **Verificaciones**.
   - Debe hacer: ejecutar comandos del bloque "Verificaciones obligatorias" más los específicos del sprint (lint, tests, build). Documentar salida.
   - No debe hacer: corregir en el mismo prompt; los fallos vuelven a una fase de Implementación específica.

6. **Audit**.
   - Debe hacer: aplicar [docs/agents/audit-quality-security-skill.md](../agents/audit-quality-security-skill.md) sobre el conjunto del sprint. Emitir `PASS`, `PASS_WITH_NOTES` o `FAIL`. En `FAIL`, kill-switch y vuelta a Implementación.
   - No debe hacer: aprobar la PR sin auditoría humana posterior.

7. **Informe final**.
   - Debe hacer: emitir el informe en el formato definido más abajo, listo para alimentar la PR.
   - No debe hacer: cerrar la PR ni mergear; eso es decisión humana.

Ningún prompt agrupa más de una fase de esta secuencia salvo autorización explícita del operador. La regla por defecto es "un prompt = una fase".

## Criterios de aceptación

Sprint 01 Auth no se considera válido si se cumple alguna de estas condiciones:

- No existe un Alignment Report aceptado al inicio del sprint.
- No se realizó la SDD Review sobre [docs/specs/features/auth.md](../specs/features/auth.md).
- No se respetaron las decisiones de ADR-0005, ADR-0006, ADR-0007 y ADR-0008 (stack, estrategia de auth, diseño de API, modelo de datos).
- No existen tests mínimos según el TDD plan, cubriendo al menos: registro válido, email duplicado, contraseña débil, login correcto, login con credenciales incorrectas, logout que invalida el refresh token, ruta privada sin sesión que devuelve 401, hash almacenado distinto del texto plano.
- Se tocaron archivos fuera de los listados en cada prompt operativo.
- Se trabajó en una rama incorrecta (`main`, `dev` u otra distinta de `feat/sprint-01-auth`).
- Se ignoraron validaciones de seguridad: contraseñas en claro, validación solo en frontend, tokens en localStorage, errores que revelan existencia de email, `userId` aceptado del cliente.
- La auditoría final no devolvió `PASS` o `PASS_WITH_NOTES`.
- El informe final no se entregó en el formato definido.

Sprint 01 se considera válido cuando los endpoints `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` y `/api/auth/me` funcionan conforme a la spec, los tests mínimos pasan, la auditoría es `PASS` o `PASS_WITH_NOTES` documentado, y la PR hacia `dev` cumple [docs/agents/pr-checklist.md](../agents/pr-checklist.md).

## Verificaciones obligatorias

Bloque base, aplicable en todas las fases:

```bash
git branch --show-current
git status --short
git diff --check
```

Bloque adicional, previsto para fases con código implementado (a ejecutar en Verificaciones y antes de la PR):

```bash
npm run lint
npm run test
npm run build
```

Reglas sobre los comandos:

- Si el repositorio usa otro gestor (pnpm, yarn) o nombres de scripts distintos, se sustituyen por los scripts reales declarados en `package.json` y se justifica el cambio en el informe.
- Si una verificación no aplica todavía (por ejemplo, en la fase Startup no hay tests que ejecutar), se indica explícitamente con una nota; no se omite en silencio.
- La ausencia de tooling no es excusa para saltar verificaciones: el primer prompt de Implementación que añade dependencias justifica qué tooling instala y por qué.

## Condiciones de kill-switch

Se heredan todas las condiciones de [docs/agents/kill-switch-rules.md](../agents/kill-switch-rules.md). Para Sprint 01 Auth se añaden las siguientes, específicas:

- Guardar contraseñas en claro en cualquier punto del flujo (base de datos, logs, respuestas, fixtures, transcripts).
- Usar hashing inseguro (MD5, SHA-1 plano, hashing custom, sin sal, sin función de coste adaptable). Solo bcrypt o argon2 conforme a ADR-0006.
- Confiar en validaciones solo del frontend para reglas de seguridad: cada validación crítica se ejecuta también en el servidor.
- Exponer tokens, refresh tokens, secrets, claves de firma o variables `.env` en código fuente, logs, respuestas o tests.
- Mezclar Auth con módulos fuera de alcance (Profile/CV, Jobs, Saved Jobs, Match, Dashboard) en el mismo sprint.
- Introducir OAuth / social login (Google, GitHub, LinkedIn) sin spec actualizada y sin ADR específico.
- Crear roles complejos (recruiter, empresa, admin) no previstos en la spec actual.
- Saltarse la separación por usuario: aceptar `userId` del cliente, devolver datos de otro usuario, omitir el middleware de verificación de token en rutas privadas.
- Crear endpoints o rutas sin sus tests mínimos previstos en el plan TDD.
- Modificar el `schema.prisma` o crear migraciones sin un prompt específico que lo autorice y sin reflejar el cambio en spec o ADR cuando proceda.
- Activar refresh token sin persistencia hasheada en DB ni capacidad real de revocación: contradice ADR-0006.
- Usar `localStorage` o `sessionStorage` para tokens, incluso temporalmente en el frontend.

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
- `Tests y verificaciones`: comandos ejecutados, resultados (pasados/fallados/omitidos con justificación) y cobertura mínima cubierta de los tests de la spec.
- `Decisiones técnicas`: decisiones cerradas durante el sprint que no estaban fijadas en spec/ADR (por ejemplo, bcrypt vs argon2 si se eligió, política de cookies aplicada, librería JWT concreta).
- `Problemas encontrados`: incidencias reales, kill-switches activados, correcciones aplicadas.
- `Pendiente`: deuda técnica aceptada, mejoras conscientemente diferidas, riesgos abiertos.
- `Recomendación para el orquestador`: siguiente paso natural (abrir PR, corregir, escalar, planear Sprint 02).
- `Prompt sugerido para continuar`: si procede, propuesta concreta del próximo prompt operativo, conforme al contrato de [docs/agents/codex-claude-skill-invocation.md](../agents/codex-claude-skill-invocation.md).

Este informe es la entrada natural a la sección de descripción de la PR y a la actualización documental que exige [docs/agents/sdd-tdd-ai-audit-workflow.md](../agents/sdd-tdd-ai-audit-workflow.md).
