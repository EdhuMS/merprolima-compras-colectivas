import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { comparison, joiningPreview, type Group } from "../domain/model";
import type { PurchaseRepository } from "../application/ports";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/dialog";
import { money, dateLabel } from "../../../lib/utils";

export function ProposalDetail({
  group,
  suggestedQuantity,
  stall,
  coordinator,
  repository,
  mutate,
  status,
  onClose,
  onSuccess,
  onEditQuote,
}: {
  group: Group;
  suggestedQuantity: number;
  stall: string;
  coordinator: boolean;
  repository: PurchaseRepository;
  mutate: UseMutationResult<void, Error, () => Promise<void>>;
  status: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onEditQuote: () => void;
}) {
  const [qty, setQty] = useState(suggestedQuantity);
  const [decision, setDecision] = useState<"confirmed" | "declined">();
  const ownQty = group.needs
    .filter((n) => n.stall === stall)
    .reduce((s, n) => s + n.qty, 0);
  const preview = joiningPreview(group, stall, qty);
  const costs = comparison(preview, stall);
  const expired =
    !group.quote ||
    new Date(group.quote.validUntil) < new Date() ||
    group.date <
      new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  const validQty =
    ownQty > 0 || (Number.isInteger(qty) && qty >= 1 && qty <= 500);
  const participates = [
    "Participación confirmada",
    "Requiere nueva confirmación",
    "Pedido pendiente de confirmación",
  ].includes(status);
  const confirm = async () => {
    if (!decision) return;
    try {
      await mutate.mutateAsync(() =>
        repository.decide(group.key, stall, decision, ownQty || qty),
      );
      const message =
        decision === "declined"
          ? "Retiraste tu participación. Tu necesidad de reposición se conserva y podrás volver a sumarte."
          : costs.eligible
            ? "Tu participación quedó confirmada. Puedes consultarla en Mis participaciones."
            : "Tu pedido se sumó a esta compra. La participación queda pendiente hasta reunir el mínimo y completar las condiciones. Puedes seguirla en Mis participaciones.";
      setDecision(undefined);
      onClose();
      onSuccess(message);
    } catch {
      /* Keep confirmation open and show the server error. */
    }
  };
  const confirmationTitle =
    decision === "declined"
      ? "¿Retirar tu participación?"
      : costs.eligible
        ? "¿Confirmar tu participación?"
        : "¿Sumar tu pedido?";
  const confirmationDescription =
    decision === "declined"
      ? "Dejarás de participar en esta propuesta. Tu necesidad de reposición se conservará."
      : `${ownQty || qty} sacos de ${group.product.name} · ${group.product.brand}, para el ${dateLabel(group.date)} ${costs.eligible ? "Confirmarás las condiciones mostradas." : "El pedido quedará pendiente de confirmación mientras se completa el volumen o la cotización."}`;
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open && !mutate.isPending) {
          if (decision) setDecision(undefined);
          else onClose();
        }
      }}
      title={decision ? confirmationTitle : group.product.name}
      description={
        decision
          ? confirmationDescription
          : `${group.product.brand} · Saco de ${group.product.kg} kg`
      }
    >
      <div className="mt-6">
        {decision ? (
          <>
            {mutate.error && (
              <p className="error mt-4" role="alert">
                {mutate.error.message}
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-6">
              <Button
                variant="outline"
                disabled={mutate.isPending}
                onClick={() => setDecision(undefined)}
              >
                Cancelar
              </Button>
              <Button disabled={mutate.isPending} onClick={confirm}>
                {mutate.isPending
                  ? "Guardando…"
                  : decision === "declined"
                    ? "Sí, retirar"
                    : "Confirmar"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="detail-grid">
              <div>
                <small>Volumen solicitado</small>
                <strong>{group.total} sacos</strong>
              </div>
              <div>
                <small>
                  {coordinator ? "Mínimo del proveedor" : "Tu pedido actual"}
                </small>
                <strong>
                  {coordinator ? (group.quote?.min ?? "Por definir") : ownQty}{" "}
                  sacos
                </strong>
              </div>
              <div>
                <small>Fecha de reposición</small>
                <strong>{dateLabel(group.date)}</strong>
              </div>
              <div>
                <small>Modalidad</small>
                <strong>
                  {group.mode === "pickup" ? "Recojo" : "Entrega en mercado"}
                </strong>
              </div>
            </div>
            {coordinator ? (
              <>
                <div className="form-info mt-5">
                  <p>
                    {group.quote
                      ? "Esta propuesta está publicada. Puedes actualizar su cotización; los clientes deberán revisar las nuevas condiciones."
                      : "Estas son necesidades recibidas de los clientes. Completa la cotización para publicar una compra colectiva a la que puedan sumarse."}
                  </p>
                </div>
                <Button className="mt-5" onClick={onEditQuote}>
                  {group.quote ? "Editar cotización" : "Preparar propuesta"}
                </Button>
              </>
            ) : (
              <>
                {!ownQty && (
                  <label className="form mt-5">
                    ¿Cuántos sacos quieres comprar?
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={qty}
                      onChange={(e) => setQty(e.target.valueAsNumber)}
                    />
                    <small className="muted">
                      Al sumarte, registraremos tu pedido automáticamente con la
                      fecha y modalidad de esta propuesta.
                    </small>
                    {!validQty && (
                      <small className="error">
                        Indica una cantidad entera entre 1 y 500.
                      </small>
                    )}
                  </label>
                )}
                {costs.eligible && validQty ? (
                  <div className="comparison-box">
                    <div>
                      <span>Compra individual</span>
                      <strong>{money(costs.individual!)}</strong>
                    </div>
                    <div>
                      <span>Compra colectiva</span>
                      <strong>{money(costs.collective!)}</strong>
                    </div>
                    <div className="comparison-result">
                      <span>
                        {costs.difference! >= 0
                          ? "Diferencia a favor estimada"
                          : "Mayor costo colectivo"}
                      </span>
                      <strong>{money(Math.abs(costs.difference!))}</strong>
                    </div>
                    <p>
                      Incluye {money(costs.freight!)} de transporte y reparto.{" "}
                      {ownQty
                        ? ""
                        : "Estimación con tu cantidad incorporada al volumen actual; el reparto final se calcula al guardar."}
                    </p>
                  </div>
                ) : (
                  <div className="form-info mt-5">
                    <p>
                      {costs.reason}.{" "}
                      {expired
                        ? "Esta propuesta ya no acepta nuevas confirmaciones."
                        : "Puedes sumar tu pedido; la confirmación quedará pendiente hasta completar las condiciones."}
                    </p>
                  </div>
                )}
                <p className="text-sm muted mt-5">
                  {group.quote?.payment} · Vigencia:{" "}
                  {group.quote
                    ? new Date(group.quote.validUntil).toLocaleDateString(
                        "es-PE",
                        {
                          timeZone: "America/Lima",
                        },
                      )
                    : "Por definir"}
                </p>
                <p className="text-sm font-semibold mt-3">{status}</p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Button
                    disabled={
                      expired ||
                      !validQty ||
                      mutate.isPending ||
                      status === "Participación confirmada"
                    }
                    onClick={() => {
                      mutate.reset();
                      setDecision("confirmed");
                    }}
                  >
                    {status === "Participación confirmada"
                      ? "Participación confirmada"
                      : ownQty
                        ? "Confirmar participación"
                        : costs.eligible
                          ? "Sumarme y confirmar"
                          : "Sumar mi pedido"}
                  </Button>
                  {participates && (
                    <Button
                      variant="outline"
                      disabled={mutate.isPending}
                      onClick={() => {
                        mutate.reset();
                        setDecision("declined");
                      }}
                    >
                      Retirar participación
                    </Button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
