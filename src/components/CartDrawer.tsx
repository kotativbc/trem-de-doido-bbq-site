import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingCart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCart } from "@/context/CartContext";

const CartDrawer = () => {
  const { items, addItem, removeItem, totalPrice, totalItems, isCartOpen, setIsCartOpen, clearCart } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);
  const [name, setName] = useState("");
  const [deliveryType, setDeliveryType] = useState<"entrega" | "retirada">("retirada");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("pix");
  const [needChange, setNeedChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState("");
  const [notes, setNotes] = useState("");

  const isValid = name.trim() !== "" && (deliveryType === "retirada" || address.trim() !== "");

  const handleClose = () => {
    setIsCartOpen(false);
    setShowCheckout(false);
  };

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
    handleClose();
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setAddress(`Lat: ${pos.coords.latitude.toFixed(6)}, Lng: ${pos.coords.longitude.toFixed(6)}`),
      () => alert("Não foi possível obter sua localização.")
    );
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[45]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-card border-l border-border z-[45] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-['Bebas_Neue'] text-xl text-foreground flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" /> {showCheckout ? "FINALIZAR PEDIDO" : "SACOLA"}
              </h3>
              <button onClick={handleClose}>
                <X className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
              {!showCheckout ? (
                <>
                  {items.length === 0 ? (
                    <p className="text-muted-foreground text-center mt-8">Sua sacola está vazia</p>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-muted rounded-lg p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground text-sm font-medium truncate">{item.name}</p>
                          <p className="text-primary text-sm font-bold">R$ {(item.price * item.qty).toFixed(2).replace(".", ",")}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <Button size="icon" variant="outline" className="h-7 w-7 border-border text-foreground" onClick={() => removeItem(item.id)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-foreground font-bold w-5 text-center text-sm">{item.qty}</span>
                          <Button size="icon" className="h-7 w-7 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => addItem({ id: item.id, name: item.name, price: item.price, category: item.category })}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              ) : (
                <div className="space-y-5">
                  {/* Order summary */}
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.name} x{item.qty}</span>
                        <span className="text-foreground">R$ {(item.price * item.qty).toFixed(2).replace(".", ",")}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-foreground border-t border-border pt-2">
                      <span>Total</span>
                      <span className="text-primary">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
                    </div>
                  </div>

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
                </div>
              )}
            </div>

            {totalItems > 0 && (
              <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card p-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
                {!showCheckout ? (
                  <>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-foreground font-bold">Total</span>
                      <span className="text-primary font-bold text-xl">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
                    </div>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold" onClick={() => setShowCheckout(true)}>
                      Finalizar Pedido
                    </Button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Button
                      disabled={!isValid}
                      onClick={handleSubmit}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg py-6 disabled:opacity-40"
                    >
                      Enviar Pedido pelo WhatsApp
                    </Button>
                    <Button variant="outline" className="w-full border-border text-muted-foreground" onClick={() => setShowCheckout(false)}>
                      Voltar à Sacola
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
