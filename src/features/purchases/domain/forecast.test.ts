import { expect, it } from "vitest";
import example from "../../../../public/sumabasto-prueba-apf3.json";
import { forecastSimulatedExport } from "./forecast";

it("reproduce la inferencia de Colab e ignora un retiro posterior al corte", () => {
  const product = { product_id: "test", mode: "delivery", origin: "simulated" };
  const weeks = ["2023-10-16", "2023-10-23", "2023-10-30"];
  const weekly_needs = weeks.map((week_start, i) => ({
    ...product, week_start, product_name: "Arroz extra añejo", brand: "Faraón Azul",
    kg: 50, requested_package_qty: [16, 20, 27][i], active_stall_count: [3, 4, 5][i],
  }));
  const revision = (revision_id: number, need_id: string, needed_date: string,
    qty: number, occurred_at: string, status = "open") =>
    ({ ...product, revision_id, need_id, needed_date, qty, occurred_at, status });
  const report = {
    schema_version: 2, scope: "market_analytical", data_origin: "simulated",
    period: { from: weeks[0], to: "2023-11-12" }, weekly_needs,
    need_revisions: [
      ...weekly_needs.map((row, i) => revision(i, "past" + i, row.week_start,
        row.requested_package_qty, row.week_start + "T12:00:00Z")),
      revision(3, "target", "2023-11-08", 16, "2023-11-06T04:59:59Z"),
      revision(4, "target", "2023-11-08", 16, "2023-11-06T05:00:00Z", "withdrawn"),
    ],
  };
  expect(forecastSimulatedExport(report, "2023-11-06")).toEqual({
    estimate: 25.6, registered: 16, version: "apf3-v2",
  });
  expect(() => forecastSimulatedExport({ ...report, data_origin: "real" }, "2023-11-06")).toThrow();
  expect(() => forecastSimulatedExport({ ...report, weekly_needs: weekly_needs.slice(1) }, "2023-11-06")).toThrow();
});

it("valida el caso que se descarga desde la interfaz", () => {
  expect(forecastSimulatedExport(example, "2023-11-06")).toEqual({
    estimate: 25.6, registered: 16, version: "apf3-v2",
  });
});