import { useState } from "react";
import { Button } from "../../../components/ui/button";
import type { ExportPeriod } from "../domain/export";
import { forecastMarketExport } from "../domain/forecast";
import type { Product } from "../domain/model";

function shift(day: string, offset: number) {
  return new Date(Date.parse(day) + offset * 86400000).toISOString().slice(0, 10);
}

export function LiveForecast({ loadReport, products, onPrepare }: {
  loadReport: (period: ExportPeriod) => Promise<unknown>;
  products: Product[];
  onPrepare: (product: Product, date: string) => void;
}) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  const monday = shift(today, -((new Date(today).getUTCDay() + 6) % 7));
  const [result, setResult] = useState<ReturnType<typeof forecastMarketExport>>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [delivery, setDelivery] = useState(today);
  const product = products.find(item => item.id === result?.productId);

  async function calculate() {
    setBusy(true);
    setError("");
    setResult(undefined);
    try {
      // Request a wider period so revisions that move a need outside the
      // four forecast weeks can still supersede its old date.
      const report = await loadReport({ from: shift(monday, -180), to: shift(monday, 186) });
      setResult(forecastMarketExport(report, monday));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo consultar el historial.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="white-panel mb-6">
      <h2 className="text-xl font-semibold">Compras sugeridas</h2>
      <p className="muted mt-2">Pronóstico de Faraón Azul de 50 kg para la semana del {monday}. Datos de presentación.</p>
      <Button className="mt-4" onClick={calculate} disabled={busy}>
        {busy ? "Consultando solicitudes…" : "Calcular con las solicitudes del mercado"}
      </Button>
      {error && <p className="mt-3 muted" role="alert">{error}</p>}
      {result && (
        <div className="form mt-4">
          <p role="status"><strong>{result.estimate.toLocaleString("es-PE")} sacos estimados</strong> · {result.registered} registrados al inicio</p>
          {product && (
            <>
              <label>Fecha de entrega
                <input type="date" min={today} max={shift(monday, 6)} value={delivery}
                  onChange={event => setDelivery(event.target.value)} />
              </label>
              <Button onClick={() => onPrepare(product, delivery)}
                disabled={!delivery || delivery < today || delivery > shift(monday, 6)}>
                Preparar compra
              </Button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
