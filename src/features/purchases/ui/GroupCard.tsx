import { Wheat, Leaf, Users, ArrowUpRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { money, cn, dateLabel } from "../../../lib/utils";
import { comparison, type Group } from "../domain/model";
export function GroupCard({
  g,
  stall,
  status,
  onOpen,
  isDemo,
}: {
  g: Group;
  stall: string;
  status: (g: Group) => string;
  onOpen: (key: string) => void;
  isDemo: boolean;
}) {
  const c = comparison(g, stall);
  return (
    <article className="group-card" key={g.key}>
      <div className="flex justify-between items-start">
        <span className="product-icon">
          {g.product.category === "Arroz" ? (
            <Wheat size={25} />
          ) : (
            <Leaf size={25} />
          )}
        </span>
        <span
          className={cn("badge", c.eligible ? "badge-green" : "badge-amber")}
        >
          {status(g)}
        </span>
      </div>
      <div className="mt-5">
        <p className="eyebrow">
          {g.product.category} · Saco de {g.product.kg} kg
        </p>
        <h3 className="mt-1 text-xl font-semibold tracking-tight">
          {g.product.name}
        </h3>
        <p className="mt-1 text-sm muted">{g.product.brand}</p>
      </div>
      <div className="mt-6 flex items-end justify-between">
        <div>
          <span className="text-3xl font-semibold tracking-tight">
            {g.total}
          </span>
          <span className="ml-2 text-sm muted">sacos reunidos</span>
        </div>
        <span className="text-xs muted">Meta: {g.quote?.min ?? "—"} sacos</span>
      </div>
      <div className="progress mt-3">
        <div
          style={{
            width: `${Math.min(100, (g.total / (g.quote?.min ?? g.total)) * 100)}%`,
          }}
        />
      </div>
      <div className="mt-5 flex items-center justify-between text-sm muted">
        <span className="flex items-center gap-2">
          <Users size={15} />
          {g.needs.reduce(
            (sum, n, i, arr) =>
              sum +
              (arr.findIndex((x) => x.stall === n.stall) === i
                ? (n.participantCount ?? 1)
                : 0),
            0,
          )}{" "}
          puestos {isDemo ? "de prueba" : "del piloto"}
        </span>
        <span>{dateLabel(g.date)}</span>
      </div>
      <div className="mt-5 pt-4 border-t border-[#e8ece7] flex items-center justify-between">
        <div>
          <p className="text-xs muted">
            Precio por volumen {isDemo ? "simulado" : "cotizado"}
          </p>
          <p className="mt-1 font-semibold">
            {g.quote ? money(g.quote.collective) : "Por cotizar"}{" "}
            <span className="text-xs font-normal muted">/ saco</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onOpen(g.key)}>
          Ver propuesta <ArrowUpRight size={17} />
        </Button>
      </div>
    </article>
  );
}
