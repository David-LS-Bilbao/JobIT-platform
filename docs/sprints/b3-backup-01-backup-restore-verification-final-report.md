# Informe final

## Sprint o tarea

Backup and Restore Verification — `B3-BACKUP-01`. Sin numeración oficial de sprint.

## Objetivo inicial

Cerrar técnicamente el production blocker `B3-BACKUP-01` («Backup y restore no
probados») acreditando una **restauración real** de los dos estados persistentes
de JobIT en un destino nuevo, aislado y desechable, con datos exclusivamente
sintéticos, y demostrando que el origen no se altera.

## Baseline

```text
Repositorio:  git@github.com:David-LS-Bilbao/JobIT-platform.git
Ruta:         /home/david/projects/JobIT-platform
Rama base:    dev
Baseline:     8b49b2dff61dc19f7d8fd7ef200eeb7d39bfb9be
Rama trabajo: fix/b3-backup-01-backup-restore-verification
```

`HEAD`, `dev` y `origin/dev` coincidían exactamente con el baseline. Working tree
limpio, staging vacío, sin repositorios anidados ni divergencia local.

Entorno: WSL2, Docker Engine 29.3.1, Docker Compose v5.1.1, Node 20.19.5,
pnpm 10.0.0, Bash 5.2.21, GNU tar 1.35, coreutils 9.4.

## Nivel de riesgo

`LEVEL_3` / `HIGH_RISK_CONTROLLED` — infraestructura y datos. Ejecución con
guardas duras, pruebas negativas y autorización Git separada.

## Estado inicial

Antes de este trabajo **no existía ninguna evidencia de restore**. Verificado por
búsqueda sobre `docs/`, `scripts/`, `.github/workflows/` y `package.json`:

- `docs/deployment/staging-vps-deploy-runbook.md:234-235` — «Prueba de
  restauración: **pendiente**».
- `docs/sprints/sprint-20-final-report.md:135` — «Prueba de restauración de
  backups pendiente de programar».
- `docs/sprints/sprint-22-…-audit-report.md:250` (INFRA-03) — «Estrategia
  documentada, restore real **no ensayado**», `PRODUCTION_GAP` / `P1`.

No existían `scripts/` ni `docker/`, ni jobs de CI de backup. Lo existente era
decisión arquitectónica y procedimiento documentado, nunca ejecutado.

## Inventario persistente acreditado

```text
APPLICATION_TABLES:                     12
PRISMA_CONTROL_TABLES:                  1
EXPECTED_PUBLIC_TABLES_AFTER_MIGRATION: 13
```

Verificado en runtime sobre origen y destino:

```text
CandidateProfile · Education · Experience · Job · JobPreferences · Link
PortfolioSettings · Project · RefreshToken · SavedJob · Skill · User
+ _prisma_migrations
```

Segundo estado persistente: **uploads/avatares**, restaurados en un **volumen
Docker** destino, no en una carpeta del host.

## Trabajo realizado

Spec → tests estáticos → guardas RED/GREEN → RED de integridad → backup → restore
→ verificación → refactor → dos ejecuciones integrales → quality gates → runbook →
informe. Sin commit, push, PR, merge ni deploy.

## Arquitectura implementada

```text
docker-compose.backup-restore-verification.yml   (project name validado por regex)
  origin-db   postgres:16   volumen <project>_origin-db-data
                            publica 127.0.0.1:<puerto dinámico> (solo para migrate deploy)
  target-db   postgres:16   volumen <project>_target-db-data
                            SIN publicación de puertos
  volúmenes de uploads: <project>_origin-uploads · <project>_target-uploads
  red: <project>_net
  labels en todo: com.jobit.task=b3-backup-01-verification · com.jobit.run-id=<RUN_ID>
```

Cuatro volúmenes propios del run, **ninguno `external`**: es la condición para que
`down -v` pueda eliminarlos. Verificado con `docker compose config`: 4 volúmenes
declarados, 0 `external`, `ports` presente solo en `origin-db` y con
`host_ip: 127.0.0.1`.

