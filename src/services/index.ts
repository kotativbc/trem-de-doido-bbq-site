import { createLocalCatalogRepository } from "./local/localCatalogRepository";
import { createLocalSettingsRepository } from "./local/localSettingsRepository";
import { createLocalAuthRepository } from "./local/localAuthRepository";
import { createLocalCouponRepository } from "./local/localCouponRepository";
import { createLocalOrderRepository } from "./local/localOrderRepository";
import type {
  AuthRepository,
  CatalogRepository,
  CouponRepository,
  OrderRepository,
  SettingsRepository,
} from "./repositories";

export interface Repositories {
  catalog: CatalogRepository;
  settings: SettingsRepository;
  orders: OrderRepository;
  coupons: CouponRepository;
  auth: AuthRepository;
}

/**
 * Ponto único de escolha do "backend". Hoje só existe o modo demo (navegador).
 * Para conectar um backend real: implemente os contratos de `repositories.ts`,
 * devolva-os aqui conforme VITE_BACKEND e documente as variáveis no `.env.example`.
 */
export const createRepositories = (): Repositories => {
  const backend = import.meta.env.VITE_BACKEND ?? "demo";
  if (backend !== "demo") {
    console.warn(`[services] VITE_BACKEND="${backend}" ainda não tem implementação; usando o modo demo.`);
  }
  return {
    catalog: createLocalCatalogRepository(),
    settings: createLocalSettingsRepository(),
    orders: createLocalOrderRepository(),
    coupons: createLocalCouponRepository(),
    auth: createLocalAuthRepository(),
  };
};

export const repositories: Repositories = createRepositories();
