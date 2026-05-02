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

| Factor | Peso orientativo | Descripción |
|---|---|---|
| Skills coincidentes | Alto | Intersección entre skills del candidato y requisitos/tags de la oferta |
| Modalidad remota | Medio | Coincidencia entre preferencia del candidato y modalidad de la oferta |
| Seniority | Medio | Coincidencia entre nivel declarado y nivel esperado por la oferta |
| Ubicación | Bajo | Coincidencia de ciudad o región si la modalidad no es remota total |

Los pesos son orientativos y se fijarán en la implementación. Deben documentarse de forma visible para el candidato.

## Endpoints previstos

| Método | Ruta | Descripción |
|---|---|---|
| GET | /jobs/:id/match | Calcula y devuelve el match entre el candidato autenticado y la oferta |
| GET | /profile/me/matches | Devuelve las N mejores ofertas con match para el candidato (para dashboard) |

Respuesta orientativa de `/jobs/:id/match`:

```json
{
  "score": 72,
  "level": "GOOD",
  "factors": [
    { "name": "Skills", "match": true, "detail": "TypeScript, Node.js coinciden" },
    { "name": "Modalidad", "match": true, "detail": "Remoto — coincide con tu preferencia" },
    { "name": "Seniority", "match": false, "detail": "La oferta pide Senior, tu perfil indica Mid" },
    { "name": "Ubicación", "match": null, "detail": "No aplica (oferta remota)" }
  ]
}
```

Todas las rutas son privadas. Requieren sesión activa.

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
- Los niveles de score orientativos: VERY_LOW (0-25), LOW (26-50), GOOD (51-75), VERY_GOOD (76-100).

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
