import { catalogSchema } from "@/domain/schemas";
import type { Catalog, Category, Product } from "@/domain/types";
import { seedCatalog } from "@/data/seed/catalog";
import { readJson, removeKey, writeJson } from "../storage";
import type { CatalogRepository } from "../repositories";

export const CATALOG_STORAGE_KEY = "tdd.catalog.v1";

const clone = <T>(value: T): T => structuredClone(value);

const load = (): Catalog => readJson(CATALOG_STORAGE_KEY, catalogSchema) ?? clone(seedCatalog);

const save = (catalog: Catalog): void => {
  if (!writeJson(CATALOG_STORAGE_KEY, catalog)) {
    throw new Error("Não foi possível salvar o cardápio neste navegador (armazenamento indisponível ou cheio).");
  }
};

const upsertById = <T extends { id: string }>(list: T[], item: T): T[] =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

export const createLocalCatalogRepository = (): CatalogRepository => ({
  async getCatalog() {
    return load();
  },

  async upsertProduct(product) {
    const catalog = load();
    save({ ...catalog, products: upsertById<Product>(catalog.products, product) });
  },

  async deleteProduct(productId) {
    const catalog = load();
    save({ ...catalog, products: catalog.products.filter((p) => p.id !== productId) });
  },

  async upsertCategory(category) {
    const catalog = load();
    save({ ...catalog, categories: upsertById<Category>(catalog.categories, category) });
  },

  async deleteCategory(categoryId) {
    const catalog = load();
    if (catalog.products.some((p) => p.categoryId === categoryId)) {
      throw new Error("Mova ou exclua os produtos desta categoria antes de removê-la.");
    }
    save({ ...catalog, categories: catalog.categories.filter((c) => c.id !== categoryId) });
  },

  async reorderCategories(orderedIds) {
    const catalog = load();
    save({
      ...catalog,
      categories: catalog.categories.map((c) => {
        const index = orderedIds.indexOf(c.id);
        return index === -1 ? c : { ...c, order: index };
      }),
    });
  },

  async reorderProducts(categoryId, orderedIds) {
    const catalog = load();
    save({
      ...catalog,
      products: catalog.products.map((p) => {
        if (p.categoryId !== categoryId) return p;
        const index = orderedIds.indexOf(p.id);
        return index === -1 ? p : { ...p, order: index };
      }),
    });
  },

  async resetToSeed() {
    removeKey(CATALOG_STORAGE_KEY);
  },
});
