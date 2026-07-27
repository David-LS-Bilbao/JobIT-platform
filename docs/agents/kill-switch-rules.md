# Kill-switch Rules

## Propósito

Definir las reglas de parada inmediata aplicables a cualquier chat ejecutor (operador humano, Codex o Claude) que esté trabajando sobre el repositorio JobIT-platform.

Activar el kill-switch no es un fallo del proceso ni una sanción al agente: es una protección del proyecto frente a desviaciones de alcance, riesgos de seguridad, errores de contexto y decisiones no autorizadas. La pausa controlada siempre es preferible a un repositorio contaminado o a una PR que mezcla cambios fuera de alcance.

Este documento es documental. No instala skills ejecutables, no configura agentes y no automatiza nada. Su ubicación en `docs/agents/` indica que es un instrumento neutral de trabajo.

## Regla principal

Ante cualquier condición crítica listada en este documento, el ejecutor debe:

1. Detenerse antes de modificar más archivos.
2. Informar al operador con un informe `BLOCKED` claro y trazable.
3. Esperar una decisión humana explícita antes de continuar.

No se admiten correcciones silenciosas, intentos de "limpiar" la situación, ni continuar "porque ya casi está". El kill-switch siempre prevalece sobre la inercia del prompt en curso.

## Quién puede activar el kill-switch

Cualquiera de los siguientes participantes puede y debe activar el kill-switch al detectar una condición crítica:

- **Chat operador** (humano o asistente orquestador): es el activador natural; valida prompts y resultados según [docs/agents/operator-safety-checklist.md](operator-safety-checklist.md).
- **Codex**: si recibe un prompt que viola el contrato de [docs/agents/codex-claude-skill-invocation.md](codex-claude-skill-invocation.md) o si detecta una desviación durante la ejecución.
- **Claude**: igual que Codex; debe responder `BLOCKED` antes de tocar archivos cuando se cumpla una condición de parada.
- **Revisor humano**: durante la revisión de diffs o PR, puede ordenar la parada del flujo aunque el ejecutor lo considere terminado.
- **Auditoría documental**: la auditoría de [docs/agents/audit-quality-security-skill.md](audit-quality-security-skill.md) puede emitir `FAIL` y disparar el kill-switch hasta corrección.
- **Cualquier verificación automatizada**: hooks, linters, tests, pipelines o scripts de validación que detecten una condición crítica. Su salida con error es suficiente motivo para activar el kill-switch, incluso si el operador no lo ha ordenado todavía.

El kill-switch no requiere consenso. Una sola fuente legítima que detecte una condición crítica basta para activarlo.

## Condiciones obligatorias de parada

El ejecutor debe activar el kill-switch ante cualquiera de estas condiciones:

