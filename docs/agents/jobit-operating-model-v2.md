# JobIT Operating Model v2
## Contrato operativo canónico para chats operadores y agentes de desarrollo

**Versión:** 2.0
**Proyecto:** JobIT Platform
**Naturaleza del producto:** Plataforma modular en producción
**Método:** Autonomía controlada por riesgo + SDD + TDD selectivo + revisión humana
**Estatus:** Fuente canónica única. Prevalece sobre cualquier otro documento operativo del repositorio en caso de contradicción. Los documentos especializados (`AGENTS.md`, guías de `docs/agents/`, skills neutrales y adaptadores) resumen o especializan este contrato y enlazan aquí; no lo duplican.

---

## 1. Propósito de esta skill

Esta skill define cómo debe trabajar cualquier chat operador y cualquier agente de desarrollo —Claude, Codex u otro— dentro de JobIT.

Su objetivo es reducir iteraciones innecesarias y evitar el exceso de micro-prompts, sin perder:

- control de alcance;
- seguridad;
- calidad;
- trazabilidad;
- tests;
- documentación;
- revisión humana;
- protección del producto en producción.

El modelo anterior exigía aprobación entre casi todos los pasos:

```txt
inspección
→ spec
→ test RED
→ implementación GREEN
→ refactor
→ verificaciones
→ informe
→ commit
→ PR
```

Ese sistema fue útil durante la construcción inicial, pero genera demasiadas interrupciones y consumo de prompts.

El nuevo modelo permite que, una vez aprobado el plan, el agente ejecute autónomamente todo el trabajo autorizado:

```txt
prompt inicial
→ Plan Mode
→ aprobación humana
→ Execution Mode autónomo
→ informe final
→ revisión humana
→ corrección o autorización de commit/PR
```

---

## 2. Principio rector

> **Más autonomía dentro de un alcance aprobado; control estricto en los límites, riesgos y acciones irreversibles.**

No se abandona SDD ni TDD.

Se cambia de:

```txt
control manual paso a paso
```

a:

```txt
autonomía controlada por gates
```

El agente puede completar de forma autónoma todas las tareas previstas en el plan aprobado, pero no puede:

- ampliar el alcance;
- tocar áreas prohibidas;
- cambiar decisiones arquitectónicas sin aprobación;
- instalar dependencias no autorizadas;
- modificar contratos sensibles no previstos;
- usar secretos;
- desplegar;
- hacer commit, push, abrir PR o mergear sin autorización explícita.

---

## 3. Contexto permanente de JobIT

JobIT es una plataforma fullstack modular de empleo tecnológico **en producción**.

La versión actual es candidate-first e incluye, entre otros:

- autenticación;
- dashboard candidato;
- JobIT CV;
- perfil profesional;
- portfolio público;
- búsqueda de ofertas;
- ofertas guardadas;
- match explicable;
- fuentes de ofertas;
- CI;
- E2E;
- preparación Docker y staging.

No debe tratarse como:

- un prototipo;
- una demo;
- un experimento;
- un proyecto descartable;
- un “MVP” en trabajo nuevo.

Las referencias históricas a MVP pueden conservarse en documentos antiguos, pero en nuevas specs, prompts e informes debe usarse:

- producto en producción;
- alcance actual;
- versión candidate-first;
- roadmap posterior;
- fuera del alcance de este sprint;
- fase futura.

---

## 4. Arquitectura de trabajo

### 4.1 Chat director u orquestador

Mantiene la visión global y decide:

- prioridad del roadmap;
- alcance del sprint;
- nivel de riesgo;
- criterios de aceptación;
- restricciones;
- aprobación del plan;
- autorización para acciones Git;
- cierre o reapertura del sprint.

### 4.2 Chat operador

Gestiona un sprint concreto.

Sus funciones son:

1. recibir el contexto y esta skill;
2. preparar el prompt inicial para el agente;
3. revisar el plan;
4. elevar el plan al Chat Director cuando sea necesario;
5. autorizar Execution Mode después de la aprobación;
6. dejar trabajar al agente dentro del alcance acordado;
7. revisar el informe final, el diff y las verificaciones;
8. decidir entre:
   - solicitar corrección;
   - pedir una verificación adicional;
   - autorizar commit;
   - autorizar push;
   - autorizar PR;
   - cerrar como PASS, PASS_WITH_NOTES o BLOCKED.

El operador no debe dividir automáticamente cada sprint en una cadena larga de micro-prompts.

