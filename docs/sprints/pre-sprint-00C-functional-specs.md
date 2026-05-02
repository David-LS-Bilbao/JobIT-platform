# Pre-Sprint 00C: Specs funcionales iniciales del MVP candidate-first

## Objetivo

Crear las especificaciones funcionales de los 6 módulos del MVP candidate-first antes de implementar código. Cerrar la fase documental y dejar el repositorio preparado para iniciar el desarrollo técnico.

## Alcance

- Definir el alcance global del MVP en `docs/specs/00-mvp-scope.md`.
- Crear specs de features para los 6 módulos candidate-first: auth, candidate-profile-cv, jobs, saved-jobs, match-basic y dashboard.
- Cada spec incluye: objetivo, usuario afectado, flujos, modelo de datos conceptual, endpoints, pantallas, reglas de negocio, validaciones, errores, criterios de aceptación, tests mínimos y fuera de alcance.
- Actualizaciones mínimas de README para reflejar la nueva estructura de specs.

## Fuera de alcance

- Implementación de código frontend o backend.
- Configuración de base de datos, Prisma, Docker o CI/CD.
- Instalación de dependencias.
- Panel recruiter, empresa o administración.
- IA avanzada o matching complejo.
- OAuth, MFA o recuperación de contraseña.
- Integraciones externas o scraping de ofertas.
- Configuración ejecutable de agentes (`.claude/skills/`, hooks, settings).

## Entregables

| Archivo | Descripción |
|---|---|
| `docs/specs/00-mvp-scope.md` | Alcance global del MVP, módulos, dependencias y criterios de cierre |
| `docs/specs/features/auth.md` | Spec de autenticación y protección de rutas |
| `docs/specs/features/candidate-profile-cv.md` | Spec de perfil y CV del candidato |
| `docs/specs/features/jobs.md` | Spec de listado y detalle de ofertas |
| `docs/specs/features/saved-jobs.md` | Spec de ofertas guardadas |
| `docs/specs/features/match-basic.md` | Spec de match básico explicable |
| `docs/specs/features/dashboard.md` | Spec de dashboard del candidato |
| `docs/sprints/pre-sprint-00C-functional-specs.md` | Este documento |

## Criterios de aceptación

- [ ] `docs/specs/00-mvp-scope.md` existe y define módulos incluidos, fuera de alcance y dependencias.
- [ ] Las 6 specs de features existen bajo `docs/specs/features/`.
- [ ] Cada spec sigue estructura homogénea con todos los campos requeridos.
- [ ] La spec de auth contempla seguridad básica (hash, validación server-side, rutas privadas).
- [ ] La spec de jobs limita las ofertas a seed/mock, sin APIs externas.
- [ ] La spec de match-basic usa reglas visibles, sin IA avanzada.
- [ ] La spec de saved-jobs separa datos por usuario y evita duplicados.
- [ ] La spec de dashboard no amplía funcionalidad más allá de agregar M01-M05.
- [ ] No se crea código ni configuración técnica ejecutable.
- [ ] La auditoría quality/security devuelve PASS o PASS_WITH_NOTES.

## Checklist de cierre

- [ ] Rama correcta confirmada (`docs/pre-sprint-00c-mvp-functional-specs`).
- [ ] Working tree revisado antes y después de los cambios.
- [ ] Cambios limitados a los archivos del alcance.
- [ ] No se han creado archivos técnicos no solicitados.
- [ ] No se han instalado dependencias.
- [ ] No se han introducido secretos.
- [ ] Documentación en español.
- [ ] Criterios de aceptación revisados.
- [ ] Verificaciones ejecutadas (`git status`, `find`, `git diff --stat`, `git diff --check`).
- [ ] Auditoría quality/security aplicada.
- [ ] Resumen final preparado.

## Riesgos

- **Modelo de datos conceptual**: los modelos definidos en las specs son orientativos. Pueden cambiar al definir el stack técnico (ADR pendiente de base de datos y API).
- **Contratos de API**: los endpoints son previsiones. El contrato final requerirá un ADR de diseño de API antes de implementar.
- **Match básico**: la definición de "explicable" y los pesos de los factores deberán validarse con usuarios antes de implementar. Riesgo de subjetividad.
- **Perfil vs CV**: se trata como un módulo unificado. Si el producto decide separarlos, la spec deberá dividirse.
- **Orden de implementación**: la dependencia auth → perfil → jobs → saved → match → dashboard es orientativa. Algunos módulos (jobs) pueden desarrollarse en paralelo si auth está listo.

## Siguiente paso recomendado

Revisar las 6 specs con el equipo de producto y técnico. Abrir discusión sobre:

1. ADR de stack técnico (Node.js + Express/Fastify, Prisma, PostgreSQL).
2. ADR de diseño de API (REST vs tRPC, convenciones de endpoints).
3. Priorización de módulos para el primer sprint de implementación.
4. Seed de datos de ofertas para desarrollo y tests.

Abrir PR `docs/pre-sprint-00c-mvp-functional-specs` → `dev` con resultado de auditoría PASS o PASS_WITH_NOTES.
