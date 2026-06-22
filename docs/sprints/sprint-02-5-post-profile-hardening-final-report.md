# Informe final

## Sprint o tarea
Sprint 02.5 — Post-Sprint 02 Profile Hardening

## Objetivo inicial
Resolver deuda técnica pequeña y no funcional detectada tras el Sprint 02 (Candidate Profile & CV), sin añadir features nuevas ni modificar código productivo, centrándose en los puntos seguros del hardening:
1. Eliminar un comentario TODO obsoleto en los tests.
2. Ampliar la cobertura de tests con casos `404 NOT_FOUND` autenticados para subrecursos inexistentes del perfil/CV.

## Trabajo realizado
- **Fase H1 (PASS):**
  - Eliminado el TODO obsoleto (referencia a "fase 5.4" ya superada) en `apps/api/src/profile/profile.service.test.ts`.
  - Añadidos **7 tests de integración `404 NOT_FOUND` autenticados** para IDs de subrecurso inexistentes, claramente diferenciados de los casos `401` (sin token) y `403` (recurso ajeno):
    - skills: DELETE de skill inexistente.
    - experience: PUT y DELETE de experience inexistente.
    - education: PUT y DELETE de education inexistente.
    - projects: PUT y DELETE de project inexistente.
  - Reutilizados los helpers/factories existentes (`registerUser`, `createX`) y un UUID de control (`11111111-…`) distinto del usado en los casos 401.
- **Fase H2 (esta fase):** auditoría documental/técnica del diff e informe final de cierre del sprint.

Commit de H1: `8661a56 test(profile): add authenticated 404 coverage for missing subresources` (la rama queda 1 commit por delante de `dev`, afectando solo a archivos de test).

## Archivos modificados
**API profile tests** (únicos archivos tocados en H1):
- `apps/api/src/profile/profile.service.test.ts` (eliminación del TODO).
- `apps/api/src/profile/profile-skills.integration.test.ts` (+1 test 404).
- `apps/api/src/profile/profile-experience.integration.test.ts` (+2 tests 404).
- `apps/api/src/profile/profile-education.integration.test.ts` (+2 tests 404).
- `apps/api/src/profile/profile-projects.integration.test.ts` (+2 tests 404).

**Docs** (esta fase):
- `docs/sprints/sprint-02-5-post-profile-hardening-final-report.md` (este informe).

No se modificó ningún otro archivo. No se tocó código productivo, Prisma, manifests ni lockfiles.

## Tests y verificaciones
- **API tests:** 127/127 passing (17 test files) — 120 previos + 7 nuevos de cobertura 404.
- **Typecheck:** PASS.
- **Build:** PASS.
- **git diff --check:** limpio (sin whitespace ni conflictos), tanto en working tree como en `origin/dev..HEAD`.
- **Sin bug productivo:** todos los tests 404 pasaron a la primera, confirmando que los endpoints ya devolvían `404 NOT_FOUND` correctamente mediante `findOwned*OrThrow`. No fue necesario modificar código productivo.

## Decisiones técnicas/producto
- **`userId` en `GET /api/profile/me` se mantiene por ahora:** decisión del operador, respaldada por ADR-0010 D-2 (el perfil es privado del propio candidato autenticado). No se modificó el contrato de la API en este sprint; queda como posible revisión de producto futura.
- **ESLint/lint queda aplazado a un hardening técnico separado:** configurar lint requiere tocar `package.json`, lockfiles e instalar dependencias, fuera del alcance seguro de este sprint. Se abordará en su propia rama/PR con autorización explícita.
- **Alcance estrictamente de calidad/cobertura:** sin nuevas features y sin cambios de comportamiento productivo.

## Seguridad/quality
- Se amplió la cobertura de seguridad de ownership: ahora el branch `404 NOT_FOUND` está cubierto por tests autenticados, además de los `403` (recurso ajeno) y `401` (sin token) ya existentes.
- Se mantienen las garantías del Sprint 02: rutas protegidas con `requireAuth`, `userId` siempre desde `req.auth.userId`, sin aceptar `userId`/`profileId` del cliente, y sin exponer `passwordHash`/`tokenHash`/`normalizedName`/`profileId` en subrecursos.
- Cambios mínimos, reversibles y aislados (solo tests), coherentes con AGENTS.md y el kill-switch.

## Problemas encontrados
- Ninguno bloqueante. No se detectaron bugs productivos: los `404` ya funcionaban.
- Nota de entorno: el sprint se trabaja en el checkout de Windows con la DB de test en `localhost:5434` (`jobit-postgres-test`); el checkout WSL2 permanece desactualizado y no se usa.

## Pendiente / backlog
- **Configurar ESLint/lint** para `@jobit/api` (o a nivel monorepo) en rama/PR propia con autorización para manifests, lockfiles e instalación de dependencias.
- **Decisión de producto sobre `userId`** en `GET /api/profile/me`: confirmar si se mantiene o se oculta del serializador.
- Documentar en backlog cualquier hallazgo futuro de hardening que surja en revisiones.

## Recomendación para el orquestador
- Abrir PR `chore/post-sprint-02-hardening` → `dev` tras commitear este informe.
- No mergear hasta revisión humana y, si existe CI, esperar su resultado.
- Crear issues/backlog para ESLint/lint y para la decisión sobre `userId`.
- Siguiente sprint sugerido: hardening de ESLint/lint o el siguiente módulo del roadmap (p. ej. JobIT Jobs o integración UI de Profile).

## Prompt sugerido para continuar

```
Fase: Sprint 02.5 — Commit informe + abrir PR hacia dev.
Rama: chore/post-sprint-02-hardening.
Tareas:
1. Verificar git: rama correcta, working tree solo con el informe untracked, origin/dev alineado.
2. git add docs/sprints/sprint-02-5-post-profile-hardening-final-report.md
3. Commit "docs(sprint): add sprint 02.5 hardening final report" y push normal.
4. Abrir PR chore/post-sprint-02-hardening -> dev con resumen del hardening (TODO eliminado,
   +7 tests 404 autenticados, 127/127), decisiones (userId mantenido, lint aplazado) y backlog.
5. No mergear. Esperar revisión humana y CI.
```
