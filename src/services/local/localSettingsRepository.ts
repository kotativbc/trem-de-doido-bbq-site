import { defaultBusinessSettings } from "@/config/business";
import { settingsSchema } from "@/domain/schemas";
import type { BusinessSettings } from "@/domain/settings";
import { readJson, removeKey, writeJson } from "../storage";
import type { SettingsRepository } from "../repositories";

export const SETTINGS_STORAGE_KEY = "tdd.settings.v1";

export const createLocalSettingsRepository = (): SettingsRepository => ({
  async getSettings() {
    return readJson(SETTINGS_STORAGE_KEY, settingsSchema) ?? structuredClone(defaultBusinessSettings);
  },

  async saveSettings(settings: BusinessSettings) {
    const parsed = settingsSchema.parse(settings);
    if (!writeJson(SETTINGS_STORAGE_KEY, parsed)) {
      throw new Error("Não foi possível salvar as configurações neste navegador (armazenamento indisponível ou cheio).");
    }
  },

  async resetToDefaults() {
    removeKey(SETTINGS_STORAGE_KEY);
  },
});
