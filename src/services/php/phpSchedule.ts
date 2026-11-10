import { z } from "zod";
import { scheduleSchema } from "@/domain/schemas";
import type { Schedule } from "@/domain/settings";
import { apiUrl, ApiNotInstalledError, ForbiddenError, type EditorSession } from "./phpApi";

const envelopeSchema = z.object({
  revision: z.number().int().min(0),
  updatedAt: z.string().nullable(),
  schedule: scheduleSchema.nullable(),
});

/**
 * Horários salvos no servidor. `null` quando o restaurante ainda não alterou nada
 * (vale então o padrão que vem no site). Sem API instalada, lança `ApiNotInstalledError`.
 */
export const fetchSchedule = async (): Promise<Schedule | null> => {
  const response = await fetch(apiUrl("schedule.php"), { cache: "no-store" });
  if (response.status === 404) throw new ApiNotInstalledError();
  if (!response.ok) throw new Error(`O servidor respondeu com erro ${response.status} ao carregar os horários.`);
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiNotInstalledError();
  }
  const parsed = envelopeSchema.safeParse(body);
  if (!parsed.success) throw new Error("Os horários salvos no servidor estão em formato inesperado.");
  return parsed.data.schedule;
};

export const postSchedule = async (session: EditorSession, schedule: Schedule): Promise<void> => {
  if (!session.token) throw new ForbiddenError();
  const response = await fetch(apiUrl("schedule.php"), {
    method: "POST",
    headers: { "X-Editor-Token": session.token, "Content-Type": "application/json" },
    body: JSON.stringify({ schedule }),
  });
  if (response.ok) return;
  if (response.status === 403) throw new ForbiddenError();
  if (response.status === 404) throw new ApiNotInstalledError();
  let message: string | undefined;
  try {
    const parsed = z.object({ message: z.string() }).safeParse(await response.json());
    message = parsed.success ? parsed.data.message : undefined;
  } catch {
    message = undefined;
  }
  throw new Error(message ?? `O servidor recusou a operação (erro ${response.status}).`);
};
