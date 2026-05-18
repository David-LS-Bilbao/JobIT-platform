# Codex/Claude Skill Invocation

## Propósito

Definir el contrato obligatorio de prompt que deben recibir Codex y Claude cuando se les pide ejecutar trabajo sobre el repositorio JobIT-platform.

El objetivo es que ningún paso operativo dependa de prompts genéricos, ambiguos o de gran alcance. Cada prompt es una unidad de trabajo pequeña, trazable y revisable, anclada a una skill documental concreta y a una fase del flujo SDD + TDD + AI Audit. Sin este contrato, los agentes IA tienden a derivar hacia decisiones de producto, arquitectura o dependencias que no les corresponden.

Este documento es documental. No instala skills ejecutables, no configura agentes y no automatiza nada. Su ubicación en `docs/agents/` indica que es un instrumento neutral de trabajo.

## Regla principal

Ningún prompt operativo puede ser genérico del tipo *"haz todo el sprint"*, *"arregla lo que veas"* o *"crea la arquitectura completa"*.

Todo prompt operativo debe:

1. Declarar la skill documental que aplica y la fase del flujo.
2. Acotar el objetivo a un resultado concreto, observable y pequeño.
3. Listar los archivos permitidos como conjunto cerrado.
4. Listar restricciones y elementos fuera de alcance.
5. Definir criterios de aceptación verificables y verificaciones concretas.
6. Pedir un informe de salida con estructura fija.

Si un prompt no cumple estos seis puntos, el agente debe responder `BLOCKED` y no modificar archivos.

## Formato obligatorio de prompt

Bloque copiable. Cada campo es obligatorio y debe rellenarse con contenido específico antes de enviarse a Codex o Claude:

```md
Skill documental aplicada:
Fase:
Objetivo:
Contexto:
Archivos permitidos:
Tareas:
Restricciones:
Fuera de alcance:
Criterios de aceptación:
Verificaciones:
Formato esperado de salida:
```

Los campos se mantienen en este orden. Un prompt que altere el orden o que omita campos se considera deficiente y debe corregirse antes de ejecutarse.

## Campos obligatorios

- **Skill documental aplicada**: documento o skill que guía el paso. Debe ser una ruta concreta dentro de `docs/agents/` (por ejemplo `docs/agents/executor-startup-skill.md` o `docs/agents/audit-quality-security-skill.md`).
- **Fase**: una de `Startup`, `SDD Review`, `TDD Planning`, `Implementación`, `Verificación`, `Audit` o `Informe final`. No se admiten fases inventadas ni combinadas.
- **Objetivo**: resultado concreto del paso, en una o dos frases. Describe qué se entrega, no cómo. Evita verbos vagos como *mejorar*, *limpiar* o *ajustar* sin objeto concreto.
- **Contexto**: información mínima necesaria para entender el paso: estado de la rama, decisiones previas relevantes, archivos ya creados, documentos base aplicables. No incluye historia exhaustiva del proyecto.
- **Archivos permitidos**: lista cerrada de rutas que el agente puede crear o modificar. Una ruta por línea. Sin comodines amplios. Si la tarea es de solo lectura, debe indicarse explícitamente.
- **Tareas**: acciones concretas y pequeñas. Numeradas. Cada tarea debe poder verificarse de forma independiente. No se admiten tareas tipo *"haz lo necesario"*.
- **Restricciones**: prohibiciones técnicas y de alcance aplicables al paso (no instalar dependencias, no tocar lockfiles, no cambiar de rama, no hacer commit/push, no ejecutar build/tests si no aplica, etc.).
- **Fuera de alcance**: lo que no debe hacerse aunque parezca relacionado. Explicita scope creep evitable (otros documentos, otras features, otras ramas, otros sprints).
- **Criterios de aceptación**: condiciones observables que permiten considerar el paso terminado (archivo existe, sección X presente, comando devuelve resultado Y, auditoría `PASS`, etc.).
- **Verificaciones**: comandos o revisiones que el agente está autorizado a ejecutar para comprobar el resultado (`git status --short`, `git diff --check`, lectura del archivo, etc.). Si el agente debe abstenerse de ejecutar tooling, debe indicarse aquí.
- **Formato esperado de salida**: estructura fija del informe que el agente debe devolver al operador. Define títulos de secciones obligatorias del informe.

## Ejemplo mínimo válido

Prompt documental pequeño, conforme al contrato:

```md
Skill documental aplicada: docs/agents/sdd-tdd-ai-audit-workflow.md
Fase: SDD Review
Objetivo: Revisar la spec docs/specs/features/auth.md y verificar que cubre objetivo, alcance, fuera de alcance, criterios de aceptación y tests mínimos. No modificar la spec.
Contexto: Rama docs/pre-sprint-00e-agent-startup-protocol cortada desde dev. La spec de auth ya existe en el repositorio. No hay implementación todavía.
Archivos permitidos:
- (solo lectura) docs/specs/features/auth.md
Tareas:
1. Leer docs/specs/features/auth.md.
2. Verificar presencia de las secciones obligatorias.
3. Anotar carencias detectadas.
Restricciones:
- No modificar ningún archivo.
- No ejecutar tests, lint, build ni git mutaciones.
- No proponer cambios fuera de la spec revisada.
Fuera de alcance:
- Implementar Sprint 01 Auth.
- Crear o modificar otros documentos.
- Tocar ADRs.
Criterios de aceptación:
- Informe identifica si la spec está completa o incompleta.
- Si está incompleta, listado claro de secciones faltantes o débiles.
Verificaciones:
- git status --short (sin cambios esperados).
Formato esperado de salida:
- Resultado SDD Review — auth
- Spec revisada
- Secciones encontradas
- Secciones faltantes o débiles
- Riesgos o notas
- Recomendación para el operador
```

