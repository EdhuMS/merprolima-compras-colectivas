# Hito 1 — Proyecto Final · Sumabasto

## Estado
Candidato experimental. No confundir con APF3 entregado, ni afirmar validación comercial. El generador APF3 se conserva. El criterio 7 de coherencia y mínimo de 30 registros reales están pendientes; no se puede cerrar el Paso 2b académico hasta comprobarlos.

## Protocolo
- Unidad: puesto × presentación de 50 kg × semana. Ocho arquetipos, cuatro productos, 148 semanas evaluables por trayectoria. Semilla 42 para desarrollo; corte original de 125 semanas; cinco folds temporales por semana. Nueva prueba independiente semilla 2028, separada de la conocida 2027 del APF3.
- Selección: menor MAE medio temporal entre candidatos supervisados. El corte observado se mantiene como referencia operativa si el modelo no lo supera. No usar la prueba para cambiar selección.
- Candidatos: árbol corregido, árboles profundidades 2/3/5/7 y hojas 10/20/50/100; Ridge alpha 1/10/100; forest profundidad 3/5/8 y hoja 10/30. Semilla 42.
- Evaluación: MAE, RMSE, R², WAPE, desgloses por señal al corte, sensibilidad con semilla 2029 y bootstrap semanal.
- Pipeline: codificación fija de productos y escala ajustadas solo con entrenamiento de cada fold. No usa identidad de puesto ni objetivo como entrada.

## Correcciones de retroalimentación
| Observación | Corrección | Evidencia |
|---|---|---|
| Justificación del modelo | Criterio explícito de MAE en CV temporal y evaluación de regla operativa | seleccion.json, metricas.csv |
| Coherencia y representatividad | Reconstrucción temporal por eventos, rangos por perfil, ficha ejecutada | resultados.json; criterio 7 pendiente |
| Sensibilidad | Tres escenarios impresos y almacenados | resultados.json |
| Evaluación de corte | MAE por grupo y diferencia pareada con bootstrap semanal | resultados.json |
| Datos reales | No inventar; reservar 30 casos completos independientes | pendiente autorización y fuente |
| Inferencia fuera de rango | Contrato 0–8 sacos por fila; abstenerse ante entradas fuera de dominio | hito 2 |
| Autorización cambio MiPYME | Verificar evidencia escrita en Aula Virtual | pendiente equipo |
| Indicador de negocio | Medir o estimar con etiqueta y supuestos | hito de validación |
| Normativa | Matriz requisito/control/evidencia, verificar autorización y privacidad | hito de integración/documentación |

## Reproducir
Python 3.12: instalar requirements.txt y ejecutar python entrenar.py. El archivo joblib es candidato, no despliegue productivo.
