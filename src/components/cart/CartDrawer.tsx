import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useDialogBehavior } from "@/hooks/useDialogBehavior";
import { useSettings } from "@/hooks/useSettings";
import CartLineRow from "./CartLineRow";
import CheckoutForm from "./CheckoutForm";
import DrawerFooter from "./DrawerFooter";

const CartDrawer = () => {
  const { priced, totalItems, isCartOpen, setIsCartOpen, clearCart, increment, decrement, removeLine } = useCart();
  const settings = useSettings();
  const [showCheckout, setShowCheckout] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setIsCartOpen(false);
    setShowCheckout(false);
  }, [setIsCartOpen]);

  useDialogBehavior(isCartOpen, dialogRef, handleClose);

  const handleSent = useCallback(() => {
    clearCart();
    handleClose();
  }, [clearCart, handleClose]);

  const hasBlockedLines = priced.lines.some((l) => l.unavailableReason);
  const canCheckout = priced.subtotalCents > 0 && !hasBlockedLines;

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[55]"
            onClick={handleClose}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#0A0A0A] border-l border-[#1A1A1A] z-[60] flex flex-col h-full max-h-screen outline-none"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-label={showCheckout ? "Finalizar Pedido" : "Sacola de compras"}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A]">
              <h3 className="font-['Bebas_Neue'] text-2xl text-[#E5E5E5] tracking-wider">
                {showCheckout ? "FINALIZAR PEDIDO" : "SACOLA"}
              </h3>
              <button
                onClick={handleClose}
                className="text-[#666] hover:text-[#E5E5E5] transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded p-1"
                aria-label="Fechar sacola"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {showCheckout && totalItems > 0 ? (
              <CheckoutForm
                priced={priced}
                settings={settings}
                onBack={() => setShowCheckout(false)}
                onAddMore={handleClose}
                onSent={handleSent}
              />
            ) : (
              <>
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-4 pb-32">
                  {priced.lines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-16 gap-3">
                      <ShoppingCart className="h-12 w-12 text-[#333]" aria-hidden="true" />
                      <p className="text-[#666] text-sm">Sua sacola está vazia</p>
                    </div>
                  ) : (
                    priced.lines.map((line) => (
                      <CartLineRow
                        key={line.lineId}
                        line={line}
                        onIncrement={increment}
                        onDecrement={decrement}
                        onRemove={removeLine}
                      />
                    ))
                  )}
                </div>

                {totalItems > 0 && (
                  <DrawerFooter totalCents={priced.totalCents}>
                    <Button
                      disabled={!canCheckout}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-5 focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => setShowCheckout(true)}
                    >
                      Finalizar Pedido
                    </Button>
                    <button onClick={handleClose} className="w-full text-primary/70 hover:text-primary text-xs py-2 mt-2 transition-colors">
                      + Adicionar mais itens
                    </button>
                  </DrawerFooter>
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
