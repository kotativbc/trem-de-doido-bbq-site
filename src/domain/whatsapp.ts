import { paymentLabel, type CheckoutValues } from "./checkout";
import { formatBRL, parseBRLToCents } from "./money";
import type { BusinessSettings } from "./settings";
import type { PricedCart } from "./types";

const DIVIDER = "━━━━━━━━━━━━━━━━━━━━━━";

export interface OrderMessageInput {
  settings: Pick<BusinessSettings, "name">;
  cart: PricedCart;
  values: CheckoutValues;
}

/**
 * Mensagem enviada ao restaurante. O esqueleto é idêntico ao do site original
 * (travado por teste); detalhes novos entram como linhas extras dentro dele.
 */
export const buildOrderMessage = ({ settings, cart, values }: OrderMessageInput): string => {
  const isPickup = values.fulfillment === "retirada";

  const items = cart.lines
    .filter((l) => !l.unavailableReason)
    .map((l) => {
      const head = `${l.name} x${l.quantity} — ${formatBRL(l.totalCents)}`;
      const extras: string[] = [];
      if (l.addonNames.length > 0) extras.push(`   + ${l.addonNames.join(", ")}`);
      if (l.note) extras.push(`   Obs: ${l.note}`);
      return [head, ...extras].join("\n");
    })
    .join("\n");

  const changeCents = values.payment === "dinheiro" ? parseBRLToCents(values.changeFor) : null;
  const changeText = changeCents !== null ? `\n💵 *Troco para:* ${formatBRL(changeCents)}` : "";

  return `🔥 NOVO PEDIDO — ${settings.name.toUpperCase()} 🔥
${DIVIDER}
👤 *Cliente:* ${values.name}
🏠 *Entrega/Retirada:* ${isPickup ? "Retirada no Balcão" : "Entrega"}
📍 *Endereço:* ${isPickup ? "Retirada no local" : values.address}
${DIVIDER}
🍖 *ITENS DO PEDIDO:*

${items}
${DIVIDER}
💰 *TOTAL:* ${formatBRL(cart.totalCents)}
💳 *PAGAMENTO:* ${paymentLabel[values.payment]}${changeText}
${DIVIDER}
📝 *Observações:* ${values.notes || "Nenhuma"}`;
};

export const buildWhatsAppUrl = (whatsappNumber: string, message: string): string =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
