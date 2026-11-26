# Resultados ejecutados — 26/11/2026

Ejecución local Python 3.12 completada sin errores. Primera iteración experimental, no modelo aprobado para producción.

| Modelo | MAE | RMSE | R² | WAPE |
|---|---:|---:|---:|---:|
| Dummy mediana | 0.9014 | 2.1975 | -0.2023 | 100.00% |
| Regla al corte | 0.5313 | 1.6825 | 0.2953 | 58.94% |
| Promedio 3 | 1.5018 | 2.3213 | -0.3415 | 166.61% |
| Árbol corregido | 0.9581 | 1.6034 | 0.3600 | 106.29% |
| Ridge alpha 1 | 0.9538 | 1.5967 | 0.3653 | 105.82% |

Ridge reduce MAE 0.00425 sacos (0.44%) frente al árbol corregido y RMSE 0.00668. No supera a la regla al corte: diferencia MAE +0.42259. Intervalo descriptivo bootstrap semanal [0.41661, 0.42843]. Mantener regla como referencia de compra; predicción solo orientativa mientras no se demuestre utilidad adicional. Comparar APF3 original (MAE árbol 0.982 en semilla 2027) solo como referencia histórica; no calcular delta directo contra semilla 2028. El delta válido es árbol corregido vs Ridge en la misma prueba nueva.

Calidad: seis criterios comprobados en los datos sintéticos, séptimo pendiente (0 registros reales). No se declara cumplida la puerta del Paso 2b. La validación real mínima requiere 30 casos completos, autorizados, anonimizados, no usados en entrenamiento ni selección.

Artefacto candidato: resultados/modelo_candidato.joblib. SHA256 abc4f18d092a45ea17a8ccc2085ffa3e1bfb2480cccbbb60afb7864a4c19263f. La recarga reproduce la predicción de ejemplo. Notebook generado equivalente al script, aún no ejecutado en Colab.
