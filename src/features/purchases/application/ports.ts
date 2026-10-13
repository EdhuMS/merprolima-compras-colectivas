import type { Store, NeedInput, QuoteInput, Product } from "../domain/model";
export interface PurchaseRepository {
  read(): Promise<Store>;
  saveNeed(input: NeedInput, stall: string, id?: string): Promise<void>;
  withdraw(id: string, stall: string): Promise<void>;
  decide(
    groupKey: string,
    stall: string,
    decision: "confirmed" | "declined",
  ): Promise<void>;
  updateQuote(groupKey: string, input: QuoteInput): Promise<void>;
  reset?(): Promise<void>;
  createProduct?(
    product: Omit<Product, "id"> & { sourceRef: string },
  ): Promise<void>;
}