- **Repo anidado**: existe `JobIT-platform/.git` u otro `.git` no esperado dentro del repositorio.
- **Rama incorrecta**: la rama activa no coincide con la rama declarada en el brief, o no se ha cortado desde la base esperada (`dev` por defecto).
- **Working tree sucio no relacionado**: hay cambios staged, modificados o untracked ajenos al alcance del prompt.
- **Cambios fuera de alcance**: el prompt o el resultado afectan a archivos no listados en `Archivos permitidos`.
- **Dependencias no aprobadas**: modificación de `package.json`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json` u otros manifests/lockfiles sin autorización explícita respaldada por ADR o brief.
- **Implementación sin spec**: la tarea es una feature de producto y no existe spec aprobada en `docs/specs/`.
- **Secrets o credenciales**: aparición de tokens, claves API, contraseñas, certificados o cualquier dato sensible en el contexto, el diff o los archivos a modificar.
- **Tocar `main` o `dev` directamente**: cualquier intento de commit, push, reset o switch destructivo sobre `main` o `dev`.
- **Crear carpetas raíz no autorizadas**: aparición o creación de `apps/`, `packages/`, `infra/`, `.claude/`, `JobIT-platform/` u otras carpetas de nivel raíz sin autorización explícita.
- **Prompt demasiado amplio**: el prompt pide "haz todo el sprint", "arregla lo que veas", "toca lo necesario" o equivalentes, violando [docs/agents/codex-claude-skill-invocation.md](codex-claude-skill-invocation.md).
- **Archivos permitidos no definidos**: el prompt no incluye lista cerrada de `Archivos permitidos` o usa comodines amplios sin justificación.
- **ADR/spec obligatoria ausente**: el cambio requiere ADR en `docs/decisions/` o spec en `docs/specs/` y no existe o no está aprobada.
- **Conflicto entre prompt, brief y AGENTS.md**: el prompt operativo contradice el sprint agent brief, o ambos contradicen reglas vigentes en `AGENTS.md`.
- **Modificación de `.claude/` sin autorización explícita**: cualquier creación, edición o staging dentro de `.claude/` sin orden documentada del operador.
- **Uso de `git add .` (o equivalente)** cuando hay archivos untracked fuera de alcance: incluye `git add -A`, `git add *`, comodines amplios o cualquier patrón que arrastre archivos no listados.
- **Commit, push, merge, rebase o reset sin autorización explícita**: ninguna mutación git destructiva o publicada se ejecuta sin orden del operador, incluso si el ejecutor cree que "es lo que toca".

Esta lista es mínima, no exhaustiva. Un sprint puede añadir condiciones específicas en su brief; nunca puede eliminarlas.

## Qué hacer al activar el kill-switch

Secuencia obligatoria cuando se dispara el kill-switch:

1. **Parar**. No se aplican más cambios al filesystem, al índice de git ni al estado del repositorio.
2. **No seguir generando cambios**: ningún `Write`, `Edit`, `git add`, `git commit`, comando de instalación o script con efectos colaterales.
3. **Capturar el estado con comandos de solo lectura**, usando el bloque seguro de diagnóstico:

   ```bash
   pwd
   git rev-parse --show-toplevel
   git branch --show-current
   git status --short
   git diff --check
   test -d JobIT-platform/.git && echo "HAY REPO ANIDADO" || echo "NO hay repo anidado"
   ```

   Estos comandos no modifican nada y dejan trazas de diagnóstico aprovechables por el operador.

4. **Emitir un informe `BLOCKED`** con estructura clara. Como mínimo:

   - Decisión: `BLOCKED`.
   - Causa: condición concreta de la lista de parada que se ha disparado.
   - Estado git capturado (salida real de los comandos de diagnóstico).

5. **Listar archivos afectados**: rutas creadas, modificadas o staged hasta el momento del kill-switch. Si no hay archivos tocados, indicarlo explícitamente.
6. **Explicar la causa** con detalle suficiente para que el operador entienda el riesgo y la decisión, sin minimizar.
7. **Proponer opciones seguras de recuperación**: por ejemplo, ajustar el alcance del prompt, autorizar explícitamente la excepción, revertir el cambio parcial, abrir un cambio aparte para resolver el untracked previo, redactar el ADR o spec ausentes.
8. **Esperar la decisión del operador**. El kill-switch sigue activo hasta que llegue una autorización explícita.

El informe `BLOCKED` es la prueba de que se activó el kill-switch correctamente. No se resume ni se compacta.

## Qué no hacer después de activar el kill-switch

Una vez activo el kill-switch, queda terminantemente prohibido:

- Seguir editando archivos para "corregir" o "limpiar" la situación sin autorización.
- Hacer commit, incluso si los cambios parecen completos o intuitivamente correctos.
- Hacer push hacia el remoto, incluyendo ramas nuevas o tags.
- Hacer merge, rebase o reset (especialmente `--hard`), aunque parezca la forma rápida de salir.
- Borrar archivos para ocultar el problema o reducir el diff visible.
- Instalar dependencias para "desbloquear" el flujo o cumplir un requisito implícito.
- Ampliar el alcance del prompt para corregir sin permiso (por ejemplo, tocar otros archivos "porque ya estaba ahí").
- Usar `git add .`, `git add -A`, `git add *` ni comodines amplios.
- Tocar `.claude/` sin autorización explícita del operador.
- Reescribir el historial (`git commit --amend`, `git rebase -i`, `git reflog`-based recovery) sin orden documentada.
- Sustituir el informe `BLOCKED` por un resumen optimista o ambiguo.

Cualquier acción de esta lista convierte el kill-switch en un incidente y debe registrarse como tal.

## Cómo desbloquear el flujo

El kill-switch solo se desbloquea cuando se cumplen todas estas condiciones:

1. Existe una **decisión explícita** del operador o del orquestador que autoriza continuar, dirigir el flujo a otra acción o cerrar la tarea.
2. La causa del kill-switch ha sido entendida y, cuando procede, mitigada (por ejemplo, ADR redactada, spec aprobada, `.gitignore` ajustado, dependencia revisada, secret retirado).
3. Se emite un **nuevo prompt pequeño** conforme al contrato de [docs/agents/codex-claude-skill-invocation.md](codex-claude-skill-invocation.md), que incluya:

   - Causa documentada del kill-switch anterior.
   - Alcance reducido y archivos permitidos cerrados.
   - Verificación de recuperación: comandos o pasos que confirmen que el riesgo ya no está presente antes de continuar.

4. El ejecutor reinicia con un Alignment Report actualizado conforme a [docs/agents/executor-startup-skill.md](executor-startup-skill.md), reflejando el nuevo estado del repositorio.

Sin estos cuatro puntos, el kill-switch sigue activo. La inercia ("pero ya estaba casi terminado") no es razón válida para desbloquearlo.

## Ejemplos prácticos

- **Se detecta `JobIT-platform/.git`**: el ejecutor detecta un repositorio anidado al ejecutar el test de diagnóstico. Activa kill-switch, informa al operador con la salida literal y propone como recuperación auditar el origen de la carpeta anidada antes de cualquier cambio.
- **Codex intenta modificar `package.json` en sprint documental**: un Pre-Sprint puramente documental no autoriza tocar manifests. Codex detecta la desviación, responde `BLOCKED` citando "dependencias no aprobadas" y "cambios fuera de alcance", y devuelve el control al operador.
- **Aparece un secret en el diff**: durante la verificación tras un prompt, el ejecutor o el operador detecta una cadena con apariencia de token o credencial. Kill-switch activado, no se hace commit, no se hace push, se informa con la ruta exacta y se propone retirar la cadena antes de continuar.
- **Se está en `main` o `dev`**: el ritual de Startup revela que la rama activa es `main` o `dev` y el prompt pide modificar archivos. El ejecutor activa kill-switch citando "tocar `main` o `dev` directamente", no toca nada y propone crear una rama de trabajo desde `dev` antes de continuar.
- **`.claude/` aparece untracked y alguien propone `git add .`**: el operador observa que un prompt utiliza `git add .` con `.claude/` untracked. Kill-switch activado: el comando arrastraría archivos fuera de alcance. Se propone usar `git add` con rutas explícitas o resolver `.claude/` en un cambio aparte.
- **No existe la spec obligatoria**: el prompt pide implementar una feature pero no hay spec en `docs/specs/`. El ejecutor activa kill-switch, no inicia implementación y solicita la spec aprobada antes de continuar.
- **El prompt pide "implementar todo Sprint 01 Auth"**: prompt demasiado amplio, sin lista cerrada de archivos, mezclando fases y sin un plan aprobado. El ejecutor activa kill-switch citando [docs/agents/codex-claude-skill-invocation.md](codex-claude-skill-invocation.md) y pide al operador un plan acotado (Plan Mode) con lista cerrada de archivos antes de ejecutar; en Nivel 3, ademas, descomponer en fases controladas.

En todos los casos, el resultado es el mismo: parada, informe `BLOCKED`, espera de decisión humana.

## Relación con otros documentos

Este documento se apoya en y refuerza el resto del marco operativo de agentes:

- [docs/agents/executor-startup-skill.md](executor-startup-skill.md): el ritual de Startup detecta de forma temprana muchas de las condiciones que activan el kill-switch (rama, repo anidado, working tree sucio, documentos base ausentes).
- [docs/agents/sprint-agent-brief-template.md](sprint-agent-brief-template.md): cada brief de sprint declara su propia sección `Condiciones de kill-switch`, que hereda este documento y puede añadir condiciones específicas del sprint.
- [docs/agents/codex-claude-skill-invocation.md](codex-claude-skill-invocation.md): los prompts deficientes son una causa directa de kill-switch; este documento define qué prompts son deficientes y cuándo `BLOCKED` es la respuesta correcta.
- [docs/agents/operator-safety-checklist.md](operator-safety-checklist.md): los checklists previos y posteriores son la herramienta práctica para detectar condiciones críticas que disparan el kill-switch.
- [docs/agents/audit-quality-security-skill.md](audit-quality-security-skill.md): una auditoría `FAIL` es razón suficiente para activar el kill-switch; aquí se formaliza esa relación.
- [AGENTS.md](../../AGENTS.md): conjunto maestro de reglas del proyecto. Cualquier conflicto entre prompt, brief y AGENTS.md es condición obligatoria de parada.

Cualquier nuevo documento del marco de agentes debe ser coherente con estas reglas. Si un documento contradice el kill-switch, prevalece este último mientras no haya una decisión documentada en sentido contrario.

## Resultado esperado

Cuando el kill-switch funciona como debe:

- Los riesgos críticos se detectan y se detienen en seco, antes de contaminar el repositorio.
- El operador recibe informes `BLOCKED` claros, con causa, estado y opciones de recuperación.
- Ningún cambio dudoso llega a commit, a `push` ni a PR sin decisión humana explícita.
- Los desbloqueos se documentan con un nuevo prompt pequeño y un Alignment Report actualizado.
- El historial del sprint refleja honestamente las paradas y reanudaciones, no las oculta.

El kill-switch no es un obstáculo al flujo: es la condición que hace seguro el flujo asistido por IA en JobIT-platform.
