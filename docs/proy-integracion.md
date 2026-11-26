# PROY despliegue y verificación

Comprobado el 26/11/2026 con autorización del usuario para Render y Vercel.

## Sistema publicado

- Frontend: https://merprolima-compras-colectivas.vercel.app/
- API y salud: https://sumabasto-forecast.onrender.com/health
- Render: sumabasto-forecast, Python 3.12.10, plan Free; servicio srv-dc4b4ebl550s738nu5eg.
- API desplegada desde 8211979c3b851a3f2f4b8f567bb9be35661f7481, rama feature/proy-inference-20261126.
- Modelo sumabasto-proy-candidato-v1; SHA256 abc4f18d092a45ea17a8ccc2085ffa3e1bfb2480cccbbb60afb7864a4c19263f.
- Frontend publicado desde 8202559; deployment Vercel dpl_6ft2Bpj5jscaT4zm3AuxvF3W6TfB, Ready y alias principal confirmado.
- PR #1 integrado a main. Se preservaron alcance académico y licencia MIT.

## Flujo publicado

React en Vercel solicita producto y semana a FastAPI en Render. La API verifica la sesión en Supabase Auth,
consulta catálogo e historial según rol, ejecuta el pipeline joblib completo y guarda entradas mínimas,
salida, origen, versión, hash y timestamp en la tabla privada. El nuevo endpoint no recibe roles ni variables
individuales desde el navegador y no devuelve la matriz de entradas individuales.

El corte sigue como referencia operativa y Ridge como estimación orientativa. Incertidumbre nula explícita:
la regresión no tiene probabilidad de clasificación ni intervalo predictivo calibrado.

## Evidencias públicas

Se usaron las cuentas de presentación existentes con datos simulados, sin cambiar contraseñas ni crear usuarios.
No se registraron nuevas necesidades comerciales. Las consultas exitosas dejan predicciones de presentación
en la tabla privada con origin=simulated.

- Salud 200 con versión esperada en tres consultas sucesivas.
- Tienda y coordinación: 200 para presentaciones dentro del dominio.
- Sin sesión: 401. Producto ajeno: 403. Campos adicionales inválidos: 422.
- Historial existente fuera de 0 a 8 sacos: 422. No se alteraron datos para forzar un resultado.
- CORS permite el dominio principal de Vercel.
- Dos registros recuperados de Supabase se reprodujeron exactamente con el pipeline y hash versionados.
- UI publicada comprobada en móvil 390 px y escritorio 1440 px, sin errores de página, desbordamiento
  horizontal ni superposición de la barra lateral una vez completado el cambio responsive.
- Fallo de red inducido únicamente en el navegador: la interfaz conserva las solicitudes.
  No equivale a haber detenido Render ni a una caída real del servidor.

| Rol | Consulta persistida | Estimación en sacos | Corte |
|---|---|---:|---:|
| Tienda | 78d73f9d-e856-475d-b51f-bb6ffa058cc5 | 0,489179 | 0 |
| Coordinación | 2c02d85c-2caf-430d-a9b3-c6c7e6f826e9 | 1,703179 | 0 |

Las capturas de UI corresponden a consultas posteriores y conservan sus propios UUID en browser-report.json.
Los JSON, capturas y replay están en output/proy/04. Pruebas y Validación/produccion-20261126 del workspace
padre y en las carpetas canónicas del Proyecto Final.

## Configuración y límites

Las claves se configuraron en Render, sin incluirlas en el repositorio o la documentación. Vercel contiene
la URL pública de la API y sus variables publicables existentes. Las migraciones 20261126055804 y
20261126060234 crean el registro privado con RLS. Solo service_role ejecuta el RPC de escritura;
anon y authenticated no tienen ese permiso ni acceso directo a la tabla.

El límite externo por consulta de la API es 8 segundos y el del navegador 15 segundos. Render Free puede
suspenderse por inactividad y tardar al reactivarse. Las latencias registradas son con servicio activo;
no constituyen SLA, prueba de carga ni medición de arranque en frío. El health check comprueba artefacto
y configuración, no el flujo autenticado completo.

## Pendientes ajenos al despliegue

Siguen pendientes autorización escrita del cambio de MiPYME, 30 casos reales reservados, validación
auténtica con dos comentarios y medición del indicador, revisión humana de los anexos IA, video de
respaldo y ensayo. No se declara cumplimiento del séptimo criterio ni del Paso 2b con cero casos reales.
Definir conservación, respaldo y límites de consultas antes de ampliar el piloto real.
