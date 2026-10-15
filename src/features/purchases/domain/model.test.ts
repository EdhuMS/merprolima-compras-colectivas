import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  groupNeeds,
  comparison,
  signature,
  needSchema,
  joiningPreview,
} from "./model";
import { demoSeed, products } from "./test-fixtures";
import { LocalDemoRepository } from "../data/repository";
describe("Reglas de compras colectivas", () => {
  it("previsualiza el pedido nuevo sin alterar el grupo ni reutilizar un reparto anterior", () => {
    const group = groupNeeds(demoSeed(), products)[0];
    group.serverFreight = 999;
    const total = group.total;
    const preview = joiningPreview(group, "NUEVO", 2);
    expect(preview.total).toBe(total + 2);
    expect(group.total).toBe(total);
    expect(group.needs.some((n) => n.stall === "NUEVO")).toBe(false);
    expect(preview.serverFreight).toBeUndefined();
    expect(comparison(preview, "NUEVO").qty).toBe(2);
  });
  it("separa productos y presentaciones", () => {
    const s = demoSeed();
    expect(groupNeeds(s, products).map((g) => g.total)).toEqual([12, 5, 2]);
  });
  it("separa origen, modalidad y fecha", () => {
    const s = demoSeed();
    s.needs[1].origin = "real";
    s.needs[2].mode = "pickup";
    expect(groupNeeds(s, products)).toHaveLength(5);
  });
  it("incluye reparto y transporte en el costo de tres sacos", () => {
    const g = groupNeeds(demoSeed(), products)[0];
    expect(comparison(g, "DEMO-01")).toMatchObject({
      individual: 555,
      collective: 546,
      freight: 9,
      difference: 9,
    });
  });
  it("no aplica precio por volumen sin mínimo", () => {
    expect(
      comparison(groupNeeds(demoSeed(), products)[1], "DEMO-01").eligible,
    ).toBe(false);
  });
  it("permite una diferencia negativa", () => {
    expect(
      comparison(groupNeeds(demoSeed(), products)[2], "DEMO-03").difference,
    ).toBe(-20);
  });
  it("bloquea cotización vencida o gastos desconocidos", () => {
    const g = groupNeeds(demoSeed(), products)[0];
    g.quote!.validUntil = "2020-01-01";
    expect(comparison(g, "DEMO-01").eligible).toBe(false);
    g.quote!.validUntil = "2099-01-01";
    g.quote!.transport = null;
    expect(comparison(g, "DEMO-01").eligible).toBe(false);
  });
  it("asigna exactamente todos los centavos", () => {
    const g = groupNeeds(demoSeed(), products)[0];
    g.quote!.transport = 1;
    g.quote!.distribution = 0;
    expect(
      ["DEMO-01", "DEMO-02", "DEMO-03"].reduce(
        (s, stall) => s + Math.round(comparison(g, stall).freight! * 100),
        0,
      ),
    ).toBe(100);
  });
  it("invalida firma si cambian cantidad o cotización", () => {
    const g = groupNeeds(demoSeed(), products)[0];
    const original = signature(g);
    g.needs[0].qty++;
    expect(signature(g)).not.toBe(original);
  });
  it("rechaza cantidad fraccionaria y fecha pasada", () => {
    expect(
      needSchema.safeParse({
        productId: "rice",
        qty: 1.5,
        date: "2020-01-01",
        mode: "delivery",
      }).success,
    ).toBe(false);
  });
});
describe("Persistencia demo", () => {
  beforeEach(() => {
    const memory = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, v),
    });
  });
  it("conserva edición, impide editar otro puesto y retira del total", async () => {
    const r = new LocalDemoRepository(demoSeed, products);
    const s = await r.read();
    await r.saveNeed({ ...s.needs[0], qty: 6 }, "DEMO-01", "n1");
    expect((await r.read()).needs[0].qty).toBe(6);
    await expect(r.withdraw("n1", "DEMO-02")).rejects.toThrow();
    await r.withdraw("n1", "DEMO-01");
    expect(groupNeeds(await r.read(), products)[0].total).toBe(9);
  });
  it("confirmación repetida no se duplica y detecta cambio", async () => {
    const r = new LocalDemoRepository(demoSeed, products);
    const g = groupNeeds(await r.read(), products)[0];
    await r.decide(g.key, "DEMO-01", "confirmed");
    await r.decide(g.key, "DEMO-01", "confirmed");
    expect((await r.read()).participations).toHaveLength(1);
    await r.updateQuote(g.key, {
      individual: 185,
      collective: 180,
      min: 10,
      transport: 24,
      distribution: 12,
      individualTransport: 0,
      validUntil: "2099-01-01",
      payment: "Pago directo",
      evidenceType: "simulated",
      deliveryEstimate: null,
    });
    const next = await r.read();
    expect(next.participations[0].signature).not.toBe(
      signature(groupNeeds(next, products)[0]),
    );
  });
  it("exige cantidad al sumarse y deja pendiente el pedido sin volumen suficiente", async () => {
    const r = new LocalDemoRepository(demoSeed, products);
    const groups = groupNeeds(await r.read(), products);
    await expect(
      r.decide(groups[0].key, "DEMO-04", "confirmed"),
    ).rejects.toThrow();
    await r.decide(groups[1].key, "DEMO-01", "confirmed");
    expect((await r.read()).participations[0].status).toBe("pending");
  });
  it("permite sumarse sin necesidad previa y evita duplicar el pedido al repetir", async () => {
    const r = new LocalDemoRepository(demoSeed, products);
    const group = groupNeeds(await r.read(), products)[0];
    await r.decide(group.key, "NUEVO-CLIENTE", "confirmed", 2);
    await r.decide(group.key, "NUEVO-CLIENTE", "confirmed", 2);
    const store = await r.read();
    expect(store.needs.filter((n) => n.stall === "NUEVO-CLIENTE")).toHaveLength(
      1,
    );
    expect(
      store.participations.filter((p) => p.stall === "NUEVO-CLIENTE"),
    ).toHaveLength(1);
    expect(store.participations[0].status).toBe("confirmed");
  });
  it("conserva la compra publicada aunque todavía nadie haya solicitado sacos", () => {
    const store = demoSeed();
    store.needs = [];
    const groups = groupNeeds(store, products);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every((g) => g.total === 0 && !!g.quote)).toBe(true);
  });
});
