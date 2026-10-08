import { paymentLabel, type CheckoutValues } from "./checkout";
import { formatBRL, parseBRLToCents } from "./money";
import type { BusinessSettings } from "./settings";
import type { PricedCart } from "./types";

const DIVIDER = "━━━━━━━━━━━━━━━━━━━━━━";

export interface OrderMessageInput {
  settings: Pick<BusinessSettings, "name">;
  cart: PricedCart;
  values: CheckoutValues;
  /** Dados opcionais: cada um só gera uma linha quando informado. */
  extras?: { orderId?: string; couponCode?: string; estimate?: string };
}

/** "Rua A, 10, apto 2 - Centro (CEP 32450-000)". Com só o endereço, sai exatamente como no site original. */
export const formatDeliveryAddress = (values: CheckoutValues): string => {
  let text = [values.address, values.complement].filter(Boolean).join(", ");
  if (values.neighborhood) text += ` - ${values.neighborhood}`;
  if (values.cep) text += ` (CEP ${values.cep})`;
  return text;
};

/**
 * Mensagem enviada ao restaurante. O esqueleto é idêntico ao do site original
 * (travado por teste); detalhes novos entram como linhas extras dentro dele.
 */
export const buildOrderMessage = ({ settings, cart, values, extras }: OrderMessageInput): string => {
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

  const orderIdLine = extras?.orderId ? `\n🧾 *Pedido:* ${extras.orderId}` : "";
  const phoneLine = values.phone ? `\n📞 *Telefone:* ${values.phone}` : "";
  const referenceLine = !isPickup && values.reference ? `\n🧭 *Referência:* ${values.reference}` : "";
  const locationLine = !isPickup && values.locationUrl ? `\n🗺️ *Localização:* ${values.locationUrl}` : "";
  const estimateLine = extras?.estimate ? `\n⏱️ *Previsão:* ${extras.estimate}` : "";

  const hasBreakdown = cart.discountCents > 0 || cart.deliveryFeeCents > 0;
  const breakdown = hasBreakdown
    ? [
        `🧾 *Subtotal:* ${formatBRL(cart.subtotalCents)}`,
        ...(cart.discountCents > 0
          ? [`🏷️ *Desconto${extras?.couponCode ? ` (${extras.couponCode})` : ""}:* - ${formatBRL(cart.discountCents)}`]
          : []),
        ...(cart.deliveryFeeCents > 0 ? [`🛵 *Taxa de entrega:* ${formatBRL(cart.deliveryFeeCents)}`] : []),
      ].join("\n") + "\n"
    : "";

  return `🔥 NOVO PEDIDO — ${settings.name.toUpperCase()} 🔥${orderIdLine}
${DIVIDER}
👤 *Cliente:* ${values.name}${phoneLine}
🏠 *Entrega/Retirada:* ${isPickup ? "Retirada no Balcão" : "Entrega"}
📍 *Endereço:* ${isPickup ? "Retirada no local" : formatDeliveryAddress(values)}${referenceLine}${locationLine}${estimateLine}
${DIVIDER}
🍖 *ITENS DO PEDIDO:*

${items}
${DIVIDER}
${breakdown}💰 *TOTAL:* ${formatBRL(cart.totalCents)}
💳 *PAGAMENTO:* ${paymentLabel[values.payment]}${changeText}
${DIVIDER}
📝 *Observações:* ${values.notes || "Nenhuma"}`;
};

export const buildWhatsAppUrl = (whatsappNumber: string, message: string): string =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
