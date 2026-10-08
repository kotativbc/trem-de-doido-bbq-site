import { useQuery } from "@tanstack/react-query";
import { defaultBusinessSettings } from "@/config/business";
import type { BusinessSettings } from "@/domain/settings";
import { repositories } from "@/services";

export const settingsQueryKey = ["settings"] as const;

export const useSettingsQuery = () =>
  useQuery({
    queryKey: settingsQueryKey,
    queryFn: () => repositories.settings.getSettings(),
    staleTime: Infinity,
  });

/**
 * Configurações do restaurante. Enquanto a leitura não termina (ou se falhar), vale o
 * padrão de `config/business.ts`, então textos de contato nunca ficam em branco.
 */
export const useSettings = (): BusinessSettings => useSettingsQuery().data ?? defaultBusinessSettings;
