import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultBusinessSettings } from "@/config/business";
import { seedCatalog } from "@/data/seed/catalog";
import { createLocalCatalogRepository, CATALOG_STORAGE_KEY } from "./local/localCatalogRepository";
import { createLocalSettingsRepository, SETTINGS_STORAGE_KEY } from "./local/localSettingsRepository";

describe("repositório de catálogo (modo demo)", () => {
  beforeEach(() => localStorage.clear());

  it("sem nada salvo devolve o cardápio original", async () => {
    const catalog = await createLocalCatalogRepository().getCatalog();
    expect(catalog).toEqual(seedCatalog);
  });

  it("mudanças sobrevivem a recarregar (nova instância)", async () => {
    const repo = createLocalCatalogRepository();
    const [first] = (await repo.getCatalog()).products;
    await repo.upsertProduct({ ...first, priceCents: 4242, soldOut: true });

    const reloaded = await createLocalCatalogRepository().getCatalog();
    const product = reloaded.products.find((p) => p.id === first.id);
    expect(product).toMatchObject({ priceCents: 4242, soldOut: true });
    expect(reloaded.products).toHaveLength(seedCatalog.products.length);
  });

  it("cria e remove produto", async () => {
    const repo = createLocalCatalogRepository();
    const base = seedCatalog.products[0];
    await repo.upsertProduct({ ...base, id: "novo", name: "Produto novo" });
    expect((await repo.getCatalog()).products.some((p) => p.id === "novo")).toBe(true);
    await repo.deleteProduct("novo");
    expect((await repo.getCatalog()).products.some((p) => p.id === "novo")).toBe(false);
  });

  it("não remove categoria que ainda tem produtos", async () => {
    const repo = createLocalCatalogRepository();
    await expect(repo.deleteCategory("hamburgueres")).rejects.toThrow(/produtos/);
    await repo.upsertCategory({ id: "vazia", label: "Vazia", sundayOnly: false, order: 99, active: true });
    await expect(repo.deleteCategory("vazia")).resolves.toBeUndefined();
  });

  it("reordena categorias e produtos", async () => {
    const repo = createLocalCatalogRepository();
    await repo.reorderCategories(["bebidas", "hamburgueres"]);
    const catalog = await repo.getCatalog();
    expect(catalog.categories.find((c) => c.id === "bebidas")?.order).toBe(0);
    expect(catalog.categories.find((c) => c.id === "hamburgueres")?.order).toBe(1);

    await repo.reorderProducts("bebidas", ["be5", "be4", "be3", "be2", "be1"]);
    const orders = Object.fromEntries((await repo.getCatalog()).products.filter((p) => p.categoryId === "bebidas").map((p) => [p.id, p.order]));
    expect(orders).toMatchObject({ be5: 0, be4: 1, be1: 4 });
  });

  it("resetToSeed volta ao cardápio original", async () => {
    const repo = createLocalCatalogRepository();
    await repo.deleteProduct("h1");
    await repo.resetToSeed();
    expect(await repo.getCatalog()).toEqual(seedCatalog);
  });

  it("dado salvo corrompido cai no cardápio original", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify({ categories: "x", products: 1 }));
    expect(await createLocalCatalogRepository().getCatalog()).toEqual(seedCatalog);
  });
});

describe("repositório de configurações (modo demo)", () => {
  beforeEach(() => localStorage.clear());

  it("sem nada salvo devolve o padrão", async () => {
    expect(await createLocalSettingsRepository().getSettings()).toEqual(defaultBusinessSettings);
  });

  it("salva e recupera", async () => {
    const repo = createLocalSettingsRepository();
    await repo.saveSettings({ ...defaultBusinessSettings, phoneDisplay: "(31) 90000-0000" });
    expect((await createLocalSettingsRepository().getSettings()).phoneDisplay).toBe("(31) 90000-0000");
  });

  it("rejeita WhatsApp em formato inválido", async () => {
    const repo = createLocalSettingsRepository();
    await expect(repo.saveSettings({ ...defaultBusinessSettings, whatsappNumber: "(31) 99703-6657" })).rejects.toThrow();
    expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();
  });

  it("resetToDefaults restaura o padrão", async () => {
    const repo = createLocalSettingsRepository();
    await repo.saveSettings({ ...defaultBusinessSettings, instagramHandle: "outro" });
    await repo.resetToDefaults();
    expect((await repo.getSettings()).instagramHandle).toBe(defaultBusinessSettings.instagramHandle);
  });
});
