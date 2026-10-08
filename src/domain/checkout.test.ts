import { describe, expect, it } from "vitest";
import { createCheckoutSchema, emptyCheckoutValues, type CheckoutValues } from "./checkout";

const schema = createCheckoutSchema({ totalCents: 7380 });
const valid: CheckoutValues = {
  ...emptyCheckoutValues,
  name: "Samuel",
  address: "Rua A, 10, Centro",
};

const errorsOf = (values: CheckoutValues): Record<string, string> => {
  const result = schema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message]));
};

describe("validação do checkout", () => {
  it("entrega com nome e endereço é válida", () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it("nome é obrigatório", () => {
    expect(errorsOf({ ...valid, name: "   " }).name).toBe("Informe seu nome.");
  });

  it("entrega exige endereço; retirada não", () => {
    expect(errorsOf({ ...valid, address: "" }).address).toBe("Informe o endereço de entrega.");
    expect(schema.safeParse({ ...valid, fulfillment: "retirada", address: "" }).success).toBe(true);
  });

  describe("troco (regra única)", () => {
    const cash = (changeFor: string): CheckoutValues => ({ ...valid, payment: "dinheiro", changeFor });

    it("é opcional: vazio vale", () => {
      expect(schema.safeParse(cash("")).success).toBe(true);
    });

    it("aceita valor que cobre o total, inclusive igual", () => {
      expect(schema.safeParse(cash("100,00")).success).toBe(true);
      expect(schema.safeParse(cash("73,80")).success).toBe(true);
    });

    it("rejeita texto que não é dinheiro", () => {
      expect(errorsOf(cash("abc")).changeFor).toMatch(/valor válido/);
      expect(errorsOf(cash("0")).changeFor).toMatch(/valor válido/);
    });

    it("rejeita valor menor que o total", () => {
      expect(errorsOf(cash("50")).changeFor).toBe("O valor para troco precisa cobrir o total (R$ 73,80).");
    });

    it("com Pix ou cartão o campo de troco é ignorado", () => {
      expect(schema.safeParse({ ...valid, payment: "pix", changeFor: "abc" }).success).toBe(true);
      expect(schema.safeParse({ ...valid, payment: "cartao", changeFor: "1" }).success).toBe(true);
    });
  });

  it("limita o tamanho dos textos", () => {
    expect(errorsOf({ ...valid, name: "a".repeat(81) }).name).toMatch(/80/);
    expect(errorsOf({ ...valid, notes: "a".repeat(501) }).notes).toMatch(/500/);
  });
});
