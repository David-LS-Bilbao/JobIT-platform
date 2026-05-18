# Executor Startup Skill

## Propósito

Definir el ritual obligatorio de alineación que debe completar cualquier chat ejecutor (operador humano, Codex o Claude) antes de modificar archivos del repositorio JobIT-platform.

El objetivo es eliminar errores recurrentes como trabajar sobre el repositorio equivocado, sobre una rama incorrecta, con un working tree sucio, o sin haber leído la spec y el brief que justifican el cambio. Esta skill no implementa nada; solo asegura que la ejecución posterior se haga sobre contexto verificado.

Aunque el archivo se nombra como `skill`, su ubicación en `docs/agents/` indica que es un protocolo documental neutral. No instala ninguna skill ejecutable, no configura agentes y no activa automatizaciones.

## Cuándo se aplica

- Al iniciar cualquier chat ejecutor que vaya a crear, modificar o eliminar archivos del repositorio.
- Antes de aplicar cualquier prompt de Pre-Sprint, Sprint o tarea ad-hoc que contenga acciones sobre el filesystem o sobre git.
- Antes de cualquier intervención manual del operador que afecte al repositorio (no solo agentes IA).
- Cuando se retoma una rama existente tras una pausa, para revalidar contexto.

No se aplica a consultas puramente informativas que no modifican archivos ni ejecutan comandos con efectos colaterales.

## Documentos base obligatorios

Antes de empezar, el ejecutor debe haber leído o tener accesible:

- [AGENTS.md](../../AGENTS.md) — reglas maestras de agentes y operador para todo el proyecto.
- [docs/agents/sdd-tdd-ai-audit-workflow.md](sdd-tdd-ai-audit-workflow.md) — flujo SDD + TDD pragmático + AI Audit que enmarca cualquier cambio.
- [docs/agents/tdd-guidelines.md](tdd-guidelines.md) — pautas de TDD pragmático aplicadas en el proyecto.
- [docs/agents/audit-quality-security-skill.md](audit-quality-security-skill.md) — auditoría documental/técnica previa a PR.
- [docs/agents/pr-checklist.md](pr-checklist.md) — checklist obligatorio antes de abrir Pull Request.
- [docs/specs/](../specs/) — specs funcionales aprobadas; ninguna feature se implementa sin spec aquí.
- [docs/decisions/](../decisions/) — ADRs aprobados que condicionan el alcance técnico.
- `docs/sprints/*-agent-brief.md` — brief específico del Sprint o Pre-Sprint que motiva la tarea actual.

Si alguno de estos documentos falta o el ejecutor no puede leerlo, el ritual se detiene y se reporta como bloqueo.

## Ritual obligatorio de inicio

Pasos mínimos. Deben ejecutarse en orden y registrar su salida en el Alignment Report:

1. Leer los documentos base obligatorios listados arriba.
2. Leer el sprint agent brief aplicable a la tarea actual.
3. Confirmar la ubicación de trabajo:

   ```bash
   pwd
   ```

4. Confirmar el top-level real del repositorio:

   ```bash
   git rev-parse --show-toplevel
   ```

5. Confirmar la rama activa:

   ```bash
   git branch --show-current
   ```

6. Revisar el estado del working tree:

   ```bash
   git status --short
   ```

7. Comprobar que no exista un repositorio anidado dentro del repositorio:

   ```bash
   test -d JobIT-platform/.git && echo "HAY REPO ANIDADO" || echo "NO hay repo anidado"
   ```

8. Verificar archivos permitidos y prohibidos declarados en el prompt o brief, contrastándolos con el estado real del repositorio.
9. Emitir el Alignment Report con la estructura definida más abajo.
10. Esperar la validación del operador si hay riesgos, ambigüedades o decisiones pendientes. No proceder con modificaciones hasta recibir confirmación explícita.

Si la tarea requiere comprobaciones adicionales (por ejemplo, verificar la base de la rama contra `dev`/`origin/dev`, listar ADRs aplicables o validar inexistencia de archivos previos), se añaden tras el paso 7 y se incluyen en el Alignment Report.

## Alignment Report obligatorio

Todo ejecutor debe emitir este informe antes de modificar archivos. La estructura es reutilizable y debe completarse con datos reales, no con plantillas vacías:

```md
# Alignment Report

## Repo detectado
## Top-level
## Rama actual
## Estado git
## Repo anidado
## Documentos leídos
## Specs aplicables
## ADRs aplicables
## Archivos permitidos
## Archivos prohibidos
## Riesgos detectados
## Decisión: PASS / PASS_WITH_NOTES / BLOCKED
```

Reglas para la decisión:

- `PASS`: contexto verificado, sin riesgos relevantes, alcance claro. Se puede proceder con la tarea.
- `PASS_WITH_NOTES`: contexto válido pero con observaciones que deben quedar registradas (por ejemplo, archivos untracked irrelevantes, ramas sin upstream, dependencias documentales por confirmar). Se puede proceder, pero el operador debe ver y aceptar las notas antes.
- `BLOCKED`: existe al menos una condición de parada (ver más abajo). Se detiene la ejecución y se espera resolución.

