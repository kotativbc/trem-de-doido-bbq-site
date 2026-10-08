import { describe, expect, it } from "vitest";
import { getUnavailableReason } from "./availability";
import { catalogWith, settingsWith, SP } from "@/test/helpers";

const ctx = (settings = settingsWith(), now = SP.wed19h) => ({
  settings,
  categories: catalogWith().categories,
  now,
});
const product = (patch: Record<string, unknown> = {}, id = "d1") =>
  catalogWith([{ id, ...patch }]).products.find((p) => p.id === id);

describe("getUnavailableReason", () => {
  it("produto normal está disponível", () => {
    expect(getUnavailableReason(product({}, "h1"), ctx())).toBeUndefined();
  });

  it("produto inexistente, inativo ou esgotado", () => {
    expect(getUnavailableReason(undefined, ctx())).toBe("removed");
    expect(getUnavailableReason(product({ active: false }, "h1"), ctx())).toBe("inactive");
    expect(getUnavailableReason(product({ soldOut: true }, "h1"), ctx())).toBe("soldOut");
  });

  it("categoria inativa esconde o produto", () => {
    const categories = catalogWith().categories.map((c) => (c.id === "bebidas" ? { ...c, active: false } : c));
    expect(getUnavailableReason(product({}, "be1"), { ...ctx(), categories })).toBe("inactive");
  });

  it("por padrão itens de domingo podem ser pedidos em qualquer dia (comportamento original)", () => {
    expect(getUnavailableReason(product(), ctx(settingsWith(), SP.wed19h))).toBeUndefined();
  });

  it("com a regra ligada, itens de domingo só aos domingos", () => {
    const on = settingsWith({ ordering: { enforceSundayOnly: true, allowOrdersWhenClosed: false } });
    expect(getUnavailableReason(product(), ctx(on, SP.wed19h))).toBe("sundayOnly");
    expect(getUnavailableReason(product(), ctx(on, SP.sun12h))).toBeUndefined();
  });

  it("domingo é decidido no fuso do restaurante, não em UTC", () => {
    const on = settingsWith({ ordering: { enforceSundayOnly: true, allowOrdersWhenClosed: false } });
    // 22h de domingo em São Paulo já é segunda em UTC
    expect(getUnavailableReason(product(), ctx(on, SP.sun22hSP))).toBeUndefined();
  });
});
