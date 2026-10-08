import { beforeEach, describe, expect, it } from "vitest";
import type { Coupon } from "@/domain/coupons";
import type { Order } from "@/domain/orders";
import { createLocalAuthRepository, ADMIN_CREDENTIAL_KEY, ADMIN_SESSION_KEY } from "./local/localAuthRepository";
import { createLocalCouponRepository, COUPONS_STORAGE_KEY } from "./local/localCouponRepository";
import { createLocalOrderRepository, ORDERS_STORAGE_KEY } from "./local/localOrderRepository";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

const order = (id: string, createdAt: string): Order => ({
  id,
  createdAt,
  updatedAt: createdAt,
  status: "recebido",
  history: [{ status: "recebido", at: createdAt }],
  customer: { name: "Samuel", phone: "(31) 99703-6657" },
  fulfillment: "entrega",
  address: { street: "Rua A, 10", neighborhood: "Centro", cep: "", complement: "", reference: "" },
  payment: "pix",
  lines: [{ productId: "h1", name: "Trem Vermelho", quantity: 1, unitCents: 3690, totalCents: 3690, addonNames: [], addonOptionIds: [], note: "" }],
  subtotalCents: 3690,
  discountCents: 0,
  deliveryFeeCents: 0,
  totalCents: 3690,
  notes: "",
  estimate: "40 a 60 min",
});

describe("pedidos (modo demo)", () => {
  it("cria, lista do mais recente ao mais antigo e busca por id", async () => {
    const repo = createLocalOrderRepository();
    await repo.create(order("TDD-A", "2026-03-10T10:00:00.000Z"));
    await repo.create(order("TDD-B", "2026-03-10T11:00:00.000Z"));
    expect((await repo.list()).map((o) => o.id)).toEqual(["TDD-B", "TDD-A"]);
    expect((await repo.get("TDD-A"))?.customer.name).toBe("Samuel");
    expect(await repo.get("nope")).toBeNull();
  });

  it("é idempotente: criar o mesmo id duas vezes não duplica", async () => {
    const repo = createLocalOrderRepository();
    await repo.create(order("TDD-A", "2026-03-10T10:00:00.000Z"));
    await repo.create(order("TDD-A", "2026-03-10T10:00:00.000Z"));
    expect(await repo.list()).toHaveLength(1);
  });

  it("atualiza o status registrando o histórico e recusa transição inválida", async () => {
    const repo = createLocalOrderRepository(() => new Date("2026-03-10T10:05:00Z"));
    await repo.create(order("TDD-A", "2026-03-10T10:00:00.000Z"));
    const updated = await repo.updateStatus("TDD-A", "confirmado", "ligou");
    expect(updated.status).toBe("confirmado");
    expect(updated.history.at(-1)).toEqual({ status: "confirmado", at: "2026-03-10T10:05:00.000Z", note: "ligou" });
    expect((await repo.get("TDD-A"))?.status).toBe("confirmado");
    await expect(repo.updateStatus("TDD-A", "recebido")).rejects.toThrow(/inválida/);
    await expect(repo.updateStatus("zzz", "confirmado")).rejects.toThrow(/não encontrado/);
  });

  it("ignora dados corrompidos no navegador", async () => {
    localStorage.setItem(ORDERS_STORAGE_KEY, "{isso não é json");
    const repo = createLocalOrderRepository();
    expect(await repo.list()).toEqual([]);
  });
});

const coupon = (patch: Partial<Coupon> = {}): Coupon => ({
  id: "c1",
  code: "BEMVINDO10",
  type: "percent",
  value: 10,
  active: true,
  usedCount: 0,
  minOrderCents: 0,
  description: "",
  ...patch,
});