## Ejemplos no válidos

Los siguientes prompts vulneran el contrato y deben rechazarse por el agente:

- *"Implementa todo Sprint 01 Auth."* — objetivo demasiado amplio, sin lista de archivos permitidos, sin fase, sin skill declarada.
- *"Arregla lo que veas."* — sin objetivo concreto, sin criterios de aceptación, scope abierto.
- *"Crea la arquitectura completa."* — fase no acotada, decisiones de producto/arquitectura no autorizadas, sin ADR de soporte.
- *"Haz los tests y cambia lo que necesites."* — mezcla fases, scope abierto, autoriza modificaciones no listadas.
- *"Toca cualquier archivo necesario."* — sin archivos permitidos cerrados; viola la regla de alcance.
- *"Refactoriza la API y de paso ajusta el frontend."* — mezcla implementación, refactor y áreas distintas en un solo prompt.
- *"Instala lo que haga falta para que funcione."* — autoriza dependencias sin ADR ni autorización explícita.

Ante un prompt así, el agente responde `BLOCKED`, cita la regla violada y pide al operador un prompt conforme al contrato.

## Reglas de tamaño y alcance

- Un prompt equivale a una fase o tarea pequeña. No se acumulan fases en un solo prompt.
- La lista de archivos permitidos es cerrada y se redacta antes del prompt, no se infiere.
- No se instalan dependencias salvo autorización explícita respaldada por ADR o brief.
- No se crean carpetas raíz nuevas (`apps/`, `packages/`, `infra/`, `.claude/`, `JobIT-platform/`, etc.) sin autorización explícita.
- No se usan comodines amplios (`**/*`, `apps/*/**`) cuando exista riesgo de tocar áreas no listadas.
- No se mezclan implementación, refactor, tests y documentación en un único prompt salvo autorización explícita y justificación del operador.
- Si el resultado esperado supera lo razonable para un único informe, el operador divide la tarea en prompts más pequeños antes de ejecutarla.
- Cuando el agente detecta que el prompt no se puede cumplir sin salir del alcance, lo reporta como `BLOCKED` antes de tocar archivos.

## Verificaciones esperadas

Cada salida del agente debe incluir, como mínimo:

- **Archivos creados o modificados**: lista exacta de rutas afectadas. Si no hay archivos tocados, indicarlo.
- **Comandos ejecutados**: comandos exactos invocados durante el paso (git, lectura de archivos, verificaciones documentales).
- **Resultado de verificaciones**: salida o resumen de `git status --short`, `git diff --check`, lecturas seguras del archivo, etc.
- **Estado git final**: rama activa, cambios staged, modificados, untracked y si se han hecho operaciones git (no se esperan salvo autorización).
- **Riesgos o notas**: observaciones relevantes para el operador, incluyendo deuda técnica aceptada o cuestiones a confirmar.
- **Recomendación para el operador**: siguiente paso sugerido o petición de validación.

Si el prompt prohíbe ejecutar ciertas verificaciones (por ejemplo, no ejecutar tests en un paso documental), el agente lo indica explícitamente y no las invoca.

## Relación con el Alignment Report

El primer prompt de cualquier sprint, Pre-Sprint o tarea ejecutable debe ser **Startup + Alignment Report**, conforme al ritual de [docs/agents/executor-startup-skill.md](executor-startup-skill.md).

Reglas de relación entre prompts y Alignment Report:

- Antes del Alignment Report, ningún prompt operativo se ejecuta. Si el operador envía uno, el agente exige Startup primero.
- El Alignment Report fija contexto verificado: repo, top-level, rama, estado git, repo anidado, documentos leídos, specs y ADRs aplicables, archivos permitidos y prohibidos, riesgos y decisión `PASS / PASS_WITH_NOTES / BLOCKED`.
- Los prompts posteriores deben respetar lo declarado en el Alignment Report. Cualquier desviación (archivos no listados, ramas distintas, secrets, etc.) reactiva el kill-switch.
- Si durante el sprint cambia el contexto (nuevo archivo permitido, cambio de rama, nueva dependencia documental), se emite un Alignment Report actualizado antes de continuar.
- El cierre del sprint también respeta el contrato: el informe final declara qué prompts se aplicaron, qué skill cada uno y si el Alignment Report siguió vigente durante todo el trabajo.

## Resultado esperado

Cuando esta skill se aplica correctamente:

- Cada prompt operativo es pequeño, trazable y anclado a una skill documental y una fase.
- Codex y Claude trabajan dentro de un alcance cerrado, sin decisiones de producto o arquitectura no autorizadas.
- El operador humano puede revisar cada paso de forma independiente, con un informe estructurado y verificable.
- El historial del sprint queda compuesto por una secuencia ordenada de prompts y respuestas, no por un único bloque monolítico.
- Los desvíos se detectan temprano vía `BLOCKED`, antes de que el repositorio acumule cambios fuera de alcance.

Este contrato no garantiza la calidad final del producto, pero garantiza que el trabajo se realiza con reglas comunes entre operador y agente, y con trazabilidad suficiente para auditar cualquier paso.
