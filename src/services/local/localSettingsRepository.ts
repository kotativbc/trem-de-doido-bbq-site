import { defaultBusinessSettings } from "@/config/business";
import { scheduleSchema, settingsSchema } from "@/domain/schemas";
import type { BusinessSettings, Schedule } from "@/domain/settings";
import { readJson, removeKey, writeJson } from "../storage";
import type { SettingsRepository } from "../repositories";

export const SETTINGS_STORAGE_KEY = "tdd.settings.v1";

export const createLocalSettingsRepository = (): SettingsRepository => {
  const getSettings = async (): Promise<BusinessSettings> =>
    readJson(SETTINGS_STORAGE_KEY, settingsSchema) ?? structuredClone(defaultBusinessSettings);

  const saveSettings = async (settings: BusinessSettings): Promise<void> => {
    const parsed = settingsSchema.parse(settings);
    if (!writeJson(SETTINGS_STORAGE_KEY, parsed)) {
      throw new Error("Não foi possível salvar as configurações neste navegador (armazenamento indisponível ou cheio).");
    }
  };

  return {
    getSettings,
    saveSettings,
    async saveSchedule(schedule: Schedule) {
      const parsed = scheduleSchema.parse(schedule);
      await saveSettings({ ...(await getSettings()), hours: parsed.hours, closedDates: parsed.closedDates });
    },
    async resetToDefaults() {
      removeKey(SETTINGS_STORAGE_KEY);
    },
  };
};
