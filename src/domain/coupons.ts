import { zonedParts } from "./hours";
import type { Cents } from "./money";

export type CouponType = "percent" | "fixed";

export interface Coupon {
  id: string;
  /** Sempre em maiúsculas, sem espaços. */
  code: string;
  type: CouponType;
  /** percent: 1 a 100. fixed: centavos. */
  value: number;
  active: boolean;
  /** "YYYY-MM-DD", inclusivo, no fuso do restaurante. */
  startsAt?: string;
  expiresAt?: string;
  /** Total de usos permitidos; undefined = ilimitado. */
  maxUses?: number;
  usedCount: number;
  /** Subtotal mínimo para o cupom valer. 0 = sem mínimo. */
  minOrderCents: Cents;
  description: string;
}

export type CouponFailure = "not-found" | "inactive" | "not-started" | "expired" | "exhausted" | "min-order";

export type CouponResult =
  | { ok: true; coupon: Coupon; discountCents: Cents }
  | { ok: false; reason: CouponFailure; message: string };

export const normalizeCouponCode = (code: string): string => code.replace(/\s+/g, "").toUpperCase();

export const computeDiscount = (coupon: Pick<Coupon, "type" | "value">, subtotalCents: Cents): Cents => {
  const raw = coupon.type === "percent" ? Math.round((subtotalCents * coupon.value) / 100) : coupon.value;
  return Math.min(Math.max(raw, 0), subtotalCents);
};

/**
 * Valida o cupom para este pedido. Os limites de uso e validade são checados aqui, no navegador;
 * sem um servidor eles não impedem um usuário determinado de burlá-los (ver README).
 */
export const applyCoupon = (
  coupons: Coupon[],
  rawCode: string,
  subtotalCents: Cents,
  now: Date,
  timeZone: string,
  formatMoney: (cents: Cents) => string,
): CouponResult => {
  const code = normalizeCouponCode(rawCode);
  const coupon = coupons.find((c) => c.code === code);
  if (!code || !coupon) return { ok: false, reason: "not-found", message: "Cupom não encontrado." };
  if (!coupon.active) return { ok: false, reason: "inactive", message: "Este cupom não está ativo." };

  const today = zonedParts(now, timeZone).ymd;
  if (coupon.startsAt && today < coupon.startsAt) {
    return { ok: false, reason: "not-started", message: "Este cupom ainda não começou a valer." };
  }
  if (coupon.expiresAt && today > coupon.expiresAt) {
    return { ok: false, reason: "expired", message: "Este cupom expirou." };
  }
  if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, reason: "exhausted", message: "Este cupom atingiu o limite de usos." };
  }
  if (coupon.minOrderCents > 0 && subtotalCents < coupon.minOrderCents) {
    return {
      ok: false,
      reason: "min-order",
      message: `Este cupom vale para pedidos a partir de ${formatMoney(coupon.minOrderCents)}.`,
    };
  }
  return { ok: true, coupon, discountCents: computeDiscount(coupon, subtotalCents) };
};
