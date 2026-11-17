import { expect, it } from "vitest";
import { storeForecasts } from "./storeForecast";

it("reproduce los escenarios de Colab y conserva los destinatarios por puesto", () => {
  expect(storeForecasts(0).every(row => !row.qualifies)).toBe(true);
  const sugar = storeForecasts(1).find(row => row.key === "cartavio")!;
  expect(sugar.estimate).toBeCloseTo(24.76, 2);
  expect(sugar.qualifies).toBe(true);
  expect(sugar.forecasts.filter(row => row.estimate >= 1)).toHaveLength(8);
  expect(sugar.forecasts[2].estimate).toBeCloseTo(4.2222222222, 8);
});
