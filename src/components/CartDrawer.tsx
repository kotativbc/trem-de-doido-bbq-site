import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

const CartDrawer = () => {
  const { items, addItem, removeItem, totalPrice, totalItems, isCartOpen, setIsCartOpen, setIsCheckoutOpen } = useCart();

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    setTimeout(() => {
      document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
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
            onClick={() => setIsCartOpen(false)}
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
                <ShoppingCart className="h-5 w-5 text-primary" /> SACOLA
              </h3>
              <button onClick={() => setIsCartOpen(false)}>
                <X className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
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
            </div>

            {totalItems > 0 && (
              <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card p-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-foreground font-bold">Total</span>
                  <span className="text-primary font-bold text-xl">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
                </div>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold" onClick={handleCheckout}>
                  Finalizar Pedido
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
