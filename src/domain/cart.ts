import type { CartLine } from "./types";

export const MAX_LINE_QUANTITY = 99;

export const makeLineId = (productId: string, addonOptionIds: string[] = [], note = ""): string =>
  `${productId}::${[...addonOptionIds].sort().join("+")}::${note.trim()}`;

export type CartAction =
  | { type: "add"; productId: string; quantity?: number; addonOptionIds?: string[]; note?: string }
  | { type: "increment"; lineId: string }
  | { type: "decrement"; lineId: string }
  /** Botão "−" do cartão do cardápio: tira uma unidade do produto, sem saber de qual linha. */
  | { type: "decrementProduct"; productId: string }
  | { type: "setNote"; lineId: string; note: string }
  | { type: "remove"; lineId: string }
  | { type: "clear" }
  | { type: "replace"; lines: CartLine[] };

const clamp = (n: number): number => Math.min(Math.max(Math.trunc(n), 0), MAX_LINE_QUANTITY);

const changeQuantity = (lines: CartLine[], lineId: string, delta: number): CartLine[] =>
  lines.flatMap((line) => {
    if (line.lineId !== lineId) return [line];
    const quantity = clamp(line.quantity + delta);
    return quantity === 0 ? [] : [{ ...line, quantity }];
  });

export const cartReducer = (lines: CartLine[], action: CartAction): CartLine[] => {
  switch (action.type) {
    case "add": {
      const addonOptionIds = action.addonOptionIds ?? [];
      const note = (action.note ?? "").trim();
      const lineId = makeLineId(action.productId, addonOptionIds, note);
      const quantity = clamp(action.quantity ?? 1);
      if (quantity === 0) return lines;
      const existing = lines.find((l) => l.lineId === lineId);
      if (existing) return changeQuantity(lines, lineId, quantity);
      return [...lines, { lineId, productId: action.productId, quantity, addonOptionIds: [...addonOptionIds], note }];
    }
    case "increment":
      return changeQuantity(lines, action.lineId, 1);
    case "decrement":
      return changeQuantity(lines, action.lineId, -1);
    case "decrementProduct": {
      const ofProduct = lines.filter((l) => l.productId === action.productId);
      if (ofProduct.length === 0) return lines;
      // Prefere a linha "simples" (sem adicionais nem observação); senão, a última adicionada.
      const simple = ofProduct.find((l) => l.addonOptionIds.length === 0 && l.note === "");
      const target = simple ?? ofProduct[ofProduct.length - 1];
      return changeQuantity(lines, target.lineId, -1);
    }
    case "setNote": {
      const source = lines.find((l) => l.lineId === action.lineId);
      if (!source) return lines;
      const note = action.note.trim();
      const newId = makeLineId(source.productId, source.addonOptionIds, note);
      if (newId === source.lineId) return lines;
      const twin = lines.find((l) => l.lineId === newId);
      if (twin) {
        // A nova observação coincide com outra linha: junta as duas.
        const merged = clamp(twin.quantity + source.quantity);
        return lines
          .filter((l) => l.lineId !== source.lineId)
          .map((l) => (l.lineId === newId ? { ...l, quantity: merged } : l));
      }
      return lines.map((l) => (l.lineId === source.lineId ? { ...l, lineId: newId, note } : l));
    }
    case "remove":
      return lines.filter((l) => l.lineId !== action.lineId);
    case "clear":
      return [];
    case "replace":
      return action.lines;
  }
};

export const quantityOfProduct = (lines: CartLine[], productId: string): number =>
  lines.reduce((sum, l) => (l.productId === productId ? sum + l.quantity : sum), 0);
