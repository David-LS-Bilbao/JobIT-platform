# Operator Safety Checklist

## Propósito

Definir una checklist operativa de seguridad que debe usar el chat operador (humano o asistente orquestador) antes de autorizar cualquier prompt a Codex o Claude y después de recibir su resultado.

El objetivo es que el operador no actúe por confianza implícita en el agente. Cada prompt debe pasar un control previo, y cada resultado debe pasar un control posterior, antes de aceptarse como entregable o de continuar con la siguiente fase del sprint.

Este documento es documental. No instala skills ejecutables, no configura agentes y no automatiza nada. Su ubicación en `docs/agents/` indica que es un instrumento neutral de trabajo.

## Cuándo usar esta checklist

- Antes de enviar cualquier prompt operativo a Codex o Claude que pueda modificar archivos, ejecutar comandos o producir entregables del sprint.
- Después de recibir cualquier resultado del agente que afirme haber creado, modificado o eliminado archivos.
- Antes de pasar al siguiente prompt de la secuencia del sprint.
- Antes de stagear, commitear, abrir PR o tomar cualquier decisión que dependa del trabajo del agente.
- Cuando se reanuda el trabajo en una rama tras una pausa o cambio de contexto.

No es necesaria para consultas puramente informativas que no producen efectos sobre el repositorio.

## Checklist antes de enviar un prompt

Verificar uno a uno antes de pulsar enviar:

- [ ] Existe un sprint agent brief aprobado en `docs/sprints/*-agent-brief.md`, o el orquestador ha proporcionado contexto equivalente que cumple los criterios de [docs/agents/sprint-agent-brief-template.md](sprint-agent-brief-template.md).
- [ ] El prompt declara explícitamente `Skill documental aplicada:` con ruta concreta dentro de `docs/agents/`.
- [ ] El prompt declara explícitamente `Fase:` con uno de los valores válidos (Startup, SDD Review, TDD Planning, Implementación, Verificación, Audit, Informe final).
- [ ] El objetivo del prompt es pequeño, concreto y verificable. No es genérico ni acumulativo.
- [ ] La lista de archivos permitidos es cerrada, con rutas explícitas, sin comodines amplios de riesgo.
- [ ] Está declarado el fuera de alcance, evitando ambigüedad sobre scope creep.
- [ ] Existen criterios de aceptación observables (archivos existen, secciones presentes, comando devuelve resultado X).
- [ ] Existen verificaciones concretas (comandos exactos o pasos de revisión).
- [ ] Está definido el formato esperado de salida, con secciones obligatorias del informe.
- [ ] El prompt **no** pide "hacer todo el sprint", "arreglar lo que veas", "tocar lo que necesites" ni equivalentes.
- [ ] El prompt respeta las prohibiciones del proyecto (no `.claude/`, no `main`, no `dev`, no lockfiles, no carpetas raíz nuevas sin autorización).

Si alguna casilla queda sin marcar, el operador no envía el prompt; lo corrige primero.

## Checklist técnica inicial

Antes de aceptar el primer prompt operativo de un sprint o de retomar trabajo, el operador ejecuta personalmente este bloque de diagnóstico. Son comandos de **lectura** que no modifican el repositorio:

```bash
pwd
git rev-parse --show-toplevel
git branch --show-current
git status --short
test -d JobIT-platform/.git && echo "HAY REPO ANIDADO" || echo "NO hay repo anidado"
```

Reglas de uso:

- Estos comandos son de diagnóstico y solo lectura. No deben modificar el repositorio, el índice de git ni el filesystem.
- Si alguno revela una desviación (rama incorrecta, working tree sucio no relacionado, repo anidado, top-level inesperado), no se envía ningún prompt operativo hasta resolverlo.
- El resultado debe quedar reflejado en el Alignment Report descrito en [docs/agents/executor-startup-skill.md](executor-startup-skill.md).
- Si el operador no puede ejecutar estos comandos por sí mismo, exige al agente que los ejecute y reporte salida literal antes de continuar.

## Checklist de alcance del prompt

Comprobar específicamente el alcance del prompt antes de enviarlo:

