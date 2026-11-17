# APF3 · Pronóstico de reposición en Sumabasto

Versión del modelo: `sumabasto-apf3-calibrado-v2`.

## Datos, calibración y evaluación

La calibración usa ocho fichas de compradores de Merprolima del APF2, Anexo G, Tabla 19. Las declaraciones sitúan las compras habituales entre 4 y 8 sacos cada 7 a 14 días. El generador conserva los rangos por perfil y asigna una presentación por evento. Cartavio, Costeño, Faraón Azul y Paramonga tienen pesos iguales en el escenario base. El registro anticipado (45 %) y el retiro entre solicitudes anticipadas (6 %) también son supuestos y se varían al evaluar sensibilidad.

La unidad de observación es puesto, presentación y semana. El objetivo es `sacos_al_cierre`. Ocho perfiles, cuatro presentaciones y 148 semanas evaluables producen 4 736 filas por trayectoria. La semilla 42 genera los datos para entrenamiento y validación. La 2027 genera la prueba independiente.

| Método | MAE (sacos) | RMSE (sacos) | R² | WAPE |
| --- | ---: | ---: | ---: | ---: |
| Promedio de tres semanas | 1,500 | 2,321 | −0,346 | 167,6 % |
| Ridge | 0,976 | 1,638 | 0,330 | 109,0 % |
| Árbol | 0,982 | 1,644 | 0,325 | 109,7 % |

El árbol se eligió antes de abrir la prueba independiente por su trazabilidad y por la posibilidad de ejecutarlo en el navegador. Reduce el MAE del promedio móvil en 34,6 % en ese escenario. El volumen registrado al corte domina la importancia del árbol. El error relativo acumulado y la proporción de semanas con cero limitan las decisiones automáticas. La evaluación con cierres de comercios sigue pendiente.

## Flujo por rol

1. **Coordinación.** La consulta reconstruye el estado disponible antes del lunes a las 00:00 en Lima. Actualmente se incluyen combinaciones puesto–producto con al menos una solicitud abierta en cada una de las ocho semanas previas. La bandeja presenta de forma independiente los sacos pendientes por fecha y el pronóstico de cierre semanal. «Preparar propuesta» abre la cotización. El mínimo se evalúa con solicitudes y condiciones vigentes.
2. **Tienda.** Se priorizan las compras compatibles con la solicitud registrada. Con historial suficiente se calcula la recomendación para la semana en curso con el mismo árbol de coordinación. Una sugerencia de reposición se puede usar para iniciar el formulario de necesidad.
3. **Cierres.** Coordinación revisa hasta ocho semanas anteriores. Las entradas se conservan por mercado, entorno, puesto, presentación y semana. Los cierres sin observación quedan nulos. Las comparaciones históricas se calculan con el artefacto vigente y sobre puestos con cierre observado.

## Contrato

El MVP procesa objetos con `productId`, `week`, `features` y, cuando se dispone del cierre, `actual`. Las cantidades de `features`, en sacos, se ordenan así:

1. Última semana.
2. Promedio de las tres semanas previas.
3. Promedio de las ocho semanas previas.
4. Suma registrada al corte para la semana objetivo.

El navegador aplica la escala exportada a las cuatro cantidades y agrega la codificación binaria de la presentación. El identificador del puesto se utiliza para delimitar el historial. Las ocho posiciones reservadas del vector para ese identificador permanecen en cero. El árbol devuelve una estimación individual en sacos. Coordinación suma las estimaciones elegibles y muestra su cobertura y versión. En el caso de referencia de Paramonga P08, la entrada `[0, 0, 1.75, 8]` produce `7.53125` sacos.

## Reproducción y estado

- Ejecutar todas las celdas del [cuaderno de Colab](https://colab.research.google.com/drive/10W32CkSClLiJ_cTWK16Vo0BVO1P0j0o4). El cuaderno genera el dataset, el modelo y los JSON `tree-four-products.json` y `colab-reference.json` utilizados por el MVP.
- Ejecutar `npm test` y `npm run build`. Las 30 pruebas pasaron, incluida la comparación de 32 pronósticos con las mismas entradas preparadas en Colab. También se comprobó localmente la apertura de la cotización, la ausencia de historial suficiente y una recomendación de tienda.
- El [dominio principal](https://merprolima-compras-colectivas.vercel.app/) sirve el artefacto calibrado. Queda por comprobar el recorrido autenticado contra registros operativos en producción.
- Para PROY se plantea automatizar los cierres, distinguir ceros confirmados de semanas sin observación, guardar el resultado y versión de cada predicción y evaluar el reentrenamiento cuando exista cobertura suficiente.
