import { z } from "zod";
import type { Coupon } from "@/domain/coupons";
import { couponSchema } from "@/domain/schemas";
import { readJson, writeJson } from "../storage";
import type { CouponRepository } from "../repositories";

export const COUPONS_STORAGE_KEY = "tdd.coupons.v1";

const couponsSchema = z.array(couponSchema);

const readAll = (): Coupon[] => readJson(COUPONS_STORAGE_KEY, couponsSchema) ?? [];

const writeAll = (coupons: Coupon[]): void => {
  if (!writeJson(COUPONS_STORAGE_KEY, coupons)) {
    throw new Error("Não foi possível salvar os cupons neste navegador (armazenamento indisponível ou cheio).");
  }
};

export const createLocalCouponRepository = (): CouponRepository => ({
  async list() {
    return readAll();
  },

  async upsert(coupon: Coupon) {
    const parsed = couponSchema.parse(coupon);
    const all = readAll();
    if (all.some((c) => c.code === parsed.code && c.id !== parsed.id)) {
      throw new Error(`Já existe um cupom com o código ${parsed.code}.`);
    }
    const exists = all.some((c) => c.id === parsed.id);
    writeAll(exists ? all.map((c) => (c.id === parsed.id ? parsed : c)) : [...all, parsed]);
  },

  async delete(couponId: string) {
    writeAll(readAll().filter((c) => c.id !== couponId));
  },

  async registerUse(code: string) {
    writeAll(readAll().map((c) => (c.code === code ? { ...c, usedCount: c.usedCount + 1 } : c)));
  },
});
