import { catalogSchema } from "@/domain/schemas";
import type { Catalog } from "@/domain/types";
import { seedCatalog } from "@/data/seed/catalog";
import { fileToResizedDataUrl } from "@/lib/image";
import {
  withCategory,
  withCategoryOrder,
  withProduct,
  withProductOrder,
  withoutCategory,
  withoutProduct,
} from "../catalogOps";
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

export const createLocalCatalogRepository = (): CatalogRepository => ({
  async getCatalog() {
    return load();
  },
  async upsertProduct(product) {
    save(withProduct(load(), product));
  },
  async deleteProduct(productId) {
    save(withoutProduct(load(), productId));
  },
  async upsertCategory(category) {
    save(withCategory(load(), category));
  },
  async deleteCategory(categoryId) {
    save(withoutCategory(load(), categoryId));
  },
  async reorderCategories(orderedIds) {
    save(withCategoryOrder(load(), orderedIds));
  },
  async reorderProducts(categoryId, orderedIds) {
    save(withProductOrder(load(), categoryId, orderedIds));
  },
  async resetToSeed() {
    removeKey(CATALOG_STORAGE_KEY);
  },
  async replaceCatalog(catalog) {
    save(catalog);
  },
  saveImage: fileToResizedDataUrl,
});
