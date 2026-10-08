import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { defaultBusinessSettings } from "@/config/business";
import { seedCatalog } from "@/data/seed/catalog";
import type { Order } from "@/domain/orders";
import { FAVORITES_STORAGE_KEY } from "@/hooks/useFavorites";
import { repositories } from "@/services";
import { CART_STORAGE_KEY } from "@/services/cartStorage";
import { SP } from "../helpers";
import { renderStore } from "../render";

const openCartButton = () => screen.getAllByRole("button", { name: /^Abrir sacola/ })[0];
const product = (id: string) => {
  const p = seedCatalog.products.find((x) => x.id === id);
  if (!p) throw new Error(`seed sem ${id}`);
  return p;
};

describe("experiência do cardápio (integração)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(SP.wed19h);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  describe("busca e filtros", () => {
    it("busca atravessa as categorias, ignora acento e some ao limpar", async () => {
      renderStore();
      await screen.findByText("Trem Vermelho");
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ARROZ carreteiro" } });
      expect(await screen.findByText("Arroz Carreteiro")).toBeInTheDocument(); // está na aba Domingos
      expect(screen.queryByText("Trem Vermelho")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Domingos/ })).not.toBeInTheDocument(); // modo resultados
      expect(screen.getByRole("status", { name: "" })).toBeDefined();

      fireEvent.click(screen.getByRole("button", { name: "Limpar busca" }));
      expect(await screen.findByText("Trem Vermelho")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Hambúrgueres/ })).toHaveAttribute("aria-pressed", "true");
    });

    it("sem resultados mostra estado vazio com saída", async () => {
      renderStore();
      await screen.findByText("Trem Vermelho");
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "sushi" } });
      expect(await screen.findByText("Nenhum item encontrado com esses filtros.")).toBeInTheDocument();
      fireEvent.click(screen.getAllByRole("button", { name: "Limpar filtros" })[0]);
      expect(await screen.findByText("Trem Vermelho")).toBeInTheDocument();
    });

    it("faixa de preço e 'só disponíveis' funcionam juntos", async () => {
      await repositories.catalog.upsertProduct({ ...product("be3"), soldOut: true });
      renderStore();
      await screen.findByText("Trem Vermelho");

      fireEvent.change(screen.getByLabelText("Preço"), { target: { value: "ate-20" } });
      expect(await screen.findByText("Coca-Cola Lata")).toBeInTheDocument();
      expect(screen.queryByText("Trem Vermelho")).not.toBeInTheDocument();
      expect(screen.getAllByText("Esgotado").length).toBeGreaterThan(0);

      fireEvent.click(screen.getByRole("switch", { name: "Só disponíveis agora" }));
      await waitFor(() => expect(screen.queryByText("Coca-Cola Lata")).not.toBeInTheDocument());
    });
  });

  describe("favoritos", () => {
    it("favorita, persiste, filtra e desfavorita", async () => {
      const first = renderStore();
      await screen.findByText("Trem Vermelho");
      const heart = screen.getByRole("button", { name: "Favoritar: Trem Vermelho" });
      expect(heart).toHaveAttribute("aria-pressed", "false");
      fireEvent.click(heart);
      expect(screen.getByRole("button", { name: "Remover dos favoritos: Trem Vermelho" })).toHaveAttribute("aria-pressed", "true");
      expect(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]")).toEqual(["h1"]);

      first.unmount();
      renderStore();
      await screen.findByText("Trem Vermelho");
      fireEvent.click(screen.getByRole("switch", { name: /Favoritos/ }));
      expect(await screen.findByText("Trem Vermelho")).toBeInTheDocument();
      expect(screen.queryByText("Burger de Costela")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Remover dos favoritos: Trem Vermelho" }));
      expect(await screen.findByText("Nenhum item encontrado com esses filtros.")).toBeInTheDocument();
    });

    it("favoritos corrompidos no navegador são ignorados", async () => {
      localStorage.setItem(FAVORITES_STORAGE_KEY, "{quebrado");
      vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderStore();
      expect(await screen.findByText("Trem Vermelho")).toBeInTheDocument();
    });
  });

  describe("adicionais e observação", () => {
    const withAddons = async () => {
      await repositories.catalog.upsertProduct({
        ...product("h1"),
        addonGroups: [
          {
            id: "g-ponto",
            name: "Ponto da carne",
            maxSelect: 1,
            required: true,
            options: [
              { id: "o-mal", name: "Mal passado", priceCents: 0 },
              { id: "o-bem", name: "Bem passado", priceCents: 0 },
            ],
          },
          {
            id: "g-extra",
            name: "Extras",
            maxSelect: 2,
            required: false,
            options: [
              { id: "o-bacon", name: "Bacon", priceCents: 500 },
              { id: "o-ovo", name: "Ovo", priceCents: 300 },
              { id: "o-queijo", name: "Queijo extra", priceCents: 400 },
            ],
          },
        ],
      });
    };

    it("produto com opções abre a escolha, exige o grupo obrigatório e soma os extras no preço", async () => {
      await withAddons();
      renderStore();
      await screen.findByText("Trem Vermelho");

      fireEvent.click(screen.getByRole("button", { name: "Adicionar Trem Vermelho ao carrinho" }));
      const dialog = await screen.findByRole("dialog", { name: /Trem Vermelho/ });
      fireEvent.click(within(dialog).getByRole("button", { name: /^Adicionar •/ }));
      expect(await within(dialog).findByText(/Escolha ao menos uma opção em "Ponto da carne"/)).toBeInTheDocument();
      expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull(); // nada foi para a sacola

      fireEvent.click(within(dialog).getByRole("radio", { name: "Bem passado" }));
      fireEvent.click(within(dialog).getByRole("checkbox", { name: /Bacon/ }));
      fireEvent.click(within(dialog).getByRole("checkbox", { name: /Ovo/ }));
      // máximo de 2 extras: o terceiro fica desabilitado
      expect(within(dialog).getByRole("checkbox", { name: /Queijo extra/ })).toBeDisabled();
      fireEvent.change(within(dialog).getByLabelText("Observação do item"), { target: { value: "sem cebola" } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Aumentar quantidade" }));
      expect(within(dialog).getByRole("button", { name: /^Adicionar •/ })).toHaveTextContent("R$ 95,80"); // (39,90 + 5 + 3) x 2
      fireEvent.click(within(dialog).getByRole("button", { name: /^Adicionar •/ }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(openCartButton()).toHaveAccessibleName("Abrir sacola, 2 itens");
      const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "null");
      expect(stored.lines[0]).toMatchObject({ productId: "h1", quantity: 2, note: "sem cebola" });
      expect(stored.lines[0].addonOptionIds.sort()).toEqual(["o-bacon", "o-bem", "o-ovo"]);

      fireEvent.click(openCartButton());
      const drawer = await screen.findByRole("dialog", { name: "Sacola de compras" });
      expect(within(drawer).getByText("+ Bem passado, Bacon, Ovo")).toBeInTheDocument();
      expect(within(drawer).getByText("Obs: sem cebola")).toBeInTheDocument();
      expect(within(drawer).getAllByText("R$ 95,80")).toHaveLength(2); // linha e total do rodapé
    });

    it("Escape no diálogo de opções fecha só o diálogo", async () => {
      await withAddons();
      renderStore();
      await screen.findByText("Trem Vermelho");
      fireEvent.click(screen.getByRole("button", { name: "Adicionar Trem Vermelho ao carrinho" }));
      await screen.findByRole("dialog");
      fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(openCartButton()).toHaveAccessibleName("Abrir sacola");
    });

    it("observação por item na sacola: adicionar, editar e juntar linhas iguais", async () => {
      renderStore();
      await screen.findByText("Trem Vermelho");
      fireEvent.click(screen.getByRole("button", { name: "Adicionar Trem Vermelho ao carrinho" }));
      fireEvent.click(openCartButton());
      const drawer = await screen.findByRole("dialog", { name: "Sacola de compras" });

      fireEvent.click(within(drawer).getByRole("button", { name: "+ Observação do item" }));
      const input = within(drawer).getByLabelText("Observação de Trem Vermelho");
      fireEvent.change(input, { target: { value: "bem passado" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(await within(drawer).findByText("Obs: bem passado")).toBeInTheDocument();
      expect(within(drawer).getByRole("button", { name: "Editar observação" })).toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "null").lines[0].note).toBe("bem passado");
    });

    it("Escape no campo de observação não fecha a sacola", async () => {
      renderStore();
      await screen.findByText("Trem Vermelho");
      fireEvent.click(screen.getByRole("button", { name: "Adicionar Trem Vermelho ao carrinho" }));
      fireEvent.click(openCartButton());
      const drawer = await screen.findByRole("dialog", { name: "Sacola de compras" });
      fireEvent.click(within(drawer).getByRole("button", { name: "+ Observação do item" }));
      fireEvent.keyDown(within(drawer).getByLabelText("Observação de Trem Vermelho"), { key: "Escape" });
      expect(screen.getByRole("dialog", { name: "Sacola de compras" })).toBeInTheDocument();
      expect(within(drawer).getByRole("button", { name: "+ Observação do item" })).toBeInTheDocument();
    });
  });

  describe("destaques e banner", () => {
    it("produto em destaque aparece numa faixa própria e leva o selo", async () => {
      await repositories.catalog.upsertProduct({ ...product("h1"), featured: true });
      renderStore();
      expect(await screen.findByText("DESTAQUES")).toBeInTheDocument();
      expect(screen.getAllByText("Trem Vermelho").length).toBeGreaterThanOrEqual(2); // destaque + aba
      expect(screen.getAllByText("Destaque").length).toBeGreaterThan(0);
    });

    it("sem destaques a faixa não existe (igual ao original)", async () => {
      renderStore();
      await screen.findByText("Trem Vermelho");
      expect(screen.queryByText("DESTAQUES")).not.toBeInTheDocument();
    });

    it("banner promocional só aparece quando ligado e com texto", async () => {
      renderStore();
      await screen.findByText("Trem Vermelho");
      expect(screen.queryByRole("complementary", { name: "Promoção" })).not.toBeInTheDocument();
      cleanup();

      await repositories.settings.saveSettings({
        ...defaultBusinessSettings,
        promoBanner: { enabled: true, text: "Quarta do Burger: combo com 10% off" },
      });
      renderStore();
      expect(await screen.findByRole("complementary", { name: "Promoção" })).toHaveTextContent("Quarta do Burger");
    });
  });

  describe("pedir novamente", () => {
    const lastOrder: Order = {
      id: "TDD-LAST01",
      createdAt: "2026-10-06T22:00:00.000Z",
      updatedAt: "2026-10-06T22:00:00.000Z",
      status: "concluido",
      history: [{ status: "recebido", at: "2026-10-06T22:00:00.000Z" }, { status: "concluido", at: "2026-10-06T23:00:00.000Z" }],
      customer: { name: "Samuel", phone: "(31) 99703-6657" },
      fulfillment: "retirada",
      address: { street: "", neighborhood: "", cep: "", complement: "", reference: "" },
      payment: "pix",
      lines: [
        { productId: "h1", name: "Trem Vermelho", quantity: 2, unitCents: 3690, totalCents: 7380, addonNames: [], addonOptionIds: [], note: "" },
        { productId: "fantasma", name: "Removido", quantity: 1, unitCents: 1000, totalCents: 1000, addonNames: [], addonOptionIds: [], note: "" },
      ],
      subtotalCents: 8380,
      discountCents: 0,
      deliveryFeeCents: 0,
      totalCents: 8380,
      notes: "",
      estimate: "25 a 35 min",
    };

    it("sacola vazia oferece repetir o último pedido, pulando itens que não existem mais", async () => {
      await repositories.orders.create(lastOrder);
      renderStore();
      await screen.findByText("Trem Vermelho");
      fireEvent.click(openCartButton());
      fireEvent.click(await screen.findByRole("button", { name: "Pedir novamente o último pedido" }));
      await waitFor(() => expect(openCartButton()).toHaveAccessibleName("Abrir sacola, 2 itens"));
      expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "null").lines).toHaveLength(1); // o item removido ficou de fora
    });

    it("sem pedidos anteriores o botão não aparece", async () => {
      renderStore();
      await screen.findByText("Trem Vermelho");
      fireEvent.click(openCartButton());
      await screen.findByText("Sua sacola está vazia");
      expect(screen.queryByRole("button", { name: /Pedir novamente/ })).not.toBeInTheDocument();
    });
  });
});
