import { z } from "zod";
import { cartLineSchema } from "@/domain/schemas";
import type { CartLine } from "@/domain/types";
import { readJson, removeKey, writeJson } from "./storage";

export const CART_STORAGE_KEY = "tdd.cart.v1";

const storedCartSchema = z.object({ v: z.literal(1), lines: z.array(cartLineSchema) });

/** Sacola salva: só referências (id, quantidade, adicionais, observação). Nunca preço. */
export const loadCart = (): CartLine[] => readJson(CART_STORAGE_KEY, storedCartSchema)?.lines ?? [];

export const saveCart = (lines: CartLine[]): void => {
  if (lines.length === 0) {
    removeKey(CART_STORAGE_KEY);
    return;
  }
  writeJson(CART_STORAGE_KEY, { v: 1, lines });
};
