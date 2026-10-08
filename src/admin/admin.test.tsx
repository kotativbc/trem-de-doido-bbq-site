import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { seedCatalog } from "@/data/seed/catalog";
import type { Coupon } from "@/domain/coupons";
import { changeStatus, type Order } from "@/domain/orders";
import { repositories } from "@/services";
import { ADMIN_SESSION_KEY } from "@/services/local/localAuthRepository";
import { renderAdmin } from "@/test/renderAdmin";

const PASSWORD = "senha-forte-123";

const order = (id: string, over: Partial<Order> = {}): Order => ({
  id,
  createdAt: "2026-10-07T22:00:00.000Z",
  updatedAt: "2026-10-07T22:00:00.000Z",
  status: "recebido",
  history: [{ status: "recebido", at: "2026-10-07T22:00:00.000Z" }],
  customer: { name: "João Pereira", phone: "(31) 99703-6657" },
  fulfillment: "entrega",
  address: { street: "Rua A, 10", neighborhood: "Centro", cep: "", complement: "", reference: "portão azul" },
  payment: "pix",
  lines: [{ productId: "h1", name: "Trem Vermelho", quantity: 2, unitCents: 3690, totalCents: 7380, addonNames: [], addonOptionIds: [], note: "sem cebola" }],
  subtotalCents: 7380,
  discountCents: 0,
  deliveryFeeCents: 0,
  totalCents: 7380,
  notes: "",
  estimate: "40 a 60 min",
  ...over,
});

