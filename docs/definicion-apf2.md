# Definición previa al desarrollo del APF2

Versión 0.1, 12/10/2026. Grupo 8. Entrega 14/10/2026. Documento de diseño; no acredita implementación o validación realizada.

## 1 Problema y continuidad

Los puestos de abarrotes de Merprolima podrían tener necesidades de reposición compatibles, pero todavía no se ha verificado cómo coordinan compras, qué descuentos reciben ni si un proveedor acepta pagos separados. El problema de ingeniería propuesto es coordinar necesidades compatibles, comparar condiciones de abastecimiento y registrar decisiones sin exponer información innecesaria de cada puesto. La ausencia de una aplicación no constituye por sí sola el problema.

Hipótesis de problema: la coordinación fragmentada impide consolidar volúmenes y evaluar de forma transparente una compra conjunta. La visita del 13/10 deberá confirmar, reformular o rechazar esta hipótesis. No asumir que todos compran poco, que no reciben descuentos o que arroz y azúcar son los de mayor rotación.

Continuidad: APF1 estudió la Bodega Mini Todo Leoncito. El equipo comunica una indicación oral del docente de delimitar a un mercado o cooperativa; se selecciona Merprolima. Declarar esa indicación en el resumen ejecutivo y conservar una nota del equipo con fecha confirmada, participantes y contenido. No inventar acta ni fecha de autorización. La arquitectura se actualiza al stack acordado manteniendo una aplicación web, persistencia cloud y preparación futura para ML.

Usuarios propuestos: comprador del puesto y coordinador del piloto. El proveedor aporta condiciones comerciales; no requiere un portal propio para APF2. No se presume respaldo institucional de la asociación del mercado.

## 2 Objetivo medible

Para los compradores de puestos de abarrotes de Merprolima, el MVP permitirá registrar necesidades de reposición, consolidar cantidades del mismo producto y presentación, comparar el costo individual con una cotización conjunta y confirmar su participación, con el propósito de evaluar oportunidades de abastecimiento colectivo, medido mediante la finalización del flujo, el tiempo de coordinación y la diferencia de costo total cotizado por puesto.

Metas propuestas para la aceptación técnica: al menos tres puestos de prueba, una agrupación compatible, persistencia después de recargar y ejecución completa sin errores bloqueantes. Estas metas no son resultados obtenidos.

Indicadores de negocio:
- Finalización: participantes que completan la tarea / participantes que la intentan; informar numerador y denominador.
- Tiempo de tarea: segundos desde iniciar el registro hasta consultar la confirmación. Diferenciar de tiempo de abastecimiento, que requiere compra y recepción reales.
- Diferencia cotizada en soles = costo individual comparable - costo colectivo asignado. Porcentaje = diferencia / costo individual * 100, solo si el denominador es positivo.
- Costo total incluye producto, transporte y reparto conocidos. Si faltan gastos o condiciones comparables, mostrar comparación incompleta; no declarar ahorro.
- Ahorro realizado y tiempo de abastecimiento: pendientes hasta disponer de operaciones reales observables. El interés declarado no equivale a adopción.

## 3 Metodología de innovación

Design Thinking será la metodología principal. Se justifica por incertidumbre sobre confianza entre puestos, compras actuales y condiciones de proveedores; necesidad de una interacción breve y comprensible; y oportunidad de ajustar el flujo después de la visita. La metodología no obliga a construir una app si la evidencia muestra que no aporta valor.

| Fase | Artefacto propio del caso | Estado y decisión |
|---|---|---|
| Empatizar | Guía de entrevista a compradores y consulta a proveedores; registros anónimos | Guía existente; aplicación prevista 13/10, resultados pendientes |
| Definir | POV e hipótesis contrastados con respuestas y negativas | POV provisional, requiere revisión tras campo |
| Idear | Comparación de WhatsApp, hoja compartida y aplicación modular | Evaluación propuesta; no presentar como decisión validada por usuarios |
| Prototipar | Flujo de registro, agrupación, comparación y confirmación | Definido por escrito; diseño visual y desarrollo pendientes |
| Probar | Tarea observada con comprador, tiempos, errores y comentario autorizado | Pendiente después de implementar; no reutilizar prueba no acreditada |

POV provisional: un comprador de abarrotes de Merprolima necesita conocer si puede coordinar una reposición compatible y bajo qué condiciones, porque decidir participar requiere claridad sobre producto, costo total, pago y entrega. Validar las necesidades y razones con evidencia de campo.

Ideación: WhatsApp permite coordinación familiar pero exige estructurar manualmente cantidades y versiones; una hoja compartida ordena registros pero requiere control de acceso y manejo de edición; una aplicación permite validaciones y estados, con mayor costo de construcción y capacitación. Elegir por valor comprobado, facilidad de uso y trazabilidad, sin afirmar que las alternativas son incapaces de proteger datos.

