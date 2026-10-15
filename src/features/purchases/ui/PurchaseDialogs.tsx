import { useState } from "react";
import { ProposalDetail } from "./ProposalDetail";
import type { UseFormReturn } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Truck,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/dialog";
import { money, cn } from "../../../lib/utils";
import {
  comparison,
  type NeedInput,
  type QuoteInput,
  type Product,
  type Need,
  type Group,
} from "../domain/model";
import type { PurchaseRepository } from "../application/ports";
type Props = {
  formOpen: boolean;
  setFormOpen: (v: boolean) => void;
  editing?: Need;
  needRequestId?: string;
  isDemo: boolean;
  form: UseFormReturn<NeedInput>;
  quoteForm: UseFormReturn<QuoteInput>;
  mutate: UseMutationResult<void, Error, () => Promise<void>>;
  repository: PurchaseRepository;
  stall: string;
  products: Product[];
  selected?: Group;
  quoteOpen: boolean;
  setQuoteOpen: (v: boolean) => void;
  setDetail: (v: string | undefined) => void;
  cmp: ReturnType<typeof comparison> | undefined;
  dateLabel: (d: string) => string;
  status: (g: Group) => string;
  role: string;
  openQuote: () => void;
  resetOpen: boolean;
  setResetOpen: (v: boolean) => void;
  originLabel: string;
  onSuccess: (message: string) => void;
  simulatedOrigin: boolean;
};
export function PurchaseDialogs({
  formOpen,
  setFormOpen,
  editing,
  needRequestId,
  isDemo,
  form,
  quoteForm,
  mutate,
  repository,
  stall,
  products,
  selected,
  quoteOpen,
  setQuoteOpen,
  setDetail,
  cmp,
  dateLabel,
  status,
  role,
  openQuote,
  resetOpen,
  setResetOpen,
  onSuccess,
  simulatedOrigin,
}: Props) {
  const [quoteConfirmation, setQuoteConfirmation] = useState<QuoteInput>();
  return (
    <>
      <Modal
        open={formOpen}
        onOpenChange={(open) => !mutate.isPending && setFormOpen(open)}
        title={editing ? "Editar necesidad" : "Nueva necesidad"}
        description="Elige el producto, la cantidad y cuándo necesitas reponerlo."
      >
        <form
          onSubmit={form.handleSubmit(async (input) => {
            try {
              await mutate.mutateAsync(() =>
                repository.saveNeed(
                  {
                    ...input,
                    sourceRef:
                      input.sourceRef?.trim() || `APP:${needRequestId}`,
                  },
                  stall,
                  needRequestId,
                ),
              );
              setFormOpen(false);
              onSuccess(
                editing
                  ? "Tu necesidad se actualizó correctamente."
                  : "Tu necesidad quedó registrada. Coordinación podrá revisarla para preparar una compra colectiva.",
              );
            } catch {
              /* mutation reports error */
            }
          })}
          className="form"
        >
          {mutate.error && (
            <p role="alert" className="error">
              {mutate.error.message}
            </p>
          )}
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
          <div className="grid grid-cols-2 gap-4">
            <label>
              Cantidad de sacos
              <input
                type="number"
                min="1"
                max="500"
                {...form.register("qty", { valueAsNumber: true })}
              />
              {form.formState.errors.qty && (
                <small className="error">
                  {form.formState.errors.qty.message}
                </small>
              )}
            </label>
            <label>
              Fecha deseada
              <input type="date" {...form.register("date")} />
              {form.formState.errors.date && (
                <small className="error">
                  {form.formState.errors.date.message}
                </small>
              )}
            </label>
          </div>
          <label>
            Modalidad
            <select {...form.register("mode")}>
              <option value="delivery">Entrega en el mercado</option>
              <option value="pickup">Recojo</option>
            </select>
          </label>
          <div className="form-info">
            <ShieldCheck size={18} />
            <p>
              Solo se agruparán necesidades con el mismo producto, presentación,
              fecha y modalidad.
            </p>
          </div>
          <Button type="submit" disabled={mutate.isPending}>
            {mutate.isPending
              ? "Guardando…"
              : editing
                ? "Guardar cambios"
                : "Guardar necesidad"}
            <ArrowRight size={16} />
          </Button>
        </form>
      </Modal>
      {selected && !quoteOpen && (
        <ProposalDetail
          key={selected.key}
          group={selected}
          stall={stall}
          coordinator={role === "coordinator"}
          repository={repository}
          mutate={mutate}
          status={status(selected)}
          onClose={() => setDetail(undefined)}
          onSuccess={onSuccess}
          onEditQuote={openQuote}
        />
      )}
      <Modal
        open={quoteOpen && !quoteConfirmation}
        onOpenChange={(open) => !mutate.isPending && setQuoteOpen(open)}
        title="Condiciones de la propuesta"
        description="Actualiza precios y gastos. Los cambios requieren volver a confirmar la participación."
      >
        <form
          className="form"
          onSubmit={quoteForm.handleSubmit((input) => {
            mutate.reset();
            setQuoteConfirmation(input);
          })}
        >
          {!!Object.keys(quoteForm.formState.errors).length && (
            <p className="error" role="alert">
              Revisa precios, mínimo, vigencia y condición de pago antes de
              continuar.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            {(
              [
                { key: "individual", label: "Precio individual S/" },
                { key: "collective", label: "Precio colectivo S/" },
                { key: "min", label: "Mínimo de sacos" },
                { key: "transport", label: "Transporte total S/" },
                { key: "distribution", label: "Reparto total S/" },
                {
                  key: "individualTransport",
                  label: "Transporte individual S/",
                },
              ] as const
            ).map((f) => (
              <label key={f.key}>
                {f.label}
                <input
                  type="number"
                  step={f.key === "min" ? "1" : "0.01"}
                  {...quoteForm.register(f.key, {
                    setValueAs: (v) =>
                      v === "" &&
                      [
                        "transport",
                        "distribution",
                        "individualTransport",
                      ].includes(f.key)
                        ? null
                        : Number(v),
                  })}
                />
                {quoteForm.formState.errors[f.key] && (
                  <small className="error">Ingresa un valor válido</small>
                )}
              </label>
            ))}
          </div>
          {mutate.error && (
            <p role="alert" className="error">
              {mutate.error.message}
            </p>
          )}
          <p className="text-sm muted">
            Deja vacío un gasto desconocido. Cero significa que está confirmado
            sin costo. No se podrá confirmar con gastos por definir.
          </p>
          {!simulatedOrigin && (
            <>
              <label>
                Documento de respaldo
                <select {...quoteForm.register("evidenceType")}>
                  {isDemo ? (
                    <option value="simulated">Simulación</option>
                  ) : (
                    <>
                      <option value="unclassified">Selecciona el tipo</option>
                      <option value="written_quote">Cotización escrita</option>
                      <option value="price_list">Lista de precios</option>
                      <option value="verbal">Declaración verbal</option>
                    </>
                  )}
                </select>
              </label>
            </>
          )}
          <label>
            Fecha estimada por el proveedor (opcional)
            <input
              type="date"
              {...quoteForm.register("deliveryEstimate", {
                setValueAs: (v) => v || null,
              })}
            />
            <small>Fecha que propone el proveedor para la entrega.</small>
          </label>
          <label>
            Proveedor o código
            <input required={!isDemo} {...quoteForm.register("supplier")} />
          </label>
          {!isDemo && (
            <label>
              Referencia de la cotización
              <input required {...quoteForm.register("sourceRef")} />
            </label>
          )}
          <label>
            Vigencia
            <input type="date" {...quoteForm.register("validUntil")} />
          </label>
          <label>
            Condición de pago
            <textarea {...quoteForm.register("payment")} />
          </label>
          <Button type="submit" disabled={mutate.isPending}>
            {selected?.quote
              ? "Revisar y guardar condiciones"
              : "Revisar y publicar compra"}
          </Button>
        </form>
      </Modal>
      <Modal
        open={!!quoteConfirmation}
        onOpenChange={(v) => {
          if (!v && !mutate.isPending) setQuoteConfirmation(undefined);
        }}
        title={
          selected?.quote
            ? "¿Actualizar la propuesta?"
            : "¿Publicar compra colectiva?"
        }
        description="Los clientes podrán ver esta propuesta y sumar sus pedidos. Las modificaciones de precio o volumen requerirán revisar las confirmaciones."
      >
        {mutate.error && (
          <p className="error mt-4" role="alert">
            {mutate.error.message}
          </p>
        )}
        <div className="flex flex-wrap gap-3 mt-6">
          <Button
            variant="outline"
            disabled={mutate.isPending}
            onClick={() => setQuoteConfirmation(undefined)}
          >
            Volver a editar
          </Button>
          <Button
            disabled={mutate.isPending}
            onClick={async () => {
              if (!selected || !quoteConfirmation) return;
              try {
                await mutate.mutateAsync(() =>
                  repository.updateQuote(selected.key, {
                    ...quoteConfirmation,
                    validUntil:
                      quoteConfirmation.validUntil + "T23:59:59-05:00",
                  }),
                );
                setQuoteConfirmation(undefined);
                setQuoteOpen(false);
                setDetail(undefined);
                onSuccess(
                  selected.quote
                    ? "La propuesta se actualizó correctamente. Los clientes podrán revisar sus condiciones."
                    : "Compra colectiva publicada. Los clientes ya pueden verla y sumarse con su cantidad.",
                );
              } catch {
                /* Keep the confirmation open. */
              }
            }}
          >
            {mutate.isPending
              ? "Guardando…"
              : selected?.quote
                ? "Guardar cambios"
                : "Publicar compra"}
          </Button>
        </div>
      </Modal>
      <Modal
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reiniciar espacio"
        description="Se borrarán los cambios guardados en este espacio y se recuperará su estado inicial."
      >
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => setResetOpen(false)}>
            Conservar cambios
          </Button>
          <Button
            onClick={() => {
              mutate.mutate(() => repository.reset?.() ?? Promise.resolve());
              setResetOpen(false);
            }}
          >
            Restablecer demo
          </Button>
        </div>
      </Modal>
    </>
  );
}
