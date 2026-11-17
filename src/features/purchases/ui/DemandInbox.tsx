import { useMemo, useState } from "react";
import { ClipboardList, PackageCheck, ArrowUpRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { dateLabel } from "../../../lib/utils";
import type { Group } from "../domain/model";

export function DemandInbox({
  groups,
  onOpen,
}: {
  groups: Group[];
  onOpen: (key: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "new" | "proposed">("all");
  const proposed = groups.filter((group) => !!group.quote).length;
  const total = groups.reduce((sum, group) => sum + group.total, 0);
  const visible = useMemo(
    () =>
      groups.filter((group) =>
        filter === "all"
          ? true
          : filter === "proposed"
            ? !!group.quote
            : !group.quote,
      ),
    [groups, filter],
  );

  return (
    <section className="white-panel">
      <div className="section-heading">
        <div>
          <h2>Demanda pendiente de los clientes</h2>
          <p className="text-sm muted mt-1">
            Cantidades aún sin cubrir, agrupadas por producto, fecha y modalidad.
            Las propuestas se administran en «Gestionar compras».
          </p>
        </div>
        <ClipboardList size={23} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <div className="rounded-xl border border-[#e3e9e2] bg-[#fbfcf9] p-4">
          <small className="muted">Solicitudes abiertas</small>
          <strong className="block text-xl mt-1">{groups.length}</strong>
        </div>
        <div className="rounded-xl border border-[#e3e9e2] bg-[#fbfcf9] p-4">
          <small className="muted">Sacos pendientes</small>
          <strong className="block text-xl mt-1">{total}</strong>
        </div>
        <div className="rounded-xl border border-[#e3e9e2] bg-[#fbfcf9] p-4">
          <small className="muted">Con propuesta publicada</small>
          <strong className="block text-xl mt-1">{proposed}</strong>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5" aria-label="Filtrar demanda">
        {([
          ["all", "Todas", groups.length],
          ["new", "Por atender", groups.length - proposed],
          ["proposed", "Con propuesta", proposed],
        ] as const).map(([id, label, count]) => (
          <Button
            key={id}
            size="sm"
            variant={filter === id ? "default" : "outline"}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label} ({count})
          </Button>
        ))}
      </div>

      {visible.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {visible.map((group) => {
            const participants = group.needs.reduce(
              (count, need) => count + (need.participantCount ?? 1),
              0,
            );
            return (
              <article
                key={group.key}
                className="rounded-2xl border border-[#e3e9e2] bg-white p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#263d32]">
                      {group.product.name}
                    </h3>
                    <p className="text-sm muted mt-1">
                      {group.product.brand} · Saco de {group.product.kg} kg
                    </p>
                  </div>
                  <span
                    className={`badge ${group.quote ? "badge-green" : "badge-amber"}`}
                  >
                    {group.quote ? "Con propuesta" : "Por atender"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-5 mt-5">
                  <div>
                    <small className="muted">Demanda pendiente</small>
                    <strong className="block text-lg mt-1">
                      {group.total} sacos
                    </strong>
                  </div>
                  <div>
                    <small className="muted">Puestos con saldo</small>
                    <strong className="block text-lg mt-1">
                      {participants || group.needs.length}
                    </strong>
                  </div>
                  <div>
                    <small className="muted">Fecha requerida</small>
                    <strong className="block mt-1">{dateLabel(group.date)}</strong>
                  </div>
                  <div>
                    <small className="muted">Modalidad</small>
                    <strong className="block mt-1">
                      {group.mode === "pickup" ? "Recojo" : "Entrega en mercado"}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#edf0eb] mt-5 pt-4">
                  <p className="text-xs muted inline-flex items-center gap-2">
                    {group.quote ? (
                      <PackageCheck size={15} />
                    ) : (
                      <ClipboardList size={15} />
                    )}
                    {group.quote
                      ? "Revisa la propuesta vinculada a esta demanda"
                      : "Define proveedor, precios y condiciones"}
                  </p>
                  <Button size="sm" onClick={() => onOpen(group.key)}>
                    {group.quote ? "Ver propuesta" : "Preparar propuesta"}
                    <ArrowUpRight size={15} />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          {groups.length ? <PackageCheck /> : <ClipboardList />}
          <h3>
            {groups.length
              ? "No hay solicitudes en este filtro"
              : "No hay demanda pendiente"}
          </h3>
          <p>
            {groups.length
              ? "Prueba otra opción para consultar el resto de solicitudes."
              : "Las necesidades activas de los clientes aparecerán aquí cuando tengan saldo pendiente."}
          </p>
        </div>
      )}
    </section>
  );
}
