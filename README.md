# Merprolima compras colectivas

APF2 de Innovación y Transformación Digital, Grupo 8. Entrega: 14/10/2026.

Estado al 12/10/2026: definición previa al desarrollo. No existe todavía un MVP implementado ni desplegado en este repositorio.

Caso: puestos de abarrotes de Merprolima. La delimitación a un mercado o cooperativa responde a la indicación oral del docente comunicada por el equipo. Se conserva el problema de coordinación de abastecimiento del APF1; sus datos de la Bodega Mini Todo Leoncito son antecedentes y no evidencia de Merprolima.

## Documentación

- [Definición del APF2](docs/definicion-apf2.md): problema, objetivo, metodología, alcance, backlog, aceptación y preparación del informe.
- [Contrato de datos](docs/contrato-datos.md): entidades, reglas, procedencia y preparación de APF3.
- [Control de evidencia](docs/control-evidencia.md): datos pendientes y registro de campo.

## Decisiones técnicas acordadas

React, TypeScript, Vite, Tailwind con componentes, shadcn/ui, React Hook Form, Zod, TanStack Query y Supabase. Arquitectura modular por funcionalidades con separación de interfaz, dominio y acceso a datos. FastAPI se pospone hasta que APF3 necesite ML.

El prototipo HTML anterior fue descartado como base visual profesional. No se incluye código de aplicación, dependencias instaladas, migraciones ni infraestructura desplegada.

## Integridad de los datos

Los registros reales requieren fuente y autorización de uso académico. Los simulados deben identificarse y mantenerse en un entorno de demostración separado. Ninguna simulación acredita entrevistas, compras, adopción o ahorro observado. No publicar datos personales, cotizaciones identificables sin permiso ni credenciales en el repositorio.
