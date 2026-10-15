import { requireSupabase } from "../../../infrastructure/supabase/client";
import {
  needSchema,
  quoteSchema,
  groupNeeds,
  signature,
  type Store,
  type NeedInput,
  type QuoteInput,
  type Product,
} from "../domain/model";
import type { ExportPeriod } from "../domain/export";
import type { PurchaseRepository } from "../application/ports";
export class SupabasePurchaseRepository implements PurchaseRepository {
  private snapshot: Store | null = null;
  private async call(action: string, payload: object = {}) {
    const { data, error } = await requireSupabase().rpc("purchase_api", {
      p_action: action,
      p_payload: payload,
    });
    if (error) throw new Error(error.message);
    return data;
  }
  async read(): Promise<Store> {
    const data = await this.call("read");
    if (
      data?.schemaVersion !== 1 ||
      !Array.isArray(data.products) ||
      !Array.isArray(data.needs) ||
      !data.identity
    )
      throw new Error("La respuesta del piloto no es válida");
    this.snapshot = data as Store;
    return this.snapshot;
  }
  async saveNeed(input: NeedInput, _stall: string, id?: string) {
    needSchema.parse(input);
    if (!input.sourceRef?.trim())
      throw new Error("Registra la fuente de la necesidad");
    await this.call("save_need", { ...input, id: id ?? crypto.randomUUID() });
  }
  async withdraw(id: string, _stall: string) {
    await this.call("withdraw", { id });
  }
  async decide(
    groupKey: string,
    _stall: string,
    decision: "confirmed" | "declined",
    qty?: number,
  ) {
    const g = this.currentGroup(groupKey);
    await this.call("decide", {
      productId: g.product.id,
      date: g.date,
      mode: g.mode,
      decision,
      expectedSignature: signature(g),
      ...(qty !== undefined ? { qty } : {}),
    });
  }
  async updateQuote(groupKey: string, input: QuoteInput) {
    quoteSchema.parse(input);
    if (!input.sourceRef?.trim() || !input.supplier?.trim())
      throw new Error("Indica proveedor y fuente de la cotización");
    if (
      !["written_quote", "price_list", "verbal", "simulated"].includes(
        input.evidenceType,
      )
    )
      throw new Error("Selecciona un tipo de evidencia");
    const g = this.currentGroup(groupKey);
    await this.call("quote", {
      ...input,
      productId: g.product.id,
      date: g.date,
      mode: g.mode,
      expectedVersion: g.quote?.version ?? 0,
    });
  }
  async createProduct(product: Omit<Product, "id"> & { sourceRef: string }) {
    await this.call("create_product", product);
  }
  async exportAnalytical(period: ExportPeriod) {
    return this.call("export_analytical", period);
  }
  private currentGroup(key: string) {
    if (!this.snapshot) throw new Error("Recarga los datos antes de continuar");
    const group = groupNeeds(this.snapshot, this.snapshot.products ?? []).find(
      (g) => g.key === key,
    );
    if (group) return group;
    const [origin, productId, date, mode] = key.split("|");
    const product = this.snapshot.products?.find((p) => p.id === productId);
    if (
      !product ||
      origin !== this.snapshot.identity?.origin ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !["delivery", "pickup"].includes(mode)
    )
      throw new Error("El grupo cambió. Recarga los datos");
    return {
      key,
      product,
      date,
      mode,
      origin,
      needs: [],
      total: 0,
    } as import("../domain/model").Group;
  }
}