### 4.3 Agente de desarrollo

El agente debe trabajar en dos modos:

```txt
Plan Mode
Execution Mode
```

No puede entrar en Execution Mode hasta que el plan haya sido aprobado.

---

## 5. Modelo de autonomía por riesgo

Antes de iniciar un sprint, el operador debe clasificarlo.

## Nivel 1 — Riesgo bajo / autonomía alta

Ejemplos:

- documentación;
- copy;
- ajustes visuales pequeños;
- tokens de diseño;
- accesibilidad frontend localizada;
- tests frontend;
- refactors internos sin cambio contractual;
- limpieza de código;
- informes;
- comentarios;
- actualización de docs.

Flujo recomendado:

```txt
Plan Mode
→ aprobación
→ ejecución completa
→ informe final
→ revisión
→ commit/PR autorizado
```

El agente puede completar el sprint en una única ejecución tras aprobar el plan.

---

## Nivel 2 — Riesgo medio / autonomía controlada

Ejemplos:

- formularios;
- navegación;
- estado de sesión en frontend;
- manejo de errores;
- cambios en rutas privadas;
- E2E;
- CI;
- Docker local;
- cambios en lógica de presentación;
- refactors que afectan varias features;
- cambios de UX transversales.

Flujo recomendado:

```txt
Plan Mode
→ aprobación
→ ejecución completa dentro del alcance
→ checkpoint final obligatorio
→ revisión humana del diff y tests
→ commit/PR autorizado
```

El agente puede hacer RED, GREEN, refactor y verificaciones sin pedir permiso entre pasos.

Debe detenerse si aparece un cambio arquitectónico no previsto.

---

## Nivel 3 — Riesgo alto / control estricto

Ejemplos:

- backend;
- autenticación;
- autorización;
- seguridad;
- Prisma;
- migraciones;
- contratos HTTP/DTO;
- datos reales;
- ingesta externa;
- secretos;
- dependencias críticas;
- despliegue real;
- infraestructura productiva;
- cambios destructivos;
- privacidad;
- backups y restauración;
- lógica de scoring o decisiones sobre personas.

Flujo recomendado:

```txt
Plan Mode
→ aprobación
→ implementación por gates técnicos
→ revisión humana en puntos críticos
→ verificaciones completas
→ informe final
→ autorización separada de Git/deploy
```

En este nivel sí pueden mantenerse fases separadas cuando exista riesgo real, pero deben agruparse tareas relacionadas para evitar microgestión innecesaria.

---

## 6. Flujo estándar de un sprint

## Paso 1 — Prompt inicial

El Chat Director u operador entrega:

- nombre del sprint;
- objetivo;
- contexto;
- nivel de riesgo;
- alcance;
- fuera de alcance;
- archivos permitidos;
- archivos prohibidos;
- criterios de aceptación;
- tests;
- restricciones;
- formato del informe final;
- acciones Git no autorizadas.

El prompt inicial no debe pedir implementar todavía.

---

## Paso 2 — Plan Mode

El agente inspecciona y entrega un plan.

Debe incluir:

1. estado inicial del repositorio;
2. documentos y código revisados;
3. comprensión del objetivo;
4. alcance confirmado;
5. riesgos;
6. archivos previstos;
7. cambios previstos;
8. estrategia SDD;
9. estrategia TDD;
10. verificaciones;
11. posibles bloqueos;
12. fases internas;
13. preguntas o decisiones pendientes.

Durante Plan Mode:

- no editar;
- no aplicar parches;
- no crear archivos;
- no instalar dependencias;
- no crear commits;
- no hacer push;
- no abrir PR;
- no desplegar.

---

## Paso 3 — Aprobación humana

El Chat Director u operador puede responder:

```txt
PLAN_APPROVED
```

o aprobar con ajustes concretos.

La aprobación debe fijar:

- alcance;
- archivos permitidos;
- archivos prohibidos;
- decisiones técnicas;
- tests;
- nivel de autonomía;
- gates de parada.

Una vez aprobado, el agente no debe volver a pedir permiso para cada tarea interna prevista.

---

## Paso 4 — Execution Mode autónomo

El agente puede ejecutar todo el sprint aprobado:

```txt
crear o actualizar spec
→ escribir tests RED cuando proceda
→ implementar GREEN
→ refactorizar
→ ejecutar tests parciales
→ ejecutar quality gates finales
→ revisar el diff
→ preparar informe final
```

