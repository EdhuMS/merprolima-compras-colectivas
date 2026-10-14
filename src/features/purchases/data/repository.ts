import { demoSeed } from "./seed";
import {
  needSchema,
  quoteSchema,
  signature,
  comparison,
  groupNeeds,
  type Store,
  type NeedInput,
  type QuoteInput,
} from "../domain/model";
import { products } from "./seed";
const key = "merprolima:demo:v1";
import type { PurchaseRepository } from "../application/ports";
export type { PurchaseRepository } from "../application/ports";
export class LocalDemoRepository implements PurchaseRepository {
  constructor(private readonly makeSeed = demoSeed, private readonly catalog = products, private readonly storageKey = key) {}
  async read(): Promise<Store> {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      const seed = this.makeSeed();
      this.write(seed);
      return seed;
    }
    const store = JSON.parse(raw) as Store;
    if (
      store.schemaVersion !== 1 ||
      !Array.isArray(store.needs) ||
      !Array.isArray(store.quotes) ||
      !Array.isArray(store.participations)
    )
      throw new Error(
        "Los datos locales no son compatibles. Restablece la demo desde Evidencia.",
      );
    return store;
  }
  private write(store: Store) {
    localStorage.setItem(this.storageKey, JSON.stringify(store));
  }
  async saveNeed(input: NeedInput, stall: string, id?: string) {
    needSchema.parse(input);
    const s = await this.read();
    if (id) {
      if (s.needs.some((n) => n.id === id && n.stall !== stall))
        throw new Error("No puedes editar otro puesto");
      const n = s.needs.find((n) => n.id === id && n.stall === stall);
      if (n) Object.assign(n, input);
      else
        s.needs.push({
          ...input,
          id,
          stall,
          status: "open",
          origin: "simulated",
          createdAt: new Date().toISOString(),
        });
    } else {
      s.needs.push({
        ...input,
        id: crypto.randomUUID(),
        stall,
        status: "open",
        origin: "simulated",
        createdAt: new Date().toISOString(),
      });
    }
    this.write(s);
  }
  async withdraw(id: string, stall: string) {
    const s = await this.read();
    const n = s.needs.find((n) => n.id === id && n.stall === stall);
    if (!n) throw new Error("No puedes retirar esta necesidad");
    n.status = "withdrawn";
    this.write(s);
  }
  async decide(
    groupKey: string,
    stall: string,
    decision: "confirmed" | "declined",
  ) {
    const s = await this.read();
    const group = groupNeeds(s, this.catalog).find((g) => g.key === groupKey);
    if (!group || !group.needs.some((n) => n.stall === stall))
      throw new Error("Primero registra una necesidad compatible");
    if (decision === "confirmed" && !comparison(group, stall).eligible)
      throw new Error("La propuesta todavÃ­a no se puede confirmar");
    const sig = signature(group);
    const existing = s.participations.find(
      (p) => p.groupKey === groupKey && p.stall === stall,
    );
    if (existing) {
      existing.status = decision;
      existing.signature = sig;
      existing.createdAt = new Date().toISOString();
    } else
      s.participations.push({
        id: crypto.randomUUID(),
        groupKey,
        stall,
        signature: sig,
        status: decision,
        origin: "simulated",
        createdAt: new Date().toISOString(),
      });
    this.write(s);
  }
  async updateQuote(groupKey: string, input: QuoteInput) {
    quoteSchema.parse(input);
    const s = await this.read();
    const group = groupNeeds(s, this.catalog).find((g) => g.key === groupKey);
    if (!group) throw new Error("Grupo no encontrado");
    if (!group.quote) {
      s.quotes.push({
        ...input,
        id: crypto.randomUUID(),
        productId: group.product.id,
        supplier: input.supplier ?? "DEMO-PROVEEDOR",
        date: group.date,
        mode: group.mode,
        version: 1,
        origin: "simulated",
      });
      this.write(s);
      return;
    }
    Object.assign(s.quotes.find((q) => q.id === group.quote!.id)!, input, {
      version: group.quote.version + 1,
    });
    this.write(s);
  }
  async reset() {
    this.write(this.makeSeed());
  }
}
export const repository = new LocalDemoRepository();
