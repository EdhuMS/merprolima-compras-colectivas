import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { forecastSimulatedExport } from "../domain/forecast";

export function ForecastPanel() {
  const [file, setFile] = useState<File>();
  const [monday, setMonday] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReturnType<typeof forecastSimulatedExport>>();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(undefined);
    try {
      setResult(forecastSimulatedExport(JSON.parse(await file.text()), monday));
    } catch (e) {
      setError(e instanceof SyntaxError ? "El archivo debe contener JSON válido."
        : e instanceof Error ? e.message : "No se pudo calcular el pronóstico.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="white-panel mt-6" aria-labelledby="forecast-title">
      <h2 id="forecast-title" className="text-xl font-semibold">Pronóstico semanal de solicitudes</h2>
      <p className="muted mt-2">
        Prueba APF3 con un resumen simulado de Faraón Azul de 50 kg en modalidad entrega.
      </p>
      <p className="mt-2 text-sm"><a className="underline" href="/sumabasto-prueba-apf3.json" download>Descargar caso simulado</a> · Lunes del caso: 06/11/2023.</p>
      <div className="form mt-4">
        <label>
          Resumen del mercado (JSON)
          <input type="file" accept=".json,application/json" disabled={busy}
            onChange={event => {
              setFile(event.target.files?.[0]);
              setResult(undefined);
              setError("");
            }} />
        </label>
        <label>
          Lunes de la semana objetivo
          <input type="date" value={monday} disabled={busy}
            onChange={event => {
              setMonday(event.target.value);
              setResult(undefined);
              setError("");
            }} />
        </label>
        <Button type="button" onClick={run} disabled={!file || !monday || busy}>
          {busy ? "Calculando…" : "Calcular pronóstico"}
        </Button>
      </div>
      {error && <p className="error mt-3" role="alert">{error}</p>}
      {result && (
        <div className="mt-4" role="status">
          <p><strong>{result.estimate.toLocaleString("es-PE")} sacos estimados al cierre</strong></p>
          <p>{result.registered} sacos registrados al inicio del lunes.</p>
          <p className="muted mt-2">
            Modelo {result.version} · Datos simulados. Consulta las solicitudes vigentes
            para confirmar el volumen de cada propuesta.
          </p>
        </div>
      )}
    </section>
  );
}
