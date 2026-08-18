# Documentacion de agentes IA

Esta carpeta define la biblioteca documental neutral para trabajar con agentes IA en JobIT-platform.

`docs/agents/` no es configuracion ejecutable. No instala herramientas, no activa permisos y no define automatizaciones. Su objetivo es ordenar conceptos, flujos, checklists, plantillas, prompts reutilizables y skills neutrales.

## Fuente canonica y jerarquia

La fuente canonica unica del modelo operativo es [`jobit-operating-model-v2.md`](jobit-operating-model-v2.md): define Plan Mode, Execution Mode, niveles de riesgo, SDD/TDD proporcional, auditoria, Git y gates de parada. Existe una sola copia completa del contrato; el resto de documentos lo resumen, especializan o enlazan, y **no lo duplican**. Ante cualquier contradiccion, prevalece la fuente canonica.

Distincion de capas:

- **Contrato** (`jobit-operating-model-v2.md`): la fuente canonica completa.
- **Resumen de entrada** (`AGENTS.md`): punto de entrada obligatorio y resumen operativo.
- **Guias especializadas** (`sdd-tdd-ai-audit-workflow.md`, `tdd-guidelines.md`, `audit-quality-security-skill.md`, `git-pr-skill.md`, `operating-environment.md`): detallan una parte del flujo y enlazan al contrato.
- **Skills documentales neutrales** (`skills/`): reutilizables por cualquier agente; no son skills instaladas ni configuracion ejecutable.
- **Adaptadores** (`CLAUDE.md`, `claude/`, `codex/`, `skills/jobit-operating-model-v2-skill.md`): punteros breves por agente que enlazan al contrato sin duplicarlo.

En este sprint **no se crean skills nativas** ni configuracion ejecutable (`.claude/`, `.codex/`, hooks, settings). Las condiciones para evaluarlas en el futuro estan en [`claude/native-skills-future-plan.md`](claude/native-skills-future-plan.md).

## Capas documentales

- `AGENTS.md`: resumen operativo y punto de entrada, subordinado a la fuente canonica. Define reglas, limites, seguridad, modos de trabajo y niveles de riesgo.
- `CLAUDE.md`: adaptador minimo para Claude Code. Subordinado a `AGENTS.md` y a la fuente canonica; no duplica la gobernanza general.
- `docs/agents/`: biblioteca neutral reutilizable por Codex, Claude Code u otros agentes. Contiene el contrato, guias, flujos, checklists, prompts y plantillas.
- `docs/agents/skills/`: skills documentales neutrales. Describen como ejecutar tipos de trabajo, pero no son skills instaladas ni configuracion ejecutable.
- `docs/agents/checklists/`: checklists para cierre, pre-merge, seguridad u otras revisiones.
- `docs/agents/templates/`: plantillas documentales reutilizables.
- `docs/agents/prompts/`: prompts reutilizables para tareas frecuentes.
- `docs/agents/codex/`: notas de uso para trabajar con Codex.
- `docs/agents/claude/`: notas de uso para trabajar con Claude Code.

## Skills y configuracion ejecutable

Aunque algunos documentos usen la palabra `skill`, por ahora son documentos de trabajo neutrales. No activan capacidades, no instalan herramientas y no conceden permisos.

No se debe crear `.claude/skills/`, `.claude/settings.json`, hooks ni configuracion ejecutable salvo tarea explicita y aprobada.

## Documentos principales

- `jobit-operating-model-v2.md`: contrato operativo canonico (Plan Mode, Execution Mode, niveles de riesgo, SDD/TDD, auditoria, Git).
- `sdd-tdd-ai-audit-workflow.md`: flujo oficial SDD + TDD pragmatico + AI Audit + PR.
- `tdd-guidelines.md`: guia de TDD pragmatico.
- `audit-quality-security-skill.md`: checklist neutral de auditoria quality/security.
- `pr-checklist.md`: plantilla y checklist de Pull Request.
- `workflow.md`: flujo SDD base historico.
- `concepts.md`: glosario conceptual para agentes.

## Skills documentales neutrales

Bajo `docs/agents/skills/`. Todas siguen el mismo esquema (objetivo, cuando usarla, entradas, archivos permitidos, restricciones, checklist, formato de salida, criterio de parada) y son neutrales: no instalan nada ni conceden permisos.

- `sdd.md`: Specification-Driven Development.
- `code-review.md`: revision de cambios y diffs.
- `documentation.md`: creacion y actualizacion de documentacion.
- `git-workflow.md`: flujo de Git en ramas cortas.
- `architecture.md`: decisiones de arquitectura modular candidate-first.
- `security.md`: revision de seguridad documental.
- `testing.md`: definicion de tests minimos con TDD pragmatico.
- `backend-api.md`: diseno documental de endpoints y contratos.
- `frontend-ui.md`: diseno documental de pantallas y estados.
- `database-prisma.md`: diseno documental de modelo de datos.
- `devops-vps.md`: criterios para futuras tareas de despliegue en VPS.
- `privacy-legal-reference.md`: precheck de impacto de privacidad y consulta controlada de la baseline juridica preparatoria de `docs/legal/reference/`.

## Guias especificas para Codex

Bajo `docs/agents/codex/`.

- `README.md`: punto de entrada para trabajar con Codex.
- `prompt-patterns.md`: patrones de prompt seguros y reproducibles.
- `safe-operating-mode.md`: modo de operacion seguro.
- `codex-scope-guard.md`: control de alcance para evitar cambios fuera de lista.
- `codex-diff-review.md`: uso de Codex como revisor de diff, no como implementador.
- `codex-task-brief.md`: plantilla operativa de task brief.

## Guias especificas para Claude Code

Bajo `docs/agents/claude/`.

- `README.md`: punto de entrada para trabajar con Claude Code.
- `skill-authoring-guide.md`: como escribir skills documentales y cuando convertirlas en nativas.
- `permissions-and-hooks.md`: criterios para NO crear hooks ni configuracion ejecutable hoy.
- `claude-plan-mode.md`: flujo plan -> aprobacion humana -> edicion.
- `claude-permission-review.md`: revision documental de permisos antes de activar herramientas.
- `claude-research-review.md`: modo read-only para investigacion y revision.
- `native-skills-future-plan.md`: condiciones para evaluar skills nativas en el futuro.

Recordatorio: tanto las guias para Codex como para Claude Code son documentacion neutral. No configuran agentes, no conceden permisos y no activan automatizaciones.

## Principio de uso

Los agentes deben partir de `AGENTS.md`, consultar la fuente canonica y la documentacion neutral necesaria, y ejecutar tareas completas dentro de un plan aprobado —con archivos permitidos, criterios de aceptacion claros y revision humana final— en lugar de fragmentar cada sprint en micro-prompts por defecto.

No se debe implementar codigo sin spec aprobada (o brief aprobado) y sin revision humana; las acciones Git requieren autorizacion separada.
