import { describe, expect, it } from "vitest";
import { seedCatalog } from "@/data/seed/catalog";
import {
  withCategory,
  withCategoryOrder,
  withProduct,
  withProductOrder,
  withoutCategory,
  withoutProduct,
} from "./catalogOps";

describe("operações sobre o cardápio", () => {
  const product = seedCatalog.products.find((p) => p.id === "h1")!;

  it("cria um produto novo e atualiza um existente sem duplicar", () => {
    const created = withProduct(seedCatalog, { ...product, id: "novo", name: "Novo" });
    expect(created.products).toHaveLength(seedCatalog.products.length + 1);
    const updated = withProduct(created, { ...product, id: "novo", name: "Renomeado" });
    expect(updated.products).toHaveLength(created.products.length);
    expect(updated.products.find((p) => p.id === "novo")?.name).toBe("Renomeado");
  });

  it("não altera o cardápio original (imutável)", () => {
    const before = JSON.stringify(seedCatalog);
    withoutProduct(seedCatalog, "h1");
    withCategoryOrder(seedCatalog, ["bebidas"]);
    expect(JSON.stringify(seedCatalog)).toBe(before);
  });

  it("exclui produto", () => {
    expect(withoutProduct(seedCatalog, "h1").products.some((p) => p.id === "h1")).toBe(false);
  });

  it("recusa excluir categoria que ainda tem produtos", () => {
    expect(() => withoutCategory(seedCatalog, "hamburgueres")).toThrow(/Mova ou exclua/);
    const empty = withCategory(seedCatalog, { id: "vazia", label: "Vazia", sundayOnly: false, order: 9, active: true });
    expect(withoutCategory(empty, "vazia").categories.some((c) => c.id === "vazia")).toBe(false);
  });

  it("reordena categorias e produtos pela lista recebida", () => {
    const cats = withCategoryOrder(seedCatalog, ["bebidas", "combos"]);
    expect(cats.categories.find((c) => c.id === "bebidas")?.order).toBe(0);
    expect(cats.categories.find((c) => c.id === "combos")?.order).toBe(1);
    const prods = withProductOrder(seedCatalog, "bebidas", ["be5", "be1"]);
    expect(prods.products.find((p) => p.id === "be5")?.order).toBe(0);
    expect(prods.products.find((p) => p.id === "be1")?.order).toBe(1);
  });
});
