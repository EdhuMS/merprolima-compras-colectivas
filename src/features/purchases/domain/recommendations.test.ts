import { expect, it } from "vitest";
import { groupNeeds, type Store, type Product } from "./model";
import { recommendPurchases } from "./recommendations";

it("recomienda con el historial del puesto y excluye las solicitudes ajenas", () => {
  const product: Product = { id: "cartavio", name: "Azúcar rubia", brand: "Cartavio", kg: 50, category: "Azúcar" };
  const store: Store = {
    schemaVersion: 1, participations: [],
    needs: [{ id: "previous", stall: "P01", productId: product.id, qty: 5,
      date: "2026-09-14", mode: "delivery", status: "open", origin: "simulated",
      createdAt: "2026-09-13T14:00:00Z" }],
    quotes: [{ id: "quote", productId: product.id, date: "2026-11-12", mode: "delivery",
      origin: "simulated", supplier: "Proveedor", individual: 190, collective: 185,
      min: 20, transport: 0, distribution: 0, individualTransport: 0, payment: "Al recibir",
      validUntil: "2026-11-13T00:00:00Z", version: 1 }],
  };
  const groups = groupNeeds(store, [product]);
  expect(recommendPurchases(groups, store.needs, "P01", "2026-11-11")[0].reason)
    .toBe("Según tus reposiciones recientes");
  expect(recommendPurchases(groups, store.needs, "P02", "2026-11-11")).toEqual([]);
  const sameDate = { ...store.needs[0], date: "2026-11-12", qty: 4 };
  expect(recommendPurchases(groups, [sameDate], "P01", "2026-11-11")[0].quantity).toBe(4);
});
