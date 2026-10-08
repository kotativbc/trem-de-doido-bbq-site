import type { Cents } from "./money";
import type { DeliverySettings, MinuteRange } from "./settings";
import type { FulfillmentType } from "./types";

const normalizeName = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export interface DeliveryFee {
  feeCents: Cents;
  /** Zona encontrada pelo bairro; undefined quando vale a taxa padrão (ou retirada). */
  zoneName?: string;
}

/** Taxa de entrega: 0 na retirada; por bairro/faixa quando configurado; senão a taxa padrão. */
export const resolveDeliveryFee = (
  delivery: DeliverySettings,
  fulfillment: FulfillmentType,
  neighborhood: string,
): DeliveryFee => {
  if (fulfillment === "retirada") return { feeCents: 0 };
  const wanted = normalizeName(neighborhood);
  const zone = wanted ? delivery.zones.find((z) => normalizeName(z.name) === wanted) : undefined;
  return zone ? { feeCents: zone.feeCents, zoneName: zone.name } : { feeCents: delivery.defaultFeeCents };
};

/** Pedido mínimo vale para entrega (retirada no balcão não tem mínimo). */
export const getMinOrderShortfall = (
  delivery: DeliverySettings,
  fulfillment: FulfillmentType,
  subtotalCents: Cents,
): Cents => {
  if (fulfillment === "retirada" || delivery.minOrderCents <= 0) return 0;
  return Math.max(delivery.minOrderCents - subtotalCents, 0);
};

const range = ({ min, max }: MinuteRange): string => (min === max ? `${min} min` : `${min} a ${max} min`);

/** Previsão para o cliente: preparo (retirada) ou preparo + deslocamento (entrega). */
export const estimateTimeText = (delivery: DeliverySettings, fulfillment: FulfillmentType): string => {
  if (fulfillment === "retirada") return range(delivery.prepMinutes);
  return range({
    min: delivery.prepMinutes.min + delivery.deliveryMinutes.min,
    max: delivery.prepMinutes.max + delivery.deliveryMinutes.max,
  });
};
