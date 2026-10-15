import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  needSchema,
  type Group,
  type Product,
  type Origin,
} from "../domain/model";
import { Modal } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { z } from "zod";
const schema = needSchema.pick({ productId: true, date: true, mode: true });
export function ProposalComposer({
  open,
  onOpenChange,
  products,
  origin,
  onContinue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  origin: Origin;
  onContinue: (group: Group) => void;
}) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      productId: products[0]?.id ?? "",
      date: new Date().toLocaleDateString("en-CA", {
        timeZone: "America/Lima",
      }),
      mode: "delivery",
    },
  });
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Crear compra colectiva"
      description="Define qué producto ofrecer, la fecha y la modalidad. Después completa la cotización para publicar la propuesta."
    >
      <form
        className="form"
        onSubmit={form.handleSubmit((input) => {
          const product = products.find((p) => p.id === input.productId);
          if (!product) return;
          onContinue({
            key: [origin, product.id, input.date, input.mode].join("|"),
            product,
            date: input.date,
            mode: input.mode,
            origin,
            needs: [],
            total: 0,
          });
          onOpenChange(false);
        })}
      >
        <label>
          Producto y presentación
          <select {...form.register("productId")}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.brand} · {p.kg} kg
              </option>
            ))}
          </select>
        </label>
        <label>
          Fecha de reposición
          <input type="date" {...form.register("date")} />
          {form.formState.errors.date && (
            <small className="error">
              {form.formState.errors.date.message}
            </small>
          )}
        </label>
        <label>
          Modalidad
          <select {...form.register("mode")}>
            <option value="delivery">Entrega en el mercado</option>
            <option value="pickup">Recojo</option>
          </select>
        </label>
        <Button type="submit" disabled={!products.length}>
          Continuar con la cotización
        </Button>
      </form>
    </Modal>
  );
}
