# Informe final — Sprint 17E Profile/Portfolio visual cleanup

## 1. Sprint o tarea

Sprint 17E — Profile/Portfolio visual cleanup. Rama
`feat/sprint-17e-profile-portfolio-visual-cleanup` (creada desde `dev` en `8040c5c`,
post-Sprint 20). Cierre de la deuda visual documentada al final del Sprint 17D.

## 2. Objetivo inicial

Cerrar la deuda visual del Sprint 17D: migrar los hex hardcodeados restantes de
Profile/Portfolio a los tokens de marca `jobit-*`, manteniendo **equivalencia visual
exacta** (mismos valores, sin rediseño) y sin cambiar ningún comportamiento funcional.

## 3. Contexto de partida

- El informe final del Sprint 17D dejó cuantificada la deuda: **53 líneas / 77 apariciones
  de hex en 12 archivos** de `features/profile` (verificada intacta en la auditoría 17E.0).
- El **94% mapeaba 1:1 a tokens ya definidos** en `globals.css` (Sprint 17D).
- Un único color carecía de token: `#b9d3f2` (ring del avatar fallback).
- Los fills del QR (`#ffffff`/`#000000`) debían conservarse literales por ser contraste
  funcional de escaneo, no color de marca.
- Red de seguridad: 291 tests RTL y ningún test asserta hex (verificado en 17E.0).

## 4. Trabajo realizado

- **17E.0 — Auditoría**: deuda re-cuantificada, mapeo color→token, detección del color sin
  token, decisión de excepción QR y plan por fases.
- **17E.1 — Token + secciones CV**: `--color-jobit-brand-ring` añadido y las 6 secciones
  del CV migradas (44 usos de token).
- **17E.2 — Preview/completion/print**: 4 componentes migrados (20 apariciones), incluido
  el gradiente de cabecera del preview y el avatar fallback del print CV (primer consumidor
  del token nuevo).
- **17E.3 — Portfolio público + QR**: `public-portfolio-cv.tsx` migrado (9 apariciones) y
  excepción del QR documentada con comentario en código.
- **17E.4 — Verificación final + este informe**: grep global limpio, suite completa +
  build en verde.

## 5. Archivos modificados

- **Token/global styles**: `apps/web/src/app/globals.css` (+1 línea).
- **Secciones CV (6)**: `profile-skills-section.tsx`, `profile-projects-section.tsx`,
  `profile-experience-section.tsx`, `profile-education-section.tsx`,
  `profile-preferences-section.tsx`, `profile-links-section.tsx`.
- **Preview/completion/print (4)**: `profile-preview.tsx`, `profile-completion-card.tsx`,
  `profile-print-actions.tsx`, `profile-print-cv.tsx`.
- **Portfolio público/QR (2)**: `public-portfolio-cv.tsx`,
  `portfolio-qr-card.tsx` (solo comentario justificativo, cero cambios de código).
- **Informe final**: `docs/sprints/sprint-17e-profile-portfolio-visual-cleanup-final-report.md`.

Total código: 13 archivos, +53/−49 (solo clases de color y un comentario).

## 6. Token añadido

