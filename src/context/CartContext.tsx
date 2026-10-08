import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { toast } from "sonner";
import { cartReducer, makeLineId, quantityOfProduct } from "@/domain/cart";
import { priceCart } from "@/domain/pricing";
import { useCatalog } from "@/hooks/useCatalog";
import { useSettings } from "@/hooks/useSettings";
import { CART_STORAGE_KEY, loadCart, saveCart } from "@/services/cartStorage";
import { getUnavailableReason } from "@/domain/availability";
import { CartContext, type CartContextType, type PriceWithOptions, type ReorderLine } from "./cartContextValue";

const EMPTY_CATALOG = { categories: [], products: [] };

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lines, dispatch] = useReducer(cartReducer, undefined, loadCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const catalogQuery = useCatalog();
  const settings = useSettings();
  const catalog = catalogQuery.data;

  // Persiste a sacola a cada mudança.
  useEffect(() => {
    saveCart(lines);
  }, [lines]);

  // Mantém várias abas do mesmo navegador sincronizadas.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY || event.key === null) {
        dispatch({ type: "replace", lines: loadCart() });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Descarta da sacola salva os produtos que não existem mais no cardápio (avisando o cliente).
  const pruned = useRef(false);
  useEffect(() => {
    if (!catalog || pruned.current) return;
    pruned.current = true;
    const known = new Set(catalog.products.map((p) => p.id));
    const kept = lines.filter((l) => known.has(l.productId));
    if (kept.length !== lines.length) {
      dispatch({ type: "replace", lines: kept });
      toast.info("Alguns itens da sua sacola saíram do cardápio e foram removidos.");
    }
  }, [catalog, lines]);

  const priced = useMemo(
    () => priceCart(lines, catalog ?? EMPTY_CATALOG, { settings, now: new Date() }),
    [lines, catalog, settings],
  );

  const priceWith = useCallback(
    (options: PriceWithOptions) =>
      priceCart(lines, catalog ?? EMPTY_CATALOG, { settings, now: new Date(), ...options }),
    [lines, catalog, settings],
  );

  const reorder = useCallback(
    (wanted: ReorderLine[]) => {
      if (!catalog) return { added: 0, skipped: wanted.length };
      const now = new Date();
      const next = wanted.flatMap((w) => {
        const product = catalog.products.find((p) => p.id === w.productId);
        if (!product || getUnavailableReason(product, { settings, categories: catalog.categories, now })) return [];
        // Só mantém adicionais que ainda existem no produto.
        const valid = new Set(product.addonGroups.flatMap((g) => g.options.map((o) => o.id)));
        const addonOptionIds = w.addonOptionIds.filter((id) => valid.has(id));
        return [{ lineId: makeLineId(w.productId, addonOptionIds, w.note), productId: w.productId, quantity: w.quantity, addonOptionIds, note: w.note }];
      });
      dispatch({ type: "replace", lines: next });
      return { added: next.length, skipped: wanted.length - next.length };
    },
    [catalog, settings],
  );

  const addItem = useCallback<CartContextType["addItem"]>(
    (productId, options) => dispatch({ type: "add", productId, ...options }),
    [],
  );
  const decrementProduct = useCallback((productId: string) => dispatch({ type: "decrementProduct", productId }), []);
  const increment = useCallback((lineId: string) => dispatch({ type: "increment", lineId }), []);
  const decrement = useCallback((lineId: string) => dispatch({ type: "decrement", lineId }), []);
  const removeLine = useCallback((lineId: string) => dispatch({ type: "remove", lineId }), []);
  const setLineNote = useCallback((lineId: string, note: string) => dispatch({ type: "setNote", lineId, note }), []);
  const clearCart = useCallback(() => dispatch({ type: "clear" }), []);
  const quantityOf = useCallback((productId: string) => quantityOfProduct(lines, productId), [lines]);
  const retryCatalog = useCallback(() => void catalogQuery.refetch(), [catalogQuery]);

  const value = useMemo<CartContextType>(
    () => ({
      priced,
      totalItems: priced.itemCount,
      subtotalCents: priced.subtotalCents,
      catalog,
      isCatalogLoading: catalogQuery.isLoading,
      isCatalogError: catalogQuery.isError,
      retryCatalog,
      priceWith,
      lines,
      reorder,
      quantityOf,
      addItem,
      decrementProduct,
      increment,
      decrement,
      removeLine,
      setLineNote,
      clearCart,
      isCartOpen,
      setIsCartOpen,
    }),
    [
      priced,
      catalog,
      catalogQuery.isLoading,
      catalogQuery.isError,
      retryCatalog,
      priceWith,
      lines,
      reorder,
      quantityOf,
      addItem,
      decrementProduct,
      increment,
      decrement,
      removeLine,
      setLineNote,
      clearCart,
      isCartOpen,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
