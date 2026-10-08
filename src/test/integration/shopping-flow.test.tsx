import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { seedCatalog } from "@/data/seed/catalog";
import { CART_STORAGE_KEY } from "@/services/cartStorage";
import { repositories } from "@/services";
import { defaultBusinessSettings } from "@/config/business";
import { renderStore } from "../render";
import { SP } from "../helpers";

const openCartButton = () => screen.getAllByRole("button", { name: /^Abrir sacola/ })[0];
const add = (name: string) => fireEvent.click(screen.getByRole("button", { name: `Adicionar ${name} ao carrinho` }));
const fill = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("fluxo de compra (integração)", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  it("mostra o cardápio com a aba Hambúrgueres aberta, como no original", async () => {
    renderStore();
    expect(await screen.findByText("Trem Vermelho")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hambúrgueres/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("R$ 36,90")).toBeInTheDocument();
    expect(screen.queryByText("Arroz Carreteiro")).not.toBeInTheDocument();
  });

  it("alterna categoria e mostra o aviso dos itens de domingo", async () => {
    renderStore();
    await screen.findByText("Trem Vermelho");
    fireEvent.click(screen.getByRole("button", { name: /Domingos/ }));
    expect(screen.getByText("Arroz Carreteiro")).toBeInTheDocument();
    expect(screen.getByText("Disponível somente aos domingos")).toBeInTheDocument();
    expect(screen.getAllByText("Especial")).toHaveLength(4);
  });

  it("adiciona, aumenta, diminui e remove; contador e total acompanham", async () => {
    renderStore();
    await screen.findByText("Trem Vermelho");

    add("Trem Vermelho");
    expect(openCartButton()).toHaveAccessibleName("Abrir sacola, 1 itens");

    fireEvent.click(screen.getByRole("button", { name: "Adicionar mais Trem Vermelho" }));
    expect(openCartButton()).toHaveAccessibleName("Abrir sacola, 2 itens");
    expect(screen.getByRole("button", { name: /Ver sacola com 2 itens, total R\$ 73,80/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remover Trem Vermelho" }));
    fireEvent.click(screen.getByRole("button", { name: "Remover Trem Vermelho" }));
    expect(openCartButton()).toHaveAccessibleName("Abrir sacola");
    expect(screen.getByRole("button", { name: "Adicionar Trem Vermelho ao carrinho" })).toBeInTheDocument();
  });

  it("a sacola sobrevive a recarregar a página e guarda só referências", async () => {
    const first = renderStore();
    await screen.findByText("Trem Vermelho");
    add("Trem Vermelho");
    fireEvent.click(screen.getByRole("button", { name: "Adicionar mais Trem Vermelho" }));

    const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "null");
    expect(stored.lines[0]).toMatchObject({ productId: "h1", quantity: 2 });
    expect(JSON.stringify(stored)).not.toMatch(/36|3690|Trem Vermelho/);

    first.unmount();
    renderStore();
    await screen.findByText("Trem Vermelho");
    expect(openCartButton()).toHaveAccessibleName("Abrir sacola, 2 itens");
  });

  it("produto que saiu do cardápio é removido da sacola salva, com aviso", async () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        v: 1,
        lines: [
          { lineId: "h1::::", productId: "h1", quantity: 1, addonOptionIds: [], note: "" },
          { lineId: "fantasma::::", productId: "fantasma", quantity: 3, addonOptionIds: [], note: "" },
        ],
      }),
    );
    renderStore();
    await screen.findByText("Trem Vermelho");
    await waitFor(() => expect(openCartButton()).toHaveAccessibleName("Abrir sacola, 1 itens"));
  });

  it("drawer: abre, trava o scroll, fecha com Escape e devolve o scroll", async () => {
    renderStore();
    await screen.findByText("Trem Vermelho");
    add("Trem Vermelho");

    fireEvent.click(openCartButton());
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe("");
  });

  it("drawer vazio mostra o estado vazio", async () => {
    renderStore();
    await screen.findByText("Trem Vermelho");
    fireEvent.click(openCartButton());
    expect(await screen.findByText("Sua sacola está vazia")).toBeInTheDocument();
  });

  describe("checkout", () => {
    // Quarta-feira 19h em São Paulo: loja aberta, independentemente de quando o teste roda.
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(SP.wed19h);
    });
    afterEach(() => vi.useRealTimers());

    const goToCheckout = async () => {
      renderStore();
      await screen.findByText("Trem Vermelho");
      add("Trem Vermelho");
      fireEvent.click(screen.getByRole("button", { name: "Adicionar mais Trem Vermelho" }));
      fireEvent.click(openCartButton());
      fireEvent.click(await screen.findByRole("button", { name: "Finalizar Pedido" }));
      return screen.findByRole("button", { name: /Enviar Pedido via WhatsApp/ });
    };
    const fillDelivery = () => {
      fill(/^Nome/, "Samuel");
      fill(/^Telefone/, "31997036657");
      fill(/Endereço de Entrega/, "Rua A, 10");
      fill(/^Bairro/, "Centro");
    };

    it("o botão de enviar só habilita com os dados obrigatórios", async () => {
      const send = await goToCheckout();
      expect(send).toBeDisabled();

      fill(/^Nome/, "Samuel");
      expect(send).toBeDisabled(); // faltam telefone, endereço e bairro
      fill(/^Telefone/, "31997036657");
      fill(/Endereço de Entrega/, "Rua A, 10");
      expect(send).toBeDisabled(); // falta o bairro
      fill(/^Bairro/, "Centro");
      await waitFor(() => expect(send).toBeEnabled());
    });

    it("telefone inválido explica o problema e bloqueia o envio", async () => {
      const send = await goToCheckout();
      fillDelivery();
      const phone = screen.getByLabelText(/^Telefone/);
      fireEvent.change(phone, { target: { value: "12345" } });
      fireEvent.blur(phone);
      expect(await screen.findByText(/Telefone inválido/)).toBeInTheDocument();
      expect(send).toBeDisabled();
    });

    it("formata o telefone ao sair do campo", async () => {
      await goToCheckout();
      const phone = screen.getByLabelText(/^Telefone/);
      fireEvent.change(phone, { target: { value: "31997036657" } });
      fireEvent.blur(phone);
      await waitFor(() => expect(phone).toHaveValue("(31) 99703-6657"));
    });

    it("retirada dispensa endereço e bairro, mas não o telefone", async () => {
      const send = await goToCheckout();
      fill(/^Nome/, "Samuel");
      fireEvent.click(screen.getByRole("button", { name: /Retirar no Balcão/ }));
      await waitFor(() => expect(screen.queryByLabelText(/Endereço de Entrega/)).not.toBeInTheDocument());
      expect(send).toBeDisabled();
      // Pessoas levam bem mais que um instante entre as duas ações; evita a corrida do RHF com resolver assíncrono.
      await new Promise((r) => setTimeout(r, 50));
      fill(/^Telefone/, "31997036657");
      await waitFor(() => expect(send).toBeEnabled());
      expect(screen.queryByLabelText(/Endereço de Entrega/)).not.toBeInTheDocument();
    });

    it("troco inválido ou menor que o total bloqueia o envio e explica por quê", async () => {
      const send = await goToCheckout();
      fillDelivery();
      fireEvent.click(screen.getByRole("radio", { name: "Dinheiro" }));

      const change = await screen.findByLabelText(/Precisa de troco/);
      fireEvent.change(change, { target: { value: "abc" } });
      fireEvent.blur(change);
      expect(await screen.findByText(/Informe um valor válido/)).toBeInTheDocument();
      expect(send).toBeDisabled();

      fireEvent.change(change, { target: { value: "50" } });
      expect(await screen.findByText(/precisa cobrir o total \(R\$ 73,80\)/)).toBeInTheDocument();
      expect(send).toBeDisabled();

      fireEvent.change(change, { target: { value: "100,00" } });
      await waitFor(() => expect(send).toBeEnabled());
    });

    it("envia: abre o WhatsApp do número configurado, registra o pedido, esvazia a sacola e vai à confirmação", async () => {
      const open = vi.spyOn(window, "open").mockImplementation(() => ({}) as Window);
      const send = await goToCheckout();

      fillDelivery();
      fireEvent.click(screen.getByRole("radio", { name: "Dinheiro" }));
      fireEvent.change(await screen.findByLabelText(/Precisa de troco/), { target: { value: "100,00" } });
      fill(/Observações/, "Sem cebola");
      await waitFor(() => expect(send).toBeEnabled());
      fireEvent.click(send);

      await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
      const [url, target] = open.mock.calls[0];
      expect(target).toBe("_blank");
      expect(String(url).startsWith("https://wa.me/5531997036657?text=")).toBe(true);
      const message = decodeURIComponent(String(url).split("text=")[1]);
      expect(message).toContain("👤 *Cliente:* Samuel\n📞 *Telefone:* (31) 99703-6657");
      expect(message).toContain("📍 *Endereço:* Rua A, 10 - Centro");
      expect(message).toContain("Trem Vermelho x2 — R$ 73,80");
      expect(message).toContain("💵 *Troco para:* R$ 100,00");
      expect(message).toContain("📝 *Observações:* Sem cebola");

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(openCartButton()).toHaveAccessibleName("Abrir sacola");
      expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();

      const orders = await repositories.orders.list();
      expect(orders).toHaveLength(1);
      expect(orders[0]).toMatchObject({ status: "recebido", totalCents: 7380, customer: { name: "Samuel" } });
      expect(screen.getByTestId("path")).toHaveTextContent(`/pedido/${orders[0].id}`);
      expect(message).toContain(`🧾 *Pedido:* ${orders[0].id}`);
    });

    it("pop-up bloqueado: NÃO esvazia a sacola, avisa que o pedido não foi enviado e oferece o link", async () => {
      vi.spyOn(window, "open").mockImplementation(() => null);
      const send = await goToCheckout();
      fillDelivery();
      await waitFor(() => expect(send).toBeEnabled());
      fireEvent.click(send);

      expect(await screen.findByText("O WHATSAPP NÃO ABRIU")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent(/não foi enviado/);
      const link = screen.getByRole("link", { name: /Abrir WhatsApp/ });
      expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/5531997036657\?text=/);
      expect(localStorage.getItem(CART_STORAGE_KEY)).not.toBeNull();
      expect(screen.getByTestId("path")).toHaveTextContent("/");

      // Voltar mantém o que o cliente já digitou.
      fireEvent.click(screen.getByRole("button", { name: /Voltar ao pedido/ }));
      expect(screen.getByLabelText(/^Nome/)).toHaveValue("Samuel");

      // Abrir o link manualmente conclui o pedido.
      fireEvent.click(send);
      fireEvent.click(await screen.findByRole("link", { name: /Abrir WhatsApp/ }));
      await waitFor(() => expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull());
      expect(await repositories.orders.list()).toHaveLength(1); // o reenvio não duplicou o pedido
    });

    it("mostra o resumo dos itens dentro do checkout", async () => {
      await goToCheckout();
      const summary = screen.getByText("Resumo:").parentElement as HTMLElement;
      expect(within(summary).getByText("Trem Vermelho x2")).toBeInTheDocument();
      expect(within(summary).getByText("R$ 73,80")).toBeInTheDocument();
    });

    it("taxa de entrega por bairro entra no total e na mensagem; retirada zera a taxa", async () => {
      await repositories.settings.saveSettings({
        ...defaultBusinessSettings,
        delivery: { ...defaultBusinessSettings.delivery, zones: [{ id: "z1", name: "Centro", feeCents: 500 }] },
      });
      const open = vi.spyOn(window, "open").mockImplementation(() => ({}) as Window);
      const send = await goToCheckout();
      fillDelivery();
      await waitFor(() => expect(send).toBeEnabled());
      expect(screen.getByText("Taxa de entrega").nextSibling).toHaveTextContent("R$ 5,00");
      expect(screen.getByText("Total do Pedido").parentElement).toHaveTextContent("R$ 78,80");

      fireEvent.click(screen.getByRole("button", { name: /Retirar no Balcão/ }));
      await waitFor(() => expect(screen.queryByText("Taxa de entrega")).not.toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: /^Entrega$/ }));
      await waitFor(() => expect(send).toBeEnabled());
      fireEvent.click(send);
      await waitFor(() => expect(open).toHaveBeenCalled());
      const message = decodeURIComponent(String(open.mock.calls[0][0]).split("text=")[1]);
      expect(message).toContain("🛵 *Taxa de entrega:* R$ 5,00\n💰 *TOTAL:* R$ 78,80");
    });

    it("pedido mínimo bloqueia a entrega com aviso, mas não a retirada", async () => {
      await repositories.settings.saveSettings({
        ...defaultBusinessSettings,
        delivery: { ...defaultBusinessSettings.delivery, minOrderCents: 10000 },
      });
      const send = await goToCheckout();
      fillDelivery();
      expect(await screen.findByText(/Pedido mínimo para entrega: R\$ 100,00\. Faltam R\$ 26,20/)).toBeInTheDocument();
      expect(send).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: /Retirar no Balcão/ }));
      await waitFor(() => expect(send).toBeEnabled());
    });

    it("cupom válido abate o total; inválido mostra o motivo; dá para remover", async () => {
      await repositories.coupons.upsert({
        id: "c1",
        code: "BEMVINDO10",
        type: "percent",
        value: 10,
        active: true,
        usedCount: 0,
        minOrderCents: 0,
        description: "",
      });
      await goToCheckout();
      fillDelivery();
      const input = screen.getByLabelText(/Cupom de desconto/);

      fireEvent.change(input, { target: { value: "naoexiste" } });
      fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
      expect(await screen.findByText("Cupom não encontrado.")).toBeInTheDocument();

      fireEvent.change(input, { target: { value: "bemvindo10" } });
      fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
      expect(await screen.findByText(/Cupom BEMVINDO10 aplicado: - R\$ 7,38/)).toBeInTheDocument();
      expect(screen.getByText("Desconto").nextSibling).toHaveTextContent("- R$ 7,38");
      expect(screen.getByText("Total do Pedido").parentElement).toHaveTextContent("R$ 66,42");

      fireEvent.click(screen.getByRole("button", { name: /Remover cupom BEMVINDO10/ }));
      await waitFor(() => expect(screen.queryByText("Desconto")).not.toBeInTheDocument());
    });

    it("enviar com cupom registra o uso uma vez", async () => {
      await repositories.coupons.upsert({
        id: "c1",
        code: "BEMVINDO10",
        type: "fixed",
        value: 500,
        active: true,
        usedCount: 0,
        maxUses: 1,
        minOrderCents: 0,
        description: "",
      });
      vi.spyOn(window, "open").mockImplementation(() => ({}) as Window);
      const send = await goToCheckout();
      fillDelivery();
      fireEvent.change(screen.getByLabelText(/Cupom de desconto/), { target: { value: "BEMVINDO10" } });
      fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
      await screen.findByText(/Cupom BEMVINDO10 aplicado/);
      fireEvent.click(send);
      await waitFor(async () => expect((await repositories.coupons.list())[0].usedCount).toBe(1));
      expect((await repositories.orders.list())[0]).toMatchObject({ couponCode: "BEMVINDO10", discountCents: 500 });
    });

    it("loja fechada: avisa quando abre e bloqueia o envio (configurável)", async () => {
      vi.setSystemTime(SP.mon12h); // segunda-feira
      const send = await goToCheckout();
      fillDelivery();
      expect(await screen.findByText(/Estamos fechados no momento e não é possível enviar pedidos agora/)).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent(/Abrimos quarta-feira às 18:00/);
      expect(send).toBeDisabled();
    });

    it("loja fechada com 'aceitar pedidos fechado' liga: só avisa", async () => {
      await repositories.settings.saveSettings({
        ...defaultBusinessSettings,
        ordering: { ...defaultBusinessSettings.ordering, allowOrdersWhenClosed: true },
      });
      vi.setSystemTime(SP.mon12h);
      const send = await goToCheckout();
      fillDelivery();
      expect(await screen.findByText(/Você pode enviar o pedido, mas ele só será atendido quando abrirmos/)).toBeInTheDocument();
      await waitFor(() => expect(send).toBeEnabled());
    });

    it("se a entrega estiver desligada, só existe retirada", async () => {
      await repositories.settings.saveSettings({
        ...defaultBusinessSettings,
        delivery: { ...defaultBusinessSettings.delivery, enabled: false },
      });
      await goToCheckout();
      expect(screen.queryByRole("button", { name: /^Entrega$/ })).not.toBeInTheDocument();
      expect(screen.getByText(/apenas retirada no balcão/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Endereço de Entrega/)).not.toBeInTheDocument();
    });

    it("CEP: preenche rua e bairro sem sobrescrever o que o cliente digitou; falha mantém o formulário manual", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ logradouro: "Av. João Pinheiro", bairro: "Centro", localidade: "Sarzedo", uf: "MG" }),
      });
      vi.stubGlobal("fetch", fetchMock);
      await goToCheckout();
      fireEvent.change(screen.getByLabelText(/^CEP/), { target: { value: "32450000" } });
      expect(await screen.findByText(/Endereço encontrado/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^CEP/)).toHaveValue("32450-000");
      expect(screen.getByLabelText(/Endereço de Entrega/)).toHaveValue("Av. João Pinheiro");
      expect(screen.getByLabelText(/^Bairro/)).toHaveValue("Centro");

      fetchMock.mockRejectedValueOnce(new Error("offline"));
      vi.spyOn(console, "warn").mockImplementation(() => undefined);
      fill(/Endereço de Entrega/, "Rua digitada, 5");
      fireEvent.change(screen.getByLabelText(/^CEP/), { target: { value: "30123456" } });
      expect(await screen.findByText(/Não foi possível consultar o CEP/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Endereço de Entrega/)).toHaveValue("Rua digitada, 5");
      vi.unstubAllGlobals();
    });

    it("localização é opcional: erro de permissão mostra o caminho manual; sucesso anexa o link ao pedido", async () => {
      const open = vi.spyOn(window, "open").mockImplementation(() => ({}) as Window);
      const getCurrentPosition = vi.fn();
      vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });
      const send = await goToCheckout();
      fillDelivery();

      getCurrentPosition.mockImplementationOnce((_ok: unknown, err: PositionErrorCallback) =>
        err({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "" }),
      );
      fireEvent.click(screen.getByRole("button", { name: /Usar minha localização/ }));
      expect(await screen.findByText(/Permissão de localização negada/)).toBeInTheDocument();
      await waitFor(() => expect(send).toBeEnabled()); // endereço manual continua valendo

      getCurrentPosition.mockImplementationOnce((ok: PositionCallback) =>
        ok({ coords: { latitude: -20.0453, longitude: -44.1347, accuracy: 30 } } as GeolocationPosition),
      );
      fireEvent.click(screen.getByRole("button", { name: /Usar minha localização/ }));
      expect(await screen.findByText(/Localização anexada ao pedido/)).toBeInTheDocument();
      fireEvent.click(send);
      await waitFor(() => expect(open).toHaveBeenCalled());
      const message = decodeURIComponent(String(open.mock.calls[0][0]).split("text=")[1]);
      expect(message).toContain("🗺️ *Localização:* https://www.google.com/maps?q=-20.045300,-44.134700");
      vi.unstubAllGlobals();
    });
  });

  describe("estados do cardápio", () => {
    it("falha ao carregar: mostra erro e permite tentar de novo", async () => {
      vi.spyOn(repositories.catalog, "getCatalog").mockRejectedValueOnce(new Error("sem rede"));
      renderStore();
      expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o cardápio");

      fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
      expect(await screen.findByText("Trem Vermelho")).toBeInTheDocument();
    });

    it("item esgotado aparece marcado e não pode ser adicionado", async () => {
      const h1 = seedCatalog.products.find((p) => p.id === "h1");
      if (!h1) throw new Error("seed sem h1");
      await repositories.catalog.upsertProduct({ ...h1, soldOut: true });

      renderStore();
      await screen.findByText("Trem Vermelho");
      expect(screen.getAllByText("Esgotado").length).toBeGreaterThan(0);
      expect(screen.queryByRole("button", { name: "Adicionar Trem Vermelho ao carrinho" })).not.toBeInTheDocument();
    });

    it("categoria sem produtos mostra o estado vazio", async () => {
      for (const p of seedCatalog.products.filter((p) => p.categoryId === "espetinhos")) {
        await repositories.catalog.upsertProduct({ ...p, active: false });
      }
      renderStore();
      await screen.findByText("Trem Vermelho");
      fireEvent.click(screen.getByRole("button", { name: /Espetinhos/ }));
      expect(screen.getByText("Nenhum item nesta categoria no momento.")).toBeInTheDocument();
    });
  });
});
