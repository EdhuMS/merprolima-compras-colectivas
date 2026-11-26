import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { requestForecast, type ServiceForecast as Forecast } from "../data/forecastService";

export function ServiceForecast({ productId, week }: { productId: string; week: string }) {
  const [result, setResult] = useState<Forecast>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true); setError(""); setResult(undefined);
    try { setResult(await requestForecast(productId, week)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Servicio no disponible."); }
    finally { setBusy(false); }
  }
  return <div className="grid gap-2 border-t border-[#dce7dc] pt-3 text-sm">
    <Button variant="outline" disabled={busy} onClick={run}>
      {busy ? "Consultando estimación…" : "Consultar estimación orientativa"}
    </Button>
    {error && <p role="alert">{error} Las solicitudes siguen disponibles.</p>}
    {result && <div role="status" className="grid gap-1">
      <p>Referencia operativa al corte: <strong>{result.baseline} sacos</strong>.</p>
      <p>{result.estimate === null ? "Modelo no disponible; se conserva la referencia al corte."
        : `Estimación orientativa: ${result.estimate.toLocaleString("es-PE", { maximumFractionDigits: 2 })} sacos.`}</p>
      <p className="muted">{result.coverage} puestos con historial. {result.uncertainty_reason}</p>
      <p className="muted">La estimación requiere validación y no reemplaza las solicitudes confirmadas.</p>
    </div>}
  </div>;
}
