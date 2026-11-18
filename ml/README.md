# Datos y modelo del APF3

El cuaderno y el script generan los datos simulados, ajustan los modelos y exportan el árbol que ejecuta Sumabasto.

## Archivos

- [Cuaderno ejecutado](APF3_TD_Grupo8_ML_Innovacion.ipynb).
- [Script reproducible](APF3_TD_Grupo8_ML_Innovacion.py).
- [Dependencias](requirements.txt).
- [CSV de prueba semanal](data/sumabasto_prueba_puesto_producto.csv).
- [Eventos simulados que originan la prueba](data/sumabasto_eventos_simulados.csv).

## Qué representan las 4 736 filas

Una fila representa un perfil de puesto, una presentación y una semana. Son ocho perfiles, cuatro presentaciones y 148 semanas evaluables: 8 × 4 × 148 = 4 736. El simulador genera 156 semanas; las primeras ocho aportan los antecedentes de las variables de historial. El CSV incluye semanas con cero sacos y lleva origen=simulado.

La trayectoria de desarrollo usa la semilla 42. La prueba independiente usa la semilla 2027 y se genera después de fijar la configuración. Esta independencia corresponde a dos simulaciones del mismo mecanismo. La evaluación con comercios y cierres reales permanece pendiente.

## Cómo se integra en la aplicación

El entrenamiento exporta los nodos del árbol, sus umbrales, salidas y parámetros de escala. La versión del MVP se encuentra en [tree-four-products.json](../src/features/purchases/domain/tree-four-products.json). [marketForecast.ts](../src/features/purchases/domain/marketForecast.ts) ejecuta ese artefacto con las entradas que devuelve el historial de Supabase.

El CSV es evidencia de evaluación y reproducción. El navegador carga el árbol exportado y recibe por consulta las variables operativas. El [caso de referencia](../src/features/purchases/domain/colab-reference.json) permite comparar 32 salidas de Colab con las del MVP.

Por ello, los ocho perfiles del CSV y los puestos con cobertura en la consulta autenticada corresponden a conjuntos de datos distintos. La pantalla informa su cobertura operativa, que depende del historial disponible.

## Reproducir

En Python 3.12, desde esta carpeta:

```sh
python -m pip install -r requirements.txt
python APF3_TD_Grupo8_ML_Innovacion.py
```

La ejecución crea entrega_sumabasto con los CSV, métricas, gráficos y el modelo exportado. Las columnas prediccion y residual del CSV semanal se generan después del ajuste y se usan exclusivamente para evaluar el resultado. Las entradas del modelo son ultima, media_3, media_8, al_corte y la presentación.
