# Inventario de datos, tratamientos, cookies y almacenamiento

> **Estado**
>
> Documento interno de gobierno técnico y preparación legal.
>
> No constituye aviso legal público, asesoramiento jurídico ni acreditación de cumplimiento.
>
> Las decisiones sensibles y las evidencias completas se mantienen fuera del repositorio.
>
> No autorizado para producción hasta completar la revisión especializada.

**Sprint 24 · Tramo A.** Construido exclusivamente sobre evidencia observada en el repositorio
y en runtime local. Etiquetado conforme a la taxonomía de
[`../specs/features/candidate-legal-governance.md`](../specs/features/candidate-legal-governance.md) §2.

> **Nota de custodia.** Las referencias del tipo `D-NN` identifican decisiones del registro del
> responsable, **conservado fuera de este repositorio**, y no son resolubles desde aquí.

**Baseline de la observación:** `98492754d5dd00ebd081e7d5b82b36600b6c9372`
**Fecha:** 28 de julio de 2026

> **Nota de adendas de evidencia actual.** El cuerpo de este inventario corresponde al baseline
> indicado. Las secciones marcadas como `CURRENT_EVIDENCE_ADDENDUM` reconcilian hechos técnicos
> verificados con posterioridad, contra el baseline `3251b72a2aec88decafa9fa6a1cf2a54a0664e12`.
> Las adendas **no sustituyen** la observación original ni reescriben los informes históricos:
> solo corrigen o completan el estado factual vigente. Su clasificación es
> `FACTUAL_TECHNICAL_STATE`; ninguna adenda decide cuestión jurídica alguna.

## 1. Alcance y método

Se inventarían únicamente categorías **observadas**. No se han inferido ni añadido categorías
que no aparezcan en el código o en el runtime.

Método:

1. Lectura de `apps/api/prisma/schema.prisma` para modelos y campos.
2. Lectura de routers, servicios y formularios para puntos de recogida.
3. Lectura del DTO público del portfolio para determinar visibilidad.
4. Búsquedas dirigidas (`grep`) para descartar categorías no presentes.
5. Verificación en runtime con cuenta sintética para cookies y almacenamiento (§5).

### 1.1 Desviación metodológica registrada

La verificación de cookies y almacenamiento se hizo **en runtime local** con una **cuenta
sintética** (`priv+<timestamp>@jobit.local`) sobre `jobit_dev`. No se usaron datos personales
reales, no se abrieron `.env` ni uploads, y no se imprimieron credenciales. La observación
corresponde al **entorno de desarrollo**; su extrapolación a producción tiene el límite
indicado en §5.3.

## 2. Modelos y campos observados

| Modelo | Campos observados |
|---|---|
| `User` | `id`, `email` (único), `passwordHash`, `role` (default `CANDIDATE`), `createdAt`, `updatedAt` |
| `RefreshToken` | `id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt`, `createdAt` |
| `CandidateProfile` | `firstName`, `lastName`, `headline`, `summary`, `location`, `locationRemote`, `availabilityStatus`, `avatarUrl`, `createdAt`, `updatedAt` |
| `Skill` | `name`, `normalizedName`, `level`, `category` |
| `Experience` | `company`, `role`, `startDate`, `endDate`, `current`, `description`, `location` |
| `Education` | `institution`, `title`, `field`, `startDate`, `endDate`, `current` |
| `Project` | `name`, `description`, `technologies[]`, `url`, `repoUrl` |
| `Link` | `type` (`GITHUB`/`LINKEDIN`/`PORTFOLIO`/`OTHER`), `url` |
| `JobPreferences` | `desiredRoles[]`, `preferredLocations[]`, `remotePreference`, `seniority`, `salaryMin`, `salaryMax`, `contractTypes[]` |
| `PortfolioSettings` | `slug` (único), `isPublished`, `publishedAt`, `showLocation`, `showAvailability`, `showPreferences` |
| `SavedJob` | `userId`, `jobId`, `savedAt`, único `(userId, jobId)` |