**Dos instancias PostgreSQL separadas**, no dos bases en una: hace físicamente
imposible restaurar sobre el origen y permite demostrar que el destino nació vacío.

`psql`, `pg_dump` y `pg_restore` se ejecutan **siempre desde la imagen
`postgres:16`** — el host no tiene cliente PostgreSQL instalado y la paridad
16↔16 elimina el riesgo de incompatibilidad de versiones.

## Archivos creados

```text
docs/specs/features/backup-restore-verification.md
docs/deployment/backup-restore-runbook.md
docs/sprints/b3-backup-01-backup-restore-verification-final-report.md
docker-compose.backup-restore-verification.yml
scripts/operations/backup-restore/lib.sh
scripts/operations/backup-restore/fixtures.sql
scripts/operations/backup-restore/backup.sh
scripts/operations/backup-restore/restore.sh
scripts/operations/backup-restore/verify.sh
scripts/operations/backup-restore/run-e2e.sh
scripts/operations/backup-restore/test-guards.sh
```

Once archivos, exactamente los autorizados.

## Archivos modificados

```text
NINGUNO
```

## Datos sintéticos

`fixtures.sql` — 27 filas, cobertura completa de las 12 tablas de aplicación,
verificado en runtime:

```text
CandidateProfile=2  Education=1  Experience=2  Job=5  JobPreferences=1  Link=2
PortfolioSettings=1 Project=1    RefreshToken=2 SavedJob=3 Skill=4 User=3
```

UUID y timestamps literales fijos (nunca `gen_random_uuid()` ni `now()`), correos
bajo `.invalid` (RFC 2606), prefijo `b3backup-`. Ningún dato real ni tomado del
entorno del operador. `apps/api/prisma/seed.ts` **no se modificó**.

Tres uploads sintéticos, generados por el harness (jamás copiados de
`apps/api/uploads/`):

```text
avatars/b3backup-avatar-1.png       70 bytes   modo 644   ← referenciado por avatarUrl
avatars/b3backup-avatar-2.jpg      160 bytes   modo 644
avatars/nested/b3backup-3.webp      44 bytes   modo 644
```

## Backup

```text
Formato:  custom (-Fc)
Opciones: --format=custom --no-owner --no-privileges --verbose
Uploads:  tar --sort=name --numeric-owner --owner=0 --group=0 --mtime='@0', sin comprimir
Origen montado :ro en todo momento
```

`--exit-on-error` no aplica al dump, pero sí se valida el artefacto: tamaño > 0 y
`pg_restore --list` con objetos, **sin restaurar**.

## Restore

```text
pg_restore --exit-on-error --single-transaction --no-owner --no-privileges --verbose
Sin --create · sin --clean · sin -j
```

`--exit-on-error` es obligatorio porque `pg_restore` **continúa ante errores por
defecto** y solo muestra un recuento al final. `--single-transaction` añade
atomicidad.

Destino demostrado vacío antes de restaurar:

```text
application tables in public:    0
_prisma_migrations:              ABSENT
unexpected application schemas:  0
<project>_target-uploads:        0 entradas
```

Los uploads se extraen en el **volumen destino** mediante un contenedor auxiliar
`--rm`, con el archive montado `:ro` y previa inspección con `tar --list` que
rechaza rutas absolutas y `..`.

## Verificaciones de integridad

```text
INTEGRITY_CHECKS: 18/18 PASS
```

Evidencia recogida en runtime (idéntica en origen y destino):

```text
tablas en public:            13  (12 de aplicación + _prisma_migrations)
migraciones:                  8, con los ocho nombres esperados
migraciones finalizadas:      8  (finished_at NOT NULL, rolled_back_at NULL)
row counts:                  las 12 tablas, coincidentes con los fixtures
valores sentinela:            4/4 presentes
joins:                       user_profile_skill=4 · user_savedjob_job=3
claves foráneas:             11
restricciones únicas y PK:   13
enums:                        9, con sus etiquetas ordenadas
arrays sentinela:            project_technologies=3 · job_tags=2
hashes deterministas:        12, uno por tabla de aplicación, idénticos
manifiesto de uploads:       sin diferencias (3 archivos)
coherencia avatarUrl↔archivo: 100 %
```

