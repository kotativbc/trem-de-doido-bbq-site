import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { normalizeCouponCode, type Coupon } from "@/domain/coupons";
import { uniqueId } from "@/domain/ids";
import { formatBRL, formatDecimalBRL, parseBRLToCents } from "@/domain/money";
import { couponSchema } from "@/domain/schemas";
import { couponsQueryKey, useCoupons } from "@/hooks/useCoupons";
import { repositories } from "@/services";
import { useAdminRun } from "../useAdminRun";

const selectClasses =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none";

const describe = (c: Coupon): string => (c.type === "percent" ? `${c.value}% de desconto` : `${formatBRL(c.value)} de desconto`);

const CouponForm = ({ coupon, existing, onSave, onClose }: { coupon?: Coupon; existing: Coupon[]; onSave: (c: Coupon) => Promise<boolean>; onClose: () => void }) => {
  const [code, setCode] = useState(coupon?.code ?? "");
  const [type, setType] = useState<Coupon["type"]>(coupon?.type ?? "percent");
  const [value, setValue] = useState(coupon ? (coupon.type === "percent" ? String(coupon.value) : formatDecimalBRL(coupon.value)) : "");
  const [minOrder, setMinOrder] = useState(coupon?.minOrderCents ? formatDecimalBRL(coupon.minOrderCents) : "");
  const [startsAt, setStartsAt] = useState(coupon?.startsAt ?? "");
  const [expiresAt, setExpiresAt] = useState(coupon?.expiresAt ?? "");
  const [maxUses, setMaxUses] = useState(coupon?.maxUses ? String(coupon.maxUses) : "");
  const [active, setActive] = useState(coupon?.active ?? true);
  const [description, setDescription] = useState(coupon?.description ?? "");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const numericValue = type === "percent" ? (/^\d+$/.test(value.trim()) ? Number(value) : null) : parseBRLToCents(value);
    if (numericValue === null) {
      setError(type === "percent" ? "Informe o percentual como número inteiro, por exemplo 10." : "Informe o valor em reais, por exemplo 5,00.");
      return;
    }
    const minCents = minOrder.trim() === "" ? 0 : parseBRLToCents(minOrder);
    if (minCents === null) {
      setError("Pedido mínimo inválido. Exemplo: 50,00.");
      return;
    }
    const uses = maxUses.trim() === "" ? undefined : /^\d+$/.test(maxUses.trim()) ? Number(maxUses) : null;
    if (uses === null) {
      setError("O limite de usos precisa ser um número inteiro.");
      return;
    }

    const candidate: Coupon = {
      id: coupon?.id ?? uniqueId(code, existing.map((c) => c.id)),
      code: normalizeCouponCode(code),
      type,
      value: numericValue,
      active,
      ...(startsAt ? { startsAt } : {}),
      ...(expiresAt ? { expiresAt } : {}),
      ...(uses !== undefined ? { maxUses: uses } : {}),
      usedCount: coupon?.usedCount ?? 0,
      minOrderCents: minCents,
      description: description.trim(),
    };
    const parsed = couponSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message === "Required" ? "Preencha os campos obrigatórios." : parsed.error.issues[0].message);
      return;
    }
    if (await onSave(parsed.data)) onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-['Bebas_Neue'] text-2xl tracking-wide">{coupon ? "Editar cupom" : "Novo cupom"}</DialogTitle>
          <DialogDescription>O desconto vale sobre os itens; a taxa de entrega não entra na conta.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cp-code">Código *</Label>
            <Input id="cp-code" value={code} onChange={(e) => setCode(normalizeCouponCode(e.target.value))} maxLength={30} placeholder="BEMVINDO10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-type">Tipo *</Label>
            <select id="cp-type" className={selectClasses} value={type} onChange={(e) => setType(e.target.value as Coupon["type"])}>
              <option value="percent">Percentual (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-value">{type === "percent" ? "Percentual *" : "Valor (R$) *"}</Label>
            <Input id="cp-value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "percent" ? "10" : "5,00"} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-min">Pedido mínimo (R$)</Label>
            <Input id="cp-min" inputMode="decimal" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="sem mínimo" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-start">Válido a partir de</Label>
            <Input id="cp-start" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-end">Válido até (inclusive)</Label>
            <Input id="cp-end" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-uses">Limite de usos</Label>
            <Input id="cp-uses" inputMode="numeric" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="ilimitado" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-desc">Descrição (só para você)</Label>
            <Input id="cp-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={120} />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Switch checked={active} onCheckedChange={setActive} aria-label="Cupom ativo" /> Ativo
          </label>
          <p className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 text-xs text-amber-300 sm:col-span-2">
            Limite de usos e validade são conferidos no navegador do cliente. Sem um servidor, um cliente determinado
            consegue contornar. Confira os pedidos antes de aceitar descontos grandes.
          </p>
          {error && <p role="alert" className="text-sm text-red-400 sm:col-span-2">{error}</p>}
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Salvar cupom</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CouponsPage = () => {
  const { data: coupons, isLoading, isError, refetch } = useCoupons();
  const run = useAdminRun();
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);

  const save = (c: Coupon) => run(() => repositories.coupons.upsert(c), { success: "Cupom salvo.", invalidate: [couponsQueryKey] });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-['Bebas_Neue'] text-4xl">CUPONS</h1>
        <Button onClick={() => setEditing("new")} disabled={!coupons} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Novo cupom
        </Button>
      </div>

      {isLoading ? (
        <div role="status" aria-label="Carregando cupons"><Skeleton className="h-16 w-full" /></div>
      ) : isError || !coupons ? (
        <div role="alert" className="space-y-2">
          <p>Não foi possível carregar os cupons.</p>
          <button className="text-primary underline" onClick={() => void refetch()}>Tentar novamente</button>
        </div>
      ) : coupons.length === 0 ? (
        <p className="text-muted-foreground">Nenhum cupom criado. Crie um para oferecer desconto no checkout.</p>
      ) : (
        <ul className="space-y-2">
          {coupons.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-[#111111] p-3">
              <div className="min-w-[10rem] flex-1">
                <p className="font-semibold tracking-wide">{c.code}</p>
                <p className="text-xs text-muted-foreground">
                  {describe(c)}
                  {c.minOrderCents > 0 ? ` · mínimo ${formatBRL(c.minOrderCents)}` : ""}
                  {c.expiresAt ? ` · até ${c.expiresAt.split("-").reverse().join("/")}` : ""}
                  {` · usado ${c.usedCount}${c.maxUses ? ` de ${c.maxUses}` : ""}`}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={c.active} aria-label={`${c.code}: ativo`} onCheckedChange={(v) => void save({ ...c, active: v })} /> Ativo
              </label>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" aria-label={`Editar ${c.code}`} onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" aria-label={`Excluir ${c.code}`} onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && coupons && <CouponForm coupon={editing === "new" ? undefined : editing} existing={coupons} onSave={save} onClose={() => setEditing(null)} />}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cupom {deleting?.code}?</AlertDialogTitle>
            <AlertDialogDescription>Pedidos que já usaram o cupom continuam como estão. Para só pausar, desative o cupom.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) void run(() => repositories.coupons.delete(deleting.id), { success: "Cupom excluído.", invalidate: [couponsQueryKey] });
                setDeleting(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CouponsPage;
