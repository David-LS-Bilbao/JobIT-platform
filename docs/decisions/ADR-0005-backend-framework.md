# ADR-0005: Backend framework inicial

## Estado

Aceptada.

## Contexto

ADR-0002 decidió el stack general del proyecto: Node.js + TypeScript en el backend, con Express o Fastify como opciones abiertas. La elección quedó pendiente para una spec técnica posterior.

El MVP de JobIT es candidate-first y se encuentra en fase documental. Los módulos a implementar son: Auth (M01), Candidate Profile + CV (M02), Jobs (M03), Saved Jobs (M04), Match básico (M05) y Dashboard (M06). La prioridad en este punto es reducir riesgo, moverse rápido sobre una base conocida y no sobreingenierizar antes de tener usuarios reales.

Ambas opciones, Express y Fastify, son compatibles con Node.js + TypeScript y tienen soporte activo. La decisión se toma por criterios de idoneidad para MVP, no por rendimiento máximo.

## Decisión

**Express** como framework de backend para el MVP inicial de JobIT.

La validación de entradas en los endpoints se implementará con una librería de validación de esquemas, preferiblemente **Zod**, a confirmar y documentar en el Sprint 00 técnico o Sprint 01. Express no incluye validación integrada, por lo que Zod o equivalente es necesario para cumplir los requisitos de seguridad definidos en las specs (validación obligatoria en el servidor).

No se instala ni configura nada en esta fase. Esta decisión orienta el Sprint 00 técnico.

## Consecuencias positivas

- Ecosistema amplio y maduro: abundante documentación, middleware disponible, referencias de integración con TypeScript.
- Curva de aprendizaje baja: el equipo puede avanzar sin dedicar tiempo a aprender APIs o convenciones nuevas.
- Flexibilidad explícita: Express no impone estructura, lo que permite organizar el proyecto según las necesidades del MVP sin restricciones del framework.
- Manejo de errores directo: middleware centralizado de errores bien documentado y predecible.
- Testing sencillo: integración probada con Jest + Supertest o similares.
- Compatibilidad con TypeScript: tipado mediante `@types/express`, sin necesidad de capas adicionales.
- Bajo riesgo de sobreingeniería: no introduce conceptos o plugins que deban aprenderse antes de escribir el primer endpoint.

## Riesgos

- Express no incluye validación de esquemas: se asume el uso de Zod u otra librería. Si no se implementa correctamente, la validación server-side queda incompleta, lo que contradice las specs de auth y API.
- Rendimiento: Express es más lento que Fastify en benchmarks. Esto no es relevante para el MVP con carga baja, pero puede importar en fases de crecimiento.
- Ausencia de estructura impuesta: la flexibilidad de Express puede derivar en inconsistencias si no se establecen convenciones claras de organización en el Sprint 00 técnico.
- Versión a usar: el Sprint 00 técnico deberá decidir la versión concreta de Express a instalar, priorizando una versión estable, compatible con TypeScript, middleware habitual y ecosistema de testing.

## Alternativas consideradas

### Fastify

**Por qué se evaluó:**

- Rendimiento superior a Express en benchmarks (JSON Schema + ajv integrados).
- Validación de entradas integrada mediante JSON Schema.
- Diseño orientado a TypeScript desde el inicio.
- Sistema de plugins estructurado.
- Comunidad activa y creciente.

**Por qué se descarta para el MVP:**

| Criterio | Express | Fastify |
|---|---|---|
| Simplicidad para MVP | Alta | Media (plugins, decorators) |
| Curva de aprendizaje | Baja | Media-alta |
| Ecosistema | Muy amplio | Amplio y creciente |
| Validación integrada | No (requiere Zod/joi) | Sí (JSON Schema + ajv) |
| Manejo de errores | Directo | Estructurado pero más verboso |
| Testing | Ampliamente documentado | Bien soportado |
| Encaje con TypeScript | Bueno (`@types/express`) | Muy bueno (nativo) |
| Riesgo de sobreingeniería | Bajo | Medio (plugins, hooks, schemas) |

Fastify puede reevaluarse en el futuro si aparecen necesidades reales de rendimiento, si el equipo decide adoptar validación basada en JSON Schema de forma centralizada o si un plugin específico de Fastify aporta valor concreto.

## Impacto en specs

- **Auth (M01)**: los endpoints `/auth/register`, `/auth/login`, `/auth/logout` y `/auth/me` se implementarán como rutas Express. La validación de entradas (email, contraseña) se hará con Zod u equivalente en middleware o controlador.
- **Todos los módulos**: el middleware de error centralizado de Express gestiona los formatos de error definidos en ADR-0007 (API design).
- **Rutas privadas**: el middleware de autenticación (a definir en ADR-0006) se integra como middleware Express estándar.

## Impacto en futuro Sprint 00 técnico

Al iniciar implementación, el Sprint 00 técnico deberá:

1. Instalar Express y sus tipos (`express`, `@types/express`).
2. Instalar y configurar Zod (u equivalente acordado) para validación de entradas.
3. Definir la estructura de carpetas del backend (rutas, controladores, middlewares, servicios).
4. Establecer las convenciones de organización que Express no impone por defecto.
5. Configurar el middleware centralizado de errores siguiendo el formato de ADR-0007.
6. Configurar TypeScript para el proyecto backend (tsconfig, paths, strict mode).

Nada de lo anterior se implementa en esta fase documental.
