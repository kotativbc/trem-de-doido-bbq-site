import { describe, expect, it } from "vitest";
import { seedCatalog } from "@/data/seed/catalog";
import { defaultBusinessSettings } from "@/config/business";
import { emptyMenuFilters, hasActiveFilters, searchProducts } from "./search";

const ctx = { settings: defaultBusinessSettings, now: new Date("2026-03-11T22:00:00Z") }; // quarta
const run = (f: Partial<typeof emptyMenuFilters>) => searchProducts(seedCatalog, { ...emptyMenuFilters, ...f }, ctx);

describe("busca e filtros do cardápio", () => {
  it("sem filtros devolve todos os produtos ativos", () => {
    expect(run({}).length).toBe(seedCatalog.products.filter((p) => p.active).length);
    expect(hasActiveFilters(emptyMenuFilters)).toBe(false);
  });
  it("ignora acento e caixa e exige todos os termos", () => {
    const all = run({ query: "HAMBURGUER" });
    expect(all.length).toBeGreaterThan(0);
    expect(run({ query: "hamburguer zzzzz" })).toHaveLength(0);
  });
  it("respeita a faixa de preço", () => {
    const cheap = run({ priceBandId: "ate-20" });
    expect(cheap.every((p) => p.priceCents <= 2000)).toBe(true);
    const top = run({ priceBandId: "acima-60" });
    expect(top.every((p) => p.priceCents > 6000)).toBe(true);
  });
  it("'só disponíveis' remove esgotados e inativos", () => {
    const catalog = {
      ...seedCatalog,
      products: seedCatalog.products.map((p, i) => (i === 0 ? { ...p, soldOut: true } : p)),
    };
    const sold = catalog.products[0];
    const without = searchProducts(catalog, { ...emptyMenuFilters, onlyAvailable: true }, ctx);
    const withAll = searchProducts(catalog, emptyMenuFilters, ctx);
    expect(withAll.some((p) => p.id === sold.id)).toBe(true);
    expect(without.some((p) => p.id === sold.id)).toBe(false);
  });
  it("nunca devolve produto inativo", () => {
    const catalog = { ...seedCatalog, products: seedCatalog.products.map((p, i) => (i === 1 ? { ...p, active: false } : p)) };
    expect(searchProducts(catalog, emptyMenuFilters, ctx).some((p) => p.id === catalog.products[1].id)).toBe(false);
  });
  it("'só favoritos' mantém apenas os ids favoritados", () => {
    const favs = new Set(["h1", "be3"]);
    const result = searchProducts(seedCatalog, { ...emptyMenuFilters, onlyFavorites: true }, { ...ctx, favoriteIds: favs });
    expect(result.map((p) => p.id).sort()).toEqual(["be3", "h1"]);
    expect(searchProducts(seedCatalog, { ...emptyMenuFilters, onlyFavorites: true }, ctx)).toHaveLength(0);
    expect(hasActiveFilters({ ...emptyMenuFilters, onlyFavorites: true })).toBe(true);
  });
});