### 2.1 Categorías buscadas y NO observadas

| Categoría | Resultado |
|---|---|
| Dirección IP | **Reclasificada.** En el baseline de la observación no había coincidencias de `req.ip` ni `x-forwarded-for`. Hoy **sí se procesa**, de forma efímera y en memoria; **sigue sin persistirse**. Ver §2.2 |
| User-agent | **No se recoge ni persiste.** `grep` de `userAgent`, `user-agent` sin coincidencias |
| Fecha de nacimiento / edad | No existe campo |
| Tabla de logs | No existe |
| Tabla de telemetría | No existe |
| Resultados de match persistidos | No existe modelo |

La fila «Dirección IP» se conserva por trazabilidad con la observación original y queda
reclasificada en §2.2. El resto de la tabla mantiene su resultado.

### 2.2 Dirección IP — adenda de evidencia actual

`CURRENT_EVIDENCE_ADDENDUM` · `FACTUAL_TECHNICAL_STATE` · verificado sobre
`3251b72a2aec88decafa9fa6a1cf2a54a0664e12`.

Tras la integración del rate limiting de la API (`B3-ABUSE-01`, posterior al baseline de esta
observación), la dirección IP **sí se procesa**. La afirmación original de ausencia total de
tratamiento ha dejado de ser correcta y se sustituye por la siguiente. **Procesamiento y
persistencia son planos distintos:** lo que sigue afirma el primero y niega el segundo.

| Aspecto | Estado observado |
|---|---|
| Tratamiento | **Sí.** La IP se procesa en cada petición sujeta a limitación |
| Finalidad técnica observada | Limitación de peticiones de la API (`API_RATE_LIMITING`) |
| Identificador de cliente | `req.ip` de Express, mediante el generador de clave por defecto de `express-rate-limit` |
| Limitadores afectados | **4** (general de la API y de `/uploads`, login, registro y portfolio público) |
| Persistencia en base de datos | **Ninguna evidencia** en el código autorizado actual |
| Modelo o columna Prisma | **Ninguno identificado** |
| Persistencia en disco | **Ninguna identificada** |
| Registro en logs de aplicación | **Ninguno identificado** |
| Almacén utilizado | `MemoryStore` de `express-rate-limit` |
| Naturaleza del almacén | Memoria efímera del proceso; no compartida entre instancias y no sobrevive a un reinicio |
| Vida temporal aproximada | Acotada por la ventana del limitador: como máximo **≈ 2 × la ventana configurada** desde la última petición (ventanas vigentes: 15 min general, login y portfolio público; 60 min registro) |
| Transmisión a terceros por la implementación de rate limiting | **Ninguna identificada** |

La vida temporal indicada es una **propiedad técnica del limitador**, no un plazo de
conservación: no constituye ni sustituye una política de conservación.

`[DECISIÓN DEL RESPONSABLE]` · `[REVISIÓN ESPECIALIZADA]` — el efecto jurídico de este
tratamiento (finalidad declarada, base jurídica, calificación y consecuencias) **no se decide
aquí**.

```text
LEGAL_EFFECT:
NOT_DECIDED
```

## 3. Matriz de tratamientos

Columna «finalidad **aparente**»: deducida del uso técnico observado. **No es una finalidad
declarada ni una base jurídica.** La finalidad formal y su base son
`[DECISIÓN DEL RESPONSABLE]`.

