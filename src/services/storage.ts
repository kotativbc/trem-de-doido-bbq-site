import type { z } from "zod";

/**
 * Acesso ao localStorage com validação. Nunca lança: falhas (modo privado, cota cheia,
 * JSON quebrado, dado fora do schema) são registradas com console.warn e tratadas com fallback.
 */

const getStorage = (): Storage | null => {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch (error) {
    // Alguns navegadores lançam ao simples acesso a window.localStorage (cookies bloqueados).
    console.warn("[storage] localStorage indisponível:", error);
    return null;
  }
};

export const readJson = <S extends z.ZodTypeAny>(key: string, schema: S): z.output<S> | null => {
  const storage = getStorage();
  if (!storage) return null;

  const raw = storage.getItem(key);
  if (raw === null) return null;

  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
    console.warn(`[storage] "${key}" fora do formato esperado; ignorado.`, parsed.error.issues);
  } catch (error) {
    console.warn(`[storage] "${key}" ilegível; ignorado.`, error);
  }
  storage.removeItem(key);
  return null;
};

export const writeJson = (key: string, value: unknown): boolean => {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[storage] não foi possível gravar "${key}":`, error);
    return false;
  }
};

export const removeKey = (key: string): void => {
  getStorage()?.removeItem(key);
};
