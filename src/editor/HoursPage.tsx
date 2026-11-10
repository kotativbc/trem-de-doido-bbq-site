import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { describeClosedDays, describeOpeningHours, getOpenStatus } from "@/domain/hours";
import { scheduleSchema } from "@/domain/schemas";
import type { BusinessSettings, Schedule } from "@/domain/settings";
import { settingsQueryKey, useSettingsQuery } from "@/hooks/useSettings";
import { repositories } from "@/services";
import { useAdminRun } from "@/admin/useAdminRun";

const DAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
/** Ordem de leitura brasileira: segunda a domingo (índice = Date#getDay()). */
const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];

const formatDate = (ymd: string): string => ymd.split("-").reverse().join("/");

const HoursForm = ({ initial }: { initial: BusinessSettings }) => {
  const run = useAdminRun();
  const [draft, setDraft] = useState<Schedule>({ hours: structuredClone(initial.hours), closedDates: [...initial.closedDates] });
  const [newDate, setNewDate] = useState("");
  const [error, setError] = useState("");

  const patchDay = (day: number, patch: Partial<Schedule["hours"][number]>) =>
    setDraft((d) => ({ ...d, hours: d.hours.map((h, i) => (i === day ? { ...h, ...patch } : h)) }));

  const sameTime = draft.hours.findIndex((h) => h.open && h.from === h.to);
  const dirty = JSON.stringify(draft) !== JSON.stringify({ hours: initial.hours, closedDates: initial.closedDates });
  const preview = { ...initial, hours: draft.hours, closedDates: draft.closedDates };
  const openLines = describeOpeningHours(draft.hours);
  const closedText = describeClosedDays(draft.hours);
  const status = getOpenStatus(preview);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (sameTime >= 0) {
      setError(`${DAY_NAMES[sameTime]}: o horário de abrir e o de fechar não podem ser iguais.`);
      return;
    }
    const parsed = scheduleSchema.safeParse({ ...draft, closedDates: [...draft.closedDates].sort() });
    if (!parsed.success) {
      setError("Confira os horários: use o formato HH:mm em todos os campos.");
      return;
    }
    await run(() => repositories.settings.saveSchedule(parsed.data), {
      success: "Horários salvos. O site já mostra a mudança.",
      invalidate: [settingsQueryKey],
    });
  };

  return (
    <form onSubmit={save} noValidate className="space-y-6">
      <section className="space-y-4 rounded-xl border border-border bg-[#111111] p-4">
        <div>
          <h2 className="font-['Bebas_Neue'] text-2xl text-primary">Dias e horários de funcionamento</h2>
          <p className="text-sm text-muted-foreground">
            Ligue os dias em que o restaurante abre e ajuste o horário de cada um. Se fechar depois da meia-noite, é só colocar o horário
            do dia seguinte (ex.: abre 18:00, fecha 01:00).
          </p>
        </div>
        <ul className="space-y-3">
          {MONDAY_FIRST.map((day) => {
            const h = draft.hours[day];
            const crossesMidnight = h.open && h.to < h.from;
            return (
              <li key={day} className="flex flex-wrap items-center gap-3">
                <label className="flex w-44 items-center gap-2 text-sm">
                  <Switch checked={h.open} aria-label={`${DAY_NAMES[day]}: aberto`} onCheckedChange={(v) => patchDay(day, { open: v })} />
                  {DAY_NAMES[day]}
                </label>
                <Input
                  type="time"
                  aria-label={`${DAY_NAMES[day]}: abre às`}
                  className="w-28"
                  value={h.from}
                  disabled={!h.open}
                  onChange={(e) => patchDay(day, { from: e.target.value })}
                />
                <span aria-hidden="true">às</span>
                <Input
                  type="time"
                  aria-label={`${DAY_NAMES[day]}: fecha às`}
                  className="w-28"
                  value={h.to}
                  disabled={!h.open}
                  onChange={(e) => patchDay(day, { to: e.target.value })}
                />
                {!h.open && <span className="text-sm text-muted-foreground">Fechado</span>}
                {crossesMidnight && <span className="text-xs text-muted-foreground">fecha já no dia seguinte</span>}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-[#111111] p-4">
        <div>
          <h2 className="font-['Bebas_Neue'] text-2xl text-primary">Dias fechados (feriados, folgas)</h2>
          <p className="text-sm text-muted-foreground">Datas em que o restaurante não abre, mesmo sendo um dia normal de funcionamento.</p>
        </div>
        {draft.closedDates.length === 0 && <p className="text-sm text-muted-foreground">Nenhum dia fechado cadastrado.</p>}
        <ul className="flex flex-wrap gap-2">
          {[...draft.closedDates].sort().map((d) => (
            <li key={d} className="flex items-center gap-1 rounded-full bg-[#1A1A1A] px-3 py-1 text-sm">
              {formatDate(d)}
              <button
                type="button"
                aria-label={`Remover dia fechado ${formatDate(d)}`}
                onClick={() => setDraft((c) => ({ ...c, closedDates: c.closedDates.filter((x) => x !== d) }))}
                className="rounded text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="h-newdate">Adicionar dia fechado</Label>
            <Input id="h-newdate" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-44" />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!newDate || draft.closedDates.includes(newDate)}
            onClick={() => {
              setDraft((c) => ({ ...c, closedDates: [...c.closedDates, newDate] }));
              setNewDate("");
            }}
          >
            Adicionar
          </Button>
        </div>
      </section>

      <section aria-label="Como vai aparecer no site" className="space-y-2 rounded-xl border border-dashed border-border p-4">
        <h2 className="text-sm font-semibold">Como vai aparecer no site</h2>
        {openLines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum dia aberto.</p>
        ) : (
          <ul className="text-sm">
            {openLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        {closedText && <p className="text-sm text-muted-foreground">{closedText}</p>}
        <p className="text-sm text-muted-foreground">
          Agora: {status.open ? "aberto" : `fechado${status.nextOpening ? ` (abre ${status.nextOpening})` : ""}`}.
        </p>
      </section>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!dirty} className="bg-primary text-primary-foreground hover:bg-primary/90">
        Salvar horários
      </Button>
    </form>
  );
};

const HoursPage = () => {
  const { data, isLoading, isError, error, refetch } = useSettingsQuery();

  let content;
  if (isLoading) {
    content = <Skeleton className="h-64 w-full" />;
  } else if (isError || !data) {
    content = (
      <div role="alert" className="space-y-3">
        <p>Não foi possível carregar os horários agora.</p>
        <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "Tente novamente."}</p>
        <Button onClick={() => void refetch()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Tentar novamente
        </Button>
      </div>
    );
  } else {
    // `key` recria o formulário quando os dados salvos mudam (ex.: depois de salvar).
    content = <HoursForm key={JSON.stringify([data.hours, data.closedDates])} initial={data} />;
  }

  return (
    <div className="space-y-4">
      <h1 className="font-['Bebas_Neue'] text-4xl">HORÁRIOS</h1>
      {content}
    </div>
  );
};

export default HoursPage;
