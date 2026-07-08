# Spec — Candidate E2E smoke

## Objetivo

Proteger con smoke E2E el flujo candidato autenticado real tras los Sprints 17C y 17D. No se
crea ninguna feature nueva: se blinda lo existente con pruebas de regresión de extremo a
extremo (navegador real contra web + API + base de datos local), de forma incremental y sin
flakiness.

## Usuario afectado

Candidato (único rol activo del MVP). Indirectamente, el operador/desarrollador: el smoke
detecta regresiones del viaje completo antes de mergear cambios futuros (17E, nuevas fuentes
de empleo, recruiter).

## Contexto

- El flujo candidato está completo y pulido: Dashboard con datos reales (17B/17C), estados de
  carga/error/vacío y feedback accesible (17D).
- Tests actuales: Web con Vitest + RTL (291 tests, nivel página con APIs mockeadas); API con
  Vitest (integración por módulos). Ningún test cubre el viaje completo web ↔ API real.
- No existe Playwright ni infraestructura E2E. El operador aprobó la Opción A: añadir
  `@playwright/test` como devDependency de `apps/web` en la fase 18.1 (no en 18.0).
- Stack local esperado: web en `http://localhost:3000`, API en `http://localhost:4000`,
  PostgreSQL con seed local de ofertas.

## Flujo principal

Cubrir de forma incremental:

1. Landing/login/register público (sin sesión).
2. Registro de usuario E2E con email único.
3. Login.
4. Dashboard.
5. Profile/CV: guardar datos mínimos.
6. Portfolio settings: publicar.
7. Portfolio público `/u/[slug]`.
8. Jobs: filtrar.
9. Detalle de oferta.
10. Guardar oferta.
11. Guardadas: quitar oferta.
12. Match.
13. Guardar desde Match.

## Modelo de datos

No se crea modelo nuevo ni se modifica el existente.

El test usará:

- usuario creado por UI (flujo de registro real);
- datos existentes del seed local para ofertas (`apps/api/prisma/seed.ts`, sin tocarlo);
- perfil/CV creado durante el propio test.

## Endpoints implicados

Solo consumo funcional a través de la UI; no se cambia el contrato ni se inventan endpoints:

- Auth: register, login (y logout si el journey lo ejercita).
- Dashboard: summary del candidato.
- Profile/CV: lectura y guardado de perfil, skills, experiencia/formación mínimas.
- Portfolio: settings, publicar/despublicar, vista pública por slug.
- Jobs: listado con filtros y detalle.
- Saved jobs: guardar/quitar y listado.
- Match: listado de matches y guardar desde match.

## Pantallas implicadas

- `/` (landing pública), `/login`, `/register`.
- `/dashboard`.
- `/profile`, `/profile/portfolio`, `/profile/portfolio/settings`.
- `/u/[slug]` (portfolio público) — incluido el caso slug inexistente.
- `/jobs`, `/jobs/[id]`, `/saved-jobs`, `/match`.

## Reglas de negocio

Las ya existentes; el smoke las verifica, no las cambia:

- Rutas privadas requieren sesión; sin sesión se redirige/deniega.
- Solo ofertas visibles (ACTIVE, no expiradas) aparecen en listado/match.
- Guardar/quitar oferta se refleja en Guardadas y en el estado del botón.
- Portfolio público solo accesible cuando está publicado; despublicado → 404.
- El registro exige email único; el flujo E2E lo garantiza por construcción.

## Validaciones

- Formularios de login/register: errores visibles ante datos inválidos (ya cubiertos en RTL;
  el smoke solo verifica el camino feliz + un caso de error básico de login).
- El smoke valida por texto/rol accesible visible al usuario (headings, botones, `role`),
  no por selectores frágiles de implementación.

## Errores y estados esperados

- `/u/slug-inexistente` → 404.
- Login con credenciales incorrectas → mensaje de error visible, sin sesión.
- Estados vacíos: Guardadas sin ofertas guardadas muestra empty state con CTA.
- No se prueban en E2E los estados de error de red/retry (ya cubiertos en RTL con mocks).

## Estrategia de autenticación E2E

Restricción de diseño (ADR-0006): la sesión vive **solo en memoria React**. No hay
localStorage, no hay refresh persistente utilizable desde JS, y una recarga pierde la sesión.

Por tanto:

- Cada journey E2E inicia con registro/login **por UI**.
- Después del login, navegar exclusivamente por clicks/enlaces client-side (sidebar, cards,
  botones).
- Evitar `page.goto()` directo a rutas privadas a mitad del flujo.
- No recargar página durante el journey autenticado, salvo test explícito de pérdida de
  sesión (fuera de los smoke mínimos).
- No se implementa persistencia de sesión ni endpoint de refresh (fuera de alcance).

## Datos de prueba

- Email único por ejecución: `e2e+<timestamp>@jobit.local`.
- Password estable para test local (sin secretos reales; valor fijo de test).
- Skills mínimas creadas en el test para que Match tenga señal (alineadas con los tags del
  seed, p. ej. React/TypeScript/Node.js).
- Slug de portfolio único derivado del usuario o del flujo existente de publicación.
- Ofertas: las del seed local. El smoke no depende de ingesta externa (Jooble/Greenhouse).

## Criterios de aceptación

- [ ] Los 4 specs E2E mínimos pasan en local contra el stack seedeado.
- [ ] El smoke es estable: 3 ejecuciones consecutivas en verde sin flaky.
- [ ] Ningún journey usa `page.goto()` a rutas privadas tras login ni recarga la página.
- [ ] Cada ejecución crea su propio usuario (email único); no depende de usuarios previos.
- [ ] Las suites RTL/API existentes siguen en verde; contrato API intacto.
- [ ] Solo Chromium, `workers: 1`, sin screenshots ni regresión visual.

## Tests mínimos

Cuatro specs Playwright (fases 18.1–18.4):

1. `public-smoke.spec.ts` — sin auth:
   - landing renderiza;
   - login renderiza (y error con credenciales inválidas);
   - register renderiza;
   - portfolio inexistente `/u/<slug-falso>` → 404.
2. `auth-dashboard.spec.ts`:
   - registro con email único;
   - login;
   - dashboard visible con datos del usuario.
3. `jobs-saved-match.spec.ts`:
   - login → jobs → aplicar filtro → detalle de oferta → guardar;
   - guardadas: la oferta aparece → quitarla → empty/actualización;
   - match: listado visible → guardar desde match.
4. `profile-portfolio.spec.ts`:
   - login → editar CV mínimo (skills) → guardar;
   - publicar portfolio → visitar `/u/[slug]` público → despublicar.

## Fuera de alcance

- CI/GitHub Actions.
- Multi-browser (solo Chromium).
- Mobile/responsive testing.
- Screenshots/regresión visual.
- Performance/Lighthouse.
- Backend, Prisma, seed (`apps/api/**` intacto).
- Auth refresh/persistencia de sesión.
- Nuevas features de producto.
- Deploy.
