import { useQuery } from "@tanstack/react-query";
import { readFieldInterviews } from "../data/repository";
export function FieldRecords() {
  const q = useQuery({
    queryKey: ["private-field-records"],
    queryFn: readFieldInterviews,
  });
  if (!q.data?.length) return null;
  return (
    <section className="white-panel m-5">
      <details>
        <summary className="font-semibold cursor-pointer">
          Reposición del mercado · {q.data.length} puestos
        </summary>
        <p className="my-3">
          Cantidades generales de reposición, ajustables según la venta de cada
          marca.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {q.data.map((r) => (
            <article key={r.id} className="border rounded-lg p-4">
              <h3 className="font-semibold">
                {r.id} · {r.receipt} · Interés: {r.willingness}
              </h3>
              <p className="whitespace-pre-line text-sm mt-2">{r.products}</p>
              <p className="text-sm mt-2">{r.routine}</p>
              <p className="mt-2">
                Próxima necesidad: {r.nextQty} sacos, en {r.days} días desde el
                13/10. {r.status}.
              </p>
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}