- [ ] La lista de archivos permitidos no incluye ningún archivo prohibido del proyecto.
- [ ] No se autoriza tocar `.claude/` salvo orden explícita y justificada del operador humano.
- [ ] No se permite `git add .` ni patrones equivalentes (`git add -A`, `git add *`).
- [ ] No se autoriza instalar dependencias (`npm install`, `pnpm add`, `yarn add`, etc.).
- [ ] No se autoriza modificar lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`).
- [ ] No se autoriza modificar manifests (`package.json`, `pyproject.toml`, `Cargo.toml`, etc.) salvo brief explícito.
- [ ] No se autoriza crear carpetas raíz no incluidas en el plan del repositorio (`apps/`, `packages/`, `infra/`, `.claude/`, `JobIT-platform/`, etc.).
- [ ] No se autoriza tocar `main` ni `dev` directamente: nada de commits, push, reset o switch destructivo sobre esas ramas.
- [ ] No se mezclan implementación, refactor, tests y documentación en un mismo prompt salvo autorización explícita y justificación.
- [ ] No se introducen comodines de archivo amplios cuando exista riesgo de tocar áreas no listadas.

Si alguna casilla falla, el prompt se reescribe con alcance más estrecho antes de enviarse.

## Checklist después de recibir resultado

Cuando llega la respuesta del agente, antes de aceptar el resultado:

- [ ] Confirmar la lista exacta de archivos creados, modificados o eliminados que declara el agente.
- [ ] Ejecutar `git status --short` y contrastar con la lista declarada por el agente.
- [ ] Ejecutar `git diff --check` para detectar problemas de whitespace u otros conflictos triviales.
- [ ] Si un archivo está **untracked**, recordar que `git diff` no muestra su contenido por diseño; pedir al agente una lectura segura del archivo (resumen, lista de secciones, conteo de líneas) sin modificarlo, o leerlo manualmente.
- [ ] Comparar los archivos efectivamente tocados contra la lista de `Archivos permitidos` del prompt. Cualquier desviación es bloqueante.
- [ ] Detectar cambios accidentales: archivos no listados, archivos reformateados sin orden, archivos renombrados, archivos eliminados sin autorización.
- [ ] Verificar que el agente **no** ha ejecutado por su cuenta `git add`, `git commit`, `git push`, `git merge`, `git rebase`, `git reset` ni `git switch` salvo autorización explícita del prompt.
- [ ] Verificar que el agente **no** ha instalado dependencias, modificado lockfiles, ni creado carpetas raíz no autorizadas.
- [ ] Verificar que el contenido entregado se alinea con la skill documental declarada y con la fase indicada.
- [ ] Comprobar que el informe del agente contiene todas las secciones obligatorias declaradas en `Formato esperado de salida`.
- [ ] Registrar la decisión del operador: PASS, PASS_WITH_NOTES o BLOCKED, con motivo.

Si cualquiera de estos puntos falla, la decisión natural es BLOCKED hasta corrección.

## Comandos mínimos de verificación

Bloque copiable que el operador (o el agente bajo su autorización) ejecuta al recibir el resultado para tener una primera lectura del estado del repositorio:

```bash
git branch --show-current
git status --short
find docs/agents docs/sprints -maxdepth 2 -type f | sort
git diff --check
```

Reglas:

- Estos comandos no sustituyen a las verificaciones específicas declaradas en el `Verificaciones` del prompt o del sprint agent brief.
- Pueden ampliarse según el sprint (por ejemplo, listar `docs/specs/` o `docs/decisions/` si la tarea los toca, o ejecutar tests del paquete afectado en pasos no documentales).
- Su salida debe quedar reflejada en el informe del operador junto a la decisión PASS / PASS_WITH_NOTES / BLOCKED.
- Si el repositorio vive en Windows o en una shell sin `find` POSIX, sustituir por la herramienta equivalente sin perder el alcance del listado.

## Decisión del operador

Tras aplicar los checklists previo y posterior, el operador emite una decisión explícita:

- **PASS**: se acepta el resultado sin notas relevantes. El alcance se respetó, los archivos coinciden con lo permitido, las verificaciones pasaron, no hay riesgos abiertos. Se puede continuar con el siguiente prompt o cerrar la tarea.
- **PASS_WITH_NOTES**: se acepta el resultado, pero con riesgos no bloqueantes que deben quedar documentados (por ejemplo, archivos untracked preexistentes, divergencia menor de estilo, decisiones documentales por confirmar). Se puede continuar, pero las notas viajan al informe de cierre y, si aplica, a la PR.
- **BLOCKED**: el resultado no se acepta. Existe al menos una desviación de alcance, de seguridad, de proceso o de calidad que impide continuar. El flujo se detiene y se decide corrección, reescritura del prompt o escalado al operador humano.

La decisión se registra en el informe del operador y se comunica antes de enviar el siguiente prompt. Sin decisión explícita, no se continúa.

## Errores comunes que debe evitar el operador

- Aceptar un resultado sin haber ejecutado `git status --short` por su cuenta o sin haber visto la salida real.
- Permitir prompts demasiado amplios ("haz todo", "arregla lo que veas", "toca lo necesario") por comodidad o urgencia.
- Dejar que Codex o Claude decida qué dependencias instalar, qué librerías añadir o qué versiones fijar sin ADR aprobado.
- Aceptar cambios en archivos no incluidos en la lista de `Archivos permitidos` porque "parecen razonables".
- Olvidar revisar specs en `docs/specs/` o ADRs en `docs/decisions/` antes de autorizar un prompt de implementación.
- Permitir que el agente ejecute commits, push, merge, rebase o reset por iniciativa propia o como parte de un prompt mal acotado.
- Ignorar `.claude/` u otros archivos untracked preexistentes; no abordarlos en commit aparte y arrastrarlos al primer commit del sprint.
- Confundir documentación con implementación: aceptar código ejecutable en un Pre-Sprint puramente documental, o aceptar documentación como sustituto de tests cuando la fase exige tests reales.
- Encadenar prompts sin emitir decisión PASS / PASS_WITH_NOTES / BLOCKED para cada uno.
- Aceptar informes del agente sin verificar que contienen todas las secciones declaradas en el formato esperado de salida.

## Resultado esperado

Cuando esta checklist se aplica de forma sistemática:

- Cada prompt enviado a Codex o Claude cumple el contrato definido en [docs/agents/codex-claude-skill-invocation.md](codex-claude-skill-invocation.md).
- Cada resultado recibido se valida contra el alcance acordado y contra el estado real del repositorio.
- Los desvíos se detectan temprano y se gestionan como BLOCKED antes de acumular cambios fuera de alcance.
- El operador conserva el control sobre dependencias, ramas, commits y decisiones de producto.
- El historial del sprint queda compuesto por una secuencia de prompts y resultados con decisión documentada, no por aceptaciones implícitas.

Esta checklist no reemplaza el criterio del operador, pero le da un mínimo común reproducible para no depender de la memoria ni de la prisa en cada paso.