`_prisma_migrations` queda excluida del hash determinista de forma deliberada:
sus marcas temporales de aplicación difieren legítimamente tras un restore y
producirían un falso negativo. Se verifica por recuento, nombres y estado.

### Prueba de restricción única, no destructiva

```text
BEGIN → INSERT duplicado → SQLSTATE 23505 (duplicate key value violates unique
constraint) → ROLLBACK → conexión nueva
Resultado: SavedJob=3 · duplicados persistidos=0
```

Los recuentos y hashes finales se recalcularon después y coincidieron con el
baseline previo a la prueba.

### Integridad del origen

Baseline pre-backup y post-restore **idénticos** en las dos ejecuciones. El
contenedor de origen permaneció `healthy` y su volumen de uploads se montó
siempre `:ro`.

## Prueba TDD RED

Acreditada antes del restore en ambas ejecuciones:

```text
verify.sh schema target contra un destino vacío → FALLA
motivo: 0 tablas de aplicación != 13 tablas esperadas en public
```

Un verificador que pasa siempre no demuestra nada; esta prueba evidencia que la
verificación no es vacua.

## Pruebas negativas

```text
NEGATIVE_GUARD_TESTS: 10/10 PASS  (16 aserciones)
```

```text
N1  RUN_ID vacío                                   → bloqueado, salida 1
N2  ORIGIN_DB == TARGET_DB                         → bloqueado, salida 1
N3  PROJECT=jobit-staging                          → bloqueado, salida 1
N4  PROJECT contiene production                    → bloqueado, salida 1
N5a WORKSPACE=/                                    → bloqueado, salida 1
N5b WORKSPACE=$HOME                                → bloqueado, salida 1
N5c WORKSPACE dentro del repositorio               → bloqueado, salida 1
N6  volumen del run preexistente                   → bloqueado, salida 1
N7  cleanup con RUN_ID incorrecto                  → bloqueado, salida 5
N7b workspace ajeno NO borrado                     → confirmado
N8  host de base no autorizado                     → bloqueado, salida 1
N8b puerto 5434 (contenedor de test preexistente)  → bloqueado, salida 1
N9  checksum manipulado                            → bloqueado, salida 1
N10 archive con '..' rechazado                     → bloqueado, salida 1
    recursos protegidos sin cambios de identidad   → confirmado
    sin residuos de las pruebas de guardas         → confirmado
```

## Ejecuciones integrales

```text
RUN_1: PASS    RUN_2: PASS
```

| Métrica | Run 1 | Run 2 |
|---|---|---|
| Dump (bytes) | 31 191 | 31 196 |
| Objetos en el TOC | 76 | 76 |
| Tar de uploads (bytes) | 10 240 | 10 240 |
| Backup de base (ms) | 2 106 | 1 228 |
| Backup de uploads (ms) | 1 344 | 1 296 |
| Restore de base (ms) | 3 617 | 2 860 |
| Restore de uploads (ms) | 1 461 | 1 103 |
| Total del run (ms) | 235 996 | 229 615 |
| Puerto loopback dinámico | 62 065 | 61 195 |

Imagen utilizada en ambas: `postgres:16`,
digest `sha256:5a65324fe84dc41709ff914e90b07f3e2f577073ed27bf917d4873aca0c9ec51`.

### Reproducibilidad

```text
SHA-256 del tar de uploads:
  run 1: a293057db7c9f2d6c250c47e222e956ffa00d3a3245c4c56b1af1c3b3f75d7c1
  run 2: a293057db7c9f2d6c250c47e222e956ffa00d3a3245c4c56b1af1c3b3f75d7c1   ← IDÉNTICO
```

El archive de uploads es **bit-idéntico entre ejecuciones**, lo que valida la
estrategia determinista (`--sort=name`, propietario y `mtime` normalizados, sin
gzip). El dump de PostgreSQL difiere entre ejecuciones y no tiene obligación de
ser bit-idéntico.

