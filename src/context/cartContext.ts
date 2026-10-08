import { createContext } from "react";
import type { Cents } from "@/domain/money";
import type { Catalog, PricedCart } from "@/domain/types";

export interface AddItemOptions {
  addonOptionIds?: string[];
  note?: string;
  quantity?: number;
}

export interface CartContextType {
  /** Sacola calculada (preços, nomes e disponibilidade vêm do catálogo vigente). */
  priced: PricedCart;
  /** Unidades na sacola, incluindo itens que ficaram indisponíveis. */
  totalItems: number;
  subtotalCents: Cents;
  catalog: Catalog | undefined;
  isCatalogLoading: boolean;
  isCatalogError: boolean;
  retryCatalog: () => void;
  quantityOf: (productId: string) => number;
  addItem: (productId: string, options?: AddItemOptions) => void;
  decrementProduct: (productId: string) => void;
  increment: (lineId: string) => void;
  decrement: (lineId: string) => void;
  removeLine: (lineId: string) => void;
  setLineNote: (lineId: string, note: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

export const CartContext = createContext<CartContextType | null>(null);
