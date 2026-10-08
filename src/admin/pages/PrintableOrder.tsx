import { createPortal } from "react-dom";
import { paymentLabel } from "@/domain/checkout";
import { formatBRL } from "@/domain/money";
import { statusLabel, type Order } from "@/domain/orders";

interface PrintableOrderProps {
  order: Order;
  restaurantName: string;
  timeZone: string;
}

const Line = ({ left, right }: { left: string; right?: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
    <span>{left}</span>
    {right !== undefined && <span>{right}</span>}
  </div>
);

/** Comanda para impressão (80 mm). Fica oculta na tela e aparece sozinha ao imprimir. */
const PrintableOrder = ({ order, restaurantName, timeZone }: PrintableOrderProps) => {
  const isPickup = order.fulfillment === "retirada";
  const address = [order.address.street, order.address.complement, order.address.neighborhood, order.address.cep]
    .filter(Boolean)
    .join(", ");

  return createPortal(
    <div className="print-area" aria-hidden="true">
      <p style={{ textAlign: "center", fontWeight: 700 }}>{restaurantName.toUpperCase()}</p>
      <p style={{ textAlign: "center" }}>Pedido {order.id}</p>
      <p style={{ textAlign: "center" }}>{new Date(order.createdAt).toLocaleString("pt-BR", { timeZone })}</p>
      <hr />
      <p><strong>{order.customer.name}</strong></p>
      <p>{order.customer.phone}</p>
      <p>{isPickup ? "RETIRADA NO BALCÃO" : `ENTREGA: ${address}`}</p>
      {!isPickup && order.address.reference && <p>Ref.: {order.address.reference}</p>}
      <hr />
      {order.lines.map((l, i) => (
        <div key={`${l.productId}-${i}`} style={{ marginBottom: 4 }}>
          <Line left={`${l.quantity}x ${l.name}`} right={formatBRL(l.totalCents)} />
          {l.addonNames.length > 0 && <p>  + {l.addonNames.join(", ")}</p>}
          {l.note && <p>  Obs: {l.note}</p>}
        </div>
      ))}
      <hr />
      {(order.discountCents > 0 || order.deliveryFeeCents > 0) && <Line left="Subtotal" right={formatBRL(order.subtotalCents)} />}
      {order.discountCents > 0 && <Line left={`Desconto${order.couponCode ? ` (${order.couponCode})` : ""}`} right={`- ${formatBRL(order.discountCents)}`} />}
      {order.deliveryFeeCents > 0 && <Line left="Taxa de entrega" right={formatBRL(order.deliveryFeeCents)} />}
      <p style={{ fontWeight: 700 }}><Line left="TOTAL" right={formatBRL(order.totalCents)} /></p>
      <p>
        Pagamento: {paymentLabel[order.payment]}
        {order.changeForCents ? ` (troco p/ ${formatBRL(order.changeForCents)})` : ""}
      </p>
      {order.notes && <p>Obs. do pedido: {order.notes}</p>}
      <hr />
      <p>Status: {statusLabel[order.status]}</p>
    </div>,
    document.body,
  );
};

export default PrintableOrder;
