import { describe, expect, it, vi } from "vitest";
import { lookupCep } from "./cepLookup";
import { GeolocationError, requestPosition } from "./geolocation";

const jsonResponse = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response;

describe("consulta de CEP", () => {
  it("devolve o endereço do ViaCEP", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ logradouro: "Av. João Pinheiro", bairro: "Centro", localidade: "Sarzedo", uf: "MG" }),
    );
    const r = await lookupCep("32450-000", fetchImpl as unknown as typeof fetch);
    expect(r).toEqual({ ok: true, address: { street: "Av. João Pinheiro", neighborhood: "Centro", city: "Sarzedo", state: "MG" } });
    expect(fetchImpl.mock.calls[0][0]).toBe("https://viacep.com.br/ws/32450000/json/");
  });

  it("CEP inválido nem chama a rede", async () => {
    const fetchImpl = vi.fn();
    const r = await lookupCep("123", fetchImpl as unknown as typeof fetch);
    expect(r).toMatchObject({ ok: false, reason: "invalid" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("CEP inexistente orienta preenchimento manual", async () => {
    const r = await lookupCep("99999-999", (async () => jsonResponse({ erro: true })) as unknown as typeof fetch);
    expect(r).toMatchObject({ ok: false, reason: "not-found" });
  });

  it("falha de rede, HTTP de erro e resposta fora do formato viram 'unavailable' sem lançar", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(await lookupCep("32450-000", (async () => { throw new Error("offline"); }) as unknown as typeof fetch)).toMatchObject({ reason: "unavailable" });
    expect(await lookupCep("32450-000", (async () => jsonResponse({}, false)) as unknown as typeof fetch)).toMatchObject({ reason: "unavailable" });
    expect(await lookupCep("32450-000", (async () => jsonResponse("lixo")) as unknown as typeof fetch)).toMatchObject({ reason: "unavailable" });
    warn.mockRestore();
  });
});

describe("geolocalização", () => {
  const fakeGeo = (outcome: "ok" | 1 | 2 | 3): Geolocation =>
    ({
      getCurrentPosition: (ok: PositionCallback, err?: PositionErrorCallback | null) => {
        if (outcome === "ok") ok({ coords: { latitude: -20.04, longitude: -44.15, accuracy: 25 } } as GeolocationPosition);
        else err?.({ code: outcome, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "" } as GeolocationPositionError);
      },
    }) as unknown as Geolocation;

  it("devolve latitude, longitude e precisão", async () => {
    expect(await requestPosition(fakeGeo("ok"))).toEqual({ lat: -20.04, lng: -44.15, accuracy: 25 });
  });

  it("traduz cada falha em mensagem acionável", async () => {
    await expect(requestPosition(fakeGeo(1))).rejects.toMatchObject({ failure: "denied" });
    await expect(requestPosition(fakeGeo(2))).rejects.toMatchObject({ failure: "unavailable" });
    await expect(requestPosition(fakeGeo(3))).rejects.toMatchObject({ failure: "timeout" });
    await expect(requestPosition(fakeGeo(1))).rejects.toThrow(/manualmente/);
  });

  it("sem suporte no navegador", async () => {
    await expect(requestPosition(undefined as unknown as Geolocation | undefined)).rejects.toBeInstanceOf(GeolocationError);
  });
});
