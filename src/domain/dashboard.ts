import type { Cents } from "./money";
import { ORDER_STATUSES, isFinalStatus, type Order, type OrderStatus } from "./orders";

export interface OrdersSummary {
  todayCount: number;
  /** Soma dos pedidos de hoje, sem os cancelados. */
  todayRevenueCents: Cents;
  /** Pedidos ainda "recebidos": esperando alguém confirmar. */
  awaitingCount: number;
  /** Confirmado, em preparo, pronto ou saiu para entrega. */
  inProgressCount: number;
  byStatus: Record<OrderStatus, number>;
  /** Ticket médio dos pedidos de hoje (sem cancelados); 0 se não houver. */
  averageTicketCents: Cents;
}

export const summarizeOrders = (orders: Order[], today: string, dayOf: (iso: string) => string): OrdersSummary => {
  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  let todayCount = 0;
  let revenue = 0;
  let valid = 0;

  for (const o of orders) {
    byStatus[o.status] += 1;
    if (dayOf(o.createdAt) !== today) continue;
    todayCount += 1;
    if (o.status !== "cancelado") {
      revenue += o.totalCents;
      valid += 1;
    }
  }

  const inProgressCount = orders.filter((o) => !isFinalStatus(o.status) && o.status !== "recebido").length;
  return {
    todayCount,
    todayRevenueCents: revenue,
    awaitingCount: byStatus.recebido,
    inProgressCount,
    byStatus,
    averageTicketCents: valid > 0 ? Math.round(revenue / valid) : 0,
  };
};
