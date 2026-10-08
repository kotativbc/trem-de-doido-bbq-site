import type { BusinessSettings } from "@/domain/settings";
import type { Catalog, Category, Product } from "@/domain/types";

/**
 * Contratos de acesso a dados. A interface (componentes, hooks e regras) só conhece
 * estes tipos; a implementação atual grava no navegador (modo demo). Para usar um
 * backend real (Supabase, API própria) basta criar outra implementação destes contratos
 * e trocá-la em `services/index.ts`, sem tocar nos componentes.
 */

export interface CatalogRepository {
  getCatalog(): Promise<Catalog>;
  upsertProduct(product: Product): Promise<void>;
  deleteProduct(productId: string): Promise<void>;
  upsertCategory(category: Category): Promise<void>;
  /** Falha se ainda existirem produtos na categoria. */
  deleteCategory(categoryId: string): Promise<void>;
  reorderCategories(orderedIds: string[]): Promise<void>;
  reorderProducts(categoryId: string, orderedIds: string[]): Promise<void>;
  /** Volta ao cardápio original do projeto. */
  resetToSeed(): Promise<void>;
}

export interface SettingsRepository {
  getSettings(): Promise<BusinessSettings>;
  saveSettings(settings: BusinessSettings): Promise<void>;
  resetToDefaults(): Promise<void>;
}
