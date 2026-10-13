# Contrato de datos implementado, versión 2

Corte: 13/10/2026. Mercado único: Merprolima. Moneda: PEN. Presentación horaria: America/Lima. Timestamps en UTC. Este contrato sustituye la propuesta inicial; guardar una fila no acredita una entrevista realizada.

| Entidad física         | Campos principales                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| markets                | id UUID, name                                                                                                                                                                                                                         |
| stalls                 | id, market_id, code, origin real/simulated                                                                                                                                                                                            |
| memberships            | user_id, stall_id, role buyer/coordinator, active. Asignación administrativa                                                                                                                                                          |
| products               | id, market_id, origin, name, brand, kg, category, source_ref                                                                                                                                                                          |
| needs                  | id UUID estable, stall_id, product_id, qty de 1 a 500, needed_date, mode, status open/withdrawn, origin, source_ref, created_at, updated_at                                                                                           |
| quotes                 | id, product_id, needed_date, mode, origin, supplier_code, individual, collective, minimum_qty, transport, distribution, individual_transport, valid_until, payment, source_ref, version, created_at, evidence_type, delivery_estimate |
| participations         | id, stall_id, product_id, needed_date, mode, origin, signature, status confirmed/declined, created_at                                                                                                                                 |
| purchase_events        | id, actor_id, action, entity_id, occurred_at                                                                                                                                                                                          |
| private.need_revisions | id, need_id, market_id, origin, product_id, needed_date, qty, status, mode, revision_action, occurred_at                                                                                                                              |

No hay tablas groups, group_members o profiles. Los grupos se derivan por producto/presentación, fecha exacta, modalidad y origen. La firma liga volumen y versión de cotización. Una participación no es una orden, pago o entrega.

## Procedencia y fechas

Los entornos real y simulated se asignan por cuenta. La nueva cotización exige proveedor, fuente y evidence_type: written_quote, price_list, verbal o simulated, compatible con el entorno. unclassified se reserva para registros previos pendientes de clasificación. Evidencia original autorizada fuera de la aplicación.

Gastos null significan desconocidos; cero es costo conocido sin cargo. Un gasto desconocido bloquea la confirmación. delivery_estimate es opcional y diferente de needed_date. No acredita compromiso ni entrega cumplida.

## Operaciones y permisos

purchase_api acepta read, create_product, save_need, withdraw, quote, decide y export_analytical. Exige sesión y membresía activa. El comprador accede a sus registros y agregados permitidos; el coordinador gestiona catálogo, cotización y análisis de su mercado/origen. Los roles no proceden de user_metadata. Las tablas de negocio no permiten acceso directo desde el cliente. La lógica privada comprueba identidad y membresía y fija search_path vacío.

## Exportaciones

JSON personal: schema_version 2, scope own_and_aggregates, data_origin, period, exported_at, basis needed_date, productos, necesidades, cotizaciones y participaciones. Omite identidad, código de puesto, proveedor, fuente libre y pago. El ID de cotización permite consultar la fuente restringida, sin copiar su texto.

JSON analítico: scope market_analytical, periodo máximo de 366 días, weekly_needs por producto/semana/modalidad/origen, quotes y need_revisions. Suma necesidades abiertas y cuenta puestos distintos. Omite nombres, códigos de puesto, correos y texto libre. Los UUID siguen siendo seudónimos. Un periodo puede cortar semanas y debe declararse.

El historial empieza al aplicar la migración del 13/10 y registra cambios materiales de necesidades. No reconstruye datos anteriores ni conserva todas las versiones de cotizaciones. La exportación actual aún no reconstruye automáticamente un dataset disponible a una fecha histórica de corte.

## APF3

Objetivo candidato: sacos solicitados de una presentación durante la semana siguiente. Son necesidades declaradas, no ventas. Excluir simulados y retiros, deduplicar UUID y distinguir cero de faltante. Revisar cobertura y reconstruir información disponible al corte usando revisiones, sin eventos futuros.

Partición temporal, baseline de última semana o promedio disponible, MAE y WAPE con denominador positivo. La historia real suficiente está pendiente. Tres entrevistas no crean una serie semanal suficiente para ML.
