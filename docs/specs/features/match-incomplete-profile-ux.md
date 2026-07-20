# Spec: Match con perfil incompleto — UX frontend (Sprint 21C)

## Metadatos

- **Sprint**: 21C — Match Empty/Incomplete Profile UX (mini-spec).
- **Tipo**: **frontend-only**. No toca `apps/api/**`, Prisma, contratos HTTP, scoring ni thresholds.
- **Hallazgos que resuelve**: **MATCH-01** (absorbiendo **DASH-01**), **MATCH-02**, **JOBS-05**.
  Referencia: [sprint-21-ux-ui-audit-report.md](../../sprints/sprint-21-ux-ui-audit-report.md), secciones 4.3, 4.9, 4.11 y matriz 10.
- **Fuera de alcance explícito**: **MATCH-04** (copy de escala "50/100 = Baja") queda **fuera** de este
  sprint; ver sección 11.
- **Dependencias**: Sprint 21A (frase de afinidad ya legible vía `humanizeMatchExplanation`) y 21B
  (paginación de Jobs), ambos integrados en `dev`.
- **Specs base**: [match-basic.md](match-basic.md), [dashboard.md](dashboard.md),
  [candidate-profile-cv.md](candidate-profile-cv.md), [00-mvp-scope.md](../00-mvp-scope.md).

## 1. Problema

Con un perfil **sin skills** (`skills.length === 0`), la experiencia de Match es ruidosa y engañosa:

