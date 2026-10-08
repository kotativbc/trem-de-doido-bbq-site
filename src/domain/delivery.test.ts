import { describe, expect, it } from "vitest";
import { estimateTimeText, getMinOrderShortfall, resolveDeliveryFee } from "./delivery";
import type { DeliverySettings } from "./settings";

const delivery: DeliverySettings = {
  enabled: true,
  defaultFeeCents: 800,
  zones: [
    { id: "z1", name: "Centro", feeCents: 500 },
    { id: "z2", name: "São Luiz", feeCents: 1000 },
  ],
  minOrderCents: 3000,
  serviceAreaText: "",
  prepMinutes: { min: 25, max: 35 },
  deliveryMinutes: { min: 15, max: 25 },
};

describe("taxa de entrega", () => {
  it("é zero na retirada", () => {
    expect(resolveDeliveryFee(delivery, "retirada", "Centro").feeCents).toBe(0);
  });
  it("usa a zona pelo bairro ignorando acento, caixa e espaços", () => {
    expect(resolveDeliveryFee(delivery, "entrega", "  sao   luiz ")).toEqual({ feeCents: 1000, zoneName: "São Luiz" });
  });
  it("cai na taxa padrão para bairro desconhecido ou vazio", () => {
    expect(resolveDeliveryFee(delivery, "entrega", "Outro")).toEqual({ feeCents: 800 });
    expect(resolveDeliveryFee(delivery, "entrega", "")).toEqual({ feeCents: 800 });
  });
});

describe("pedido mínimo", () => {
  it("calcula quanto falta só para entrega", () => {
    expect(getMinOrderShortfall(delivery, "entrega", 2000)).toBe(1000);
    expect(getMinOrderShortfall(delivery, "entrega", 3000)).toBe(0);
    expect(getMinOrderShortfall(delivery, "retirada", 100)).toBe(0);
    expect(getMinOrderShortfall({ ...delivery, minOrderCents: 0 }, "entrega", 0)).toBe(0);
  });
});

describe("previsão", () => {
  it("soma preparo e entrega", () => {
    expect(estimateTimeText(delivery, "entrega")).toBe("40 a 60 min");
    expect(estimateTimeText(delivery, "retirada")).toBe("25 a 35 min");
    expect(estimateTimeText({ ...delivery, prepMinutes: { min: 20, max: 20 } }, "retirada")).toBe("20 min");
  });
});
