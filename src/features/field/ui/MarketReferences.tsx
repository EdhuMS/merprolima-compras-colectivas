import { marketReferences } from "../data/marketReferences";
export function MarketReferences() {
  return (
    <section className="white-panel mt-6">
      <h2 className="text-xl font-semibold">Precios de referencia</h2>
      <p className="muted mt-3 leading-6">
        Precios por saco consultados el 13/10/2026. Abre la referencia del
        proveedor para revisar sus condiciones.
      </p>
      <div className="overflow-x-auto mt-5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="p-2">Producto</th>
              <th className="p-2">Unidad</th>
              <th className="p-2">Por mayor</th>
              <th className="p-2">Fuente</th>
            </tr>
          </thead>
          <tbody>
            {marketReferences.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">
                  {r.product} · {r.kg} kg
                </td>
                <td className="p-2">S/ {r.retail.toFixed(2)}</td>
                <td className="p-2">
                  {r.wholesale === null
                    ? "No diferenciado"
                    : "S/ " + r.wholesale.toFixed(2)}
                </td>
                <td className="p-2">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {r.supplier}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm mt-4">
        Confirma disponibilidad, mínimo de compra y costos de entrega con el
        proveedor.
      </p>
    </section>
  );
}
