# Estado del MVP

Primera implementación de demostración: React/TypeScript/Vite, Tailwind, componentes al estilo shadcn con Radix, React Hook Form, Zod y TanStack Query. Dominio, datos e interfaz separados por funcionalidad.

Funcional en demo: crear, editar y retirar necesidad, agrupar por compatibilidad exacta, comparar costo total con asignación de centavos, confirmar/rechazar participación, invalidar confirmación al cambiar volumen/precio, editar cotización desde vista de coordinador, exportar JSON identificado como simulado y restablecer escenarios.

Persistencia: LocalStorage estructurado, en el navegador del visitante. Cambiar perfil es navegación de demostración, no autenticación ni seguridad multiusuario. Supabase no está conectado porque el proyecto aún no existe. El adaptador de lectura y SQL son preparación, no integración probada. No introducir datos reales aquí.

US01: solo perfiles de demo, autenticación/RLS pendientes. US02–US08: flujo demo implementado; acceso real, validación remota y concurrencia pendientes. US09: exportación demo JSON. US10: resumen antes de confirmar. US11: pendiente APF3. Pruebas automatizadas y QA deben consultarse en el registro de validación; no hay prueba con comerciante todavía.

Ejecutar: npm install, npm run dev; validar: npm test y npm run build. Para Supabase: crear proyecto, definir usuarios/permisos, revisar y ampliar migración borrador, probar RLS con dos cuentas, implementar repositorio real completo y habilitarlo explícitamente. Clave de servicio nunca en navegador.
