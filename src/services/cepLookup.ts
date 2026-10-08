import { z } from "zod";
import { isValidCep, normalizeCep } from "@/domain/cep";

export interface CepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export type CepLookupResult =
  | { ok: true; address: CepAddress }
  | { ok: false; reason: "invalid" | "not-found" | "unavailable"; message: string };

const viaCepSchema = z.union([
  z.object({ erro: z.union([z.boolean(), z.string()]) }),
  z.object({
    logradouro: z.string().default(""),
    bairro: z.string().default(""),
    localidade: z.string().default(""),
    uf: z.string().default(""),
  }),
]);

const TIMEOUT_MS = 6000;

/**
 * Busca o endereço pelo CEP no ViaCEP (serviço público, sem chave). Qualquer falha
 * (offline, bloqueio, lentidão) devolve "unavailable" e o formulário segue com preenchimento manual.
 */
export const lookupCep = async (rawCep: string, fetchImpl: typeof fetch = fetch): Promise<CepLookupResult> => {
  if (!isValidCep(rawCep)) {
    return { ok: false, reason: "invalid", message: "CEP inválido. Use 8 dígitos, por exemplo 32450-000." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchImpl(`https://viacep.com.br/ws/${normalizeCep(rawCep)}/json/`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = viaCepSchema.parse(await response.json());
    if ("erro" in parsed) {
      return { ok: false, reason: "not-found", message: "CEP não encontrado. Preencha o endereço manualmente." };
    }
    return {
      ok: true,
      address: { street: parsed.logradouro, neighborhood: parsed.bairro, city: parsed.localidade, state: parsed.uf },
    };
  } catch (error) {
    console.warn("[cep] consulta indisponível:", error);
    return {
      ok: false,
      reason: "unavailable",
      message: "Não foi possível consultar o CEP agora. Preencha o endereço manualmente.",
    };
  } finally {
    clearTimeout(timer);
  }
};
