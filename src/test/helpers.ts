import { defaultBusinessSettings } from "@/config/business";
import type { BusinessSettings } from "@/domain/settings";
import type { Catalog, Product } from "@/domain/types";
import { seedCatalog } from "@/data/seed/catalog";
import { menuItems as originalMenu } from "@/test/fixtures/baselineMenu";

export const settingsWith = (patch: Partial<BusinessSettings> = {}): BusinessSettings => ({
  ...structuredClone(defaultBusinessSettings),
  ...patch,
});

/**
 * Os testes de regra (preço, mensagem de WhatsApp, pedido) usam os preços do cardápio ORIGINAL, congelados,
 * para que uma atualização de preços do restaurante em `seed/catalog.ts` não quebre contas que não mudaram.
 * A paridade do cardápio atual é verificada à parte, em `seedParity.test.ts`.
 */
const originalById = new Map(originalMenu.map((item) => [item.id, item]));

export const catalogWith = (products: Partial<Product>[] = []): Catalog => {
  const base = structuredClone(seedCatalog);
  base.products = base.products.map((p) => {
    const original = originalById.get(p.id);
    return original ? { ...p, priceCents: Math.round(original.price * 100), description: original.description } : p;
  });
  for (const patch of products) {
    base.products = base.products.map((p) => (p.id === patch.id ? { ...p, ...patch } : p));
  }
  return base;
};

/** Datas em UTC escolhidas para cair em dias/horas conhecidos no fuso America/Sao_Paulo (UTC-3). */
export const SP = {
  // quarta-feira 07/10/2026
  wed19h: new Date("2026-10-07T22:00:00Z"),
  wed17h: new Date("2026-10-07T20:00:00Z"),
  wed23h30: new Date("2026-10-08T02:30:00Z"),
  // segunda-feira 05/10/2026
  mon12h: new Date("2026-10-05T15:00:00Z"),
  // domingo 04/10/2026
  sun12h: new Date("2026-10-04T15:00:00Z"),
  // domingo 22h em SP, mas já segunda 01h em UTC
  sun22hSP: new Date("2026-10-05T01:00:00Z"),
  sun23h30: new Date("2026-10-05T02:30:00Z"),
};
