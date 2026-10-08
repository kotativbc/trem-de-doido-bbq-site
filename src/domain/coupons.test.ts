import { describe, expect, it } from "vitest";
import { applyCoupon, computeDiscount, normalizeCouponCode, type Coupon } from "./coupons";
import { formatBRL } from "./money";

const TZ = "America/Sao_Paulo";
const base: Coupon = {
  id: "c1",
  code: "BEMVINDO10",
  type: "percent",
  value: 10,
  active: true,
  usedCount: 0,
  minOrderCents: 0,
  description: "",
};
const now = new Date("2026-03-10T15:00:00Z"); // 12:00 em São Paulo
const run = (coupon: Partial<Coupon>, code = "bemvindo10", subtotal = 10000) =>
  applyCoupon([{ ...base, ...coupon }], code, subtotal, now, TZ, formatBRL);

describe("cupons", () => {
  it("normaliza o código", () => {
    expect(normalizeCouponCode(" bem vindo10 ")).toBe("BEMVINDO10");
  });
  it("calcula percentual arredondado e valor fixo limitado ao subtotal", () => {
    expect(computeDiscount({ type: "percent", value: 10 }, 3690)).toBe(369);
    expect(computeDiscount({ type: "percent", value: 15 }, 3999)).toBe(600);
    expect(computeDiscount({ type: "fixed", value: 5000 }, 3000)).toBe(3000);
    expect(computeDiscount({ type: "fixed", value: 500 }, 0)).toBe(0);
  });
  it("aplica um cupom válido", () => {
    const r = run({});
    expect(r.ok && r.discountCents).toBe(1000);
  });
  it("recusa inexistente, inativo, vencido, ainda não iniciado, esgotado e abaixo do mínimo", () => {
    expect(run({}, "XYZ")).toMatchObject({ ok: false, reason: "not-found" });
    expect(run({}, "")).toMatchObject({ ok: false, reason: "not-found" });
    expect(run({ active: false })).toMatchObject({ ok: false, reason: "inactive" });
    expect(run({ expiresAt: "2026-03-09" })).toMatchObject({ ok: false, reason: "expired" });
    expect(run({ startsAt: "2026-03-11" })).toMatchObject({ ok: false, reason: "not-started" });
    expect(run({ maxUses: 5, usedCount: 5 })).toMatchObject({ ok: false, reason: "exhausted" });
    expect(run({ minOrderCents: 5000 }, "bemvindo10", 4000)).toMatchObject({ ok: false, reason: "min-order" });
  });
  it("vale no último dia de validade (inclusivo)", () => {
    expect(run({ expiresAt: "2026-03-10" }).ok).toBe(true);
    expect(run({ startsAt: "2026-03-10" }).ok).toBe(true);
  });
});