## 4 Alcance funcional y flujo

Piloto acotado a puestos de abarrotes de un único mercado. Seleccionar inicialmente un producto y presentación exactos según las entrevistas y cotizaciones; ampliar a otro solo si hay condiciones comparables. Arroz y azúcar son candidatos, no demanda confirmada.

Flujo: acceso al piloto → registrar necesidad → ver necesidades compatibles agregadas → coordinador registra cotización → comparar costos y condiciones → confirmar o rechazar participación → consultar estado.

La necesidad registrada no es una orden de compra. La confirmación de participación no ejecuta pagos ni promete entrega. Una agrupación solo reúne el mismo producto, marca/tipo, peso, unidad, mercado, ventana de recepción y modalidad compatibles. El precio por volumen solo aplica cuando se alcanza el mínimo y la cotización está vigente.

Incluye: validación, consulta persistente, control por roles, separación real/demo, estados y manejo de errores. El coordinador registra cotizaciones con su procedencia; los demás puestos ven agregados, no respuestas de entrevistas o contactos privados.

Fuera de APF2: pagos, custodia de dinero, contratación automática, logística real, facturación, inventario completo, multi-mercado, predicción ML, FastAPI y aplicación móvil nativa. No mostrar entregado sin recepción real respaldada; en demo, cualquier estado de entrega conserva la etiqueta simulada.

## 5 Backlog y criterios de aceptación

Todas las historias están pendientes. La columna Estado en MVP del informe final se actualizará con evidencia: Implementado solo después de comprobar código, prueba y despliegue; Pendiente para APF3 cuando corresponda. Durante planificación se usa Pendiente APF2 para evitar afirmar desarrollo inexistente.

| ID | Historia de usuario | MoSCoW | Estado en MVP | Criterios de aceptación |
|---|---|---|---|---|
| US01 | Como comprador, quiero acceder a mi puesto para consultar y registrar solo mis necesidades. | Must | Pendiente APF2 | Sesión válida; puesto pertenece al piloto; otro usuario no lee ni modifica datos privados; visitante ve solo demo. |
| US02 | Como comprador, quiero registrar producto, presentación, cantidad y fecha para comunicar mi reposición. | Must | Pendiente APF2 | Campos obligatorios; cantidad entera positiva en unidades de presentación; fecha válida; errores visibles; reintento no duplica; recarga conserva registro. |
| US03 | Como comprador, quiero corregir o retirar una necesidad abierta para evitar consolidar cantidades incorrectas. | Must | Pendiente APF2 | Solo propietario; edición antes de cierre; cantidad retirada no suma; necesidad confirmada exige retirar participación antes de editar. |
| US04 | Como coordinador, quiero consolidar necesidades compatibles para conocer el volumen negociable. | Must | Pendiente APF2 | Clave de compatibilidad exacta; excluye canceladas; no mezcla real/demo; total reproducible; muestra mínimo pendiente o alcanzado. |
| US05 | Como coordinador, quiero registrar una cotización y sus condiciones para evaluar una propuesta verificable. | Must | Pendiente APF2 | Precios positivos, mínimo positivo, vigencia, moneda PEN, fuente, gastos y condición de pago; verbal rotulada declarada; no aplicar precio vencido. |
| US06 | Como comprador, quiero comparar costos totales para decidir si la compra conjunta me conviene. | Must | Pendiente APF2 | Mismo producto y cantidad; transporte y reparto incluidos; explica asignación; diferencia puede ser negativa; datos incompletos no generan ahorro aparente. |
| US07 | Como comprador, quiero confirmar o rechazar una propuesta para dejar explícita mi participación. | Must | Pendiente APF2 | Muestra versión, precio y condiciones; confirmación única; reintento idempotente; cambio material exige nueva confirmación; no ejecuta pago. |
| US08 | Como comprador, quiero consultar el estado y condición de entrega para saber qué está pendiente. | Must | Pendiente APF2 | Estados persistentes; fecha solo si cotizada; si no existe, por definir; no promete entrega; errores de red ofrecen reintento sin perder formulario. |
| US09 | Como coordinador, quiero exportar registros trazables y seudonimizados para preparar el análisis de APF3. | Should | Pendiente APF2 | Exportación solo autorizada; diccionario y versión; sin nombres/contactos; real y demo separados; filtros de periodo y registros nulos explícitos. |
| US10 | Como comprador, quiero revisar un resumen antes de confirmar para evitar errores en mi pedido. | Could | Pendiente APF2 | Producto, unidades, total y condiciones legibles; permite volver a corregir sin duplicar. |
| US11 | Como coordinador, quiero estimar demanda futura para planificar agrupaciones. | Won’t APF2 | Pendiente para APF3 | Solo si existen datos suficientes; partición temporal, baseline y métricas; no entrenar con evidencia inventada. |

