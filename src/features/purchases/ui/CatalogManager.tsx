import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/dialog";
import type { PurchaseRepository } from "../application/ports";
const schema = z.object({
  name: z.string().min(2).max(120),
  brand: z.string().min(2).max(80),
  kg: z.number().positive().max(500),
  category: z.string().min(2),
  sourceRef: z.string().min(3),
});
export function CatalogManager({
  repository,
  onSaved,
}: {
  repository: PurchaseRepository;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { category: "Arroz", kg: 49 },
  });
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Agregar producto
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Producto del piloto"
        description="Usa el nombre, marca y presentación exactos recogidos en campo."
      >
        <form
          className="form"
          onSubmit={form.handleSubmit(async (data) => {
            try {
              await repository.createProduct?.(data);
              onSaved();
              setOpen(false);
              form.reset();
            } catch (e) {
              setError(e instanceof Error ? e.message : "No se pudo guardar");
            }
          })}
        >
          {(["name", "brand", "category", "sourceRef"] as const).map(
            (key, i) => (
              <label key={key}>
                {
                  [
                    "Nombre del producto",
                    "Marca o variedad",
                    "Categoría",
                    "Fuente o código de evidencia",
                  ][i]
                }
                <input {...form.register(key)} />
                {form.formState.errors[key] && (
                  <small className="error">Revisa este campo</small>
                )}
              </label>
            ),
          )}
          <label>
            Peso del saco en kg
            <input
              type="number"
              step="0.01"
              {...form.register("kg", { valueAsNumber: true })}
            />
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <Button disabled={form.formState.isSubmitting}>
            Guardar producto
          </Button>
        </form>
      </Modal>
    </>
  );
}