El Alignment Report no es opcional, no se resume y no se compacta. Es la prueba de que se realizó el ritual.

## Reglas antes de modificar archivos

- No crear, modificar ni eliminar archivos hasta que el Alignment Report esté emitido y, si aplica, validado por el operador.
- Respetar estrictamente la lista de archivos permitidos declarada en el prompt o brief.
- No tocar archivos fuera de alcance, especialmente:

  ```txt
  AGENTS.md
  CLAUDE.md
  docs/context/current-state.md
  ```

- No tocar lockfiles, manifests de paquetes ni archivos de infraestructura salvo que el brief lo autorice de forma explícita.
- No tocar `.claude/` ni crear configuración, hooks, permisos o skills locales sin tarea explícita.
- No crear carpetas raíz nuevas sin autorización (`apps/`, `packages/`, `infra/`, etc.).
- No implementar código de aplicación sin spec aprobada en `docs/specs/`.
- No instalar dependencias, no ejecutar build/tests/lint en pasos puramente documentales.
- No hacer commit, push, merge, rebase ni reset sin instrucción explícita.
- No cambiar de rama ni crear ramas adicionales como efecto colateral.

## Relación con SDD/TDD/Audit

Esta skill es la fase **Startup / Alignment** previa al flujo de trabajo formal del proyecto, descrito en [docs/agents/sdd-tdd-ai-audit-workflow.md](sdd-tdd-ai-audit-workflow.md).

Orden de aplicación dentro de una tarea:

1. **Startup** — esta skill: ritual de alineación y Alignment Report.
2. **Spec** — verificar o redactar spec en `docs/specs/` si la tarea es una feature.
3. **Tests mínimos / TDD** — definir tests antes de implementar, según `docs/agents/tdd-guidelines.md`.
4. **Implementación asistida** — cambios pequeños y reversibles.
5. **Verificación local** — tests, lint, build o equivalentes.
6. **Auditoría quality/security** — ejecutar la checklist de `docs/agents/audit-quality-security-skill.md`.
7. **Correcciones** — si la auditoría falla, se corrige dentro de la misma rama.
8. **Actualización documental** — en la misma rama, no como tarea posterior.
9. **PR hacia `dev`** — siguiendo `docs/agents/pr-checklist.md`.

La Executor Startup Skill no sustituye ninguna fase posterior. Es condición previa: si el ritual no se completa con `PASS` o `PASS_WITH_NOTES`, ninguna fase posterior debe iniciarse.

## Condiciones de parada

El ejecutor debe declarar la decisión como `BLOCKED` y detenerse si detecta cualquiera de las siguientes condiciones:

- **Repo anidado**: existe un `JobIT-platform/.git` dentro del propio repositorio, u otro `.git` no esperado.
- **Rama incorrecta**: la rama activa no coincide con la rama declarada en el brief, o no se ha cortado desde `dev` cuando el brief lo exige.
- **Working tree sucio no relacionado**: hay cambios staged, modificados o untracked que no pertenecen a la tarea actual.
- **Archivos fuera de alcance**: el prompt pide modificar o crear archivos no incluidos en la lista de archivos permitidos.
- **Implementación sin spec**: la tarea es una feature de producto y no existe spec aprobada en `docs/specs/`.
- **Secrets detectados**: aparecen tokens, credenciales, claves API o cualquier dato sensible en el contexto, el diff o los archivos a modificar.
- **Intento de tocar `main` o `dev` directamente**: el prompt o el estado de la rama implicarían commit, push o modificación directa sobre `main` o `dev`.
- **Creación de carpetas raíz no autorizadas**: el prompt pide crear directorios de nivel superior (`apps/`, `packages/`, `infra/`, `.claude/`, `JobIT-platform/`, etc.) sin autorización explícita.
- **Documentos base ausentes o ilegibles**: alguno de los documentos base obligatorios no existe o no puede ser leído.
- **Conflicto con AGENTS.md o CLAUDE.md**: el prompt contradice reglas vigentes en los documentos maestros del proyecto.

Ante cualquiera de estas condiciones, el ejecutor reporta el bloqueo, no toca archivos y espera instrucciones del operador.

## Resultado esperado

Al terminar el ritual de Executor Startup, el operador y el agente comparten un estado verificable:

- Un Alignment Report con datos reales y decisión `PASS`, `PASS_WITH_NOTES` o `BLOCKED`.
- Una lista clara de documentos base leídos y specs/ADRs aplicables.
- Una lista clara de archivos permitidos y prohibidos para la tarea inmediata.
- Un registro explícito de riesgos detectados, incluso si son menores.
- Una decisión consciente de continuar (`PASS` / `PASS_WITH_NOTES` con notas aceptadas) o detenerse (`BLOCKED`).

Solo cuando este resultado existe y el operador lo valida, el ejecutor puede aplicar el prompt operativo de la tarea (creación o modificación de archivos, ejecución de comandos, etc.) dentro del alcance autorizado.
