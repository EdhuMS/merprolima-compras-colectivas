# Mejora de experiencia de producto — 13/10/2026

La portada y las pantallas de trabajo se centran en registro de reposición, propuestas, costos y reportes. Se retiraron avisos de simulación, referencias académicas y mensajes de infraestructura del flujo visible. La procedencia original permanece en repositorios y exportaciones; estos cambios de presentación no convierten casos de testers en entrevistas o pedidos reales.

## Navegación

- Botón para ocultar y mostrar el panel lateral en escritorio; preferencia guardada en el navegador.
- Menú móvil como diálogo accesible: fondo de cierre, Escape, foco contenido y restauración al botón de apertura.
- Al seleccionar una sección, se cierra el menú móvil y la página vuelve al inicio.
- Sesión existente abre directamente el espacio autenticado; portada disponible desde Inicio.
- Reportes agrupa exportación por periodo, precios de referencia y consulta del coordinador.

## Comprobación

Compilación y 20 pruebas de reglas aprobadas. Revisión en navegador: 320, 375, 768 y 1440 píxeles. No se encontró desbordamiento horizontal en portada, resumen, reportes y formularios revisados. Se comprobó ocultar/mostrar en escritorio, navegación móvil, cierre con Escape y clic fuera, restauración de foco y límites del formulario/propuesta dentro de la pantalla. No se modificaron esquema, membresías o permisos de Supabase.

Despliegue READY: dpl_4HbWyTaUmgqqhxHPjS6JRgzo7Arg. URL: https://merprolima-compras-colectivas.vercel.app/.

Las capturas del informe y las diapositivas anteriores corresponden al corte previo de interfaz; se conservan como evidencia histórica. Esta actualización se concentra en el producto web mientras el grupo revisa los documentos.

## Mejora de recorridos por rol — 14/10/2026

- Cliente: Resumen, Mis necesidades, Compras colectivas, Mis participaciones y Mis reportes.
- Mis participaciones conserva las decisiones propias y permite filtrar confirmadas, por revisar y sin participación. Los cambios en la propuesta exigen nueva confirmación. Las propuestas sin necesidades activas se mantienen como referencia sin botón de acción.
- Registro de necesidades: solo producto, cantidad, fecha y modalidad. La referencia se genera como APP:<identificador del pedido> al guardar; al editar se conserva la referencia existente. No se interpreta como evidencia de una entrevista.
- Coordinador: Panel de coordinación, Gestionar compras, Catálogo de productos y Reportes del mercado, además de sus pedidos y participaciones propios. El panel cuenta agrupaciones, cotizaciones sin registrar o vencidas y sacos reunidos, sin presentar los registros agregados como pedidos individuales identificados.
- La gestión y los reportes mantienen los permisos existentes del servidor. El cambio de menú no concede permisos nuevos.
- Verificación con cuentas de presentación: navegación móvil por rol, catálogo del coordinador, alta de pedido sin código manual, aviso de reconfirmación por cambio de volumen, confirmación y retiro desde Mis participaciones. Compilación y 20 pruebas existentes correctas.


## Flujo vigente: coordinación exclusiva (sustituye el rol combinado anterior)

Autorizado por el usuario para ambas cuentas de coordinación el 14/10/2026. El coordinador solo revisa necesidades recibidas, publica propuestas con cotización, administra catálogo y consulta reportes. Mis necesidades y Mis participaciones pertenecen exclusivamente al comprador. Combinar ambos papeles se reserva para APF3.

Las necesidades se agrupan como demanda y no aparecen por sí solas en Compras colectivas. La cotización registrada por coordinación constituye la propuesta publicada; una propuesta sin solicitudes sigue visible con volumen cero. No se requiere crear un pedido ficticio del coordinador.

El comprador puede sumarse sin solicitud previa: introduce la cantidad, revisa la confirmación y el servidor registra su necesidad y decisión en una transacción. Si no alcanza el mínimo o faltan gastos, queda pending; si reúne las condiciones, queda confirmed. El servidor calcula la firma después de incorporar la cantidad y valida la versión leída antes de modificar datos. La misma confirmación no duplica pedidos. El origen del registro procede del puesto autenticado.

Confirmar/retirar participación, retirar necesidad y publicar/editar propuesta tienen confirmación explícita. Tras guardar se cierran los formularios y aparece un modal de éxito. Un error conserva la pantalla de confirmación y muestra el motivo. La carga deshabilita los botones para evitar envíos repetidos.

Las necesidades anteriores del coordinador se retiraron únicamente en Merprolima · Presentación; no se borró historial ni se modificaron solicitudes o participaciones reales. Las entrevistas reales conservan su control de acceso.

Verificación de cierre del flujo: 23 pruebas automáticas correctas; prueba transaccional del servidor correcta y revertida; publicación desde Necesidades recibidas, incorporación sin pedido previo, confirmación y retiro comprobados en producción con cuentas de presentación. Diálogos revisados a 375 px (343 px de ancho, margen de 16 px, documento sin desbordamiento horizontal). Ambas cuentas de coordinador bloqueadas para comprar; ocho entrevistas reales preservadas.
