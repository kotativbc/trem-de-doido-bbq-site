import { describe, expect, it } from "vitest";
import { summarizeOrders } from "./dashboard";
import { slugify, uniqueId } from "./ids";
import type { Order, OrderStatus } from "./orders";

const make = (id: string, createdAt: string, status: OrderStatus, totalCents: number): Order => ({
  id,
  createdAt,
  updatedAt: createdAt,
  status,
  history: [{ status: "recebido", at: createdAt }],
  customer: { name: "A", phone: "(31) 99999-9999" },
  fulfillment: "retirada",
  address: { street: "", neighborhood: "", cep: "", complement: "", reference: "" },
  payment: "pix",
  lines: [],
  subtotalCents: totalCents,
  discountCents: 0,
  deliveryFeeCents: 0,
  totalCents,
  notes: "",
  estimate: "",
});

const dayOf = (iso: string) => iso.slice(0, 10);

describe("resumo de pedidos", () => {
  const orders = [
    make("1", "2026-03-10T20:00:00.000Z", "recebido", 3000),
    make("2", "2026-03-10T21:00:00.000Z", "em_preparo", 5000),
    make("3", "2026-03-10T22:00:00.000Z", "cancelado", 9000),
    make("4", "2026-03-10T23:00:00.000Z", "concluido", 4000),
    make("5", "2026-03-09T23:00:00.000Z", "pronto", 7000),
  ];

  it("conta hoje, receita sem cancelados, em andamento e aguardando", () => {
    const s = summarizeOrders(orders, "2026-03-10", dayOf);
    expect(s.todayCount).toBe(4);
    expect(s.todayRevenueCents).toBe(12000);
    expect(s.averageTicketCents).toBe(4000);
    expect(s.awaitingCount).toBe(1);
    expect(s.inProgressCount).toBe(2); // em preparo (hoje) + pronto (ontem, ainda aberto)
    expect(s.byStatus).toMatchObject({ recebido: 1, em_preparo: 1, cancelado: 1, concluido: 1, pronto: 1, confirmado: 0 });
  });

  it("sem pedidos tudo é zero", () => {
    const s = summarizeOrders([], "2026-03-10", dayOf);
    expect(s).toMatchObject({ todayCount: 0, todayRevenueCents: 0, averageTicketCents: 0, awaitingCount: 0, inProgressCount: 0 });
  });
});

describe("ids", () => {
  it("slugify remove acento, emoji e símbolos", () => {
    expect(slugify("🍔 Hambúrguer Gourmet!")).toBe("hamburguer-gourmet");
    expect(slugify("  --  ")).toBe("");
  });
  it("uniqueId evita colisão", () => {
    expect(uniqueId("Burger", ["x"])).toBe("burger");
    expect(uniqueId("Burger", ["burger"])).toBe("burger-2");
    expect(uniqueId("Burger", ["burger", "burger-2"])).toBe("burger-3");
    expect(uniqueId("!!!", [])).toBe("item");
  });
});
