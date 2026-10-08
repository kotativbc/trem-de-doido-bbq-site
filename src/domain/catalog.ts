import type { Catalog, Category, Product } from "./types";

const byOrder = <T extends { order: number }>(a: T, b: T): number => a.order - b.order;

/** Categorias ativas, na ordem definida pelo restaurante. */
export const visibleCategories = (catalog: Catalog): Category[] =>
  catalog.categories.filter((c) => c.active).sort(byOrder);

/** Produtos ativos de uma categoria, na ordem definida. Esgotados continuam aparecendo (marcados). */
export const visibleProducts = (catalog: Catalog, categoryId: string): Product[] =>
  catalog.products.filter((p) => p.active && p.categoryId === categoryId).sort(byOrder);
