import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { seedCatalog } from "@/data/seed/catalog";
import { CART_STORAGE_KEY } from "@/services/cartStorage";
import { repositories } from "@/services";
import { renderStore } from "../render";

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
    const goToCheckout = async () => {
      renderStore();
      await screen.findByText("Trem Vermelho");
      add("Trem Vermelho");
      fireEvent.click(screen.getByRole("button", { name: "Adicionar mais Trem Vermelho" }));
      fireEvent.click(openCartButton());
      fireEvent.click(await screen.findByRole("button", { name: "Finalizar Pedido" }));
      return screen.findByRole("button", { name: /Enviar Pedido via WhatsApp/ });
    };

    it("o botão de enviar só habilita com os dados obrigatórios", async () => {
      const send = await goToCheckout();
      expect(send).toBeDisabled();

      fill(/^Nome/, "Samuel");
      expect(send).toBeDisabled(); // entrega ainda sem endereço
      fill(/Endereço de Entrega/, "Rua A, 10, Centro");
      await waitFor(() => expect(send).toBeEnabled());
    });

    it("retirada dispensa endereço", async () => {
      const send = await goToCheckout();
      fill(/^Nome/, "Samuel");
      fireEvent.click(screen.getByRole("button", { name: /Retirar no Balcão/ }));
      await waitFor(() => expect(send).toBeEnabled());
      expect(screen.queryByLabelText(/Endereço de Entrega/)).not.toBeInTheDocument();
    });

    it("troco inválido ou menor que o total bloqueia o envio e explica por quê", async () => {
      const send = await goToCheckout();
      fill(/^Nome/, "Samuel");
      fill(/Endereço de Entrega/, "Rua A");
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

    it("envia: abre o WhatsApp do número configurado com a mensagem e esvazia a sacola", async () => {
      const open = vi.spyOn(window, "open").mockImplementation(() => null);
      const send = await goToCheckout();

      fill(/^Nome/, "Samuel");
      fill(/Endereço de Entrega/, "Rua A, 10, Centro");
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
      expect(message).toContain("👤 *Cliente:* Samuel");
      expect(message).toContain("Trem Vermelho x2 — R$ 73,80");
      expect(message).toContain("💵 *Troco para:* R$ 100,00");
      expect(message).toContain("📝 *Observações:* Sem cebola");

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(openCartButton()).toHaveAccessibleName("Abrir sacola");
      expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
    });

    it("mostra o resumo dos itens dentro do checkout", async () => {
      await goToCheckout();
      const summary = screen.getByText("Resumo:").parentElement as HTMLElement;
      expect(within(summary).getByText("Trem Vermelho x2")).toBeInTheDocument();
      expect(within(summary).getByText("R$ 73,80")).toBeInTheDocument();
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
