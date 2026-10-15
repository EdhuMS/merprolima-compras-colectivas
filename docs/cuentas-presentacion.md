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
- Vigencia de ambas propuestas: 20/10/2026. Los dos clientes y el coordinador tienen necesidades propias en ambas.
- Proveedores genéricos, cantidades, fechas, mínimos y gastos cero son supuestos del caso de presentación. Los precios toman como referencia el catálogo publicado por Salima consultado el 13/10/2026. No son cotizaciones recibidas ni resultados de comerciantes.

## Recorrido comprobado

1. Ingreso por contraseña de las tres cuentas y lectura de su rol desde el servidor.
2. Cliente 01: Ver propuesta → Confirmar participación → estado Participación confirmada → Rechazar → estado Propuesta rechazada. Puede volver a confirmar.
3. Coordinador: acceso a Editar cotización y guardado de condiciones de arroz.
4. Coordinador: Nueva necesidad para agregar un pedido a la agrupación compatible.
5. Las cuentas de presentación no pueden consultar las ocho entrevistas reales. La cuenta personal del coordinador conserva acceso a las ocho.

## Separación de evidencia

Todos los registros de estas cuentas usan origin=simulated y sus referencias CASO-G8-20261014. Los datos del mercado real permanecen separados. El rol procede de memberships, no de metadatos editables por el usuario. Las entrevistas solo se autorizan a coordinadores activos de puestos reales mediante una comprobación privada de pertenencia.

Las compras se agrupan por producto, fecha y modalidad. El coordinador gestiona las propuestas de su mercado; esta versión no tiene asignación individual exclusiva por propuesta.
