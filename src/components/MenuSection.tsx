import { useState, useMemo, useCallback } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { siteContent } from "@/config/siteContent";
import { hasAddonChoices } from "@/domain/addons";
import { getUnavailableReason } from "@/domain/availability";
import { visibleCategories, visibleProducts } from "@/domain/catalog";
import { emptyMenuFilters, hasActiveFilters, searchProducts, type MenuFilters } from "@/domain/search";
import type { Product } from "@/domain/types";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useSettings } from "@/hooks/useSettings";
import MenuCard from "./menu/MenuCard";
import MenuFiltersBar from "./menu/MenuFiltersBar";
import ProductOptionsDialog from "./menu/ProductOptionsDialog";
import PromoBanner from "./PromoBanner";

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

const gridClasses = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";

const MenuSection = () => {
  const { catalog, isCatalogLoading, isCatalogError, retryCatalog, quantityOf, addItem, decrementProduct } = useCart();
  const settings = useSettings();
  const { favoriteIds, isFavorite, toggle: toggleFavorite } = useFavorites();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<MenuFilters>(emptyMenuFilters);
  const [optionsFor, setOptionsFor] = useState<Product | null>(null);

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

  const now = new Date();
  const filtering = hasActiveFilters(filters);
  const results = useMemo(
    () => (catalog && filtering ? searchProducts(catalog, filters, { settings, now: new Date(), favoriteIds }) : null),
    [catalog, filtering, filters, settings, favoriteIds],
  );
  const featured = useMemo(
    () => (catalog ? visibleCategories(catalog).flatMap((c) => visibleProducts(catalog, c.id)).filter((p) => p.featured) : []),
    [catalog],
  );

  const handleAdd = useCallback(
    (productId: string) => {
      const product = catalog?.products.find((p) => p.id === productId);
      if (product && hasAddonChoices(product)) setOptionsFor(product);
      else addItem(productId);
    },
    [catalog, addItem],
  );

  const renderCard = (product: Product) =>
    catalog ? (
      <MenuCard
        key={product.id}
        product={product}
        qty={quantityOf(product.id)}
        unavailableReason={getUnavailableReason(product, { settings, categories: catalog.categories, now })}
        isFavorite={isFavorite(product.id)}
        hasChoices={hasAddonChoices(product)}
        onAdd={handleAdd}
        onRemove={decrementProduct}
        onToggleFavorite={toggleFavorite}
      />
    ) : null;

  return (
    <section id="cardapio" className="py-16">
      <div className="container mx-auto px-4">
        <PromoBanner />
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
            <MenuFiltersBar
              filters={filters}
              onChange={setFilters}
              onClear={() => setFilters(emptyMenuFilters)}
              resultCount={results ? results.length : null}
            />

            {results ? (
              results.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <p className="text-muted-foreground">Nenhum item encontrado com esses filtros.</p>
                  <Button variant="outline" onClick={() => setFilters(emptyMenuFilters)}>
                    Limpar filtros
                  </Button>
                </div>
              ) : (
                <div className={gridClasses}>{results.map(renderCard)}</div>
              )
            ) : (
              <>
                {featured.length > 0 && (
                  <div className="mb-10">
                    <h3 className="font-['Bebas_Neue'] text-2xl text-primary tracking-wide mb-4">DESTAQUES</h3>
                    <div className={gridClasses}>{featured.map(renderCard)}</div>
                  </div>
                )}

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
                  <div className={gridClasses}>{products.map(renderCard)}</div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {optionsFor && (
        <ProductOptionsDialog
          product={optionsFor}
          onClose={() => setOptionsFor(null)}
          onConfirm={({ addonOptionIds, note, quantity }) => {
            addItem(optionsFor.id, { addonOptionIds, note, quantity });
            setOptionsFor(null);
          }}
        />
      )}
    </section>
  );
};

export default MenuSection;
