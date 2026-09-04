# Runbook — Backup y restore de JobIT

**Spec:** [`docs/specs/features/backup-restore-verification.md`](../specs/features/backup-restore-verification.md)
**Blocker:** `B3-BACKUP-01`

> Este runbook tiene tres secciones deliberadamente separadas. Solo la **A** está
> ejecutada y acreditada. La **B** describe una operación futura que **no está
> activa**. La **C** no está definida.
>
> **Ni staging ni producción tienen backups operativos.** No existe cron, no
> existe destino creado, no existe retención aplicada y no existe restauración
> programada en ningún entorno remoto.

---

## A. Verificación local (ejecutable y acreditada)

Demuestra que un backup de JobIT se puede restaurar de verdad, sobre datos
sintéticos, en contenedores desechables. Es lo que cierra técnicamente el blocker.

### A.1 Requisitos

```text
Docker Engine + Docker Compose      (verificado con 29.3.1 / v5.1.1)
imagen postgres:16                  (ya presente en local; no se descarga nada nuevo)
Node 20 + pnpm                      (solo para `prisma migrate deploy`)
sha256sum, tar, bash                (coreutils / GNU tar / bash 5.x)
```

`psql`, `pg_dump` y `pg_restore` **no se instalan en el host**: se ejecutan desde
la imagen `postgres:16`, lo que además garantiza paridad exacta cliente↔servidor.

ShellCheck **no es requisito**: los tests estáticos usan `bash -n` más
comprobaciones de comandos prohibidos, fugas de secretos, nombres protegidos y
prefijo de workspace.

### A.2 Variables

Todas las genera el propio harness. **No se lee ningún `.env`** y no se reutiliza
ninguna credencial del operador.

```text
B3B_RUN_ID       <yyyymmdd>t<hhmmss>z-<8 hex>, generado por el harness
B3B_PROJECT      jobit-b3-backup-verify-<RUN_ID>
B3B_WORKSPACE    /tmp/jobit-b3-backup-verify-<RUN_ID>
B3B_EVIDENCE_OUT (opcional) directorio FUERA del repositorio para conservar
                 el resumen tras el cleanup
B3B_KEEP=1       (opcional, solo diagnóstico) omite el cleanup
```

### A.3 Ejecución

```bash
# Prueba integral completa (crea, verifica y destruye todo)
./scripts/operations/backup-restore/run-e2e.sh

# Pruebas negativas de las guardas
./scripts/operations/backup-restore/test-guards.sh
```

La prueba integral debe ejecutarse **dos veces desde cero**, con `RUN_ID`
distintos, para acreditar reproducibilidad sin dependencia de residuos.

### A.4 Qué hace, en orden

```text
origen sintético (postgres:16)
→ prisma migrate deploy (9 migraciones)
→ fixtures.sql (27 filas sintéticas en 12 tablas)
→ uploads sintéticos (3 archivos, uno referenciado desde avatarUrl)
→ baseline de integridad del origen
→ pg_dump -Fc  +  tar determinista (origen montado :ro)
→ SHA256SUMS
→ destino nuevo demostrado vacío (base y volumen de uploads)
→ pg_restore --exit-on-error --single-transaction
→ extracción de uploads en el volumen destino, con rechazo de path traversal
→ 18 verificaciones de integridad
→ comprobación de que el origen quedó intacto
→ cleanup y verificación de ausencia de residuos
```

### A.5 Backup (uso aislado)

```bash
./scripts/operations/backup-restore/backup.sh
```

Genera en el workspace `db_<RUN_ID>.dump` (formato custom), `uploads_<RUN_ID>.tar`
(determinista, sin compresión), `SHA256SUMS` y `manifest-origin.txt`.

### A.6 Restore (uso aislado)

```bash
./scripts/operations/backup-restore/restore.sh
```

Verifica el checksum **antes** de tocar el destino, crea la base destino vacía, la
demuestra vacía, restaura y extrae los uploads en el volumen destino.

### A.7 Validación

```bash
./scripts/operations/backup-restore/verify.sh schema   target
./scripts/operations/backup-restore/verify.sh collect  target <fichero>
./scripts/operations/backup-restore/verify.sh compare  <origen> <destino>
./scripts/operations/backup-restore/verify.sh unique    target
./scripts/operations/backup-restore/verify.sh avatars   target <volumen>
```

Estado esperado tras el restore:

```text
tablas en `public`:            13   (12 de aplicación + _prisma_migrations)
migraciones aplicadas:          9
filas sintéticas:              27
manifiesto origen vs destino:  sin diferencias
coherencia avatarUrl↔archivo:  100 %
```

### A.8 Errores frecuentes

