# Informe final — Sprint 05 Match básico explicable

## 1. Resumen ejecutivo

Sprint 05 implementa el **Match básico explicable** backend-first para el candidato autenticado: dos endpoints privados que calculan, en tiempo de petición, la afinidad entre el perfil/CV del candidato y las ofertas persistidas. El scoring es **heurístico, determinista y explicable** (reglas visibles, sin IA/ML), con desglose por factores y una explicación legible. El match es **orientativo** y no condiciona ninguna acción del candidato.

## 2. Objetivo inicial

- Matching entre el perfil/CV del candidato autenticado y ofertas persistidas.
- Orientativo (no decide contratación).
- Explicable (factores visibles).
- Candidate-first.
- Sin IA avanzada / embeddings / LLM.
- Sin ranking para recruiters.
- Sin evaluación automatizada de personas.

## 3. Alcance implementado

- Endpoints privados `GET /api/jobs/:id/match` y `GET /api/profile/me/matches`.
- Scoring puro reutilizable (`match.scoring.ts`).
- Módulo backend completo: `match.service.ts`, `match.router.ts`, `match.schemas.ts`, `match.types.ts`.
- Integración con Auth (`requireAuth` → `req.auth.userId`), Profile (`getOrCreateCandidateProfile`) y Jobs (`getActiveJobById`, `serializeJob`).
- Compatibilidad con ofertas `INTERNAL` y `JOOBLE` persistidas.
- Serialización pública vía `serializeJob` / `JobPublicDto`.
- Ciclo TDD completo: RED (unit + 2 integraciones) → GREEN (scoring + endpoints).

## 4. Fuera de alcance respetado

No se implementó: frontend; dashboard; recruiter; ATS; ranking de candidatos; IA/ML/embeddings/LLM; Jooble en vivo; scraping; cron/scheduler/n8n; deploy; CI/CD; Prisma/migraciones; nuevas dependencias; monetización.

## 5. Endpoints implementados

### GET /api/jobs/:id/match
- Privado, con `requireAuth`.
- `userId` exclusivamente desde `req.auth.userId` (no se acepta de body/query/params).
- Validación `:id` con forma UUID (hex 8-4-4-4-12).
- Respuesta `200`: `{ jobId, score, level, matchedSkills, missingSkills, factors, explanation }`.
- Errores: `401` sin sesión; `400` UUID inválido; `404` oferta inexistente/no disponible ("Oferta no disponible").
- No expone `externalId` ni `ingestedAt`.

### GET /api/profile/me/matches
- Privado, con `requireAuth`.
- `userId` exclusivamente desde `req.auth.userId` (no se acepta de query/body/params).
- Query `limit`: default 10, mínimo 1, máximo 50; inválido → `400`.
- Respuesta `200`: `{ data: [...] }`, ordenado por `score` desc; `{ data: [] }` si no hay ofertas activas.
- Cada item: `job` (vía `serializeJob` / `JobPublicDto`), `score`, `level`, `matchedSkills`, `missingSkills`.
- Solo ofertas activas/vigentes. No expone `externalId` ni `ingestedAt`.

## 6. Modelo o algoritmo de match

- Determinista y heurístico; **sin persistencia** (cálculo en tiempo de petición); **sin IA**.
- Score entero **0-100**.
- Pesos: **skills 50**, **modalidad 20**, **seniority 20**, **ubicación 10**.
- Niveles: `VERY_LOW` 0-25, `LOW` 26-50, `GOOD` 51-75, `VERY_GOOD` 76-100.
- Factores con `match` `true` / `false` / `null` (`null` = "no aplica" o dato del candidato ausente).
- Perfil incompleto **no bloquea**; los factores ausentes **contribuyen 0 sin renormalizar**.
- `matchedSkills` / `missingSkills` normalizados (lowercase/trim/dedupe) y **ordenados alfabéticamente**.
- `explanation` legible; menciona completar el perfil cuando faltan datos del candidato.

## 7. Arquitectura técnica

- Módulo nuevo `apps/api/src/match/`:
  - `match.scoring.ts`: lógica pura (`calculateJobMatch`, `getMatchLevel`).
  - `match.types.ts`: DTOs (`JobMatchDto`, `ProfileJobMatchDto`, `ProfileMatchesResponseDto`); reutiliza `JobPublicDto`.
  - `match.schemas.ts`: validación Zod (`matchJobParamSchema`, `profileMatchesQuerySchema`).
  - `match.service.ts`: `getJobMatchForUser`, `getTopMatchesForUser`.
  - `match.router.ts`: rutas, `requireAuth`, errores normalizados.
- Montaje en `app.ts` con `app.use("/api", matchRouter)` (rutas completas, sin modificar los routers de Jobs ni Profile), antes de `notFoundMiddleware`.
- Reutilización de `getOrCreateCandidateProfile` (skills + preferencias), `getActiveJobById` (404 semántico) y `serializeJob` / `JobPublicDto`.

