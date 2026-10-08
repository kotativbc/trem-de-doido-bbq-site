import { describe, expect, it } from "vitest";
import { formatPhoneBR, isValidPhoneBR, normalizePhoneBR } from "./phone";
import { formatCep, isValidCep, normalizeCep } from "./cep";

describe("telefone BR", () => {
  it("aceita celular com máscara, com DDI e sem formatação", () => {
    expect(isValidPhoneBR("(31) 99703-6657")).toBe(true);
    expect(isValidPhoneBR("+55 31 99703-6657")).toBe(true);
    expect(isValidPhoneBR("31997036657")).toBe(true);
  });
  it("aceita fixo", () => {
    expect(isValidPhoneBR("(31) 3333-4444")).toBe(true);
  });
  it("rejeita DDD inexistente, tamanho errado e celular sem 9", () => {
    expect(isValidPhoneBR("(10) 99703-6657")).toBe(false);
    expect(isValidPhoneBR("(31) 9703-665")).toBe(false);
    expect(isValidPhoneBR("(31) 89703-6657")).toBe(false);
    expect(isValidPhoneBR("")).toBe(false);
    expect(isValidPhoneBR("abc")).toBe(false);
  });
  it("normaliza e formata", () => {
    expect(normalizePhoneBR("+55 (31) 99703-6657")).toBe("31997036657");
    expect(formatPhoneBR("31997036657")).toBe("(31) 99703-6657");
    expect(formatPhoneBR("3133334444")).toBe("(31) 3333-4444");
    expect(formatPhoneBR("123")).toBe("123");
  });
});

describe("CEP", () => {
  it("valida e formata", () => {
    expect(isValidCep("32450-000")).toBe(true);
    expect(isValidCep("3245000")).toBe(false);
    expect(isValidCep("00000-000")).toBe(false);
    expect(normalizeCep("32450-0001234")).toBe("32450000");
    expect(formatCep("32450000")).toBe("32450-000");
    expect(formatCep("3245")).toBe("3245");
  });
});