`--color-jobit-brand-ring: #b9d3f2;` en el bloque `@theme` de `globals.css`, agrupado con
la familia `jobit-brand-*`. Justificación: preservar la equivalencia visual exacta del ring
del avatar fallback (print CV y portfolio público); usar el token existente
`jobit-brand-border` (#c8e6ff) habría cambiado el aspecto.

## 7. Migración de hex a tokens

Mapeo aplicado (patrón mecánico `-[#hex]` → `-token`, que preserva prefijos, modificadores
`hover:`/`focus:`/`print:`, gradientes `from-`/`to-` y sufijos de opacidad `/40`):

| Hex | Token | Apariciones migradas |
|---|---|---|
| `#006591` | `jobit-brand` | 55 |
| `#004c6e` | `jobit-brand-dark` | 13 |
| `#dce9ff` | `jobit-brand-muted` | 2 |
| `#b9d3f2` | `jobit-brand-ring` | 2 |
| `#006c49` | `jobit-green` | 1 |

73/77 apariciones migradas; las 4 restantes son la excepción QR (abajo). Cada fase revisó
su diff programáticamente: cero líneas modificadas sin token (sin cambios de JSX, props,
handlers, textos ni clases no relacionadas).

## 8. Excepción QR

`portfolio-qr-card.tsx` conserva `#ffffff` (fondo) y `#000000` (módulos) en el SVG del QR
— tanto en el render como en el SVG de descarga. Motivo: son **contraste funcional de
escaneo**, no colores de marca; tokenizarlos acoplaría la legibilidad del QR a futuros
cambios de branding. Comentario justificativo añadido en el código junto a
`buildSvgString` (cubre también `QrSvg`).

## 9. Tests y verificaciones

Ejecutadas el 2026-07-10 en el clon canónico, rama del sprint:

| Verificación | Resultado |
|---|---|
| `pnpm --filter @jobit/web typecheck` | ✅ exit 0 |
| `pnpm --filter @jobit/web test` | ✅ **291/291** (21 archivos) |
| `pnpm --filter @jobit/web lint` | ✅ exit 0 |
| `pnpm --filter @jobit/web build` | ✅ (protocolo dev-server respetado; relanzado y verificado) |
| Grep final de hex de marca en `features/profile` | ✅ **cero** |
| Hex restantes | ✅ solo `#ffffff`/`#000000` en `portfolio-qr-card.tsx`, comentados |
| Token nuevo en `globals.css` | ✅ presente exactamente 1 vez |
| Tokens usados vs definidos | ✅ 8/8 coinciden; sin tokens inventados |
| `git diff --check` | ✅ limpio |
| `git status --short` | ✅ 13 archivos de código + este informe |

Suites API y E2E no ejecutadas por diseño: sin cambios de lógica, rutas, datos ni
contratos (el E2E manual queda disponible como red extra opcional).

## 10. Seguridad y datos sensibles

Sin `.env`, tokens, secretos, auth/session ni backend tocados. La visibilidad de datos del
portfolio público no cambia (solo clases de color con valores idénticos). Ningún dato
sensible impreso en logs ni en este informe.

## 11. Decisiones técnicas

- **Tokenización incremental por fases** con sustitución mecánica de patrón y revisión de
  diff programática (líneas cambiadas deben contener token).
- **Sin helper compartido** para la constante de inputs duplicada: tokenización in situ
  (extraerla sería refactor estructural, fuera de un sprint visual).
- **QR literal** (excepción documentada en código).
- **Equivalencia visual** como criterio duro: ningún valor de color cambió, solo su forma
  de escritura.
- **Sin rediseño**: la variación deliberada de jerarquía (`border-slate-100/200`, escala de
  muted) se dejó intacta.

## 12. Fuera de alcance respetado

- ✅ Sin backend, Prisma ni contrato API (`types/api.ts` intacto).
- ✅ Sin Dashboard, Jobs, Saved Jobs ni Match.
- ✅ Sin Docker/deploy, workflows, `.env*`, `package.json` ni `pnpm-lock.yaml`.
- ✅ Sin rutas nuevas ni features nuevas; sin cambios de copy de producto.
- ✅ Sin commit/push/PR (pendientes de autorización).

## 13. Riesgos o deuda pendiente

- **Riesgo bajo**: cambio 1:1 de literales con valores idénticos; ningún test asserta hex.
- Revisión visual manual en navegador opcional si el operador quiere confirmación extra.
- E2E manual (`JobIT E2E (manual)`) disponible como red adicional si se desea.
- **No quedan hex de marca pendientes en `features/profile`**: la deuda del Sprint 17D
  queda cerrada. Deuda menor opcional anotada (no bloqueante): la constante de inputs
  duplicada en 6 secciones podría extraerse a un helper en algún sprint de refactor futuro.

## 14. Estado final

Sprint 17E completo en working tree y verificado: deuda visual cerrada (73/77 migradas +
4 en excepción justificada), suite web y build en verde, diff limpio y acotado.
**Estado: PASS pending PR review.**

## 15. Recomendación para el orquestador

1. Autorizar el **cierre Git + PR** del Sprint 17E (commit único, push y PR hacia `dev`
   conforme a `docs/agents/git-pr-skill.md`; pasará los required checks de `JobIT CI`).
2. **No ampliar 17E**: la deuda objetivo está cerrada; cualquier refactor extra (helper de
   inputs) sería sprint aparte.
3. Tras el merge: volver al **roadmap de producto** como siguiente hito; el deploy real
   (20.6) sigue pausado a decisión del Director.

## 16. Prompt sugerido para continuar

Prompt breve para el cierre: **"Sprint 17E — Cierre Git + PR"** con: confirmación de rama y
de los 14 archivos esperados (13 de código + informe); stage de todos; commit
`style(sprint-17e): migrate profile hex colors to jobit tokens`; verificación de mensaje
sin Co-Authored-By; push de la rama; PR hacia `dev` titulada
`style(sprint-17e): migrate profile hex colors to jobit tokens` con resumen breve en
español (deuda 17D cerrada, mapeo de tokens, excepción QR, verificaciones); esperar los
required checks; no mergear por CLI.
