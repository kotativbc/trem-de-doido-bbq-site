import { isSundayIn } from "./hours";
import type { BusinessSettings } from "./settings";
import type { Category, PricedLine, Product } from "./types";

export type UnavailableReason = NonNullable<PricedLine["unavailableReason"]>;

interface AvailabilityContext {
  settings: BusinessSettings;
  categories: Category[];
  now: Date;
}

/**
 * Por que um produto não pode ser pedido agora (ou undefined se pode).
 * Ordem: removido > inativo > esgotado > somente domingo.
 */
export const getUnavailableReason = (
  product: Product | undefined,
  { settings, categories, now }: AvailabilityContext,
): UnavailableReason | undefined => {
  if (!product) return "removed";
  const category = categories.find((c) => c.id === product.categoryId);
  if (!product.active || !category || !category.active) return "inactive";
  if (product.soldOut) return "soldOut";
  if (settings.ordering.enforceSundayOnly && product.sundayOnly && !isSundayIn(now, settings.timezone)) {
    return "sundayOnly";
  }
  return undefined;
};

export const unavailableMessage: Record<UnavailableReason, string> = {
  removed: "Este item não está mais no cardápio.",
  inactive: "Este item está indisponível no momento.",
  soldOut: "Item esgotado.",
  sundayOnly: "Disponível somente aos domingos.",
};
