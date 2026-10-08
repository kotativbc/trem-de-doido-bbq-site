/**
 * Dinheiro sempre em centavos inteiros ("Cents") dentro do domínio.
 * A conversão para texto acontece somente aqui, para que cardápio, sacola,
 * checkout, WhatsApp e admin mostrem exatamente o mesmo valor.
 */
export type Cents = number;

export const reaisToCents = (reais: number): Cents => Math.round(reais * 100);

const decimalFormat = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "36,90" (sem símbolo). */
export const formatDecimalBRL = (cents: Cents): string => decimalFormat.format(cents / 100);

/** "R$ 36,90" com espaço comum (o Intl usa NBSP, que quebra a mensagem de WhatsApp). */
export const formatBRL = (cents: Cents): string => `R$ ${formatDecimalBRL(cents)}`;

/**
 * Converte o que o cliente digitou em centavos.
 * Aceita "100", "100,5", "100,50", "R$ 1.000,50" e "1000.50".
 * Retorna null para qualquer coisa que não seja um valor monetário válido.
 */
export const parseBRLToCents = (input: string): Cents | null => {
  const cleaned = input.replace(/R\$/gi, "").replace(/\s/g, "");
  if (cleaned === "") return null;

  let normalized: string;
  if (cleaned.includes(",")) {
    // vírgula é o decimal; pontos são separadores de milhar
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    // "1.000" ou "12.345.678": milhar
    normalized = cleaned.replace(/\./g, "");
  } else {
    normalized = cleaned;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
};
