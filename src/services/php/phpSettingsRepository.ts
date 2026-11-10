import type { Schedule } from "@/domain/settings";
import { createLocalSettingsRepository } from "../local/localSettingsRepository";
import type { SettingsRepository } from "../repositories";
import { ApiNotInstalledError, type EditorSession } from "./phpApi";
import { fetchSchedule, postSchedule } from "./phpSchedule";

/**
 * Configurações com os dias e horários de funcionamento guardados no servidor (valem para todos os
 * visitantes). O restante (contato, entrega etc.) continua vindo de `config/business.ts`.
 */
export const createPhpSettingsRepository = (session: EditorSession): SettingsRepository => {
  const local = createLocalSettingsRepository();
  return {
    async getSettings() {
      const base = await local.getSettings();
      try {
        const schedule = await fetchSchedule();
        return schedule ? { ...base, hours: schedule.hours, closedDates: schedule.closedDates } : base;
      } catch (error) {
        // Sem API instalada: valem os horários que vêm no site.
        if (error instanceof ApiNotInstalledError) return base;
        throw error;
      }
    },
    saveSettings: (settings) => local.saveSettings(settings),
    saveSchedule: (schedule: Schedule) => postSchedule(session, schedule),
    resetToDefaults: () => local.resetToDefaults(),
  };
};
