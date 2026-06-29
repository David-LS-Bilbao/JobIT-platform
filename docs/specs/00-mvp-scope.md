# Spec: Alcance del MVP candidate-first

## Objetivo del MVP

Validar la experiencia del candidato tech: que pueda representar su perfil profesional, explorar ofertas relevantes, guardarlas y recibir indicaciones básicas de afinidad, con una experiencia inicial clara y sin complejidad prematura.

El MVP no intenta resolver el mercado de empleo completo. Debe ser pequeño, verificable y centrado en valor directo para candidatos.

## Usuario principal

Candidato tech (junior, mid o senior) que busca:

- Representar su perfil y experiencia de forma estructurada.
- Explorar oportunidades laborales relevantes.
- Guardar y gestionar ofertas de interés.
- Recibir orientación básica sobre su afinidad con ofertas.
- Tener un punto de entrada claro a su actividad de búsqueda.

## Módulos incluidos en el MVP

| ID | Nombre | Descripción breve |
|---|---|---|
| M01 | Auth | Registro, login, logout y protección de rutas |
| M02 | Candidate Profile + CV | Perfil profesional completo del candidato |
| M03 | Jobs | Exploración de ofertas desde datos seed/mock |
| M04 | Saved Jobs | Guardado y gestión de ofertas por candidato |
| M05 | Match básico | Indicador de afinidad explicable sin IA avanzada |
| M06 | Dashboard candidato | Vista resumen del estado y actividad del candidato |

## Estado de implementación (backend)

Marcado de estado real; no altera el alcance funcional definido en este documento.

- M01 Auth: implementado.
- M02 Candidate Profile + CV: implementado.
- M03 Jobs: implementado, con integración backend-only de Jooble (ADR-0011) y política de visibilidad pública de la API (Sprint 03.6).
- M04 Saved Jobs: implementado.
- M05 Match básico explicable: implementado (heurístico, determinista, sin IA; endpoints `GET /api/jobs/:id/match` y `GET /api/profile/me/matches`).
- M06 Dashboard candidato: implementado en backend (agregador de solo lectura `GET /api/dashboard/me`; compone Profile/CV, Saved Jobs y Match; sin persistencia nueva ni IA).

Frontend, despliegue y CI/CD siguen pendientes.

## Módulos fuera del MVP inicial

- JobIT Recruit: panel recruiter completo.
- Panel empresarial y ATS.
- IA avanzada o matching complejo.
- Monetización.
- Comunidad real o red social.
- Aplicación móvil.
- Integraciones externas masivas (scraping, APIs de empleo).
- Automatizaciones complejas o n8n.
- Administración avanzada.

## Reglas generales del MVP

- Cada módulo requiere spec aprobada antes de implementarse.
- Toda feature requiere tests mínimos definidos en la spec.
- No se implementa ningún módulo sin auditoria quality/security previa a PR.
- El candidato es el único actor del MVP. No se diseña para recruiters ni empresas.
- El match es explicable y basado en reglas simples. No usa IA avanzada ni ranking opaco.
- Los datos de ofertas provienen de seed/mock futuro en DB. No se integran APIs externas todavía.
- La seguridad es básica pero correcta: passwords hasheadas, validación server-side, rutas privadas.
- No se implementa OAuth, MFA ni recuperación de contraseña avanzada en el MVP inicial.

## Dependencias entre specs

```
auth.md
  └── candidate-profile-cv.md (requiere usuario autenticado)
       ├── jobs.md (independiente de perfil, pero depende de auth)
       │    └── saved-jobs.md (depende de jobs + auth)
       │         └── match-basic.md (depende de perfil + jobs)
       │              └── dashboard.md (consolida auth + perfil + jobs + saved + match)
```

Orden de implementación recomendado: auth → candidate-profile-cv → jobs → saved-jobs → match-basic → dashboard.

## Criterios de cierre del MVP documental

- Las 6 specs de features existen y tienen estructura homogénea.
- Cada spec define: objetivo, usuario, flujo principal, modelo de datos conceptual, endpoints, pantallas, reglas de negocio, validaciones, errores, criterios de aceptación, tests mínimos y fuera de alcance.
- La spec de auth contempla seguridad básica sin implementar.
- La spec de match-basic no usa IA avanzada.
- La spec de jobs no incluye scraping ni APIs externas.
- No se crea código, configuración técnica ni infraestructura.
- La auditoría quality/security de este sprint devuelve PASS o PASS_WITH_NOTES.

## Riesgos conocidos

- El modelo de datos conceptual puede necesitar revisión cuando se defina el stack técnico (ADR pendiente).
- La especificación de match básico puede generar debate sobre qué es "explicable" y qué no. Se asume: reglas visibles, sin modelos de ML.
- Los endpoints previstos en cada spec son orientativos. El contrato final se cerrará cuando exista un ADR de API.
- La distinción entre Candidate Profile y CV puede solaparse. Se trata como una única spec unificada.
