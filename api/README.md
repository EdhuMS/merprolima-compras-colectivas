# Inferencia PROY

Servicio FastAPI para el pipeline completo Ridge de `ml/proy/resultados/modelo_candidato.joblib`.
APF3 permanece como antecedente; este servicio tiene versión propia.

## Ejecutar

Desde la raíz del repositorio, con Python 3.12 y un entorno virtual:

```sh
cd api
pip install -r requirements.lock.txt
cd ..
uvicorn api.main:app --host 127.0.0.1 --port 8000
```

Configurar en el entorno las variables de `api/.env.example`. No se cargan archivos `.env` automáticamente.
La clave de servicio se configura exclusivamente en el backend, nunca en variables VITE ni en capturas.
Para comprobar el código sin credenciales: `pytest api -q`.

## Contrato

`POST /v1/forecast`, cabecera `Authorization: Bearer <sesión Supabase>`, cuerpo
`{"product_id":"uuid autorizado","week":"lunes vigente YYYY-MM-DD"}`.
No admite cantidades, identidades, roles ni variables del modelo suministradas por el navegador.
La API verifica la sesión en Auth, obtiene catálogo y membresía con `purchase_api`, y consulta
`purchase_forecast_inputs` para tienda o `coordinator_forecast_history` para coordinación.
Solo procesa las cuatro presentaciones del entrenamiento, por puesto y producto, con ocho semanas
de historia disponibles. Las cuatro variables deben ser finitas y estar entre 0 y 8;
última semana y corte son sacos enteros. Se rechaza el dominio incompatible con HTTP 422.

Devuelve versión del contrato y del modelo, UUID de consulta, producto, semana, timestamp UTC,
origen de datos, estado, referencia al corte, estimación orientativa, cantidad operativa al corte,
cobertura e incertidumbre `null` con explicación. Esta regresión no produce probabilidad de clasificación.
El modelo entrenado con simulación requiere validación real y no supera a la regla al corte en el test sintético.

La respuesta no incluye las entradas individuales. La tabla privada conserva producto canónico,
matriz de variables sin identificadores de puestos, hash del artefacto, resultado y contexto del solicitante.
Un export autorizado puede verificarse con `python -m api.replay registro.json`.

## Errores y respaldo

- 401: falta sesión; 403: sesión o autorización insuficiente.
- 422: fecha, formato, presentación, historial o dominio incompatible.
- 503: datos, configuración o persistencia no disponibles. No se afirma registro exitoso.
- Modelo faltante o hash incompatible: resultado `fallback`, estimación `null`, se mantiene corte.
- Cliente: límite de 15 segundos; muestra fallo y conserva las solicitudes y preparación manual de propuestas.
- Cada consulta externa tiene límite de 8 segundos. La disponibilidad extremo a extremo depende de varios servicios.

`GET /health` comprueba artefacto y configuración presente, sin exponer secretos.
No comprueba conectividad real de Supabase ni garantiza disponibilidad del flujo completo.

## Render y Vercel

`render.yaml` declara servicio, Python, instalación, arranque y health check siguiendo
[la documentación de Render](https://render.com/docs/deploy-fastapi).
Aplicar las migraciones PROY antes de activar el servicio. Configurar los secretos manualmente en Render
o mediante un canal autorizado. Configurar en Vercel `VITE_FORECAST_API_URL` con la URL real de Render
y recompilar; sin esa variable las consultas nuevas no aparecen.
No usar una URL ficticia ni afirmar despliegue por tener el manifiesto.

La validación remota de sesión usa [Auth getUser](https://supabase.com/docs/reference/javascript/auth-getuser).
La escritura usa `record_proy_forecast`, ejecutable únicamente por `service_role`.
`anon` y `authenticated` no tienen permisos de tabla ni de ejecución.
La tabla privada tiene RLS sin políticas de acceso directo por diseño.

Próximo gate de producción: configurar Render, comprobar sesión y roles reales, error de red,
latencias de arranque en frío/caliente y registro/replay con la URL publicada; definir conservación
de registros y protección frente a consultas abusivas en el proxy. No hay prueba de carga en producción.
