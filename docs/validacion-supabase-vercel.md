# Verificación de Supabase y Vercel

Proyecto Supabase ctvfzxhodqdeiqiyokfa. Migraciones pilot_workspace y harden_access aplicadas.

Pruebas transaccionales de base de datos pasaron: cuenta sin puesto denegada; comprador no administra catálogo; necesidades propias y agregados, sin identidad del otro puesto; membresías visibles solo propias; reparto proporcional correcto; confirmación repetida no duplica; retiro de necesidad ajena denegado; firma antigua rechazada; volumen inferior al mínimo bloqueado; anon sin permiso de RPC y sin escritura directa. Todos los registros de prueba se revirtieron.

Asesor de seguridad Supabase: sin avisos después de revocar permisos innecesarios en el evento automático de RLS y definir denegación explícita de acceso directo.

Doce pruebas anteriores de dominio/demo pasaron después de integrar el piloto. Compilación TypeScript/Vite correcta. No hay usuarios reales todavía; prueba de sesión real desde navegador pendiente de habilitar cuenta piloto. No se ha realizado validación con comerciante.

Actualización de integración: 14 pruebas automatizadas de dominio y contratos pasaron. Interfaz local: entrada al piloto muestra acceso por cuenta; formulario vacío rechaza correo y contraseña inválidos; volver a demo y abrir necesidad funciona. Confirmada ausencia de cuentas y registros de prueba después del rollback. Despliegue de producción pendiente de verificar al momento de este registro.

Producción verificada: https://merprolima-compras-colectivas.vercel.app responde 200 sin sesión. Supabase Auth responde 200 y la RPC sin autenticación responde 401. La primera compilación remota omitía el cliente por una exclusión demasiado amplia; se corrigió y el segundo despliegue quedó READY. El formulario de acceso a piloto y regreso a demo se revisaron en navegador.

Habilitación de cuentas: nuevas migraciones provision_pilot_accounts y deny_direct_account_grants. Se autorizó un correo coordinador en una tabla privada, sin publicarlo en la fuente ni usar metadata editable. La cuenta recibirá rol al crearse/verificarse. Prueba transaccional de verificación y consumo de autorización pasó y fue revertida. La fila COORD-G8 identifica al coordinador del equipo, no acredita un comerciante entrevistado. Cuenta pendiente de creación manual de contraseña por el usuario.