Prioridad de US09: incluir en APF2 si los ocho Must están estables; en caso contrario documentar contrato y exportación futura sin afirmar captura implementada.

## 6 Gestión ágil y comprobación

Kanban por equipo de tres, plazo breve y dependencia de entrevistas. Tablero propuesto: Por definir → Listo → En curso → Revisión y prueba → Hecho. WIP: máximo dos historias en curso y una en revisión. Registrar movimientos reales con fecha; este documento no acredita un tablero ejecutado. Responsables por función (campo, producto, desarrollo y validación) pendientes de asignar por el equipo; no atribuir trabajo ya realizado a integrantes.

Definition of Ready: historia y aceptación claras, reglas de negocio acordadas, datos y procedencia definidos, dependencia identificada. Definition of Done: revisión humana, criterios cumplidos, pruebas de flujo y entradas inválidas, permisos comprobados, persistencia, despliegue accesible, evidencia fechada y documentación actualizada.

Pruebas previstas: acceso entre dos puestos; formulario vacío/cantidad inválida; persistencia tras recarga; agrupación de productos compatibles e incompatibles; comparación con transporte y costo negativo; mínimo no alcanzado/cotización vencida; doble confirmación; cambio de versión; error de red; aislamiento demo/real. Estado de todas: No ejecutada. Registrar Pasó/No pasó, versión, captura o log y corrección solo cuando ocurran.

## 7 Arquitectura acordada

Módulos propuestos: acceso, puestos, catálogo, necesidades, agrupaciones, cotizaciones, participaciones y exportación. Cada funcionalidad separará interfaz (componentes, formularios y hooks), dominio (reglas y casos de uso) y datos (repositorios/adaptadores Supabase). Los componentes compartidos no contienen reglas comerciales.

React Hook Form y Zod validarán entrada; TanStack Query gestionará consultas, mutaciones e invalidación; Supabase aportará autenticación y PostgreSQL. Las reglas críticas también deberán validarse en base de datos/operaciones transaccionales, no solo en la interfaz. Permisos por puesto y rol mediante RLS. Nunca incluir claves de servicio en el cliente. La configuración concreta se implementará después de cerrar esta definición.

## 8 Hoja de ruta y preparación del informe

| Hito | Resultado esperado | Estado |
|---|---|---|
| 12/10 | Repositorio privado y definición documental | Repositorio creado; definición inicial preparada |
| 13/10 | Entrevistas y cotizaciones; revisar hipótesis, producto y condiciones | Pendiente |
| Después de cerrar definición y antes de 14/10 | Implementar Must, desplegar y ejecutar pruebas; prueba con usuario si se logra acceso | Pendiente; plazo ajustado, reducir alcance a un producto |
| 14/10 APF2 | Informe, presentación y demo accesible con evidencia real disponible y demo etiquetada | Pendiente |
| APF2 semanas 10 a 14 | Iteraciones y registro de aprendizaje según calendario docente | Fechas exactas por confirmar |
| APF3 semana 15 | Evaluar dataset y piloto ML; integrar FastAPI solo si necesario | Pendiente |
| PROY semana 17 | Integración final y comparación de resultados observados | Pendiente |

Informe final: respetar estructura 1 a 5 de la consigna; máximo 12 páginas sin portada, referencias ni anexos. Reservar 1 página para resumen, 2 para metodología, 3 para MVP/ágil, 3 para viabilidad/normativa/datos y 1 para conclusiones. Completar anexos de arquitectura, diccionario/pruebas y prompts con validación humana. Presentación máximo 12 diapositivas; 10 minutos exposición/demo y 5 preguntas.

Pendientes para cerrar el informe: viabilidad técnica con límites vigentes verificados, costos estimados en soles con supuestos, capacidad y capacitación del equipo, matriz normativa requisito–función–evidencia con fuentes oficiales actuales, mínimo tres riesgos con responsables asignados. No declarar cumplimiento normativo o valor tangible sin controles y evidencia implementados.

Riesgos iniciales: proveedor no acepta pagos separados (alto impacto, validar en campo, coordinador del piloto); cantidad insuficiente o cotización vencida (alto impacto, evitar aplicar descuento, responsable de dominio); exposición de datos entre puestos (alto impacto, verificar RLS, responsable técnico); poco tiempo antes de entrega (alta probabilidad, un producto y Must primero, responsable de producto). Roles propuestos, asignación nominal pendiente.
