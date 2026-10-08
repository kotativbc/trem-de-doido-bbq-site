import { describe, expect, it } from "vitest";
import { priceCart } from "./pricing";
import type { CheckoutValues } from "./checkout";
import { emptyCheckoutValues } from "./checkout";
import { buildOrderMessage, buildWhatsAppUrl } from "./whatsapp";
import { catalogWith, settingsWith, SP } from "@/test/helpers";

const settings = settingsWith();
const catalog = catalogWith();
const cart = (lines: { productId: string; quantity: number }[]) =>
  priceCart(
    lines.map((l) => ({ lineId: l.productId, addonOptionIds: [], note: "", ...l })),
    catalog,
    { settings, now: SP.wed19h },
  );

const values = (patch: Partial<CheckoutValues>): CheckoutValues => ({ ...emptyCheckoutValues, name: "Samuel", ...patch });

describe("mensagem de WhatsApp", () => {
  it("TESTE DOURADO: idêntica à mensagem gerada pelo site original (entrega + dinheiro com troco)", () => {
    // Saída capturada do site original (commit 55bf1e6) para: Samuel, entrega, 2x Trem Vermelho, dinheiro, troco 100,00.
    const expected = [
      "🔥 NOVO PEDIDO — TREM DE DOIDO BBQ 🔥",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "👤 *Cliente:* Samuel",
      "🏠 *Entrega/Retirada:* Entrega",
      "📍 *Endereço:* Rua A, 10, Centro",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "🍖 *ITENS DO PEDIDO:*",
      "",
      "Trem Vermelho x2 — R$ 73,80",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "💰 *TOTAL:* R$ 73,80",
      "💳 *PAGAMENTO:* Dinheiro",
      "💵 *Troco para:* R$ 100,00",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "📝 *Observações:* Sem cebola",
    ].join("\n");

    const message = buildOrderMessage({
      settings,
      cart: cart([{ productId: "h1", quantity: 2 }]),
      values: values({ address: "Rua A, 10, Centro", payment: "dinheiro", changeFor: "100,00", notes: "Sem cebola" }),
    });
    expect(message).toBe(expected);
  });

  it("retirada no balcão, Pix, sem observações e vários itens", () => {
    const message = buildOrderMessage({
      settings,
      cart: cart([
        { productId: "h2", quantity: 1 },
        { productId: "be3", quantity: 3 },
      ]),
      values: values({ fulfillment: "retirada", payment: "pix" }),
    });
    expect(message).toContain("🏠 *Entrega/Retirada:* Retirada no Balcão");
    expect(message).toContain("📍 *Endereço:* Retirada no local");
    expect(message).toContain("Burger de Costela x1 — R$ 39,99\nCoca-Cola Lata x3 — R$ 18,00");
    expect(message).toContain("💰 *TOTAL:* R$ 57,99");
    expect(message).toContain("💳 *PAGAMENTO:* Pix");
    expect(message).not.toContain("Troco");
    expect(message).toContain("📝 *Observações:* Nenhuma");
  });

  it("cartão nunca mostra troco, mesmo que haja texto no campo", () => {
    const message = buildOrderMessage({
      settings,
      cart: cart([{ productId: "h1", quantity: 1 }]),
      values: values({ payment: "cartao", changeFor: "100", address: "Rua B" }),
    });
    expect(message).toContain("💳 *PAGAMENTO:* Cartão");
    expect(message).not.toContain("Troco");
  });

  it("usa o nome do restaurante das configurações", () => {
    const message = buildOrderMessage({
      settings: settingsWith({ name: "Outro BBQ" }),
      cart: cart([{ productId: "h1", quantity: 1 }]),
      values: values({ address: "Rua B" }),
    });
    expect(message.startsWith("🔥 NOVO PEDIDO — OUTRO BBQ 🔥")).toBe(true);
  });

  it("não inclui itens indisponíveis", () => {
    const soldOut = priceCart(
      [
        { lineId: "h1", productId: "h1", quantity: 1, addonOptionIds: [], note: "" },
        { lineId: "h2", productId: "h2", quantity: 1, addonOptionIds: [], note: "" },
      ],
      catalogWith([{ id: "h2", soldOut: true }]),
      { settings, now: SP.wed19h },
    );
    const message = buildOrderMessage({ settings, cart: soldOut, values: values({ address: "Rua B" }) });
    expect(message).toContain("Trem Vermelho");
    expect(message).not.toContain("Burger de Costela");
  });

  it("monta o link do WhatsApp com a mensagem codificada", () => {
    const url = buildWhatsAppUrl("5531997036657", "Olá & tudo bem?\nLinha 2");
    expect(url.startsWith("https://wa.me/5531997036657?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1])).toBe("Olá & tudo bem?\nLinha 2");
  });

  describe("detalhes adicionados (nunca alteram o esqueleto original)", () => {
    const delivered = (patch: Partial<CheckoutValues>) => values({ address: "Rua A, 10", ...patch });

    it("telefone, complemento, bairro, CEP, referência e localização entram só quando preenchidos", () => {
      const message = buildOrderMessage({
        settings,
        cart: cart([{ productId: "h1", quantity: 1 }]),
        values: delivered({
          phone: "(31) 99703-6657",
          complement: "apto 2",
          neighborhood: "Centro",
          cep: "32450-000",
          reference: "portão azul",
          locationUrl: "https://www.google.com/maps?q=-20.1,-44.1",
        }),
      });
      expect(message).toContain("👤 *Cliente:* Samuel\n📞 *Telefone:* (31) 99703-6657");
      expect(message).toContain("📍 *Endereço:* Rua A, 10, apto 2 - Centro (CEP 32450-000)");
      expect(message).toContain("🧭 *Referência:* portão azul");
      expect(message).toContain("🗺️ *Localização:* https://www.google.com/maps?q=-20.1,-44.1");
    });

    it("na retirada não vaza referência nem localização", () => {
      const message = buildOrderMessage({
        settings,
        cart: cart([{ productId: "h1", quantity: 1 }]),
        values: values({ fulfillment: "retirada", reference: "x", locationUrl: "https://y" }),
      });
      expect(message).not.toContain("Referência");
      expect(message).not.toContain("Localização");
    });

    it("mostra subtotal, desconto (com cupom) e taxa quando existem, e o total os inclui", () => {
      const priced = priceCart([{ lineId: "a", productId: "h1", quantity: 2, addonOptionIds: [], note: "" }], catalog, {
        settings,
        now: SP.wed19h,
        discountCents: 700,
        deliveryFeeCents: 500,
      });
      const message = buildOrderMessage({
        settings,
        cart: priced,
        values: delivered({}),
        extras: { couponCode: "BEMVINDO10", orderId: "TDD-ABC123", estimate: "40 a 60 min" },
      });
      expect(message).toContain("🔥 NOVO PEDIDO — TREM DE DOIDO BBQ 🔥\n🧾 *Pedido:* TDD-ABC123");
      expect(message).toContain("⏱️ *Previsão:* 40 a 60 min");
      expect(message).toContain(
        "🧾 *Subtotal:* R$ 73,80\n🏷️ *Desconto (BEMVINDO10):* - R$ 7,00\n🛵 *Taxa de entrega:* R$ 5,00\n💰 *TOTAL:* R$ 71,80",
      );
    });

    it("sem desconto nem taxa não há bloco de subtotal", () => {
      const message = buildOrderMessage({ settings, cart: cart([{ productId: "h1", quantity: 1 }]), values: delivered({}) });
      expect(message).not.toContain("Subtotal");
    });
  });
});
