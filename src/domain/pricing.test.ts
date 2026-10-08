import { describe, expect, it } from "vitest";
import { priceCart } from "./pricing";
import type { CartLine, Product } from "./types";
import { catalogWith, settingsWith, SP } from "@/test/helpers";

const line = (productId: string, quantity = 1, extra: Partial<CartLine> = {}): CartLine => ({
  lineId: `${productId}::${(extra.addonOptionIds ?? []).join("+")}::${extra.note ?? ""}`,
  productId,
  quantity,
  addonOptionIds: [],
  note: "",
  ...extra,
});

const opts = { settings: settingsWith(), now: SP.wed19h };

describe("priceCart", () => {
  it("soma subtotal e total em centavos exatos", () => {
    const cart = priceCart([line("h1", 2), line("h2", 1)], catalogWith(), opts);
    // 2 x 36,90 + 39,99
    expect(cart.subtotalCents).toBe(2 * 3690 + 3999);
    expect(cart.totalCents).toBe(11379);
    expect(cart.itemCount).toBe(3);
  });

  it("não acumula erro de ponto flutuante com quantidades altas", () => {
    const cart = priceCart([line("h2", 3)], catalogWith(), opts);
    expect(cart.totalCents).toBe(11997);
  });

  it("aplica taxa de entrega e desconto uma única vez", () => {
    const cart = priceCart([line("h1", 2)], catalogWith(), { ...opts, deliveryFeeCents: 600, discountCents: 1000 });
    expect(cart.subtotalCents).toBe(7380);
    expect(cart.discountCents).toBe(1000);
    expect(cart.deliveryFeeCents).toBe(600);
    expect(cart.totalCents).toBe(7380 - 1000 + 600);
  });

  it("o desconto nunca passa do subtotal e a taxa nunca é negativa", () => {
    const cart = priceCart([line("be3", 1)], catalogWith(), { ...opts, discountCents: 99999, deliveryFeeCents: -500 });
    expect(cart.discountCents).toBe(600);
    expect(cart.deliveryFeeCents).toBe(0);
    expect(cart.totalCents).toBe(0);
  });

  it("soma adicionais e ignora ids de adicional que não existem no produto", () => {
    const withAddons: Partial<Product> = {
      id: "h1",
      addonGroups: [
        {
          id: "g1",
          name: "Extras",
          maxSelect: 2,
          required: false,
          options: [
            { id: "bacon", name: "Bacon extra", priceCents: 500 },
            { id: "queijo", name: "Queijo extra", priceCents: 300 },
          ],
        },
      ],
    };
    const cart = priceCart(
      [line("h1", 2, { addonOptionIds: ["bacon", "fantasma"] })],
      catalogWith([withAddons]),
      opts,
    );
    expect(cart.lines[0].unitCents).toBe(3690 + 500);
    expect(cart.lines[0].totalCents).toBe(2 * 4190);
    expect(cart.lines[0].addonNames).toEqual(["Bacon extra"]);
  });

  it("item esgotado fica visível mas não entra na conta", () => {
    const cart = priceCart([line("h1", 1), line("h2", 1)], catalogWith([{ id: "h2", soldOut: true }]), opts);
    expect(cart.subtotalCents).toBe(3690);
    expect(cart.itemCount).toBe(2);
    expect(cart.lines.find((l) => l.productId === "h2")?.unavailableReason).toBe("soldOut");
  });

  it("produto removido do cardápio é sinalizado e não cobra nada", () => {
    const cart = priceCart([line("fantasma", 2)], catalogWith(), opts);
    expect(cart.lines[0].unavailableReason).toBe("removed");
    expect(cart.subtotalCents).toBe(0);
  });

  it("sacola vazia dá zero", () => {
    const cart = priceCart([], catalogWith(), opts);
    expect(cart).toMatchObject({ itemCount: 0, subtotalCents: 0, totalCents: 0 });
  });
});
