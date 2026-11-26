import { useState } from "react";
import { Check, ShoppingBasket } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { dateLabel } from "../../../lib/utils";
import {
  signature,
  type Group,
  type Participation,
  type Product,
} from "../domain/model";

export function ParticipationsPanel({
  participations,
  groups,
  products,
  stall,
  today,
  onOpen,
  onBrowse,
}: {
  participations: Participation[];
  groups: Group[];
  products: Product[];
  stall: string;
  today: string;
  onOpen: (key: string) => void;
  onBrowse: () => void;
}) {
  const [filter, setFilter] = useState<
    "active" | "history"
  >("active");
  const entries = participations
    .filter((p) => p.stall === stall && p.status !== "declined")
    .map((p) => {
      const group = groups.find((g) => g.key === p.groupKey);
      const [, productId, date, mode] = p.groupKey.split("|");
      const expired =
        !!group?.quote && new Date(group.quote.validUntil) < new Date();
      const historical = date < today || expired || !group;
      const state =
        p.status === "pending" ||
        !group ||
        expired ||
        signature(group) !== p.signature
          ? "review"
          : "confirmed";
      return {
        p,
        group,
        product: products.find((x) => x.id === productId),
        date,
        mode,
        state,
        historical,
        label: historical && p.status === "confirmed"
          ? "Confirmada en su fecha"
          : historical && date < today ? "Fecha pasada sin confirmación"
          : !group
          ? "Compra sin necesidades activas"
          : expired
            ? "Propuesta vencida"
            : p.status === "pending"
              ? "Pedido pendiente de confirmación"
              : state === "review"
                ? "Requiere nueva confirmación"
                : "Participación confirmada",
      };
    })
    .sort((a, b) => b.p.createdAt.localeCompare(a.p.createdAt));
  const visible = entries.filter((e) => filter === "history" ? e.historical : !e.historical);
  return (
    <section className="white-panel">
      <div className="section-heading">
        <div>
          <h2>Mis participaciones</h2>
          <p className="text-sm muted mt-1">
            Consulta tus decisiones y revisa las condiciones cuando cambien.
          </p>
        </div>
        <Check size={23} />
      </div>
      <div
        className="flex flex-wrap gap-2 mb-6"
        aria-label="Filtrar participaciones"
      >
        {(
          [
            { id: "active", label: "Vigentes" },
            { id: "history", label: "Historial" },
          ] as const
        ).map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label} (
            {entries.filter((e) => f.id === "history" ? e.historical : !e.historical).length})
          </Button>
        ))}
      </div>
      <div className="grid gap-4">
        {visible.map(({ p, group, product, date, mode, state, historical, label }) => (
          <article
            key={p.id}
            className="rounded-2xl border border-[#e3e9e2] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">
                  {product?.name ?? "Compra colectiva"}
                </h3>
                <p className="text-sm muted mt-1">
                  {product?.brand} {product ? `· ${product.kg} kg · ` : ""}
                  {dateLabel(date)} ·{" "}
                  {mode === "pickup" ? "Recojo" : "Entrega en mercado"}
                </p>
              </div>
              <span
                className={`badge ${state === "confirmed" ? "badge-green" : "badge-neutral"}`}
              >
                {label}
              </span>
            </div>
            {group && (
              <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
                <p className="text-sm muted">
                  Tu participación:{" "}
                  {group.needs
                    .filter((n) => n.stall === stall)
                    .reduce((sum, n) => sum + n.qty, 0)}{" "}
                  unidades · Volumen reunido: {group.total} unidades
                </p>
                {!historical && <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpen(group.key)}
                >
                  Ver participación
                </Button>}
              </div>
            )}
          </article>
        ))}
      </div>
      {!visible.length && (
        <div className="empty">
          <ShoppingBasket />
          <h3>
            {entries.length
              ? "No hay participaciones en este estado"
              : "Aún no has participado en una compra"}
          </h3>
          <p>
            Revisa las compras disponibles y confirma la propuesta que te
            convenga.
          </p>
          <Button onClick={onBrowse}>Explorar compras</Button>
        </div>
      )}
    </section>
  );
}
