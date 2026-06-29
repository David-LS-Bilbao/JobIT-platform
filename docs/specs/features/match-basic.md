# Spec: Match básico explicable (M05)

## Objetivo

Mostrar al candidato un indicador simple y comprensible de afinidad entre su perfil y una oferta laboral. El match se basa en reglas visibles y explicables. No usa inteligencia artificial avanzada, modelos de ML ni rankings opacos.

## Usuario afectado

Candidato tech autenticado con perfil suficientemente completo (al menos skills y preferencias básicas) que quiere saber por qué una oferta puede ser relevante para él.

## Flujo principal

1. El candidato consulta el detalle de una oferta (M03).
2. El sistema calcula el match entre el perfil del candidato y la oferta.
3. Se muestra un indicador de afinidad (porcentaje o nivel) junto con las razones explicadas.
4. El candidato puede ver qué factores coinciden y cuáles no.
5. En el dashboard (M06), se muestra un resumen de los mejores matches.

## Flujos alternativos

- Perfil incompleto: el match se calcula con los datos disponibles, pero se informa al candidato de que completar el perfil mejorará la precisión.
- Sin skills en el perfil: se muestra el indicador como no disponible o muy bajo, con mensaje orientativo.
- Sin preferencias: el match no considera ese factor y se indica.
- Oferta sin tags ni requisitos: el match es parcial con los datos que existen.

## Modelo de datos conceptual

El match básico no requiere una entidad propia persistida en el MVP. Se calcula en tiempo de petición a partir de los datos del perfil y la oferta.

Si en el futuro se necesita caché de resultados o historial de match, se considerará un ADR separado.

### Factores de cálculo (reglas visibles)

Pesos fijos del MVP (suman 100). El cálculo deberá ser determinista y explicable.

| Factor | Peso | Fuente candidato | Fuente oferta | Regla |
|---|---:|---|---|---|
| Skills coincidentes | 50 | `Skill.normalizedName` | `Job.tags` (fuente canónica) | Intersección normalizada; `Job.requirements` es texto libre opcional, no fuente obligatoria del MVP |
| Modalidad | 20 | `JobPreferences.remotePreference` | `Job.remoteType` | `ANY` o coincidencia exacta → peso completo; `UNSPECIFIED`/ausente → `null` |
| Seniority | 20 | `JobPreferences.seniority` | `Job.seniority` | `Job.seniority = ANY` o igualdad → peso completo; ausente → `null` |
| Ubicación | 10 | `JobPreferences.preferredLocations` | `Job.location` | Coincidencia (contains, case-insensitive); oferta `REMOTE` → `null` "no aplica" |

El contrato (`JobPreferences.contractTypes` / `Job.contractType`) queda **fuera** del algoritmo del MVP para no ampliar alcance, aunque exista el dato.

Los pesos deben documentarse de forma visible para el candidato.

## Endpoints previstos

Rutas finales (con prefijo global `/api`):

| Método | Ruta | Descripción |
|---|---|---|
| GET | /api/jobs/:id/match | Calcula y devuelve el match entre el candidato autenticado y la oferta |
| GET | /api/profile/me/matches | Devuelve las N mejores ofertas con match para el candidato (para dashboard) |

Arquitectura esperada (a implementar en fase posterior, no ahora): un módulo nuevo `apps/api/src/match/` con la lógica de scoring pura, su servicio y un router; el router deberá montarse en `app.ts` con `app.use("/api", matchRouter)` definiendo las rutas completas `/jobs/:id/match` y `/profile/me/matches`, sin modificar los routers de Jobs ni Profile.

Campos del contrato de respuesta: `score` (entero 0-100), `level`, `factors` (`{ name, match, detail }`, con `match` true/false/null), `matchedSkills`, `missingSkills`, `explanation`. Nunca se exponen `externalId` ni `ingestedAt`.

Respuesta esperada de `GET /api/jobs/:id/match`:

```json
{
  "jobId": "uuid",
  "score": 72,
  "level": "GOOD",
  "matchedSkills": ["node.js", "typescript"],
  "missingSkills": ["aws"],
  "factors": [
    { "name": "skills", "match": true, "detail": "2 de 3 skills coinciden" },
    { "name": "remote", "match": true, "detail": "Remoto — coincide con tu preferencia" },
    { "name": "seniority", "match": false, "detail": "La oferta pide SENIOR; tu perfil indica MID" },
    { "name": "location", "match": null, "detail": "No aplica (oferta remota)" }
  ],
  "explanation": "Buena afinidad por skills y modalidad; revisa seniority."
}
```

Respuesta esperada de `GET /api/profile/me/matches` (resumida, ordenada por `score` descendente). El `job` embebido deberá serializarse con `serializeJob` / `JobPublicDto` (sin `externalId` ni `ingestedAt`). Acepta `limit` por query (default 10, máximo 50):

