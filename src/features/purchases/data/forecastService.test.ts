import { describe, expect, it } from "vitest";
import { forecastResponseSchema } from "./forecastService";

const result = {
  schema_version: 1, request_id: "11111111-1111-4111-8111-111111111111",
  product_id: "22222222-2222-4222-8222-222222222222", week: "2026-11-23",
  model_version: "sumabasto-proy-catalogo-24-meses-v1", generated_at: "2026-11-26T10:00:00Z",
  data_origin: "simulated", status: "candidate", baseline: 5, estimate: 4.3,
  operational_quantity: 5, coverage: 1, uncertainty: null,
  uncertainty_reason: "Sin calibración", persisted: true,
};
describe("contrato PROY", () => {
  it("acepta una predicción persistida sin probabilidad inventada", () => {
    expect(forecastResponseSchema.safeParse(result).success).toBe(true);
  });
  it("rechaza versión, probabilidad y persistencia incompatibles", () => {
    for (const patch of [{ model_version: "apf3" }, { uncertainty: 0.9 },
      { persisted: false }, { operational_quantity: 4.3 }, { estimate: null }])
      expect(forecastResponseSchema.safeParse({ ...result, ...patch }).success).toBe(false);
  });
  it("acepta degradación explícita", () => {
    expect(forecastResponseSchema.safeParse({ ...result, status: "fallback", estimate: null }).success).toBe(true);
  });
});
