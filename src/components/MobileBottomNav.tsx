import { UtensilsCrossed, MapPin, MessageCircle, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

const MobileBottomNav = () => {
  const { totalItems, setIsCartOpen } = useCart();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-primary" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)" }}>
      <div className="flex items-center justify-around h-[60px]">
        <button onClick={() => scrollTo("cardapio")} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
          <UtensilsCrossed className="h-5 w-5" />
          <span className="text-[10px]">Cardápio</span>
        </button>
        <button onClick={() => scrollTo("localizacao")} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
          <MapPin className="h-5 w-5" />
          <span className="text-[10px]">Local</span>
        </button>
        <a href="https://wa.me/5531997036657" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
          <MessageCircle className="h-5 w-5" />
          <span className="text-[10px]">WhatsApp</span>
        </a>
        <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 right-0 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">{totalItems}</span>
          )}
          <span className="text-[10px]">Sacola</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
