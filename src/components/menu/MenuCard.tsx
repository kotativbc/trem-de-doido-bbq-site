import { memo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UnavailableReason } from "@/domain/availability";
import { formatBRL } from "@/domain/money";
import type { Product } from "@/domain/types";
import { resolveProductImage } from "@/data/menuImages";
import { useIsMobile } from "@/hooks/use-mobile";

const unavailableLabel: Record<UnavailableReason, string> = {
  removed: "Indisponível",
  inactive: "Indisponível",
  soldOut: "Esgotado",
  sundayOnly: "Somente aos domingos",
};

interface MenuCardProps {
  product: Product;
  qty: number;
  unavailableReason?: UnavailableReason;
  isFavorite: boolean;
  /** Produto com adicionais: o "adicionar" abre a tela de opções em vez de ir direto para a sacola. */
  hasChoices: boolean;
  onAdd: (productId: string) => void;
  onRemove: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
}

const MenuCard = memo(
  ({ product, qty, unavailableReason, isFavorite, hasChoices, onAdd, onRemove, onToggleFavorite }: MenuCardProps) => {
    const isMobile = useIsMobile();
    const [expanded, setExpanded] = useState(false);
    const image = resolveProductImage(product);
    const canAdd = !unavailableReason;

    const handleAdd = useCallback(() => onAdd(product.id), [onAdd, product.id]);
    const handleRemove = useCallback(() => onRemove(product.id), [onRemove, product.id]);
    const handleFavorite = useCallback(() => onToggleFavorite(product.id), [onToggleFavorite, product.id]);

    const descriptionClasses = `text-muted-foreground text-sm mt-1 ${!expanded ? "line-clamp-2 md:line-clamp-none" : ""}`;

    return (
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
        className={`bg-[#111111] rounded-lg border ${product.sundayOnly ? "border-sunday" : "border-border/50"} flex flex-col justify-between hover:border-primary/50 transition-colors overflow-hidden`}
      >
        {image && (
          <div className="relative w-full h-40 overflow-hidden">
            <img
              src={image}
              alt={product.name}
              className={`w-full h-full object-cover ${unavailableReason === "soldOut" ? "opacity-60" : ""}`}
              loading="lazy"
              width={400}
              height={160}
            />
            <button
              type="button"
              onClick={handleFavorite}
              aria-pressed={isFavorite}
              aria-label={`${isFavorite ? "Remover dos favoritos" : "Favoritar"}: ${product.name}`}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-2 text-foreground hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`} aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="p-4 flex flex-col flex-1">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-['Bebas_Neue'] text-lg text-foreground tracking-wide">{product.name}</h3>
              <div className="flex items-center gap-1 shrink-0">
                {!image && (
                  <button
                    type="button"
                    onClick={handleFavorite}
                    aria-pressed={isFavorite}
                    aria-label={`${isFavorite ? "Remover dos favoritos" : "Favoritar"}: ${product.name}`}
                    className="rounded-full p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`} aria-hidden="true" />
                  </button>
                )}
                {product.featured && <Badge variant="outline" className="border-primary text-primary text-xs">Destaque</Badge>}
                {product.sundayOnly && <Badge variant="outline" className="border-sunday text-sunday text-xs">Especial</Badge>}
                {product.badge && <Badge className="bg-green-600 text-primary-foreground text-xs">{product.badge}</Badge>}
                {product.soldOut && <Badge variant="destructive" className="text-xs">Esgotado</Badge>}
              </div>
            </div>
            {product.description &&
              (isMobile ? (
                // No celular a descrição é recolhida; vira botão para funcionar por teclado e leitor de tela.
                <button
                  type="button"
                  className="block w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  aria-expanded={expanded}
                  aria-label={`${expanded ? "Recolher" : "Expandir"} descrição de ${product.name}`}
                  onClick={() => setExpanded(!expanded)}
                >
                  <span className={`${expanded ? "block " : ""}${descriptionClasses}`}>{product.description}</span>
                </button>
              ) : (
                <p className={descriptionClasses}>{product.description}</p>
              ))}
          </div>

          <div className="flex items-center justify-between mt-3">
            <Badge className="bg-primary text-primary-foreground font-bold text-sm px-3">{formatBRL(product.priceCents)}</Badge>
            {qty > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-border text-foreground focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={handleRemove}
                  aria-label={`Remover ${product.name}`}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-foreground font-bold w-6 text-center">{qty}</span>
                <Button
                  size="icon"
                  className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={handleAdd}
                  disabled={!canAdd}
                  aria-label={`Adicionar mais ${product.name}`}
                  aria-haspopup={hasChoices ? "dialog" : undefined}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {qty === 0 && (
            <motion.div whileTap={{ scale: 1.05 }} className="mt-3">
              {unavailableReason ? (
                <Button
                  variant="outline"
                  disabled
                  className="w-full border-border/50 bg-[#1A1A1A] text-muted-foreground font-medium"
                >
                  {unavailableLabel[unavailableReason]}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-border/50 bg-[#1A1A1A] text-primary hover:bg-primary hover:text-primary-foreground font-medium focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={handleAdd}
                  aria-label={`Adicionar ${product.name} ao carrinho`}
                  aria-haspopup={hasChoices ? "dialog" : undefined}
                >
                  <Plus className="h-4 w-4 mr-1" /> {hasChoices ? "Escolher opções" : "Adicionar"}
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  },
);

MenuCard.displayName = "MenuCard";

export default MenuCard;
