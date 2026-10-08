import { createContext } from "react";
import type { Cents } from "@/domain/money";
import type { Catalog, CartLine, PricedCart } from "@/domain/types";

export interface AddItemOptions {
  addonOptionIds?: string[];
  note?: string;
  quantity?: number;
}

export interface PriceWithOptions {
  deliveryFeeCents?: Cents;
  discountCents?: Cents;
}

/** Linha de um pedido anterior, usada por "Pedir novamente". */
export interface ReorderLine {
  productId: string;
  quantity: number;
  addonOptionIds: string[];
  note: string;
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
  /** Recalcula a sacola com taxa e desconto (único cálculo de preço do sistema: `priceCart`). */
  priceWith: (options: PriceWithOptions) => PricedCart;
  /** Linhas cruas da sacola (referências), para quem precisa sincronizar com o armazenamento. */
  lines: CartLine[];
  /** Troca a sacola pelos itens de um pedido anterior; devolve quantos entraram e quantos não existem mais. */
  reorder: (lines: ReorderLine[]) => { added: number; skipped: number };
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
