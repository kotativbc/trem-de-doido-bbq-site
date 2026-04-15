import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/useCart";
import { MapPin } from "lucide-react";

const CheckoutSection = () => {
  const { items, totalPrice, isCheckoutOpen, clearCart } = useCart();
  const [name, setName] = useState("");
  const [deliveryType, setDeliveryType] = useState<"entrega" | "retirada">("retirada");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("pix");
  const [needChange, setNeedChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState("");
  const [notes, setNotes] = useState("");

  if (!isCheckoutOpen || items.length === 0) return null;

  const isValid = name.trim() !== "" && (deliveryType === "retirada" || address.trim() !== "");

  const handleSubmit = () => {
    const itemsText = items.map((i) => `${i.name} x${i.qty} — R$ ${(i.price * i.qty).toFixed(2).replace(".", ",")}`).join("\n");
    const changeText = payment === "dinheiro" && needChange ? `\n💵 *Troco para:* R$ ${changeAmount}` : "";
    const message = `🔥 NOVO PEDIDO — TREM DE DOIDO BBQ 🔥
━━━━━━━━━━━━━━━━━━━━━━
👤 *Cliente:* ${name}
🏠 *Entrega/Retirada:* ${deliveryType === "entrega" ? "Entrega" : "Retirada no Balcão"}
📍 *Endereço:* ${deliveryType === "entrega" ? address : "Retirada no local"}
━━━━━━━━━━━━━━━━━━━━━━
🍖 *ITENS DO PEDIDO:*

${itemsText}
━━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL:* R$ ${totalPrice.toFixed(2).replace(".", ",")}
💳 *PAGAMENTO:* ${payment === "pix" ? "Pix" : payment === "cartao" ? "Cartão" : "Dinheiro"}${changeText}
━━━━━━━━━━━━━━━━━━━━━━
📝 *Observações:* ${notes || "Nenhuma"}`;

    window.open(`https://wa.me/5531997036657?text=${encodeURIComponent(message)}`, "_blank");
    clearCart();
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setAddress(`Lat: ${pos.coords.latitude.toFixed(6)}, Lng: ${pos.coords.longitude.toFixed(6)}`),
      () => alert("Não foi possível obter sua localização.")
    );
  };

  return (
    <section id="checkout" className="py-16 bg-surface-dark" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 120px)" }}>
      <div className="container mx-auto px-4 max-w-lg">
        <h2 className="font-['Bebas_Neue'] text-4xl text-foreground text-center mb-8">FINALIZAR PEDIDO</h2>

        <div className="space-y-5">
          <div>
            <Label className="text-foreground">Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="bg-muted border-border text-foreground mt-1" />
          </div>

          <div>
            <Label className="text-foreground">Tipo de Entrega</Label>
            <div className="flex gap-2 mt-1">
              {(["retirada", "entrega"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDeliveryType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${deliveryType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"}`}
                >
                  {t === "retirada" ? "Retirada no Balcão" : "Entrega"}
                </button>
              ))}
            </div>
          </div>

          {deliveryType === "entrega" && (
            <div>
              <Label className="text-foreground">Endereço *</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro" className="bg-muted border-border text-foreground mt-1" />
              <button onClick={handleGeolocation} className="text-primary text-xs mt-1 flex items-center gap-1 hover:underline">
                <MapPin className="h-3 w-3" /> Usar minha localização
              </button>
            </div>
          )}

          <div>
            <Label className="text-foreground">Forma de Pagamento</Label>
            <div className="flex gap-2 mt-1">
              {[{ v: "pix", l: "Pix" }, { v: "cartao", l: "Cartão" }, { v: "dinheiro", l: "Dinheiro" }].map((p) => (
                <button
                  key={p.v}
                  onClick={() => { setPayment(p.v); if (p.v !== "dinheiro") setNeedChange(false); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${payment === p.v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"}`}
                >
                  {p.l}
                </button>
              ))}
            </div>
          </div>

          {payment === "dinheiro" && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={needChange} onChange={(e) => setNeedChange(e.target.checked)} className="accent-primary" />
                Precisa de troco?
              </label>
              {needChange && (
                <Input value={changeAmount} onChange={(e) => setChangeAmount(e.target.value)} placeholder="Troco para R$:" className="bg-muted border-border text-foreground" />
              )}
            </div>
          )}

          <div>
            <Label className="text-foreground">Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Sem cebola, ponto da carne, etc." className="bg-muted border-border text-foreground mt-1" rows={3} />
          </div>

          <Button
            disabled={!isValid}
            onClick={handleSubmit}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg py-6 disabled:opacity-40"
          >
            Enviar Pedido pelo WhatsApp
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CheckoutSection;
