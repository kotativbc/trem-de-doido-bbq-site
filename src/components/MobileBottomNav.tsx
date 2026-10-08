import { memo, useCallback } from "react";
import { UtensilsCrossed, MapPin, MessageCircle, ShoppingCart } from "lucide-react";
import { whatsappChatUrl } from "@/config/business";
import { useCart } from "@/hooks/useCart";
import { useSettings } from "@/hooks/useSettings";

const itemClass =
  "flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors min-w-[48px] min-h-[48px] justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded";

const MobileBottomNav = memo(() => {
  const { totalItems, setIsCartOpen } = useCart();
  const settings = useSettings();

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-primary"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)" }}
      aria-label="Navegação mobile"
    >
      <div className="flex items-center justify-around h-[60px]">
        <button onClick={() => scrollTo("cardapio")} className={itemClass} aria-label="Ir ao cardápio">
          <UtensilsCrossed className="h-5 w-5" />
          <span className="text-[10px]">Cardápio</span>
        </button>
        <button onClick={() => scrollTo("localizacao")} className={itemClass} aria-label="Ver localização">
          <MapPin className="h-5 w-5" />
          <span className="text-[10px]">Local</span>
        </button>
        <a
          href={whatsappChatUrl(settings.whatsappNumber)}
          target="_blank"
          rel="noopener noreferrer"
          className={itemClass}
          aria-label="Contato via WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[10px]">WhatsApp</span>
        </a>
        <button
          onClick={() => setIsCartOpen(true)}
          className={`${itemClass} relative`}
          aria-label={`Abrir sacola${totalItems > 0 ? `, ${totalItems} itens` : ""}`}
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span
              className="absolute -top-1 right-0 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold"
              aria-hidden="true"
            >
              {totalItems}
            </span>
          )}
          <span className="text-[10px]">Sacola</span>
        </button>
      </div>
    </nav>
  );
});

MobileBottomNav.displayName = "MobileBottomNav";

export default MobileBottomNav;
