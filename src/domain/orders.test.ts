import { describe, expect, it } from "vitest";
import {
  allowedTransitions,
  buildOrder,
  canTransition,
  changeStatus,
  filterOrders,
  generateOrderId,
  statusFlow,
  type Order,
} from "./orders";
import { emptyCheckoutValues } from "./checkout";
import { priceCart } from "./pricing";
import { catalogWith, settingsWith, SP } from "@/test/helpers";

const order = (over: Partial<Order> = {}): Order => ({
  id: "TDD-AAAAAA",
  createdAt: "2026-03-10T21:00:00.000Z",
  updatedAt: "2026-03-10T21:00:00.000Z",
  status: "recebido",
  history: [{ status: "recebido", at: "2026-03-10T21:00:00.000Z" }],
  customer: { name: "João Pereira", phone: "(31) 99703-6657" },
  fulfillment: "entrega",
  address: { street: "Rua A, 10", neighborhood: "Centro", cep: "32450-000", complement: "", reference: "" },
  payment: "pix",
  lines: [],
  subtotalCents: 3690,
  discountCents: 0,
  deliveryFeeCents: 500,
  totalCents: 4190,
  notes: "",
  estimate: "40 a 60 min",
  ...over,
});

describe("fluxo de status", () => {
  it("retirada não passa por 'saiu para entrega'", () => {
    expect(statusFlow("retirada")).not.toContain("saiu_para_entrega");
    expect(statusFlow("entrega")).toContain("saiu_para_entrega");
  });
  it("permite avançar ou cancelar, nunca voltar", () => {
    const o = order({ status: "em_preparo" });
    expect(allowedTransitions(o)).toEqual(["pronto", "saiu_para_entrega", "concluido", "cancelado"]);
    expect(canTransition(o, "recebido")).toBe(false);
  });
  it("estados finais não mudam mais", () => {
    expect(allowedTransitions(order({ status: "concluido" }))).toEqual([]);
    expect(allowedTransitions(order({ status: "cancelado" }))).toEqual([]);
  });
  it("registra a mudança no histórico com data e observação", () => {
    const next = changeStatus(order(), "confirmado", new Date("2026-03-10T21:05:00Z"), " ok ");
    expect(next.status).toBe("confirmado");
    expect(next.updatedAt).toBe("2026-03-10T21:05:00.000Z");
    expect(next.history).toHaveLength(2);
    expect(next.history[1]).toEqual({ status: "confirmado", at: "2026-03-10T21:05:00.000Z", note: "ok" });
  });
  it("lança em transição inválida e não altera o original", () => {
    const o = order({ status: "pronto" });
    expect(() => changeStatus(o, "recebido", new Date())).toThrow(/inválida/);
    expect(o.history).toHaveLength(1);
  });
});

describe("id do pedido", () => {
  it("tem prefixo e 6 caracteres", () => {
    expect(generateOrderId()).toMatch(/^TDD-[0-9A-HJKMNP-Z]{6}$/);
  });
});

describe("filtros", () => {
  const dayOf = (iso: string) => iso.slice(0, 10);
  const list = [
    order({ id: "TDD-1", createdAt: "2026-03-09T20:00:00.000Z" }),
    order({ id: "TDD-2", createdAt: "2026-03-10T20:00:00.000Z", status: "concluido", payment: "dinheiro", fulfillment: "retirada", customer: { name: "Maria Çá", phone: "(31) 98888-1111" } }),
  ];
  it("ordena do mais recente para o mais antigo", () => {
    expect(filterOrders(list, {}, dayOf).map((o) => o.id)).toEqual(["TDD-2", "TDD-1"]);
  });
  it("filtra por status, modalidade e pagamento", () => {
    expect(filterOrders(list, { status: "concluido" }, dayOf)).toHaveLength(1);
    expect(filterOrders(list, { fulfillment: "retirada" }, dayOf)).toHaveLength(1);
    expect(filterOrders(list, { payment: "pix" }, dayOf).map((o) => o.id)).toEqual(["TDD-1"]);
    expect(filterOrders(list, { status: "todos" }, dayOf)).toHaveLength(2);
  });
  it("filtra por período inclusivo", () => {
    expect(filterOrders(list, { from: "2026-03-10" }, dayOf).map((o) => o.id)).toEqual(["TDD-2"]);
    expect(filterOrders(list, { to: "2026-03-09" }, dayOf).map((o) => o.id)).toEqual(["TDD-1"]);
  });
  it("busca por nome sem acento, telefone parcial e id", () => {
    expect(filterOrders(list, { query: "maria ca" }, dayOf).map((o) => o.id)).toEqual(["TDD-2"]);
    expect(filterOrders(list, { query: "88881111" }, dayOf).map((o) => o.id)).toEqual(["TDD-2"]);
    expect(filterOrders(list, { query: "tdd-1" }, dayOf).map((o) => o.id)).toEqual(["TDD-1"]);
    expect(filterOrders(list, { query: "zzz" }, dayOf)).toHaveLength(0);
  });
});

describe("buildOrder", () => {
  const settings = settingsWith();
  const priced = priceCart(
    [
      { lineId: "a", productId: "h1", quantity: 2, addonOptionIds: [], note: "sem cebola" },
      { lineId: "b", productId: "h2", quantity: 1, addonOptionIds: [], note: "" },
    ],
    catalogWith([{ id: "h2", soldOut: true }]),
    { settings, now: SP.wed19h, deliveryFeeCents: 500, discountCents: 300 },
  );
  const values = {
    ...emptyCheckoutValues,
    name: "Samuel",
    phone: "(31) 99703-6657",
    address: "Rua A, 10",
    neighborhood: "Centro",
    payment: "dinheiro" as const,
    changeFor: "100,00",
  };

  it("congela itens disponíveis, totais, troco e histórico inicial", () => {
    const o = buildOrder({ id: "TDD-X", now: SP.wed19h, values, cart: priced, couponCode: "C10", estimate: "40 a 60 min" });
    expect(o.status).toBe("recebido");
    expect(o.history).toEqual([{ status: "recebido", at: SP.wed19h.toISOString() }]);
    expect(o.lines).toHaveLength(1);
    expect(o.lines[0]).toMatchObject({ name: "Trem Vermelho", quantity: 2, note: "sem cebola" });
    expect(o.subtotalCents).toBe(7380);
    expect(o.discountCents).toBe(300);
    expect(o.deliveryFeeCents).toBe(500);
    expect(o.totalCents).toBe(7580);
    expect(o.changeForCents).toBe(10000);
    expect(o.couponCode).toBe("C10");
    expect(o.address.street).toBe("Rua A, 10");
  });

  it("na retirada zera o endereço e sem dinheiro não há troco", () => {
    const o = buildOrder({
      id: "TDD-Y",
      now: SP.wed19h,
      values: { ...values, fulfillment: "retirada", payment: "pix" },
      cart: priced,
      estimate: "25 a 35 min",
    });
    expect(o.address.street).toBe("");
    expect(o.changeForCents).toBeUndefined();
    expect(o.couponCode).toBeUndefined();
  });
});