const signIn = async () => {
  await repositories.auth.setup(PASSWORD); // cria a senha e já abre a sessão
};
const signedOutWithPassword = async () => {
  await repositories.auth.setup(PASSWORD);
  repositories.auth.logout();
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("painel: autenticação e permissão", () => {
  it("sem senha criada, mostra só a criação de senha (nada do painel)", async () => {
    renderAdmin("/admin/pedidos");
    expect(await screen.findByRole("heading", { name: "CRIAR SENHA DO PAINEL" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "PEDIDOS" })).not.toBeInTheDocument();
    expect(screen.getByText(/não é segurança de\s+verdade/)).toBeInTheDocument();
  });

  it("valida a senha nova (tamanho e confirmação) e entra no painel", async () => {
    renderAdmin("/admin");
    await screen.findByRole("heading", { name: "CRIAR SENHA DO PAINEL" });
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "curta" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar senha e entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ao menos 8 caracteres");

    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: PASSWORD } });
    fireEvent.change(screen.getByLabelText("Repita a senha"), { target: { value: "outra-coisa-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar senha e entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("não são iguais");

    fireEvent.change(screen.getByLabelText("Repita a senha"), { target: { value: PASSWORD } });
    fireEvent.click(screen.getByRole("button", { name: "Criar senha e entrar" }));
    expect(await screen.findByRole("heading", { name: "RESUMO" })).toBeInTheDocument();
  });

  it("deslogado: link direto para uma página interna mostra o login, nunca o conteúdo", async () => {
    await signedOutWithPassword();
    renderAdmin("/admin/pedidos");
    expect(await screen.findByRole("heading", { name: "ENTRAR NO PAINEL" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "PEDIDOS" })).not.toBeInTheDocument();
  });

  it("senha errada não entra; senha certa entra na mesma página pedida", async () => {
    await signedOutWithPassword();
    renderAdmin("/admin/pedidos");
    await screen.findByRole("heading", { name: "ENTRAR NO PAINEL" });

    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-errada-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Senha incorreta.");
    expect(screen.queryByRole("heading", { name: "PEDIDOS" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: PASSWORD } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("heading", { name: "PEDIDOS" })).toBeInTheDocument();
  });

  it("sair volta ao login e encerra a sessão", async () => {
    await signIn();
    renderAdmin("/admin");
    await screen.findByRole("heading", { name: "RESUMO" });
    fireEvent.click(screen.getByRole("button", { name: /Sair/ }));
    expect(await screen.findByRole("heading", { name: "ENTRAR NO PAINEL" })).toBeInTheDocument();
    expect(sessionStorage.getItem(ADMIN_SESSION_KEY)).toBeNull();
  });

  it("sessão expirada ou forjada não dá acesso", async () => {
    await signedOutWithPassword();
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    renderAdmin("/admin/produtos");
    expect(await screen.findByRole("heading", { name: "ENTRAR NO PAINEL" })).toBeInTheDocument();
    cleanup();
    sessionStorage.setItem(ADMIN_SESSION_KEY, String(Date.now() - 1000));
    renderAdmin("/admin/produtos");
    expect(await screen.findByRole("heading", { name: "ENTRAR NO PAINEL" })).toBeInTheDocument();
  });

  it("o site público não anuncia o painel (nenhum link para /admin no conteúdo)", async () => {
    // O painel é acessado digitando a URL; a loja não aponta para ele.
    const { siteContent } = await import("@/config/siteContent");
    expect(JSON.stringify(siteContent)).not.toMatch(/\/admin/);
  });
});

describe("painel: pedidos", () => {
  beforeEach(async () => {
    await signIn();
    await repositories.orders.create(order("TDD-AAA111"));
    await repositories.orders.create(
      order("TDD-BBB222", {
        createdAt: "2026-10-07T23:00:00.000Z",
        customer: { name: "Maria Çá", phone: "(31) 98888-1111" },
        fulfillment: "retirada",
        payment: "dinheiro",
        status: "concluido",
        address: { street: "", neighborhood: "", cep: "", complement: "", reference: "" },
      }),
    );
  });

  it("lista do mais recente ao mais antigo, com contagem", async () => {
    renderAdmin("/admin/pedidos");
    const items = await screen.findAllByRole("button", { name: /^Abrir pedido/ });
    expect(items.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Abrir pedido TDD-BBB222 de Maria Çá",
      "Abrir pedido TDD-AAA111 de João Pereira",
    ]);
    expect(screen.getByText("2 pedidos")).toBeInTheDocument();
  });

  it("filtra por status, modalidade, pagamento, busca e período", async () => {
    renderAdmin("/admin/pedidos");
    await screen.findAllByRole("button", { name: /^Abrir pedido/ });

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "concluido" } });
    expect(await screen.findByText("1 pedido")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /TDD-BBB222/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "todos" } });
    fireEvent.change(screen.getByLabelText("Modalidade"), { target: { value: "entrega" } });
    expect(await screen.findByText("1 pedido")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /TDD-AAA111/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Modalidade"), { target: { value: "todos" } });
    fireEvent.change(screen.getByLabelText("Pagamento"), { target: { value: "dinheiro" } });
    expect(await screen.findByRole("button", { name: /TDD-BBB222/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Pagamento"), { target: { value: "todos" } });

    fireEvent.change(screen.getByLabelText("Buscar por nome, telefone ou código"), { target: { value: "maria ca" } });
    expect(await screen.findByText("1 pedido")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Buscar por nome, telefone ou código"), { target: { value: "98888" } });
    expect(await screen.findByRole("button", { name: /TDD-BBB222/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Buscar por nome, telefone ou código"), { target: { value: "zzz" } });
    expect(await screen.findByText("Nenhum pedido com esses filtros.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Buscar por nome, telefone ou código"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("De"), { target: { value: "2026-10-08" } });
    expect(await screen.findByText("Nenhum pedido com esses filtros.")).toBeInTheDocument();
  });

  it("detalhe mostra cliente, itens, histórico e só oferece transições válidas; atualiza com data/hora", async () => {
    renderAdmin("/admin/pedidos");
    fireEvent.click(await screen.findByRole("button", { name: /Abrir pedido TDD-AAA111/ }));
    const dialog = await screen.findByRole("dialog", { name: /Pedido TDD-AAA111/ });
    expect(within(dialog).getByText("João Pereira")).toBeInTheDocument();
    expect(within(dialog).getByText("2x Trem Vermelho")).toBeInTheDocument();
    expect(within(dialog).getByText("Obs: sem cebola")).toBeInTheDocument();
    expect(within(dialog).getByText("Referência: portão azul")).toBeInTheDocument();

    // recebido (entrega): pode confirmar, preparar, pronto, saiu, concluir ou cancelar; nunca voltar
    expect(within(dialog).queryByRole("button", { name: "Marcar: Recebido" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Marcar: Saiu para entrega" })).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText(/Observação da mudança/), { target: { value: "cliente ligou" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Marcar: Confirmado" }));
    await waitFor(async () => expect((await repositories.orders.get("TDD-AAA111"))?.status).toBe("confirmado"));
    const saved = await repositories.orders.get("TDD-AAA111");
    expect(saved?.history).toHaveLength(2);
    expect(saved?.history[1]).toMatchObject({ status: "confirmado", note: "cliente ligou" });
    expect(await within(dialog).findByText(/cliente ligou/)).toBeInTheDocument();
    // depois de confirmar, "Marcar: Confirmado" não existe mais
    expect(within(dialog).queryByRole("button", { name: "Marcar: Confirmado" })).not.toBeInTheDocument();
  });

  it("pedido concluído ou cancelado não tem ações de status", async () => {
    renderAdmin("/admin/pedidos");
    fireEvent.click(await screen.findByRole("button", { name: /Abrir pedido TDD-BBB222/ }));
    const dialog = await screen.findByRole("dialog", { name: /Pedido TDD-BBB222/ });
    expect(within(dialog).queryByRole("button", { name: /Marcar:|Cancelar pedido/ })).not.toBeInTheDocument();
    expect(within(dialog).getByText("Retirada no balcão")).toBeInTheDocument();
  });

  it("cancelar registra o cancelamento no histórico", async () => {
    renderAdmin("/admin/pedidos");
    fireEvent.click(await screen.findByRole("button", { name: /Abrir pedido TDD-AAA111/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar pedido" }));
    await waitFor(async () => expect((await repositories.orders.get("TDD-AAA111"))?.status).toBe("cancelado"));
  });

  it("imprimir chama a impressão e a comanda existe fora do diálogo", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    renderAdmin("/admin/pedidos");
    fireEvent.click(await screen.findByRole("button", { name: /Abrir pedido TDD-AAA111/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /Imprimir comanda/ }));
    expect(print).toHaveBeenCalledTimes(1);
    const ticket = document.body.querySelector(".print-area");
    expect(ticket).not.toBeNull();
    expect(ticket).toHaveTextContent("Pedido TDD-AAA111");
    expect(ticket).toHaveTextContent("2x Trem Vermelho");
  });

  it("sem pedidos mostra o estado vazio honesto sobre o modo demonstração", async () => {
    localStorage.removeItem("tdd.orders.v1");
    renderAdmin("/admin");
    expect(await screen.findByText(/apenas quando feitos neste mesmo navegador/)).toBeInTheDocument();
  });

  it("o resumo conta pedidos e faturamento de hoje sem os cancelados", async () => {
    const now = new Date();
    await repositories.orders.create(order("TDD-TODAY1", { createdAt: now.toISOString(), updatedAt: now.toISOString(), totalCents: 5000 }));
    await repositories.orders.create(order("TDD-TODAY2", { createdAt: now.toISOString(), updatedAt: now.toISOString(), totalCents: 9000, status: "cancelado" }));
    renderAdmin("/admin");
    await screen.findByRole("heading", { name: "RESUMO" });
    const todayCard = (await screen.findByText("Pedidos hoje")).parentElement as HTMLElement;
    expect(todayCard).toHaveTextContent("2");
    const revenue = screen.getByText("Faturamento hoje").parentElement as HTMLElement;
    expect(revenue).toHaveTextContent("R$ 50,00");
  });
});

describe("painel: produtos", () => {
  beforeEach(signIn);

  it("cria um produto, que passa a existir no cardápio público", async () => {
    renderAdmin("/admin/produtos");
    fireEvent.click(await screen.findByRole("button", { name: /Novo produto/ }));
    const dialog = await screen.findByRole("dialog", { name: "Novo produto" });

    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar produto" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("preço válido");

    fireEvent.change(within(dialog).getByLabelText("Nome *"), { target: { value: "Burger Teste" } });
    fireEvent.change(within(dialog).getByLabelText("Preço (R$) *"), { target: { value: "42,50" } });
    fireEvent.change(within(dialog).getByLabelText("Categoria *"), { target: { value: "hamburgueres" } });
    fireEvent.change(within(dialog).getByLabelText("Selo (opcional)"), { target: { value: "Novo" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar produto" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const catalog = await repositories.catalog.getCatalog();
    const created = catalog.products.find((p) => p.name === "Burger Teste");
    expect(created).toMatchObject({ id: "burger-teste", priceCents: 4250, categoryId: "hamburgueres", badge: "Novo", active: true, soldOut: false });
    expect(created?.order).toBe(Math.max(...seedCatalog.products.filter((p) => p.categoryId === "hamburgueres").map((p) => p.order)) + 1);
  });

  it("edita preço e desativa/esgota pelos interruptores", async () => {
    renderAdmin("/admin/produtos");
    fireEvent.click(await screen.findByRole("button", { name: "Editar Trem Vermelho" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar produto" });
    expect(within(dialog).getByLabelText("Preço (R$) *")).toHaveValue("39,90");
    fireEvent.change(within(dialog).getByLabelText("Preço (R$) *"), { target: { value: "39,90" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar produto" }));
    await waitFor(async () => expect((await repositories.catalog.getCatalog()).products.find((p) => p.id === "h1")?.priceCents).toBe(3990));

    fireEvent.click(await screen.findByRole("switch", { name: "Trem Vermelho: esgotado" }));
    await waitFor(async () => expect((await repositories.catalog.getCatalog()).products.find((p) => p.id === "h1")?.soldOut).toBe(true));
    fireEvent.click(screen.getByRole("switch", { name: "Trem Vermelho: ativo" }));
    await waitFor(async () => expect((await repositories.catalog.getCatalog()).products.find((p) => p.id === "h1")?.active).toBe(false));
  });

  it("marca somente-domingo, destaque e grava adicionais validados", async () => {
    renderAdmin("/admin/produtos");
    fireEvent.click(await screen.findByRole("button", { name: "Editar Trem Vermelho" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar produto" });
    fireEvent.click(within(dialog).getByRole("switch", { name: /Somente aos domingos/ }));
    fireEvent.click(within(dialog).getByRole("switch", { name: "Destaque" }));
    fireEvent.click(within(dialog).getByRole("button", { name: /Grupo de adicionais/ }));
    fireEvent.change(within(dialog).getByLabelText("Nome do grupo 1"), { target: { value: "Extras" } });
    fireEvent.change(within(dialog).getByLabelText("Nome da opção 1 do grupo 1"), { target: { value: "Bacon" } });
    fireEvent.change(within(dialog).getByLabelText("Preço da opção 1 do grupo 1"), { target: { value: "5,00" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar produto" }));

    await waitFor(async () => {
      const p = (await repositories.catalog.getCatalog()).products.find((x) => x.id === "h1");
      expect(p).toMatchObject({ sundayOnly: true, featured: true });
      expect(p?.addonGroups[0]).toMatchObject({ name: "Extras", required: false, options: [{ name: "Bacon", priceCents: 500 }] });
    });
  });

  it("preço de adicional inválido é recusado com mensagem", async () => {
    renderAdmin("/admin/produtos");
    fireEvent.click(await screen.findByRole("button", { name: "Editar Trem Vermelho" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar produto" });
    fireEvent.click(within(dialog).getByRole("button", { name: /Grupo de adicionais/ }));
    fireEvent.change(within(dialog).getByLabelText("Nome do grupo 1"), { target: { value: "Extras" } });
    fireEvent.change(within(dialog).getByLabelText("Nome da opção 1 do grupo 1"), { target: { value: "Bacon" } });
    fireEvent.change(within(dialog).getByLabelText("Preço da opção 1 do grupo 1"), { target: { value: "abc" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar produto" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(/Preço inválido/);
  });

  it("reordena dentro da categoria e exclui com confirmação", async () => {
    renderAdmin("/admin/produtos");
    await screen.findByRole("button", { name: "Editar Trem Vermelho" });
    const before = (await repositories.catalog.getCatalog()).products.filter((p) => p.categoryId === "hamburgueres").sort((a, b) => a.order - b.order).map((p) => p.id);
    fireEvent.click(screen.getByRole("button", { name: `Descer ${seedCatalog.products.find((p) => p.id === before[0])?.name}` }));
    await waitFor(async () => {
      const after = (await repositories.catalog.getCatalog()).products.filter((p) => p.categoryId === "hamburgueres").sort((a, b) => a.order - b.order).map((p) => p.id);
      expect(after.slice(0, 2)).toEqual([before[1], before[0]]);
    });

    fireEvent.click(screen.getByRole("button", { name: "Excluir Trem Vermelho" }));
    const confirm = await screen.findByRole("alertdialog");
    fireEvent.click(within(confirm).getByRole("button", { name: "Excluir" }));
    await waitFor(async () => expect((await repositories.catalog.getCatalog()).products.some((p) => p.id === "h1")).toBe(false));
  });

  it("filtra por categoria e por nome", async () => {
    renderAdmin("/admin/produtos");
    await screen.findByRole("button", { name: "Editar Trem Vermelho" });
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "coca" } });
    expect(await screen.findByRole("button", { name: "Editar Coca-Cola Lata" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar Trem Vermelho" })).not.toBeInTheDocument();
  });
});

describe("painel: categorias", () => {
  beforeEach(signIn);

  it("cria, oculta e reordena categorias", async () => {
    renderAdmin("/admin/categorias");
    fireEvent.click(await screen.findByRole("button", { name: /Nova categoria/ }));
    const dialog = await screen.findByRole("dialog", { name: "Nova categoria" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar categoria" }));
    expect(await within(dialog).findByRole("alert")).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Nome *"), { target: { value: "🍰 Sobremesas" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar categoria" }));
    await waitFor(async () => expect((await repositories.catalog.getCatalog()).categories.some((c) => c.id === "sobremesas")).toBe(true));

    fireEvent.click(await screen.findByRole("switch", { name: "🍰 Sobremesas: ativa" }));
    await waitFor(async () => expect((await repositories.catalog.getCatalog()).categories.find((c) => c.id === "sobremesas")?.active).toBe(false));

    fireEvent.click(screen.getByRole("button", { name: "Subir 🍰 Sobremesas" }));
    await waitFor(async () => {
      const cats = (await repositories.catalog.getCatalog()).categories.sort((a, b) => a.order - b.order);
      expect(cats.at(-2)?.id).toBe("sobremesas");
    });
  });

  it("não exclui categoria que ainda tem produtos", async () => {
    renderAdmin("/admin/categorias");
    fireEvent.click(await screen.findByRole("button", { name: /Excluir .*Hambúrgueres/ }));
    const confirm = await screen.findByRole("alertdialog");
    expect(confirm).toHaveTextContent(/ainda tem produtos/);
    fireEvent.click(within(confirm).getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect((await repositories.catalog.getCatalog()).categories.some((c) => c.id === "hamburgueres")).toBe(true);
  });
});

describe("painel: cupons", () => {
  beforeEach(signIn);

  it("cria cupom válido e recusa percentual acima de 100 e código duplicado", async () => {
    renderAdmin("/admin/cupons");
    expect(await screen.findByText(/Nenhum cupom criado/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Novo cupom/ }));
    let dialog = await screen.findByRole("dialog", { name: "Novo cupom" });
    fireEvent.change(within(dialog).getByLabelText("Código *"), { target: { value: "bem vindo10" } });
    expect(within(dialog).getByLabelText("Código *")).toHaveValue("BEMVINDO10");
    fireEvent.change(within(dialog).getByLabelText("Percentual *"), { target: { value: "150" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar cupom" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("não pode passar de 100");

    fireEvent.change(within(dialog).getByLabelText("Percentual *"), { target: { value: "10" } });
    fireEvent.change(within(dialog).getByLabelText("Limite de usos"), { target: { value: "50" } });
    fireEvent.change(within(dialog).getByLabelText("Válido até (inclusive)"), { target: { value: "2026-12-31" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar cupom" }));
    await waitFor(async () => expect(await repositories.coupons.list()).toHaveLength(1));
    const [coupon] = await repositories.coupons.list();
    expect(coupon).toMatchObject({ code: "BEMVINDO10", type: "percent", value: 10, maxUses: 50, expiresAt: "2026-12-31", usedCount: 0, active: true });
    expect(await screen.findByText(/10% de desconto/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Novo cupom/ }));
    dialog = await screen.findByRole("dialog", { name: "Novo cupom" });
    fireEvent.change(within(dialog).getByLabelText("Código *"), { target: { value: "BEMVINDO10" } });
    fireEvent.change(within(dialog).getByLabelText("Percentual *"), { target: { value: "5" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar cupom" }));
    await new Promise((r) => setTimeout(r, 50));
    expect(await repositories.coupons.list()).toHaveLength(1); // duplicado não entrou
  });

  it("cupom de valor fixo em reais e pausa/exclusão", async () => {
    const existing: Coupon = { id: "c1", code: "FIXO5", type: "fixed", value: 500, active: true, usedCount: 2, minOrderCents: 3000, description: "" };
    await repositories.coupons.upsert(existing);
    renderAdmin("/admin/cupons");
    expect(await screen.findByText(/R\$ 5,00 de desconto · mínimo R\$ 30,00 · usado 2/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: "FIXO5: ativo" }));
    await waitFor(async () => expect((await repositories.coupons.list())[0].active).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Excluir FIXO5" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Excluir" }));
    await waitFor(async () => expect(await repositories.coupons.list()).toHaveLength(0));
  });
});

describe("painel: configurações", () => {
  beforeEach(signIn);

  it("salva contato, horário, dia fechado, entrega e bairro; o site lê as novas regras", async () => {
    renderAdmin("/admin/configuracoes");
    const wa = await screen.findByLabelText("WhatsApp para pedidos");
    fireEvent.change(wa, { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar configurações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/DDI \+ DDD/);

    fireEvent.change(wa, { target: { value: "5531988887777" } });
    fireEvent.click(screen.getByRole("switch", { name: "Segunda-feira: aberto" }));
    fireEvent.change(screen.getByLabelText("Segunda-feira: abre às"), { target: { value: "17:00" } });
    fireEvent.change(screen.getByLabelText("Adicionar dia fechado"), { target: { value: "2026-12-25" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    fireEvent.change(screen.getByLabelText("Taxa padrão de entrega (R$)"), { target: { value: "8,00" } });
    fireEvent.change(screen.getByLabelText("Pedido mínimo para entrega (R$)"), { target: { value: "30,00" } });
    fireEvent.click(screen.getByRole("button", { name: /^Bairro$/ }));
    fireEvent.change(screen.getByLabelText("Bairro 1"), { target: { value: "Centro" } });
    fireEvent.change(screen.getByLabelText("Taxa do bairro 1 (R$)"), { target: { value: "5,50" } });
    fireEvent.click(screen.getByRole("switch", { name: "Aceitar pedidos com a loja fechada" }));
    fireEvent.click(screen.getByRole("switch", { name: "Mostrar banner de promoção" }));
    fireEvent.change(screen.getByLabelText("Texto do banner"), { target: { value: "Quarta em dobro" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar configurações" }));

    await waitFor(async () => expect((await repositories.settings.getSettings()).whatsappNumber).toBe("5531988887777"));
    const saved = await repositories.settings.getSettings();
    expect(saved.hours[1]).toMatchObject({ open: true, from: "17:00" });
    expect(saved.closedDates).toContain("2026-12-25");
    expect(saved.delivery).toMatchObject({ defaultFeeCents: 800, minOrderCents: 3000, zones: [{ name: "Centro", feeCents: 550 }] });
    expect(saved.ordering.allowOrdersWhenClosed).toBe(true);
    expect(saved.promoBanner).toEqual({ enabled: true, text: "Quarta em dobro" });
  });

  it("valor monetário inválido é sinalizado", async () => {
    renderAdmin("/admin/configuracoes");
    fireEvent.change(await screen.findByLabelText("Taxa padrão de entrega (R$)"), { target: { value: "abc" } });
    expect(await screen.findByText("Valor inválido. Exemplo: 5,00.")).toBeInTheDocument();
  });

  it("troca a senha exigindo a atual", async () => {
    renderAdmin("/admin/configuracoes");
    fireEvent.change(await screen.findByLabelText("Senha atual"), { target: { value: "errada-errada" } });
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "nova-senha-456" } });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));
    expect(await screen.findByText("A senha atual não confere.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Senha atual"), { target: { value: PASSWORD } });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));
    expect(await screen.findByText("Senha alterada.")).toBeInTheDocument();
  });

  it("restaurar o cardápio original pede confirmação e desfaz as alterações", async () => {
    await repositories.catalog.deleteProduct("h1");
    renderAdmin("/admin/configuracoes");
    fireEvent.click(await screen.findByRole("button", { name: "Restaurar cardápio original" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Restaurar" }));
    await waitFor(async () => expect((await repositories.catalog.getCatalog()).products.some((p) => p.id === "h1")).toBe(true));
  });
});

describe("domínio de pedidos usado pelo painel", () => {
  it("changeStatus continua recusando voltar etapa (rede de segurança)", () => {
    expect(() => changeStatus(order("x", { status: "pronto" }), "recebido", new Date())).toThrow();
  });
});