```text
Dependencia de residuos previos: NINGUNA
```

La segunda ejecución usó `RUN_ID`, project name, workspace, contenedores, red,
cuatro volúmenes, dump, tar y checksums completamente nuevos.

## Cleanup

Ambas ejecuciones, tras validar marcador de propiedad y project name exacto:

```text
docker compose -p <PROJECT> -f docker-compose.backup-restore-verification.yml \
  --env-file <workspace>/env down -v --remove-orphans
```

```text
RESIDUAL_TASK_RESOURCES: 0
  contenedores con ambas labels: 0
  volúmenes con ambas labels:    0
  redes con ambas labels:        0
WORKSPACE: ABSENT
TEMPORARY_BACKUP_ARTIFACTS: 0
```

Nunca se usaron `docker system prune`, `docker volume prune` ni `down -v` sin
`-p` validado.

## Recursos protegidos

```text
PROTECTED_RESOURCES: UNCHANGED
```

Identidad registrada antes y después de cada ejecución, **idéntica** en ambas:

```text
jobit-staging-db-data       volume     local
jobit-staging-api-uploads   volume     local
jobit-postgres-test         container  running
```

Ninguno fue leído, montado, escrito ni borrado. Ningún otro recurso Docker
preexistente del host fue tocado.

## Tests y verificaciones

| Gate | Resultado |
|---|---|
| `bash -n` sobre los seis scripts | OK |
| `docker compose config` | válido · 4 volúmenes · 0 `external` |
| `test-guards.sh` | 16/16 PASS |
| `run-e2e.sh` (run 1) | PASS |
| `run-e2e.sh` (run 2) | PASS |
| `pnpm install --frozen-lockfile` | exit 0 |
| `prisma generate` | exit 0 |
| `@jobit/api typecheck` | exit 0 |
| `@jobit/api test` | **48 ficheros, 614 tests, 614 passed** |
| `@jobit/api build` | exit 0 |
| `@jobit/web lint` | exit 0, sin warnings |
| `@jobit/web typecheck` | exit 0 |
| `@jobit/web test` | **27 ficheros, 404 tests, 404 passed** |
| `@jobit/web build` | exit 0 |
| `git diff --check` | exit 0 |

Cero regresiones: los 614 tests de API y los 404 de web siguen en verde, idénticos
al estado previo.

```text
Playwright: NO_NECESARIO — NO_UI_CHANGE
```

El diff no toca `apps/web/**`, `apps/api/src/**`, rutas, contratos HTTP ni
superficies de UI. No se ejecutó.

ShellCheck no está disponible en el host y **no es requisito**: se sustituyó por
`bash -n` más comprobaciones estáticas de comandos prohibidos, fugas de secretos,
nombres protegidos y prefijo de workspace.

## Seguridad y privacidad

```text
REAL_DATA_USED:    NO
REAL_SECRETS_USED: NO
```

- Credenciales sintéticas generadas en ejecución, distintas entre origen y
  destino, en un fichero `0600` dentro del workspace, destruidas en el cleanup.
- **No se abrió ningún `.env`.** El Compose se invoca siempre con `--env-file`
  explícito para impedir la carga automática de un `.env` del repositorio.
- No se reutilizaron `DATABASE_URL`, `DATABASE_URL_TEST` ni `JWT_ACCESS_SECRET`.
- Las URL de conexión se emiten redactadas: `postgresql://<user>:***@<host>:<port>/<db>`.
- `PGPASSWORD` viaja por el entorno del proceso, nunca en la línea de comandos.
- No se leyó, listó ni hasheó ningún upload real del repositorio o del host.
- Ningún artefacto se creó dentro del repositorio: el workspace vive en `/tmp`.

## Decisiones técnicas

1. **Formato custom (-Fc)**: único con artefacto único, `pg_restore --list`,
   `--exit-on-error` y `--no-owner/--no-privileges`.
