import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { requestForecast, type ServiceForecast as Forecast } from "../data/forecastService";
import type { Product } from "../domain/model";

const presentations = [
  ["Cartavio", "Azúcar rubia", 50],
  ["Costeño", "Arroz extra", 50],
  ["Don Vittorio", "Espagueti", 0.5],
  ["Costeño", "Lentejas", 0.5],
] as const;

export function ServiceForecast({ product, week }: { product: Product; week: string }) {
  const [result, setResult] = useState<Forecast>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!presentations.some(([brand, name, kg]) =>
    product.brand === brand && product.name === name && product.kg === kg)) return null;
  async function run() {
    setBusy(true); setError(""); setResult(undefined);
    try { setResult(await requestForecast(product.id, week)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Servicio no disponible."); }
    finally { setBusy(false); }
  }
  return <div className="grid gap-2 border-t border-[#dce7dc] pt-3 text-sm">
    <Button variant="outline" disabled={busy} onClick={run}>
      {busy ? "Consultando estimación…" : "Consultar estimación orientativa"}
    </Button>
    {error && <p role="alert">{error} Las solicitudes siguen disponibles.</p>}
    {result && <div role="status" className="grid gap-1">
      <p>Referencia operativa al corte: <strong>{result.baseline} unidades</strong>.</p>
      <p>{result.estimate === null ? "Modelo no disponible; se conserva la referencia al corte."
        : `Estimación orientativa: ${result.estimate.toLocaleString("es-PE", { maximumFractionDigits: 2 })} unidades.`}</p>
      <p className="muted">{result.coverage} puestos con historial. {result.uncertainty_reason}</p>
      <p className="muted">La estimación requiere validación y no reemplaza las solicitudes confirmadas.</p>
    </div>}
  </div>;
}
