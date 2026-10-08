import type { BusinessSettings, DayHours } from "./settings";

/** Índice = Date#getDay() (0 = domingo). */
const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;
const DAY_NAMES_PLURAL = ["domingos", "segundas", "terças", "quartas", "quintas", "sextas", "sábados"] as const;
/** Ordem de leitura brasileira: segunda a domingo. */
const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0] as const;

const isWeekday = (day: number): boolean => day >= 1 && day <= 5;

const joinList = (items: string[]): string => {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
};

/** ["Quarta a Domingo: 18:00 – 23:00"] */
export const describeOpeningHours = (hours: DayHours[]): string[] => {
  interface Run {
    days: number[];
    from: string;
    to: string;
  }
  const runs: Run[] = [];
  let current: Run | null = null;

  for (const day of MONDAY_FIRST) {
    const h = hours[day];
    if (!h.open) {
      current = null;
      continue;
    }
    if (current && current.from === h.from && current.to === h.to) {
      current.days.push(day);
    } else {
      current = { days: [day], from: h.from, to: h.to };
      runs.push(current);
    }
  }

  return runs.map((run) => {
    const first = DAY_NAMES[run.days[0]];
    const last = DAY_NAMES[run.days[run.days.length - 1]];
    let label: string;
    if (run.days.length === 1) label = first;
    else if (run.days.length === 2) label = `${first} e ${last}`;
    else label = `${first} a ${last}`;
    return `${label}: ${run.from} – ${run.to}`;
  });
};

/** "Fechado às segundas e terças-feiras" ou null quando abre todos os dias. */
export const describeClosedDays = (hours: DayHours[]): string | null => {
  const closed = MONDAY_FIRST.filter((d) => !hours[d].open);
  if (closed.length === 0) return null;
  if (closed.length === 7) return "Fechado todos os dias";

  const allWeekdays = closed.every(isWeekday);
  const allWeekend = closed.every((d) => !isWeekday(d));

  const names = closed.map((d, i) => {
    const plural = DAY_NAMES_PLURAL[d];
    if (!isWeekday(d)) return plural;
    // Dias úteis fechados em sequência dividem um único "-feiras" no final.
    if (allWeekdays) return i === closed.length - 1 ? `${plural}-feiras` : plural;
    return `${plural}-feiras`;
  });

  if (allWeekdays) return `Fechado às ${joinList(names)}`;
  if (allWeekend) return `Fechado aos ${joinList(names)}`;

  const pieces = closed.map((d, i) => `${isWeekday(d) ? "às" : "aos"} ${names[i]}`);
  return `Fechado ${joinList(pieces)}`;
};

/* ------------------------------------------------------------------ */
/* Aberto agora?                                                       */
/* ------------------------------------------------------------------ */

interface ZonedParts {
  ymd: string;
  weekday: number;
  minutes: number;
}

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Data, dia da semana e minutos do dia no fuso do restaurante (independe do fuso do aparelho). */
export const zonedParts = (date: Date, timeZone: string): ZonedParts => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? "";
  return {
    ymd: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
};

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const isSundayIn = (date: Date, timeZone: string): boolean => zonedParts(date, timeZone).weekday === 0;

export type ClosedReason = "closed-date" | "closed-day" | "outside-hours";

export interface OpenStatus {
  open: boolean;
  reason?: ClosedReason;
  /** "hoje às 18:00", "amanhã às 18:00", "quarta-feira às 18:00". */
  nextOpening?: string;
}

const addDays = (ymd: string, days: number): { ymd: string; weekday: number } => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    ymd: `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`,
    weekday: dt.getUTCDay(),
  };
};

const dayLabel = (offset: number, weekday: number): string => {
  if (offset === 0) return "hoje";
  if (offset === 1) return "amanhã";
  const name = DAY_NAMES[weekday].toLowerCase();
  return isWeekday(weekday) ? `${name}-feira` : name;
};

const findNextOpening = (settings: BusinessSettings, now: ZonedParts): string | undefined => {
  for (let offset = 0; offset <= 7; offset++) {
    const day = addDays(now.ymd, offset);
    if (settings.closedDates.includes(day.ymd)) continue;
    const h = settings.hours[day.weekday];
    if (!h.open) continue;
    if (offset === 0 && now.minutes >= toMinutes(h.from)) continue;
    return `${dayLabel(offset, day.weekday)} às ${h.from}`;
  }
  return undefined;
};

export const getOpenStatus = (settings: BusinessSettings, now: Date = new Date()): OpenStatus => {
  const z = zonedParts(now, settings.timezone);
  const today = settings.hours[z.weekday];

  const insideWindow = (h: DayHours, minutes: number): boolean => {
    const from = toMinutes(h.from);
    const to = toMinutes(h.to);
    // Janela que passa da meia-noite (ex.: 18:00 às 02:00): hoje só vale a partir de `from`.
    return from <= to ? minutes >= from && minutes < to : minutes >= from;
  };

  // Cauda de ontem, quando a janela de ontem atravessou a meia-noite.
  const yesterday = addDays(z.ymd, -1);
  const yHours = settings.hours[yesterday.weekday];
  const yTailOpen =
    yHours.open &&
    !settings.closedDates.includes(yesterday.ymd) &&
    toMinutes(yHours.from) > toMinutes(yHours.to) &&
    z.minutes < toMinutes(yHours.to);
  if (yTailOpen) return { open: true };

  if (settings.closedDates.includes(z.ymd)) {
    return { open: false, reason: "closed-date", nextOpening: findNextOpening(settings, z) };
  }
  if (!today.open) {
    return { open: false, reason: "closed-day", nextOpening: findNextOpening(settings, z) };
  }
  if (!insideWindow(today, z.minutes)) {
    return { open: false, reason: "outside-hours", nextOpening: findNextOpening(settings, z) };
  }
  return { open: true };
};
