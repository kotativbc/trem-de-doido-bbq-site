import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { readJson, writeJson } from "@/services/storage";

export const FAVORITES_STORAGE_KEY = "tdd.favorites.v1";
const favoritesSchema = z.array(z.string().min(1)).max(200);

/** Favoritos do cliente, guardados só neste navegador. */
export const useFavorites = () => {
  const [ids, setIds] = useState<string[]>(() => readJson(FAVORITES_STORAGE_KEY, favoritesSchema) ?? []);

  const toggle = useCallback((productId: string) => {
    setIds((current) => {
      const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId];
      writeJson(FAVORITES_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const set = useMemo(() => new Set(ids), [ids]);
  return { favoriteIds: set, isFavorite: (id: string) => set.has(id), toggle };
};
