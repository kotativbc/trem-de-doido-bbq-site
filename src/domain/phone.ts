/** DDDs válidos no Brasil (Anatel). */
const VALID_DDD = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92,
  93, 94, 95, 96, 97, 98, 99,
]);

/** Só dígitos, sem o DDI 55 quando presente. */
export const normalizePhoneBR = (input: string): string => {
  const digits = input.replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits.slice(2);
  return digits;
};

/** Celular: DDD + 9 + 8 dígitos. Fixo: DDD + [2-5] + 7 dígitos. */
export const isValidPhoneBR = (input: string): boolean => {
  const digits = normalizePhoneBR(input);
  if (digits.length !== 10 && digits.length !== 11) return false;
  if (!VALID_DDD.has(Number(digits.slice(0, 2)))) return false;
  const rest = digits.slice(2);
  if (digits.length === 11) return rest.startsWith("9");
  return /^[2-5]/.test(rest);
};

/** "(31) 99703-6657" ou "(31) 3333-4444". Devolve o texto original se não der para formatar. */
export const formatPhoneBR = (input: string): string => {
  const digits = normalizePhoneBR(input);
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return input.trim();
};
