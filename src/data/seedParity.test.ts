import { describe, expect, it } from "vitest";
import { categories as baselineCategories, menuItems as baselineItems } from "@/test/fixtures/baselineMenu";
import { menuImages } from "./menuImages";
import { seedCategories, seedProducts } from "./seed/catalog";

/**
 * Trava de paridade: o cardápio atual precisa continuar idêntico ao do repositório original
 * (commit 55bf1e6). Se alguém alterar nome, descrição, preço, categoria ou selo no seed,
 * este teste falha, o que obriga a decisão a ser consciente.
 */
describe("paridade do cardápio com o site original", () => {
  it("mesmas categorias, rótulos e ordem", () => {
    expect(seedCategories.map((c) => [c.id, c.label])).toEqual(baselineCategories.map((c) => [c.id, c.label]));
    expect(seedCategories.map((c) => c.order)).toEqual(baselineCategories.map((_, i) => i));
  });

  it("mesmo número de produtos (33)", () => {
    expect(baselineItems).toHaveLength(33);
    expect(seedProducts).toHaveLength(baselineItems.length);
  });

  it.each(baselineItems.map((item) => [item.id, item] as const))("produto %s idêntico", (_id, item) => {
    const product = seedProducts.find((p) => p.id === item.id);
    expect(product).toBeDefined();
    expect(product?.name).toBe(item.name);
    expect(product?.description).toBe(item.description);
    expect(product?.categoryId).toBe(item.category);
    expect(product?.badge).toBe(item.badge);
    expect(product?.priceCents).toBe(Math.round(item.price * 100));
  });

  it("mesma ordem dentro de cada categoria", () => {
    for (const category of baselineCategories) {
      const expected = baselineItems.filter((i) => i.category === category.id).map((i) => i.id);
      const actual = seedProducts
        .filter((p) => p.categoryId === category.id)
        .sort((a, b) => a.order - b.order)
        .map((p) => p.id);
      expect(actual).toEqual(expected);
    }
  });

  it("todo produto continua com imagem", () => {
    for (const product of seedProducts) {
      expect(product.imageKey && menuImages[product.imageKey], `imagem de ${product.id}`).toBeTruthy();
    }
  });

  it("destaque dourado (somente domingo) só nos itens da categoria Domingos", () => {
    for (const product of seedProducts) {
      expect(product.sundayOnly).toBe(product.categoryId === "domingos");
    }
  });
});