No necesita detenerse entre RED, GREEN y refactor si todo estaba incluido en el plan.

Debe respetar siempre:

- alcance;
- restricciones;
- archivos permitidos;
- decisiones aprobadas;
- seguridad;
- compatibilidad;
- calidad de producción.

---

## Paso 5 — Informe final

El agente no debe limitarse a decir “terminado”.

Debe entregar evidencia suficiente para revisión.

Formato mínimo:

```md
# Informe final

## Sprint o tarea
## Objetivo inicial
## Estado inicial
## Trabajo realizado
## Archivos creados
## Archivos modificados
## Tests y verificaciones
## Resultado de typecheck
## Resultado de tests
## Resultado de lint
## Resultado de build
## Resultado de E2E o smoke
## Decisiones técnicas
## Cambios respecto al plan aprobado
## Problemas encontrados
## Seguridad y privacidad
## Fuera de alcance respetado
## Deuda o riesgos pendientes
## Estado Git
## Recomendación
```

El informe debe indicar claramente:

```txt
READY_FOR_REVIEW
```

No debe hacer commit ni PR por iniciativa propia.

---

## Paso 6 — Revisión del operador

El operador revisa:

- diff;
- archivos afectados;
- alcance;
- tests;
- build;
- calidad;
- seguridad;
- riesgos;
- coherencia con specs;
- compatibilidad con producción.

Decide uno de estos estados:

```txt
PASS
PASS_WITH_NOTES
CORRECTION_REQUIRED
BLOCKED
```

Solo después se autoriza, de forma separada:

```txt
COMMIT_APPROVED
PUSH_APPROVED
PR_APPROVED
MERGE_APPROVED
```

Una autorización no implica automáticamente las siguientes.

---

## 7. SDD en el nuevo modelo

SDD sigue siendo obligatorio cuando cambia comportamiento importante.

Debe existir spec mínima antes o durante la implementación aprobada si el sprint afecta:

- flujo de usuario;
- contrato;
- modelo de datos;
- reglas de negocio;
- seguridad;
- autenticación;
- privacidad;
- API;
- comportamiento público;
- arquitectura;
- scoring;
- despliegue;
- datos reales.

La spec debe incluir:

- objetivo;
- usuario afectado;
- flujo principal;
- modelo o datos;
- endpoints si aplica;
- pantallas;
- reglas de negocio;
- validaciones;
- errores;
- accesibilidad;
- criterios de aceptación;
- tests mínimos;
- fuera de alcance.

### No hace falta una spec nueva para

- correcciones documentales;
- copy;
- comentarios;
- tokens visuales;
- refactor puramente interno;
- cambios muy pequeños cubiertos por una spec existente.

En esos casos debe indicarse qué spec existente actúa como fuente de verdad.

---

## 8. TDD en el nuevo modelo

TDD se mantiene, pero se aplica de forma proporcional.

## TDD obligatorio

- reglas de negocio;
- validaciones;
- endpoints;
- auth;
- permisos;
- separación por usuario;
- scoring;
- transformaciones de datos;
- errores;
- regresiones;
- formularios con comportamiento;
- estados frontend complejos;
- fixes reproducibles.

Flujo interno:

```txt
RED
→ GREEN
→ REFACTOR
```

El agente puede completar las tres fases sin pedir permiso intermedio.

## Tests primero recomendados

- componentes con estados;
- navegación;
- mensajes de error;
- accesibilidad;
- filtros;
- paginación;
- sesión;
- integración entre features.

## TDD no obligatorio de forma literal

- documentos;
- comentarios;
- estilos puramente visuales;
- reemplazo de tokens;
- cambios de copy sin lógica;
- configuración mínima claramente verificable.

En estos casos se deben usar verificaciones equivalentes:

- grep;
- typecheck;
- lint;
- build;
- revisión visual;
- diff check;
- tests existentes.

---

## 9. Harness y skills del agente

El agente debe aprovechar las skills, herramientas y harness disponibles para ejecutar el sprint con menos intervención.

Puede usar, dentro del alcance aprobado:

- análisis del repositorio;
- búsqueda de referencias;
- lectura de specs;
- ejecución de tests;
- Playwright;
- revisión visual;
- lint;
- typecheck;
- build;
- Git diff;
- validación de rutas;
- inspección de errores;
- generación de informes.

La existencia de harness no elimina los límites.

El agente no puede usar herramientas para:

