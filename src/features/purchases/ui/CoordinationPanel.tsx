import { Button } from "../../../components/ui/button";
import { ClipboardList, Package, ShoppingBasket } from "lucide-react";
import { dateLabel } from "../../../lib/utils";
import type { Group } from "../domain/model";

export function CoordinationPanel({
  groups,
  onOpen,
  onManage,
}: {
  groups: Group[];
  onOpen: (key: string) => void;
  onManage: () => void;
}) {
  const pending = groups.filter(
    (g) => !g.quote || new Date(g.quote.validUntil) < new Date(),
  );
  return (
    <>
      <section className="hero-panel">
        <div>
          <span className="hero-tag">COORDINACIÓN DE COMPRAS</span>
          <h2>
            Organiza las propuestas
            <br />
            de tu mercado.
          </h2>
          <p>
            Revisa el volumen reunido, registra cotizaciones y mantén las
            condiciones al día para que cada puesto pueda decidir.
          </p>
          <button className="hero-link" onClick={onManage}>
            Gestionar compras →
          </button>
        </div>
      </section>
      <section className="stats">
        <div>
          <span className="stat-icon">
            <ShoppingBasket size={19} />
          </span>
          <p>Compras en coordinación</p>
          <strong>{groups.length.toString().padStart(2, "0")}</strong>
          <small>Agrupaciones activas</small>
        </div>
        <div>
          <span className="stat-icon">
            <ClipboardList size={19} />
          </span>
          <p>Cotizaciones pendientes</p>
          <strong>{pending.length.toString().padStart(2, "0")}</strong>
          <small>Sin cotización o con vigencia vencida</small>
        </div>
        <div>
          <span className="stat-icon">
            <Package size={19} />
          </span>
          <p>Volumen reunido</p>
          <strong>{groups.reduce((sum, g) => sum + g.total, 0)}</strong>
          <small>Sacos solicitados en el mercado</small>
        </div>
      </section>
      {!!pending.length && (
        <section className="white-panel mb-6">
          <h2 className="text-lg font-semibold mb-4">Requieren tu atención</h2>
          <div className="grid gap-3">
            {pending.map((g) => (
              <div
                key={g.key}
                className="flex flex-wrap justify-between items-center gap-3 border-b border-[#e8ece7] pb-3"
              >
                <div>
                  <strong>
                    {g.product.name} · {g.product.brand}
                  </strong>
                  <p className="text-sm muted">
                    {g.total} sacos · {dateLabel(g.date)} ·{" "}
                    {g.quote ? "Cotización vencida" : "Pendiente de cotizar"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpen(g.key)}
                >
                  Gestionar propuesta
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
