import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { defaultBusinessSettings } from "@/config/business";
import { formatDecimalBRL, parseBRLToCents, type Cents } from "@/domain/money";
import { settingsSchema } from "@/domain/schemas";
import type { BusinessSettings } from "@/domain/settings";
import { catalogQueryKey } from "@/hooks/useCatalog";
import { settingsQueryKey, useSettingsQuery } from "@/hooks/useSettings";
import { repositories } from "@/services";
import { MIN_ADMIN_PASSWORD_LENGTH } from "@/services/repositories";
import { useAdminAuth } from "../adminAuthContext";
import { useAdminRun } from "../useAdminRun";

const DAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-4 rounded-xl border border-border bg-[#111111] p-4">
    <h2 className="font-['Bebas_Neue'] text-2xl text-primary">{title}</h2>
    {children}
  </section>
);

const Field = ({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

/** Campo de dinheiro: o texto é livre enquanto digita; só valores válidos viram centavos no rascunho. */
const MoneyField = ({ id, label, hint, cents, onChange }: { id: string; label: string; hint?: string; cents: Cents; onChange: (c: Cents) => void }) => {
  const [text, setText] = useState(cents ? formatDecimalBRL(cents) : "");
  const parsed = text.trim() === "" ? 0 : parseBRLToCents(text);
  return (
    <Field id={id} label={label} hint={hint}>
      <Input
        id={id}
        inputMode="decimal"
        value={text}
        placeholder="0,00"
        aria-invalid={parsed === null}
        onChange={(e) => {
          setText(e.target.value);
          const next = e.target.value.trim() === "" ? 0 : parseBRLToCents(e.target.value);
          if (next !== null) onChange(next);
        }}
      />
      {parsed === null && <p role="alert" className="text-xs text-red-400">Valor inválido. Exemplo: 5,00.</p>}
    </Field>
  );
};

const NumberField = ({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (n: number) => void }) => (
  <Field id={id} label={label}>
    <Input id={id} type="number" min={0} value={value} onChange={(e) => onChange(Math.max(0, Math.trunc(Number(e.target.value) || 0)))} />
  </Field>
);

const PasswordSection = () => {
  const { changePassword } = useAdminAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const ok = await changePassword(current, next);
      setMessage(ok ? { ok: true, text: "Senha alterada." } : { ok: false, text: "A senha atual não confere." });
      if (ok) {
        setCurrent("");
        setNext("");
      }
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Não foi possível alterar a senha." });
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field id="pw-current" label="Senha atual">
        <Input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field id="pw-new" label="Nova senha" hint={`Mínimo de ${MIN_ADMIN_PASSWORD_LENGTH} caracteres.`}>
        <Input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={`text-sm sm:col-span-2 ${message.ok ? "text-green-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" variant="outline" disabled={!current || !next}>Alterar senha</Button>
      </div>
    </form>
  );
};

const SettingsForm = ({ initial }: { initial: BusinessSettings }) => {
  const run = useAdminRun();
  const [draft, setDraft] = useState<BusinessSettings>(initial);
  const [error, setError] = useState("");
  const [newDate, setNewDate] = useState("");
  const [confirmReset, setConfirmReset] = useState<"catalog" | "settings" | null>(null);

  const patch = (p: Partial<BusinessSettings>) => setDraft((d) => ({ ...d, ...p }));
  const patchDelivery = (p: Partial<BusinessSettings["delivery"]>) => setDraft((d) => ({ ...d, delivery: { ...d.delivery, ...p } }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = settingsSchema.safeParse({ ...draft, whatsappNumber: draft.whatsappNumber.replace(/\D/g, "") });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(`${issue.message === "Required" ? "Campo obrigatório" : issue.message} (${issue.path.join(" › ")})`);
      return;
    }
    await run(() => repositories.settings.saveSettings(parsed.data), { success: "Configurações salvas.", invalidate: [settingsQueryKey] });
  };

  const doReset = async () => {
    if (confirmReset === "catalog") {
      await run(() => repositories.catalog.resetToSeed(), { success: "Cardápio original restaurado.", invalidate: [catalogQueryKey] });
    } else if (confirmReset === "settings") {
      const ok = await run(() => repositories.settings.resetToDefaults(), { success: "Configurações padrão restauradas.", invalidate: [settingsQueryKey] });
      if (ok) setDraft(structuredClone(defaultBusinessSettings));
    }
    setConfirmReset(null);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={save} noValidate className="space-y-6">
        <Section title="Contato e endereço">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="s-name" label="Nome do restaurante"><Input id="s-name" value={draft.name} onChange={(e) => patch({ name: e.target.value })} /></Field>
            <Field id="s-city" label="Cidade"><Input id="s-city" value={draft.city} onChange={(e) => patch({ city: e.target.value })} /></Field>
            <Field id="s-addr-line" label="Endereço (linha curta)"><Input id="s-addr-line" value={draft.addressLine} onChange={(e) => patch({ addressLine: e.target.value })} /></Field>
            <Field id="s-addr-full" label="Endereço completo"><Input id="s-addr-full" value={draft.addressFull} onChange={(e) => patch({ addressFull: e.target.value })} /></Field>
            <Field id="s-maps" label="Busca no Google Maps" hint="Usada no botão Como chegar."><Input id="s-maps" value={draft.mapsQuery} onChange={(e) => patch({ mapsQuery: e.target.value })} /></Field>
            <Field id="s-phone" label="Telefone exibido"><Input id="s-phone" value={draft.phoneDisplay} onChange={(e) => patch({ phoneDisplay: e.target.value })} /></Field>
            <Field id="s-wa" label="WhatsApp para pedidos" hint="Só dígitos, com 55 + DDD. Ex.: 5531997036657. É para este número que o pedido é enviado.">
              <Input id="s-wa" inputMode="numeric" value={draft.whatsappNumber} onChange={(e) => patch({ whatsappNumber: e.target.value })} />
            </Field>
            <Field id="s-ig" label="Instagram (sem @)"><Input id="s-ig" value={draft.instagramHandle} onChange={(e) => patch({ instagramHandle: e.target.value.replace(/^@/, "") })} /></Field>
          </div>
        </Section>

        <Section title="Horário de funcionamento">
          <ul className="space-y-2">
            {draft.hours.map((h, day) => (
              <li key={DAYS[day]} className="flex flex-wrap items-center gap-3">
                <label className="flex w-44 items-center gap-2 text-sm">
                  <Switch
                    checked={h.open}
                    aria-label={`${DAYS[day]}: aberto`}
                    onCheckedChange={(v) => patch({ hours: draft.hours.map((x, i) => (i === day ? { ...x, open: v } : x)) })}
                  />
                  {DAYS[day]}
                </label>
                <Input
                  type="time"
                  aria-label={`${DAYS[day]}: abre às`}
                  className="w-28"
                  value={h.from}
                  disabled={!h.open}
                  onChange={(e) => patch({ hours: draft.hours.map((x, i) => (i === day ? { ...x, from: e.target.value } : x)) })}
                />
                <span aria-hidden="true">às</span>
                <Input
                  type="time"
                  aria-label={`${DAYS[day]}: fecha às`}
                  className="w-28"
                  value={h.to}
                  disabled={!h.open}
                  onChange={(e) => patch({ hours: draft.hours.map((x, i) => (i === day ? { ...x, to: e.target.value } : x)) })}
                />
                {!h.open && <span className="text-sm text-muted-foreground">Fechado</span>}
              </li>
            ))}
          </ul>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Dias fechados (feriados, férias)</h3>
            {draft.closedDates.length === 0 && <p className="text-sm text-muted-foreground">Nenhum dia fechado cadastrado.</p>}
            <ul className="flex flex-wrap gap-2">
              {[...draft.closedDates].sort().map((d) => (
                <li key={d} className="flex items-center gap-1 rounded-full bg-[#1A1A1A] px-3 py-1 text-sm">
                  {d.split("-").reverse().join("/")}
                  <button type="button" aria-label={`Remover dia fechado ${d.split("-").reverse().join("/")}`} onClick={() => patch({ closedDates: draft.closedDates.filter((x) => x !== d) })} className="rounded text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-end gap-2">
              <Field id="s-newdate" label="Adicionar dia fechado">
                <Input id="s-newdate" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-44" />
              </Field>
              <Button
                type="button"
                variant="outline"
                disabled={!newDate || draft.closedDates.includes(newDate)}
                onClick={() => {
                  patch({ closedDates: [...draft.closedDates, newDate] });
                  setNewDate("");
                }}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </Section>

        <Section title="Entrega">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={draft.delivery.enabled} onCheckedChange={(v) => patchDelivery({ enabled: v })} aria-label="Aceitar entregas" />
            Aceitar entregas (desligado = só retirada no balcão)
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <MoneyField id="s-fee" label="Taxa padrão de entrega (R$)" hint="Vale quando o bairro não está na lista abaixo." cents={draft.delivery.defaultFeeCents} onChange={(c) => patchDelivery({ defaultFeeCents: c })} />
            <MoneyField id="s-min" label="Pedido mínimo para entrega (R$)" hint="Em branco = sem mínimo. Não vale para retirada." cents={draft.delivery.minOrderCents} onChange={(c) => patchDelivery({ minOrderCents: c })} />
            <NumberField id="s-prep-min" label="Preparo: mínimo (min)" value={draft.delivery.prepMinutes.min} onChange={(n) => patchDelivery({ prepMinutes: { ...draft.delivery.prepMinutes, min: n } })} />
            <NumberField id="s-prep-max" label="Preparo: máximo (min)" value={draft.delivery.prepMinutes.max} onChange={(n) => patchDelivery({ prepMinutes: { ...draft.delivery.prepMinutes, max: n } })} />
            <NumberField id="s-del-min" label="Deslocamento: mínimo (min)" value={draft.delivery.deliveryMinutes.min} onChange={(n) => patchDelivery({ deliveryMinutes: { ...draft.delivery.deliveryMinutes, min: n } })} />
            <NumberField id="s-del-max" label="Deslocamento: máximo (min)" value={draft.delivery.deliveryMinutes.max} onChange={(n) => patchDelivery({ deliveryMinutes: { ...draft.delivery.deliveryMinutes, max: n } })} />
          </div>
          <Field id="s-area" label="Área de atendimento (texto mostrado ao cliente)">
            <Textarea id="s-area" rows={2} maxLength={300} value={draft.delivery.serviceAreaText} onChange={(e) => patchDelivery({ serviceAreaText: e.target.value })} />
          </Field>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Taxa por bairro</h3>
            {draft.delivery.zones.length === 0 && <p className="text-sm text-muted-foreground">Sem bairros cadastrados: vale a taxa padrão para todos.</p>}
            {draft.delivery.zones.map((z, i) => (
              <div key={z.id} className="grid grid-cols-[1fr_8rem_auto] gap-2">
                <Input
                  aria-label={`Bairro ${i + 1}`}
                  value={z.name}
                  onChange={(e) => patchDelivery({ zones: draft.delivery.zones.map((x) => (x.id === z.id ? { ...x, name: e.target.value } : x)) })}
                />
                <Input
                  aria-label={`Taxa do bairro ${i + 1} (R$)`}
                  inputMode="decimal"
                  defaultValue={z.feeCents ? formatDecimalBRL(z.feeCents) : ""}
                  placeholder="0,00"
                  onChange={(e) => {
                    const cents = e.target.value.trim() === "" ? 0 : parseBRLToCents(e.target.value);
                    if (cents !== null) patchDelivery({ zones: draft.delivery.zones.map((x) => (x.id === z.id ? { ...x, feeCents: cents } : x)) });
                  }}
                />
                <Button type="button" variant="ghost" size="icon" aria-label={`Remover bairro ${i + 1}`} onClick={() => patchDelivery({ zones: draft.delivery.zones.filter((x) => x.id !== z.id) })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => patchDelivery({ zones: [...draft.delivery.zones, { id: `z-${Math.random().toString(36).slice(2, 8)}`, name: "", feeCents: 0 }] })}>
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Bairro
            </Button>
          </div>
        </Section>

        <Section title="Regras de pedido">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={draft.ordering.allowOrdersWhenClosed} onCheckedChange={(v) => patch({ ordering: { ...draft.ordering, allowOrdersWhenClosed: v } })} aria-label="Aceitar pedidos com a loja fechada" />
            Permitir enviar pedidos com a loja fechada (o cliente é avisado)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={draft.ordering.enforceSundayOnly} onCheckedChange={(v) => patch({ ordering: { ...draft.ordering, enforceSundayOnly: v } })} aria-label="Bloquear itens de domingo nos outros dias" />
            Bloquear itens "somente aos domingos" nos outros dias
          </label>
        </Section>

        <Section title="Promoção no site">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={draft.promoBanner.enabled} onCheckedChange={(v) => patch({ promoBanner: { ...draft.promoBanner, enabled: v } })} aria-label="Mostrar banner de promoção" />
            Mostrar banner no topo do cardápio
          </label>
          <Field id="s-promo" label="Texto do banner">
            <Input id="s-promo" maxLength={200} value={draft.promoBanner.text} onChange={(e) => patch({ promoBanner: { ...draft.promoBanner, text: e.target.value } })} />
          </Field>
        </Section>

        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md">
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">Salvar configurações</Button>
        </div>
      </form>

      <Section title="Segurança">
        <p className="text-sm text-muted-foreground">
          Modo demonstração: a senha fica só neste navegador. Troque-a quando quiser.
        </p>
        <PasswordSection />
      </Section>

      <Section title="Restaurar padrões">
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => setConfirmReset("catalog")}>Restaurar cardápio original</Button>
          <Button type="button" variant="outline" onClick={() => setConfirmReset("settings")}>Restaurar configurações padrão</Button>
        </div>
      </Section>

      <AlertDialog open={confirmReset !== null} onOpenChange={(open) => !open && setConfirmReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmReset === "catalog" ? "Restaurar o cardápio original?" : "Restaurar as configurações padrão?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmReset === "catalog"
                ? "Produtos e categorias voltam ao que veio com o projeto. Alterações feitas aqui serão perdidas."
                : "Horários, entrega, contato e regras voltam ao padrão. Alterações feitas aqui serão perdidas."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void doReset()}>Restaurar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SettingsPage = () => {
  const { data, isLoading, isError, refetch } = useSettingsQuery();
  // O formulário só monta com os dados carregados; assim o rascunho nunca nasce com valores errados.
  const [ready, setReady] = useState<BusinessSettings | null>(null);
  useEffect(() => {
    if (data && !ready) setReady(structuredClone(data));
  }, [data, ready]);

  return (
    <div className="space-y-5">
      <h1 className="font-['Bebas_Neue'] text-4xl">CONFIGURAÇÕES</h1>
      {isLoading || (!ready && !isError) ? (
        <div className="space-y-3" role="status" aria-label="Carregando configurações">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : isError || !ready ? (
        <div role="alert" className="space-y-2">
          <p>Não foi possível carregar as configurações.</p>
          <button className="text-primary underline" onClick={() => void refetch()}>Tentar novamente</button>
        </div>
      ) : (
        <SettingsForm initial={ready} />
      )}
    </div>
  );
};

export default SettingsPage;
