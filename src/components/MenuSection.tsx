import { useState, useMemo, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { siteContent } from "@/config/siteContent";
import { getUnavailableReason, type UnavailableReason } from "@/domain/availability";
import { visibleCategories, visibleProducts } from "@/domain/catalog";
import { formatBRL } from "@/domain/money";
import type { Product } from "@/domain/types";
import { resolveProductImage } from "@/data/menuImages";
import { useCart } from "@/hooks/useCart";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettings } from "@/hooks/useSettings";

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
  onAdd: (productId: string) => void;
  onRemove: (productId: string) => void;
}

const MenuCard = memo(({ product, qty, unavailableReason, onAdd, onRemove }: MenuCardProps) => {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const image = resolveProductImage(product);
  const canAdd = !unavailableReason;

  const handleAdd = useCallback(() => onAdd(product.id), [onAdd, product.id]);
  const handleRemove = useCallback(() => onRemove(product.id), [onRemove, product.id]);

  const descriptionClasses = `text-muted-foreground text-sm mt-1 ${!expanded ? "line-clamp-2 md:line-clamp-none" : ""}`;

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
      className={`bg-[#111111] rounded-lg border ${product.sundayOnly ? "border-sunday" : "border-border/50"} flex flex-col justify-between hover:border-primary/50 transition-colors overflow-hidden`}
    >
      {image && (
        <div className="w-full h-40 overflow-hidden">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            width={400}
            height={160}
          />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-['Bebas_Neue'] text-lg text-foreground tracking-wide">{product.name}</h3>
            <div className="flex items-center gap-1 shrink-0">
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
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

MenuCard.displayName = "MenuCard";

const MenuSkeleton = () => (
  <div
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    role="status"
    aria-live="polite"
    aria-label="Carregando cardápio"
  >
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="bg-[#111111] rounded-lg border border-border/50 overflow-hidden">
        <Skeleton className="h-40 w-full rounded-none" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    ))}
  </div>
);

const MenuSection = () => {
  const { catalog, isCatalogLoading, isCatalogError, retryCatalog, quantityOf, addItem, decrementProduct } = useCart();
  const settings = useSettings();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => (catalog ? visibleCategories(catalog) : []), [catalog]);

  // Aba aberta: a escolhida; senão a padrão do site original; senão a primeira disponível.
  const activeCategory = useMemo(() => {
    if (selectedCategory && categories.some((c) => c.id === selectedCategory)) return selectedCategory;
    const preferred = categories.find((c) => c.id === siteContent.menu.defaultCategoryId);
    return (preferred ?? categories[0])?.id;
  }, [selectedCategory, categories]);

  const activeCategoryData = categories.find((c) => c.id === activeCategory);
  const products = useMemo(
    () => (catalog && activeCategory ? visibleProducts(catalog, activeCategory) : []),
    [catalog, activeCategory],
  );

  const handleAdd = useCallback((productId: string) => addItem(productId), [addItem]);

  const now = new Date();

  return (
    <section id="cardapio" className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-foreground text-center mb-8">CARDÁPIO</h2>

        {isCatalogError && !catalog ? (
          <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-foreground">Não foi possível carregar o cardápio agora.</p>
            <Button onClick={retryCatalog} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Tentar novamente
            </Button>
          </div>
        ) : isCatalogLoading || !catalog ? (
          <MenuSkeleton />
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none sticky top-16 bg-background/95 backdrop-blur-md z-30 py-3 -mx-4 px-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-[#1A1A1A] text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={activeCategory === cat.id}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {activeCategoryData?.sundayOnly && (
              <div className="flex items-center gap-2 mb-4 text-sunday">
                <Clock className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-medium">Disponível somente aos domingos</span>
              </div>
            )}

            {products.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">Nenhum item nesta categoria no momento.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <MenuCard
                    key={product.id}
                    product={product}
                    qty={quantityOf(product.id)}
                    unavailableReason={getUnavailableReason(product, { settings, categories: catalog.categories, now })}
                    onAdd={handleAdd}
                    onRemove={decrementProduct}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default MenuSection;