- **`/match`**: el backend puntúa **todas** las ofertas (nunca devuelve lista vacía), así que se
  renderizan hasta 20 `MatchCard` a `0/100`, cada una repitiendo el mismo aviso
  ("El backend ordena esta oferta por una puntuación básica; añade skills…"). El estado vacío
  "Todavía no hay ofertas con afinidad" ([match-page.tsx:137-161](../../../apps/web/src/features/match/match-page.tsx#L137-L161))
  es **inalcanzable** en la práctica.
- **Dashboard (DASH-01)**: la métrica "Matches" muestra el recuento crudo (p. ej. "3 Matches") y el
  bloque "Tus mejores matches" pinta tres tarjetas al `0%`, en lugar del estado guía "Sin matches"
  ya previsto por la spec ([dashboard.md](dashboard.md) flujo alternativo "Sin matches";
  bloque en [dashboard-content.tsx:549-611](../../../apps/web/src/features/dashboard/dashboard-content.tsx#L549-L611)).
- **Pesos no visibles (MATCH-02)**: la spec de match exige que los pesos (Skills 50, Modalidad 20,
  Seniority 20, Ubicación 10) sean visibles o documentados para el candidato
  ([match-basic.md](match-basic.md) reglas de negocio); hoy `/match` solo **nombra** los factores en
  su intro ([match-page.tsx:185-191](../../../apps/web/src/features/match/match-page.tsx#L185-L191)),
  sin porcentajes.
- **Detalle de oferta (JOBS-05)**: cuando **la oferta** no especifica skills, el panel muestra
  "Añade skills y preferencias a tu perfil para afinar el match"
  ([job-match-panel.tsx:164-172](../../../apps/web/src/features/match/job-match-panel.tsx#L164-L172)),
  **culpando al perfil** por un dato ausente **de la oferta**. La spec distingue explícitamente
  ambos casos ([match-basic.md](match-basic.md): `match: null` "no aplica" vs "completa tu perfil").

## 2. Objetivo

Mejorar **solo la presentación frontend** para orientar al candidato cuando el perfil o la oferta no
aportan skills, **sin modificar** scoring, contratos, DTOs, thresholds, etiquetas de nivel ni
persistencia. El objetivo es sustituir "resultados vacíos" (ceros repetidos) por "estados guía"
accionables, hacer visibles los pesos y diferenciar honestamente "perfil sin skills" de
"oferta sin skills".

## 3. Fuente de verdad (identificada en el código)

Todas las señales son **campos tipados existentes**. Regla dura: **no** se infiere estado buscando
palabras dentro de `explanation` ni contando `score === 0` como sustituto de `skills.length`.

### 3.1 Cómo conocerá `/match` el número de skills del perfil

Hoy [match-page.tsx](../../../apps/web/src/features/match/match-page.tsx) **no** consulta el perfil:
solo llama `getJobMatches` y `getSavedJobs`. Para conocer `profile.skills.length` se usará el
cliente ya existente:

- `getMyProfile(token)` en
  [profile-api.ts:60-63](../../../apps/web/src/features/profile/profile-api.ts#L60-L63) →
  `CandidateProfileDto` ([types/api.ts:287-307](../../../apps/web/src/types/api.ts#L287-L307)).
- Campo tipado: **`CandidateProfileDto.skills: ProfileSkillDto[]`**
  ([types/api.ts:301](../../../apps/web/src/types/api.ts#L301) y
  [233-238](../../../apps/web/src/types/api.ts#L233-L238)). El read model garantiza `[]` cuando no
  hay skills ([candidate-profile-cv.md](candidate-profile-cv.md), "Listas vacías → `[]`").
- Señal de estado guía: **`profile.skills.length === 0`**.

Nota: esto introduce **una petición adicional** de perfil en `/match` (ver riesgos, sección 12),
cargada en paralelo a los matches. A diferencia de las guardadas (que solo alimentan el toggle), el
perfil **sí** es necesario para decidir la presentación: su contrato de carga/error está en 4.3.

### 3.2 Qué datos ya recibe Dashboard para detectar `skills = []`

Dashboard **ya** recibe todo lo necesario; **no** requiere peticiones nuevas:

- `getCandidateDashboard(token)` → `CandidateDashboardDto`
  ([dashboard-api.ts:8-10](../../../apps/web/src/features/dashboard/dashboard-api.ts#L8-L10),
  [types/api.ts:194-202](../../../apps/web/src/types/api.ts#L194-L202)).
- Campo tipado: **`CandidateDashboardDto.skills: string[]`**
  ([types/api.ts:196](../../../apps/web/src/types/api.ts#L196)), ya desestructurado en
  [dashboard-content.tsx:380](../../../apps/web/src/features/dashboard/dashboard-content.tsx#L380) y
  usado como `skillsCount = skills.length` y `hasSkills = skillsCount > 0`
  ([dashboard-content.tsx:384-390](../../../apps/web/src/features/dashboard/dashboard-content.tsx#L384-L390)).
- Señal de estado guía: **`skills.length === 0`** (equivalente: `!hasSkills`).
- El estado guía de destino **ya existe** en
  [dashboard-content.tsx:596-609](../../../apps/web/src/features/dashboard/dashboard-content.tsx#L596-L609)
  (solo está inalcanzable hoy).

### 3.3 Qué campos tipados usa `JobMatchPanel` para JOBS-05 (oferta sin skills)

`JobMatchPanel({ jobId, token })`
([job-match-panel.tsx](../../../apps/web/src/features/match/job-match-panel.tsx)) carga
`getJobMatch(token, jobId)` → `JobMatchDto`
([types/api.ts:143-151](../../../apps/web/src/types/api.ts#L143-L151)). **JOBS-05 se resuelve
exclusivamente con los campos tipados que ya trae ese DTO**; el panel **no** añade ninguna petición
ni recibe ninguna prop nueva:

- `matchedSkills: string[]` — intersección perfil ∩ oferta.
- `missingSkills: string[]` — skills **de la oferta** (fuente canónica `Job.tags`, ver
  [match-basic.md](match-basic.md) tabla de factores) que el perfil no tiene.
- `factors: MatchFactorDto[]` con `{ name: MatchFactorName; match: boolean | null; detail }`
  ([types/api.ts:127-131](../../../apps/web/src/types/api.ts#L127-L131)); el factor de skills es
  `factors.find(f => f.name === "skills")`.

Derivaciones tipadas (sin leer `explanation`, `score`, `level`, texto ni valores no tipados):

- **La oferta aporta señal de skills** ⟺ `matchedSkills.length > 0 || missingSkills.length > 0`.
- **La oferta no aporta señal evaluable de skills** ⟺
  `matchedSkills.length === 0 && missingSkills.length === 0` (si la oferta tuviera `tags`,
  alimentarían `matchedSkills` o `missingSkills`), corroborado por el factor de skills con
  `match === null`. Es exactamente el actual `!hasSkillSignal`
  ([job-match-panel.tsx:80](../../../apps/web/src/features/match/job-match-panel.tsx#L80)), hoy mal
  rotulado como problema del perfil.

**El detalle NO conoce `profile.skills.length`** (el `JobMatchDto` no lo expone) y **no** se añade
una petición a Profile para obtenerlo (fuera de alcance, sección 11). Por tanto, el panel **nunca
afirma que el perfil esté vacío**: cuando la oferta no aporta skills (caso C) el copy se centra en la
oferta; cuando la oferta sí aporta skills sin coincidencias (caso B) se orienta a mejorar el perfil
sin afirmar que está vacío. El contrato completo está en la sección 7.

## 4. Contrato UX de `/match`

### 4.1 Estado guía — `profile.skills.length === 0`

- Se **conserva** el encabezado del `SiteShell` ("JobIT Match") y la intro de honestidad
  ([match-page.tsx:183-191](../../../apps/web/src/features/match/match-page.tsx#L183-L191)).
- Se muestra **una única guía** (un solo `heading` + un solo CTA), en lugar de la lista de tarjetas.
- **No** se renderiza ninguna `MatchCard`.
- **No** se muestra el contador "N ofertas ordenadas por afinidad"
  ([match-page.tsx:164-168](../../../apps/web/src/features/match/match-page.tsx#L164-L168)) — sería
  engañoso.
- **No** se repiten disclaimers por tarjeta (al no haber tarjetas, desaparece el aviso ×20).
- Copy orientativo:
  - **Título**: "Añade skills para calcular tu afinidad".
  - **CTA**: "Añadir skills al JobIT CV" → `href="/profile"` (destino aprobado; **no** se introduce
    ningún deep link nuevo — ver sección 11).

### 4.2 Estado poblado — `profile.skills.length >= 1`

- Se **conserva** el listado, el orden, los scores, los niveles y las `MatchCard` actuales.
- **No** se altera el algoritmo ni se filtran resultados por un umbral nuevo (una oferta a `0/100`
  con perfil con skills sigue mostrándose; es información legítima).
- El contador "N ofertas ordenadas por afinidad" se mantiene, con la concordancia singular/plural ya
  corregida en 21A.
- El aviso por tarjeta sin señal de skills
  ([match-card.tsx:114-118](../../../apps/web/src/features/match/match-card.tsx#L114-L118)) puede
  permanecer para tarjetas puntuales sin datos; ya **no** es un aviso ×20 porque el caso masivo
  (perfil vacío) se atiende en 4.1.

### 4.3 Loading / error / retry

Contrato inequívoco: **el perfil (`getMyProfile`) y los matches (`getJobMatches`) son ambos datos
necesarios** para decidir la presentación (guía vs lista). Se cargan en paralelo.

- Se reutilizan los componentes accesibles existentes: `LoadingState` y `ErrorState`
  ([feedback.tsx](../../../apps/web/src/components/ui/feedback.tsx)); `handleRetry` ya existe
  ([match-page.tsx:82-86](../../../apps/web/src/features/match/match-page.tsx#L82-L86)) y deberá
  relanzar **ambas** peticiones.
- **Mientras cualquiera de las dos esté pendiente**: `LoadingState` existente.
- **Si cualquiera de las dos falla**: `ErrorState` accesible con "Reintentar".
- **"Reintentar" vuelve a solicitar ambos datos** (perfil y matches).
- **Prohibido** mostrar el listado de forma silenciosa como fallback cuando `profile.skills` se
  desconoce (perfil pendiente o fallido): reintroduciría el estado engañoso de 20 tarjetas a `0/100`
  que MATCH-01 corrige. Sin señal de skills fiable, la presentación es `LoadingState` o `ErrorState`,
  nunca la lista.
- 401 de cualquiera de las dos peticiones mantiene el comportamiento actual: `clearSession()` +
  redirección a `/login`.

## 5. Contrato UX de Dashboard (DASH-01)

Sobre `CandidateDashboardDto` ya recibido; **sin** cambiar el contrato del endpoint.

### 5.1 Cuando `skills.length === 0`

- **Métrica "Matches" = 0** ([dashboard-content.tsx:450-456](../../../apps/web/src/features/dashboard/dashboard-content.tsx#L450-L456)):
  se presenta `0`, no el recuento crudo de `matches.length`.
- **No** se renderizan las tres tarjetas al `0%`
  ([dashboard-content.tsx:553-587](../../../apps/web/src/features/dashboard/dashboard-content.tsx#L553-L587)).
- Se muestra la **guía existente** hacia `/profile`
  ([dashboard-content.tsx:596-609](../../../apps/web/src/features/dashboard/dashboard-content.tsx#L596-L609):
  "Todavía no hay matches para tu perfil" + "Completar perfil").

Implementación sugerida (frontend): derivar `presentableMatches = hasSkills ? matches : []` y usarla
tanto para la métrica como para el bloque "Tus mejores matches", de modo que ambos respeten el mismo
umbral de presentación. Es un **umbral de presentación**, no un cambio de datos.

### 5.2 Cuando `skills.length >= 1`

- Se **conserva** el comportamiento actual (métrica con `matches.length`, hasta 3 tarjetas con score
  y skills coincidentes).

**No** se cambia el contrato de `GET /api/dashboard/me` ni sus DTOs.

## 6. Pesos visibles — MATCH-02

- Se muestra **una sola** explicación introductoria en `/match`, presente **tanto en el estado guía
  (4.1) como en el poblado (4.2)**, integrada en el bloque de intro existente
  ([match-page.tsx:185-191](../../../apps/web/src/features/match/match-page.tsx#L185-L191)):

  > "Skills 50% · Seniority 20% · Modalidad 20% · Ubicación 10%"

- Se añade, de forma breve, que es una **ponderación básica y fija, sin IA**.
- **No** se repite esta explicación dentro de cada `MatchCard`.
- Los porcentajes son **copy** que refleja los pesos ya documentados en
  [match-basic.md](match-basic.md); **no** se leen de la API ni se recalculan.

## 7. Copy de detalle — JOBS-05

Reglas frontend en `JobMatchPanel`, basadas **exclusivamente** en los campos tipados que ya trae
`JobMatchDto` (sección 3.3). **Sin** prop nueva, **sin** petición a Profile desde el detalle y **sin**
afirmar que el perfil está vacío (el DTO de detalle no lo demuestra). A y B son renderizados
independientes de cada lista; **C tiene prioridad** sobre cualquier copy orientado al perfil.

| Regla | Condición tipada | Significado | Comportamiento / copy |
|---|---|---|---|
| A | `matchedSkills.length > 0` | La oferta aporta señal de skills que coinciden | Mostrar las coincidencias actuales ("Skills que coinciden"), como hoy. |
| B | `missingSkills.length > 0` | La oferta aporta skills que no coinciden con el perfil | Mostrar las ausentes ("Skills que podrías sumar"), como hoy. Se **puede** orientar a mejorar el perfil ("añade las que te falten para mejorar el match"), pero **no** afirmar que el perfil está vacío. |
| C | `matchedSkills.length === 0 && missingSkills.length === 0` (corroborado por el factor `skills` con `match === null`) | La oferta **no** aporta señal evaluable de skills | Copy centrado en la oferta: **"La oferta no especifica skills; este factor no puede evaluarse."** **No** pedir al candidato que complete el perfil. Reemplaza el fallback actual de [job-match-panel.tsx:164-172](../../../apps/web/src/features/match/job-match-panel.tsx#L164-L172). |

**Prioridad**: si se cumple C (ambos arrays vacíos), el copy es el de la oferta y **nunca** un copy
orientado al perfil. A y B solo aplican cuando su respectiva lista tiene elementos.

**Prohibido inferir** el estado desde `explanation`, `score`, `level`, búsquedas de texto o cualquier
valor no tipado. **No** se modifica `explanation` del backend ni el `JobMatchDto`;
`humanizeMatchExplanation`
([match-format.ts:40-42](../../../apps/web/src/features/match/match-format.ts#L40-L42)) sigue
humanizando la frase del backend sin tocar el contrato.

## 8. Accesibilidad y responsive

- **Un único** estado guía en `/match` con `heading` accesible y CTA con nombre accesible real
  (enlace a `/profile`). Sin elementos sin nombre.
- Se mantienen `LoadingState` / `ErrorState` / feedback de guardado accesibles ya existentes
  (`role="status"`, `aria-busy`, `role="alert"`).
- La guía y la explicación de pesos deben caber **sin overflow horizontal en 390 px** (usar los
  mismos contenedores/tokens que la intro actual).
- **No** se introduce modal, tooltip obligatorio ni navegación nueva. El único destino es `/profile`,
  ruta ya existente (sin deep links nuevos).

## 9. Criterios de aceptación verificables

**`/match` — perfil sin skills (`skills.length === 0`)**
- [ ] Se muestra el título "Añade skills para calcular tu afinidad" y **no** se renderiza ninguna
      `MatchCard`.
- [ ] El CTA "Añadir skills al JobIT CV" enlaza a `/profile` (ruta base, sin ancla ni deep link).
- [ ] **No** aparece el contador "N ofertas ordenadas por afinidad".
- [ ] **No** se repite ningún disclaimer por tarjeta (no hay tarjetas).

**`/match` — perfil con skills (`skills.length >= 1`)**
- [ ] Se conservan listado, orden, scores, niveles y `MatchCard`.
- [ ] El contador reaparece con la concordancia correcta (1 → "1 oferta…").
- [ ] Una oferta a `0/100` **sigue** mostrándose (no se filtra por umbral).

**Dashboard (DASH-01)**
- [ ] Con `skills: []` y `matches` poblado: la métrica "Matches" muestra **0**.
- [ ] Con `skills: []`: **no** se renderizan tarjetas al `0%`; se muestra la guía "Completar perfil"
      hacia `/profile`.
- [ ] Con `skills.length >= 1`: comportamiento actual intacto (métrica y hasta 3 tarjetas).

**Pesos visibles (MATCH-02)**
- [ ] En `/match`, tanto en estado guía como poblado, aparece **una sola vez**
      "Skills 50% · Seniority 20% · Modalidad 20% · Ubicación 10%" con la nota de ponderación básica
      y sin IA.
- [ ] Los porcentajes **no** aparecen dentro de las tarjetas.

**Detalle — JOBS-05** (solo con campos tipados de `JobMatchDto`; sin prop nueva ni petición a Profile)
- [ ] Oferta sin skills (`matchedSkills=[]`, `missingSkills=[]`): copy centrado en la oferta
      ("La oferta no especifica skills; este factor no puede evaluarse."); **no** se pide completar el
      perfil.
- [ ] Oferta con skills sin coincidencias (`missingSkills>0`): se mantiene la lista "podrías sumar"
      con copy que orienta a mejorar el perfil **sin** afirmar que está vacío.
- [ ] Con coincidencias (`matchedSkills>0`): desglose actual intacto.

**Loading / error / retry de `/match`**
- [ ] Mientras el perfil **o** los matches estén pendientes: `LoadingState` (role=status, aria-busy).
- [ ] Si el perfil **o** los matches fallan: `ErrorState` con "Reintentar".
- [ ] "Reintentar" vuelve a solicitar **ambos** datos (perfil y matches).
- [ ] **Nunca** se muestra el listado como fallback silencioso cuando `profile.skills` se desconoce.

**Regresión del flujo poblado**
- [ ] Guardar/quitar desde `/match`, enlaces "Ver oferta", disclaimer de honestidad y no exposición
      del token siguen funcionando igual.

## 10. Tests mínimos (TDD, archivos reales)

Se escriben/ajustan **antes** de implementar. Invariantes fijados: CTA con `href="/profile"` (ruta
base, sin ancla); **ninguna** prop de skills de perfil en el panel de detalle; **cero** mock adicional
de Profile en `JobDetailPage`/`JobMatchPanel`.

**`apps/web/src/features/match/match-page.test.tsx`**
- Añadir `vi.mock("@/features/profile/profile-api", () => ({ getMyProfile: vi.fn() }))` y un default en
  `beforeEach` con **≥1 skill** (para que los casos existentes sigan en verde).
- (a) Perfil `skills: []` → aparece "Añade skills para calcular tu afinidad", **no** hay `MatchCard`,
  **no** aparece el contador "ordenadas por afinidad", y el CTA "Añadir skills al JobIT CV" enlaza a
  `href="/profile"`.
- (b) Perfil con skills → lista intacta (reusa asserts actuales) + pesos
  "Skills 50% · Seniority 20% · Modalidad 20% · Ubicación 10%" visibles **una sola vez** (también en
  el estado guía).
- (c) **Fallo de Profile** (`getMyProfile` rechaza, matches OK) → `ErrorState` con "Reintentar";
  **no** se muestra el listado.
- (d) **Fallo de Match** (`getJobMatches` rechaza, perfil OK) → `ErrorState` con "Reintentar".
- (e) "Reintentar" vuelve a solicitar **ambos**: `getMyProfile` y `getJobMatches` llamados 2 veces.
- Ajustar el caso existente "sin skills comparables… puntuación básica"
  ([match-page.test.tsx:183-191](../../../apps/web/src/features/match/match-page.test.tsx#L183-L191))
  al nuevo modelo (perfil con skills + tarjeta puntual sin señal), evitando que fije el aviso ×20.

**`apps/web/src/features/dashboard/dashboard-page.test.tsx`**
- Nuevo (DASH-01): DTO con `skills: []` **y** `matches` poblado (p. ej. 3 con `score: 0`) → métrica
  "Matches" = **0**, **no** hay tarjetas al `0%`, se muestra "Completar perfil" hacia `/profile`.
- El caso `emptyDto` existente (`skills: []`, `matches: []`) sigue mostrando la guía (regresión).
- El caso `fullDto` (con skills) mantiene "Ver matches: 1" y las tarjetas (regresión).

**`apps/web/src/features/match/job-match-panel.test.tsx`** (nuevo archivo; hoy no existe test del
panel). Se monta `JobMatchPanel` con `jobId`/`token`, mockeando **solo** `getJobMatch`; **ningún**
mock de Profile:
- (a) Coincidencias (`matchedSkills:["ts"]`) → "Skills que coinciden" con la skill; desglose intacto.
- (b) `missingSkills:["aws"]` (con `matchedSkills:[]`) → "Skills que podrías sumar" con la skill;
  copy que orienta a mejorar el perfil **sin** afirmar que está vacío.
- (c) Ambos arrays vacíos (`matchedSkills:[]`, `missingSkills:[]`, factor `skills` con `match:null`)
  → copy centrado en la oferta ("La oferta no especifica skills; este factor no puede evaluarse.");
  **no** aparece ningún texto que pida completar el perfil.

Cobertura transversal exigida por el prompt: casos vacíos y poblados, ausencia de `MatchCard` y de
mensajes repetidos, CTA a `/profile`, pesos visibles una sola vez, y copys diferenciados de JOBS-05.

## 11. Fuera de alcance

- `apps/api/**`, Prisma y base de datos.
- DTOs y contratos HTTP (incluido el de `GET /api/dashboard/me`).
- Scoring y pesos del algoritmo (50/20/20/10): solo se **muestran**, no se calculan.
- Thresholds y etiquetas de nivel de afinidad (VERY_LOW/LOW/GOOD/VERY_GOOD y su mapeo "Muy baja/
  Baja/Buena/Muy buena"), **incluido MATCH-04** (copy de escala "50/100 = Baja"): **no** se toca en
  este sprint.
- Persistencia de sesión (ADR-0006).
- Filtros, paginación o listado de Jobs.
- Rediseño visual, nuevos componentes o design system.
- Dependencias nuevas.
- Cambios de URL o deep links nuevos (el CTA de `/match` usa `/profile`, ruta ya existente).
- Petición a Profile desde el detalle de oferta (`/jobs/[id]`) para JOBS-05: **prohibida**; JOBS-05 se
  resuelve solo con los campos tipados de `JobMatchDto`.
- Commit, push, PR o merge (fase posterior, con autorización explícita).

## 12. Riesgos

- **Petición adicional de Profile en `/match`**: `getMyProfile` añade una llamada, cargada en paralelo
  a los matches. Riesgo de latencia percibida; mitigación: `LoadingState` único mientras cualquiera
  esté pendiente. **No** se degrada a lista ante fallo (ver siguiente riesgo).
- **Coordinación de loading/error entre Profile y Match**: dos fuentes asíncronas. Decisión firme (4.3):
  no decidir el render hasta tener la señal de skills; si el perfil o los matches fallan → `ErrorState`
  con "Reintentar" (que relanza ambos). **Prohibido** el fallback silencioso a la lista, porque
  reintroduciría las 20 tarjetas a `0/100` que MATCH-01 corrige.
- **Mocks existentes a ampliar**: `match-page.test.tsx` **no** mockea `profile-api` hoy; sin el mock
  nuevo con default de ≥1 skill, los tests actuales romperían (llamada real). `dashboard-page.test.tsx`
  no cubre el caso `skills:[]` con `matches` poblado (hay que añadirlo). No existe test de
  `JobMatchPanel` (se crea, mockeando solo `getJobMatch`).
- **Confundir "sin skills" con "sin coincidencias"**: `matchedSkills:[]` + `missingSkills>0` puede ser
  perfil vacío **o** perfil con skills no solapadas. Como el detalle **no** conoce `profile.skills`
  (no se consulta Profile allí), el copy del caso B **nunca** afirma que el perfil esté vacío: solo
  orienta a mejorar el match. El caso C (oferta sin skills) se centra en la oferta y tiene prioridad.

## Auditoría requerida

- [ ] Quality/security documental.
- [ ] Tests y verificaciones locales (`@jobit/web`: typecheck, lint, test, build) en la fase de
      implementación.
- [ ] Revisión humana.
