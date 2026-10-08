import { describe, expect, it } from "vitest";
import { categories as baselineCategories, menuItems as baselineItems } from "@/test/fixtures/baselineMenu";
import { menuImages } from "./menuImages";
import { seedCategories, seedProducts } from "./seed/catalog";

/**
 * Trava de paridade: o cardápio atual precisa continuar idêntico ao do repositório original
 * (commit 55bf1e6), EXCETO pelas atualizações abaixo, que vêm do cardápio impresso mais recente
 * (revisão de outubro/2026). Qualquer outra mudança em nome, descrição, preço, categoria ou selo
 * faz o teste falhar, o que obriga a decisão a ser consciente.
 */
const UPDATES_2026_10: Record<string, { priceCents?: number; description?: string }> = {
  h1: { priceCents: 3990 },
  h2: { priceCents: 4699 },
  h3: { priceCents: 4690 },
  h5: {
    priceCents: 5990,
    description: "Pão de brioche, 2 carnes 160g, 3 fatias cheddar, 4 fatias bacon, alface, tomate, maionese Trem de Doido e ketchup",
  },
  h8: {
    priceCents: 5990,
    description: "Costela desfiada com queijo muçarela, carne de hambúrguer 160g com queijo cheddar, rúcula, chimichurri e geleia de pimenta",
  },
  c2: { priceCents: 6990 },
  b1: { priceCents: 11000, description: "700g costela bovina defumada + 300g batata rústica com molho grill" },
  b2: { priceCents: 9990, description: "700g costelinha suína defumada com barbecue + 300g batata rústica com molho grill" },
  b7: { description: "400g costela bovina defumada + 400g costelinha barbecue + 300g batata rústica" },
};
const NEW_PRODUCTS_2026_10 = ["be6"];
describe("paridade do cardápio com o site original", () => {
  it("mesmas categorias, rótulos e ordem", () => {
    expect(seedCategories.map((c) => [c.id, c.label])).toEqual(baselineCategories.map((c) => [c.id, c.label]));
    expect(seedCategories.map((c) => c.order)).toEqual(baselineCategories.map((_, i) => i));
  });

  it("os produtos do original continuam todos presentes, mais os novos do cardápio atual", () => {
    expect(baselineItems).toHaveLength(33);
    expect(seedProducts).toHaveLength(baselineItems.length + NEW_PRODUCTS_2026_10.length);
  });

  it("produto novo: Suco Del Valle 1L por R$ 12,00, depois da Coca-Cola lata", () => {
    const suco = seedProducts.find((p) => p.id === "be6");
    expect(suco).toMatchObject({ name: "Suco Del Valle 1L", priceCents: 1200, categoryId: "bebidas", active: true });
    const bebidas = seedProducts.filter((p) => p.categoryId === "bebidas").sort((a, b) => a.order - b.order).map((p) => p.id);
    expect(bebidas).toEqual(["be1", "be2", "be3", "be6", "be4", "be5"]);
  });

  it.each(baselineItems.map((item) => [item.id, item] as const))("produto %s idêntico", (_id, item) => {
    const product = seedProducts.find((p) => p.id === item.id);
    expect(product).toBeDefined();
    const update = UPDATES_2026_10[item.id] ?? {};
    expect(product?.name).toBe(item.name);
    expect(product?.description).toBe(update.description ?? item.description);
    expect(product?.categoryId).toBe(item.category);
    expect(product?.badge).toBe(item.badge);
    expect(product?.priceCents).toBe(update.priceCents ?? Math.round(item.price * 100));
  });

  it("mesma ordem dentro de cada categoria", () => {
    for (const category of baselineCategories) {
      const expected = baselineItems.filter((i) => i.category === category.id).map((i) => i.id);
      if (category.id === "bebidas") expected.splice(expected.indexOf("be3") + 1, 0, "be6");
      const actual = seedProducts
        .filter((p) => p.categoryId === category.id)
        .sort((a, b) => a.order - b.order)
        .map((p) => p.id);
      expect(actual).toEqual(expected);
    }
  });

  it("todo produto continua com imagem", () => {
    for (const product of seedProducts.filter((p) => !NEW_PRODUCTS_2026_10.includes(p.id))) {
      expect(product.imageKey && menuImages[product.imageKey], `imagem de ${product.id}`).toBeTruthy();
    }
  });

  it("destaque dourado (somente domingo) só nos itens da categoria Domingos", () => {
    for (const product of seedProducts) {
      expect(product.sundayOnly).toBe(product.categoryId === "domingos");
    }
  });
});
