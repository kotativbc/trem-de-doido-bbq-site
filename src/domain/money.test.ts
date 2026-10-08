import { describe, expect, it } from "vitest";
import { formatBRL, formatDecimalBRL, parseBRLToCents, reaisToCents } from "./money";

describe("formatBRL", () => {
  it.each([
    [3690, "R$ 36,90"],
    [3999, "R$ 39,99"],
    [14000, "R$ 140,00"],
    [600, "R$ 6,00"],
    [0, "R$ 0,00"],
    [123456, "R$ 1.234,56"],
  ])("%i centavos -> %s", (cents, expected) => {
    expect(formatBRL(cents)).toBe(expected);
  });

  it("usa espaço comum (não NBSP), para a mensagem de WhatsApp sair idêntica à original", () => {
    expect(formatBRL(3690)).not.toMatch(/\u00a0/);
    expect(formatDecimalBRL(3690)).toBe("36,90");
  });
});

describe("reaisToCents", () => {
  it("evita erro de ponto flutuante", () => {
    expect(reaisToCents(39.99)).toBe(3999);
    expect(reaisToCents(36.9)).toBe(3690);
    expect(reaisToCents(0.1 + 0.2)).toBe(30);
  });
});

describe("parseBRLToCents", () => {
  it.each([
    ["100", 10000],
    ["100,00", 10000],
    ["100,5", 10050],
    ["R$ 100,50", 10050],
    ["1.000,50", 100050],
    ["1.000", 100000],
    ["1000.50", 100050],
    ["0,99", 99],
  ])("aceita %s", (input, expected) => {
    expect(parseBRLToCents(input)).toBe(expected);
  });

  it.each(["", "abc", "10,555", "R$", "1,2,3", "--5", "10 reais"])("rejeita %j", (input) => {
    expect(parseBRLToCents(input)).toBeNull();
  });
});
