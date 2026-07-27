# JobIT Operating Model v2 — adaptador documental neutral

Este archivo es un **adaptador documental neutral**: un puntero para agentes (Claude, Codex u otros) que descubran las skills desde `docs/agents/skills/`.

**No contiene el contrato completo.** La fuente canónica única es:

- [`../jobit-operating-model-v2.md`](../jobit-operating-model-v2.md)

El contrato operativo no se duplica: existe una sola copia completa. Ante cualquier contradicción entre documentos, **prevalece la fuente canónica**.

## Resumen mínimo

- El trabajo se organiza en **Plan Mode** (solo lectura) y, tras `PLAN_APPROVED`, **Execution Mode** autónomo.
- La autonomía se controla por **nivel de riesgo** (1 bajo / 2 medio / 3 alto), no por micro-prompts.
- Dentro de un plan aprobado, el agente completa las fases internas (spec → RED → GREEN → refactor → verificaciones → auditoría → informe) sin prompts intermedios.
- El agente **no** puede ampliar alcance, tocar áreas prohibidas, usar secretos, desplegar ni hacer commit/push/PR/merge sin autorización explícita y separada.

Para reglas completas, niveles de riesgo, SDD/TDD, auditoría, Git y gates de parada, consulta siempre la [fuente canónica](../jobit-operating-model-v2.md).
