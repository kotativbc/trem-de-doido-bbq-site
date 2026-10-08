import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { resolveProductImage } from "@/data/menuImages";
import { formatBRL } from "@/domain/money";
import type { Product } from "@/domain/types";
import { catalogQueryKey, useCatalog } from "@/hooks/useCatalog";
import { repositories } from "@/services";
import { useAdminRun } from "../useAdminRun";
import ProductFormDialog from "./ProductFormDialog";

const selectClasses =
  "rounded-md border border-border bg-[#111111] px-2 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none";

const ProductsPage = () => {
  const { data: catalog, isLoading, isError, refetch } = useCatalog();
  const run = useAdminRun();
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const categories = useMemo(() => [...(catalog?.categories ?? [])].sort((a, b) => a.order - b.order), [catalog]);
  const byCategory = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return categories
      .filter((c) => categoryFilter === "todas" || c.id === categoryFilter)
      .map((c) => ({
        category: c,
        products: (catalog?.products ?? [])
          .filter((p) => p.categoryId === c.id && (needle === "" || p.name.toLowerCase().includes(needle)))
          .sort((a, b) => a.order - b.order),
      }))
      .filter((g) => g.products.length > 0 || (categoryFilter !== "todas" && needle === ""));
  }, [catalog, categories, categoryFilter, query]);

  const save = (product: Product) =>
    run(() => repositories.catalog.upsertProduct(product), { success: "Produto salvo.", invalidate: [catalogQueryKey] });

  const move = (categoryId: string, orderedIds: string[], id: string, delta: -1 | 1) => {
    const from = orderedIds.indexOf(id);
    const to = from + delta;
    if (to < 0 || to >= orderedIds.length) return;
    const next = [...orderedIds];
    [next[from], next[to]] = [next[to], next[from]];
    void run(() => repositories.catalog.reorderProducts(categoryId, next), { invalidate: [catalogQueryKey] });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-['Bebas_Neue'] text-4xl">PRODUTOS</h1>
        <Button onClick={() => setEditing("new")} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={!catalog}>
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Novo produto
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="pf-q">Buscar</Label>
          <Input id="pf-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} className="bg-[#111111]" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pf-cat">Categoria</Label>
          <select id="pf-cat" className={selectClasses} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="todas">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2" role="status" aria-label="Carregando produtos">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError || !catalog ? (
        <div role="alert" className="space-y-2">
          <p>Não foi possível carregar o cardápio.</p>
          <button className="text-primary underline" onClick={() => void refetch()}>Tentar novamente</button>
        </div>
      ) : byCategory.length === 0 ? (
        <p className="text-muted-foreground">Nenhum produto encontrado.</p>
      ) : (
        byCategory.map(({ category, products }) => {
          const ids = products.map((p) => p.id);
          return (
            <section key={category.id} aria-labelledby={`cat-${category.id}`} className="space-y-2">
              <h2 id={`cat-${category.id}`} className="font-['Bebas_Neue'] text-2xl text-primary">
                {category.label} {!category.active && <span className="text-sm text-muted-foreground">(categoria oculta)</span>}
              </h2>
              {products.length === 0 && <p className="text-sm text-muted-foreground">Nenhum produto nesta categoria.</p>}
              <ul className="space-y-2">
                {products.map((p, i) => {
                  const image = resolveProductImage(p);
                  return (
                    <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-[#111111] p-3">
                      {image ? (
                        <img src={image} alt="" className="h-14 w-20 rounded-md object-cover" width={80} height={56} loading="lazy" />
                      ) : (
                        <div className="h-14 w-20 rounded-md bg-muted" aria-hidden="true" />
                      )}
                      <div className="min-w-[10rem] flex-1">
                        <p className="font-semibold">
                          {p.name}{" "}
                          {p.sundayOnly && <Badge variant="outline" className="border-sunday text-sunday text-xs">Domingo</Badge>}{" "}
                          {p.featured && <Badge variant="outline" className="border-primary text-primary text-xs">Destaque</Badge>}{" "}
                          {p.badge && <Badge className="bg-green-600 text-xs">{p.badge}</Badge>}
                        </p>
                        <p className="text-sm text-primary">{formatBRL(p.priceCents)}</p>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <Switch checked={p.active} aria-label={`${p.name}: ativo`} onCheckedChange={(v) => void save({ ...p, active: v })} />
                        Ativo
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Switch checked={p.soldOut} aria-label={`${p.name}: esgotado`} onCheckedChange={(v) => void save({ ...p, soldOut: v })} />
                        Esgotado
                      </label>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Subir ${p.name}`} disabled={i === 0} onClick={() => move(category.id, ids, p.id, -1)}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={`Descer ${p.name}`} disabled={i === products.length - 1} onClick={() => move(category.id, ids, p.id, 1)}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" aria-label={`Editar ${p.name}`} onClick={() => setEditing(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" aria-label={`Excluir ${p.name}`} onClick={() => setDeleting(p)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}

      {editing && catalog && (
        <ProductFormDialog
          product={editing === "new" ? undefined : editing}
          catalog={catalog}
          defaultCategoryId={categoryFilter === "todas" ? undefined : categoryFilter}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O produto some do site e das sacolas salvas dos clientes. Pedidos antigos não mudam. Para só esconder, use "Ativo".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) void run(() => repositories.catalog.deleteProduct(deleting.id), { success: "Produto excluído.", invalidate: [catalogQueryKey] });
                setDeleting(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductsPage;
