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
