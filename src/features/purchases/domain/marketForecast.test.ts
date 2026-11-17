import { expect, it } from "vitest";
import { marketForecasts, referenceInputs } from "./marketForecast";
import reference from "./colab-reference.json";

it("reproduce las 32 predicciones de Colab, por presentación y puesto", () => {
  const products = [
    { id: "0", brand: "Cartavio", name: "Azúcar rubia" },
    { id: "1", brand: "Costeño", name: "Arroz extra" },
    { id: "2", brand: "Faraón Azul", name: "Arroz extra añejo" },
    { id: "3", brand: "Paramonga", name: "Azúcar rubia" },
  ].map(product => ({ ...product, kg: 50, category: "" }));
  const forecasts = marketForecasts(products, referenceInputs(products));
  expect(forecasts).toHaveLength(4);
  forecasts.forEach((row, category) => {
    expect(row.stores).toBe(8);
    row.estimates.forEach(({ estimate }, index) =>
      expect(estimate).toBeCloseTo(reference.rows[8 * category + index][4], 12));
  });
  expect(referenceInputs(products, 1).every(input => input.stallIndex === 1)).toBe(true);
});

it("conserva el cierre cero y el cierre sin observación sin inventar cobertura", () => {
  const product = { id: "cartavio", brand: "Cartavio", name: "Azúcar rubia", kg: 50, category: "Azúcar" };
  const [first, second] = referenceInputs([product]);
  expect(marketForecasts([product], [])).toEqual([]);
  const [forecast] = marketForecasts([product], [
    { ...first, features: [0, 0, 0, 0], actual: 0 },
    { ...second, actual: null },
  ]);
  expect(forecast.stores).toBe(2);
  expect(forecast.estimates.map(({ input }) => input.actual)).toEqual([0, null]);
});
