# Cuentas para presentación — 14/10/2026

Entorno: https://merprolima-compras-colectivas.vercel.app/

| Cuenta | Rol | Puesto |
|---|---|---|
| cliente1@sumabasto.test | buyer (Comprador) | Cliente 01 |
| cliente2@sumabasto.test | buyer (Comprador) | Cliente 02 |
| coordinador1@sumabasto.test | coordinator | Coordinación |

La clave es la acordada para la demostración. Las cuentas tienen correo confirmado y pertenencia activa a Merprolima · Presentación. Los dominios .test no reciben correo. La cuenta personal conserva su acceso.

## Compras

- Arroz extra añejo Faraón Azul, 50 kg: recojo 17/10/2026; mínimo 5 sacos; individual S/197 y colectivo S/195.
- Azúcar rubia Cartavio, 50 kg: entrega 18/10/2026; mínimo 6 sacos; individual S/185 y colectivo S/183.
- Vigencia de ambas propuestas: 20/10/2026. Solo los clientes tienen necesidades de compra. Las antiguas solicitudes del coordinador de presentación están retiradas y conservadas en el historial.
- Proveedores genéricos, cantidades, fechas, mínimos y gastos cero son supuestos del caso de presentación. Los precios toman como referencia el catálogo publicado por Salima consultado el 13/10/2026. No son cotizaciones recibidas ni resultados de comerciantes.

## Recorrido comprobado

1. Ingreso por contraseña de las tres cuentas y lectura de su rol desde el servidor.
2. Cliente: Mis necesidades registra solicitudes; Compras colectivas solo muestra propuestas publicadas por coordinación. En una propuesta sin pedido previo se ingresa la cantidad. Confirmación previa → guardado → cierre del detalle → modal de éxito.
3. Coordinador: Necesidades recibidas muestra demanda agrupada y permite preparar una propuesta; Crear compra colectiva permite publicar también sin solicitudes previas. Debe completar producto, fecha, modalidad y cotización antes de publicar.
4. Las dos cuentas de coordinación solo gestionan. No tienen pedidos ni participaciones propios; el servidor rechaza save_need, withdraw y decide para role=coordinator. El rol combinado comprador/coordinador se pospone a APF3.
5. Las cuentas de presentación no pueden consultar las ocho entrevistas reales. La cuenta personal del coordinador conserva acceso a las ocho.

## Separación de evidencia

Todos los registros de estas cuentas usan origin=simulated y conservan referencias CASO-G8-20261014 o códigos APP generados al registrar acciones del caso. Los datos del mercado real permanecen separados. El rol procede de memberships, no de metadatos editables por el usuario. Las entrevistas solo se autorizan a coordinadores activos de puestos reales mediante una comprobación privada de pertenencia.

Las compras se agrupan por producto, fecha y modalidad. El coordinador gestiona las propuestas de su mercado; esta versión no tiene asignación individual exclusiva por propuesta.

## Validación del flujo coordinado

- Se publicó desde la interfaz la propuesta de azúcar Cartavio del 21/10/2026 a partir de una necesidad de presentación de ocho sacos. Mínimo seis; precios 185/183 y gastos cero son condiciones del caso, no cotización comercial real.
- Cliente 01 no tenía pedido compatible: ingresó dos sacos, confirmó, recibió el modal de éxito y la compra apareció en Mis participaciones. Se comprobó también el retiro con confirmación previa y cierre del detalle.
- Bajo el mínimo o con gastos sin definir, se registra el pedido con participación pending. No se presenta como compra confirmada. Al alcanzar condiciones suficientes, el cliente debe confirmar.
- Prueba transaccional con rollback: propuesta sin necesidades, primer comprador pendiente bajo el mínimo, segundo comprador que alcanza el mínimo, reconfirmación del primero, confirmación repetida sin duplicados, retiro, bloqueo de compra para ambos coordinadores y bloqueo de publicación para comprador. Todos los casos pasaron; la prueba no dejó registros.
- La retirada de una participación conserva la necesidad de reposición y por eso no reduce el volumen solicitado. Retirar la necesidad en Mis necesidades sí reduce ese volumen y exige revisar confirmaciones.
