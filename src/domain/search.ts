import { getUnavailableReason } from "./availability";
import type { Cents } from "./money";
import type { BusinessSettings } from "./settings";
import type { Catalog, Product } from "./types";

export interface PriceBand {
  id: string;
  label: string;
  minCents: Cents;
  /** Exclusivo. undefined = sem teto. */
  maxCents?: Cents;
}

export const PRICE_BANDS: PriceBand[] = [
  { id: "ate-20", label: "Até R$ 20", minCents: 0, maxCents: 2001 },
  { id: "20-40", label: "R$ 20 a R$ 40", minCents: 2001, maxCents: 4001 },
  { id: "40-60", label: "R$ 40 a R$ 60", minCents: 4001, maxCents: 6001 },
  { id: "acima-60", label: "Acima de R$ 60", minCents: 6001 },
];

export interface MenuFilters {
  query: string;
  priceBandId: string;
  onlyAvailable: boolean;
  onlyFavorites: boolean;
}

export const emptyMenuFilters: MenuFilters = { query: "", priceBandId: "todas", onlyAvailable: false, onlyFavorites: false };

export const hasActiveFilters = (f: MenuFilters): boolean =>
  f.query.trim() !== "" || f.priceBandId !== "todas" || f.onlyAvailable || f.onlyFavorites;

const fold = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Produtos ativos que atendem à busca, à faixa de preço e (opcional) à disponibilidade agora. */
export const searchProducts = (
  catalog: Catalog,
  filters: MenuFilters,
  ctx: { settings: BusinessSettings; now: Date; favoriteIds?: ReadonlySet<string> },
): Product[] => {
  const terms = fold(filters.query).split(/\s+/).filter(Boolean);
  const band = PRICE_BANDS.find((b) => b.id === filters.priceBandId);
  const categoryOrder = new Map(catalog.categories.map((c) => [c.id, c.order]));
  const categoryLabel = new Map(catalog.categories.map((c) => [c.id, c.label]));

  return catalog.products
    .filter((p) => {
      const category = catalog.categories.find((c) => c.id === p.categoryId);
      if (!p.active || !category?.active) return false;
      if (band && (p.priceCents < band.minCents || (band.maxCents !== undefined && p.priceCents >= band.maxCents))) {
        return false;
      }
      if (filters.onlyFavorites && !ctx.favoriteIds?.has(p.id)) return false;
      if (filters.onlyAvailable) {
        if (getUnavailableReason(p, { settings: ctx.settings, categories: catalog.categories, now: ctx.now })) return false;
      }
      if (terms.length > 0) {
        const haystack = fold(`${p.name} ${p.description} ${categoryLabel.get(p.categoryId) ?? ""}`);
        if (!terms.every((t) => haystack.includes(t))) return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        (categoryOrder.get(a.categoryId) ?? 0) - (categoryOrder.get(b.categoryId) ?? 0) || a.order - b.order,
    );
};
