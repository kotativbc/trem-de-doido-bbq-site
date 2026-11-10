import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { seedCatalog } from "@/data/seed/catalog";
import { repositories } from "@/services";
import { CATALOG_STORAGE_KEY } from "@/services/local/localCatalogRepository";
import NotFound from "@/pages/NotFound";
import { defaultBusinessSettings } from "@/config/business";
import EditorRoutes from "./EditorRoutes";

const renderEditor = (path = "/gerenciar/codigo-de-teste-1234567890") => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/gerenciar/:token/*" element={<EditorRoutes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
      <Sonner />
    </QueryClientProvider>,
  );
};

describe("editor do cardápio por link secreto", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("código recusado pelo servidor mostra a mesma página 404 e nada do editor", async () => {
    vi.spyOn(repositories.editor, "authorize").mockResolvedValue(false);
    renderEditor();
    expect(await screen.findByText(/Essa página não existe/)).toBeInTheDocument();
    expect(screen.queryByText("EDITOR DO CARDÁPIO")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Novo produto/ })).not.toBeInTheDocument();
    expect(document.title).toBe("Página não encontrada | Trem de Doido BBQ");
  });

  it("a rota /gerenciar sem código não existe", () => {
    renderEditor("/gerenciar");
    expect(screen.getByText(/Essa página não existe/)).toBeInTheDocument();
  });

  it("não consegue verificar (servidor fora do ar): explica e permite tentar de novo", async () => {
    const authorize = vi.spyOn(repositories.editor, "authorize").mockRejectedValueOnce(new Error("Servidor fora do ar"));
    renderEditor();
    expect(await screen.findByRole("alert")).toHaveTextContent("Servidor fora do ar");
    authorize.mockResolvedValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("EDITOR DO CARDÁPIO")).toBeInTheDocument();
  });

  it("com o código certo abre o editor com produtos e categorias, sem nenhuma tela de senha", async () => {
    renderEditor();
    expect(await screen.findByText("EDITOR DO CARDÁPIO")).toBeInTheDocument();
    expect(screen.queryByLabelText(/senha/i)).not.toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Editar Trem Vermelho" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Baixar cópia/ })).toBeInTheDocument();
    expect(document.title).toBe("Editor do cardápio | Trem de Doido BBQ");

    fireEvent.click(screen.getByRole("link", { name: "Categorias" }));
    expect(await screen.findByText(/Hambúrgueres/)).toBeInTheDocument();
  });

  it("edita o preço de um produto e a mudança é gravada no repositório", async () => {
    renderEditor();
    fireEvent.click(await screen.findByRole("button", { name: "Editar Trem Vermelho" }));
    fireEvent.change(await screen.findByLabelText("Preço (R$) *"), { target: { value: "41,00" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar produto" }));
    await waitFor(async () => {
      const catalog = await repositories.catalog.getCatalog();
      expect(catalog.products.find((p) => p.id === "h1")?.priceCents).toBe(4100);
    });
    expect(await screen.findByText("R$ 41,00")).toBeInTheDocument();
  });

  it("adiciona um produto novo e depois o exclui", async () => {
    renderEditor();
    fireEvent.click(await screen.findByRole("button", { name: /Novo produto/ }));
    fireEvent.change(await screen.findByLabelText("Nome *"), { target: { value: "Burger do Chef" } });
    fireEvent.change(screen.getByLabelText("Preço (R$) *"), { target: { value: "52,50" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar produto" }));
    expect(await screen.findByRole("button", { name: "Editar Burger do Chef" })).toBeInTheDocument();
    expect((await repositories.catalog.getCatalog()).products.some((p) => p.name === "Burger do Chef")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Excluir Burger do Chef" }));
    fireEvent.click(await screen.findByRole("button", { name: /^Excluir$/ }));
    await waitFor(async () => {
      expect((await repositories.catalog.getCatalog()).products.some((p) => p.name === "Burger do Chef")).toBe(false);
    });
  });

  it("restaura uma cópia de segurança válida e recusa arquivo inválido", async () => {
    renderEditor();
    await screen.findByText("EDITOR DO CARDÁPIO");
    const input = screen.getByLabelText("Escolher arquivo de cópia do cardápio");

    const backup = structuredClone(seedCatalog);
    backup.products = backup.products.filter((p) => p.categoryId !== "bebidas");
    backup.categories = backup.categories.filter((c) => c.id !== "bebidas");
    const file = new File([JSON.stringify(backup)], "cardapio.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(JSON.stringify(backup)) });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(await screen.findByRole("button", { name: "Restaurar" }));
    await waitFor(async () => {
      expect((await repositories.catalog.getCatalog()).categories.some((c) => c.id === "bebidas")).toBe(false);
    });
    expect(localStorage.getItem(CATALOG_STORAGE_KEY)).not.toBeNull();

    const bad = new File(["isto não é json"], "x.json", { type: "application/json" });
    Object.defineProperty(bad, "text", { value: () => Promise.resolve("isto não é json") });
    fireEvent.change(input, { target: { files: [bad] } });
    expect(await screen.findByText(/não é uma cópia de cardápio válida/)).toBeInTheDocument();
  });

  describe("horários de funcionamento", () => {
    const openHoursPage = async () => {
      renderEditor();
      fireEvent.click(await screen.findByRole("link", { name: "Horários" }));
      await screen.findByText("Dias e horários de funcionamento");
    };

    it("mostra o horário atual e o resumo de como aparece no site", async () => {
      await openHoursPage();
      expect(screen.getByLabelText("Quarta-feira: aberto")).toBeChecked();
      expect(screen.getByLabelText("Segunda-feira: aberto")).not.toBeChecked();
      expect(screen.getByLabelText("Quarta-feira: abre às")).toHaveValue("18:00");
      const preview = screen.getByRole("region", { name: "Como vai aparecer no site" });
      expect(preview).toHaveTextContent("Quarta a Domingo: 18:00 – 23:00");
      expect(preview).toHaveTextContent("Fechado às segundas e terças-feiras");
      expect(screen.getByRole("button", { name: "Salvar horários" })).toBeDisabled();
    });

    it("abre a segunda, fecha o domingo, muda o horário da sexta e grava no repositório", async () => {
      await openHoursPage();
      fireEvent.click(screen.getByLabelText("Segunda-feira: aberto"));
      fireEvent.click(screen.getByLabelText("Domingo: aberto"));
      fireEvent.change(screen.getByLabelText("Sexta-feira: fecha às"), { target: { value: "01:00" } });
      const preview = screen.getByRole("region", { name: "Como vai aparecer no site" });
      expect(preview).toHaveTextContent("Segunda: 18:00 – 23:00");
      expect(preview).toHaveTextContent("Sexta: 18:00 – 01:00");
      fireEvent.click(screen.getByRole("button", { name: "Salvar horários" }));

      await waitFor(async () => {
        const saved = await repositories.settings.getSettings();
        expect(saved.hours[1].open).toBe(true);
        expect(saved.hours[0].open).toBe(false);
        expect(saved.hours[5].to).toBe("01:00");
        // o resto das configurações não muda
        expect(saved.whatsappNumber).toBe(defaultBusinessSettings.whatsappNumber);
      });
      expect(await screen.findByText(/Horários salvos/)).toBeInTheDocument();
    });

    it("adiciona e remove um dia fechado (feriado)", async () => {
      await openHoursPage();
      fireEvent.change(screen.getByLabelText("Adicionar dia fechado"), { target: { value: "2026-12-25" } });
      fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
      expect(screen.getByText("25/12/2026")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Salvar horários" }));
      await waitFor(async () => expect((await repositories.settings.getSettings()).closedDates).toEqual(["2026-12-25"]));

      fireEvent.click(await screen.findByRole("button", { name: "Remover dia fechado 25/12/2026" }));
      fireEvent.click(screen.getByRole("button", { name: "Salvar horários" }));
      await waitFor(async () => expect((await repositories.settings.getSettings()).closedDates).toEqual([]));
    });

    it("recusa abrir e fechar no mesmo horário e não grava", async () => {
      await openHoursPage();
      fireEvent.change(screen.getByLabelText("Quarta-feira: fecha às"), { target: { value: "18:00" } });
      fireEvent.click(screen.getByRole("button", { name: "Salvar horários" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(/Quarta-feira.*não podem ser iguais/);
      expect((await repositories.settings.getSettings()).hours[3].to).toBe("23:00");
    });

    it("se o servidor não puder ser lido, não oferece o formulário (evita sobrescrever com o padrão)", async () => {
      vi.spyOn(repositories.settings, "getSettings").mockRejectedValue(new Error("Servidor fora do ar"));
      renderEditor();
      fireEvent.click(await screen.findByRole("link", { name: "Horários" }));
      expect(await screen.findByRole("alert")).toHaveTextContent("Servidor fora do ar");
      expect(screen.queryByRole("button", { name: "Salvar horários" })).not.toBeInTheDocument();
    });
  });
});
