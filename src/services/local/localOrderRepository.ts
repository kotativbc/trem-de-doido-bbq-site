import { z } from "zod";
import { changeStatus, type Order, type OrderStatus } from "@/domain/orders";
import { orderSchema } from "@/domain/schemas";
import { readJson, writeJson } from "../storage";
import type { OrderRepository } from "../repositories";

export const ORDERS_STORAGE_KEY = "tdd.orders.v1";
const MAX_ORDERS = 500;

const ordersSchema = z.array(orderSchema);

const readAll = (): Order[] => readJson(ORDERS_STORAGE_KEY, ordersSchema) ?? [];

const writeAll = (orders: Order[]): void => {
  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX_ORDERS);
  if (!writeJson(ORDERS_STORAGE_KEY, sorted)) {
    throw new Error("Não foi possível salvar o pedido neste navegador (armazenamento indisponível ou cheio).");
  }
};

export const createLocalOrderRepository = (now: () => Date = () => new Date()): OrderRepository => ({
  async list() {
    return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async get(id: string) {
    return readAll().find((o) => o.id === id) ?? null;
  },

  async create(order: Order) {
    const parsed = orderSchema.parse(order);
    const all = readAll();
    if (all.some((o) => o.id === parsed.id)) return; // idempotente: reenviar o mesmo pedido não duplica
    writeAll([parsed, ...all]);
  },

  async updateStatus(id: string, next: OrderStatus, note?: string) {
    const all = readAll();
    const current = all.find((o) => o.id === id);
    if (!current) throw new Error("Pedido não encontrado.");
    const updated = changeStatus(current, next, now(), note);
    writeAll(all.map((o) => (o.id === id ? updated : o)));
    return updated;
  },
});