2. **Dos instancias PostgreSQL separadas**: convierte «no restaurar sobre el
   origen» en una imposibilidad física, no en una comprobación.
3. **Herramientas en contenedor `postgres:16`**: el host no tiene cliente y la
   paridad 16↔16 elimina el riesgo de incompatibilidad.
4. **Tar sin compresión**: gzip embebe una marca de tiempo y rompería la
   reproducibilidad bit a bit del checksum.
5. **Puerto dinámico en loopback solo para el origen**: `prisma migrate deploy`
   corre en el host; el destino no se expone jamás.
6. **Uploads restaurados en volumen, no en carpeta del host**: el estado
   persistente real es un volumen Docker.
7. **Prueba RED de integridad antes del restore**: acredita que el verificador
   detecta un restore inexistente.

## Cambios respecto al plan aprobado

Ninguno en arquitectura, formato, topología, fixtures, verificaciones, guardas,
archivos ni alcance.

Un detalle de implementación no previsto explícitamente: un volumen Docker recién
creado pertenece a `root:root 0755`, por lo que un contenedor con `--user
<uid>:<gid>` no puede poblarlo. Se añadió `b3b_aux_run_root`, usado **solo** en
los dos puntos que escriben dentro de un volumen del run (sembrar
`origin-uploads` y extraer en `target-uploads`), nunca sobre el workspace y
siempre tras `b3b_assert_not_protected`. Los artefactos del workspace siguen
generándose con el usuario del host.

## Problemas encontrados

Ninguno bloqueante. El fallo de permisos descrito arriba se detectó en la primera
ejecución, se diagnosticó con una sonda aislada y se corrigió; el volumen de
prueba se eliminó de inmediato.

## Deuda pendiente

1. Backups **no operativos** en staging ni en producción: sin cron, sin destino
   creado, sin retención aplicada, sin restauración de ensayo en entorno remoto.
2. Backup y origen en el mismo disco durante la prueba local: válido para
   demostrar la mecánica de restore, **no** como estrategia de backup.
3. Cifrado en reposo no aplicado: innecesario con artefactos sintéticos,
   obligatorio en cuanto haya datos reales.
4. `RPO` y `RTO` productivos **no acreditados**.
5. La prueba integral no está integrada en CI: exigiría modificar
   `.github/workflows/**`, no autorizado.

Ninguna de estas deudas se convierte en blocker nuevo.

## Fuera de alcance respetado

No se tocó: VPS, staging remoto, producción, datos reales, bases existentes,
uploads reales, `.env`, secretos, `apps/api/prisma/schema.prisma`, migraciones,
`seed.ts`, `apps/api/src/**`, `apps/web/**`, `docker-compose.staging.yml`,
`.github/workflows/**`, `docs/product/**`, `docs/agents/**`, `docs/audits/**`,
`.gitignore`, `package.json`, `.env.example`. No se implantó cron, systemd,
almacenamiento externo, PITR, WAL archiving, replicación, alta disponibilidad,
Redis, observabilidad ni alertas. No se cambió la versión de PostgreSQL.

## Estado Git

```text
Rama:             fix/b3-backup-01-backup-restore-verification
HEAD:             8b49b2dff61dc19f7d8fd7ef200eeb7d39bfb9be  (sin mover)
Commits propios:  0
Staging:          vacío
Working tree:     11 archivos nuevos (los autorizados)
Push / PR / Merge / Deploy: ninguno
```

## Recomendación

El trabajo está completo y verificado con evidencia ejecutada: dos ejecuciones
integrales en verde, 18/18 verificaciones de integridad, 10/10 pruebas negativas,
origen intacto, cleanup sin residuos, recursos protegidos sin cambios, 614 tests
de API y 404 de web sin regresiones. Procede revisión humana del diff y, si
resulta conforme, autorización separada de commit, push, PR, CI y merge.

```text
IMPLEMENTATION_STATUS:
READY_FOR_REVIEW

B3-BACKUP-01:
TECHNICALLY_VERIFIED — PENDING_COMMIT_PR_CI_AND_MERGE
```