describe("cupons (modo demo)", () => {
  it("cria, edita, exclui e conta usos", async () => {
    const repo = createLocalCouponRepository();
    await repo.upsert(coupon());
    await repo.upsert(coupon({ value: 15 }));
    expect(await repo.list()).toHaveLength(1);
    expect((await repo.list())[0].value).toBe(15);
    await repo.registerUse("BEMVINDO10");
    await repo.registerUse("INEXISTENTE");
    expect((await repo.list())[0].usedCount).toBe(1);
    await repo.delete("c1");
    expect(await repo.list()).toEqual([]);
  });

  it("recusa código duplicado e dados inválidos", async () => {
    const repo = createLocalCouponRepository();
    await repo.upsert(coupon());
    await expect(repo.upsert(coupon({ id: "c2" }))).rejects.toThrow(/Já existe/);
    await expect(repo.upsert(coupon({ id: "c3", code: "ABC", value: 150 }))).rejects.toThrow();
    await expect(repo.upsert(coupon({ id: "c4", code: "abc minusculo" }))).rejects.toThrow();
    await expect(repo.upsert(coupon({ id: "c5", code: "FIM", startsAt: "2026-05-02", expiresAt: "2026-05-01" }))).rejects.toThrow();
  });

  it("não guarda lixo se o storage tiver coisa inválida", async () => {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify([{ id: 1 }]));
    expect(await createLocalCouponRepository().list()).toEqual([]);
  });
});

describe("autenticação do painel (modo demo)", () => {
  it("começa sem senha e sem sessão", async () => {
    const auth = createLocalAuthRepository();
    expect(await auth.isConfigured()).toBe(false);
    expect(auth.isAuthenticated()).toBe(false);
  });

  it("primeiro acesso cria a senha (mín. 8 caracteres), inicia sessão e nunca guarda a senha em texto", async () => {
    const auth = createLocalAuthRepository();
    await expect(auth.setup("curta")).rejects.toThrow(/ao menos 8/);
    await auth.setup("senha-forte-123");
    expect(await auth.isConfigured()).toBe(true);
    expect(auth.isAuthenticated()).toBe(true);
    expect(localStorage.getItem(ADMIN_CREDENTIAL_KEY)).not.toContain("senha-forte-123");
    await expect(auth.setup("outra-senha-123")).rejects.toThrow(/já foi criada/);
  });

  it("login correto abre sessão; senha errada não; logout encerra", async () => {
    const auth = createLocalAuthRepository();
    await auth.setup("senha-forte-123");
    auth.logout();
    expect(auth.isAuthenticated()).toBe(false);
    expect(await auth.login("errada-errada")).toBe(false);
    expect(auth.isAuthenticated()).toBe(false);
    expect(await auth.login("senha-forte-123")).toBe(true);
    expect(auth.isAuthenticated()).toBe(true);
    auth.logout();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it("a sessão expira", async () => {
    let t = 1_000_000;
    const auth = createLocalAuthRepository(() => t);
    await auth.setup("senha-forte-123");
    expect(auth.isAuthenticated()).toBe(true);
    t += 9 * 3_600_000;
    expect(auth.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(ADMIN_SESSION_KEY)).toBeNull();
  });

  it("bloqueia por 30s depois de 5 senhas erradas", async () => {
    let t = 1_000_000;
    const auth = createLocalAuthRepository(() => t);
    await auth.setup("senha-forte-123");
    auth.logout();
    for (let i = 0; i < 5; i++) expect(await auth.login("errada-errada")).toBe(false);
    await expect(auth.login("senha-forte-123")).rejects.toThrow(/Aguarde/);
    t += 31_000;
    expect(await auth.login("senha-forte-123")).toBe(true);
  });

  it("troca de senha exige a atual", async () => {
    const auth = createLocalAuthRepository();
    await auth.setup("senha-forte-123");
    expect(await auth.changePassword("errada-errada", "nova-senha-456")).toBe(false);
    expect(await auth.changePassword("senha-forte-123", "nova-senha-456")).toBe(true);
    auth.logout();
    expect(await auth.login("senha-forte-123")).toBe(false);
    expect(await auth.login("nova-senha-456")).toBe(true);
  });

  it("sessão forjada com valor inválido não autentica", () => {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    expect(createLocalAuthRepository().isAuthenticated()).toBe(false);
  });
});
