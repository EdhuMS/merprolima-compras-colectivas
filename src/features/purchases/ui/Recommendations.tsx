import { ArrowRight, Package, ShoppingBasket } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { dateLabel, money } from "../../../lib/utils";
import type { Group, Product } from "../domain/model";

export function Recommendations({ items, onOpen, onRegister, shortages, onRegisterSuggested }: {
  items: { group: Group; quantity: number; reason: string }[];
  onOpen: (key: string, quantity: number) => void;
  onRegister: () => void;
  shortages: { product: Product; quantity: number }[];
  onRegisterSuggested: (productId: string, quantity: number) => void;
}) {
  return (
    <section aria-labelledby="recommendations">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 id="recommendations" className="text-2xl font-semibold tracking-tight">Recomendadas para ti</h2>
        <Button variant="outline" onClick={onRegister}>Registrar necesidad</Button>
      </div>
      {items.length || shortages.length ? (
        <ul className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
          {items.slice(0, 4).map(({ group, quantity, reason }) => (
            <li key={group.key} className="flex flex-col items-start rounded-2xl border border-[#dce7dc] bg-white p-5 sm:p-6">
              <span className="mb-4 rounded-xl bg-[#e6f2e9] p-3 text-[#24533c]"><Package size={25} /></span>
              <h3 className="text-xl font-semibold">{group.product.name} {group.product.brand}</h3>
              <p className="mt-1 text-sm muted">{group.product.kg} kg por saco · {reason}</p>
              <dl className="my-5 grid w-full grid-cols-2 gap-3 border-y border-[#e4ebe2] py-4 text-sm">
                <div><dt className="muted">Cantidad sugerida</dt><dd className="text-lg font-semibold">{quantity} sacos</dd></div>
                <div><dt className="muted">{group.mode === "delivery" ? "Entrega" : "Recojo"}</dt><dd className="text-lg font-semibold">{dateLabel(group.date)}</dd></div>
              </dl>
              {group.quote && <p className="mb-4 text-sm">{money(group.quote.collective)} por saco al alcanzar el mínimo</p>}
              <Button className="mt-auto w-full justify-between sm:w-auto" onClick={() => onOpen(group.key, quantity)}>
                Ver compra <ArrowRight size={17} />
              </Button>
            </li>
          ))}
          {shortages.map(({ product, quantity }) => (
            <li className="flex min-w-0 flex-col items-start gap-4 rounded-2xl border border-[#dce7dc] bg-white p-5 sm:p-6" key={product.id}>
              <h3 className="text-lg font-semibold leading-snug tracking-normal">{product.name} {product.brand} · {product.kg} kg</h3>
              <p className="text-sm leading-relaxed">Reposición probable: {quantity} sacos. Aún no hay una compra abierta.</p>
              <Button className="mt-auto w-full sm:w-auto" variant="outline" onClick={() => onRegisterSuggested(product.id, quantity)}>Registrar necesidad</Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-start gap-4 rounded-2xl border border-[#dce7dc] bg-white p-5 sm:p-7">
          <ShoppingBasket size={24} className="shrink-0 text-[#24533c]" />
          <div><h3 className="font-semibold">Aún no hay recomendaciones para tu puesto</h3>
            <p className="mt-1 text-sm muted">Registra lo que necesitas para encontrar compras compatibles.</p></div>
        </div>
      )}
    </section>
  );
}
