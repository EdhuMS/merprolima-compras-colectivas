import { useState } from "react";
import { validatePeriod, type ExportPeriod } from "../domain/export";
import { FileDown, CalendarRange } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { MarketReferences } from "../../field/ui/MarketReferences";
import { FieldRecords } from "../../field/ui/FieldRecords";
export function EvidencePanel({
  isDemo,
  exportData,
  onReset,
  canExportAnalytical,
}: {
  isDemo: boolean;
  exportData: (period: ExportPeriod, analytical?: boolean) => Promise<void>;
  onReset: () => void;
  canExportAnalytical: boolean;
  origin: "real" | "simulated";
}) {
  const [period, setPeriod] = useState<ExportPeriod>({
    from: "2026-10-01",
    to: "2026-10-31",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (analytical = false) => {
    try {
      setError("");
      validatePeriod(period);
      setBusy(true);
      await exportData(period, analytical);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo descargar el reporte",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <section className="white-panel">
        <span className="product-icon">
          <CalendarRange />
        </span>
        <h2 className="mt-4 text-xl font-semibold">Resumen por periodo</h2>
        <p className="muted mt-2">
          Selecciona las fechas de reposición que deseas consultar.
        </p>
        <div className="form mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label>
              Desde
              <input
                type="date"
                value={period.from}
                onChange={(e) => setPeriod({ ...period, from: e.target.value })}
              />
            </label>
            <label>
              Hasta
              <input
                type="date"
                value={period.to}
                onChange={(e) => setPeriod({ ...period, to: e.target.value })}
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </div>
        <div className="report-actions">
          <Button disabled={busy} onClick={() => run()}>
            <FileDown size={17} />
            {busy ? "Preparando…" : "Descargar mis registros"}
          </Button>
          {canExportAnalytical && (
            <Button variant="outline" disabled={busy} onClick={() => run(true)}>
              Resumen del mercado
            </Button>
          )}
        </div>
        {isDemo && (
          <details className="mt-6 text-sm muted">
            <summary className="cursor-pointer">Opciones del espacio</summary>
            <Button className="mt-3" variant="outline" onClick={onReset}>
              Reiniciar espacio
            </Button>
          </details>
        )}
      </section>
      <MarketReferences />
      {canExportAnalytical && <FieldRecords />}
    </div>
  );
}
