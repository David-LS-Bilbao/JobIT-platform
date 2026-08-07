# Backup and Restore Verification

## Estado

```text
Activo — spec de verificación operativa
Blocker: B3-BACKUP-01 (Backup y restore no probados)
Nivel de riesgo: LEVEL_3 / HIGH_RISK_CONTROLLED
```

Esta spec define **cómo se acredita** que un backup de JobIT puede restaurarse
realmente. No es una spec de feature de producto: no cambia comportamiento de la
API ni del frontend. Tampoco implanta backups en staging ni en producción.

## Objetivo

Cerrar técnicamente el production blocker `B3-BACKUP-01` demostrando, con
evidencia reproducible, una **restauración real** de los dos estados persistentes
de JobIT en un destino nuevo, aislado y desechable, usando exclusivamente datos
sintéticos.

No basta con documentar comandos, generar un dump, copiar un volumen, comprobar
que un archivo existe ni observar un código de salida cero. El cierre exige
restaurar y **verificar el contenido restaurado**.

## Usuarios y sistemas afectados

- **Operador**: obtiene un procedimiento de backup y restore ejecutado y verificado,
  no solo escrito.
- **Candidato (indirecto)**: sus datos solo pueden existir en un entorno cuya
  recuperación esté acreditada.
- **Agentes IA**: esta spec y el runbook fijan los límites duros del harness.

## Inventario persistente

Exactamente dos estados. Cualquier otro queda fuera.

```text
1. PostgreSQL 16
   12 tablas de aplicación + 1 tabla de control (_prisma_migrations) = 13 en `public`
   En staging lo representa el volumen jobit-staging-db-data

2. uploads/avatares
   En staging lo representa el volumen jobit-staging-api-uploads
   En local, apps/api/uploads/avatars/ (ignorado por Git salvo .gitkeep)
```

Tablas de aplicación (12):

```text
CandidateProfile · Education · Experience · Job · JobPreferences · Link
PortfolioSettings · Project · RefreshToken · SavedJob · Skill · User
```

Migraciones esperadas (8):

```text
20260523075707_init
20260619184721_add_candidate_profile_cv_models
20260622162314_add_jobs
20260623110355_add_job_provenance
20260629084049_add_saved_jobs
20260702155236_add_portfolio_settings
20260703122811_add_adzuna_job_source
20260703151137_add_greenhouse_job_source
```

**Los uploads son obligatorios**, no opcionales: `CandidateProfile.avatarUrl`
almacena la ruta `/uploads/avatars/<archivo>` (`apps/api/src/profile/avatar.storage.ts`),
de modo que base y sistema de archivos forman **una única unidad de consistencia**.
Restaurar solo PostgreSQL deja `avatarUrl` apuntando a archivos inexistentes;
restaurar solo los archivos deja huérfanos no referenciados.

Excluidos por no cumplir persistencia + uso actual + necesidad de recuperación:
imágenes Docker (reconstruibles, taggeadas por SHA), `node_modules`, `dist/`,
`.next/`, logs (rotados en compose), seed versionado, fixtures de test y secretos
(fuera del repositorio por diseño). No existe Redis, cache persistente, cola ni
object storage.

## Entorno del harness

```text
Origen:   contenedor PostgreSQL 16, volumen propio, base b3backup_origin
Destino:  contenedor PostgreSQL 16 SEPARADO, volumen propio, base b3backup_target
Uploads:  volumen origen y volumen destino, ambos propios del run
Red:      exclusiva del run
Artefactos: /tmp/jobit-b3-backup-verify-<RUN_ID>, nunca dentro del repositorio
```

**Dos instancias separadas, no dos bases en una.** Servidores distintos hacen
*físicamente imposible* restaurar sobre el origen, permiten demostrar que el
destino nació vacío y hacen trivial probar que el origen quedó intacto.

Las herramientas `psql`, `pg_dump` y `pg_restore` se ejecutan **siempre desde la
imagen `postgres:16`**: el host no tiene cliente PostgreSQL instalado y la paridad
exacta 16↔16 elimina el riesgo de incompatibilidad de versiones (`pg_dump` se
niega a volcar de un servidor de versión mayor superior a la suya).