- cambiar alcance;
- acceder o imprimir secretos;
- desplegar sin permiso;
- modificar producción;
- instalar dependencias sin autorización;
- realizar acciones Git no autorizadas.

---

## 10. Política de prompts

### Objetivo

Reducir el número de prompts sin reducir calidad.

### Cantidad esperada

Un sprint normal debería requerir aproximadamente:

```txt
1. prompt inicial;
2. respuesta Plan Mode;
3. aprobación;
4. informe final;
5. corrección opcional;
6. autorización Git.
```

No debe crearse un prompt diferente para cada archivo o test salvo que:

- el sprint sea de riesgo alto;
- aparezca un bloqueo;
- haya cambio de alcance;
- falle una verificación importante;
- se necesite una decisión arquitectónica.

### Evitar

```txt
“ahora crea el test”
“ahora implementa”
“ahora haz refactor”
“ahora ejecuta lint”
“ahora ejecuta build”
```

Todo eso debe formar parte de Execution Mode.

---

## 11. Gates de parada obligatoria

El agente debe detenerse y reportar `BLOCKED` si encuentra:

- ruta distinta de `/home/david/projects/JobIT-platform`;
- repositorio equivocado;
- working tree sucio no explicado;
- repositorio anidado;
- rama base incorrecta;
- cambios ajenos al sprint;
- secretos;
- necesidad de cambiar archivos prohibidos;
- necesidad de instalar dependencias no autorizadas;
- necesidad de modificar Prisma o contratos no aprobados;
- necesidad de tocar producción;
- pérdida de datos;
- migración destructiva;
- conflicto entre spec y código;
- tests existentes que fallan antes del cambio;
- riesgo de seguridad no contemplado;
- ampliación de alcance necesaria;
- imposibilidad de verificar criterios de aceptación.

En lugar de improvisar, debe entregar:

```txt
BLOCKED
Causa:
Impacto:
Evidencia:
Decisión necesaria:
Opciones:
```

---

## 12. Seguridad y producción

Todo cambio se realiza sobre un producto en producción.

Prioridades:

1. correctitud;
2. seguridad;
3. privacidad;
4. estabilidad;
5. compatibilidad;
6. tests;
7. accesibilidad;
8. documentación;
9. experiencia de usuario;
10. velocidad de entrega.

No se permite:

- confiar en el frontend para seguridad;
- exponer datos entre usuarios;
- imprimir secretos;
- usar datos reales en tests;
- añadir claves al repo;
- ejecutar seed ficticio en producción sin política explícita;
- confundir mocks con datos reales;
- cambiar auth sin revisión;
- degradar errores seguros;
- saltarse CI;
- ocultar deuda o limitaciones.

---

## 13. Datos mock, fixtures y producción

Debe distinguirse siempre:

```txt
fixtures de tests
seed de desarrollo
datos demo de staging
datos reales de producción
```

Reglas:

- fixtures de tests se mantienen;
- seed de desarrollo puede mantenerse;
- datos demo deben estar identificados y aislados;
- producción no debe presentar mocks como datos reales;
- los scripts de seed no deben ejecutarse automáticamente en producción;
- la activación de fuentes reales necesita revisión legal, técnica y operativa;
- cualquier cambio de datos reales es riesgo alto.

---

## 14. Git y revisión humana

Reglas permanentes:

- no trabajar directamente en `main`;
- no trabajar directamente en `dev`;
- partir de `dev` actualizado;
- una rama por sprint o tarea;
- commits pequeños y claros cuando se autoricen;
- no añadir `Co-Authored-By`;
- no añadir autoría de Claude, Codex o IA;
- no hacer commit sin autorización;
- no hacer push sin autorización;
- no abrir PR sin autorización;
- no mergear sin autorización;
- no borrar ramas sin autorización.

Antes de pedir autorización Git:

```bash
git status --short
git diff --check
git diff --stat
git diff --name-only
```

El agente debe confirmar que no hay archivos fuera de alcance.

---

## 15. Quality gates

Cuando aplique código frontend:

```bash
pnpm --filter @jobit/web typecheck
pnpm --filter @jobit/web test
pnpm --filter @jobit/web lint
pnpm --filter @jobit/web build
```

Cuando aplique código backend:

```bash
pnpm --filter @jobit/api exec prisma generate
pnpm --filter @jobit/api typecheck
pnpm --filter @jobit/api test
pnpm --filter @jobit/api build
```

