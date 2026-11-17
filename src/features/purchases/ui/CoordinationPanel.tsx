import { Button } from "../../../components/ui/button";
import { dateLabel } from "../../../lib/utils";
import { marketForecasts, type ForecastInput } from "../domain/marketForecast";
import type { Group, Product } from "../domain/model";

const formatter = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });
const shift = (date: string, days: number) =>
  new Date(Date.parse(date) + days * 86400000).toISOString().slice(0, 10);

export function CoordinationPanel({ groups, inputs, products, today, forecastUnavailable, onPrepare }: {
  groups: Group[];
  inputs: ForecastInput[];
  products: Product[];
  today: string;
  forecastUnavailable?: boolean;
  onPrepare: (product: Product, group?: Group) => void;
}) {
  const monday = shift(today, -((new Date(today).getUTCDay() + 6) % 7));
  const nextMonday = shift(monday, 7);
  const forecasts = marketForecasts(products, inputs.filter(row => row.week === monday));
  const opportunities = [
    ...groups.map(group => ({ product: group.product, group })),
    ...forecasts.filter(row => !groups.some(group => group.product.id === row.product.id && group.date < nextMonday))
      .map(row => ({ product: row.product, group: undefined })),
  ];
  const weeksClosed = [...new Set(inputs.filter(row => row.week < monday).map(row => row.week))];
  const closed = weeksClosed.flatMap(week =>
    marketForecasts(products, inputs.filter(row => row.week === week)).flatMap(forecast => {
      const observed = forecast.estimates.filter(row => typeof row.input.actual === "number");
      return observed.length ? [{
        forecast, observed: observed.length,
        estimate: observed.reduce((sum, row) => sum + row.estimate, 0),
        actual: observed.reduce((sum, row) => sum + row.input.actual!, 0),
      }] : [];
    }),
  );

  return (
    <section className="rounded-2xl border border-[#dce7dc] bg-white p-5 sm:p-7">
      <h2 className="text-xl font-semibold">Solicitudes y pronóstico</h2>
      <p className="mt-2 text-sm muted">
        Las solicitudes reflejan el volumen pendiente de cada fecha. El pronóstico estima el cierre de la semana del {dateLabel(monday)}.
      </p>
      {forecastUnavailable && <p className="mt-2 text-sm muted">El pronóstico no está disponible por ahora.</p>}
      {!forecasts.length && !forecastUnavailable && <p className="mt-2 text-sm muted">El pronóstico requiere ocho semanas con solicitudes registradas para el mismo puesto y producto.</p>}
      {!opportunities.length && <p className="mt-2 text-sm muted">No hay solicitudes pendientes.</p>}
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {opportunities.map(({ product, group }) => {
          const forecast = !group || group.date < nextMonday
            ? forecasts.find(row => row.product.id === product.id) : undefined;
          return (
            <li key={group?.key ?? product.id} className="grid content-start gap-3 rounded-xl border border-[#dce7dc] bg-[#f7faf6] p-4">
              <h3 className="font-semibold">{product.name} {product.brand} · {product.kg} kg</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="muted">Solicitudes pendientes</dt>
                  <dd className="font-semibold">{group ? `${group.total} sacos · ${dateLabel(group.date)}` : "Sin solicitudes pendientes"}</dd></div>
                <div><dt className="muted">Pronóstico semanal</dt>
                  <dd className="font-semibold">{forecast ? `${formatter.format(forecast.estimate)} sacos` : "Sin pronóstico para esta fecha"}</dd></div>
              </dl>
              {forecast && <details className="text-sm">
                <summary className="cursor-pointer">Cómo se calculó</summary>
                <p className="mt-2">{forecast.stores} puestos con historial. Corte del lunes {dateLabel(monday)} a las 00:00 en Lima.</p>
                <p className="mt-1 muted">El árbol usa el volumen de la última semana, los promedios de tres y ocho semanas y los sacos registrados al corte. Modelo {forecast.version}.</p>
              </details>}
              <Button className="justify-self-start" variant="outline" onClick={() => onPrepare(product, group)}>{group?.quote ? "Revisar propuesta" : "Preparar propuesta"}</Button>
            </li>
          );
        })}
      </ul>
      <details className="mt-6 border-t border-[#dce7dc] pt-4 text-sm">
        <summary className="cursor-pointer font-semibold">Cierres semanales</summary>
        {closed.length ? <ul className="mt-3 space-y-2">
          {closed.map(({ forecast, observed, estimate, actual }) => (
            <li key={forecast.week + forecast.product.id}>
              {dateLabel(forecast.week)} · {forecast.product.brand} · {formatter.format(estimate)} previstos / {actual} registrados al cierre ({observed} puestos con resultado)
            </li>
          ))}
        </ul> : <p className="mt-2 muted">Todavía no hay cierres comparables. El sistema guarda el resultado cuando termina la semana y hay solicitudes al cierre.</p>}
      </details>
    </section>
  );
}
