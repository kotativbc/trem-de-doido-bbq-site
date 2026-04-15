import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

const MobileCartBar = () => {
  const { totalItems, totalPrice, setIsCartOpen } = useCart();

  if (totalItems === 0) return null;

  return (
    <div
      className="fixed left-0 right-0 z-[42] md:hidden px-4"
      style={{ bottom: "calc(60px + env(safe-area-inset-bottom, 0px) + 8px)" }}
    >
      <Button
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 flex items-center justify-between px-4 rounded-xl shadow-lg"
        onClick={() => setIsCartOpen(true)}
      >
        <span className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-bold">{totalItems} {totalItems === 1 ? "item" : "itens"}</span>
        </span>
        <span className="font-bold">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
      </Button>
    </div>
  );
};

export default MobileCartBar;
