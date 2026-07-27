# Skill — Git, Push y Pull Request en JobIT

> Documento especializado. La fuente canonica es [`jobit-operating-model-v2.md`](jobit-operating-model-v2.md), que prevalece ante cualquier contradiccion.

## Autorizaciones Git separadas

Las acciones Git requieren autorizacion humana explicita y **separada**. Una autorizacion no implica la siguiente:

```text
COMMIT_APPROVED
PUSH_APPROVED
PR_APPROVED
MERGE_APPROVED
```

- `COMMIT_APPROVED` autoriza crear el commit; no autoriza push.
- `PUSH_APPROVED` autoriza subir la rama; no autoriza abrir PR.
- `PR_APPROVED` autoriza abrir la Pull Request; no autoriza merge.
- `MERGE_APPROVED` autoriza fusionar; debe indicar la PR y el metodo cuando proceda.

El agente puede preparar el cierre (staging, verificaciones, diff, cuerpo de PR) de forma autonoma dentro del plan aprobado, pero no ejecuta ninguna de estas acciones sin su autorizacion correspondiente. No se borran ramas sin autorizacion. No se despliega durante el cierre Git.

## Objetivo

Definir las normas obligatorias para cerrar una tarea o sprint en Git, subir la rama y abrir una Pull Request en JobIT sin contaminar la PR con informes completos, prompts operativos ni metadatos innecesarios.

## Cuándo aplicar esta skill

Aplicar siempre que se vaya a:

- crear un commit;
- hacer push de una rama;
- abrir una Pull Request;
- editar la descripción de una Pull Request;
- preparar el cierre Git de un sprint o tarea.

## Reglas generales

1. Trabajar siempre desde el clon canónico del proyecto:

   `/home/david/projects/JobIT-platform`

2. Si `pwd` no coincide con esa ruta, detener el proceso.

3. Confirmar rama antes de cualquier acción Git.

4. Confirmar `git status --short` antes de stagear.

5. No hacer commit con cambios fuera de alcance.

6. No hacer push si el commit contiene archivos prohibidos.

7. No hacer merge por CLI salvo autorización explícita.

8. No hacer deploy durante un cierre Git/PR.

9. No imprimir ni leer secretos.

10. No añadir `Co-Authored-By` ni trailers de autoría IA.

## Reglas para commits

Antes de commit:

- ejecutar las verificaciones indicadas por el sprint;
- ejecutar `git diff --check`;
- revisar `git diff --name-only`;
- revisar `git diff --cached --name-only` después del staging.

El commit debe:

- tener mensaje claro y corto;
- estar en inglés técnico si sigue convención del repo;
- no incluir `Co-Authored-By`;
- no incluir menciones a Claude, Codex, ChatGPT u otra IA;
- no mezclar cambios fuera del sprint.

## Reglas para push

Antes del push:

- confirmar que `git status --short` está limpio;
- confirmar que el último commit es correcto;
- confirmar que el cuerpo del commit no tiene trailers de IA.

Comandos recomendados:

```bash
git log -1 --pretty=full
git log -1 --pretty=%B
git status --short
```

## Reglas para Pull Requests

La PR debe estar escrita en español.

La PR debe contener:

- título claro;
- resumen breve;
- cambios principales;
- verificaciones ejecutadas;
- fuera de alcance respetado;
- enlace o ruta al informe completo si existe.

La PR NO debe contener:

- informe final completo pegado entero;
- prompts para continuar;
- instrucciones internas para Claude/Codex/ChatGPT;
- logs largos;
- dumps completos de terminal;
- detalles irrelevantes del proceso;
- secretos;
- tokens;
- .env;
- credenciales;
- texto Co-Authored-By.

## Plantilla recomendada de PR

```md
# <Sprint o tarea> — <título corto>

## Resumen

<2-5 líneas explicando el objetivo real de la PR.>

## Cambios principales

- Cambio 1.
- Cambio 2.
- Cambio 3.

## Verificaciones

- `comando` → resultado.
- `comando` → resultado.

## Fuera de alcance respetado

- Sin backend, si aplica.
- Sin Prisma/migraciones, si aplica.
- Sin dependencias nuevas, si aplica.
- Sin deploy, si aplica.

## Informe completo

El informe completo queda versionado en:

`docs/sprints/<archivo-final-report>.md`

## Revisión

PR lista para revisión humana. No mergear por CLI.
```

## Regla sobre informes finales

Los informes finales deben guardarse como archivos Markdown dentro de `docs/sprints/`.

La PR puede enlazar o mencionar el informe, pero no debe copiarlo entero.

## Regla sobre prompts

Los prompts sugeridos para continuar pertenecen al informe final o al chat del operador.

Nunca deben pegarse en:

- cuerpo de la PR;
- comentarios de la PR;
- commits;
- títulos de PR;
- labels;
- descripciones públicas.

## Kill-switch

Detener el cierre Git/PR si ocurre cualquiera de estos casos:

- ruta incorrecta;
- rama incorrecta;
- working tree sucio con cambios no explicados;
- archivos fuera de alcance;
- cambios en .env;
- cambios en secretos;
- cambios en package.json o lockfile no aprobados;
- cambios en Prisma no aprobados;
- commit con Co-Authored-By;
- PR body contiene informe completo;
- PR body contiene prompts operativos;
- PR body no está en español.

## Checklist final antes de entregar la PR

- [ ] Ruta canónica confirmada.
- [ ] Rama correcta confirmada.
- [ ] Scope audit limpio.
- [ ] Tests/verificaciones ejecutadas.
- [ ] `git diff --check` OK.
- [ ] Commit sin Co-Authored-By.
- [ ] Push correcto.
- [ ] PR en español.
- [ ] PR con resumen breve.
- [ ] PR sin informe completo pegado.
- [ ] PR sin prompts operativos.
- [ ] Informe final versionado en `docs/sprints/`.