Cuando aplique flujo candidato:

```bash
pnpm --filter @jobit/web test:e2e
```

Cuando aplique Docker o staging:

```bash
docker compose config
docker compose build
docker compose up -d
```

Siempre:

```bash
git diff --check
git status --short
```

El agente debe usar solo los comandos que correspondan al alcance real y justificar los omitidos.

---

## 16. Plantilla de prompt inicial de sprint

```txt
PROMPT INICIAL — Chat Operador · <nombre del sprint>

Rol:
Actúa como Chat Operador del sprint y aplica la skill “JobIT Operating Model v2”.

Producto:
JobIT es una plataforma modular en producción. No es un prototipo ni un MVP.

Nivel de riesgo:
Nivel 1 / Nivel 2 / Nivel 3.

Objetivo:
...

Contexto:
...

Alcance:
...

Fuera de alcance:
...

Archivos permitidos:
...

Archivos prohibidos:
...

Criterios de aceptación:
...

Tests y verificaciones:
...

Restricciones:
- No ampliar alcance.
- No tocar archivos prohibidos.
- No instalar dependencias sin autorización.
- No usar secretos.
- No hacer deploy.
- No hacer commit, push, PR ni merge sin autorización.
- No añadir Co-Authored-By ni autoría de IA.

Flujo obligatorio:
1. Empieza en Plan Mode.
2. Inspecciona sin modificar.
3. Entrega un plan completo.
4. Espera aprobación.
5. Tras PLAN_APPROVED, entra en Execution Mode.
6. Ejecuta autónomamente SDD/TDD, implementación y verificaciones.
7. Entrega informe final READY_FOR_REVIEW.
8. Espera decisión del operador.

Formato del Plan Mode:
...

Formato del informe final:
...
```

---

## 17. Plantilla de aprobación

```txt
PLAN_APPROVED

Nivel de autonomía:
...

Alcance aprobado:
...

Archivos permitidos:
...

Archivos prohibidos:
...

Decisiones técnicas aprobadas:
...

Tests obligatorios:
...

Gates de parada:
...

Puedes entrar en Execution Mode y completar autónomamente:
- spec;
- tests RED;
- implementación GREEN;
- refactor;
- verificaciones;
- informe final.

No puedes:
- ampliar alcance;
- instalar dependencias;
- tocar áreas prohibidas;
- hacer commit;
- hacer push;
- abrir PR;
- mergear;
- desplegar.
```

---

## 18. Plantilla de revisión final del operador

```txt
REVIEW_RESULT

Estado:
PASS / PASS_WITH_NOTES / CORRECTION_REQUIRED / BLOCKED

Alcance:
OK / NO OK

Tests:
OK / NO OK

Build:
OK / NO OK

Seguridad:
OK / NO OK

Documentación:
OK / NO OK

Archivos fuera de alcance:
NINGUNO / DETALLE

Correcciones requeridas:
...

Siguiente acción:
- autorizar corrección;
- autorizar commit;
- autorizar push;
- autorizar PR;
- cerrar sprint.
```

---

## 19. Cuándo volver temporalmente a micro-prompts

Usar control paso a paso solo cuando:

- el riesgo sea Nivel 3;
- haya migraciones;
- se cambie auth;
- se cambien permisos;
- se toquen datos reales;
- haya un incidente;
- se trabaje sobre producción;
- exista riesgo de pérdida de datos;
- el plan cambie durante la ejecución;
- aparezcan fallos no comprendidos;
- sea necesaria una decisión humana intermedia.

No usar micro-prompts por costumbre.

---

## 20. Criterio de éxito del modelo

Este modelo funciona si conseguimos:

- menos prompts;
- menos interrupciones;
- sprints más rápidos;
- mismos o mejores tests;
- misma seguridad;
- mejor trazabilidad;
- menos errores de coordinación;
- ningún scope creep;
- ninguna acción Git o productiva no autorizada.

La velocidad no se obtiene eliminando controles.

Se obtiene colocando los controles en los puntos correctos:

```txt
antes de ejecutar
en los límites del alcance
en los gates de riesgo
antes de Git
antes de producción
```

---

## 21. Regla final

> El agente debe ser autónomo para ejecutar, pero no autónomo para redefinir el sprint.

El plan aprobado es el contrato operativo.

Dentro de ese contrato, el agente puede trabajar de principio a fin.

Fuera de ese contrato, debe detenerse y pedir una decisión.
