import { describe, expect, it } from "vitest";
import { defaultBusinessSettings } from "@/config/business";
import { SP, settingsWith } from "@/test/helpers";
import type { DayHours } from "./settings";
import { describeClosedDays, describeOpeningHours, getOpenStatus, zonedParts } from "./hours";

const open = (from = "18:00", to = "23:00"): DayHours => ({ open: true, from, to });
const closed: DayHours = { open: false, from: "18:00", to: "23:00" };
// índice = getDay(): dom, seg, ter, qua, qui, sex, sáb
const week = (days: DayHours[]) => days;

describe("textos de horário (devem reproduzir o site original)", () => {
  it("horário padrão", () => {
    expect(describeOpeningHours(defaultBusinessSettings.hours)).toEqual(["Quarta a Domingo: 18:00 – 23:00"]);
    expect(describeClosedDays(defaultBusinessSettings.hours)).toBe("Fechado às segundas e terças-feiras");
  });

  it("abre todos os dias: sem linha de fechado", () => {
    const hours = week(Array.from({ length: 7 }, () => open()));
    expect(describeOpeningHours(hours)).toEqual(["Segunda a Domingo: 18:00 – 23:00"]);
    expect(describeClosedDays(hours)).toBeNull();
  });

  it("fecha todos os dias", () => {
    const hours = week(Array.from({ length: 7 }, () => closed));
    expect(describeOpeningHours(hours)).toEqual([]);
    expect(describeClosedDays(hours)).toBe("Fechado todos os dias");
  });

  it("agrupa dias com horários diferentes em linhas separadas", () => {
    // dom 12-20, seg/ter fechado, qua-sex 18-23, sáb 18-00... sáb 18-23
    const hours = week([open("12:00", "20:00"), closed, closed, open(), open(), open(), open("17:00", "23:30")]);
    expect(describeOpeningHours(hours)).toEqual([
      "Quarta a Sexta: 18:00 – 23:00",
      "Sábado: 17:00 – 23:30",
      "Domingo: 12:00 – 20:00",
    ]);
  });

  it("dois dias seguidos usam 'e'", () => {
    const hours = week([closed, closed, closed, closed, closed, open(), open()]);
    expect(describeOpeningHours(hours)).toEqual(["Sexta e Sábado: 18:00 – 23:00"]);
  });

  it("concordância dos dias fechados", () => {
    const only = (...closedDays: number[]) =>
      week(Array.from({ length: 7 }, (_, d) => (closedDays.includes(d) ? closed : open())));
    expect(describeClosedDays(only(1))).toBe("Fechado às segundas-feiras");
    expect(describeClosedDays(only(6, 0))).toBe("Fechado aos sábados e domingos");
    expect(describeClosedDays(only(2, 0))).toBe("Fechado às terças-feiras e aos domingos");
    expect(describeClosedDays(only(1, 2, 3))).toBe("Fechado às segundas, terças e quartas-feiras");
  });
});

describe("zonedParts", () => {
  it("usa o fuso do restaurante, não o do aparelho", () => {
    const parts = zonedParts(SP.sun22hSP, "America/Sao_Paulo");
    expect(parts).toEqual({ ymd: "2026-10-04", weekday: 0, minutes: 22 * 60 });
  });
});

describe("getOpenStatus", () => {
  const settings = defaultBusinessSettings;

  it("aberto dentro da janela", () => {
    expect(getOpenStatus(settings, SP.wed19h)).toEqual({ open: true });
  });

  it("antes de abrir: próxima abertura é hoje", () => {
    expect(getOpenStatus(settings, SP.wed17h)).toEqual({ open: false, reason: "outside-hours", nextOpening: "hoje às 18:00" });
  });

  it("depois de fechar: próxima abertura é amanhã", () => {
    expect(getOpenStatus(settings, SP.wed23h30)).toEqual({
      open: false,
      reason: "outside-hours",
      nextOpening: "amanhã às 18:00",
    });
  });

  it("dia fechado na semana", () => {
    expect(getOpenStatus(settings, SP.mon12h)).toEqual({
      open: false,
      reason: "closed-day",
      nextOpening: "quarta-feira às 18:00",
    });
  });

  it("domingo à noite, fechando: próxima abertura passa pelos dias fechados", () => {
    expect(getOpenStatus(settings, SP.sun23h30)).toMatchObject({ open: false, nextOpening: "quarta-feira às 18:00" });
  });

  it("data fechada extraordinariamente", () => {
    const s = settingsWith({ closedDates: ["2026-10-07"] });
    expect(getOpenStatus(s, SP.wed19h)).toEqual({ open: false, reason: "closed-date", nextOpening: "amanhã às 18:00" });
  });

  it("janela que atravessa a meia-noite continua aberta na madrugada seguinte", () => {
    const hours = week([closed, closed, closed, closed, closed, open("18:00", "02:00"), closed]);
    const s = settingsWith({ hours });
    // sexta 05/10... 09/10/2026 é sexta; 23h SP e 01h SP de sábado
    expect(getOpenStatus(s, new Date("2026-10-10T02:00:00Z"))).toEqual({ open: true }); // sex 23:00
    expect(getOpenStatus(s, new Date("2026-10-10T04:00:00Z"))).toEqual({ open: true }); // sáb 01:00
    expect(getOpenStatus(s, new Date("2026-10-10T06:00:00Z")).open).toBe(false); // sáb 03:00
  });
});
