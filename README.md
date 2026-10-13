# Merprolima compras colectivas

MVP académico APF2, Grupo 8. Entrega 14/10/2026.

Demo funcional con datos simulados: necesidades, agrupación compatible, cotización, comparación de costo total, confirmación y consulta persistente en el navegador. No acredita entrevistas, compras o ahorro realizado.

## Ejecutar

npm install
npm run dev

## Verificar

npm test
npm run build

## Stack

React, TypeScript, Vite, Tailwind, componentes shadcn/Radix, React Hook Form, Zod y TanStack Query. Separación modular de interfaz, dominio y datos. Supabase preparado como integración pendiente; FastAPI/ML reservado para APF3.

## Documentación

- docs/definicion-apf2.md: definición y backlog originales; consultar estado actual en estado-mvp.md.
- docs/contrato-datos.md: contrato preliminar.
- docs/control-evidencia.md: auditoría y trabajo de campo.
- docs/investigacion-simulacion.md: referencias y supuestos de escenarios.
- docs/estado-mvp.md: funciones y limitaciones.
- docs/validacion-demo.md: comprobaciones técnicas.

## Limitación actual

Los perfiles de demo no son cuentas reales. Persistencia en LocalStorage de cada visitante. Supabase no conectado. No cargar datos personales o evidencia real en la demo pública. La migración SQL es un borrador no ejecutado; roles, cotizaciones y agregados seguros requieren completar integración y probar permisos.
