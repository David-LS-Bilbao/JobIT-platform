# Sprint Agent Brief Template

## Propósito

Definir una plantilla reutilizable para preparar el brief de cualquier sprint o tarea ejecutable que vaya a ser dirigida por un chat operador, Codex o Claude.

El brief es el contrato de trabajo entre el operador humano y el agente IA: declara objetivo, alcance, archivos permitidos, documentos obligatorios, skills documentales aplicadas y condiciones de bloqueo. Sin un brief explícito, ningún prompt de implementación o de modificación de archivos debe ejecutarse.

Esta plantilla es documental. No instala ninguna skill ejecutable, no configura agentes y no automatiza nada. Su ubicación en `docs/agents/` indica que es un instrumento neutral de trabajo.

## Uso obligatorio

Un Sprint Agent Brief es obligatorio antes de:

- Lanzar cualquier prompt de implementación a Codex o Claude.
- Iniciar un Pre-Sprint, un Sprint o una tarea cross-sprint con efectos sobre el repositorio.
- Reanudar trabajo en una rama existente después de una pausa larga.

El brief se redacta como un documento en `docs/sprints/` con sufijo `*-agent-brief.md`. El ejecutor lo carga durante el ritual descrito en [docs/agents/executor-startup-skill.md](executor-startup-skill.md) y lo incluye en su Alignment Report.

Si un prompt de ejecución llega sin brief, o el brief no cubre las secciones obligatorias de esta plantilla, el ejecutor reporta `BLOCKED` y espera resolución del operador.

## Plantilla reutilizable

Copiar el siguiente bloque como base para cada nuevo brief. Reemplazar los marcadores `[...]` con datos reales antes de cargarlo en un chat operador o de pasarlo a un agente.

