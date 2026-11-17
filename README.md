# Sumabasto · APF3

Avance 3 de Innovación y Transformación Digital, Grupo 8. Sumabasto ayuda a los puestos de Merprolima a registrar necesidades y coordinar compras colectivas.

[Abrir Sumabasto en producción](https://merprolima-compras-colectivas.vercel.app/) · [Cuaderno de Google Colab](https://colab.research.google.com/drive/10W32CkSClLiJ_cTWK16Vo0BVO1P0j0o4)

## Mejoras del APF3

- **Coordinación.** Solicitudes reúne el volumen pendiente por fecha y el pronóstico semanal por presentación. «Cómo se calculó» muestra el corte, la cobertura y la versión del modelo. «Preparar propuesta» abre la cotización para revisión.
- **Tienda.** Las recomendaciones usan solicitudes compatibles y el pronóstico del puesto cuando existe historial suficiente. Una reposición sugerida se puede convertir en una necesidad después de revisar su cantidad.
- **Modelo compartido.** Colab y el MVP usan el árbol exportado `sumabasto-apf3-calibrado-v2`. Abarca Cartavio, Costeño, Faraón Azul y Paramonga en presentaciones de 50 kg.
- **Interfaz.** Se renovaron la página de inicio, el acceso común y la navegación de ambos roles. La barra lateral se puede contraer y conserva el icono de Sumabasto. Los reportes cuentan con una vista imprimible para guardar en PDF.

## Evaluación

Las ocho fichas del APF2 orientan el volumen por compra y el intervalo de reposición. El reparto por marca, la anticipación y los retiros son supuestos de la simulación. En 4 736 filas de prueba simulada, el árbol obtuvo un MAE de **0,982 sacos** frente a **1,500 sacos** del promedio móvil. El WAPE fue **109,7 %**. La estimación orienta la revisión y la tienda confirma la cantidad.

La prueba automatizada compara las 32 predicciones de referencia del Colab con la inferencia del navegador. La verificación local también cubrió coordinación, apertura de cotización y recomendación de tienda. El dominio principal sirve la versión calibrada. Queda pendiente repetir el recorrido autenticado en producción.

## Ejecutar y verificar

```sh
npm ci
npm run dev
npm test
npm run build
```

La aplicación usa React, TypeScript, Vite, Tailwind y Supabase. La autenticación exige una membresía activa con puesto y rol. Configura las variables publicables de `.env.example` para conectar el entorno autorizado. En el cliente se utiliza la clave publicable de Supabase.

## Documentación

- [Pronóstico, integración y verificación del APF3](docs/apf3-pronostico-coordinacion.md)
- [Contrato de datos](docs/contrato-datos.md)
- [Arquitectura del piloto en APF2](docs/arquitectura-piloto.md)
- [Estado histórico del MVP en APF2](docs/estado-mvp.md)
