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
  originLabel,
}: Props) {
  return (
    <>
      <Modal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Editar necesidad" : "Nueva necesidad"}
        description={
          isDemo
            ? "Registra una reposición de prueba. Esto no confirma una compra."
            : "Registra una necesidad con su fuente. Esto no confirma una compra."
        }
      >
        <form
          onSubmit={form.handleSubmit(async (input) => {
            try {
              await mutate.mutateAsync(() =>
                repository.saveNeed(input, stall, needRequestId),
              );
              setFormOpen(false);
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
          {!isDemo && (
            <label>
              Fuente o código de registro
              <input required {...form.register("sourceRef")} />
            </label>
          )}
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
      <Modal
        open={!!selected && !quoteOpen}
        onOpenChange={(v) => !v && setDetail(undefined)}
        title={selected?.product.name ?? ""}
        description={`${selected?.product.brand ?? ""} · Saco de ${selected?.product.kg ?? ""} kg · Propuesta ${originLabel}`}
      >
        {selected && (
          <div className="mt-6">
            <div className="detail-grid">
              <div>
                <small>Volumen reunido</small>
                <strong>{selected.total} sacos</strong>
              </div>
              <div>
                <small>Tu cantidad</small>
                <strong>{cmp?.qty ?? 0} sacos</strong>
              </div>
              <div>
                <small>Fecha deseada de reposición</small>
                <strong>{dateLabel(selected.date)}</strong>
              </div>
              <div>
                <small>Modalidad</small>
                <strong>
                  {selected.mode === "delivery"
                    ? "Entrega en mercado"
                    : "Recojo"}
                </strong>
              </div>
            </div>
            {cmp?.eligible ? (
              <div className="comparison-box">
                <div>
                  <span>Compra individual</span>
                  <strong>{money(cmp.individual!)}</strong>
                </div>
                <div>
                  <span>Compra colectiva</span>
                  <strong>{money(cmp.collective!)}</strong>
                </div>
                <div
                  className={cn(
                    "comparison-result",
                    cmp.difference! < 0 && "text-red-700",
                  )}
                >
                  <span>
                    {cmp.difference! >= 0
                      ? "Diferencia a favor estimada"
                      : "Mayor costo colectivo"}
                  </span>
                  <strong>{money(Math.abs(cmp.difference!))}</strong>
                </div>
                <p>
                  Incluye {money(cmp.freight!)} de transporte y reparto
                  asignados proporcionalmente.{" "}
                  {cmp.qty === 0 &&
                    "Registra tu necesidad para comparar tu costo."}
                </p>
              </div>
            ) : (
              <div className="form-info mt-5">
                <Clock size={20} />
                <p>{cmp?.reason}. No se aplica todavía el precio colectivo.</p>
              </div>
            )}
            <div className="mt-5 space-y-3 text-sm muted">
              <p className="flex gap-2">
                <Truck size={17} />
                {selected.quote
                  ? selected.quote.deliveryEstimate
                    ? `Fecha estimada del proveedor: ${dateLabel(selected.quote.deliveryEstimate)} (sujeta a acuerdo).`
                    : "Fecha del proveedor por definir."
                  : "Fecha de entrega por definir."}
              </p>
              <p>
                Tipo de evidencia:{" "}
                {
                  {
                    written_quote: "Cotización escrita",
                    price_list: "Lista de precios",
                    verbal: "Declaración verbal",
                    simulated: "Simulación",
                    unclassified: "Por clasificar",
                  }[
                    selected.quote?.evidenceType ??
                      (isDemo ? "simulated" : "unclassified")
                  ]
                }
              </p>
              <p>
                {selected.quote?.payment ?? "Condiciones de pago por definir."}
              </p>
              <p>
                Vigencia {isDemo ? "simulada" : "cotizada"}:{" "}
                {selected.quote
                  ? new Date(selected.quote.validUntil).toLocaleDateString(
                      "es-PE",
                    )
                  : "Por definir"}{" "}
                · {status(selected)}
              </p>
            </div>
            {role === "coordinator" && (
              <Button className="mt-5" variant="outline" onClick={openQuote}>
                <Pencil size={15} />
                {selected.quote ? "Editar cotización" : "Registrar cotización"}
              </Button>
            )}
            {mutate.error && (
              <p role="alert" className="error mt-4">
                {mutate.error.message}
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <Button
                disabled={!cmp?.eligible || !cmp?.qty || mutate.isPending}
                onClick={() =>
                  mutate.mutate(() =>
                    repository.decide(selected.key, stall, "confirmed"),
                  )
                }
              >
                <Check size={17} />
                Confirmar participación
              </Button>
              <Button
                variant="outline"
                disabled={!cmp?.qty || mutate.isPending}
                onClick={() =>
                  mutate.mutate(() =>
                    repository.decide(selected.key, stall, "declined"),
                  )
                }
              >
                Rechazar
              </Button>
            </div>
            <p className="mt-4 text-xs muted">
              {isDemo
                ? "Confirmación simulada."
                : "Registro de participación en el piloto."}{" "}
              No genera una orden, pago ni compromiso con un proveedor.
            </p>
          </div>
        )}
      </Modal>
      <Modal
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
        title={isDemo ? "Cotización de prueba" : "Cotización del piloto"}
        description={
          isDemo
            ? "Condiciones ficticias. Cambiarlas exige confirmar nuevamente la propuesta."
            : "Registra condiciones y fuente comprobables. Un cambio exige volver a confirmar."
        }
      >
        <form
          className="form"
          onSubmit={quoteForm.handleSubmit(async (input) => {
            if (!selected) return;
            try {
              await mutate.mutateAsync(() =>
                repository.updateQuote(selected.key, {
                  ...input,
                  validUntil: input.validUntil + "T23:59:59-05:00",
                }),
              );
              setQuoteOpen(false);
            } catch {
              /* mutation reports error */
            }
          })}
        >
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
          <label>
            Tipo de evidencia
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
          <label>
            Fecha estimada por el proveedor (opcional)
            <input
              type="date"
              {...quoteForm.register("deliveryEstimate", {
                setValueAs: (v) => v || null,
              })}
            />
            <small>
              No sustituye la fecha deseada de reposición ni acredita una
              entrega.
            </small>
          </label>
          <label>
            Proveedor o código
            <input required={!isDemo} {...quoteForm.register("supplier")} />
          </label>
          <label>
            Fuente o código de cotización
            <input required={!isDemo} {...quoteForm.register("sourceRef")} />
          </label>
          <label>
            Vigencia
            <input type="date" {...quoteForm.register("validUntil")} />
          </label>
          <label>
            Condición de pago
            <textarea {...quoteForm.register("payment")} />
          </label>
          <Button type="submit" disabled={mutate.isPending}>
            Guardar cotización {isDemo ? "simulada" : "del piloto"}
          </Button>
        </form>
      </Modal>
      <Modal
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Restablecer datos de prueba"
        description="Se eliminarán los cambios de esta demo en este navegador y volverán los escenarios iniciales."
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
