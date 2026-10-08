import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Flame, MapPin, MessageCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { mapsDirectionsUrl } from "@/config/business";
import { formatBRL } from "@/domain/money";
import { statusLabel, type Order } from "@/domain/orders";
import { paymentLabel } from "@/domain/checkout";
import { buildWhatsAppUrl } from "@/domain/whatsapp";
import { useCart } from "@/hooks/useCart";
import { useOrder } from "@/hooks/useOrders";
import { useSettings } from "@/hooks/useSettings";

interface LocationState {
  order?: Order;
  opened?: boolean;
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex justify-between gap-4 text-sm">
    <dt className="text-[#888]">{label}</dt>
    <dd className="text-[#E5E5E5] text-right">{children}</dd>
  </div>
);

const OrderConfirmation = () => {
  const { id } = useParams();
  const state = (useLocation().state ?? {}) as LocationState;
  const navigate = useNavigate();
  const settings = useSettings();
  const { reorder, setIsCartOpen } = useCart();
  const query = useOrder(id);

  // O pedido guardado neste aparelho vale mais; o que veio na navegação cobre falha ao gravar.
  const order = query.data ?? (state.order?.id === id ? state.order : undefined);

  if (query.isLoading && !order) {
    return (
      <main className="min-h-screen bg-background px-4 py-16">
        <div className="mx-auto max-w-xl space-y-4" role="status" aria-label="Carregando pedido">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-4">
          <Flame className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
          <h1 className="font-['Bebas_Neue'] text-4xl text-foreground">Pedido não encontrado</h1>
          <p className="text-muted-foreground">
            Não achamos este pedido neste aparelho. Se você já enviou a mensagem pelo WhatsApp, o restaurante tem os
            detalhes por lá.
          </p>
          <Link to="/" className="text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
            Voltar ao cardápio
          </Link>
        </div>
      </main>
    );
  }

  const isPickup = order.fulfillment === "retirada";
  const resendUrl = order.whatsappMessage ? buildWhatsAppUrl(settings.whatsappNumber, order.whatsappMessage) : null;

  const orderAgain = () => {
    const { added, skipped } = reorder(
      order.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, addonOptionIds: l.addonOptionIds, note: l.note })),
    );
    if (added === 0) {
      toast.error("Nenhum item deste pedido está disponível agora.");
      return;
    }
    if (skipped > 0) toast.info(`${skipped} ${skipped === 1 ? "item não está" : "itens não estão"} mais disponível no cardápio.`);
    navigate("/");
    setIsCartOpen(true);
  };

  const status = order.status === "recebido" ? "Aguardando a confirmação do restaurante pelo WhatsApp" : statusLabel[order.status];

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar ao cardápio
        </Link>

        <header className="space-y-2">
          <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-foreground">
            {state.opened === false ? "Pedido preparado" : "Falta só enviar a mensagem"}
          </h1>
          <p className="text-muted-foreground">
            Abrimos o WhatsApp com os dados do seu pedido. <strong className="text-foreground">O restaurante só recebe o
            pedido quando você envia a mensagem por lá</strong>, e ele só está confirmado depois que {settings.name} responder.
          </p>
        </header>

        {resendUrl && (
          <Button asChild className="w-full bg-[#9A3412] hover:bg-[#7C2D12] text-[#E5E5E5] font-bold py-6 gap-2 focus-visible:ring-2 focus-visible:ring-primary">
            <a href={resendUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Abrir o WhatsApp de novo
            </a>
          </Button>
        )}

        <section aria-labelledby="order-summary" className="rounded-xl border border-border bg-[#111111] p-5 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="order-summary" className="font-['Bebas_Neue'] text-2xl text-foreground tracking-wide">Pedido {order.id}</h2>
            <span className="text-xs text-[#888]">{new Date(order.createdAt).toLocaleString("pt-BR", { timeZone: settings.timezone })}</span>
          </div>

          <p className="text-sm text-primary" role="status">{status}</p>

          <ul className="space-y-2 border-y border-[#2A2A2A] py-3">
            {order.lines.map((l, i) => (
              <li key={`${l.productId}-${i}`} className="text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-[#E5E5E5]">{l.name} x{l.quantity}</span>
                  <span className="text-[#E5E5E5]">{formatBRL(l.totalCents)}</span>
                </div>
                {l.addonNames.length > 0 && <p className="text-xs text-[#888]">+ {l.addonNames.join(", ")}</p>}
                {l.note && <p className="text-xs text-[#888]">Obs: {l.note}</p>}
              </li>
            ))}
          </ul>

          <dl className="space-y-1.5">
            {(order.discountCents > 0 || order.deliveryFeeCents > 0) && <Row label="Subtotal">{formatBRL(order.subtotalCents)}</Row>}
            {order.discountCents > 0 && (
              <Row label={`Desconto${order.couponCode ? ` (${order.couponCode})` : ""}`}>- {formatBRL(order.discountCents)}</Row>
            )}
            {order.deliveryFeeCents > 0 && <Row label="Taxa de entrega">{formatBRL(order.deliveryFeeCents)}</Row>}
            <Row label="Total"><strong>{formatBRL(order.totalCents)}</strong></Row>
            <Row label="Pagamento">
              {paymentLabel[order.payment]}
              {order.changeForCents ? ` (troco para ${formatBRL(order.changeForCents)})` : ""}
            </Row>
            <Row label={isPickup ? "Retirada" : "Entrega"}>
              {isPickup
                ? settings.addressFull
                : [order.address.street, order.address.complement, order.address.neighborhood].filter(Boolean).join(", ")}
            </Row>
            <Row label="Previsão">{order.estimate}</Row>
          </dl>
          <p className="text-xs text-[#888]">
            O pagamento é combinado na {isPickup ? "retirada" : "entrega"}; este site não cobra nada.
          </p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={orderAgain}
            className="border-[#2A2A2A] bg-[#1C1C1C] text-[#E5E5E5] hover:bg-[#2A2A2A] gap-2 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Pedir novamente
          </Button>
          {isPickup && (
            <Button asChild variant="outline" className="border-[#2A2A2A] bg-[#1C1C1C] text-[#E5E5E5] hover:bg-[#2A2A2A] gap-2 focus-visible:ring-2 focus-visible:ring-primary">
              <a href={mapsDirectionsUrl(settings.mapsQuery)} target="_blank" rel="noopener noreferrer">
                <MapPin className="h-4 w-4" aria-hidden="true" /> Como chegar
              </a>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
};

export default OrderConfirmation;
