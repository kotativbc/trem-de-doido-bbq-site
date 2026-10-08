import type { CheckoutValues } from "./checkout";
import { parseBRLToCents, type Cents } from "./money";
import type { FulfillmentType, PaymentMethod, PricedCart } from "./types";

export const ORDER_STATUSES = [
  "recebido",
  "confirmado",
  "em_preparo",
  "pronto",
  "saiu_para_entrega",
  "concluido",
  "cancelado",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const statusLabel: Record<OrderStatus, string> = {
  recebido: "Recebido",
  confirmado: "Confirmado",
  em_preparo: "Em preparo",
  pronto: "Pronto",
  saiu_para_entrega: "Saiu para entrega",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export interface OrderLineSnapshot {
  productId: string;
  name: string;
  quantity: number;
  unitCents: Cents;
  totalCents: Cents;
  addonNames: string[];
  addonOptionIds: string[];
  note: string;
}

export interface OrderStatusChange {
  status: OrderStatus;
  /** ISO 8601. */
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  history: OrderStatusChange[];
  customer: { name: string; phone: string };
  fulfillment: FulfillmentType;
  address: {
    street: string;
    neighborhood: string;
    cep: string;
    complement: string;
    reference: string;
  };
  payment: PaymentMethod;
  changeForCents?: Cents;
  lines: OrderLineSnapshot[];
  subtotalCents: Cents;
  discountCents: Cents;
  deliveryFeeCents: Cents;
  totalCents: Cents;
  couponCode?: string;
  notes: string;
  estimate: string;
  /** Texto exato enviado ao WhatsApp; permite reenviar se a janela foi bloqueada ou fechada. */
  whatsappMessage?: string;
}

export const isFinalStatus = (status: OrderStatus): boolean => status === "concluido" || status === "cancelado";

/** Sequência de atendimento: a retirada pula "saiu para entrega". */
export const statusFlow = (fulfillment: FulfillmentType): OrderStatus[] =>
  fulfillment === "entrega"
    ? ["recebido", "confirmado", "em_preparo", "pronto", "saiu_para_entrega", "concluido"]
    : ["recebido", "confirmado", "em_preparo", "pronto", "concluido"];

/** Estados para os quais o pedido pode ir agora: qualquer etapa à frente, ou cancelar. */
export const allowedTransitions = (order: Pick<Order, "status" | "fulfillment">): OrderStatus[] => {
  if (isFinalStatus(order.status)) return [];
  const flow = statusFlow(order.fulfillment);
  const index = flow.indexOf(order.status);
  return [...flow.slice(index + 1), "cancelado"];
};

export const canTransition = (order: Pick<Order, "status" | "fulfillment">, next: OrderStatus): boolean =>
  allowedTransitions(order).includes(next);

/** Aplica a mudança de status registrando data/hora no histórico. Lança se a transição não for permitida. */
export const changeStatus = (order: Order, next: OrderStatus, now: Date, note?: string): Order => {
  if (!canTransition(order, next)) {
    throw new Error(`Transição inválida: ${statusLabel[order.status]} → ${statusLabel[next]}.`);
  }
  const at = now.toISOString();
  const entry: OrderStatusChange = note?.trim() ? { status: next, at, note: note.trim() } : { status: next, at };
  return { ...order, status: next, updatedAt: at, history: [...order.history, entry] };
};

const ID_ALPHABET = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export const generateOrderId = (random: () => number = Math.random): string =>
  `TDD-${Array.from({ length: 6 }, () => ID_ALPHABET[Math.floor(random() * ID_ALPHABET.length)]).join("")}`;

/* ---------------------------- filtros do admin ---------------------------- */

export interface OrderFilters {
  status?: OrderStatus | "todos";
  fulfillment?: FulfillmentType | "todos";
  payment?: PaymentMethod | "todos";
  /** "YYYY-MM-DD" inclusivos, no fuso do restaurante. */
  from?: string;
  to?: string;
  /** Nome ou telefone. */
  query?: string;
}

const digitsOf = (text: string): string => text.replace(/\D/g, "");
const fold = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const filterOrders = (orders: Order[], filters: OrderFilters, dayOf: (iso: string) => string): Order[] => {
  const query = filters.query?.trim() ?? "";
  // Só trata como telefone quando a consulta é um número ("(31) 9970", "99703"); "tdd-1" não é.
  const looksLikePhone = /^[\d\s()+-]+$/.test(query);
  const queryDigits = looksLikePhone ? digitsOf(query) : "";

  return orders
    .filter((o) => {
      if (filters.status && filters.status !== "todos" && o.status !== filters.status) return false;
      if (filters.fulfillment && filters.fulfillment !== "todos" && o.fulfillment !== filters.fulfillment) return false;
      if (filters.payment && filters.payment !== "todos" && o.payment !== filters.payment) return false;
      const day = dayOf(o.createdAt);
      if (filters.from && day < filters.from) return false;
      if (filters.to && day > filters.to) return false;
      if (query) {
        const byName = fold(o.customer.name).includes(fold(query));
        const byPhone = queryDigits.length > 0 && digitsOf(o.customer.phone).includes(queryDigits);
        const byId = o.id.toLowerCase().includes(query.toLowerCase());
        if (!byName && !byPhone && !byId) return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

/* ------------------------- criação a partir do checkout ------------------------- */

export interface BuildOrderInput {
  id: string;
  now: Date;
  values: CheckoutValues;
  cart: PricedCart;
  couponCode?: string;
  estimate: string;
  whatsappMessage?: string;
}

/**
 * Fotografia do pedido no momento do envio. Nomes e preços ficam congelados aqui,
 * então mudar o cardápio depois não altera pedidos antigos.
 */
export const buildOrder = ({
  id,
  now,
  values,
  cart,
  couponCode,
  estimate,
  whatsappMessage,
}: BuildOrderInput): Order => {
  const at = now.toISOString();
  const isPickup = values.fulfillment === "retirada";
  const changeFor = values.payment === "dinheiro" ? parseBRLToCents(values.changeFor) : null;

  return {
    id,
    createdAt: at,
    updatedAt: at,
    status: "recebido",
    history: [{ status: "recebido", at }],
    customer: { name: values.name, phone: values.phone },
    fulfillment: values.fulfillment,
    address: isPickup
      ? { street: "", neighborhood: "", cep: "", complement: "", reference: "" }
      : {
          street: values.address,
          neighborhood: values.neighborhood,
          cep: values.cep,
          complement: values.complement,
          reference: values.reference,
        },
    payment: values.payment,
    ...(changeFor !== null ? { changeForCents: changeFor } : {}),
    lines: cart.lines
      .filter((l) => !l.unavailableReason)
      .map((l) => ({
        productId: l.productId,
        name: l.name,
        quantity: l.quantity,
        unitCents: l.unitCents,
        totalCents: l.totalCents,
        addonNames: l.addonNames,
        addonOptionIds: l.addonOptionIds,
        note: l.note,
      })),
    subtotalCents: cart.subtotalCents,
    discountCents: cart.discountCents,
    deliveryFeeCents: cart.deliveryFeeCents,
    totalCents: cart.totalCents,
    ...(couponCode ? { couponCode } : {}),
    notes: values.notes,
    estimate,
    ...(whatsappMessage ? { whatsappMessage } : {}),
  };
};
