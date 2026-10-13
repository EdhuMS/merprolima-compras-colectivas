# Validación técnica del 13/10/2026

20 pruebas automatizadas y compilación satisfactorias. SQL verificó cuentas temporales asignadas y sin puesto, permisos buyer/coordinator, privacidad de otros puestos, reparto exacto, UUID idempotente, confirmación repetida, versión obsoleta, mínimo insuficiente, gastos null, delivery_estimate, evidence_type, exportación analítica por rol e historial. La transacción se revirtió. Ningún test es evidencia comercial.

Interfaz publicada: editar cotización simulada con transporte vacío bloqueó la confirmación. Reabrir el formulario conservó el vacío y la fecha 16/10, distinta de la reposición deseada 15/10. Registrar S/ 24 permitió comparar S/ 555 frente a S/ 546 y confirmar una participación simulada. JSON descargado: schema_version 2, periodo 01–31/10, tres productos y sin texto libre de fuente, proveedor o pago.

Capturas y JSON en output/apf2/evidencias del proyecto académico. El periodo invertido tiene prueba de dominio; no se afirma una prueba de interfaz porque no se obtuvo un alerta observable.

Despliegue final READY: dpl_7NymjAx6uRGMn4L5ziz792ZuuK4x. El anterior dpl_CXTDqmJ1ec3SKfVmqDpyoJanLgmA acredita las capturas; el final añade errores visibles en el diálogo. URL: https://merprolima-compras-colectivas.vercel.app/. Base real verificada: cero necesidades, cotizaciones y participaciones; cero revisiones persistidas. Un coordinador autorizado. Asesor sin avisos de tablas/funciones; Auth advierte protección de contraseñas filtradas deshabilitada.

Límites: sesión personal de navegador pendiente; no existen dos comerciantes registrados; no se ensayó una desconexión de red controlada; no hubo prueba con comerciante ni consentimiento de campo. UUID estable e idempotencia probados, sin sustituir el ensayo de desconexión. La extracción analítica pasó mediante RPC/SQL; su interfaz con coordinador autenticado sigue pendiente.
