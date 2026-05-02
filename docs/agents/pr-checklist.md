# Checklist de Pull Request

## Plantilla de PR

```markdown
## Objetivo

Describe brevemente que problema resuelve esta PR.

## Alcance

- 

## Fuera de alcance

- 

## Cambios realizados

- 

## Tests ejecutados

- 

## Auditoria quality/security

Resultado: PASS | PASS_WITH_NOTES | FAIL

Notas:

- 

## Documentacion actualizada

- 

## Riesgos / deuda tecnica

- 

## Checklist

- [ ] La rama sale de `dev`.
- [ ] La PR apunta a `dev`.
- [ ] Existe spec en `docs/specs/` cuando aplica.
- [ ] Los tests minimos estan definidos.
- [ ] Las verificaciones locales se ejecutaron o se justifico por que no aplican.
- [ ] La auditoria quality/security no esta en `FAIL`.
- [ ] La documentacion afectada esta actualizada.
- [ ] No hay secretos ni credenciales.
- [ ] No hay cambios fuera de alcance.
```

## Checklist obligatorio antes de PR

- [ ] Confirmar rama activa.
- [ ] Revisar `git status --short`.
- [ ] Revisar diff completo.
- [ ] Confirmar que no se trabaja en `main` ni en `dev`.
- [ ] Confirmar que la PR apunta a `dev`.
- [ ] Confirmar que la documentacion esta actualizada en la misma rama.
- [ ] Confirmar que la auditoria quality/security es `PASS` o `PASS_WITH_NOTES`.

## Tests ejecutados

La PR debe listar comandos ejecutados y resultado. Si no existe tooling, indicar claramente:

```text
No aplica: el repositorio aun no tiene proyecto tecnico ni tooling de tests.
Verificaciones ejecutadas: git status, revision documental y listado de archivos.
```

## Auditoria

La PR debe incluir el resultado de `docs/agents/audit-quality-security-skill.md`:

- `PASS`: sin bloqueos.
- `PASS_WITH_NOTES`: observaciones no bloqueantes documentadas.
- `FAIL`: no abrir PR hasta corregir.

## Documentacion actualizada

Indicar los documentos modificados o justificar por que no aplica. Si una feature cambia comportamiento, alcance, arquitectura o flujo, la documentacion debe actualizarse en la misma rama.

## Riesgos / deuda tecnica

Registrar riesgos conocidos, decisiones pendientes y deuda tecnica aceptada. No usar esta seccion para ocultar bloqueos reales.
