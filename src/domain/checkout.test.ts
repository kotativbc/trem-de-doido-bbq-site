import { describe, expect, it } from "vitest";
import { createCheckoutSchema, emptyCheckoutValues, type CheckoutValues } from "./checkout";

const schema = createCheckoutSchema({ totalCents: 7380 });
const valid: CheckoutValues = {
  ...emptyCheckoutValues,
  name: "Samuel",
  phone: "(31) 99703-6657",
  address: "Rua A, 10",
  neighborhood: "Centro",
};

const errorsOf = (values: CheckoutValues): Record<string, string> => {
  const result = schema.safeParse(values);
  if (result.success) return {};
  // O formulário mostra a primeira mensagem de cada campo.
  const first: Record<string, string> = {};
  for (const i of result.error.issues) first[String(i.path[0])] ??= i.message;
  return first;
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

  describe("telefone, bairro e CEP", () => {
    it("telefone é obrigatório e precisa ser brasileiro válido", () => {
      expect(errorsOf({ ...valid, phone: "" }).phone).toBe("Informe seu telefone com DDD.");
      expect(errorsOf({ ...valid, phone: "12345" }).phone).toMatch(/Telefone inválido/);
      expect(schema.safeParse({ ...valid, phone: "31997036657" }).success).toBe(true);
    });
    it("telefone também vale para retirada", () => {
      expect(errorsOf({ ...valid, fulfillment: "retirada", phone: "" }).phone).toBeDefined();
    });
    it("entrega exige bairro; retirada não", () => {
      expect(errorsOf({ ...valid, neighborhood: "" }).neighborhood).toBe("Informe o bairro.");
      expect(schema.safeParse({ ...valid, fulfillment: "retirada", neighborhood: "", address: "" }).success).toBe(true);
    });
    it("CEP é opcional, mas se vier precisa ter 8 dígitos", () => {
      expect(schema.safeParse({ ...valid, cep: "" }).success).toBe(true);
      expect(schema.safeParse({ ...valid, cep: "32450-000" }).success).toBe(true);
      expect(errorsOf({ ...valid, cep: "3245" }).cep).toMatch(/CEP inválido/);
    });
    it("campos de endereço são limitados", () => {
      expect(errorsOf({ ...valid, complement: "a".repeat(81) }).complement).toMatch(/80/);
      expect(errorsOf({ ...valid, reference: "a".repeat(201) }).reference).toMatch(/200/);
    });
  });
});
