import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { seedCatalog } from "@/data/seed/catalog";
import { createRepositories } from "..";
import { ApiNotInstalledError, ForbiddenError, type EditorSession } from "./phpApi";
import { createPhpCatalogRepository } from "./phpCatalogRepository";
import { createPhpEditorAccess } from "./phpEditorAccess";
import { createPhpSettingsRepository } from "./phpSettingsRepository";
import { defaultBusinessSettings } from "@/config/business";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const envelope = (over: Record<string, unknown> = {}) =>
  json({ revision: 3, updatedAt: "2026-10-08T10:00:00+00:00", catalog: structuredClone(seedCatalog), ...over });

describe("repositório de cardápio no servidor (PHP)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const session = (token: string | null = "codigo-secreto-1234567890"): EditorSession => ({ token });

  describe("leitura (pública)", () => {
    it("devolve o cardápio salvo no servidor", async () => {
      const saved = structuredClone(seedCatalog);
      saved.products[0].priceCents = 1234;
      fetchMock.mockResolvedValue(envelope({ catalog: saved }));
      const catalog = await createPhpCatalogRepository(session(null)).getCatalog();
      expect(catalog.products[0].priceCents).toBe(1234);
      expect(fetchMock.mock.calls[0][0]).toMatch(/api\/catalog\.php$/);
    });

    it("sem cardápio salvo ainda, usa o que vem no site", async () => {
      fetchMock.mockResolvedValue(envelope({ revision: 0, catalog: null }));
      expect(await createPhpCatalogRepository(session(null)).getCatalog()).toEqual(seedCatalog);
    });

    it("API ausente (404 ou página inicial devolvida no lugar) não derruba o site: usa o cardápio embutido", async () => {
      const repo = createPhpCatalogRepository(session(null));
      fetchMock.mockResolvedValueOnce(new Response("nope", { status: 404 }));
      expect(await repo.getCatalog()).toEqual(seedCatalog);
      fetchMock.mockResolvedValueOnce(new Response("<!doctype html><html></html>", { status: 200, headers: { "Content-Type": "text/html" } }));
      expect(await repo.getCatalog()).toEqual(seedCatalog);
    });

    it("erro real do servidor (500) aparece como erro, não como cardápio possivelmente desatualizado", async () => {
      fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));
      await expect(createPhpCatalogRepository(session(null)).getCatalog()).rejects.toThrow(/erro 500/);
    });
  });

  describe("gravação (exige o código secreto)", () => {
    it("lê a versão atual, aplica a mudança e envia com a revisão e o código", async () => {
      fetchMock.mockResolvedValueOnce(envelope({ revision: 7 })).mockResolvedValueOnce(json({ revision: 8, updatedAt: "x" }));
      const repo = createPhpCatalogRepository(session());
      const product = { ...seedCatalog.products.find((p) => p.id === "h1")!, priceCents: 4100 };
      await repo.upsertProduct(product);

      const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
      expect(url).toMatch(/api\/catalog\.php$/);
      expect(init.method).toBe("POST");
      expect((init.headers as Record<string, string>)["X-Editor-Token"]).toBe("codigo-secreto-1234567890");
      const body = JSON.parse(init.body as string);
      expect(body.baseRevision).toBe(7);
      expect(body.catalog.products.find((p: { id: string }) => p.id === "h1").priceCents).toBe(4100);
      expect(body.catalog.products).toHaveLength(seedCatalog.products.length);
    });

    it("primeira gravação parte do cardápio embutido (revisão 0)", async () => {
      fetchMock.mockResolvedValueOnce(envelope({ revision: 0, catalog: null })).mockResolvedValueOnce(json({ revision: 1, updatedAt: "x" }));
      await createPhpCatalogRepository(session()).deleteProduct("be1");
      const body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
      expect(body.baseRevision).toBe(0);
      expect(body.catalog.products.some((p: { id: string }) => p.id === "be1")).toBe(false);
      expect(body.catalog.products).toHaveLength(seedCatalog.products.length - 1);
    });

    it("sem código na sessão, nem tenta gravar", async () => {
      fetchMock.mockResolvedValueOnce(envelope());
      await expect(createPhpCatalogRepository(session(null)).deleteProduct("h1")).rejects.toBeInstanceOf(ForbiddenError);
      expect(fetchMock).toHaveBeenCalledTimes(1); // só a leitura
    });

    it("traduz 403, 409 e erro de validação para mensagens claras", async () => {
      const repo = createPhpCatalogRepository(session());
      fetchMock.mockResolvedValueOnce(envelope()).mockResolvedValueOnce(json({ error: "forbidden" }, 403));
      await expect(repo.deleteProduct("h1")).rejects.toBeInstanceOf(ForbiddenError);

      fetchMock.mockResolvedValueOnce(envelope()).mockResolvedValueOnce(json({ message: "O cardápio foi alterado em outro aparelho. Recarregue a página e tente de novo." }, 409));
      await expect(repo.deleteProduct("h1")).rejects.toThrow(/alterado em outro aparelho/);

      fetchMock.mockResolvedValueOnce(envelope()).mockResolvedValueOnce(json({ message: "Produto inválido: X." }, 422));
      await expect(repo.deleteProduct("h1")).rejects.toThrow("Produto inválido: X.");
    });

    it("gravar sem a API instalada explica o problema", async () => {
      fetchMock.mockResolvedValueOnce(new Response("<html></html>", { status: 200, headers: { "Content-Type": "text/html" } }));
      await expect(createPhpCatalogRepository(session()).deleteProduct("h1")).rejects.toBeInstanceOf(ApiNotInstalledError);
    });

    it("não deixa excluir categoria com produtos, sem chamar o servidor para gravar", async () => {
      fetchMock.mockResolvedValueOnce(envelope());
      await expect(createPhpCatalogRepository(session()).deleteCategory("bebidas")).rejects.toThrow(/Mova ou exclua/);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("acesso do editor", () => {
    it("código válido guarda o código na sessão", async () => {
      fetchMock.mockResolvedValue(json({ ok: true }));
      const s = session(null);
      expect(await createPhpEditorAccess(s).authorize("abc1234567890123456")).toBe(true);
      expect(s.token).toBe("abc1234567890123456");
      expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toEqual({ "X-Editor-Token": "abc1234567890123456" });
      expect(fetchMock.mock.calls[0][0]).toMatch(/catalog\.php\?action=verify$/);
    });

    it("código recusado (403) não guarda nada", async () => {
      fetchMock.mockResolvedValue(json({ error: "forbidden" }, 403));
      const s = session("antigo-antigo-antigo");
      expect(await createPhpEditorAccess(s).authorize("errado-errado-errado")).toBe(false);
      expect(s.token).toBeNull();
    });

    it("servidor sem configuração ou sem API vira erro explicativo, não 'acesso negado'", async () => {
      fetchMock.mockResolvedValueOnce(json({ error: "not_configured" }, 503));
      await expect(createPhpEditorAccess(session(null)).authorize("abc1234567890123456")).rejects.toThrow(/config\.php/);
      fetchMock.mockResolvedValueOnce(new Response("<html></html>", { status: 200, headers: { "Content-Type": "text/html" } }));
      await expect(createPhpEditorAccess(session(null)).authorize("abc1234567890123456")).rejects.toBeInstanceOf(ApiNotInstalledError);
    });
  });

  describe("envio de foto", () => {
    it("envia a imagem com o código e devolve o endereço /uploads/...", async () => {
      const bitmap = { width: 100, height: 100, close: () => {} };
      vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
      const ctx = { drawImage: vi.fn() };
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
      vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/jpeg;base64,/9j/4AAQ");
      fetchMock.mockResolvedValue(json({ url: "/uploads/abc.jpg" }));

      const url = await createPhpCatalogRepository(session()).saveImage(new File(["x"], "foto.png", { type: "image/png" }));
      expect(url).toBe("/uploads/abc.jpg");
      const [target, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(target).toMatch(/api\/upload\.php$/);
      expect((init.headers as Record<string, string>)["X-Editor-Token"]).toBe("codigo-secreto-1234567890");
      expect((init.body as FormData).get("image")).toBeInstanceOf(Blob);
    });
  });

  it("createRepositories('php') usa o servidor para o cardápio e mantém o resto local", () => {
    const repos = createRepositories("php");
    const demo = createRepositories("demo");
    expect(repos.catalog).not.toBe(demo.catalog);
    expect(typeof repos.editor.authorize).toBe("function");
  });
});

describe("horários de funcionamento no servidor (PHP)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const schedule = () => {
    const hours = structuredClone(defaultBusinessSettings.hours);
    hours[1] = { open: true, from: "11:00", to: "15:00" };
    return { hours, closedDates: ["2026-12-25"] };
  };
  const scheduleEnvelope = (value: unknown) => json({ revision: 2, updatedAt: "2026-11-10T10:00:00+00:00", schedule: value });
  const session = (token: string | null = "codigo-secreto-1234567890"): EditorSession => ({ token });

  it("o site mostra os dias e horários salvos no servidor, e o resto continua vindo do site", async () => {
    fetchMock.mockResolvedValue(scheduleEnvelope(schedule()));
    const settings = await createPhpSettingsRepository(session(null)).getSettings();
    expect(settings.hours[1]).toEqual({ open: true, from: "11:00", to: "15:00" });
    expect(settings.closedDates).toEqual(["2026-12-25"]);
    expect(settings.whatsappNumber).toBe(defaultBusinessSettings.whatsappNumber);
    expect(fetchMock.mock.calls[0][0]).toMatch(/api\/schedule\.php$/);
  });

  it("sem horários salvos ainda, vale o padrão do site", async () => {
    fetchMock.mockResolvedValue(scheduleEnvelope(null));
    expect(await createPhpSettingsRepository(session(null)).getSettings()).toEqual(defaultBusinessSettings);
  });

  it("API ausente não derruba o site: usa o horário padrão", async () => {
    const repo = createPhpSettingsRepository(session(null));
    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 404 }));
    expect(await repo.getSettings()).toEqual(defaultBusinessSettings);
    fetchMock.mockResolvedValueOnce(new Response("<!doctype html>", { status: 200, headers: { "Content-Type": "text/html" } }));
    expect(await repo.getSettings()).toEqual(defaultBusinessSettings);
  });

  it("erro real do servidor aparece como erro (não finge que o horário padrão é o salvo)", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));
    await expect(createPhpSettingsRepository(session(null)).getSettings()).rejects.toThrow(/erro 500/);
  });

  it("grava com o código secreto no cabeçalho", async () => {
    fetchMock.mockResolvedValue(json({ revision: 3, updatedAt: "x" }));
    await createPhpSettingsRepository(session()).saveSchedule(schedule());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/api\/schedule\.php$/);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["X-Editor-Token"]).toBe("codigo-secreto-1234567890");
    expect(JSON.parse(init.body as string).schedule.closedDates).toEqual(["2026-12-25"]);
  });

  it("sem código na sessão nem chega a chamar o servidor", async () => {
    await expect(createPhpSettingsRepository(session(null)).saveSchedule(schedule())).rejects.toBeInstanceOf(ForbiddenError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("código recusado (403) e mensagem de validação do servidor (422) viram erros claros", async () => {
    const repo = createPhpSettingsRepository(session());
    fetchMock.mockResolvedValueOnce(json({ error: "forbidden" }, 403));
    await expect(repo.saveSchedule(schedule())).rejects.toBeInstanceOf(ForbiddenError);
    fetchMock.mockResolvedValueOnce(json({ error: "invalid", message: "Horário inválido (use o formato HH:mm)." }, 422));
    await expect(repo.saveSchedule(schedule())).rejects.toThrow("Horário inválido");
    fetchMock.mockResolvedValueOnce(new Response("x", { status: 404 }));
    await expect(repo.saveSchedule(schedule())).rejects.toBeInstanceOf(ApiNotInstalledError);
  });

  it("createRepositories('php') usa o servidor para horários", async () => {
    fetchMock.mockResolvedValue(scheduleEnvelope(schedule()));
    const repos = createRepositories("php");
    expect((await repos.settings.getSettings()).hours[1].from).toBe("11:00");
  });
});
