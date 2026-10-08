export const normalizeCep = (input: string): string => input.replace(/\D/g, "").slice(0, 8);

export const isValidCep = (input: string): boolean => /^\d{8}$/.test(input.replace(/\D/g, "")) && !/^0{8}$/.test(input.replace(/\D/g, ""));

/** "30123-456" */
export const formatCep = (input: string): string => {
  const digits = normalizeCep(input);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};
