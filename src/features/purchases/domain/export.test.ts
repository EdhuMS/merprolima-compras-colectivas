import { describe, it, expect, beforeEach, vi } from "vitest";
import { createSnapshotExport, validatePeriod } from "./export";
import { quoteSchema, groupNeeds, comparison, signature } from "./model";
import { demoSeed, products } from "../data/seed";
import { LocalDemoRepository } from "../data/repository";
describe("Cierre APF2", () => {
  const period = { from: "2026-10-01", to: "2026-10-31" };
  it("filtra fecha deseada y omite fuente, proveedor, correo y pago libres", () => {
    const s = demoSeed();
    s.products = products;
    s.quotes[0].supplier = "PRIVATE";
    s.quotes[0].sourceRef = "PRIVATE";
    s.quotes[0].payment = "PRIVATE";
    const output = createSnapshotExport(s, period, true);
    expect(JSON.stringify(output)).not.toContain("PRIVATE");
    expect(output.data_origin).toBe("simulated");
    expect(
      createSnapshotExport(s, { from: "2099-01-01", to: "2099-01-31" }, true)
        .needs,
    ).toHaveLength(0);
  });
  it("rechaza periodo invertido", () =>
    expect(() =>
      validatePeriod({ from: "2026-10-31", to: "2026-10-01" }),
    ).toThrow());
  it("conserva null y bloquea confirmación con gasto desconocido", () => {
    const q = demoSeed().quotes[0];
    const input = {
      ...q,
      evidenceType: "simulated",
      deliveryEstimate: null,
      transport: null,
    };
    expect(quoteSchema.parse(input).transport).toBeNull();
    const s = demoSeed();
    s.quotes[0].transport = null;
    expect(comparison(groupNeeds(s, products)[0], "DEMO-01").eligible).toBe(
      false,
    );
  });
  it("rechaza entrega con formato inválido", () =>
    expect(
      quoteSchema.safeParse({
        ...demoSeed().quotes[0],
        evidenceType: "simulated",
        deliveryEstimate: "mañana",
      }).success,
    ).toBe(false));
  it("mantiene UUID en reintento de nueva necesidad y una sola fila", async () => {
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => mem.set(k, v),
    });
    const r = new LocalDemoRepository();
    const before = await r.read();
    const input = {
      productId: products[0].id,
      qty: 3,
      date: "2099-01-01",
      mode: "delivery" as const,
    };
    await r.saveNeed(input, "DEMO-01", "retry-id");
    await r.saveNeed(input, "DEMO-01", "retry-id");
    expect((await r.read()).needs).toHaveLength(before.needs.length + 1);
    await expect(r.saveNeed(input, "DEMO-02", "retry-id")).rejects.toThrow(
      "otro puesto",
    );
    vi.unstubAllGlobals();
  });
  it("un cambio de entrega invalida la firma de cotización", async () => {
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => mem.set(k, v),
    });
    const r = new LocalDemoRepository();
    const g = groupNeeds(await r.read(), products)[0];
    const before = signature(g);
    await r.updateQuote(g.key, {
      ...g.quote!,
      evidenceType: "simulated",
      deliveryEstimate: "2099-01-01",
    });
    expect(signature(groupNeeds(await r.read(), products)[0])).not.toBe(before);
    vi.unstubAllGlobals();
  });
});