**Puertos.** El destino no publica ninguno. El origen publica en `127.0.0.1` con
**puerto dinámico**, únicamente porque `prisma migrate deploy` se ejecuta desde el
host. El puerto se resuelve en runtime y se rechaza si coincide con `5432`,
`5434`, `3000` o `4000`.

## Identificadores

```text
RUN_ID  = <yyyymmdd>t<hhmmss>z-<8 hex>      regex ^[0-9]{8}t[0-9]{6}z-[0-9a-f]{8}$
PROJECT = jobit-b3-backup-verify-<RUN_ID>   regex ^jobit-b3-backup-verify-…$
```

Todo en minúsculas: los identificadores de proyecto de Docker Compose solo
admiten minúsculas, dígitos, guiones y guiones bajos.

Los cuatro volúmenes del run, **ninguno `external`**:

```text
<project>_origin-db-data · <project>_target-db-data
<project>_origin-uploads · <project>_target-uploads
```

Labels obligatorias en contenedores, red y volúmenes:

```text
com.jobit.task   = b3-backup-01-verification
com.jobit.run-id = <RUN_ID>
```

## Flujo de backup

```text
1. guardas   2. RUN_ID   3. workspace 0700   4. origen sintético
5. prisma migrate deploy   6. fixtures.sql   7. uploads sintéticos
8. baseline de integridad  9. pg_dump -Fc   10. tar determinista
11. tamaño > 0   12. SHA256SUMS   13. pg_restore --list   14. permisos 0600
```

### Formato PostgreSQL

```text
custom (-Fc)
--format=custom --no-owner --no-privileges --verbose
```

Es el único formato que reúne artefacto **único** (un solo SHA-256 lo cubre),
lectura por `pg_restore` (requisito de `--exit-on-error` y `--single-transaction`),
**`pg_restore --list`** para inspeccionar la estructura sin restaurar, y
compresión por defecto. Directory fragmenta el artefacto; tar no comprime ni
reordena; plano exigiría `psql` y perdería el TOC y el control de errores.

`--no-owner` y `--no-privileges` porque, por defecto, `pg_dump` emite sentencias
de propiedad que fallan salvo superusuario o propietario original.

### Uploads

```text
tar --create --sort=name --numeric-owner --owner=0 --group=0 --mtime='@0'
```

Sin compresión, deliberadamente: la cabecera gzip embebe una marca de tiempo y
rompería la reproducibilidad bit a bit del checksum entre ejecuciones. El volumen
de origen se monta **siempre `:ro`**.

Manifiesto determinista, ordenado, una línea por archivo:

```text
<sha256>  <ruta relativa>  <bytes>  <permisos octal>
```

## Flujo de restore

```text
1. guardas   2. sha256sum -c   3. crear base destino   4. demostrar destino vacío
5. pg_restore   6. tar --list (rechazo de traversal)   7. extraer en el volumen destino
8. verificaciones   9. comparación   10. origen intacto
```

```text
pg_restore --exit-on-error --single-transaction --no-owner --no-privileges --verbose
```

**`--exit-on-error` es obligatorio**: por defecto `pg_restore` *continúa ante
errores* y solo muestra un recuento al final, de modo que un restore defectuoso
podría pasar inadvertido. `--single-transaction` lo implica y añade atomicidad.

**No se usan `--create` ni `--clean`**: la base destino se crea vacía por el
harness para que su estado inicial sea demostrable; `--clean` haría `DROP` sobre
objetos existentes, justo lo que las guardas deben impedir.

### Criterio de destino vacío

```text
database:                        b3backup_target (creada durante el run)
application tables in public:    0
_prisma_migrations:              ABSENT
unexpected application schemas:  0
<project>_target-uploads:        0 entradas
```

La existencia de objetos internos de PostgreSQL (`pg_catalog`,
`information_schema`, `public` vacío) **no** constituye incumplimiento.

### Restore de uploads