| Dato | Recogida | Finalidad aparente | Visibilidad | Persistencia | Riesgo |
|---|---|---|---|---|---|
| Email | `/register` | Identificación y acceso | Privado | `User` | Medio |
| `passwordHash` | Generado (bcrypt) | Autenticación | Nunca expuesto | `User` | Bajo |
| `tokenHash` refresh | Generado | Continuidad de sesión | Nunca expuesto | `RefreshToken`, 7 días | Bajo |
| Nombre y apellidos | Perfil | Identificación profesional | **Público si publica** | `CandidateProfile` | Medio |
| Titular profesional | Perfil | Presentación | **Público si publica** | ídem | Medio |
| Bio / resumen | Perfil | Presentación | **Público si publica** | ídem | Medio |
| Ubicación | Perfil | Match y presentación | **Público por defecto al publicar** | ídem | **Alto** |
| Disponibilidad | Perfil | Match y presentación | **Público por defecto al publicar** | ídem | **Alto** |
| Preferencia remoto | Perfil | Match y presentación | Público si `showAvailability` | ídem | Medio |
| Avatar | Upload | Presentación | **Público si publica** | Filesystem sobre volumen persistente, **sin borrado** (§6.1) | **Alto** |
| Skills | Perfil | CV y match | **Público si publica** | `Skill` | Medio |
| Experiencia | Perfil | CV | **Público si publica** | `Experience` | Medio |
| Educación | Perfil | CV | **Público si publica** | `Education` | Medio |
| Proyectos (con URLs) | Perfil | CV | **Público si publica** | `Project` | Medio |
| Enlaces externos | Perfil | CV | **Público si publica** | `Link` | Medio |
| Preferencias laborales | Perfil | Match | Público **solo si** `showPreferences` (default `false`) | `JobPreferences` | Medio |
| **Salario deseado** | Preferencias | Match | **Nunca público** (excluido del DTO) | `JobPreferences` | **Alto** |
| Slug del portfolio | Generado / elegido | URL pública | Público | `PortfolioSettings` | Medio |
| Saved Jobs | Acción del candidato | Preferencia propia | Privado | `SavedJob` | Medio |
| Resultados de match | Calculado al vuelo | Orientación | Privado, efímero | **No persiste** | Bajo |

### 3.1 Datos obligatorios / opcionales / generados

- **Obligatorios:** email y contraseña (registro). Ningún otro campo es obligatorio a nivel de
  modelo (todos nullable o colecciones vacías).
- **Opcionales:** todo el perfil, CV, preferencias, avatar y portfolio.
- **Generados por el sistema:** `passwordHash`, `tokenHash`, `slug`, `normalizedName` de
  skills, timestamps.
- **Inferidos y persistidos:** **ninguno**.
- **Sintéticos / fixtures:** dataset controlado `jobit-seed-001..014` (ofertas, no personas) y
  usuarios de test `@jobit.local`. No son datos de candidatos reales.

## 4. Visibilidad pública: qué sale y qué no

Determinado por `PublicPortfolioResult` en `apps/api/src/profile/public-portfolio.service.ts`.

**Nunca públicos:** `userId`, email, tokens, salario deseado, completitud del perfil.

**Públicos cuando `isPublished = true`:** nombre compuesto, `headline`, `summary`, `avatarUrl`,
skills, experiencias, educación, proyectos (incluidos `url` y `repoUrl`), enlaces.

**Condicionados a flags:** `location` (`showLocation`, default **`true`**),
`availabilityStatus` y `locationRemote` (`showAvailability`, default **`true`**),
`preferences` (`showPreferences`, default `false`).

`[REVISIÓN ESPECIALIZADA]` — la publicación por defecto de ubicación y disponibilidad
(`PORT-02`) requiere criterio sobre si el opt-in de publicación cubre suficientemente el
alcance de lo publicado. Su corrección técnica es `[FUERA DE ALCANCE]` en este sprint.

## 5. Cookies y almacenamiento

### 5.1 Inventario verificado en runtime

| Mecanismo | Ubicación | Finalidad técnica observada | Clasificación preliminar | Decisión |
|---|---|---|---|---|
| `refresh_token` | Cookie, path `/` | Continuidad de sesión autenticada | Técnica de autenticación. `httpOnly: true`, `sameSite: Lax`, `secure` solo en producción, caducidad **7 días** | **Pendiente** (§5.4) |
| Access token JWT | **Memoria de React**, 15 min | Autorización de peticiones | Almacenamiento técnico volátil, no persistente | No requiere |
| `localStorage` | — | **Vacío** en superficies públicas y privadas | No aplica | No requiere |
| `sessionStorage` | `__next_debug_channel:<id>` | Canal de depuración de Next.js | **Artefacto de modo desarrollo** | Reverificar (§5.3) |

