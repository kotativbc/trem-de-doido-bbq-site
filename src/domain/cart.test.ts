import { describe, expect, it } from "vitest";
import { cartReducer, makeLineId, MAX_LINE_QUANTITY, quantityOfProduct } from "./cart";
import type { CartLine } from "./types";

const run = (actions: Parameters<typeof cartReducer>[1][], start: CartLine[] = []) =>
  actions.reduce(cartReducer, start);

describe("cartReducer", () => {
  it("adiciona um item novo com quantidade 1", () => {
    const lines = run([{ type: "add", productId: "h1" }]);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ productId: "h1", quantity: 1, addonOptionIds: [], note: "" });
  });

  it("somar o mesmo produto aumenta a quantidade, sem duplicar a linha", () => {
    const lines = run([
      { type: "add", productId: "h1" },
      { type: "add", productId: "h1" },
      { type: "add", productId: "h1" },
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(3);
  });

  it("remove a linha quando a quantidade chega a zero", () => {
    const lines = run([
      { type: "add", productId: "h1" },
      { type: "add", productId: "h1" },
      { type: "decrementProduct", productId: "h1" },
      { type: "decrementProduct", productId: "h1" },
    ]);
    expect(lines).toEqual([]);
  });

  it("decrementar produto inexistente não faz nada", () => {
    const start = run([{ type: "add", productId: "h1" }]);
    expect(cartReducer(start, { type: "decrementProduct", productId: "zzz" })).toBe(start);
  });

  it("mesmo produto com observações diferentes vira linhas separadas", () => {
    const lines = run([
      { type: "add", productId: "h1" },
      { type: "add", productId: "h1", note: "sem cebola" },
    ]);
    expect(lines).toHaveLength(2);
    expect(quantityOfProduct(lines, "h1")).toBe(2);
  });

  it("o botão − do cartão prefere a linha simples", () => {
    const lines = run([
      { type: "add", productId: "h1" },
      { type: "add", productId: "h1", note: "sem cebola" },
      { type: "decrementProduct", productId: "h1" },
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0].note).toBe("sem cebola");
  });

  it("a ordem dos adicionais não cria linhas diferentes", () => {
    expect(makeLineId("h1", ["b", "a"])).toBe(makeLineId("h1", ["a", "b"]));
  });

  it("incrementa e decrementa por lineId", () => {
    const [first] = run([{ type: "add", productId: "h1" }]);
    const up = cartReducer([first], { type: "increment", lineId: first.lineId });
    expect(up[0].quantity).toBe(2);
    expect(cartReducer(up, { type: "decrement", lineId: first.lineId })[0].quantity).toBe(1);
  });

  it("limita a quantidade por linha", () => {
    const lines = run([{ type: "add", productId: "h1", quantity: 500 }]);
    expect(lines[0].quantity).toBe(MAX_LINE_QUANTITY);
    const more = cartReducer(lines, { type: "increment", lineId: lines[0].lineId });
    expect(more[0].quantity).toBe(MAX_LINE_QUANTITY);
  });

  it("editar a observação junta linhas que passam a ser iguais", () => {
    const start = run([
      { type: "add", productId: "h1" },
      { type: "add", productId: "h1", note: "sem cebola" },
    ]);
    const withNote = start[1];
    const merged = cartReducer(start, { type: "setNote", lineId: withNote.lineId, note: "" });
    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(2);
  });

  it("remove uma linha e limpa a sacola", () => {
    const start = run([
      { type: "add", productId: "h1" },
      { type: "add", productId: "h2" },
    ]);
    expect(cartReducer(start, { type: "remove", lineId: start[0].lineId })).toHaveLength(1);
    expect(cartReducer(start, { type: "clear" })).toEqual([]);
  });
});
