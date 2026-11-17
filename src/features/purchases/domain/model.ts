import type { ForecastInput } from "./marketForecast";
import { z } from "zod";
export type Origin = "simulated" | "real";
export type Product = {
  id: string;
  name: string;
  brand: string;
  kg: number;
  category: string;
};
export type Need = {
  id: string;
  stall: string;
  productId: string;
  qty: number;
  date: string;
  mode: "delivery" | "pickup";
  status: "open" | "withdrawn";
  origin: Origin;
  createdAt: string;
  participantCount?: number;
  sourceRef?: string;
};
export type Quote = {
  id: string;
  productId: string;
  supplier: string;
  evidenceType?:
    | "written_quote"
    | "price_list"
    | "verbal"
    | "simulated"
    | "unclassified";
  deliveryEstimate?: string | null;
  individual: number;
  collective: number;
  min: number;
  transport: number | null;
  distribution: number | null;
  individualTransport: number | null;
  validUntil: string;
  date: string;
  mode: "delivery" | "pickup";
  version: number;
  origin: Origin;
  payment: string;
  sourceRef?: string;
};
export type Participation = {
  id: string;
  stall: string;
  groupKey: string;
  signature: string;
  status: "confirmed" | "declined" | "pending";
  createdAt: string;
  origin: Origin;
};
export type Store = {
  schemaVersion: 1;
  products?: Product[];
  identity?: { stall: string; role: "buyer" | "coordinator"; origin: Origin };
  groupVersions?: Record<string, string>;
  groupFreight?: Record<string, number>;
  coordinatorDemand?: Need[];
  forecastInputs?: ForecastInput[];
  forecastUnavailable?: boolean;
  needs: Need[];
  quotes: Quote[];
  participations: Participation[];
};
export type Group = {
  key: string;
  product: Product;
  needs: Need[];
  total: number;
  quote?: Quote;
  date: string;
  mode: Need["mode"];
  origin: Origin;
  version?: string;
  serverFreight?: number;
};
export const needSchema = z.object({
  productId: z.string().min(1, "Elige un producto"),
  qty: z
    .number()
    .int("Usa sacos completos")
    .min(1, "Ingresa al menos un saco")
    .max(500, "Máximo 500 sacos por registro"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Indica una fecha")
    .refine(
      (v) =>
        v >=
        new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" }),
      "La fecha no puede estar en el pasado",
    ),
  mode: z.enum(["delivery", "pickup"]),
  sourceRef: z.string().optional(),
});
export type NeedInput = z.infer<typeof needSchema>;
export const quoteSchema = z.object({
  individual: z.number().positive(),
  collective: z.number().positive(),
  min: z.number().int().positive(),
  transport: z.number().nonnegative().nullable(),
  distribution: z.number().nonnegative().nullable(),
  individualTransport: z.number().nonnegative().nullable(),
  validUntil: z
    .string()
    .min(1)
    .refine((v) => !Number.isNaN(Date.parse(v)), "Indica una vigencia válida"),
  evidenceType: z.enum([
    "written_quote",
    "price_list",
    "verbal",
    "simulated",
    "unclassified",
  ]),
  deliveryEstimate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  payment: z.string().min(5),
  sourceRef: z.string().optional(),
  supplier: z.string().optional(),
});
export type QuoteInput = z.infer<typeof quoteSchema>;
export function groupNeeds(store: Store, products: Product[]): Group[] {
  const map = new Map<string, Group>();
  for (const need of store.needs.filter((n) => n.status === "open")) {
    const product = products.find((p) => p.id === need.productId);
    if (!product) continue;
    const key = [need.origin, need.productId, need.date, need.mode].join("|");
    const group = map.get(key) ?? {
      key,
      product,
      needs: [],
      total: 0,
      date: need.date,
      mode: need.mode,
      origin: need.origin,
    };
    group.needs.push(need);
    group.total += need.qty;
    map.set(key, group);
  }
  for (const quote of store.quotes) {
    const key = [quote.origin, quote.productId, quote.date, quote.mode].join(
      "|",
    );
    const product = products.find((p) => p.id === quote.productId);
    if (product && !map.has(key))
      map.set(key, {
        key,
        product,
        needs: [],
        total: 0,
        date: quote.date,
        mode: quote.mode,
        origin: quote.origin,
      });
  }
  return [...map.values()].map((g) => ({
    ...g,
    version: store.groupVersions?.[g.key],
    serverFreight: store.groupFreight?.[g.key],
    quote: store.quotes.find(
      (q) =>
        q.productId === g.product.id &&
        q.date === g.date &&
        q.mode === g.mode &&
        q.origin === g.origin,
    ),
  }));
}
export function limaToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

/** Coordinator inbox: only unexpired need not yet covered by an active participation. */
export function outstandingDemandGroups(
  store: Store,
  products: Product[],
  today = limaToday(),
): Group[] {
  return groupNeeds(store, products)
    .filter((group) => group.date >= today)
    .map((group) => {
      // Supabase already returns an anonymized residual aggregate for coordinators.
      if (group.needs.every((need) => need.stall === "Otros puestos"))
        return group;
      const residualNeeds: Need[] = [];
      const byStall = new Map<string, Need[]>();
      for (const need of group.needs) {
        const list = byStall.get(need.stall) ?? [];
        list.push(need);
        byStall.set(need.stall, list);
      }
      for (const [stall, needs] of byStall) {
        const requested = needs.reduce((sum, need) => sum + need.qty, 0);
        const participation = store.participations.find(
          (item) =>
            item.stall === stall &&
            item.groupKey === group.key &&
            (item.status === "confirmed" || item.status === "pending"),
        );
        const covered = participation ? requested : 0;
        const remaining = Math.max(0, requested - covered);
        if (remaining > 0)
          residualNeeds.push({ ...needs[0], qty: remaining });
      }
      return {
        ...group,
        needs: residualNeeds,
        total: residualNeeds.reduce((sum, need) => sum + need.qty, 0),
      };
    })
    .filter((group) => group.total > 0);
}
export function signature(group: Group) {
  if (group.version) return group.version;
  return JSON.stringify([
    group.quote?.id,
    group.quote?.version,
    group.needs.map((n) => [n.id, n.qty]).sort(),
  ]);
}
export function joiningPreview(
  group: Group,
  stall: string,
  qty: number,
): Group {
  if (group.needs.some((n) => n.stall === stall)) return group;
  const amount = Number.isInteger(qty) && qty >= 1 && qty <= 500 ? qty : 0;
  return {
    ...group,
    total: group.total + amount,
    serverFreight: undefined,
    needs: [
      ...group.needs,
      {
        id: "preview",
        stall,
        productId: group.product.id,
        qty: amount,
        date: group.date,
        mode: group.mode,
        origin: group.origin,
        status: "open",
        createdAt: "",
      },
    ],
  };
}
export function comparison(group: Group, stall: string, now = new Date()) {
  const q = group.quote;
  const qty = group.needs
    .filter((n) => n.stall === stall)
    .reduce((s, n) => s + n.qty, 0);
  if (!q) return { eligible: false, reason: "Falta una cotización", qty };
  if (new Date(q.validUntil) < now)
    return { eligible: false, reason: "Cotización vencida", qty };
  if (group.total < q.min)
    return {
      eligible: false,
      reason: `Faltan ${q.min - group.total} sacos para el precio por volumen`,
      qty,
    };
  if (
    q.transport === null ||
    q.distribution === null ||
    q.individualTransport === null
  )
    return {
      eligible: false,
      reason: "Costos de transporte o reparto por definir",
      qty,
    };
  const round = (n: number) => Math.round(n * 100) / 100;
  const totalCents = Math.round((q.transport + q.distribution) * 100);
  const stalls = [...new Set(group.needs.map((n) => n.stall))].sort();
  const allocations = stalls.map((s) => {
    const units = group.needs
      .filter((n) => n.stall === s)
      .reduce((a, n) => a + n.qty, 0);
    return { stall: s, cents: Math.floor((totalCents * units) / group.total) };
  });
  let residue = totalCents - allocations.reduce((s, a) => s + a.cents, 0);
  for (const a of allocations) {
    if (residue > 0) {
      a.cents++;
      residue--;
    }
  }
  const freight =
    group.serverFreight ??
    (allocations.find((a) => a.stall === stall)?.cents ?? 0) / 100;
  const individual = round(
    q.individual * qty + (qty ? q.individualTransport : 0),
  );
  const collective = round(q.collective * qty + freight);
  return {
    eligible: true,
    reason: "",
    qty,
    individual,
    collective,
    freight,
    difference: round(individual - collective),
    percent:
      individual > 0 ? ((individual - collective) / individual) * 100 : 0,
  };
}
