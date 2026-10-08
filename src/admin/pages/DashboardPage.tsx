import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { summarizeOrders } from "@/domain/dashboard";
import { zonedParts } from "@/domain/hours";
import { formatBRL } from "@/domain/money";
import { statusLabel } from "@/domain/orders";
import { useOrders } from "@/hooks/useOrders";
import { useSettings } from "@/hooks/useSettings";

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-xl border border-border bg-[#111111] p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 font-['Bebas_Neue'] text-3xl text-foreground">{value}</p>
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const DashboardPage = () => {
  const settings = useSettings();
  const { data: orders, isLoading, isError, refetch } = useOrders();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Carregando resumo">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }
  if (isError || !orders) {
    return (
      <div role="alert" className="space-y-3">
        <p>Não foi possível carregar os pedidos.</p>
        <button onClick={() => void refetch()} className="text-primary underline">Tentar novamente</button>
      </div>
    );
  }

  const dayOf = (iso: string) => zonedParts(new Date(iso), settings.timezone).ymd;
  const today = zonedParts(new Date(), settings.timezone).ymd;
  const summary = summarizeOrders(orders, today, dayOf);
  const recent = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="font-['Bebas_Neue'] text-4xl">RESUMO</h1>

      <p className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 text-sm text-amber-300">
        Modo demonstração: os pedidos aparecem aqui apenas quando feitos neste mesmo navegador. O restaurante recebe os
        pedidos pelo WhatsApp. Para ver pedidos de outros aparelhos é preciso conectar um servidor.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pedidos hoje" value={String(summary.todayCount)} />
        <Stat label="Faturamento hoje" value={formatBRL(summary.todayRevenueCents)} hint="sem cancelados" />
        <Stat label="Aguardando confirmação" value={String(summary.awaitingCount)} />
        <Stat label="Em andamento" value={String(summary.inProgressCount)} hint={`ticket médio hoje ${formatBRL(summary.averageTicketCents)}`} />
      </div>

      <section aria-labelledby="recent" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="recent" className="font-['Bebas_Neue'] text-2xl">ÚLTIMOS PEDIDOS</h2>
          <Link to="/admin/pedidos" className="text-sm text-primary hover:underline">Ver todos</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-muted-foreground">Nenhum pedido registrado neste navegador ainda.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-[#111111]">
            {recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <span className="font-semibold">{o.id}</span> · {o.customer.name}
                </span>
                <span className="text-muted-foreground">{statusLabel[o.status]} · {formatBRL(o.totalCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