```md
# Sprint Agent Brief — [Nombre del sprint o tarea]

## Nombre del sprint

[Identificador estable, por ejemplo `Pre-Sprint 00E — Agent Executor Startup Protocol` o `Sprint 01 — Auth MVP`.]

## Objetivo

[Una o dos frases describiendo qué problema resuelve este sprint y para qué usuario, no qué archivos toca.]

## Rama esperada

[Nombre exacto de la rama de trabajo, su rama base y el remoto al que apuntará la PR. Ejemplo:

- Rama: `feat/sprint-01-auth-mvp`
- Base: `dev`
- PR destino: `dev`]

## Contexto necesario

[Resumen breve del estado del proyecto relevante para este sprint: decisiones recientes, dependencias documentales, restricciones operativas, antecedentes del Pre-Sprint o ADR previo.]

## Documentos obligatorios

El ejecutor debe haber leído antes de iniciar:

- AGENTS.md
- docs/agents/executor-startup-skill.md
- docs/agents/sdd-tdd-ai-audit-workflow.md
- docs/agents/tdd-guidelines.md
- docs/agents/audit-quality-security-skill.md
- docs/agents/pr-checklist.md
- docs/specs/[spec aplicable].md
- docs/decisions/[ADR aplicable].md

## Specs aplicables

[Lista explícita de specs en `docs/specs/` que justifican el alcance. Si la tarea no tiene spec todavía, indicar `Spec pendiente: BLOCKED hasta que exista`.]

## ADRs aplicables

[Lista explícita de ADRs en `docs/decisions/` que condicionan stack, arquitectura o decisiones técnicas. Si no aplica, escribir `No aplica` con justificación.]

## Skills documentales obligatorias

Cada prompt operativo de este brief debe declarar explícitamente:

Skill documental aplicada: [ruta dentro de `docs/agents/`]
Fase: [Startup / SDD / TDD / Implementación / Verificación / Audit / Reporte]

Skills mínimas esperadas en este sprint:

- docs/agents/executor-startup-skill.md (fase Startup)
- docs/agents/sdd-tdd-ai-audit-workflow.md (fases SDD, TDD, Implementación, Verificación)
- docs/agents/audit-quality-security-skill.md (fase Audit)
- docs/agents/pr-checklist.md (fase Reporte / PR)
- [otras skills específicas de la tarea, si aplica]

## Archivos permitidos

[Lista cerrada de rutas que el agente puede crear o modificar en este sprint. Una ruta por línea. Sin comodines amplios. Ejemplo:

- `docs/specs/features/auth.md`
- `apps/api/src/auth/*`
- `apps/api/test/auth/*`]

## Archivos prohibidos

Salvo autorización explícita y aparte, el agente no debe tocar:

- AGENTS.md
- CLAUDE.md
- docs/context/current-state.md
- package.json
- package-lock.json
- pnpm-lock.yaml
- yarn.lock
- docker-compose.yml
- .claude/
- JobIT-platform/
- [otras rutas sensibles específicas del sprint]

## Fuera de alcance

[Funcionalidades, refactors, cambios de stack, automatizaciones o documentación que NO forman parte de este sprint aunque puedan parecer relacionados. Listar de forma explícita para evitar scope creep.]

## Secuencia de prompts

Los prompts del sprint se aplican en este orden, pequeños y revisables, no en bloque:

1. Startup + Alignment Report.
2. SDD Review (verificación y/o redacción de spec antes de implementar).
3. TDD Planning (definición de tests mínimos).
4. Implementación por fases pequeñas (cada fase un prompt acotado).
5. Verificaciones (tests, lint, build o equivalentes documentales).
6. Audit (checklist quality/security).
7. Informe final (resumen, riesgos, propuesta de PR).

Ningún prompt posterior se aplica si el anterior no terminó con éxito.

## Criterios de aceptación

[Lista verificable de condiciones que deben cumplirse para considerar el sprint completado. Cada criterio debe ser observable (archivos existentes, tests verdes, auditoría `PASS`, documentación actualizada).]

## Verificaciones obligatorias

[Comandos o pasos de verificación que deben ejecutarse antes de abrir PR. Ejemplo:

- `git status --short`
- `git diff --check`
- Tests del paquete afectado, con comando exacto.
- Lint del paquete afectado, con comando exacto.
- Build si el cambio toca código ejecutable.
- Auditoría documental según `docs/agents/audit-quality-security-skill.md`.

Si alguna verificación no aplica, debe justificarse aquí.]

## Condiciones de kill-switch

El ejecutor debe detenerse y reportar `BLOCKED` ante cualquiera de:

- Repo anidado (`JobIT-platform/.git` u otro `.git` inesperado).
- Rama incorrecta o rama base equivocada.
- Working tree sucio con cambios no relacionados con la tarea.
- Cambios fuera de alcance (rutas no listadas en `Archivos permitidos`).
- Dependencias nuevas no aprobadas (modificación de manifests o lockfiles sin autorización).
- Implementación sin spec aprobada en `docs/specs/`.
- Secrets, tokens, credenciales o datos sensibles detectados.
- Intento de tocar `main` o `dev` directamente.
- Creación de carpetas raíz no autorizadas (`apps/`, `packages/`, `infra/`, `.claude/`, `JobIT-platform/`, etc.).
- Prompt demasiado amplio: alcance no acotado, archivos no listados, criterios de aceptación ausentes o ambiguos.

## Formato de informe final

Al cierre del sprint, el agente entrega un informe con:

- Archivos creados/modificados.
- Resumen de contenido por archivo.
- Verificaciones ejecutadas y su resultado.
- Estado git final (`git status --short`, rama, commits pendientes).
- Riesgos detectados y deuda técnica aceptada.
- Resultado de la auditoría (`PASS / PASS_WITH_NOTES / FAIL`).
- Recomendación para el operador (siguiente paso, PR, correcciones).
```

## Reglas de uso

- El brief se redacta antes de abrir el primer prompt operativo del sprint y se guarda en `docs/sprints/`.
- El brief lo aprueba el operador humano. La IA puede ayudar a redactarlo, pero no se autoaprueba.
- Cualquier cambio de alcance durante el sprint requiere editar el brief y dejar registro del cambio.
- Los marcadores `[...]` deben sustituirse por contenido real. Un brief con marcadores sin rellenar se considera incompleto.
- La lista de `Archivos permitidos` es cerrada: si el agente necesita tocar un archivo no listado, debe detenerse y pedir autorización explícita.
- La lista de `Archivos prohibidos` heredada se respeta siempre, incluso cuando el sprint trate de áreas adyacentes.
- Cada prompt operativo del sprint declara qué skill documental aplica y en qué fase está.
- Los prompts son pequeños, secuenciados y revisables. No se permiten prompts agregados que pidan "haz todo el sprint".
- Si un prompt viola el brief, el agente responde `BLOCKED` y no modifica archivos.

## Criterios de calidad del brief

Un brief válido cumple todas estas condiciones:

- Incluye todas las secciones obligatorias listadas en la plantilla.
- Nombre del sprint claro, único y trazable.
- Objetivo en una o dos frases, centrado en problema y usuario, no en archivos.
- Rama esperada, base y destino de PR explícitos.
- Documentos obligatorios listados con ruta exacta.
- Specs y ADRs aplicables listados o marcados explícitamente como ausentes con justificación.
- Skills documentales obligatorias declaradas por fase.
- Archivos permitidos listados con rutas concretas, sin comodines amplios.
- Archivos prohibidos incluyen al menos el conjunto base del proyecto.
- Fuera de alcance redactado para evitar scope creep.
- Secuencia de prompts ordenada y proporcional al tamaño de la tarea.
- Criterios de aceptación verificables y observables.
- Verificaciones obligatorias con comandos exactos o justificación de no aplicabilidad.
- Condiciones de kill-switch presentes y adaptadas al sprint si aplica.
- Formato de informe final acordado.

Un brief que no cumple alguno de estos puntos se considera deficiente y debe corregirse antes de pasarlo a un chat operador.

## Resultado esperado

Tras aplicar esta plantilla a un sprint concreto, el operador y el agente comparten:

- Un documento `docs/sprints/<sprint>-agent-brief.md` aprobado y trazable.
- Un alcance acotado y verificable, con archivos permitidos cerrados.
- Una secuencia de prompts pequeños, secuenciados y con skill documental declarada.
- Un conjunto explícito de condiciones de kill-switch que cualquier ejecutor debe respetar.
- Un formato común de informe final que facilita revisión humana y PR.

El brief no garantiza la calidad del resultado, pero garantiza que el trabajo se realiza con contexto verificado, alcance limitado y reglas comunes entre humano e IA.
