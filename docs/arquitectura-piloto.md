# Arquitectura y operación del piloto

La aplicación separa infraestructura compartida, funcionalidades y composición:

- src/app: selección explícita entre demo y piloto y límite de sesión.
- src/features/auth: sesión y formulario de acceso.
- src/features/purchases/domain: datos, validaciones, agrupación y comparación sin llamadas de red.
- src/features/purchases/application: contrato de repositorio y consultas/mutaciones.
- src/features/purchases/data: adaptadores LocalStorage y Supabase.
- src/features/purchases/ui: pantallas, tarjetas, diálogos y catálogo.
- src/infrastructure/supabase: cliente único con clave publicable y renovación de sesión.
- supabase/migrations: cambios versionados aplicados al proyecto nuevo.

La demo pública conserva su almacenamiento local y origen simulado. El modo piloto requiere Supabase Auth y una fila activa en memberships, asignada desde administración. Un usuario no puede darse roles usando metadata ni modificar directamente las tablas del negocio. La aplicación no abre registro público ni envía invitaciones automáticamente.

La RPC pública es SECURITY INVOKER. Llama una operación privada con SECURITY DEFINER que verifica auth.uid y membresía antes de cada acción; se usa para devolver agregados sin exponer las cantidades de cada puesto. Search path vacío, objetos calificados, permisos mínimos y RLS activado. No hay service_role en el navegador.

Las mutaciones se serializan por mercado y origen durante la transacción. Confirmación comprueba una firma de volumen/cotización calculada por el servidor; versión antigua se rechaza. Reintentos de decisión usan un índice único. El registro de necesidades usa un UUID cliente como identidad de la operación. La interfaz bloquea doble envío; después de un fallo ambiguo de red al crear, debe comprobarse la lista antes de reintentar con un nuevo UUID.

Transporte y reparto se asignan proporcionalmente y se distribuyen los centavos residuales en orden determinista. El servidor devuelve la asignación propia; la interfaz nunca necesita ver las cantidades por puesto ajeno para mostrar el costo correcto.

## Habilitar cuentas

Crear la cuenta en Supabase Auth sin publicar su contraseña. Después insertar el puesto con market_id de Merprolima, código seudónimo y origin real o simulated. Insertar memberships con user_id, stall_id y role buyer o coordinator. Real y simulated no se mezclan. Los roles solo los administra el dueño del proyecto.

No se han creado cuentas, comerciantes o entrevistas ficticias en el entorno real. Los registros de prueba de seguridad se ejecutaron dentro de una transacción revertida. El catálogo real debe registrar nombres, marcas, presentaciones y fuentes recogidas en campo; no se prellenó con marcas de prueba.

## Despliegue

Alojamiento del proyecto: Vercel, vinculado por CLI a edhumss-projects/merprolima-compras-colectivas. Variables de producción y preview: VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. Las variables son publicables por diseño y no autorizan acceso a datos sin sesión y membresía. No almacenar credenciales de base de datos en VITE_.

El enlace anterior de Sites conserva la demo inicial; Vercel será la versión que incorpora el piloto. La fuente sigue en el repositorio privado. Revisar esta guía al ampliar para APF3; no añadir FastAPI sin necesidad del componente ML.

Las cuentas aprobadas también pueden preautorizarse mediante private.pilot_account_grants desde administración. Una función de trigger en esquema privado las asigna al confirmar el correo, consume la autorización y no concede ningún rol a correos no aprobados. No se permite acceso de la aplicación a esa tabla.

Producción Vercel: https://merprolima-compras-colectivas.vercel.app. HTTP público verificado y Supabase no permite llamadas de piloto sin autenticación. Primer coordinador preparado; contraseña y creación de cuenta requieren acción del usuario en Supabase Auth.