El destino es el **volumen** `<project>_target-uploads`, no una carpeta del host:
el estado persistente real es un volumen Docker. Antes de extraer se ejecuta
`tar --list` y se rechaza toda entrada con ruta absoluta o `..`. El archive se
monta `:ro`; el volumen destino se monta en escritura **exclusivamente durante la
extracción**, mediante un contenedor auxiliar `--rm`. Toda verificación posterior
monta ambos volúmenes `:ro`.

## Datos sintéticos

`scripts/operations/backup-restore/fixtures.sql` — 27 filas en las 12 tablas:

```text
User 3 · RefreshToken 2 · CandidateProfile 2 · PortfolioSettings 1 · Skill 4
Experience 2 · Education 1 · Project 1 · Link 2 · JobPreferences 1
Job 5 · SavedJob 3
```

Reglas duras: UUID y timestamps **literales fijos** (nunca `gen_random_uuid()` ni
`now()`), correos bajo `.invalid` (RFC 2606), prefijo `b3backup-`, ningún dato
real ni tomado del entorno del operador. Ninguna tabla de aplicación queda sin
cobertura.

El seed versionado (`apps/api/prisma/seed.ts`) es sintético y correcto, pero
cubre **solo `Job`**: no ejercita FKs en cascada, unicidad compuesta, enums de
perfil ni la coherencia `avatarUrl`↔archivo. **No se modifica.**

Uploads sintéticos, generados por el harness (jamás copiados de `apps/api/uploads/`):

```text
avatars/b3backup-avatar-1.png     ← referenciado desde CandidateProfile.avatarUrl
avatars/b3backup-avatar-2.jpg
avatars/nested/b3backup-3.webp    ← subdirectorio, ejercita rutas relativas
```

## Checksums

`sha256sum` sobre el dump y el tar, recogidos en `SHA256SUMS`. Antes de cualquier
restore se ejecuta `sha256sum -c`; un fallo aborta con **código 2** y el destino
**no llega a crearse**. Los hashes de integridad de base se calculan sobre el
resultado de consultas ordenadas por clave primaria: solo el digest sale del
harness, nunca las filas.

## Verificaciones de integridad

Dieciocho. El código de salida cero no se acepta como evidencia.

| # | Verificación |
|---|---|
| 1 | Lista de tablas de `public` — 12 de aplicación + `_prisma_migrations` = 13 |
| 2 | `pg_restore --list` con objetos > 0, sin restaurar |
| 3 | `_prisma_migrations` `COUNT(*)` = 8 |
| 4 | Nombres de las 8 migraciones, ordenados |
| 5 | `finished_at IS NOT NULL AND rolled_back_at IS NULL` en las 8 |
| 6 | Row counts de las 12 tablas de aplicación |
| 7 | Cuatro valores sentinela |
| 8 | Joins `User⋈CandidateProfile⋈Skill` y `User⋈SavedJob⋈Job` |
| 9 | Conteo de claves foráneas |
| 10 | Conteo de restricciones únicas y primarias |
| 11 | Nueve enums con sus etiquetas ordenadas |
| 12 | Longitudes de arrays sentinela |
| 13 | Doce hashes deterministas, uno por tabla de aplicación |
| 14 | Restricción única activa, comprobada de forma **no destructiva** |
| 15 | Lectura mínima funcional del perfil sentinela con su `avatarUrl` |
| 16 | Manifiesto de uploads origen vs destino |
| 17 | Ausencia de archivos inesperados en el destino |
| 18 | Coherencia `avatarUrl` ↔ archivo al 100 % |

`_prisma_migrations` queda **excluida del hash determinista** de forma
deliberada: sus marcas temporales de aplicación difieren legítimamente entre
origen y destino tras un restore y producirían un falso negativo. Se verifica por
recuento, nombres y estado, que sí son invariantes.

### Verificación 14 — restricción única sin alterar el baseline

```text
BEGIN → INSERT duplicado → SQLSTATE 23505 → ROLLBACK
```

`psql` aborta la transacción tras el error; el `ROLLBACK` es incondicional y la
comprobación posterior usa una **conexión nueva**, confirmando que `SavedJob`
mantiene su recuento y que la fila duplicada no se persistió. Los hashes y
recuentos finales se recalculan después y deben coincidir con el baseline previo.

