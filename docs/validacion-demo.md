# Validación técnica de la demo

Realizada por el agente durante implementación. No es una prueba con comerciante ni validación humana del equipo académico.

- Doce pruebas automatizadas de dominio y persistencia pasaron: separación por producto/origen/modalidad, costo total, mínimo, diferencia negativa, vigencia/gastos desconocidos, asignación exacta de centavos, firmas, validación y permisos simulados.
- Compilación TypeScript y producción Vite correctas.
- Revisión de dependencias: cero vulnerabilidades después de actualizar Vitest a 5.0.4.
- Navegador: comparación de tres sacos S/ 555 frente a S/ 546; confirmar participación y recargar mantiene estado.
- Navegador: cantidad cero bloqueada, fecha pasada muestra error, registro válido agrega cantidad e invalida confirmación anterior.
- Revisión visual en 390 x 844 y 1440 x 1000: formulario y pantallas legibles. Se corrigió insignia superior que ocupaba espacio en móvil.
- Pendientes: Supabase, autenticación/RLS reales, concurrencia entre dispositivos, prueba de error de red real y validación con comerciante.
- Navegador: edición de cotización recalcula costo y mantiene requerimiento de reconfirmación. Se corrigió edición de vigencia para conservar la fecha local de Lima.
