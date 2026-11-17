import type { Group, Need } from "./model";
import { predictProduct, productCategory, type ForecastInput } from "./marketForecast";

const shift = (day: string, offset: number) =>
  new Date(Date.parse(day) + offset * 86400000).toISOString().slice(0, 10);
export function recommendPurchases(groups: Group[], needs: Need[], stall: string, today: string, inputs?: ForecastInput[]) {
  const monday = shift(today, -((new Date(today).getUTCDay() + 6) % 7));
  const first = shift(monday, -56);
  const cut = Date.parse(monday + "T00:00:00-05:00");
  return groups.flatMap(group => {
    if (!group.quote || group.date < today || Date.parse(group.quote.validUntil) <= Date.parse(today + "T00:00:00-05:00")) return [];
    if (productCategory(group.product) < 0 || group.date >= shift(monday, 7)) return [];
    const own = needs.filter(need => need.stall === stall && need.productId === group.product.id);
    const current = own.filter(need => need.status === "open");
    const sum = (start: string, end: string) => current
      .filter(need => need.date >= start && need.date < end)
      .reduce((total, need) => total + need.qty, 0);
    const registered = current.filter(need => need.date === group.date && need.mode === group.mode)
      .reduce((total, need) => total + need.qty, 0);
    if (registered) return [{ group, quantity: registered, reason: "Coincide con tu solicitud registrada" }];
    if (inputs) {
      const input = inputs.find(row => row.productId === group.product.id && row.week === monday);
      const estimate = input && predictProduct(group.product, input);
      return estimate !== undefined && estimate >= 1
        ? [{ group, quantity: Math.round(estimate), reason: "Según tus reposiciones recientes" }]
        : [];
    }
    if (!own.some(need => need.date <= first && Date.parse(need.createdAt) < cut)) return [];
    const atCut = current.filter(need => need.date >= monday && need.date < shift(monday, 7) &&
      Date.parse(need.createdAt) < cut).reduce((total, need) => total + need.qty, 0);
    const quantity = Math.round(predictProduct(group.product, {
      productId: group.product.id, week: monday,
      features: [sum(shift(monday, -7), monday), sum(shift(monday, -21), monday) / 3,
        sum(first, monday) / 8, atCut],
    }) ?? 0);
    return quantity >= 1 ? [{ group, quantity, reason: "Según tus reposiciones recientes" }] : [];
  }).sort((a, b) => b.quantity - a.quantity || a.group.date.localeCompare(b.group.date));
}
