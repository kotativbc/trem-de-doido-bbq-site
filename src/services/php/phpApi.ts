import { z } from "zod";
import { catalogSchema } from "@/domain/schemas";

/** Endereço de um arquivo da API PHP (funciona também se o site estiver numa subpasta). */
export const apiUrl = (file: string): string => `${import.meta.env.BASE_URL}api/${file}`;

/** Sessão do editor: guarda o código secreto só em memória, enquanto a página estiver aberta. */
export interface EditorSession {
  token: string | null;
}

export class ApiNotInstalledError extends Error {
  constructor() {
    super("A API do cardápio (pasta api/ com PHP) não foi encontrada neste servidor.");
    this.name = "ApiNotInstalledError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Acesso negado: o link de edição é inválido ou foi trocado.");
    this.name = "ForbiddenError";
  }
}

const envelopeSchema = z.object({
  revision: z.number().int().min(0),
  updatedAt: z.string().nullable(),
  catalog: catalogSchema.nullable(),
});
export type CatalogEnvelope = z.infer<typeof envelopeSchema>;

const errorBodySchema = z.object({ message: z.string().optional() });

const readMessage = async (response: Response): Promise<string | undefined> => {
  try {
    const parsed = errorBodySchema.safeParse(await response.json());
    return parsed.success ? parsed.data.message : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Lê o cardápio salvo no servidor. Se a API não existir (404 ou resposta que não é JSON, como a página
 * inicial devolvida por uma regra de rota), lança `ApiNotInstalledError` para o chamador decidir.
 */
export const fetchEnvelope = async (): Promise<CatalogEnvelope> => {
  const response = await fetch(apiUrl("catalog.php"), { cache: "no-store" });
  if (response.status === 404) throw new ApiNotInstalledError();
  if (!response.ok) throw new Error(`O servidor respondeu com erro ${response.status} ao carregar o cardápio.`);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiNotInstalledError();
  }
  const parsed = envelopeSchema.safeParse(body);
  if (!parsed.success) throw new Error("O cardápio salvo no servidor está em formato inesperado.");
  return parsed.data;
};

const authHeaders = (session: EditorSession): Record<string, string> => {
  if (!session.token) throw new ForbiddenError();
  return { "X-Editor-Token": session.token };
};

const failFrom = async (response: Response): Promise<never> => {
  if (response.status === 403) throw new ForbiddenError();
  if (response.status === 404) throw new ApiNotInstalledError();
  const message = await readMessage(response);
  throw new Error(message ?? `O servidor recusou a operação (erro ${response.status}).`);
};

export const postCatalog = async (session: EditorSession, catalog: unknown, baseRevision: number): Promise<void> => {
  const response = await fetch(apiUrl("catalog.php"), {
    method: "POST",
    headers: { ...authHeaders(session), "Content-Type": "application/json" },
    body: JSON.stringify({ baseRevision, catalog }),
  });
  if (!response.ok) await failFrom(response);
};

const uploadResultSchema = z.object({ url: z.string().min(1) });

export const postImage = async (session: EditorSession, image: Blob): Promise<string> => {
  const form = new FormData();
  form.append("image", image, "foto.jpg");
  const response = await fetch(apiUrl("upload.php"), { method: "POST", headers: authHeaders(session), body: form });
  if (!response.ok) await failFrom(response);
  const parsed = uploadResultSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("O servidor não devolveu o endereço da imagem.");
  return parsed.data.url;
};

/** true = código válido; false = recusado. Outros problemas viram exceção. */
export const verifyToken = async (token: string): Promise<boolean> => {
  const response = await fetch(`${apiUrl("catalog.php")}?action=verify`, {
    headers: { "X-Editor-Token": token },
    cache: "no-store",
  });
  if (response.status === 403) return false;
  if (response.status === 404) throw new ApiNotInstalledError();
  if (response.status === 503) throw new Error("A API ainda não foi configurada neste servidor (falta o arquivo api/config.php).");
  if (!response.ok) throw new Error(`O servidor respondeu com erro ${response.status}.`);
  try {
    const body: unknown = await response.json();
    return z.object({ ok: z.literal(true) }).safeParse(body).success;
  } catch {
    throw new ApiNotInstalledError();
  }
};
