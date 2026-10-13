# Tablero Kanban APF2

Registro iniciado el 13/10/2026. Estados actuales comprobados, sin reconstrucción retrospectiva. Flujo: Por definir, Listo, En curso, Revisión y prueba, Hecho. WIP máximo: 2 en curso y 1 en revisión.

Hecho exige revisión humana. Un cierre técnico comprobado por el agente deja la tarjeta Lista para esa revisión; no equivale a aprobación del grupo.

| Tarjeta                                    | Prioridad  | Estado      | Responsable actual                         | Evidencia y siguiente paso                                               |
| ------------------------------------------ | ---------- | ----------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| K01 Cotización y gastos null, US05         | Must       | Listo       | Agente; revisión del grupo pendiente       | Código, migración, SQL y captura; cierre técnico                         |
| K02 Fecha del proveedor, US08              | Must       | Listo       | Agente; revisión del grupo pendiente       | Campo separado y persistencia UI/SQL; cierre técnico                     |
| K03 Exportación y revisiones, US09         | Should     | Listo       | Agente; revisión del grupo pendiente       | SQL por rol e historial; JSON descargado; login de coordinador pendiente |
| K04 Informe, privacidad y presentación     | Must       | Listo       | Agente                                     | Actualización y revisión visual de artefactos                            |
| K05 Revisión humana del incremento         | Must       | Listo       | Grupo 8; responsables por confirmar        | Leer cambios y registrar correcciones                                    |
| K06 Entrevistas y cotizaciones             | Must       | Listo       | Equipo de campo; responsable por confirmar | Soportes auténticos y autorizados                                        |
| K07 Login del piloto y cuentas compradoras | Must       | Por definir | Coordinador                                | Sesión sin compartir contraseña; puestos identificados                   |
| K08 Prueba con comerciante                 | Must       | Por definir | Equipo de campo                            | Poco viable según usuario; declarar pendiente si no se realiza           |
| K09 ML                                     | Won't APF2 | Por definir | Equipo APF3                                | Historia real suficiente y baseline                                      |

## Registro desde la creación

13/10: creación del tablero. K01–K03 en Listo, con cierre técnico verificado durante esta sesión. K04 en curso. No se atribuyen movimientos a días anteriores. Roles y revisión humana pendientes. Los registros futuros deben indicar cambio, fecha y evidencia.

13/10, cierre de esta sesión: K04 pasó de En curso a Listo tras exportación APA, revisión visual y presentación validada. Revisión humana pendiente. WIP actual: 0 en curso, 0 en revisión.

## Funciones propuestas para confirmar

Producto y campo: puestos, permisos, entrevistas y proveedor. Desarrollo: cuentas, migraciones, aplicación y despliegue. Calidad y documentación: fuentes, anexos, revisión y ensayo. La asignación nominal corresponde al Grupo 8. No se atribuye trabajo ya realizado a un integrante sin su confirmación.
