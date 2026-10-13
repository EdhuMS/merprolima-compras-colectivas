import { useState } from "react";
import { validatePeriod, type ExportPeriod } from "../domain/export";
import { PrivacyNotice } from "../../privacy/ui/PrivacyNotice";
import { FlaskConical, Download, ArrowUpRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
export function EvidencePanel({
  isDemo,
  exportData,
  onReset,
  canExportAnalytical,
  origin,
}: {
  isDemo: boolean;
  exportData: (period: ExportPeriod, analytical?: boolean) => Promise<void>;
  canExportAnalytical: boolean;
  origin: "real" | "simulated";
  onReset: () => void;
}) {
  const [period, setPeriod] = useState<ExportPeriod>({
    from: "2026-10-01",
    to: "2026-10-31",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const runExport = async (analytical = false) => {
    try {
      setError("");
      validatePeriod(period);
      setBusy(true);
      await exportData(period, analytical);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo exportar");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="evidence-grid">
      <section className="white-panel">
        <span className="product-icon">
          <FlaskConical />
        </span>
        <h2 className="mt-5">
          {isDemo
            ? "Una demo, sin evidencia inventada."
            : "Piloto con fuentes identificadas."}
        </h2>
        <p className="muted mt-3 leading-7">
          {isDemo
            ? "Los puestos, proveedores y condiciones de esta demo son ficticios. No son entrevistas, cotizaciones del mercado ni ahorros obtenidos."
            : "Este entorno conserva registros en Supabase y permite consultar cantidades agregadas de otros puestos. La fuente de cada captura debe verificarse; no se considera evidencia de entrevistas realizadas por el solo hecho de guardarla."}
        </p>
        <div className="evidence-row">
          <span>Procedencia</span>
          <strong>{isDemo ? "Simulada" : "Según entorno asignado"}</strong>
        </div>
        <div className="evidence-row">
          <span>Persistencia actual</span>
          <strong>{isDemo ? "Este navegador" : "Supabase"}</strong>
        </div>
        <div className="evidence-row">
          <span>Supabase</span>
          <strong>Conectado · acceso por cuenta</strong>
        </div>
        <div className="evidence-row">
          <span>Entrevistas y cotizaciones</span>
          <strong>Pendientes de campo</strong>
        </div>
        <div className="form mt-5">
          <p>
            Periodo por fecha deseada de reposición. La exportación omite
            contactos y texto libre.
          </p>
          <div className="grid grid-cols-2 gap-4">
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
        <div className="flex flex-wrap gap-3 mt-6">
          <Button variant="outline" disabled={busy} onClick={() => runExport()}>
            <Download size={16} />
            Exportar datos {isDemo ? "demo" : "del piloto"}
          </Button>
          {canExportAnalytical && (
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => runExport(true)}
            >
              Exportar análisis del mercado (
              {origin === "real" ? "real" : "simulado"})
            </Button>
          )}
          <Button variant="ghost" disabled={!isDemo} onClick={onReset}>
            Restablecer demo
          </Button>
        </div>
      </section>
      <section className="white-panel">
        <h2>Referencias para los supuestos</h2>
        <p className="muted mt-3 text-sm leading-6">
          Consultadas el 12/10/2026. Son referencias públicas; no confirman
          precios ni descuentos en Merprolima.
        </p>
        <a
          className="source-link"
          href="https://www.deperu.com/mercados/mercado-productores-merprolima_los-olivos_1573.html"
          target="_blank"
          rel="noreferrer"
        >
          DePerú · ubicación y mercado mixto
          <ArrowUpRight size={16} />
        </a>
        <a
          className="source-link"
          href="https://agroindustriasbadel.com/"
          target="_blank"
          rel="noreferrer"
        >
          Badel · arroz en sacos de 49 kg
          <ArrowUpRight size={16} />
        </a>
        <a
          className="source-link"
          href="https://www.tualiadomayorista.com/abarrotes/arroz-y-legumbres/azucar-rubia-domestica-paramonga-50kg/"
          target="_blank"
          rel="noreferrer"
        >
          Tu Aliado Mayorista · azúcar de 50 kg
          <ArrowUpRight size={16} />
        </a>
        <h3 className="font-semibold mt-7">Cómo incorporar datos reales</h3>
        <p className="muted text-sm leading-6 mt-2">
          Conservar el producto y presentación exactos, registrar la fuente y su
          permiso, y capturar precios, mínimos y gastos. Los datos reales se
          cargarán en el piloto de Supabase después de verificar su procedencia.
        </p>
        <PrivacyNotice />
      </section>
    </div>
  );
}