### 5.2 Terceros — alcance de la evidencia

**Redacción del hecho observado (D-36):**

```text
No se han observado tecnologías no esenciales en el código ni en el entorno local auditado.

Pendiente de verificación en un build de producción o en un entorno de staging equivalente.
```

**No se afirma la ausencia absoluta de tecnologías no esenciales.** Lo observado, con el
alcance indicado, es:

- Hosts externos contactados durante la navegación auditada: ninguno.
- SDK de terceros en el código: ninguno. Dependencias de producción del frontend: `next`,
  `react`, `react-dom`.
- Analítica, publicidad, píxeles, *fingerprinting* o *tag managers* en el código: ninguno.

### 5.3 Gap de finalización del inventario

La observación se limita al **código del repositorio** y al **entorno local de desarrollo**.
Quedan **pendientes de verificación**, y **no se ejecutan en este sprint**:

- recursos cargados por el build de producción;
- scripts inyectados por el hosting;
- proxy o gestor de dominio;
- herramientas de observabilidad;
- analítica futura;
- SDK externos;
- recursos de terceros;
- cabeceras y servicios incorporados por la infraestructura.

Además, `__next_debug_channel` es un artefacto del servidor de desarrollo de Next.js.
`[RECOMENDACIÓN]` — reverificar el inventario de `sessionStorage` contra un build de producción
antes de dar por cerrado este inventario. Hasta entonces, la entrada queda marcada como no
concluyente.

**Este inventario no puede considerarse cerrado hasta completar esta verificación.**

### 5.4 Punto abierto sobre `refresh_token`

