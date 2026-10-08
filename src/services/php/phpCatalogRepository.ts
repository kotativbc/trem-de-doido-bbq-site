import { seedCatalog } from "@/data/seed/catalog";
import type { Catalog } from "@/domain/types";
import { dataUrlToBlob, fileToResizedDataUrl } from "@/lib/image";
import {
  withCategory,
  withCategoryOrder,
  withProduct,
  withProductOrder,
  withoutCategory,
  withoutProduct,
} from "../catalogOps";
import type { CatalogRepository } from "../repositories";
import { ApiNotInstalledError, fetchEnvelope, postCatalog, postImage, type EditorSession } from "./phpApi";

const clone = <T>(value: T): T => structuredClone(value);

/**
 * Cardápio guardado no servidor (PHP). A leitura é pública; qualquer gravação exige o código
 * secreto da sessão do editor, que o servidor confere de novo a cada pedido.
 */
export const createPhpCatalogRepository = (session: EditorSession): CatalogRepository => {
  /** Cardápio atual do servidor; se ainda não há nenhum salvo, parte do cardápio que vem no site. */
  const loadForWrite = async (): Promise<{ catalog: Catalog; revision: number }> => {
    try {
      const { catalog, revision } = await fetchEnvelope();
      return { catalog: catalog ?? clone(seedCatalog), revision };
    } catch (error) {
      if (error instanceof ApiNotInstalledError) throw error;
      throw new Error(error instanceof Error ? error.message : "Não foi possível ler o cardápio do servidor.");
    }
  };

  const change = async (transform: (catalog: Catalog) => Catalog): Promise<void> => {
    const { catalog, revision } = await loadForWrite();
    await postCatalog(session, transform(catalog), revision);
  };

  return {
    async getCatalog() {
      try {
        const { catalog } = await fetchEnvelope();
        return catalog ?? clone(seedCatalog);
      } catch (error) {
        // Sem API instalada (ex.: site publicado sem a pasta api/): o cardápio que vem no site continua valendo.
        if (error instanceof ApiNotInstalledError) return clone(seedCatalog);
        throw error;
      }
    },
    upsertProduct: (product) => change((c) => withProduct(c, product)),
    deleteProduct: (productId) => change((c) => withoutProduct(c, productId)),
    upsertCategory: (category) => change((c) => withCategory(c, category)),
    deleteCategory: (categoryId) => change((c) => withoutCategory(c, categoryId)),
    reorderCategories: (orderedIds) => change((c) => withCategoryOrder(c, orderedIds)),
    reorderProducts: (categoryId, orderedIds) => change((c) => withProductOrder(c, categoryId, orderedIds)),
    resetToSeed: () => change(() => clone(seedCatalog)),
    replaceCatalog: (catalog) => change(() => catalog),
    async saveImage(file) {
      const resized = await fileToResizedDataUrl(file);
      return postImage(session, dataUrlToBlob(resized));
    },
  };
};
