# Arquitectura 02: Modulos del MVP

## Enfoque

El MVP de JobIT-platform es candidate-first. Los modulos iniciales deben resolver necesidades directas del candidato antes de abrir experiencias recruiter, empresa o comunidad.

Este documento describe modulos previstos. No implementa codigo ni define contratos tecnicos finales.

## Modulos MVP

### Auth

Autenticacion y acceso de usuarios candidatos. Debe definirse con cuidado antes de implementarse, incluyendo seguridad, sesiones y recuperacion de acceso.

### Candidate Profile

Perfil principal del candidato con datos profesionales, preferencias laborales y estado general de busqueda.

### CV/Profile Tech

Representacion estructurada del CV tech del candidato, orientada a lectura clara y reutilizacion futura.

### Skills

Gestion de skills tecnicas y blandas, con posibilidad futura de niveles, categorias o evidencias.

### Experience

Experiencia profesional del candidato, incluyendo roles, empresas, fechas, responsabilidades y logros.

### Education

Formacion academica, bootcamps, certificaciones y aprendizaje relevante.

### Projects

Proyectos destacados del candidato, con tecnologias, descripcion, enlaces y resultados.

### Jobs

Ofertas u oportunidades laborales disponibles para consulta o gestion inicial.

### Saved Jobs

Ofertas guardadas por el candidato para seguimiento posterior.

### Match basico explicable

Indicador simple y explicable de afinidad entre candidato y oferta. Debe ser transparente, no avanzado y sin IA compleja en el MVP.

### Dashboard candidato

Vista inicial que resume perfil, oportunidades, candidaturas o acciones pendientes del candidato.

## Fuera del MVP

Queda fuera del MVP inicial:

- JobIT Recruit completo.
- ATS.
- IA avanzada.
- Monetizacion.
- Comunidad real.
- App movil.
- n8n.
- Automatizaciones complejas.
- Panel empresarial completo.

## Regla de alcance

Cada modulo debe tener una spec aprobada antes de implementarse. Si una funcionalidad no aporta valor directo al candidato en el MVP, debe quedar fuera o moverse a una fase futura.