### Integridad del origen

Se compara el baseline **pre-backup** con el **post-restore** en las
verificaciones 1, 3-13, 16 y 17, y se comprueba que el contenedor de origen sigue
`healthy`. Cualquier diferencia aborta con **código 4**.

## Guardas

G01 variables obligatorias · G02 regex de `RUN_ID` · G03 regex exacta de project
name · G04 rechazo de `jobit-staging` · G05 rechazo de `staging`/`prod`/`production`
· G06 origen ≠ destino (base y host) · G07 base destino inexistente y vacía · G08
los cuatro volúmenes inexistentes · G09 contenedores y red inexistentes · G10
doble label de propiedad · G11 prefijo de workspace · G12 workspace no es `/`,
`$HOME`, el repositorio ni un symlink · G13 rutas de escritura dentro del
workspace · G14 host de conexión autorizado · G15 puerto seguro y bind en
loopback · G16 credenciales sintéticas, prohibido leer `.env` · G17 marcador de
propiedad para el cleanup · G18 cleanup solo con el project name exacto · G19
prohibición de `docker system prune` y `docker volume prune` · G20 `down -v`
solo con `-p` validado · G21 cuatro volúmenes declarados y ninguno `external` ·
G22 montajes `:ro` salvo la escritura acotada del restore · G23 rechazo de path
traversal en el archive · G24 volumen destino de uploads vacío · G25 los recursos
protegidos nunca como destino.

### Pruebas negativas

N1 `RUN_ID` vacío · N2 origen = destino · N3 `jobit-staging` · N4 `production` ·
N5 workspace peligroso (`/`, `$HOME`, repositorio) · N6 volumen del run
preexistente · N7 cleanup con `RUN_ID` incorrecto · N8 host no autorizado y
puerto prohibido · N9 checksum manipulado · N10 archive con `..`.

Cada una debe devolver salida distinta de cero, no crear ni destruir nada, no
dejar residuos y no alterar la identidad de los recursos protegidos.

## Gestión de secretos

Credenciales sintéticas generadas en ejecución, distintas entre origen y destino,
en variables de shell y en un fichero de entorno `0600` dentro del workspace, que
desaparece con el cleanup. **Prohibido** leer `.env` o cualquier `.env.*` y
reutilizar `DATABASE_URL`, `DATABASE_URL_TEST` o `JWT_ACCESS_SECRET`. `PGPASSWORD`
viaja por el entorno del proceso, nunca en la línea de comandos. Las URL se
emiten redactadas: `postgresql://<user>:***@<host>:<port>/<db>`.

Puede publicarse: nombres de recursos, `RUN_ID`, tamaños, checksums, recuentos,
nombres de migraciones, tiempos, códigos de salida y hashes. Nunca: contraseñas,
URL completas, filas, contenido de uploads, dumps ni logs completos.

## Errores y códigos de salida

```text
1 guarda · 2 checksum · 3 restore · 4 integridad · 5 cleanup
```

## Rollback

Rollback significa eliminar **solo los recursos sintéticos del run**. Nunca
revertir `dev`, staging ni producción. Un `trap` en `EXIT`/`ERR`/`INT`/`TERM`
ejecuta el mismo cleanup tras éxito y tras fallo.

## Cleanup

```text
1. validar marcador · 2. validar project name · 3. down -v con -p exacto
4. barrido residual por labels · 5. eliminar workspace · 6. verificar
```

`docker compose -p <PROJECT> -f <compose exclusivo> down -v --remove-orphans`
es seguro porque los cuatro volúmenes están declarados en el archivo y ninguno es
`external`. Nunca se usan `docker system prune` ni `docker volume prune`, ni
`down -v` sin `-p` validado.

Criterio de residuos, **por labels**:

```text
contenedores con ambas labels: 0 · volúmenes: 0 · redes: 0 · workspace: ausente
```

No se exige igualdad global del inventario Docker del host: otros proyectos
pueden cambiar concurrentemente. Sí se registra, antes y después, la identidad de
`jobit-staging-db-data`, `jobit-staging-api-uploads` y `jobit-postgres-test`, que
el harness nunca lee, monta, escribe ni borra.