## 8. Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| docs/sprints/sprint-05-match-basic-agent-brief.md | doc (nuevo) | Brief del sprint |
| docs/specs/features/match-basic.md | doc (modificado) | Spec alineada en SDD Review |
| docs/sprints/sprint-05-match-basic-tdd-plan.md | doc (nuevo) | Plan de tests |
| apps/api/src/match/match.scoring.test.ts | test (nuevo) | RED unit de scoring |
| apps/api/src/match/match.jobs.integration.test.ts | test (nuevo) | RED integración `/jobs/:id/match` |
| apps/api/src/match/match.profile.integration.test.ts | test (nuevo) | RED integración `/profile/me/matches` |
| apps/api/src/match/match.scoring.ts | código (nuevo) | Scoring puro |
| apps/api/src/match/match.types.ts | código (nuevo) | DTOs del contrato |
| apps/api/src/match/match.schemas.ts | código (nuevo) | Validación Zod |
| apps/api/src/match/match.service.ts | código (nuevo) | Servicio de match |
| apps/api/src/match/match.router.ts | código (nuevo) | Router de match |
| apps/api/src/app.ts | código (modificado) | Montaje de `matchRouter` |
| docs/sprints/sprint-05-match-basic-final-report.md | doc (nuevo) | Este informe |

## 9. Tests y verificaciones

- Tests RED creados: unit de scoring (26), integración jobs match (9), integración profile matches (15).
- GREEN scoring (`feat(match): implement pure match scoring`, `49d9cfa`).
- GREEN endpoints (`feat(match): implement match endpoints`, `87f8f8d`).
- `pnpm --filter @jobit/api test`: **263 passed (263)**, 29/29 archivos.
- `pnpm --filter @jobit/api typecheck`: **PASS**.
- `pnpm --filter @jobit/api build`: **PASS**.
- `git diff --check`: **PASS**.
- `git status --short`: vacío al cierre técnico.
- `lint`: no configurado en `@jobit/api` (deuda preexistente; el global `pnpm -r --if-present lint` lo omite).

## 10. Seguridad y privacidad

- `requireAuth` en ambas rutas.
- `userId` exclusivamente desde `req.auth.userId`.
- `userId` de cliente ignorado / no aceptado (`.strip()` en query; solo `id` en params).
- Validación server-side de params (`:id`) y query (`limit`).
- Aislamiento por usuario (cubierto por tests A/B y guard de spoof `?userId=`).
- Errores normalizados `{ error: { code, message } }`.
- `JobPublicDto` para jobs embebidos; sin `externalId` ni `ingestedAt`.
- Sin datos sensibles; sin llamadas externas.

## 11. Límites éticos y de producto

- Candidate-first.
- Orientativo (no decisión de contratación).
- No evaluación automatizada de personas.
- No ranking para recruiters / no match inverso.
- Sin IA/ML/embeddings/LLM.
- Score explicable, con razones visibles por factor.

## 12. Decisiones técnicas

- **No requiere ADR nueva** (ADR-0007 cubre rutas; ADR-0008 cubre modelo; sin persistencia).
- **Sin persistencia** (cálculo en tiempo de petición).
- **Módulo `match` propio** con lógica pura desacoplada.
- **Router único montado en `/api`** con rutas completas (no toca Jobs ni Profile).
- **Saved Jobs fuera del algoritmo** (intención ≠ afinidad).
- **`Job.tags` como fuente canónica de skills** de la oferta; `Job.requirements` texto libre no obligatorio.
- **Contrato fuera del algoritmo MVP** (aunque exista `contractTypes`/`contractType`).

## 13. Problemas encontrados

- Sin problemas bloqueantes.
- Nota: `lint` no configurado en el API (deuda preexistente).
- Caveat documentado: ofertas **remotas** sin preferencia de ubicación topan alrededor de **90** (el factor ubicación queda "no aplica" y contribuye 0, sin renormalizar). Comportamiento intencional y recogido en la spec.
- Trazabilidad histórica: el informe final del Sprint 03.6 sigue ausente como archivo (ajeno a M05).

## 14. Estado final

- Rama `feat/sprint-05-match-basic`.
- 8 commits de sprint antes de este informe (`37be9cc` … `87f8f8d`).
- Working tree limpio antes de crear este informe.
- Backend **M05 implementado** y verificado (263/263, typecheck, build, auditoría PASS).
- Pendientes MVP: **M06 Dashboard candidato**, **frontend**, **deploy dev/staging** y CI/CD.

## 15. Recomendación para el orquestador

1. Commitear este informe final.
2. Ejecutar la actualización documental global (README + `00-mvp-scope.md`: M05 implementado, endpoints de match).
3. Pasar el PR checklist.
4. Abrir PR `feat/sprint-05-match-basic → dev`.
5. Tras el merge (cuando `mergedAt != null`), ejecutar la verificación post-merge y actualizar el estado del proyecto.

## 16. Prompt sugerido para continuar

> Fase: Actualización documental global tras Sprint 05. Objetivo: actualizar `README.md` y `docs/specs/00-mvp-scope.md` para marcar **M05 Match básico implementado** y documentar los endpoints `GET /api/jobs/:id/match` y `GET /api/profile/me/matches`, manteniendo **M06 Dashboard, frontend y deploy como pendientes**. Restricciones: no tocar código/tests/Prisma; no documentar funcionalidades inexistentes; sin push/merge sin autorización; sin Co-Authored-By.
