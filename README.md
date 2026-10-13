# Merprolima compras colectivas

MVP académico APF2, Grupo 8. Entrega 14/10/2026.

Demo pública con datos simulados y modo piloto conectado a Supabase. Registrar necesidades, agrupar cantidades compatibles, comparar costo total y confirmar participación no acredita una compra o entrevista realizada.

## Ejecutar y verificar

npm install
npm run dev
npm test
npm run build

## Arquitectura

React, TypeScript, Vite, Tailwind, componentes shadcn/Radix, React Hook Form, Zod y TanStack Query. Separación de dominio, contratos/casos de aplicación, repositorios e interfaz por funcionalidad. Cliente Supabase compartido en infraestructura. FastAPI/ML reservado para APF3.

## Supabase

Proyecto ctvfzxhodqdeiqiyokfa. El modo piloto exige una cuenta de Supabase Auth y una membresía activa con puesto y rol. El catálogo y cotizaciones los administra el coordinador. No se otorgan roles desde el navegador. La demo local no envía simulaciones a las tablas del piloto.

Variables publicables: VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY, configuradas en Vercel. Nunca utilizar service_role o contraseña de base de datos en el cliente.

## Documentación

- docs/definicion-apf2.md y docs/contrato-datos.md: definición y contrato implementado actualizado.
- docs/control-evidencia.md y docs/investigacion-simulacion.md: evidencia pendiente y supuestos públicos.
- docs/arquitectura-piloto.md: capas, permisos y habilitación de cuentas.
- docs/validacion-supabase-vercel.md: verificación de base de datos e interfaz.

## Estado operativo

Las migraciones están aplicadas y los permisos probados con actores ficticios dentro de una transacción revertida. Existe una cuenta coordinadora activa. No hay necesidades, cotizaciones ni participaciones reales al corte. Crear las cuentas piloto en Supabase Auth y asignar membresía antes de registrar datos de campo. El modo piloto no se ha probado con una sesión real desde navegador todavía.

## Vercel

Proyecto merprolima-compras-colectivas de edhumss-projects vinculado mediante CLI. Publicación en producción con vercel deploy --prod. La demo anterior de Sites sigue disponible como versión inicial.

## Cierre del 13/10/2026

20 pruebas pasaron. Cotizaciones con tipo de evidencia y gastos null, fecha estimada del proveedor y exportación por periodo/analítica disponibles. Historial de necesidades desde la nueva migración. Ver docs/estado-mvp.md, docs/tablero-kanban.md, docs/validacion-cierre-apf2.md y docs/privacidad-piloto.md.
