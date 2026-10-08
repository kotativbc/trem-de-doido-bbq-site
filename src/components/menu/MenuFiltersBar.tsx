import { Heart, Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { hasActiveFilters, PRICE_BANDS, type MenuFilters } from "@/domain/search";

interface MenuFiltersBarProps {
  filters: MenuFilters;
  onChange: (next: MenuFilters) => void;
  onClear: () => void;
  resultCount: number | null;
}

/** Busca por nome/descrição, faixa de preço, "só disponíveis" e "só favoritos". */
const MenuFiltersBar = ({ filters, onChange, onClear, resultCount }: MenuFiltersBarProps) => {
  const active = hasActiveFilters(filters);

  return (
    <div className="mb-6 space-y-3" role="search" aria-label="Buscar no cardápio">
      <div className="relative max-w-xl mx-auto">
        <Label htmlFor="menu-search" className="sr-only">Buscar no cardápio</Label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id="menu-search"
          type="search"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Buscar hambúrguer, espetinho, bebida…"
          autoComplete="off"
          className="bg-[#111111] border-border/50 pl-9 pr-9 rounded-full"
        />
        {filters.query && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, query: "" })}
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filtros
        </span>

        <div className="flex items-center gap-2">
          <Label htmlFor="menu-price" className="text-muted-foreground">Preço</Label>
          <select
            id="menu-price"
            value={filters.priceBandId}
            onChange={(e) => onChange({ ...filters, priceBandId: e.target.value })}
            className="rounded-md border border-border/50 bg-[#111111] px-2 py-1.5 text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <option value="todas">Todos</option>
            {PRICE_BANDS.map((b) => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="menu-available"
            checked={filters.onlyAvailable}
            onCheckedChange={(v) => onChange({ ...filters, onlyAvailable: v })}
          />
          <Label htmlFor="menu-available" className="text-muted-foreground cursor-pointer">Só disponíveis agora</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="menu-favorites"
            checked={filters.onlyFavorites}
            onCheckedChange={(v) => onChange({ ...filters, onlyFavorites: v })}
          />
          <Label htmlFor="menu-favorites" className="inline-flex items-center gap-1 text-muted-foreground cursor-pointer">
            <Heart className="h-3.5 w-3.5" aria-hidden="true" /> Favoritos
          </Label>
        </div>

        {active && (
          <button
            type="button"
            onClick={onClear}
            className="text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {resultCount === null ? "" : `${resultCount} ${resultCount === 1 ? "item encontrado" : "itens encontrados"}`}
      </p>
    </div>
  );
};

export default MenuFiltersBar;
