# Sumabasto · APF3

Avance 3 de Innovación y Transformación Digital, Grupo 8. Sumabasto ayuda a los puestos de Merprolima a registrar necesidades y coordinar compras colectivas.

[Abrir demostración de Sumabasto](https://merprolima-compras-colectivas.vercel.app/) · [Cuaderno de Google Colab](https://colab.research.google.com/drive/10W32CkSClLiJ_cTWK16Vo0BVO1P0j0o4)

## Mejoras del APF3

- **Coordinación.** Solicitudes reúne el volumen pendiente por fecha y el pronóstico semanal por presentación. «Cómo se calculó» muestra los sacos registrados al corte, la cobertura y la versión del árbol. «Preparar propuesta» abre la cotización para revisión.
- **Tienda.** Las recomendaciones usan solicitudes compatibles y el pronóstico del puesto cuando existe historial suficiente. Una reposición sugerida se puede convertir en una necesidad después de revisar su cantidad.
- **Modelo compartido.** Colab y el MVP usan el árbol exportado `sumabasto-apf3-calibrado-v2`. Abarca Cartavio, Costeño, Faraón Azul y Paramonga en presentaciones de 50 kg.
- **Interfaz.** Se renovaron la página de inicio, el acceso común y la navegación de ambos roles. La barra lateral se puede contraer y conserva el icono de Sumabasto. Los reportes cuentan con una vista imprimible para guardar en PDF.

## Evaluación

Las ocho fichas del APF2 orientan el volumen por compra y el intervalo de reposición. El reparto por marca, la anticipación y los retiros son supuestos de la simulación. En 4 736 filas de prueba simulada, el árbol obtuvo un MAE de **0,982 sacos** frente a **1,500 sacos** del promedio móvil. Usar los sacos registrados al corte obtuvo **0,555 sacos de MAE** y predecir cero, **0,895**. El árbol se conserva como estimación experimental. La coordinación dispone de los sacos al corte como referencia.

La prueba automatizada compara las 32 predicciones de referencia del Colab con la inferencia del navegador. La verificación local también cubrió coordinación, apertura de cotización y recomendación de tienda. El dominio principal sirve la versión calibrada. La verificación autenticada en producción confirmó la referencia al corte y la apertura de la cotización en coordinación. La cuenta de tienda abrió su panel y consultó el historial; en ese recorrido no apareció una sugerencia nueva.

## Ejecutar y verificar

```sh
npm ci
npm run dev
npm test
npm run build
```

La aplicación usa React, TypeScript, Vite, Tailwind y Supabase. La autenticación exige una membresía activa con puesto y rol. Configura las variables publicables de `.env.example` para conectar el entorno autorizado. En el cliente se utiliza la clave publicable de Supabase.

## Datos y cuaderno del APF3

El [directorio ml](ml/README.md) contiene los dos CSV simulados, el notebook ejecutado, el script y las dependencias. El conjunto de prueba tiene 4 736 filas (8 perfiles × 4 presentaciones × 148 semanas).

## Documentación

- [Pronóstico, integración y verificación del APF3](docs/apf3-pronostico-coordinacion.md)
- [Contrato de datos](docs/contrato-datos.md)
- [Arquitectura del piloto en APF2](docs/arquitectura-piloto.md)
- [Estado histórico del MVP en APF2](docs/estado-mvp.md)


## Carácter académico y reproducibilidad

El proyecto corresponde al APF3 del **Grupo 8**. Los indicadores y resultados del modelo se refieren a datos **simulados**, no a resultados observados en operaciones comerciales reales. Las métricas del modelo deben interpretarse dentro del conjunto y la metodología de evaluación documentados. La aplicación demostrativa y sus servicios externos pueden cambiar con el tiempo.

## Licencia, colaboración y terceros

El **código original del proyecto Sumabasto** se publica bajo la **[licencia MIT](LICENSE)**, con acuerdo del equipo de desarrollo. El desarrollo puede continuar y el licenciamiento de esta versión no implica que todas las funciones estén finalizadas ni aprobadas para uso comercial en producción.

La licencia MIT del código propio no reemplaza las licencias de dependencias, marcas, imágenes, recursos de terceros o datos que tengan condiciones independientes. Los conjuntos simulados y resultados experimentales no representan información real de comerciantes. Para reutilizar cualquier contenido externo, consulta sus condiciones de origen.

