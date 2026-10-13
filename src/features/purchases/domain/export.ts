import type { Store } from "./model";
export type ExportPeriod = { from: string; to: string };
export function validatePeriod(period: ExportPeriod) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(period.from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(period.to) ||
    period.from > period.to
  )
    throw new Error("Indica un periodo válido: inicio igual o anterior al fin");
}
export function createSnapshotExport(
  store: Store,
  period: ExportPeriod,
  demo: boolean,
) {
  validatePeriod(period);
  const inside = (d: string) => d >= period.from && d <= period.to;
  const needs = store.needs
    .filter((n) => inside(n.date))
    .map((n) => ({
      id: n.id,
      product_id: n.productId,
      quantity: n.qty,
      needed_date: n.date,
      mode: n.mode,
      status: n.status,
      origin: n.origin,
      created_at: n.createdAt,
      scope: demo
        ? "simulated_record"
        : n.stall === "Otros puestos"
          ? "aggregate"
          : "own",
      participant_count: n.participantCount ?? 1,
    }));
  const quotes = store.quotes
    .filter((q) => inside(q.date))
    .map((q) => ({
      id: q.id,
      product_id: q.productId,
      needed_date: q.date,
      mode: q.mode,
      origin: q.origin,
      individual: q.individual,
      collective: q.collective,
      minimum_qty: q.min,
      transport: q.transport,
      distribution: q.distribution,
      individual_transport: q.individualTransport,
      valid_until: q.validUntil,
      version: q.version,
      evidence_type: q.evidenceType ?? (demo ? "simulated" : "unclassified"),
      delivery_estimate: q.deliveryEstimate ?? null,
    }));
  const productIds = new Set([
    ...needs.map((n) => n.product_id),
    ...quotes.map((q) => q.product_id),
  ]);
  const participations = store.participations
    .filter((p) => inside(p.groupKey.split("|")[2]))
    .map((p) => ({
      id: p.id,
      group_key: p.groupKey,
      version_signature: p.signature,
      status: p.status,
      created_at: p.createdAt,
      origin: p.origin,
    }));
  return {
    schema_version: 2,
    scope: demo ? "demo_workspace" : "own_and_aggregates",
    data_origin: demo ? "simulated" : store.identity?.origin,
    exported_at: new Date().toISOString(),
    period,
    basis: "needed_date",
    products: (store.products ?? []).filter((p) => productIds.has(p.id)),
    needs,
    quotes,
    participations,
    note: "Sin nombres, contactos ni texto libre de fuentes/pago. No acredita compra, entrega o ahorro. Los agregados no constituyen una serie histórica completa.",
  };
}
