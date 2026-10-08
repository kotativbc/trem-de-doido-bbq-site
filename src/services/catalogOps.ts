import type { Catalog, Category, Product } from "@/domain/types";

/**
 * Operações puras sobre o cardápio, compartilhadas pelas implementações de repositório
 * (navegador e servidor PHP), para que ambas se comportem igual.
 */

const upsertById = <T extends { id: string }>(list: T[], item: T): T[] =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

export const withProduct = (catalog: Catalog, product: Product): Catalog => ({
  ...catalog,
  products: upsertById(catalog.products, product),
});

export const withoutProduct = (catalog: Catalog, productId: string): Catalog => ({
  ...catalog,
  products: catalog.products.filter((p) => p.id !== productId),
});

export const withCategory = (catalog: Catalog, category: Category): Catalog => ({
  ...catalog,
  categories: upsertById(catalog.categories, category),
});

export const withoutCategory = (catalog: Catalog, categoryId: string): Catalog => {
  if (catalog.products.some((p) => p.categoryId === categoryId)) {
    throw new Error("Mova ou exclua os produtos desta categoria antes de removê-la.");
  }
  return { ...catalog, categories: catalog.categories.filter((c) => c.id !== categoryId) };
};

export const withCategoryOrder = (catalog: Catalog, orderedIds: string[]): Catalog => ({
  ...catalog,
  categories: catalog.categories.map((c) => {
    const index = orderedIds.indexOf(c.id);
    return index === -1 ? c : { ...c, order: index };
  }),
});

export const withProductOrder = (catalog: Catalog, categoryId: string, orderedIds: string[]): Catalog => ({
  ...catalog,
  products: catalog.products.map((p) => {
    if (p.categoryId !== categoryId) return p;
    const index = orderedIds.indexOf(p.id);
    return index === -1 ? p : { ...p, order: index };
  }),
});
