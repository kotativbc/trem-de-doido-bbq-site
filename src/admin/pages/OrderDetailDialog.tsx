import { useState } from "react";
import { MessageCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paymentLabel } from "@/domain/checkout";
import { formatBRL } from "@/domain/money";
import { allowedTransitions, statusLabel, type Order, type OrderStatus } from "@/domain/orders";
import { normalizePhoneBR } from "@/domain/phone";
import { useSettings } from "@/hooks/useSettings";
import { repositories } from "@/services";
import { ordersQueryKey } from "@/hooks/useOrders";
import { useAdminRun } from "../useAdminRun";
import PrintableOrder from "./PrintableOrder";

interface OrderDetailDialogProps {
  order: Order;
  onClose: () => void;
}

const when = (iso: string, timeZone: string) => new Date(iso).toLocaleString("pt-BR", { timeZone });

const OrderDetailDialog = ({ order, onClose }: OrderDetailDialogProps) => {
  const settings = useSettings();
  const run = useAdminRun();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const isPickup = order.fulfillment === "retirada";
  const transitions = allowedTransitions(order);

  const change = async (next: OrderStatus) => {
    setBusy(true);
    const ok = await run(() => repositories.orders.updateStatus(order.id, next, note), {
      success: `Pedido ${statusLabel[next].toLowerCase()}.`,
      invalidate: [ordersQueryKey],
    });
    setBusy(false);
    if (ok) setNote("");
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#0A0A0A] border-[#2A2A2A] text-[#E5E5E5] sm:max-w-xl print:hidden">
          <DialogHeader>
            <DialogTitle className="font-['Bebas_Neue'] text-2xl tracking-wide">Pedido {order.id}</DialogTitle>
            <DialogDescription className="text-[#AAA]">
              {when(order.createdAt, settings.timezone)} · <strong className="text-primary">{statusLabel[order.status]}</strong>
            </DialogDescription>
          </DialogHeader>

          <section aria-label="Cliente" className="space-y-1 text-sm">
            <p className="font-semibold">{order.customer.name}</p>
            <p>
              <a
                href={`https://wa.me/55${normalizePhoneBR(order.customer.phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> {order.customer.phone}
              </a>
            </p>
            <p className="text-[#AAA]">
              {isPickup
                ? "Retirada no balcão"
                : [order.address.street, order.address.complement, order.address.neighborhood, order.address.cep && `CEP ${order.address.cep}`]
                    .filter(Boolean)
                    .join(", ")}
            </p>
            {!isPickup && order.address.reference && <p className="text-[#AAA]">Referência: {order.address.reference}</p>}
          </section>

          <section aria-label="Itens" className="space-y-2 border-y border-[#2A2A2A] py-3">
            {order.lines.map((l, i) => (
              <div key={`${l.productId}-${i}`} className="text-sm">
                <div className="flex justify-between gap-3">
                  <span>{l.quantity}x {l.name}</span>
                  <span>{formatBRL(l.totalCents)}</span>
                </div>
                {l.addonNames.length > 0 && <p className="text-xs text-[#888]">+ {l.addonNames.join(", ")}</p>}
                {l.note && <p className="text-xs text-[#888]">Obs: {l.note}</p>}
              </div>
            ))}
            <dl className="space-y-1 pt-2 text-sm">
              <div className="flex justify-between"><dt className="text-[#888]">Subtotal</dt><dd>{formatBRL(order.subtotalCents)}</dd></div>
              {order.discountCents > 0 && (
                <div className="flex justify-between"><dt className="text-[#888]">Desconto{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>- {formatBRL(order.discountCents)}</dd></div>
              )}
              {order.deliveryFeeCents > 0 && (
                <div className="flex justify-between"><dt className="text-[#888]">Taxa de entrega</dt><dd>{formatBRL(order.deliveryFeeCents)}</dd></div>
              )}
              <div className="flex justify-between font-bold"><dt>Total</dt><dd>{formatBRL(order.totalCents)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-[#888]">Pagamento</dt>
                <dd>{paymentLabel[order.payment]}{order.changeForCents ? ` · troco para ${formatBRL(order.changeForCents)}` : ""}</dd>
              </div>
            </dl>
            {order.notes && <p className="text-sm">Observações: {order.notes}</p>}
          </section>

          <section aria-label="Histórico" className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#888]">Histórico</h3>
            <ol className="space-y-1 text-sm">
              {order.history.map((h, i) => (
                <li key={`${h.at}-${i}`}>
                  <span className="text-[#888]">{when(h.at, settings.timezone)}</span> — {statusLabel[h.status]}
                  {h.note ? <span className="text-[#AAA]"> ({h.note})</span> : null}
                </li>
              ))}
            </ol>
          </section>

          {transitions.length > 0 && (
            <section aria-label="Atualizar status" className="space-y-2">
              <Label htmlFor="status-note" className="text-xs font-semibold uppercase tracking-wide">Observação da mudança (opcional)</Label>
              <Input id="status-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} className="bg-[#1C1C1C] border-[#2A2A2A]" />
              <div className="flex flex-wrap gap-2">
                {transitions.map((next) => (
                  <Button
                    key={next}
                    type="button"
                    disabled={busy}
                    onClick={() => void change(next)}
                    variant={next === "cancelado" ? "destructive" : "outline"}
                    className={next === "cancelado" ? "" : "border-[#2A2A2A] bg-[#1C1C1C] hover:bg-primary hover:text-primary-foreground"}
                  >
                    {next === "cancelado" ? "Cancelar pedido" : `Marcar: ${statusLabel[next]}`}
                  </Button>
                ))}
              </div>
            </section>
          )}

          <Button type="button" variant="outline" onClick={() => window.print()} className="border-[#2A2A2A] bg-[#1C1C1C] gap-2">
            <Printer className="h-4 w-4" aria-hidden="true" /> Imprimir comanda
          </Button>
        </DialogContent>
      </Dialog>
      <PrintableOrder order={order} restaurantName={settings.name} timeZone={settings.timezone} />
    </>
  );
};

export default OrderDetailDialog;
