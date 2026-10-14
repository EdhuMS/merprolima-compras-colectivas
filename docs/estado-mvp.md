# Estado del MVP al 13/10/2026

Demo: https://merprolima-compras-colectivas.vercel.app/. Repositorio privado: https://github.com/EdhuMS/merprolima-compras-colectivas.

## Disponible

React, TypeScript y Vite; Tailwind, componentes Radix/shadcn, React Hook Form, Zod y TanStack Query. Funcionalidades separadas en interfaz, aplicación, dominio y datos; autenticación e infraestructura independientes. Supabase conectado y cuenta coordinadora con membresía autorizada. FastAPI y ML reservados para APF3.

- Necesidades: registrar, editar y retirar. UUID estable por apertura del formulario para reintento sin duplicar filas.
- Agrupación exacta: producto/presentación, fecha, modalidad y origen. Costo total con reparto de centavos.
- Cotización: proveedor, fuente, evidencia escrita/lista/verbal/simulada, mínimo y vigencia. Vacío significa gasto null; cero significa sin cargo confirmado. Fecha estimada del proveedor independiente de reposición.
- Participación: confirmar/rechazar sin pago ni orden. Cambios de volumen o cotización invalidan la aceptación. Errores visibles dentro del diálogo.
- Exportación por periodo: JSON v2 con origen y versiones. Personal/agregada para comprador; semanal y revisiones para coordinador mediante autorización de servidor. Sin contactos ni texto libre de pago/fuente/proveedor. Los UUID son seudónimos.
- Base: RLS, sin acceso directo a tablas de negocio, operaciones autorizadas y serialización transaccional. Historial de necesidades desde la migración del 13/10, sin reconstrucción anterior.
- 20 pruebas y compilación satisfactorias. SQL de permisos, reparto, idempotencia, evidencia, entrega, costos null, rol de exportación e historial pasó y se revirtió. Demo publicada comprobada: bloqueo con gasto desconocido, persistencia del vacío/fecha y confirmación con gastos completos. JSON descargado verificado.

## Límites

Cero necesidades, cotizaciones y participaciones reales acreditadas. Fixtures SQL revertidos; demo local por navegador. No se acreditan entrevistas, ahorro, pedidos, entrega o evaluación de utilidad.

Sesión completa del piloto desde navegador pendiente: no se usaron ni solicitaron contraseñas personales. Cuentas compradoras reales pendientes de identificar puestos y autorizaciones. Dos roles probados mediante identidades temporales SQL, sin presentar comerciantes inexistentes.

Aviso visible y política operativa preparada. Responsable/canal, autorizaciones y evaluación contractual cloud pendientes de revisión humana. Asesor sin avisos de tablas/funciones; Auth advierte protección de contraseñas filtradas deshabilitada. No se activaron planes pagados.

## Historias

US01: técnica implementada, login real de navegador pendiente. US02: UUID y persistencia probados; desconexión controlada pendiente. US03–US07 y US10: reglas comprobadas. US05 incluye evidencia y gastos null. US08 tiene fecha estimada independiente; no recepción física. US09 tiene exportación por periodo y analítica; interfaz de coordinador autenticado pendiente. US11 queda para APF3.

La revisión humana y validación con comerciante siguen pendientes aunque funcionen los controles técnicos. Ver tablero-kanban.md, validacion-cierre-apf2.md y privacidad-piloto.md.

## Estado vigente del campo

Actualización del 13/10/2026: ocho entrevistas reales incorporadas en field_interviews. La página pública presenta solo resultados agregados; el coordinador activo consulta las declaraciones codificadas. La demostración ficticia fue retirada. Cotización comparable, aclaración de producto por cantidad y prueba observada con usuario permanecen pendientes. Ver docs/actualizacion-evidencia-real.md. Despliegue READY dpl_CuhVgexH8DLHBpB49UPRzr8a9rYe. Compilación y 20 pruebas de reglas pasaron.
