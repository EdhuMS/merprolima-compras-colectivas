# Contrato de datos preliminar

Versión 0.1, 12/10/2026. Especificación sin implementación. Ningún campo acredita captura realizada. Mercado único: Merprolima; moneda PEN; zona horaria America/Lima. Timestamps almacenados en UTC, fechas de necesidad como fecha local.

## Procedencia y separación

Entornos separados real y demo; cada entidad operativa lleva data_origin = real | simulated. Los registros reales requieren source_ref, collected_at y método de captura. La evidencia de campo se conserva fuera de la demo y con acceso restringido. El usuario ve una etiqueta de demostración en toda operación simulada. No convertir registros simulados en reales ni mezclar sus totales o métricas.

Fuentes: declaración del comprador, cotización escrita/lista autorizada, precio verbal declarado y eventos de aplicación. La referencia a un archivo no implica que exista: guardar solo referencias comprobadas. Evitar nombres, DNI, datos bancarios y contactos en exportaciones. Un código de puesto es seudónimo, no anonimización garantizada.

## Entidades propuestas

| Entidad | Campos esenciales y tipos | Reglas |
|---|---|---|
| markets | id UUID, name texto | Un mercado habilitado en APF2 |
| profiles | user_id UUID, market_id UUID, stall_id UUID nullable, role buyer/coordinator | Rol asignado por administrador; comprador ligado a un puesto |
| stalls | id UUID, market_id UUID, code texto, active boolean | Código único por mercado; sin nombre de persona |
| products | id UUID, name, brand, variety textos, package_weight_kg decimal, package_unit texto | Presentación exacta, peso positivo; catálogo normalizado |
| needs | id UUID, stall_id, product_id UUID, package_qty entero, needed_from/needed_to fechas, delivery_mode texto, status open/withdrawn/locked, version entero | Cantidad > 0, ventana válida; editables solo abiertas; propietario autorizado |
| groups | id UUID, market_id, product_id, needed_from/needed_to, delivery_mode, status draft/open/closed/cancelled, version entero | Compatible con cada necesidad; total derivado de miembros activos |
| group_members | group_id UUID, need_id UUID, allocated_qty entero | Necesidad no asignada simultáneamente a dos grupos activos; no superar su cantidad |
| quotes | id UUID, group_id UUID, supplier_code texto, unit_price_individual/unit_price_group decimal, minimum_qty entero, transport_individual_total/transport_group_total/distribution_total decimal nullable, valid_until timestamp, payment_terms texto, delivery_estimate fecha nullable, evidence_type written/list/verbal/simulated, version entero | Comparabilidad de producto y condiciones; costos desconocidos son null, cero solo cuando confirmado; precio por volumen condicionado al mínimo |
| participations | id UUID, group_id, stall_id, quote_id UUID, quote_version entero, status pending/confirmed/declined/withdrawn, confirmed_at timestamp nullable | Única por puesto, grupo y versión; confirmación ligada a condiciones mostradas |
| events | id UUID, entity_type/id, event_type texto, actor_id UUID, occurred_at timestamp, idempotency_key texto | Eventos permitidos; evitar payload con datos personales; clave única para reintentos |

Campos comunes en entidades operativas: created_at, updated_at, data_origin, source_ref nullable en demo, schema_version. Integridad referencial por UUID; versionado de necesidades y cotizaciones. Los archivos de entrevistas no van a tablas visibles para compradores.

## Reglas de negocio que deben implementarse

1. Compatibilidad exacta de mercado, producto/presentación, modalidad y ventana de recepción; confirmar manualmente ventanas compatibles si no son idénticas, sin agrupación silenciosa.
2. Actualizar total al editar o retirar necesidad. Si el retiro deja el volumen bajo el mínimo, la propuesta pierde elegibilidad al precio colectivo y requiere revisión/reconfirmación.
3. Congelar cantidad, versión de precio y condiciones al confirmar. Un cambio material invalida aceptación anterior; conservar el historial.
4. Confirmar mediante operación transaccional e idempotente; evitar duplicados ante reintentos y conflictos concurrentes.
5. Distribuir transporte/reparto colectivo proporcionalmente a la cantidad de unidades de presentación de cada puesto. Comparar con costo individual para la misma cantidad; registrar el supuesto de transporte individual.
6. Usar decimal monetario y redondear a dos decimales al asignar; repartir residuo de centavos con criterio determinista para que la suma coincida con el total.
7. Cotización vencida, mínimo no alcanzado o gasto desconocido impiden mostrar un ahorro válido. Diferencia negativa se muestra como mayor costo.
8. Entrega estimada desconocida se muestra como por definir. Confirmación de participación no equivale a orden ni pago.
9. Comprador accede a sus registros y a agregados permitidos; coordinador al piloto asignado. Permisos efectivos mediante RLS, no solo ocultación de botones.

## Dataset previsto para APF3

Objetivo candidato: demanda real semanal en unidades de una presentación por producto dentro del piloto, calculada a partir de necesidades válidas registradas antes de una fecha de corte. Es demanda declarada, no ventas ni demanda de todo el mercado. Si el problema validado cambia, revisar objetivo y contrato antes de entrenar.

Unidad analítica: producto/presentación–semana en Merprolima. Campos: week_start (fecha), product_id (categoría), package_weight_kg (decimal), active_stall_count (entero), requested_package_qty (entero), confirmed_package_qty (entero separado), quoted_individual_price/quoted_group_price (decimal nullable), eligible_group_count (entero), source_event_count (entero), data_origin, schema_version y cutoff_at. Variable objetivo: requested_package_qty de la semana siguiente; usar únicamente información disponible al corte como predictores.

Volumen APF2 esperado como meta exploratoria: tres compradores, cuarto opcional; un proveedor, segundo opcional. Cero participantes confirmados en esta definición. Estas entrevistas no crean por sí solas series semanales; volumen de datos operativos actuales: no capturado en este repositorio. Objetivo de captura futura: registrar necesidades durante varias semanas; horizonte y suficiencia se decidirán según cobertura real. No prometer un modelo válido con tres entrevistas.

Calidad: desduplicar por identidad/idempotencia, normalizar producto y presentación, validar cantidades/fechas, distinguir null de cero, excluir retiradas del total vigente, conservar cambios, verificar procedencia y autorización. Reportar faltantes y cobertura; no inventar valores para completar históricos. Dataset real y sintético separados; sintéticos sirven para probar el flujo y no demostrar desempeño en campo.

Partición: por tiempo, manteniendo semanas completas y evitando que eventos posteriores al corte filtren información al entrenamiento. Con suficiente historia, reservar aproximadamente el último 20% de semanas como prueba y validar en ventanas temporales dentro del 80% anterior. Ajustar cortes según tamaño; si no hay historia suficiente, declarar evaluación ML pendiente. Comparar con baseline de última semana o promedio histórico disponible; MAE en unidades y WAPE solo si demanda total de evaluación > 0. Informar cantidad de semanas y registros.

## Evidencia requerida antes de declarar captura

Esquema persistente, diccionario actualizado, exportación seudonimizada, ejemplo claramente simulado, prueba de permisos y trazabilidad desde formulario hasta consulta. Todos pendientes. No se adjunta un dataset real ni una migración ejecutada.
