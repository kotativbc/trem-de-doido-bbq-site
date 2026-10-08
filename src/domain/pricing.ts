import { getUnavailableReason } from "./availability";
import type { Cents } from "./money";
import type { BusinessSettings } from "./settings";
import type { Catalog, CartLine, PricedCart, PricedLine, Product } from "./types";

/**
 * ÚNICO lugar onde preço é calculado. Cardápio, sacola, checkout, mensagem de WhatsApp
 * e admin devem consumir `priceCart`, nunca refazer a conta.
 */

export interface PriceOptions {
  settings: BusinessSettings;
  now: Date;
  /** Taxa de entrega já resolvida (ver delivery.ts). 0 para retirada. */
  deliveryFeeCents?: Cents;
  /** Desconto já resolvido (ver coupons.ts). Nunca passa do subtotal. */
  discountCents?: Cents;
}

/** Preço de uma unidade: produto + adicionais escolhidos que realmente existem no produto. */
export const unitPrice = (product: Product, addonOptionIds: string[]): { cents: Cents; names: string[] } => {
  let cents = product.priceCents;
  const names: string[] = [];
  for (const group of product.addonGroups) {
    for (const option of group.options) {
      if (addonOptionIds.includes(option.id)) {
        cents += option.priceCents;
        names.push(option.name);
      }
    }
  }
  return { cents, names };
};

export const priceCart = (lines: CartLine[], catalog: Catalog, options: PriceOptions): PricedCart => {
  const { settings, now } = options;
  const byId = new Map(catalog.products.map((p) => [p.id, p]));

  const priced: PricedLine[] = lines.map((line) => {
    const product = byId.get(line.productId);
    const unavailableReason = getUnavailableReason(product, { settings, categories: catalog.categories, now });

    if (!product) {
      return {
        lineId: line.lineId,
        productId: line.productId,
        name: "Item removido do cardápio",
        quantity: line.quantity,
        unitCents: 0,
        totalCents: 0,
        addonNames: [],
        note: line.note,
        unavailableReason,
      };
    }

    const { cents, names } = unitPrice(product, line.addonOptionIds);
    return {
      lineId: line.lineId,
      productId: line.productId,
      name: product.name,
      quantity: line.quantity,
      unitCents: cents,
      totalCents: cents * line.quantity,
      addonNames: names,
      note: line.note,
      unavailableReason,
    };
  });

  const itemCount = priced.reduce((sum, l) => sum + l.quantity, 0);
  // Itens indisponíveis ficam visíveis na sacola, mas nunca entram na conta.
  const subtotalCents = priced.reduce((sum, l) => (l.unavailableReason ? sum : sum + l.totalCents), 0);
  const discountCents = Math.min(Math.max(options.discountCents ?? 0, 0), subtotalCents);
  const deliveryFeeCents = Math.max(options.deliveryFeeCents ?? 0, 0);

  return {
    lines: priced,
    itemCount,
    subtotalCents,
    discountCents,
    deliveryFeeCents,
    totalCents: subtotalCents - discountCents + deliveryFeeCents,
  };
};
