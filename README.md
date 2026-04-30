# JobIT-platform

JobIT es una plataforma fullstack modular de empleo tecnologico. Su objetivo es ayudar a profesionales tech a gestionar mejor su busqueda laboral, preparar su perfil y conectar con oportunidades relevantes.

El repositorio se encuentra en fase documental inicial dentro del Pre-Sprint 00A. En esta etapa no se implementa frontend, backend, base de datos, Docker, autenticacion, CI/CD ni ninguna configuracion tecnica.

## Vision modular

JobIT se plantea como una plataforma evolutiva con modulos separados por responsabilidad:

- Experiencia de candidatos.
- Gestion de perfil profesional.
- Busqueda y seguimiento de ofertas.
- Preparacion de candidaturas.
- Futuras herramientas para recruiters y empresas.
- Futuras capacidades de analitica e inteligencia asistida.

La primera version se limita a validar el nucleo candidate-first antes de ampliar el alcance.

## Alcance MVP

El MVP inicial sera candidate-first. Debe centrarse en resolver necesidades reales de candidatos tech sin abrir todavia funcionalidades avanzadas.

Alcance previsto del MVP:

- Registro conceptual de candidatos y perfil profesional.
- Gestion basica de informacion laboral, skills y preferencias.
- Exploracion o gestion inicial de oportunidades.
- Seguimiento simple del proceso de candidatura.
- Base funcional preparada para crecer por modulos.

Todo el alcance funcional debera definirse mediante especificaciones antes de implementarse.

## Fuera de alcance MVP

Queda fuera del MVP inicial:

- Frontend, backend, base de datos o infraestructura durante el Pre-Sprint 00A.
- Modulo recruiter completo.
- IA avanzada o automatizaciones complejas.
- Monetizacion.
- Comunidad real o red social.
- Aplicacion movil.
- Integraciones externas no imprescindibles.
- CI/CD, despliegue, Docker o configuracion de produccion.

## Stack previsto

El stack definitivo se decidira en sprints tecnicos posteriores. Como orientacion inicial, el proyecto podria evolucionar hacia:

- Frontend web con TypeScript y un framework moderno.
- Backend modular con TypeScript.
- Base de datos relacional.
- Autenticacion, CI/CD, Docker y despliegue cuando existan especificaciones aprobadas.

Nada de este stack esta implementado todavia en el repositorio.

## Estado actual del repositorio

Estado: fase documental inicial.

El objetivo actual es crear una base clara para alinear producto, alcance, metodologia y trabajo con agentes IA antes de escribir codigo.

## Estructura documental inicial

```text
.
├── AGENTS.md
├── README.md
└── docs
    ├── product
    │   └── 00-product-brief.md
    └── sprints
        └── pre-sprint-00A-documentation.md
```

## Flujo de trabajo Git

- No trabajar directamente en `main` ni en `dev`.
- Crear ramas cortas y descriptivas para cada bloque de trabajo.
- Mantener cambios pequenos, revisables y reversibles.
- Separar cambios documentales de cambios de codigo.
- Confirmar rama activa y estado del working tree antes de modificar.

Rama usada para esta base documental:

```text
docs/pre-sprint-00a-docs-init
```

## Metodologia SDD

JobIT seguira una metodologia SDD, Specification-Driven Development.

Reglas base:

- Primero se documenta el objetivo.
- Despues se define alcance, fuera de alcance y criterios de aceptacion.
- Solo se implementa cuando existe una especificacion aprobada.
- Cada sprint debe cerrar con evidencias verificables.

## Uso de agentes IA

Los agentes IA pueden ayudar a documentar, analizar, proponer y ejecutar tareas controladas. Deben respetar siempre el alcance aprobado, trabajar con cambios reversibles y entregar un resumen final.

Las reglas operativas para agentes estan en [AGENTS.md](AGENTS.md).

## Siguiente paso

El siguiente paso recomendado es abrir un Pre-Sprint 00B para definir la arquitectura inicial y las primeras especificaciones funcionales del MVP candidate-first, sin implementar todavia codigo hasta que el alcance este aprobado.