`[REQUISITO CONFIRMADO]` — la guía de cookies de la AEPD recoge, entre las excepciones del
art. 22.2 LSSI, las cookies técnicas de **autenticación o identificación de usuario (solo
sesión)**.
Fuente: [AEPD — Guía sobre el uso de las cookies (mayo 2024)](https://www.aepd.es/guias/guia-cookies.pdf).

`[REVISIÓN ESPECIALIZADA]` — `refresh_token` **persiste 7 días**, por lo que no es literalmente
«solo sesión». **Este sprint no decide si la excepción le alcanza ni si requiere
consentimiento.** Queda expresamente abierto.

`[RECOMENDACIÓN]` — **no** se propone banner ni CMP: el inventario no ha encontrado tecnologías
no esenciales que lo justifiquen. Cualquier decisión en contrario corresponde al responsable
tras revisión especializada.

## 6. Retención y borrado observados

| Capacidad | Estado |
|---|---|
| Borrado granular de skills, experiencia, educación, proyectos | **Existe** (`DELETE /me/...`) |
| Actualización de enlaces y preferencias | **Existe** (`PUT`) |
| Eliminación de Saved Jobs | **Existe** (`DELETE /saved-jobs/:jobId`) |
| Despublicación del portfolio | **Existe** |
| Revocación de refresh token | **Existe** (`revokedAt`, logout) |
| Cascadas `onDelete: Cascade` desde `User` | **Existen** en el modelo |
| **Borrado de cuenta** | **No existe endpoint ni UI.** La cascada no puede dispararse |
| **Exportación / portabilidad** | **No existe** |
| **Borrado físico del avatar** | **No existe** (= `AVATAR-02`) |
| **Política de conservación** | **No documentada** |
| **Política de inactividad** | **No existe** |

`[DECISIÓN DEL RESPONSABLE]` — plazos de conservación por categoría, política de inactividad y
criterio de cierre de cuenta.

### 6.1 Uploads, avatares y backup — adenda de evidencia actual

`CURRENT_EVIDENCE_ADDENDUM` · `FACTUAL_TECHNICAL_STATE` · verificado sobre
`3251b72a2aec88decafa9fa6a1cf2a54a0664e12`.

Esta adenda completa un hueco de evidencia del inventario original, que describía el avatar solo
como fichero en filesystem y no registraba ni el mecanismo de persistencia ni la capacidad de
copia y restauración verificada posteriormente (`B3-BACKUP-01`).

| Aspecto | Estado observado |
|---|---|
| Uploads / avatares | **Estado persistente de la aplicación**, no artefacto transitorio |
| Relación con `avatarUrl` | `avatarUrl` referencia el recurso o ruta del avatar subido, conforme a la implementación actual |
| Mecanismo de persistencia | Volumen persistente, según la topología verificada |
| Alcance de la verificación de backup y restore | Base de datos **y** estado persistente de uploads |
| Capacidad de backup y restore | **Verificada en local y con datos sintéticos** |
| Programación productiva de backups | **No establecida** por `B3-BACKUP-01` |
| Backups de datos reales de candidatos | **No autorizados** |
| Backups de datos reales verificados | **No** |
| Almacenamiento fuera del host | **No establecido** |
| Retención técnica | `DOCUMENTATION_ONLY`. Esta evidencia **no** establece ninguna política de retención productiva implantada |

Delimitación expresa, para evitar lecturas que la evidencia no sostiene:

- capacidad de backup y restore verificada **no** equivale a backups productivos operativos;
- volumen persistente **no** equivale a política de retención;
- verificación local con datos sintéticos **no** equivale a backups de datos reales de
  candidatos.

No se afirma programación productiva, cron productivo, almacenamiento fuera del host, backups
reales, redundancia geográfica, política jurídica de conservación ni entorno productivo
autorizado.

`[DECISIÓN DEL RESPONSABLE]` · `[REVISIÓN ESPECIALIZADA]` — la conservación jurídica de uploads
y avatares, y los plazos que le correspondan, **no se deciden aquí**. `AVATAR-02` (ausencia de
borrado físico) permanece abierto y sin cambio de estado.

```text
RETENTION_LEGAL_DECISION:
NOT_DECIDED
```

## 7. Logs y telemetría observados

- **No existe logger de peticiones** (sin `morgan`, `pino`, `winston`).
- El manejador de errores (`error-handler.middleware.ts`) registra el error completo en consola
  **solo fuera de producción**; en producción responde `"Internal server error."` sin detalle.
- Los `console.log` restantes son de arranque del servidor y de scripts de ingesta manual.
- **No se han observado registros persistentes que contengan datos personales.**
- El limitador de peticiones **no escribe la IP en logs** ni añade logging o métricas (§2.2).

## 8. Cuestiones de aplicabilidad pendientes

`[REVISIÓN ESPECIALIZADA]` — las siguientes cuestiones **no se resuelven en este sprint** y no
se presentan como obligaciones confirmadas:

| Cuestión | Estado |
|---|---|
| Registro de actividades de tratamiento (art. 30 RGPD) | **Aplicabilidad pendiente.** Este inventario es material de trabajo que podría servirle de base, pero no se afirma que constituya dicho registro ni que sea exigible |
| Evaluación de impacto (art. 35 RGPD) | **Aplicabilidad pendiente** |
| Calificación del match respecto al art. 22 RGPD | **Pendiente.** No se afirma que resulte aplicable ni que no lo resulte |
| Alcance del deber de informar sobre la lógica del match (arts. 13–15 RGPD) | **Pendiente.** No se presenta como obligación general confirmada |
| Excepción de cookies para `refresh_token` | **Pendiente** (§5.4) |
| Aplicabilidad de la LSSI al portfolio público | **Pendiente** |

## 9. Fuentes oficiales

- [AEPD — Derecho de información](https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion)
- [AEPD — Ejerce tus derechos](https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos)
- [AEPD — Guía sobre el uso de las cookies (mayo 2024)](https://www.aepd.es/guias/guia-cookies.pdf)
- Reglamento (UE) 2016/679 (RGPD)
- Ley Orgánica 3/2018 (LOPDGDD)
- Ley 34/2002 (LSSI)

**Este documento no afirma cumplimiento jurídico de ningún tipo.**
