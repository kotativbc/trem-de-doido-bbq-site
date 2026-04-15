import { memo, useCallback } from "react";
import { Flame, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { motion } from "framer-motion";

const StickyHeader = memo(() => {
  const { totalItems, setIsCartOpen } = useCart();

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-primary" aria-hidden="true" />
          <span className="font-['Bebas_Neue'] text-xl tracking-wider text-foreground">TREM DE DOIDO BBQ</span>
        </div>

        <nav className="hidden md:flex items-center gap-6" aria-label="Navegação principal">
          <button onClick={() => scrollTo("cardapio")} className="text-sm text-muted-foreground hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded">Cardápio</button>
          <button onClick={() => scrollTo("localizacao")} className="text-sm text-muted-foreground hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded">Localização</button>
          <button onClick={() => scrollTo("horarios")} className="text-sm text-muted-foreground hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded">Horários</button>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => scrollTo("cardapio")}
            className="hidden md:flex animate-pulse-flame bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary"
          >
            Faça seu Pedido
          </Button>
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-md"
            aria-label={`Abrir sacola${totalItems > 0 ? `, ${totalItems} itens` : ""}`}
          >
            <ShoppingCart className="h-6 w-6 text-foreground" />
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
                aria-hidden="true"
              >
                {totalItems}
              </motion.span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
});

StickyHeader.displayName = "StickyHeader";

export default StickyHeader;