## Retención, almacenamiento y cifrado

```text
RETENTION:              DOCUMENTATION_ONLY
OFF_HOST_STORAGE:       DOCUMENTATION_ONLY
PRODUCTION_ENCRYPTION:  DOCUMENTATION_ONLY
```

Durante la prueba, la retención efectiva es **cero**: los artefactos se destruyen
en el cleanup. La propuesta heredada para staging (7 diarios + 4 semanales en
`/srv/jobit-staging/backups`) sigue siendo una decisión pendiente del runbook de
staging: esta spec no la confirma, no la programa y no la ejecuta.

Limitación explícita: en la prueba local, backup y origen conviven en el mismo
disco. Sirve para demostrar la mecánica de restore, **no** como estrategia de
backup. El cifrado en reposo no es requisito aquí porque los artefactos son
exclusivamente sintéticos, pero será obligatorio cuando contengan datos reales.

## RPO y RTO

```text
PRODUCTION_RPO: NOT_ACCREDITED
PRODUCTION_RTO: NOT_ACCREDITED
```

Solo se publican duraciones locales observadas. El RPO depende de una frecuencia
de backup programada que no existe; el RTO no puede extrapolarse de una prueba
local sobre kilobytes sintéticos.

## Criterios de aceptación

1. Backup PostgreSQL real, con artefacto de tamaño > 0 y TOC con objetos.
2. Backup de uploads con archive determinista y manifiesto.
3. `sha256sum -c` correcto antes de cualquier restore.
4. Destino demostrado vacío: 0 tablas de aplicación, `_prisma_migrations` ausente,
   0 schemas inesperados, volumen de uploads con 0 entradas.
5. Restore PostgreSQL real con `--exit-on-error --single-transaction`.
6. Restore de uploads en el volumen destino, con rechazo previo de traversal.
7. Las 18 verificaciones en verde, con 13 tablas en `public`.
8. Origen intacto: baseline pre-backup idéntico al post-restore.
9. Las 10 pruebas negativas bloqueando como deben.
10. Cleanup completo, sin residuos por labels y con el workspace ausente.
11. Recursos protegidos sin cambios de identidad.
12. Segunda ejecución completa desde cero, sin depender de residuos.
13. Quality gates del repositorio en verde.
14. Sin secretos, sin datos reales y sin artefactos versionados.

## Tests mínimos

- Estáticos: `bash -n`, comprobación de comandos prohibidos, de fugas de secretos,
  de nombres protegidos y del prefijo de workspace; `docker compose config` con
  cuatro volúmenes declarados y cero `external`. ShellCheck **no es requisito**
  y no se instala.
- Guardas: `test-guards.sh` (N1-N10).
- Integral: `run-e2e.sh`, ejecutado **dos veces** desde cero con `RUN_ID` distintos.

Prueba RED obligatoria: `verify.sh schema target` debe **fallar** contra un
destino vacío (`0 tablas de aplicación != 13 esperadas`) antes del restore. Un
verificador que pasa siempre no demuestra nada.

## Fuera de alcance

VPS, staging remoto, producción, datos reales, copia de bases existentes, lectura
de uploads reales, apertura de `.env`, secretos reales, modificación de Prisma,
schema, migraciones o seed, código de API o frontend, auth, rate limiting,
providers, cambio de PostgreSQL 16, cron o systemd reales, almacenamiento externo,
DNS, Nginx, deploy, object storage, alta disponibilidad, PITR, WAL archiving,
replicación, Kubernetes, Redis, observabilidad, alertas, `S22-PRIV-01`,
`B4-STATE-02`, ciclo de vida de cuenta, Job Radar, Recruit, Candidate Discovery,
modificación de `.github/workflows/**` y comandos globales de poda Docker.

## Condiciones de reapertura

1. Cambio de versión mayor de PostgreSQL.
2. Aparición de un tercer estado persistente.
3. Migración de uploads a almacenamiento de objetos.
4. Cambio de la topología de despliegue que altere dónde viven los volúmenes.
5. Necesidad de acreditar RPO/RTO productivos.
