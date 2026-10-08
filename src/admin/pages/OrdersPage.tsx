import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zonedParts } from "@/domain/hours";
import { formatBRL } from "@/domain/money";
import { filterOrders, ORDER_STATUSES, statusLabel, type OrderFilters } from "@/domain/orders";
import { paymentOptions, fulfillmentOptions } from "@/domain/checkout";
import { useOrders } from "@/hooks/useOrders";
import { useSettings } from "@/hooks/useSettings";
import OrderDetailDialog from "./OrderDetailDialog";

const selectClasses =
  "w-full rounded-md border border-border bg-[#111111] px-2 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none";

const statusColor: Record<string, string> = {
  recebido: "bg-amber-500/20 text-amber-300",
  cancelado: "bg-red-500/20 text-red-300",
  concluido: "bg-green-500/20 text-green-300",
};

const OrdersPage = () => {
  const settings = useSettings();
  const { data: orders, isLoading, isError, refetch } = useOrders();
  const [filters, setFilters] = useState<OrderFilters>({ status: "todos", fulfillment: "todos", payment: "todos" });
  const [openId, setOpenId] = useState<string | null>(null);

  const dayOf = useMemo(() => (iso: string) => zonedParts(new Date(iso), settings.timezone).ymd, [settings.timezone]);
  const visible = useMemo(() => (orders ? filterOrders(orders, filters, dayOf) : []), [orders, filters, dayOf]);
  const selected = orders?.find((o) => o.id === openId) ?? null;
  const set = (patch: Partial<OrderFilters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-5">
      <h1 className="font-['Bebas_Neue'] text-4xl">PEDIDOS</h1>

      <form role="search" aria-label="Filtrar pedidos" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-1 lg:col-span-2">
          <Label htmlFor="f-query">Buscar por nome, telefone ou código</Label>
          <Input id="f-query" type="search" value={filters.query ?? ""} onChange={(e) => set({ query: e.target.value })} className="bg-[#111111]" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-status">Status</Label>
          <select id="f-status" className={selectClasses} value={filters.status} onChange={(e) => set({ status: e.target.value as OrderFilters["status"] })}>
            <option value="todos">Todos</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabel[s]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-fulfillment">Modalidade</Label>
          <select id="f-fulfillment" className={selectClasses} value={filters.fulfillment} onChange={(e) => set({ fulfillment: e.target.value as OrderFilters["fulfillment"] })}>
            <option value="todos">Todas</option>
            {fulfillmentOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-payment">Pagamento</Label>
          <select id="f-payment" className={selectClasses} value={filters.payment} onChange={(e) => set({ payment: e.target.value as OrderFilters["payment"] })}>
            <option value="todos">Todos</option>
            {paymentOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="f-from">De</Label>
            <Input id="f-from" type="date" value={filters.from ?? ""} onChange={(e) => set({ from: e.target.value || undefined })} className="bg-[#111111]" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-to">Até</Label>
            <Input id="f-to" type="date" value={filters.to ?? ""} onChange={(e) => set({ to: e.target.value || undefined })} className="bg-[#111111]" />
          </div>
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-2" role="status" aria-label="Carregando pedidos">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="space-y-2">
          <p>Não foi possível carregar os pedidos.</p>
          <button className="text-primary underline" onClick={() => void refetch()}>Tentar novamente</button>
        </div>
      ) : (orders?.length ?? 0) === 0 ? (
        <p className="text-muted-foreground">Nenhum pedido registrado neste navegador ainda.</p>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground">Nenhum pedido com esses filtros.</p>
      ) : (
        <>
          <p role="status" className="text-sm text-muted-foreground">{visible.length} {visible.length === 1 ? "pedido" : "pedidos"}</p>
          <ul className="space-y-2">
            {visible.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(o.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-border bg-[#111111] px-4 py-3 text-left hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Abrir pedido ${o.id} de ${o.customer.name}`}
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{o.id} · {o.customer.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString("pt-BR", { timeZone: settings.timezone })} · {o.customer.phone} ·{" "}
                      {o.fulfillment === "entrega" ? "Entrega" : "Retirada"}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[o.status] ?? "bg-blue-500/20 text-blue-300"}`}>
                      {statusLabel[o.status]}
                    </span>
                    <span className="font-bold">{formatBRL(o.totalCents)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {selected && <OrderDetailDialog order={selected} onClose={() => setOpenId(null)} />}
    </div>
  );
};

export default OrdersPage;