```json
{
  "data": [
    {
      "job": { "id": "uuid", "title": "...", "company": "...", "source": "INTERNAL", "sourceUrl": null },
      "score": 81,
      "level": "VERY_GOOD",
      "matchedSkills": ["node.js", "typescript"],
      "missingSkills": []
    }
  ]
}
```

Todas las rutas son privadas. Requieren sesión activa. El `userId` se obtiene siempre de `req.auth.userId`; nunca se acepta desde body, query ni params.

## Pantallas previstas

- **Indicador en detalle de oferta**: score visual (porcentaje, barras o niveles: bajo/medio/bueno/muy bueno) con desglose por factores.
- **Explicación de factores**: lista de factores con estado (coincide / no coincide / no aplica) y texto descriptivo breve.
- **Aviso de perfil incompleto**: mensaje que invita a completar el perfil para mejorar el match.
- **Resumen en dashboard**: lista de las mejores ofertas con score resumido (sin desglose completo).

## Reglas de negocio

- El match se calcula exclusivamente con reglas deterministas y visibles. Sin modelos estadísticos ni ML en el MVP.
- El score es orientativo, no una evaluación de la persona. No determina si el candidato es válido para la oferta.
- Los factores y sus pesos deben ser visibles o documentados de forma que el candidato pueda entender el resultado.
- El match no reemplaza la lectura de la oferta ni la decisión del candidato.
- Un match bajo no bloquea al candidato de guardar o explorar la oferta.
- El cálculo se hace en tiempo de petición. No se persiste en el MVP (sin caché).
- Los niveles de score: VERY_LOW (0-25), LOW (26-50), GOOD (51-75), VERY_GOOD (76-100).
- Perfil incompleto: no bloquea el cálculo. Los factores sin datos suficientes aparecen con `match: null`, contribuyen 0 al score (sin renormalizar) y la `explanation` debe indicar que completar el perfil mejora el match.
- Distinción en `match: null`: "no aplica" (estructural, p. ej. ubicación en oferta remota) frente a "completa tu perfil" (dato del candidato ausente); ambos contribuyen 0.
- Las respuestas que embeben una oferta deben reutilizar `serializeJob` / `JobPublicDto`; nunca exponer `externalId` ni `ingestedAt`; `source` y `sourceUrl` sí son públicos.
- Saved Jobs queda **fuera** del algoritmo del MVP: una oferta guardada expresa intención del usuario, no afinidad perfil-oferta.
- No requiere ADR nueva: ADR-0007 ya contempla ambas rutas y ADR-0008 cubre el modelo; al no persistir entidad, no hay decisión arquitectónica nueva.

## Validaciones

| Entrada | Regla |
|---|---|
| jobs/:id | UUID válido, oferta activa |
| Perfil del candidato | Existe (puede estar incompleto, se calcula con lo disponible) |

## Errores

| Situación | Código | Mensaje orientativo |
|---|---|---|
| Oferta no encontrada | 404 | "Oferta no disponible" |
| Sin sesión | 401 | Redirección al login |
| Error de cálculo | 500 | "No se ha podido calcular la compatibilidad. Inténtalo de nuevo" |

## Criterios de aceptación

- [ ] El candidato ve un indicador de afinidad en el detalle de cada oferta.
- [ ] El indicador muestra los factores que contribuyen al score con explicación breve.
- [ ] El match se basa en reglas visibles, no en modelos opacos.
- [ ] Un perfil incompleto no bloquea el cálculo, pero informa al candidato.
- [ ] El score no impide guardar ni explorar ninguna oferta.
- [ ] El dashboard muestra las mejores ofertas con score resumido.

## Tests mínimos

- Perfil con skills que coinciden con la oferta → score alto en factor skills.
- Perfil sin skills → factor skills como no disponible, score bajo.
- Modalidad del candidato coincide con la oferta → factor modalidad positivo.
- Seniority no coincide → factor seniority negativo.
- Oferta remota → factor ubicación como no aplica.
- Score total se calcula correctamente con todos los factores.
- Respuesta incluye el desglose de factores para cada petición.
- Sin sesión → 401.

## Fuera de alcance

- Modelos de machine learning o embeddings.
- Ranking de candidatos para recruiters.
- Evaluación de la persona (el match evalúa afinidad perfil-oferta, no al candidato).
- Recomendaciones activas por notificación.
- Match inverso (recruiter busca candidatos).
- Aprendizaje del match a partir del comportamiento del candidato.
- Ponderación personalizada por el candidato.

## Auditoría requerida

- [ ] Quality/security documental.
- [ ] Tests y verificaciones locales.
- [ ] Revisión humana.
