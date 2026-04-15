import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingCart, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/context/CartContext";

const CartDrawer = () => {
  const { items, addItem, removeItem, totalPrice, totalItems, isCartOpen, setIsCartOpen, clearCart } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);
  const [name, setName] = useState("");
  const [isPickup, setIsPickup] = useState(true);
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("pix");
  const [changeAmount, setChangeAmount] = useState("");
  const [notes, setNotes] = useState("");

  const isValid = 
    items.length > 0 &&
    name.trim() !== "" && 
    (isPickup || address.trim() !== "") &&
    (payment !== "dinheiro" || changeAmount.trim() !== "");

  const handleClose = () => {
    setIsCartOpen(false);
    setShowCheckout(false);
  };

  const handleSubmit = () => {
    const itemsText = items.map((i) => `${i.name} x${i.qty} — R$ ${(i.price * i.qty).toFixed(2).replace(".", ",")}`).join("\n");
    const changeText = payment === "dinheiro" && changeAmount ? `\n💵 *Troco para:* R$ ${changeAmount}` : "";
    const message = `🔥 NOVO PEDIDO — TREM DE DOIDO BBQ 🔥
━━━━━━━━━━━━━━━━━━━━━━
👤 *Cliente:* ${name}
🏠 *Entrega/Retirada:* ${isPickup ? "Retirada no Balcão" : "Entrega"}
📍 *Endereço:* ${isPickup ? "Retirada no local" : address}
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

  const inputClasses = "bg-[#1C1C1C] border-[#2A2A2A] text-[#E5E5E5] placeholder:text-[#666] rounded-lg focus-visible:ring-primary";
  const labelClasses = "text-[#E5E5E5] text-xs font-semibold uppercase tracking-wide";

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[45]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#0A0A0A] border-l border-[#1A1A1A] z-[45] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A]">
              <h3 className="font-['Bebas_Neue'] text-2xl text-[#E5E5E5] tracking-wider">
                {showCheckout ? "FINALIZAR PEDIDO" : "SACOLA"}
              </h3>
              <button onClick={handleClose} className="text-[#666] hover:text-[#E5E5E5] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ paddingBottom: "160px" }}>
              {!showCheckout ? (
                <>
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-16 gap-3">
                      <ShoppingCart className="h-12 w-12 text-[#333]" />
                      <p className="text-[#666] text-sm">Sua sacola está vazia</p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[#E5E5E5] text-sm font-medium truncate">{item.name}</p>
                          <p className="text-primary text-sm font-bold">R$ {(item.price * item.qty).toFixed(2).replace(".", ",")}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <Button size="icon" variant="outline" className="h-7 w-7 border-[#2A2A2A] bg-[#0A0A0A] text-[#E5E5E5] hover:bg-[#2A2A2A]" onClick={() => removeItem(item.id)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-[#E5E5E5] font-bold w-5 text-center text-sm">{item.qty}</span>
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
                  {/* Nome */}
                  <div className="space-y-1.5">
                    <Label className={labelClasses}>Nome *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" className={inputClasses} />
                  </div>

                  {/* Retirada Toggle */}
                  <div className="flex items-center justify-between bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="text-[#E5E5E5] text-sm font-medium">Retirada no Balcão</span>
                    </div>
                    <Switch checked={isPickup} onCheckedChange={setIsPickup} />
                  </div>

                  {/* Endereço - hidden when pickup */}
                  {!isPickup && (
                    <div className="space-y-1.5">
                      <Label className={labelClasses}>Endereço de Entrega *</Label>
                      <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro" className={inputClasses} />
                    </div>
                  )}

                  {/* Pagamento */}
                  <div className="space-y-2">
                    <Label className={labelClasses}>Forma de Pagamento</Label>
                    <RadioGroup value={payment} onValueChange={(v) => { setPayment(v); if (v !== "dinheiro") setChangeAmount(""); }} className="space-y-2">
                      {[{ value: "pix", label: "Pix" }, { value: "cartao", label: "Cartão" }, { value: "dinheiro", label: "Dinheiro" }].map((p) => (
                        <label key={p.value} className="flex items-center gap-3 bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg px-4 py-3 cursor-pointer hover:border-[#333] transition-colors">
                          <RadioGroupItem value={p.value} className="border-[#444] text-primary data-[state=checked]:border-primary" />
                          <span className="text-[#E5E5E5] text-sm">{p.label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Troco */}
                  {payment === "dinheiro" && (
                    <div className="space-y-1.5">
                      <Label className={labelClasses}>Precisa de troco? Para quanto?</Label>
                      <Input value={changeAmount} onChange={(e) => setChangeAmount(e.target.value)} placeholder="Ex: 100,00" className={inputClasses} />
                    </div>
                  )}

                  {/* Observações */}
                  <div className="space-y-1.5">
                    <Label className={labelClasses}>Observações</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sem cebola, ponto da carne..." className={`${inputClasses} min-h-[80px]`} rows={3} />
                  </div>

                  {/* Resumo */}
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 space-y-2">
                    <span className="text-[#888] text-xs font-medium uppercase tracking-wide">Resumo:</span>
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-[#AAA]">{item.name} x{item.qty}</span>
                        <span className="text-[#E5E5E5]">R$ {(item.price * item.qty).toFixed(2).replace(".", ",")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            {totalItems > 0 && (
              <div className="absolute bottom-0 left-0 right-0 border-t border-[#2A2A2A] bg-[#0A0A0A] px-5 pt-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#E5E5E5] font-bold text-sm">Total do Pedido</span>
                  <span className="text-primary font-bold text-xl">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
                </div>
                {!showCheckout ? (
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-5" onClick={() => setShowCheckout(true)}>
                    Finalizar Pedido
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      disabled={!isValid}
                      onClick={handleSubmit}
                      className="w-full bg-[#9A3412] hover:bg-[#7C2D12] text-[#E5E5E5] font-bold text-base py-6 disabled:opacity-40 gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Enviar Pedido via WhatsApp
                    </Button>
                    <Button variant="ghost" className="w-full text-[#888] hover:text-[#E5E5E5] text-sm" onClick={() => setShowCheckout(false)}>
                      ← Voltar à Sacola
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
