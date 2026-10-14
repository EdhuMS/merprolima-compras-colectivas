# Merprolima compras colectivas

MVP académico APF2, Grupo 8. Entrega 14/10/2026.

**Demo desplegada en Vercel:** [Abrir Merprolima compras colectivas](https://merprolima-compras-colectivas.vercel.app/).

Vista pública con resultados agregados de ocho entrevistas reales y piloto autenticado conectado a Supabase. Registrar necesidades, agrupar cantidades compatibles, comparar costo total y confirmar participación no acredita una compra o entrevista realizada.

## Ejecutar y verificar

npm install
npm run dev
npm test
npm run build

## Arquitectura

React, TypeScript, Vite, Tailwind, componentes shadcn/Radix, React Hook Form, Zod y TanStack Query. Separación de dominio, contratos/casos de aplicación, repositorios e interfaz por funcionalidad. Cliente Supabase compartido en infraestructura. FastAPI/ML reservado para APF3.

## Supabase

Proyecto ctvfzxhodqdeiqiyokfa. El modo piloto exige una cuenta de Supabase Auth y una membresía activa con puesto y rol. El catálogo y cotizaciones los administra el coordinador. No se otorgan roles desde el navegador. Los fixtures de la demo se retiraron. field_interviews conserva ocho declaraciones reales con acceso restringido al coordinador.

Variables publicables: VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY, configuradas en Vercel. Nunca utilizar service_role o contraseña de base de datos en el cliente.

## Documentación

- docs/definicion-apf2.md y docs/contrato-datos.md: definición y contrato implementado actualizado.
- docs/actualizacion-evidencia-real.md: estado vigente y alcance de las declaraciones. Los documentos de simulación se conservan únicamente como historial.
- docs/arquitectura-piloto.md: capas, permisos y habilitación de cuentas.
- docs/validacion-supabase-vercel.md: verificación de base de datos e interfaz.

## Estado operativo

Las migraciones están aplicadas y los permisos probados con actores ficticios dentro de una transacción revertida. Existe una cuenta coordinadora activa. Hay ocho declaraciones de campo reales en un módulo separado; aún no hay necesidades operativas precisadas, cotizaciones ni participaciones reales. Crear las cuentas piloto en Supabase Auth y asignar membresía antes de registrar datos de campo. Sesión real coordinadora, alta de catálogo y persistencia verificadas desde navegador. Pruebas de flujo como testers en entorno separado; no pruebas con comerciantes.

## Vercel

Proyecto merprolima-compras-colectivas de edhumss-projects vinculado mediante CLI. Publicación en producción con vercel deploy --prod. La versión actual sustituye la demostración ficticia.

## Cierre del 13/10/2026

20 pruebas pasaron. Cotizaciones con tipo de evidencia y gastos null, fecha estimada del proveedor y exportación por periodo/analítica disponibles. Historial de necesidades desde la nueva migración. Ver docs/estado-mvp.md, docs/tablero-kanban.md, docs/validacion-cierre-apf2.md y docs/privacidad-piloto.md.

## Evaluación del flujo

Pruebas de testers abre un entorno local claramente rotulado. Cantidades, mínimo y fechas son casos técnicos; usa precios publicados con fuente. No registra esos casos en Supabase ni los convierte en datos de campo. Ver docs/fuentes-mayoristas.md y docs/pruebas-testers-apf2.md.
