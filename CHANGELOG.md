# Cambios de Sumabasto

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
