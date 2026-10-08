import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CartLine } from "@/domain/types";
import { CART_STORAGE_KEY, loadCart, saveCart } from "./cartStorage";

const line: CartLine = { lineId: "h1::::", productId: "h1", quantity: 2, addonOptionIds: [], note: "" };

describe("persistência da sacola", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("grava e recupera as linhas", () => {
    saveCart([line]);
    expect(loadCart()).toEqual([line]);
  });

  it("grava apenas referências, nunca preço nem nome", () => {
    saveCart([line]);
    const raw = localStorage.getItem(CART_STORAGE_KEY) ?? "";
    expect(raw).not.toMatch(/price|preco|name|cents/i);
    expect(JSON.parse(raw)).toEqual({ v: 1, lines: [line] });
  });

  it("sacola vazia remove a chave", () => {
    saveCart([line]);
    saveCart([]);
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it("sem nada salvo devolve sacola vazia", () => {
    expect(loadCart()).toEqual([]);
  });

  it("JSON quebrado é descartado com aviso, sem derrubar a página", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(CART_STORAGE_KEY, "{isso não é json");
    expect(loadCart()).toEqual([]);
    expect(warn).toHaveBeenCalled();
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it.each([
    ["quantidade zero", { v: 1, lines: [{ ...line, quantity: 0 }] }],
    ["quantidade absurda", { v: 1, lines: [{ ...line, quantity: 5000 }] }],
    ["versão desconhecida", { v: 2, lines: [line] }],
    ["campo faltando", { v: 1, lines: [{ productId: "h1" }] }],
  ])("dado adulterado (%s) é ignorado", (_label, payload) => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
    expect(loadCart()).toEqual([]);
  });

  it("falha ao gravar (cota/modo privado) não lança e é registrada", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("cheio", "QuotaExceededError");
    });
    expect(() => saveCart([line])).not.toThrow();
    expect(warn).toHaveBeenCalled();
  });
});
