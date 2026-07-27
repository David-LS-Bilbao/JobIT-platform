# Skill neutral: Database / Prisma

## Objetivo

Guiar el diseno documental del modelo de datos de la version candidate-first; el schema de Prisma y las migraciones solo se tocan cuando la tarea y la spec lo autoricen.

## Cuando usarla

- Al definir entidades y relaciones de una feature.
- Al alinear modelos entre modulos relacionados.
- Al revisar campos sensibles o personales antes de implementar.
- Al evaluar el impacto de un cambio en datos existentes.

## Entradas necesarias

- Spec con modelo de datos requerido.
- Entidades, campos y relaciones esperadas.
- Reglas de unicidad, persistencia y permisos.
- Datos personales o sensibles involucrados.

## Archivos permitidos

- Specs en `docs/specs/`.
- Plantillas en `docs/agents/templates/`.
- Cuando la tarea y la spec lo autoricen: schema de Prisma o migraciones.

## Restricciones

- No instalar Prisma, ORM ni base de datos sin ADR aprobado.
- No crear migraciones especulativas.
- No fijar tipos de base de datos para campos sin justificacion.
- No persistir datos personales innecesarios.
- No introducir relaciones complejas antes de validar el modelo basico.

## Checklist

- [ ] Entidades listadas con campos relevantes.
- [ ] Relaciones explicitas y minimas necesarias.
- [ ] Reglas de unicidad documentadas.
- [ ] Datos personales identificados y justificados.
- [ ] Reglas de borrado o anonimizacion previstas cuando aplica.
- [ ] Coherencia con specs relacionadas.

## Formato esperado de salida

1. Entidades propuestas.
2. Campos y tipos esperados.
3. Relaciones entre entidades.
4. Reglas de unicidad y validacion.
5. Riesgos o dudas, especialmente sobre datos personales.
6. Siguiente paso recomendado.

## Criterio de parada

Detener la skill cuando el modelo de datos queda documentado en la spec, los datos sensibles estan identificados y la propuesta espera revision humana antes de implementar.
