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
  isCoordinator,
}: {
  isDemo: boolean;
  exportData: (period: ExportPeriod) => void;
  onReset: () => void;
  isCoordinator: boolean;
}) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  const [year, month] = today.split("-").map(Number);
  const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  const [period, setPeriod] = useState<ExportPeriod>({ from: today.slice(0, 7) + "-01", to: monthEnd });
  const [error, setError] = useState("");
  const run = () => {
    try {
      setError("");
      validatePeriod(period);
      exportData(period);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo descargar el reporte",
      );

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
          {isCoordinator
            ? "Consulta los unidades solicitados y el estado de las propuestas para planificar el abastecimiento."
            : "Consulta tus solicitudes y el estado de tu participación para llevar un registro de tus reposiciones."}
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
          <Button onClick={run}><FileDown size={17} /> Abrir reporte para PDF</Button>
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
      {isCoordinator && <FieldRecords />}
    </div>
  );
}
