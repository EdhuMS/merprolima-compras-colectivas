import { z } from "zod";

const day = z.string().date();
const stamp = z.string().datetime({ offset: true });
const count = z.number().int().nonnegative();
const snapshotSchema = z.object({
  schema_version: z.literal(2),
  scope: z.literal("market_analytical"),
  data_origin: z.literal("simulated"),
  period: z.object({ from: day, to: day }),
  weekly_needs: z.array(z.object({
    week_start: day, product_id: z.string(), product_name: z.string(),
    brand: z.string(), kg: z.number(), mode: z.string(), origin: z.string(),
    requested_package_qty: count, active_stall_count: count,
  })),
  need_revisions: z.array(z.object({
    revision_id: count, need_id: z.string(), product_id: z.string(),
    needed_date: day, qty: count, status: z.enum(["open", "withdrawn"]),
    mode: z.string(), origin: z.string(), occurred_at: stamp,
  })),
});

const addDays = (date: string, days: number) =>
  new Date(Date.parse(date) + days * 86_400_000).toISOString().slice(0, 10);
const limaMidnight = (date: string) => Date.parse(date + "T00:00:00-05:00");
const normalized = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function forecastSimulatedExport(input: unknown, monday: string) {
  const { productId: _, ...forecast } = forecastMarketExport(input, monday);
  return forecast;
}

export function forecastMarketExport(input: unknown, monday: string) {
  const parsed = snapshotSchema.safeParse(input);
  if (!parsed.success) throw new Error("Usa un resumen analítico simulado de Sumabasto (versión 2).");
  if (!day.safeParse(monday).success || new Date(monday).getUTCDay() !== 1)
    throw new Error("Selecciona el lunes de la semana a pronosticar.");
  const data = parsed.data;
  const first = addDays(monday, -21);
  if (data.period.from > first || data.period.to < addDays(monday, 6))
    throw new Error("El reporte debe cubrir las tres semanas previas y toda la semana objetivo.");
  const productIds = new Set(data.weekly_needs.filter(row =>
    row.origin === "simulated" && row.mode === "delivery" && row.kg === 50 &&
    normalized(row.brand) === "faraon azul" && normalized(row.product_name).includes("extra anejo"),
  ).map(row => row.product_id));
  if (productIds.size !== 1)
    throw new Error("El reporte debe identificar una sola presentación de arroz extra añejo Faraón Azul de 50 kg para entrega.");
  const product = [...productIds][0];
  const revisions = data.need_revisions
    .filter(row => row.origin === "simulated")
    .sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at) || a.revision_id - b.revision_id);
  const asOf = (start: string, end: string, cut: string) => {
    const latest = new Map<string, (typeof revisions)[number]>();
    for (const row of revisions) {
      if (Date.parse(row.occurred_at) >= limaMidnight(cut)) break;
      latest.set(row.need_id, row);
    }
    return [...latest.values()].filter(row =>
      row.product_id === product && row.mode === "delivery" && row.status === "open" &&
      row.needed_date >= start && row.needed_date < end,
    ).reduce((sum, row) => sum + row.qty, 0);
  };
  const previous = [first, addDays(first, 7), addDays(first, 14)].map(start => {
    const rows = data.weekly_needs.filter(row =>
      row.week_start === start && row.product_id === product &&
      row.origin === "simulated" && row.mode === "delivery",
    );
    const end = addDays(start, 7);
    const total = asOf(start, end, end);
    if (rows.length !== 1 || rows[0].requested_package_qty !== total)
      throw new Error("Falta historial verificable de una semana previa o el resumen cambió después del cierre.");
    return { total, stalls: rows[0].active_stall_count };
  });
  const registered = asOf(monday, addDays(monday, 7), monday);
  const average = Math.round(previous.reduce((sum, week) => sum + week.total, 0) / 3 * 1000) / 1000;
  const last = previous[2];
  // Coeficientes de Ridge con StandardScaler incorporado, exportados desde Colab.
  const raw = 27.82637909045892 - 0.15924022825077927 * last.total
    - 0.07193673125997316 * average - 0.4446946131330254 * last.stalls
    + 0.36306992125082277 * registered;
  return {
    estimate: Math.round(Math.max(0, raw) * 10) / 10, registered,
    version: "apf3-v2", productId: product,
  };
}
