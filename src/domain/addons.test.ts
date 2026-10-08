import { describe, expect, it } from "vitest";
import { hasAddonChoices, validateAddonSelection } from "./addons";
import { priceCart, unitPrice } from "./pricing";
import type { Product } from "./types";
import { catalogWith, settingsWith, SP } from "@/test/helpers";

const product: Product = {
  ...catalogWith().products[0],
  id: "p",
  priceCents: 3000,
  addonGroups: [
    {
      id: "g-molho",
      name: "Molhos",
      maxSelect: 2,
      required: false,
      options: [
        { id: "o-bbq", name: "BBQ", priceCents: 300 },
        { id: "o-alho", name: "Alho", priceCents: 0 },
        { id: "o-pimenta", name: "Pimenta", priceCents: 200 },
      ],
    },
    {
      id: "g-ponto",
      name: "Ponto da carne",
      maxSelect: 1,
      required: true,
      options: [
        { id: "o-mal", name: "Mal passado", priceCents: 0 },
        { id: "o-bem", name: "Bem passado", priceCents: 0 },
      ],
    },
  ],
};

describe("adicionais", () => {
  it("exige grupos obrigatórios e respeita o máximo", () => {
    expect(validateAddonSelection(product, [])).toEqual({
      ok: false,
      errors: { "g-ponto": 'Escolha ao menos uma opção em "Ponto da carne".' },
    });
    expect(validateAddonSelection(product, ["o-bem", "o-bbq", "o-alho", "o-pimenta"])).toMatchObject({
      ok: false,
      errors: { "g-molho": 'Escolha no máximo 2 em "Molhos".' },
    });
    expect(validateAddonSelection(product, ["o-bem", "o-mal"])).toMatchObject({ ok: false });
    expect(validateAddonSelection(product, ["o-bem", "o-bbq"])).toEqual({ ok: true });
  });

  it("recusa opções que não pertencem ao produto", () => {
    expect(validateAddonSelection(product, ["o-bem", "inventada"])).toMatchObject({ ok: false });
  });

  it("detecta produtos com escolhas", () => {
    expect(hasAddonChoices(product)).toBe(true);
    expect(hasAddonChoices({ ...product, addonGroups: [] })).toBe(false);
    expect(hasAddonChoices({ ...product, addonGroups: [{ ...product.addonGroups[0], options: [] }] })).toBe(false);
  });

  it("o preço soma os adicionais pela camada única e ignora ids inexistentes", () => {
    expect(unitPrice(product, ["o-bbq", "o-pimenta", "fantasma"])).toEqual({
      cents: 3500,
      names: ["BBQ", "Pimenta"],
      ids: ["o-bbq", "o-pimenta"],
    });
    const catalog = { ...catalogWith(), products: [product] };
    const cart = priceCart(
      [{ lineId: "x", productId: "p", quantity: 2, addonOptionIds: ["o-bbq", "o-bem"], note: "sem sal" }],
      catalog,
      { settings: settingsWith(), now: SP.wed19h },
    );
    expect(cart.lines[0]).toMatchObject({ unitCents: 3300, totalCents: 6600, addonNames: ["BBQ", "Bem passado"], note: "sem sal" });
    expect(cart.subtotalCents).toBe(6600);
  });
});
