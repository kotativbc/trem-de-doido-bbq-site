import type { Cents } from "./money";

/* ------------------------------------------------------------------ */
/* Catálogo                                                            */
/* ------------------------------------------------------------------ */

export interface Category {
  id: string;
  /** Texto exibido na aba, incluindo o emoji (igual ao site original). */
  label: string;
  /** Mostra a faixa dourada "Disponível somente aos domingos" na aba. */
  sundayOnly: boolean;
  order: number;
  active: boolean;
}

export interface AddonOption {
  id: string;
  name: string;
  priceCents: Cents;
}

/** Grupo de adicionais/opcionais de um produto (ex.: "Molhos", "Extras"). */
export interface AddonGroup {
  id: string;
  name: string;
  /** Quantas opções do grupo o cliente pode marcar no máximo. */
  maxSelect: number;
  required: boolean;
  options: AddonOption[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: Cents;
  categoryId: string;
  /** "Novo", "Especial"... */
  badge?: string;
  /** Chave de uma imagem que já vem no projeto (src/assets/menu). */
  imageKey?: string;
  /** Imagem enviada pelo admin (URL ou data URL). Tem prioridade sobre imageKey. */
  imageUrl?: string;
  active: boolean;
  soldOut: boolean;
  /** Produto disponível somente aos domingos (borda dourada + selo "Especial"). */
  sundayOnly: boolean;
  featured: boolean;
  order: number;
  addonGroups: AddonGroup[];
}

export interface Catalog {
  categories: Category[];
  products: Product[];
}

/* ------------------------------------------------------------------ */
/* Sacola                                                              */
/* ------------------------------------------------------------------ */

/**
 * A sacola guarda só referências. Preço e nome são sempre recalculados a partir
 * do catálogo vigente, então um valor antigo no navegador nunca vira cobrança.
 */
export interface CartLine {
  lineId: string;
  productId: string;
  quantity: number;
  addonOptionIds: string[];
  /** Observação específica deste item ("sem cebola"). */
  note: string;
}

export interface PricedLine {
  lineId: string;
  productId: string;
  name: string;
  quantity: number;
  unitCents: Cents;
  totalCents: Cents;
  addonNames: string[];
  note: string;
  /** Preenchido quando o item não pode ser pedido agora. */
  unavailableReason?: "removed" | "inactive" | "soldOut" | "sundayOnly";
}

export interface PricedCart {
  lines: PricedLine[];
  itemCount: number;
  subtotalCents: Cents;
  discountCents: Cents;
  deliveryFeeCents: Cents;
  totalCents: Cents;
}

/* ------------------------------------------------------------------ */
/* Checkout / pedido                                                   */
/* ------------------------------------------------------------------ */

export type FulfillmentType = "entrega" | "retirada";
export type PaymentMethod = "pix" | "cartao" | "dinheiro";
