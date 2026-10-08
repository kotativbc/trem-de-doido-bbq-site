import type { Coupon } from "@/domain/coupons";
import type { Order, OrderStatus } from "@/domain/orders";
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

export interface OrderRepository {
  /** Mais recentes primeiro. */
  list(): Promise<Order[]>;
  get(id: string): Promise<Order | null>;
  create(order: Order): Promise<void>;
  /** Aplica a transição validada pelo domínio e grava o histórico. */
  updateStatus(id: string, next: OrderStatus, note?: string): Promise<Order>;
}

export interface CouponRepository {
  list(): Promise<Coupon[]>;
  upsert(coupon: Coupon): Promise<void>;
  delete(couponId: string): Promise<void>;
  /** Soma 1 ao contador de usos do código (ignora código desconhecido). */
  registerUse(code: string): Promise<void>;
}

export const MIN_ADMIN_PASSWORD_LENGTH = 8;

/**
 * Autenticação do painel. No modo demo a senha é criada no primeiro acesso e fica só neste navegador:
 * isso impede acesso casual, mas NÃO é segurança real (quem controla o navegador controla os dados).
 * Um backend real deve implementar este contrato com autenticação e autorização no servidor.
 */
export interface AuthRepository {
  isConfigured(): Promise<boolean>;
  /** Cria a senha do primeiro acesso e já inicia a sessão. Falha se já houver senha. */
  setup(password: string): Promise<void>;
  /** Devolve false para senha incorreta; lança se estiver bloqueado por tentativas. */
  login(password: string): Promise<boolean>;
  logout(): void;
  isAuthenticated(): boolean;
  changePassword(current: string, next: string): Promise<boolean>;
}
