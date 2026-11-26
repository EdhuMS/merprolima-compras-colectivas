# Cambios de Sumabasto

## PROY despliegue verificado 26 de noviembre de 2026

- FastAPI publicado en Render Free con el pipeline completo y claves configuradas en el servidor.
- Vercel publica PROY en el dominio principal con la URL pública de la API configurada.
- PR #1 integrado a main; filtros de despliegue anclados a la raíz conservan el adaptador Supabase del frontend.
- Tienda y coordinación verificadas con cuentas de presentación, resultados persistidos y replay exacto de dos consultas.
- Verificados 401 sin sesión, 403 para producto ajeno y 422 para formato o historial fuera de dominio.
- Interfaz publicada revisada en móvil y escritorio; fallo de red inducido solo en el navegador.
- Datos simulados; estas pruebas no acreditan uso comercial ni treinta casos reales.

## PROY candidato 26 de noviembre de 2026

- Se incorpora servicio FastAPI separado con autenticación remota de Supabase y datos consultados según rol.
- Se conserva el pipeline joblib completo del Hito 1 con verificación SHA256, sin reentrenarlo.
- Se validan fecha, presentación, dominio y esquema; se registra incertidumbre nula explícita para regresión.
- Se mantiene el corte como referencia operativa; Ridge se presenta como estimación orientativa.
- Se añade registro privado persistente de consultas, entradas mínimas, salidas, versión, hash y timestamp.
- Se incorpora consulta orientativa en coordinación y tarjetas de recomendación de tienda, activada por configuración.
- Se agregan pruebas de API, contrato del frontend y Playwright en móvil, tablet y escritorio con fixtures locales.
- Se prepara manifiesto Render y guía de despliegue. La integración pública PROY queda pendiente de configuración y comprobación real.

## APF3 histórico

Se conserva el árbol `sumabasto-apf3-calibrado-v2`, notebook, Colab histórico y documentación previa.
Las métricas de APF3 usan semilla 2027; PROY usa una nueva trayectoria de prueba 2028.
La comparación directa de ambos resultados históricos no representa una mejora controlada.
