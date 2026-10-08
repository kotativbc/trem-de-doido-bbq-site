import { createLocalCatalogRepository } from "./local/localCatalogRepository";
import { createLocalSettingsRepository } from "./local/localSettingsRepository";
import { createLocalAuthRepository } from "./local/localAuthRepository";
import { createLocalCouponRepository } from "./local/localCouponRepository";
import { createLocalOrderRepository } from "./local/localOrderRepository";
import { createPhpCatalogRepository } from "./php/phpCatalogRepository";
import { createPhpEditorAccess } from "./php/phpEditorAccess";
import type { EditorSession } from "./php/phpApi";
import type {
  AuthRepository,
  CatalogRepository,
  CouponRepository,
  EditorAccessRepository,
  OrderRepository,
  SettingsRepository,
} from "./repositories";

export interface Repositories {
  catalog: CatalogRepository;
  editor: EditorAccessRepository;
  settings: SettingsRepository;
  orders: OrderRepository;
  coupons: CouponRepository;
  auth: AuthRepository;
}

export type BackendKind = "demo" | "php";

/**
 * "php": cardápio guardado no servidor (pasta api/ da hospedagem) e editor por link secreto.
 * "demo": tudo no navegador (desenvolvimento, testes e demonstração).
 */
export const backendKind: BackendKind = import.meta.env.VITE_BACKEND === "php" ? "php" : "demo";

/**
 * O painel antigo (/admin: pedidos, cupons e configurações guardados só no navegador) serve para teste e
 * demonstração. Na versão publicada ele fica desligado, para ninguém achar que ele controla o site.
 * Para ligá-lo mesmo assim: VITE_ENABLE_DEMO_ADMIN=true.
 */
export const demoAdminEnabled = backendKind === "demo" || import.meta.env.VITE_ENABLE_DEMO_ADMIN === "true";

/** true quando o cardápio é compartilhado por todos os visitantes (servidor). */
export const isSharedCatalog = backendKind === "php";

/**
 * Ponto único de escolha do "backend". Para conectar outro backend (Supabase, API própria):
 * implemente os contratos de `repositories.ts`, devolva-os aqui e documente no `.env.example`.
 */
export const createRepositories = (kind: BackendKind = backendKind): Repositories => {
  const rest = {
    settings: createLocalSettingsRepository(),
    orders: createLocalOrderRepository(),
    coupons: createLocalCouponRepository(),
    auth: createLocalAuthRepository(),
  };
  if (kind === "php") {
    const session: EditorSession = { token: null };
    return { ...rest, catalog: createPhpCatalogRepository(session), editor: createPhpEditorAccess(session) };
  }
  return { ...rest, catalog: createLocalCatalogRepository(), editor: { authorize: async () => true } };
};

export const repositories: Repositories = createRepositories();
