# Product Brief 00: JobIT-platform

## Resumen

JobIT es una plataforma modular de empleo tecnológico destinada a producción y
orientada primero a candidatos. Ayuda a representar el perfil profesional, descubrir
y guardar oportunidades, comprender la afinidad con una oferta y publicar un
portfolio.

La base candidate-first ya está implementada en web y API. El producto se encuentra
en hardening: mejora progresiva de experiencia, accesibilidad, seguridad de datos,
gobernanza legal y preparación operativa. Esto no equivale a afirmar que exista un
despliegue productivo ni que se hayan resuelto todas las obligaciones legales.

## Usuario prioritario

El usuario actual es un profesional tecnológico junior, mid o senior que quiere:

- mantener un perfil y CV estructurados;
- presentar un portfolio público;
- buscar ofertas por texto, ubicación y criterios laborales;
- guardar oportunidades;
- entender un match básico mediante reglas visibles;
- ver próximos pasos desde un dashboard personal.

Recruiters, empresas, comunidad y partners son actores futuros. No existe todavía una
superficie funcional completa para ellos.

## Propuesta de valor actual

JobIT concentra en una experiencia candidate-first:

- identidad y perfil profesional;
- CV tech con skills, experiencia, educación y proyectos;
- portfolio público controlado por el candidato;
- agregación de ofertas persistidas de distintas procedencias;
- guardado de ofertas y continuidad de búsqueda;
- afinidad explicable, sin modelos opacos;
- dashboard que resume estado y acciones.

Las ofertas externas se ingieren de forma backend-only y controlada. Las búsquedas del
candidato leen la base de datos de JobIT y no llaman a proveedores en tiempo real.

## Superficies implementadas

### Públicas

- Landing `/`.
- Registro e inicio de sesión.
- Portfolio publicado `/u/[slug]`.

La landing usa contenido ilustrativo sintético y no presenta datos reales de
candidatos, empresas ni proveedores. Las superficies legales públicas permanecen
bloqueadas hasta cerrar las decisiones especializadas documentadas en Sprint 24.

### Privadas

- Dashboard.
- Perfil y CV.
- Edición y configuración de portfolio.
- Listado y detalle de ofertas.
- Ofertas guardadas.
- Match explicable.

## Módulos de producto

| Módulo | Estado |
|---|---|
| JobIT Talent | Base candidate-first activa |
| JobIT CV | Perfil, CV y portfolio activos |
| JobIT Jobs | Exploración multi-fuente activa |
| JobIT Match | Match básico explicable activo |
| JobIT Recruit | Futuro; fuera del alcance actual |
| JobIT Radar | Futuro; sin contrato aprobado |
| JobIT Community | Futuro; fuera del alcance actual |
| JobIT Admin | No existe un panel administrativo completo |

El nombre histórico “MVP” se conserva en algunos archivos para mantener enlaces y
trazabilidad. El trabajo nuevo debe describir el estado del producto como base
candidate-first en hardening, no como prototipo o demo.

## Fuentes de ofertas

- `INTERNAL`: dataset controlado de desarrollo; no representa todavía publicación
  empresarial ni candidatura interna.
- `JOOBLE`: proveedor implementado con API key solo en backend.
- `GREENHOUSE`: Job Board API pública con lista pequeña de empresas curadas.
- `ADZUNA`: valor reservado en el modelo de datos; no hay proveedor ni filtro público
  implementados.

Las ofertas externas enlazan a su origen cuando existe una URL `http`/`https` válida.
JobIT no gestiona actualmente la candidatura dentro de la plataforma.

## Principios

- **Candidate-first:** el valor directo para candidatos precede a nuevas superficies.
- **Claridad y honestidad:** distinguir datos sintéticos, capacidades activas,
  preparación técnica y operación real.
- **Explicabilidad:** las decisiones visibles para el candidato usan reglas
  comprensibles; no se presentan inferencias opacas como hechos.
- **Privacidad por defecto:** minimizar exposición y no publicar datos o documentos
  sensibles sin gate explícito.
- **Modularidad:** separar dominios y ampliar solo mediante specs aprobadas.
- **SDD + TDD + auditoría:** especificar, probar, implementar, verificar y documentar
  antes de integrar.

## Límites actuales

No forman parte del producto implementado:

- módulo recruiter y panel empresarial completos;
- ATS o candidaturas internas;
- recuperación/refresh completo de sesión;
- IA avanzada, LLM, embeddings o scoring opaco;
- automatización u orquestación periódica de ingestas;
- monetización;
- comunidad o red social;
- aplicación móvil;
- despliegue real acreditado en VPS;
- declaración de cumplimiento legal.

La incorporación de usuarios o datos reales exige resolver los gates de seguridad,
privacidad, soporte y operación correspondientes.

## Estado de las entregas recientes

- **Sprint 23:** seguridad de tests y seed de base de datos.
- **Sprint 24:** documentación pública de gobernanza legal sanitizada; decisiones
  privadas y revisión especializada pendientes.
- **Sprint 25:** hardening de la landing pública, integrado en `dev`.

Los informes de sprint registran el resultado de cada entrega, pero no sustituyen la
documentación viva ni autorizan por sí mismos una ampliación de alcance.

## Evolución

La evolución debe seguir entregables pequeños y verificables. Antes de abrir nuevas
áreas de producto se priorizan:

1. cierre de gates legales y de uso de datos reales;
2. continuidad de sesión y hardening de seguridad pendiente;
3. observabilidad, operación y despliegue controlado;
4. validación del flujo candidate-first con usuarios autorizados;
5. solo después, evaluación explícita de superficies recruiter o empresariales.

Cada paso requiere spec, criterios de aceptación, tests mínimos, auditoría y
autorizaciones operativas separadas.