| Síntoma | Causa típica | Acción |
|---|---|---|
| `G08: el volumen del run ya existe` | ejecución anterior interrumpida con `B3B_KEEP=1` | limpiar ese `RUN_ID` antes de repetir |
| `G15: puerto prohibido` | colisión con `5432`/`5434`/`3000`/`4000` | repetir: el puerto es dinámico |
| `checksum inválido` (salida 2) | artefacto corrupto o manipulado | **no** se ha tocado el destino; repetir el backup |
| `pg_restore falló` (salida 3) | error real de restauración | revisar `logs/pg_restore.log`; no reintentar a ciegas |
| `integridad` (salida 4) | destino u origen no coinciden con el baseline | no continuar; es exactamente el fallo que la prueba busca detectar |
| `residuos` (salida 5) | cleanup incompleto | no forzar; enumerar por labels y escalar |

### A.9 Cleanup

Automático: un `trap` lo ejecuta igual tras éxito que tras fallo.

```bash
docker compose -p "$B3B_PROJECT" \
  -f docker-compose.backup-restore-verification.yml \
  --env-file "$B3B_WORKSPACE/env" down -v --remove-orphans
```

Solo se ejecuta tras validar el marcador de propiedad y el project name exacto.
**Nunca** `docker system prune` ni `docker volume prune`, y **nunca** `down -v`
sin `-p`.

Comprobación posterior, por labels:

```text
contenedores con com.jobit.run-id=<RUN_ID>: 0
volúmenes con com.jobit.run-id=<RUN_ID>:    0
redes con com.jobit.run-id=<RUN_ID>:        0
workspace:                                  ausente
```

No se exige igualdad global del inventario Docker del host.

### A.10 Recursos protegidos

El harness **nunca** lee, monta, escribe ni borra:

```text
jobit-staging-db-data        (volumen de staging)
jobit-staging-api-uploads    (uploads de staging)
jobit-postgres-test          (base de test del operador, puerto host 5434)
```

Su identidad se registra antes y después de cada ejecución y debe permanecer
idéntica.

### A.11 Rollback

Rollback significa limpiar **solo los recursos sintéticos del run**. Nunca afecta
a `dev`, a staging, a producción ni a recursos ajenos.

```text
1 guarda · 2 checksum · 3 restore · 4 integridad · 5 cleanup
```

---

## B. Operación futura de staging — NO ACTIVA

Nada de esta sección está implantado. Se documenta para que, cuando se autorice,
exista un procedimiento previo escrito.

Referencia heredada sin cambios: [`staging-vps-deploy-runbook.md`](staging-vps-deploy-runbook.md)
§14 (backups) y §16 (rollback), y [`ADR-0012`](../decisions/ADR-0012-staging-deploy-architecture.md).

```text
Estado actual:
  backups programados:      NO EXISTEN
  destino de backups:       NO CREADO
  retención aplicada:       NINGUNA
  restauración de ensayo:   NO EJECUTADA en staging
```

Lo que la sección A **sí** aporta a staging: el procedimiento de restore está
ahora verificado sobre la misma versión de PostgreSQL, el mismo formato de dump y
el mismo modelo de datos. Lo que **no** aporta: ninguna capacidad operativa en el
VPS.

Antes de activar backups en staging harán falta, como mínimo: destino creado
fuera de los volúmenes Docker, programación real, retención decidida, separación
de disco o de host, cifrado en reposo si los datos dejan de ser ficticios, y una
restauración de ensayo ejecutada **en ese entorno**.

### B.1 Contratos pendientes

```text
RETENTION:              DOCUMENTATION_ONLY
OFF_HOST_STORAGE:       DOCUMENTATION_ONLY
PRODUCTION_ENCRYPTION:  DOCUMENTATION_ONLY
```

La propuesta heredada (7 diarios + 4 semanales en `/srv/jobit-staging/backups`)
sigue siendo una **decisión pendiente**; este runbook no la confirma.

### B.2 Almacenamiento

Riesgo documentado y no resuelto: mantener backup y origen en el mismo disco no
es una estrategia de backup. `/srv/jobit-staging/backups` está fuera de los
volúmenes Docker, pero sigue en el mismo VPS. La copia fuera del host queda
pendiente de decisión.

### B.3 Cifrado

No aplica a la verificación local, cuyos artefactos son exclusivamente
sintéticos. Será **obligatorio** en cuanto un backup contenga datos personales
reales, junto con la gestión y rotación de su clave. Gap declarado, no resuelto.

### B.4 Pruebas periódicas y responsabilidades

Pendientes de definir: frecuencia de la restauración de ensayo, entorno donde se
ejecuta, quién la ejecuta y quién valida su evidencia.

---

## C. Producción — NO DEFINIDA

No existe entorno de producción desplegado, ni política de backup, ni destino, ni
retención, ni cifrado, ni objetivos de recuperación aprobados.

```text
PRODUCTION_RPO: NOT_ACCREDITED
PRODUCTION_RTO: NOT_ACCREDITED
```

Solo se han medido **duraciones locales** sobre un dataset sintético de
kilobytes. No son extrapolables a un entorno con volumen productivo. Cualquier
objetivo de RPO o RTO requiere decisión del Orquestador.

---

## Alcance de este runbook

Este documento **no** autoriza deploy, ni activa backups en ningún entorno remoto,
ni crea un blocker nuevo. Complementa, sin modificar,
[`staging-vps-deploy-runbook.md`](staging-vps-deploy-runbook.md).
